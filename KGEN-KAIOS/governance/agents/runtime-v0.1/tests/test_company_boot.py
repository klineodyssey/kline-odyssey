from __future__ import annotations

import json
import copy
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
from company_boot.validators import (
    validate_registry_shape, validate_workflow_evidence, validate_boot_result,
    WorkflowEvidenceError, WORKFLOW_BOOT_FILE, WORKFLOW_REQUIRED_SOURCES,
    WORKFLOW_COMPANY_CHECKS, WORKFLOW_STAGES, record_hash,
)


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


class EngineeringWorkflowEvidenceTests(unittest.TestCase):
    """Synthetic local Git only; no network, real identity or authority issued."""

    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory(prefix="kaios_workflow_test_")
        self.repo = Path(self.temp.name)
        self.git("init", "-q")
        indexed = [WORKFLOW_BOOT_FILE] + [f"canon/source-{i}.md" for i in range(13)]
        indexed += ["neural/NEURAL_MAP.json", "neural/ORGAN_INDEX.json", "neural/RUNTIME_DEPENDENCY.json"]
        paths = set(indexed) | WORKFLOW_REQUIRED_SOURCES | {"docs/maps/current-map.json", "docs/maps/base-map.json"}
        for name in paths:
            target = self.repo / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text("Synthetic test source; not an authority.\n", encoding="utf-8")
        (self.repo / WORKFLOW_BOOT_FILE).write_text(
            "# 14. AI 開機讀取順序\n\n" + "\n".join(f"{i}. /{p}" for i, p in enumerate(indexed, 1)) + "\n# 15. End\n",
            encoding="utf-8",
        )
        (self.repo / "docs/maps/README.md").write_text("## Current Shared Map\n\n- `current-map.json`\n\n## Previous\n")
        (self.repo / "docs/maps/current-map.json").write_text('{"base_map":"/docs/maps/base-map.json"}\n')
        (self.repo / "docs/maps/base-map.json").write_text('{"points":[]}\n')
        self.commit()
        self.main = self.git("rev-parse", "HEAD").strip()
        ordered = [WORKFLOW_BOOT_FILE] + sorted(paths - {WORKFLOW_BOOT_FILE})
        receipts = [{"path": p, "blob": self.git("rev-parse", f"{self.main}:{p}").strip()} for p in ordered]
        registry = "KGEN-KAIOS/worker_registry.json"
        registry_blob = next(r["blob"] for r in receipts if r["path"] == registry)
        now = (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()
        checkpoint = {
            "checkpoint_id": "pre-code", "phase": "PRE_CODE", "recorded_at": now,
            "BOOT_FILE": WORKFLOW_BOOT_FILE, "BOOT_BLOB": receipts[0]["blob"], "LATEST_MAIN": self.main,
            "ORDER": ["BOOT", "COMPANY_SYNC", "HUMAN_PROMPT"], "READ_RECEIPTS": receipts,
            "PATH_RESOLUTIONS": [],
            "COMPANY_SYNC": {"main_sha": self.main, "observed_at": now, "checks": [
                {"category": c, "status": "CHECKED", "source_ref": registry, "source_revision": registry_blob,
                 "summary": "Synthetic observation; no authority claim."} for c in sorted(WORKFLOW_COMPANY_CHECKS)
            ]},
            "DOMAIN_CANON_READ": ["canon/source-0.md"], "CANON_CONFLICT": [],
            "STAGES": [{"stage": s, "evidence_ref": "canon/source-0.md"} for s in WORKFLOW_STAGES[:5]],
            "CYCLE": {"number": 1, "previous_checkpoint_id": None, "pre_code_checkpoint_id": "pre-code",
                      "reason": "INITIAL", "reason_ref": "evidence:initial-work", "test_outcome": "NOT_RUN"},
        }
        self.record = {"schema_version": "BOOT_FIRST_WORKFLOW_V1", "work_id": "test-work",
                       "session_id": "test-session", "workspace_id": "test-workspace", "checkpoints": [checkpoint]}
        self.seal()

    def tearDown(self) -> None:
        self.temp.cleanup()

    def git(self, *args: str) -> str:
        return subprocess.check_output(["git", "-C", str(self.repo), *args], text=True, stderr=subprocess.PIPE)

    def commit(self) -> None:
        self.git("add", ".")
        self.git("-c", "user.name=Synthetic Fixture", "-c", "user.email=fixture@example.invalid",
                 "-c", "commit.gpgsign=false", "commit", "-qm", "Synthetic test fixture")

    def seal(self) -> None:
        self.record["record_sha256"] = record_hash(self.record, "record_sha256")

    @property
    def checkpoint(self) -> dict:
        return self.record["checkpoints"][-1]

    def validate(self, previous=None, **overrides) -> dict:
        args = dict(record=self.record, repository=self.repo, expected_main=self.main,
                    expected_work="test-work", expected_session="test-session", expected_workspace="test-workspace",
                    previous=previous)
        args.update(overrides)
        return validate_workflow_evidence(**args)

    def reject(self, expected=None, previous=None, **overrides) -> None:
        self.seal()
        with self.assertRaises(WorkflowEvidenceError) as caught:
            self.validate(previous=previous, **overrides)
        if expected:
            self.assertEqual(str(caught.exception), expected)

    def append_checkpoint(self, phase="POST_TEST") -> dict:
        previous = copy.deepcopy(self.record)
        prior = self.checkpoint
        cp = copy.deepcopy(prior)
        checkpoint_id = f"checkpoint-{len(self.record['checkpoints']) + 1}"
        cp.update(checkpoint_id=checkpoint_id, phase=phase, recorded_at=datetime.now(timezone.utc).isoformat())
        cp["COMPANY_SYNC"]["observed_at"] = cp["recorded_at"]
        cp["STAGES"] = cp["STAGES"][:5]
        if phase == "POST_TEST":
            cp["STAGES"] += [{"stage": s, "evidence_ref": "evidence:local-unit-results"} for s in WORKFLOW_STAGES[5:]]
        cp["CYCLE"] = {
            "number": prior["CYCLE"]["number"] + (phase == "PRE_CODE" and prior["phase"] == "POST_TEST"),
            "previous_checkpoint_id": prior["checkpoint_id"],
            "pre_code_checkpoint_id": checkpoint_id if phase == "PRE_CODE" else prior["checkpoint_id"],
            "reason": "TEST_RESULT" if phase == "POST_TEST" else ("REWORK" if prior["phase"] == "POST_TEST" else "SOURCE_REFRESH"),
            "reason_ref": "evidence:iteration-reason",
            "test_outcome": "PASS" if phase == "POST_TEST" else "NOT_RUN",
        }
        self.record["checkpoints"].append(cp)
        self.seal()
        return previous

    def test_pre_code_needs_no_future_code_or_test(self) -> None:
        result = self.validate()
        self.assertEqual(result["phase"], "PRE_CODE")
        self.assertEqual(result["workflow_evidence_status"], "CONSISTENT")
        self.assertEqual(result["actions_granted"], [])
        for field in ("authorship_verified", "cognitive_reading_verified", "remote_freshness_verified", "authority_verified"):
            self.assertIs(result[field], False)

    def test_post_test_requires_actual_append(self) -> None:
        previous = self.append_checkpoint()
        self.assertEqual(self.validate(previous)["phase"], "POST_TEST")

    def test_refresh_can_remain_pre_code(self) -> None:
        previous = self.append_checkpoint("PRE_CODE")
        self.assertEqual(self.validate(previous)["checkpoint_count"], 2)

    def test_future_code_in_pre_code_rejected(self) -> None:
        self.checkpoint["STAGES"].append({"stage": "CODE", "evidence_ref": "evidence:future"})
        self.reject("WORKFLOW_STAGE_ORDER_INVALID")

    def test_completion_without_test_rejected(self) -> None:
        previous = self.append_checkpoint()
        self.checkpoint["STAGES"].pop()
        self.reject("WORKFLOW_STAGE_ORDER_INVALID", previous)

    def test_first_post_test_cannot_fabricate_pre_code(self) -> None:
        self.checkpoint["phase"] = "POST_TEST"
        self.reject("WORKFLOW_PREVIOUS_EVIDENCE_REQUIRED")

    def test_stale_main_rejected(self) -> None:
        self.reject("WORKFLOW_STALE_MAIN", expected_main="0" * 40)

    def test_missing_evidence_field_rejected(self) -> None:
        del self.checkpoint["BOOT_BLOB"]
        self.reject("WORKFLOW_SCHEMA_MISMATCH")

    def test_fake_read_order_rejected(self) -> None:
        self.checkpoint["READ_RECEIPTS"].reverse()
        self.reject("WORKFLOW_BOOT_NOT_FIRST")

    def test_company_before_boot_rejected(self) -> None:
        self.checkpoint["ORDER"] = ["COMPANY_SYNC", "BOOT", "HUMAN_PROMPT"]
        self.reject("WORKFLOW_WRONG_ORDER")

    def test_old_boot_filename_rejected(self) -> None:
        self.checkpoint["BOOT_FILE"] = "PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md"
        self.reject("WORKFLOW_WRONG_BOOT_FILE")

    def test_fake_blob_even_after_rehash_rejected(self) -> None:
        self.checkpoint["READ_RECEIPTS"][0]["blob"] = "0" * 40
        self.checkpoint["BOOT_BLOB"] = "0" * 40
        self.reject("WORKFLOW_SOURCE_BLOB_MISMATCH")

    def test_changed_source_requires_reread(self) -> None:
        p = self.repo / WORKFLOW_BOOT_FILE
        p.write_text(p.read_text() + "Changed source.\n")
        self.commit()
        self.main = self.git("rev-parse", "HEAD").strip()
        self.checkpoint["LATEST_MAIN"] = self.main
        self.checkpoint["COMPANY_SYNC"]["main_sha"] = self.main
        self.reject("WORKFLOW_SOURCE_BLOB_MISMATCH")

    def test_missing_lineage_read_rejected(self) -> None:
        self.checkpoint["READ_RECEIPTS"] = [r for r in self.checkpoint["READ_RECEIPTS"] if r["path"] != "canon/source-1.md"]
        self.reject("WORKFLOW_BOOT_LINEAGE_NOT_READ")

    def test_missing_current_map_rejected(self) -> None:
        self.checkpoint["READ_RECEIPTS"] = [r for r in self.checkpoint["READ_RECEIPTS"] if r["path"] != "docs/maps/current-map.json"]
        self.reject("WORKFLOW_CURRENT_MAP_NOT_READ")

    def test_missing_map_base_rejected(self) -> None:
        self.checkpoint["READ_RECEIPTS"] = [r for r in self.checkpoint["READ_RECEIPTS"] if r["path"] != "docs/maps/base-map.json"]
        self.reject("WORKFLOW_MAP_BASE_NOT_READ")

    def test_missing_company_category_rejected(self) -> None:
        self.checkpoint["COMPANY_SYNC"]["checks"].pop()
        self.reject("WORKFLOW_COMPANY_SYNC_INCOMPLETE")

    def test_duplicate_company_category_rejected(self) -> None:
        checks = self.checkpoint["COMPANY_SYNC"]["checks"]
        checks[-1] = copy.deepcopy(checks[0])
        self.reject("WORKFLOW_COMPANY_SYNC_INCOMPLETE")

    def test_company_source_revision_bound(self) -> None:
        self.checkpoint["COMPANY_SYNC"]["checks"][0]["source_revision"] = "0" * 40
        self.reject("WORKFLOW_COMPANY_SOURCE_MISMATCH")

    def test_company_main_bound(self) -> None:
        self.checkpoint["COMPANY_SYNC"]["main_sha"] = "0" * 40
        self.reject("WORKFLOW_COMPANY_MAIN_MISMATCH")

    def test_unrelated_external_wait_does_not_block_local_scope(self) -> None:
        self.checkpoint["COMPANY_SYNC"]["checks"][0]["status"] = "WAITING_EXTERNAL"
        self.checkpoint["CANON_CONFLICT"] = [{"source_ref": "canon/source-0.md", "disposition": "RECORDED_OUTSIDE_SCOPE",
            "resolution_ref": "human-message:Sentinel_fixture", "reason": "Other owner and scope; no change authorized here."}]
        self.seal()
        self.assertEqual(self.validate()["actions_granted"], [])

    def test_affected_canon_conflict_blocks(self) -> None:
        self.checkpoint["CANON_CONFLICT"] = [{"source_ref": "canon/source-0.md", "disposition": "BLOCKED_AFFECTED_SCOPE",
            "resolution_ref": "human-message:Sentinel_fixture", "reason": "Await actual Human decision."}]
        self.reject("WORKFLOW_AFFECTED_CANON_CONFLICT")

    def test_domain_read_must_bind_source(self) -> None:
        self.checkpoint["DOMAIN_CANON_READ"] = ["imagined.md"]
        self.reject("WORKFLOW_DOMAIN_CANON_NOT_READ")

    def test_work_session_workspace_replay_rejected(self) -> None:
        for key in ("expected_work", "expected_session", "expected_workspace"):
            self.reject("WORKFLOW_CONTEXT_MISMATCH", **{key: "another-context"})

    def test_payload_cannot_mint_permission_or_identity(self) -> None:
        for key in ("authorized_actions", "worker_id", "life_id", "trust_level", "payroll_eligible"):
            self.record[key] = "FAKE_GRANT"
            self.reject("WORKFLOW_SCHEMA_MISMATCH")
            del self.record[key]

    def test_workflow_result_is_not_company_boot_result(self) -> None:
        with self.assertRaises(BootFailure):
            validate_boot_result(self.validate())

    def test_hash_mismatch_rejected(self) -> None:
        self.record["record_sha256"] = "0" * 64
        with self.assertRaisesRegex(WorkflowEvidenceError, "WORKFLOW_RECORD_HASH_MISMATCH"):
            self.validate()

    def test_rehash_does_not_authenticate_authorship(self) -> None:
        self.checkpoint["COMPANY_SYNC"]["checks"][0]["summary"] = "Caller changed a claim."
        self.seal()
        self.assertFalse(self.validate()["authorship_verified"])

    def test_history_must_be_exact_immutable_prefix(self) -> None:
        previous = self.append_checkpoint()
        self.record["checkpoints"][0]["CANON_CONFLICT"] = [{"fake": True}]
        self.reject("WORKFLOW_HISTORY_REWRITTEN", previous)

    def test_backdated_checkpoint_rejected(self) -> None:
        previous = self.append_checkpoint()
        self.checkpoint["recorded_at"] = previous["checkpoints"][0]["recorded_at"]
        self.checkpoint["COMPANY_SYNC"]["observed_at"] = self.checkpoint["recorded_at"]
        self.reject("WORKFLOW_CHECKPOINT_TIME_NOT_MONOTONIC", previous)

    def test_stale_company_refresh_rejected(self) -> None:
        previous = self.append_checkpoint()
        self.checkpoint["COMPANY_SYNC"]["observed_at"] = "2020-01-01T00:00:00Z"
        self.reject("WORKFLOW_COMPANY_REFRESH_REQUIRED", previous)

    def test_append_requires_previous_record(self) -> None:
        self.append_checkpoint()
        self.reject("WORKFLOW_PREVIOUS_EVIDENCE_REQUIRED")

    def test_future_timestamp_rejected(self) -> None:
        self.checkpoint["recorded_at"] = utc(1)
        self.reject("WORKFLOW_FUTURE_CHECKPOINT")

    def test_malformed_checkpoints_fail_closed(self) -> None:
        for bad in (None, [], [None], [[]], ["text"]):
            self.record["checkpoints"] = bad
            self.reject()

    def test_invalid_source_paths_rejected(self) -> None:
        for bad in ("../secret", "/absolute", "C:\\private", "neural//map.json"):
            self.checkpoint["READ_RECEIPTS"][-1]["path"] = bad
            self.reject("WORKFLOW_INVALID_SOURCE_PATH")

    def test_fake_resolution_index_rejected(self) -> None:
        self.checkpoint["PATH_RESOLUTIONS"] = [{"requested": "canon/missing.md", "resolved": "canon/source-0.md",
            "index": "canon/source-1.md", "reason": "Invented fallback."}]
        self.reject("WORKFLOW_INVALID_PATH_RESOLUTION")

    def test_case_alias_requires_tracked_index_and_explicit_receipt(self) -> None:
        old, actual = "canon/source-0.md", "Canon/source-0.md"
        (self.repo / "Canon").mkdir()
        (self.repo / old).rename(self.repo / actual)
        index = "docs/KGEN_MASTER_INDEX.md"
        (self.repo / index).write_text("Inventory: C:\\Desktop\\kline-odyssey\\Canon\\source-0.md\n")
        self.commit()
        self.main = self.git("rev-parse", "HEAD").strip()
        cp = self.checkpoint
        cp["LATEST_MAIN"] = cp["COMPANY_SYNC"]["main_sha"] = self.main
        cp["READ_RECEIPTS"] = [r for r in cp["READ_RECEIPTS"] if r["path"] != old]
        cp["READ_RECEIPTS"] += [{"path": p, "blob": self.git("rev-parse", f"{self.main}:{p}").strip()} for p in (actual, index)]
        cp["DOMAIN_CANON_READ"] = [actual]
        for stage in cp["STAGES"]:
            stage["evidence_ref"] = actual
        self.reject("WORKFLOW_BOOT_LINEAGE_NOT_READ")
        cp["PATH_RESOLUTIONS"] = [{"requested": old, "resolved": actual, "index": index,
                                   "reason": "Case-only path resolved through tracked inventory."}]
        self.seal()
        self.assertEqual(self.validate()["workflow_evidence_status"], "CONSISTENT")
        cp["PATH_RESOLUTIONS"][0]["index"] = "canon/source-1.md"
        self.reject("WORKFLOW_UNVERIFIED_PATH_RESOLUTION")

    def test_new_main_refresh_preserves_original_checkpoint(self) -> None:
        previous = self.append_checkpoint("PRE_CODE")
        p = self.repo / WORKFLOW_BOOT_FILE
        p.write_text(p.read_text() + "New cumulative fixture statement.\n")
        self.commit()
        self.main = self.git("rev-parse", "HEAD").strip()
        cp = self.checkpoint
        cp["LATEST_MAIN"] = cp["COMPANY_SYNC"]["main_sha"] = self.main
        cp["BOOT_BLOB"] = self.git("rev-parse", f"{self.main}:{WORKFLOW_BOOT_FILE}").strip()
        cp["READ_RECEIPTS"][0]["blob"] = cp["BOOT_BLOB"]
        self.seal()
        self.assertEqual(self.validate(previous)["observed_main"], self.main)
        self.assertNotEqual(previous["checkpoints"][0]["LATEST_MAIN"], self.main)
        self.assertEqual(self.record["checkpoints"][0], previous["checkpoints"][0])

    def test_duplicate_checkpoint_and_unbound_phase_reset_rejected(self) -> None:
        previous = self.append_checkpoint()
        self.checkpoint["checkpoint_id"] = "pre-code"
        self.reject("WORKFLOW_DUPLICATE_CHECKPOINT", previous)
        self.checkpoint["checkpoint_id"] = "post-test"
        self.seal()
        latest = copy.deepcopy(self.record)
        self.append_checkpoint("PRE_CODE")
        self.checkpoint["CYCLE"]["number"] = 1
        self.reject("WORKFLOW_CYCLE_RESET_INVALID", latest)

    def test_failed_test_rework_new_cycle_and_matching_completion(self) -> None:
        pre = self.append_checkpoint()
        self.checkpoint["CYCLE"]["test_outcome"] = "FAIL"
        self.seal()
        result = self.validate(pre)
        self.assertEqual(result["current_test_outcome"], "FAIL")
        self.assertFalse(result["readiness_evaluated"])
        failed = self.append_checkpoint("PRE_CODE")
        result = self.validate(failed)
        self.assertEqual((result["current_cycle"], result["phase"], result["current_test_outcome"]), (2, "PRE_CODE", "NOT_RUN"))
        self.assertEqual(self.record["checkpoints"][1]["CYCLE"]["test_outcome"], "FAIL")
        second_pre = self.append_checkpoint()
        result = self.validate(second_pre)
        self.assertEqual((result["current_cycle"], result["current_test_outcome"]), (2, "PASS"))
        self.assertEqual(self.record["checkpoints"][:2], failed["checkpoints"])
        self.assertEqual(result["actions_granted"], [])

    def test_successful_test_then_new_main_opens_unready_cycle(self) -> None:
        self.append_checkpoint()
        completed = self.append_checkpoint("PRE_CODE")
        self.checkpoint["CYCLE"]["reason"] = "SOURCE_REFRESH"
        p = self.repo / WORKFLOW_BOOT_FILE
        p.write_text(p.read_text() + "Fresh main after completed cycle.\n")
        self.commit()
        self.main = self.git("rev-parse", "HEAD").strip()
        cp = self.checkpoint
        cp["LATEST_MAIN"] = cp["COMPANY_SYNC"]["main_sha"] = self.main
        cp["BOOT_BLOB"] = self.git("rev-parse", f"{self.main}:{WORKFLOW_BOOT_FILE}").strip()
        cp["READ_RECEIPTS"][0]["blob"] = cp["BOOT_BLOB"]
        self.seal()
        result = self.validate(completed)
        self.assertEqual(result["current_cycle"], 2)
        self.assertEqual(result["current_test_outcome"], "NOT_RUN")
        self.assertFalse(result["readiness_evaluated"])
        fresh_pre = self.append_checkpoint()
        self.assertEqual(self.validate(fresh_pre)["current_test_outcome"], "PASS")

    def test_post_test_cannot_skip_or_reuse_completed_cycle_pre_code(self) -> None:
        self.append_checkpoint()
        completed = self.append_checkpoint()
        self.reject("WORKFLOW_POST_TEST_WITHOUT_MATCHING_PRE_CODE", completed)

    def test_second_cycle_post_test_cannot_bind_first_cycle_pre_code(self) -> None:
        self.append_checkpoint()
        self.append_checkpoint("PRE_CODE")
        second_pre = self.append_checkpoint()
        self.checkpoint["CYCLE"]["pre_code_checkpoint_id"] = "pre-code"
        self.reject("WORKFLOW_POST_TEST_WITHOUT_MATCHING_PRE_CODE", second_pre)

    def test_post_test_requires_same_pre_code_source_snapshot(self) -> None:
        pre = self.append_checkpoint()
        p = self.repo / WORKFLOW_BOOT_FILE
        p.write_text(p.read_text() + "Source changed without new PRE_CODE.\n")
        self.commit()
        self.main = self.git("rev-parse", "HEAD").strip()
        cp = self.checkpoint
        cp["LATEST_MAIN"] = cp["COMPANY_SYNC"]["main_sha"] = self.main
        cp["BOOT_BLOB"] = self.git("rev-parse", f"{self.main}:{WORKFLOW_BOOT_FILE}").strip()
        cp["READ_RECEIPTS"][0]["blob"] = cp["BOOT_BLOB"]
        self.reject("WORKFLOW_CYCLE_SOURCE_DRIFT", pre)

    def test_cycle_number_cannot_skip_reset_or_be_boolean(self) -> None:
        self.append_checkpoint()
        completed = self.append_checkpoint("PRE_CODE")
        for number, code in [(1, "WORKFLOW_CYCLE_RESET_INVALID"), (3, "WORKFLOW_CYCLE_RESET_INVALID"),
                             (True, "WORKFLOW_INVALID_CYCLE_NUMBER")]:
            self.checkpoint["CYCLE"]["number"] = number
            self.reject(code, completed)

    def test_cycle_parent_and_pre_code_self_binding_required(self) -> None:
        previous = self.append_checkpoint("PRE_CODE")
        self.checkpoint["CYCLE"]["previous_checkpoint_id"] = "another-parent"
        self.reject("WORKFLOW_CYCLE_PARENT_MISMATCH", previous)
        self.checkpoint["CYCLE"]["previous_checkpoint_id"] = "pre-code"
        self.checkpoint["CYCLE"]["pre_code_checkpoint_id"] = "old-pre-code"
        self.reject("WORKFLOW_CYCLE_PRE_CODE_MISMATCH", previous)

    def test_pre_code_cannot_carry_previous_pass(self) -> None:
        self.append_checkpoint()
        completed = self.append_checkpoint("PRE_CODE")
        self.checkpoint["CYCLE"]["test_outcome"] = "PASS"
        self.reject("WORKFLOW_INVALID_CYCLE_TEST_OUTCOME", completed)

    def test_cycle_evidence_cannot_disappear_after_introduction(self) -> None:
        previous = self.append_checkpoint()
        del self.checkpoint["CYCLE"]
        self.reject("WORKFLOW_CYCLE_EVIDENCE_REMOVED", previous)

    def test_legacy_receipt_needs_real_forward_checkpoint_without_backfill(self) -> None:
        del self.checkpoint["CYCLE"]
        self.reject("WORKFLOW_CYCLE_EVIDENCE_NOT_RECORDED")
        legacy = copy.deepcopy(self.record)
        cp = copy.deepcopy(self.checkpoint)
        cp["checkpoint_id"] = "actual-forward-checkpoint"
        cp["recorded_at"] = cp["COMPANY_SYNC"]["observed_at"] = datetime.now(timezone.utc).isoformat()
        cp["CYCLE"] = {"number": 1, "previous_checkpoint_id": "pre-code", "pre_code_checkpoint_id": cp["checkpoint_id"],
                       "reason": "LEGACY_FORWARD_CHECKPOINT", "reason_ref": "evidence:real-forward-observation", "test_outcome": "NOT_RUN"}
        self.record["checkpoints"].append(cp)
        self.seal()
        result = self.validate(legacy)
        self.assertEqual(result["historical_cycle_evidence_not_recorded"], 1)
        self.assertEqual(result["current_test_outcome"], "NOT_RUN")
        self.assertEqual(self.record["checkpoints"][0], legacy["checkpoints"][0])

    def test_previous_record_hash_cannot_be_rewritten_silently(self) -> None:
        previous = self.append_checkpoint()
        previous["record_sha256"] = "0" * 64
        self.reject("WORKFLOW_RECORD_HASH_MISMATCH", previous)

    def test_cli_is_read_only_and_explicit_about_limits(self) -> None:
        evidence = self.repo / "receipt.json"
        evidence.write_text(json.dumps(self.record))
        before = self.git("status", "--porcelain", "--untracked-files=all")
        command = [sys.executable, "-m", "company_boot", "validate-workflow", "--evidence", str(evidence),
                   "--repository", str(self.repo), "--expected-main", self.main, "--expected-work", "test-work",
                   "--expected-session", "test-session", "--expected-workspace", "test-workspace"]
        env = dict(os.environ, PYTHONPATH=str(SRC_DIR), PYTHONDONTWRITEBYTECODE="1")
        result = subprocess.run(command, env=env, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)["actions_granted"], [])
        self.assertEqual(self.git("status", "--porcelain", "--untracked-files=all"), before)

    def test_schema_addition_does_not_change_historical_required_fields(self) -> None:
        schema = json.loads(SCHEMA_PATH.read_text())
        self.assertEqual(schema["required"], ["agent_registry", "current_state", "session_birth_records", "handoffs", "boot_results"])
        self.assertIn("engineeringWorkflowEvidence", schema["$defs"])
        self.assertNotIn("workflow_evidence_records", schema["required"])


if __name__ == "__main__":
    unittest.main()
