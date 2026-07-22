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

from company_boot.evidence import canonical_json, sha256_file, sha256_text


RUNTIME_DIR = Path(__file__).resolve().parents[1]
SRC_DIR = RUNTIME_DIR / "src"
MAIN_SHA = "68d17fde53f1ce0b4f610ce9e8095e5d93c8cf9a"


def utc(offset_days: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=offset_days)).isoformat().replace("+00:00", "Z")


def with_state_sha(state: dict) -> dict:
    data = dict(state)
    data.pop("state_sha256", None)
    data["state_sha256"] = sha256_text(canonical_json(data))
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
            "capability_grant_id": "GRANT-0001",
            "attestation_id": "ATTEST-0001",
        }
        state = with_state_sha(
            {
                "current_main_sha": MAIN_SHA,
                "current_baseline_id": "KAIOS-AI-AGENT-LIFE-ARCHITECTURE-V1",
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
        registry = {
            "agents": {
                "KAIOS-AI-LIFE-CODEX-GM-0001": {
                    "life_id": "KAIOS-AI-LIFE-CODEX-GM-0001",
                    "status": "ACTIVE",
                    "role": ["Company Boot Tester"],
                }
            },
            "attestations": {
                "ATTEST-0001": {
                    "attestation_id": "ATTEST-0001",
                    "life_id": "KAIOS-AI-LIFE-CODEX-GM-0001",
                    "revocation_status": "ACTIVE",
                }
            },
            "capability_grants": {
                "GRANT-0001": {
                    "grant_id": "GRANT-0001",
                    "life_id": "KAIOS-AI-LIFE-CODEX-GM-0001",
                    "instance_id": "CODEX-GM-20260722-SESSION-0001",
                    "workorder_id": "KAIOS-COMPANY-BOOT-RUNTIME-V0.1",
                    "scope_paths": ["KGEN-KAIOS/governance/agents/runtime-v0.1/"],
                    "expires_at": utc(1),
                    "revocation_id_if_any": None,
                }
            },
            "revocations": {},
        }
        return {"session": session, "current_state": state, "agent_registry": registry, "handoff": handoff}

    def write_case(self, case: dict) -> None:
        for name in ("session", "current_state", "agent_registry"):
            (self.tmp / f"{name}.json").write_text(json.dumps(case[name], ensure_ascii=False, indent=2), encoding="utf-8")
        (self.tmp / "parent_handoff.json").write_text(json.dumps(case["handoff"], ensure_ascii=False, indent=2), encoding="utf-8")

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

    def assert_blocked(self, expected_code: str) -> None:
        code, result = self.run_validate()
        self.assertEqual(code, 2)
        self.assertEqual(result["company_boot_status"], "COMPANY_BOOT_FAILED")
        self.assertEqual(result["failure_code"], expected_code)
        for action in ("COMMIT", "PUSH", "PR", "MERGE", "DISPATCH", "DEPLOY"):
            self.assertIn(action, result["blocked_actions"])
        serialized = json.dumps(result, ensure_ascii=False)
        self.assertNotIn("FAKE_SECRET_VALUE", serialized)
        self.assertIn("result_sha256", result)

    def test_happy_path_validate_and_close_session(self) -> None:
        code, result = self.run_validate()
        self.assertEqual(code, 0)
        self.assertEqual(result["company_boot_status"], "COMPANY_BOOT_PASS")
        self.assertTrue(result["main_sha_match"])
        self.assertEqual(result["current_main_sha"], MAIN_SHA)
        self.assertIn("CREATE_HANDOFF_RECORD", result["authorized_actions"])
        self.assertIn("PUSH", result["forbidden_actions"])

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
        self.base["agent_registry"]["revocations"]["GRANT-0001"] = {"reason": "test"}
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
                "status": "ACTIVE",
                "workorder_id": "KAIOS-COMPANY-BOOT-RUNTIME-V0.1",
                "holder_instance_id": "CODEX-GM-20260722-SESSION-9999",
            }
        ]
        self.base["current_state"] = with_state_sha(self.base["current_state"])
        self.write_case(self.base)
        self.assert_blocked("SESSION_LOCK_CONFLICT")


if __name__ == "__main__":
    unittest.main()
