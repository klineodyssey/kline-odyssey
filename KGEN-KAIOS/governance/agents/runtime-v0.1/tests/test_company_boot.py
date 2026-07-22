from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

from company_boot.company_boot import failure_result
from company_boot.evidence import canonical_json, sha256_file, sha256_text, stamp_hashes
from company_boot.models import AUTHORIZED_ACTIONS, BootFailure, FailureCode, Stage
from company_boot.state_machine import StateTracker
from company_boot.validators import validate_registry_shape


RUNTIME_DIR = Path(__file__).resolve().parents[1]
SRC_DIR = RUNTIME_DIR / "src"
SCHEMA_PATH = RUNTIME_DIR / "KAIOS_COMPANY_BOOT_RUNTIME_V0_1_SCHEMA.json"
MAIN_SHA = "68d17fde53f1ce0b4f610ce9e8095e5d93c8cf9a"


def utc(offset_days: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=offset_days)).isoformat().replace("+00:00", "Z")


def with_state_sha(state: dict) -> dict:
    data = dict(state)
    data.pop("state_sha256", None)
    data["state_sha256"] = sha256_text(canonical_json(data))
    return data


def with_integrity(record: dict) -> dict:
    data = dict(record)
    data.pop("integrity_sha256", None)
    data["integrity_sha256"] = sha256_text(canonical_json(data))
    return data


class CompanyBootCliTests(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = Path(tempfile.mkdtemp(prefix="kaios_boot_v01_"))
        self.env = dict(os.environ)
        self.env["PYTHONPATH"] = str(SRC_DIR)
        self.base = self.make_base()
        self.write_case(self.base)

    def tearDown(self) -> None:
        shutil.rmtree(self.tmp)

    def make_base(self) -> dict:
        handoff = {
            "handoff_id": "HANDOFF-PARENT-0001",
            "from_life_id": "KAIOS-AI-LIFE-CODEX-GM-0001",
            "from_instance_id": "CODEX-GM-20260721-SESSION-0000",
            "ending_sha": MAIN_SHA,
        }
        handoff_path = self.tmp / "parent_handoff.json"
        handoff_path.write_text(json.dumps(handoff, ensure_ascii=False, indent=2), encoding="utf-8")
        handoff_sha = sha256_file(handoff_path)
        session = {
            "session_birth_id": "BIRTH-0001",
            "life_id": "KAIOS-AI-LIFE-CODEX-GM-0001",
            "instance_id": "CODEX-GM-20260722-SESSION-0001",
            "conversation_channel": "codex",
            "parent_handoff_id": "HANDOFF-PARENT-0001",
            "parent_handoff_sha256": handoff_sha,
            "assigned_workorder": "KAIOS-COMPANY-BOOT-RUNTIME-V0.1",
            "base_main_sha": MAIN_SHA,
            "expected_baseline_id": "KAIOS-AI-AGENT-LIFE-ARCHITECTURE-V1",
            "capability_grant_id": "GRANT-0001",
            "attestation_id": "ATTEST-0001",
        }
        state = with_state_sha(
            {
                "current_main_sha": MAIN_SHA,
                "current_baseline_id": "KAIOS-AI-AGENT-LIFE-ARCHITECTURE-V1",
                "baseline_status": "ARCHITECTURE_BASELINE_APPROVED",
                "current_recovery_point": "RECOVERY-20260721-KAIOS-AGENT-LIFE-ARCHITECTURE-V1",
                "active_workorders": ["KAIOS-COMPANY-BOOT-RUNTIME-V0.1"],
                "superseded_workorders": [],
                "active_sessions": [],
                "active_agent_sessions": [],
                "revoked_sessions": [],
                "last_human_decision_id": "HUMAN-COMPANY-BOOT-RUNTIME-V0.1",
                "updated_at": utc(0),
                "updated_by": "Human",
                "session_locks": [],
            }
        )
        agent = {
            "life_id": "KAIOS-AI-LIFE-CODEX-GM-0001",
            "status": "ACTIVE",
            "role": ["Company Boot Tester"],
            "attestation_ids": ["ATTEST-0001"],
            "allowed_capability_profiles": ["KAIOS_COMPANY_BOOT_RUNTIME_V0_1"],
        }
        attestation = with_integrity(
            {
                "attestation_id": "ATTEST-0001",
                "life_id": "KAIOS-AI-LIFE-CODEX-GM-0001",
                "instance_id": "CODEX-GM-20260722-SESSION-0001",
                "issued_at": utc(-1),
                "expires_at": utc(1),
                "status": "ACTIVE",
                "revocation_status": "ACTIVE",
                "approved_by": "Human",
                "approval_evidence_id": "HUMAN-COMPANY-BOOT-RUNTIME-V0.1",
                "issuer": "KAIOS-MAINLINE-CONTROLLER",
                "scope": "KAIOS_COMPANY_BOOT_RUNTIME_V0_1",
                "registry_entry_sha256": sha256_text(canonical_json(agent)),
            }
        )
        authorized_paths = ["KGEN-KAIOS/governance/agents/runtime-v0.1/"]
        workorder = with_integrity(
            {
                "workorder_id": "KAIOS-COMPANY-BOOT-RUNTIME-V0.1",
                "status": "ACTIVE",
                "authorized_paths": authorized_paths,
                "base_sha": MAIN_SHA,
            }
        )
        grant = with_integrity(
            {
                "grant_id": "GRANT-0001",
                "life_id": "KAIOS-AI-LIFE-CODEX-GM-0001",
                "instance_id": "CODEX-GM-20260722-SESSION-0001",
                "workorder_id": "KAIOS-COMPANY-BOOT-RUNTIME-V0.1",
                "capabilities": list(AUTHORIZED_ACTIONS),
                "scope_paths": authorized_paths,
                "issued_at": utc(-1),
                "expires_at": utc(1),
                "status": "ACTIVE",
                "revocation_id_if_any": None,
            }
        )
        registry = {
            "agents": {"KAIOS-AI-LIFE-CODEX-GM-0001": agent},
            "attestations": {
                "ATTEST-0001": attestation
            },
            "capability_grants": {
                "GRANT-0001": grant
            },
            "revocations": {},
            "workorders": {"KAIOS-COMPANY-BOOT-RUNTIME-V0.1": workorder},
        }
        return {"session": session, "current_state": state, "agent_registry": registry, "handoff": handoff}

    def write_case(self, case: dict) -> None:
        for name in ("session", "current_state", "agent_registry"):
            (self.tmp / f"{name}.json").write_text(json.dumps(case[name], ensure_ascii=False, indent=2), encoding="utf-8")
        (self.tmp / "parent_handoff.json").write_text(json.dumps(case["handoff"], ensure_ascii=False, indent=2), encoding="utf-8")

    def refresh_attestation(self) -> None:
        record = self.base["agent_registry"]["attestations"]["ATTEST-0001"]
        self.base["agent_registry"]["attestations"]["ATTEST-0001"] = with_integrity(record)

    def refresh_grant(self) -> None:
        record = self.base["agent_registry"]["capability_grants"]["GRANT-0001"]
        self.base["agent_registry"]["capability_grants"]["GRANT-0001"] = with_integrity(record)

    def run_close(self, boot_result: dict) -> tuple[int, bool, bool]:
        boot_result_path = self.tmp / "close_input.json"
        handoff_output = self.tmp / "close_handoff.json"
        archive_dir = self.tmp / "close_archive"
        boot_result_path.write_text(json.dumps(boot_result, ensure_ascii=False, indent=2), encoding="utf-8")
        cmd = [
            sys.executable,
            "-m",
            "company_boot",
            "close-session",
            "--boot-result",
            str(boot_result_path),
            "--handoff-output",
            str(handoff_output),
            "--archive-dir",
            str(archive_dir),
        ]
        proc = subprocess.run(cmd, cwd=RUNTIME_DIR, env=self.env, text=True, capture_output=True, check=False)
        return proc.returncode, handoff_output.exists(), (archive_dir / handoff_output.name).exists()

    def authentic_boot_result(self) -> dict:
        code, result = self.run_validate()
        self.assertEqual(code, 0)
        self.assertEqual(result["company_boot_status"], "COMPANY_BOOT_PASS")
        return result

    def assert_close_rejected(self, result: dict) -> None:
        code, handoff_exists, archive_exists = self.run_close(result)
        self.assertEqual(code, 2)
        self.assertFalse(handoff_exists)
        self.assertFalse(archive_exists)

    def run_validate(self) -> tuple[int, dict]:
        output = self.tmp / "boot_result.json"
        cmd = [
            sys.executable,
            "-m",
            "company_boot",
            "validate-session",
            "--session",
            str(self.tmp / "session.json"),
            "--current-state",
            str(self.tmp / "current_state.json"),
            "--agent-registry",
            str(self.tmp / "agent_registry.json"),
            "--handoff",
            str(self.tmp / "parent_handoff.json"),
            "--output",
            str(output),
        ]
        proc = subprocess.run(cmd, cwd=RUNTIME_DIR, env=self.env, text=True, capture_output=True, check=False)
        if proc.returncode not in (0, 2):
            self.fail(proc.stderr + proc.stdout)
        return proc.returncode, json.loads(output.read_text(encoding="utf-8"))

    def assert_blocked(self, expected_code: str, expected_terminal: str | None = None) -> None:
        code, result = self.run_validate()
        self.assertEqual(code, 2)
        self.assertEqual(result["company_boot_status"], "COMPANY_BOOT_FAILED")
        self.assertEqual(result["failure_code"], expected_code)
        for action in ("COMMIT", "PUSH", "PR", "MERGE", "DISPATCH", "DEPLOY"):
            self.assertIn(action, result["blocked_actions"])
        serialized = json.dumps(result, ensure_ascii=False)
        self.assertNotIn("FAKE_SECRET_VALUE", serialized)
        self.assertIn("result_sha256", result)
        terminal_by_code = {
            "DUPLICATE_SESSION_ID": "CONFLICTED",
            "EXPIRED_CAPABILITY": "REVOKED",
            "REVOKED_CAPABILITY": "REVOKED",
            "WRONG_MAIN_SHA": "STALE",
            "STALE_SESSION": "STALE",
            "CURRENT_STATE_CONFLICT": "CONFLICTED",
            "STATE_SHA_MISMATCH": "CONFLICTED",
            "HANDOFF_SHA_MISMATCH": "CONFLICTED",
            "SESSION_LOCK_CONFLICT": "CONFLICTED",
        }
        self.assertEqual(result["failure_state"], expected_terminal or terminal_by_code.get(expected_code, "FAILED"))
        self.assertEqual(result["state_path"][-1], result["failure_state"])
        self.assertIn("last_successful_state", result)

    def test_happy_path_validate_and_close_session(self) -> None:
        code, result = self.run_validate()
        self.assertEqual(code, 0)
        self.assertEqual(result["company_boot_status"], "COMPANY_BOOT_PASS")
        self.assertTrue(result["main_sha_match"])
        self.assertEqual(result["current_main_sha"], MAIN_SHA)
        self.assertIn("CREATE_HANDOFF_RECORD", result["authorized_actions"])
        self.assertIn("PUSH", result["forbidden_actions"])
        self.assertIn("content_sha256", result)
        self.assertIn("record_sha256", result)
        self.assertIn("result_sha256", result)
        self.assertEqual(result["record_sha256"], result["result_sha256"])

        handoff_output = self.tmp / "handoff.json"
        archive_dir = self.tmp / "archive"
        cmd = [
            sys.executable,
            "-m",
            "company_boot",
            "close-session",
            "--boot-result",
            str(self.tmp / "boot_result.json"),
            "--handoff-output",
            str(handoff_output),
            "--archive-dir",
            str(archive_dir),
        ]
        proc = subprocess.run(cmd, cwd=RUNTIME_DIR, env=self.env, text=True, capture_output=True, check=False)
        self.assertEqual(proc.returncode, 0, proc.stderr)
        handoff = json.loads(handoff_output.read_text(encoding="utf-8"))
        self.assertEqual(handoff["session_status"], "ARCHIVED")
        self.assertEqual(handoff["lock_status"], "RELEASED")
        self.assertEqual(handoff["ending_main_sha"], MAIN_SHA)
        self.assertTrue((archive_dir / "handoff.json").exists())

    def test_fake_life_id(self) -> None:
        self.base["session"]["life_id"] = "KAIOS-AI-LIFE-FAKE-0001"
        self.write_case(self.base)
        self.assert_blocked("FAKE_LIFE_ID")

    def test_fake_attestation(self) -> None:
        self.base["session"]["attestation_id"] = "ATTEST-FAKE"
        self.write_case(self.base)
        self.assert_blocked("FAKE_ATTESTATION")

    def test_expired_capability(self) -> None:
        self.base["agent_registry"]["capability_grants"]["GRANT-0001"]["expires_at"] = utc(-1)
        self.write_case(self.base)
        self.assert_blocked("EXPIRED_CAPABILITY")

    def test_revoked_capability(self) -> None:
        self.base["agent_registry"]["revocations"]["GRANT-0001"] = with_integrity(
            {
                "revocation_id": "REVOKE-0001",
                "grant_id": "GRANT-0001",
                "status": "ACTIVE",
                "reason": "test",
                "revoked_at": utc(0),
                "revoked_by": "Human",
            }
        )
        self.write_case(self.base)
        self.assert_blocked("REVOKED_CAPABILITY")

    def test_wrong_main_sha(self) -> None:
        self.base["session"]["base_main_sha"] = "0" * 40
        self.write_case(self.base)
        self.assert_blocked("WRONG_MAIN_SHA")

    def test_missing_parent_handoff(self) -> None:
        self.base["session"]["parent_handoff_id"] = None
        self.write_case(self.base)
        self.assert_blocked("MISSING_PARENT_HANDOFF")

    def test_duplicate_session_id(self) -> None:
        self.base["current_state"]["active_sessions"] = ["CODEX-GM-20260722-SESSION-0001"]
        self.base["current_state"] = with_state_sha(self.base["current_state"])
        self.write_case(self.base)
        self.assert_blocked("DUPLICATE_SESSION_ID")

    def test_stale_session(self) -> None:
        self.base["session"]["base_main_sha"] = "0" * 40
        self.base["session"]["allow_stale"] = True
        self.write_case(self.base)
        self.assert_blocked("STALE_SESSION")

    def test_current_state_conflict(self) -> None:
        self.base["current_state"]["conflicting_current_state"] = True
        self.base["current_state"] = with_state_sha(self.base["current_state"])
        self.write_case(self.base)
        self.assert_blocked("CURRENT_STATE_CONFLICT")

    def test_secret_appears_in_output_is_rejected(self) -> None:
        self.base["session"]["debug"] = "Token" + ": " + "FAKE_SECRET_VALUE"
        self.write_case(self.base)
        self.assert_blocked("SECRET_IN_OUTPUT")

    def test_cache_as_current_truth(self) -> None:
        self.base["current_state"]["source_type"] = "CACHE"
        self.base["current_state"] = with_state_sha(self.base["current_state"])
        self.write_case(self.base)
        self.assert_blocked("CACHE_AS_CURRENT_TRUTH")

    def test_unauthorized_workorder(self) -> None:
        self.base["session"]["assigned_workorder"] = "UNAUTHORIZED-WORKORDER"
        self.write_case(self.base)
        self.assert_blocked("UNAUTHORIZED_WORKORDER")

    def test_state_sha_mismatch(self) -> None:
        self.base["current_state"]["state_sha256"] = "bad"
        self.write_case(self.base)
        self.assert_blocked("STATE_SHA_MISMATCH")

    def test_handoff_sha_mismatch(self) -> None:
        self.base["session"]["parent_handoff_sha256"] = "bad"
        self.write_case(self.base)
        self.assert_blocked("HANDOFF_SHA_MISMATCH")

    def test_session_lock_conflict(self) -> None:
        self.base["current_state"]["session_locks"] = [
            {
                "lock_id": "LOCK-0001",
                "status": "ACTIVE",
                "workorder_id": "KAIOS-COMPANY-BOOT-RUNTIME-V0.1",
                "holder_instance_id": "CODEX-GM-20260722-SESSION-9999",
                "scope": "KGEN-KAIOS/governance/agents/runtime-v0.1/",
                "acquired_at": utc(-1),
                "heartbeat_at": utc(0),
                "expires_at": utc(1),
            }
        ]
        self.base["current_state"] = with_state_sha(self.base["current_state"])
        self.write_case(self.base)
        self.assert_blocked("SESSION_LOCK_CONFLICT")

    def test_hash_same_semantic_input_different_timestamp_content_same(self) -> None:
        first = stamp_hashes({"status": "OK", "booted_at": "2026-07-22T00:00:00Z"})
        second = stamp_hashes({"status": "OK", "booted_at": "2026-07-22T00:00:01Z"})
        self.assertEqual(first["content_sha256"], second["content_sha256"])

    def test_hash_same_semantic_input_different_timestamp_record_different(self) -> None:
        first = stamp_hashes({"status": "OK", "booted_at": "2026-07-22T00:00:00Z"})
        second = stamp_hashes({"status": "OK", "booted_at": "2026-07-22T00:00:01Z"})
        self.assertNotEqual(first["record_sha256"], second["record_sha256"])

    def test_hash_same_record_recalculation_record_same(self) -> None:
        record = stamp_hashes({"status": "OK", "booted_at": "2026-07-22T00:00:00Z"})
        recalculated = stamp_hashes(record)
        self.assertEqual(record["record_sha256"], recalculated["record_sha256"])

    def test_hash_field_does_not_hash_itself(self) -> None:
        record = stamp_hashes({"status": "OK", "record_sha256": "bad", "content_sha256": "bad", "result_sha256": "bad"})
        clean = stamp_hashes({"status": "OK"})
        self.assertEqual(record["content_sha256"], clean["content_sha256"])
        self.assertEqual(record["record_sha256"], clean["record_sha256"])

    def test_hash_key_order_does_not_affect_content_sha256(self) -> None:
        first = stamp_hashes({"a": 1, "b": 2})
        second = stamp_hashes({"b": 2, "a": 1})
        self.assertEqual(first["content_sha256"], second["content_sha256"])

    def assert_invalid_transition_failed_result(self, current: Stage, next_state: Stage) -> None:
        tracker = StateTracker(current=current, path=[current.value])
        with self.assertRaises(BootFailure) as ctx:
            tracker.transition(next_state)
        result = failure_result(ctx.exception, {}, tracker)
        self.assertEqual(result["company_boot_status"], "COMPANY_BOOT_FAILED")
        self.assertEqual(result["failure_code"], "INVALID_STATE_TRANSITION")

    def test_transition_skipping_identity_validation(self) -> None:
        self.assert_invalid_transition_failed_result(Stage.BOOTING, Stage.CAPABILITY_VERIFIED)

    def test_transition_new_to_read_only_active_blocked(self) -> None:
        self.assert_invalid_transition_failed_result(Stage.NEW, Stage.READ_ONLY_ACTIVE)

    def test_transition_archived_returning_to_active_blocked(self) -> None:
        self.assert_invalid_transition_failed_result(Stage.ARCHIVED, Stage.READ_ONLY_ACTIVE)

    def test_transition_revoked_continuing_boot_blocked(self) -> None:
        self.assert_invalid_transition_failed_result(Stage.REVOKED, Stage.STATE_VERIFIED)

    def test_transition_failed_continuing_boot_blocked(self) -> None:
        self.assert_invalid_transition_failed_result(Stage.FAILED, Stage.STATE_VERIFIED)

    def test_transition_stale_performing_write_action_blocked(self) -> None:
        self.assert_invalid_transition_failed_result(Stage.STALE, Stage.READ_ONLY_ACTIVE)

    def test_transition_conflicted_without_resolution_blocked(self) -> None:
        self.assert_invalid_transition_failed_result(Stage.CONFLICTED, Stage.READ_ONLY_ACTIVE)

    def test_wrong_baseline_id(self) -> None:
        self.base["session"]["expected_baseline_id"] = "WRONG-BASELINE"
        self.write_case(self.base)
        self.assert_blocked("BASELINE_VALIDATION_FAILED", "STALE")

    def test_missing_baseline_id(self) -> None:
        self.base["current_state"].pop("current_baseline_id")
        self.base["current_state"] = with_state_sha(self.base["current_state"])
        self.write_case(self.base)
        self.assert_blocked("BASELINE_VALIDATION_FAILED", "CONFLICTED")

    def test_superseded_baseline(self) -> None:
        self.base["current_state"]["baseline_status"] = "SUPERSEDED"
        self.base["current_state"] = with_state_sha(self.base["current_state"])
        self.write_case(self.base)
        self.assert_blocked("BASELINE_VALIDATION_FAILED", "CONFLICTED")

    def test_revoked_baseline(self) -> None:
        self.base["current_state"]["baseline_status"] = "REVOKED"
        self.base["current_state"] = with_state_sha(self.base["current_state"])
        self.write_case(self.base)
        self.assert_blocked("BASELINE_VALIDATION_FAILED", "CONFLICTED")

    def test_unknown_baseline_status(self) -> None:
        self.base["current_state"]["baseline_status"] = "UNKNOWN"
        self.base["current_state"] = with_state_sha(self.base["current_state"])
        self.write_case(self.base)
        self.assert_blocked("BASELINE_VALIDATION_FAILED", "CONFLICTED")

    def test_correct_active_baseline_pass(self) -> None:
        code, result = self.run_validate()
        self.assertEqual(code, 0)
        self.assertEqual(result["company_boot_status"], "COMPANY_BOOT_PASS")
        self.assertEqual(result["current_baseline_id"], "KAIOS-AI-AGENT-LIFE-ARCHITECTURE-V1")
        self.assertEqual(result["baseline_status"], "ARCHITECTURE_BASELINE_APPROVED")

    # Forged Boot Result rejection tests.

    def test_close_rejects_hashless_forged_pass(self) -> None:
        self.assert_close_rejected(
            {
                "company_boot_status": "COMPANY_BOOT_PASS",
                "life_id": "FORGED-LIFE",
                "instance_id": "FORGED-SESSION",
                "current_main_sha": MAIN_SHA,
                "expected_main_sha": MAIN_SHA,
            }
        )

    def test_close_rejects_wrong_content_sha256(self) -> None:
        result = self.authentic_boot_result()
        result["content_sha256"] = "0" * 64
        self.assert_close_rejected(result)

    def test_close_rejects_wrong_record_sha256(self) -> None:
        result = self.authentic_boot_result()
        result["record_sha256"] = "0" * 64
        self.assert_close_rejected(result)

    def test_close_rejects_missing_required_field(self) -> None:
        result = self.authentic_boot_result()
        result.pop("evidence_ids")
        self.assert_close_rejected(result)

    def test_close_rejects_mismatched_identity_binding(self) -> None:
        result = self.authentic_boot_result()
        result["identity_binding"]["instance_id"] = "FORGED-SESSION"
        self.assert_close_rejected(stamp_hashes(result))

    def test_close_rejects_secret_in_boot_result(self) -> None:
        result = self.authentic_boot_result()
        result["files_read"] = ["Password: FAKE_SECRET_VALUE"]
        self.assert_close_rejected(stamp_hashes(result))

    def test_close_rejects_unauthorized_action(self) -> None:
        result = self.authentic_boot_result()
        result["authorized_actions"].append("MERGE")
        self.assert_close_rejected(stamp_hashes(result))

    def test_close_rejects_wrong_pre_close_state(self) -> None:
        result = self.authentic_boot_result()
        result["state_path"][-1] = "ARCHIVED"
        self.assert_close_rejected(stamp_hashes(result))

    def test_close_accepts_authentic_boot_result(self) -> None:
        code, handoff_exists, archive_exists = self.run_close(self.authentic_boot_result())
        self.assertEqual(code, 0)
        self.assertTrue(handoff_exists)
        self.assertTrue(archive_exists)

    # Attestation integrity tests.

    def test_attestation_expired_rejected(self) -> None:
        self.base["agent_registry"]["attestations"]["ATTEST-0001"]["expires_at"] = utc(-1)
        self.refresh_attestation()
        self.write_case(self.base)
        self.assert_blocked("ATTESTATION_VALIDATION_FAILED", "REVOKED")

    def test_attestation_revoked_rejected(self) -> None:
        self.base["agent_registry"]["attestations"]["ATTEST-0001"]["status"] = "REVOKED"
        self.refresh_attestation()
        self.write_case(self.base)
        self.assert_blocked("ATTESTATION_VALIDATION_FAILED", "REVOKED")

    def test_attestation_superseded_rejected(self) -> None:
        self.base["agent_registry"]["attestations"]["ATTEST-0001"]["status"] = "SUPERSEDED"
        self.refresh_attestation()
        self.write_case(self.base)
        self.assert_blocked("ATTESTATION_VALIDATION_FAILED", "REVOKED")

    def test_attestation_unknown_rejected(self) -> None:
        self.base["agent_registry"]["attestations"]["ATTEST-0001"]["status"] = "UNKNOWN"
        self.refresh_attestation()
        self.write_case(self.base)
        self.assert_blocked("ATTESTATION_VALIDATION_FAILED")

    def test_attestation_unapproved_rejected(self) -> None:
        self.base["agent_registry"]["attestations"]["ATTEST-0001"]["status"] = "UNAPPROVED"
        self.refresh_attestation()
        self.write_case(self.base)
        self.assert_blocked("ATTESTATION_VALIDATION_FAILED")

    def test_attestation_life_id_mismatch_rejected(self) -> None:
        self.base["agent_registry"]["attestations"]["ATTEST-0001"]["life_id"] = "KAIOS-AI-LIFE-OTHER-0001"
        self.refresh_attestation()
        self.write_case(self.base)
        self.assert_blocked("ATTESTATION_VALIDATION_FAILED")

    def test_attestation_instance_id_mismatch_rejected(self) -> None:
        self.base["agent_registry"]["attestations"]["ATTEST-0001"]["instance_id"] = "CODEX-GM-20260722-SESSION-9999"
        self.refresh_attestation()
        self.write_case(self.base)
        self.assert_blocked("ATTESTATION_VALIDATION_FAILED")

    def test_attestation_missing_approval_evidence_rejected(self) -> None:
        self.base["agent_registry"]["attestations"]["ATTEST-0001"]["approval_evidence_id"] = ""
        self.refresh_attestation()
        self.write_case(self.base)
        self.assert_blocked("ATTESTATION_VALIDATION_FAILED")

    def test_attestation_registry_link_mismatch_rejected(self) -> None:
        self.base["agent_registry"]["attestations"]["ATTEST-0001"]["registry_entry_sha256"] = "0" * 64
        self.refresh_attestation()
        self.write_case(self.base)
        self.assert_blocked("ATTESTATION_VALIDATION_FAILED")

    def test_attestation_integrity_hash_mismatch_rejected(self) -> None:
        self.base["agent_registry"]["attestations"]["ATTEST-0001"]["integrity_sha256"] = "0" * 64
        self.write_case(self.base)
        self.assert_blocked("ATTESTATION_VALIDATION_FAILED")

    # Capability allowlist and scope tests.

    def test_capability_merge_action_rejected(self) -> None:
        self.base["agent_registry"]["capability_grants"]["GRANT-0001"]["capabilities"] = ["MERGE"]
        self.refresh_grant()
        self.write_case(self.base)
        self.assert_blocked("CAPABILITY_VALIDATION_FAILED")

    def test_capability_drive_root_scope_rejected(self) -> None:
        self.base["agent_registry"]["capability_grants"]["GRANT-0001"]["scope_paths"] = ["C:/"]
        self.refresh_grant()
        self.write_case(self.base)
        self.assert_blocked("CAPABILITY_VALIDATION_FAILED")

    def test_capability_repository_root_scope_rejected(self) -> None:
        self.base["agent_registry"]["capability_grants"]["GRANT-0001"]["scope_paths"] = ["."]
        self.refresh_grant()
        self.write_case(self.base)
        self.assert_blocked("CAPABILITY_VALIDATION_FAILED")

    def test_capability_path_traversal_rejected(self) -> None:
        self.base["agent_registry"]["capability_grants"]["GRANT-0001"]["scope_paths"] = ["KGEN-KAIOS/governance/agents/runtime-v0.1/../"]
        self.refresh_grant()
        self.write_case(self.base)
        self.assert_blocked("CAPABILITY_VALIDATION_FAILED")

    def test_capability_wrong_life_id_rejected(self) -> None:
        self.base["agent_registry"]["capability_grants"]["GRANT-0001"]["life_id"] = "KAIOS-AI-LIFE-OTHER-0001"
        self.refresh_grant()
        self.write_case(self.base)
        self.assert_blocked("CAPABILITY_VALIDATION_FAILED")

    def test_capability_wrong_workorder_rejected(self) -> None:
        self.base["agent_registry"]["capability_grants"]["GRANT-0001"]["workorder_id"] = "OTHER-WORKORDER"
        self.refresh_grant()
        self.write_case(self.base)
        self.assert_blocked("CAPABILITY_VALIDATION_FAILED")

    def test_capability_unknown_grant_rejected(self) -> None:
        self.base["session"]["capability_grant_id"] = "GRANT-UNKNOWN"
        self.write_case(self.base)
        self.assert_blocked("CAPABILITY_VALIDATION_FAILED")

    def test_capability_valid_narrow_read_only_grant_passes(self) -> None:
        code, result = self.run_validate()
        self.assertEqual(code, 0)
        self.assertEqual(result["authorized_actions"], list(AUTHORIZED_ACTIONS))

    # Exact failure terminal-state tests.

    def test_failure_terminal_fake_life_is_failed(self) -> None:
        self.base["session"]["life_id"] = "KAIOS-AI-LIFE-FAKE-0001"
        self.write_case(self.base)
        _, result = self.run_validate()
        self.assertEqual((result["last_successful_state"], result["failure_state"]), ("BOOTING", "FAILED"))
        self.assertNotIn("IDENTITY_VERIFIED", result["state_path"])

    def test_failure_terminal_fake_attestation_is_failed(self) -> None:
        self.base["session"]["attestation_id"] = "ATTEST-FAKE"
        self.write_case(self.base)
        _, result = self.run_validate()
        self.assertEqual((result["last_successful_state"], result["failure_state"]), ("BOOTING", "FAILED"))
        self.assertNotIn("IDENTITY_VERIFIED", result["state_path"])

    def test_failure_terminal_expired_capability_is_revoked(self) -> None:
        self.base["agent_registry"]["capability_grants"]["GRANT-0001"]["expires_at"] = utc(-1)
        self.refresh_grant()
        self.write_case(self.base)
        _, result = self.run_validate()
        self.assertEqual((result["last_successful_state"], result["failure_state"]), ("IDENTITY_VERIFIED", "REVOKED"))
        self.assertNotIn("CAPABILITY_VERIFIED", result["state_path"])

    def test_failure_terminal_main_sha_mismatch_is_stale(self) -> None:
        self.base["session"]["base_main_sha"] = "0" * 40
        self.write_case(self.base)
        _, result = self.run_validate()
        self.assertEqual((result["last_successful_state"], result["failure_state"]), ("CAPABILITY_VERIFIED", "STALE"))
        self.assertNotIn("STATE_VERIFIED", result["state_path"])

    # Schema alignment tests use the same built-in validation path as the CLI.

    def test_schema_valid_full_registry(self) -> None:
        validate_registry_shape(self.base["agent_registry"])
        schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
        self.assertEqual(
            set(schema["properties"]["agent_registry"]["required"]),
            {"agents", "attestations", "capability_grants", "revocations", "workorders"},
        )
        self.assertTrue({"sessionLock", "currentState", "sessionBirth", "handoff", "bootResult"}.issubset(schema["$defs"]))

    def test_schema_missing_attestations_rejected(self) -> None:
        self.base["agent_registry"].pop("attestations")
        self.write_case(self.base)
        self.assert_blocked("ATTESTATION_VALIDATION_FAILED")

    def test_schema_missing_capability_grants_rejected(self) -> None:
        self.base["agent_registry"].pop("capability_grants")
        self.write_case(self.base)
        self.assert_blocked("ATTESTATION_VALIDATION_FAILED")

    def test_schema_invalid_revocation_rejected(self) -> None:
        self.base["agent_registry"]["revocations"]["GRANT-0001"] = {"reason": "incomplete"}
        self.write_case(self.base)
        self.assert_blocked("CAPABILITY_VALIDATION_FAILED")

    def test_schema_unknown_privileged_action_rejected(self) -> None:
        self.base["agent_registry"]["capability_grants"]["GRANT-0001"]["capabilities"] = ["AUTO_MERGE"]
        self.refresh_grant()
        self.write_case(self.base)
        self.assert_blocked("CAPABILITY_VALIDATION_FAILED")

    def test_schema_overbroad_scope_rejected(self) -> None:
        self.base["agent_registry"]["capability_grants"]["GRANT-0001"]["scope_paths"] = ["*"]
        self.refresh_grant()
        self.write_case(self.base)
        self.assert_blocked("CAPABILITY_VALIDATION_FAILED")

    def test_schema_expired_attestation_rejected(self) -> None:
        self.base["agent_registry"]["attestations"]["ATTEST-0001"]["expires_at"] = utc(-1)
        self.refresh_attestation()
        self.write_case(self.base)
        self.assert_blocked("ATTESTATION_VALIDATION_FAILED", "REVOKED")

    def test_schema_expired_grant_rejected(self) -> None:
        self.base["agent_registry"]["capability_grants"]["GRANT-0001"]["expires_at"] = utc(-1)
        self.refresh_grant()
        self.write_case(self.base)
        self.assert_blocked("EXPIRED_CAPABILITY")

    def test_schema_unknown_extra_field_rejected(self) -> None:
        self.base["agent_registry"]["attestations"]["ATTEST-0001"]["unexpected"] = True
        self.write_case(self.base)
        self.assert_blocked("ATTESTATION_VALIDATION_FAILED")


if __name__ == "__main__":
    unittest.main()
