from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .evidence import evidence_id, sha256_file, stamp_result_sha256
from .models import BLOCKED_ACTIONS, FORBIDDEN_ACTIONS, BootFailure, BootStatus, Stage
from .state_machine import StateTracker
from .validators import (
    load_json,
    validate_attestation,
    validate_boot_result,
    validate_capability,
    validate_common_inputs,
    validate_current_state,
    validate_parent_handoff,
)


def write_json(path: Path, data: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def utc_now_text() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def failure_result(
    exc: BootFailure,
    session: dict[str, Any] | None = None,
    tracker: StateTracker | None = None,
    last_successful_state: Stage | None = None,
) -> dict[str, Any]:
    session = session or {}
    state_path = tracker.path if tracker else [Stage.NEW.value, Stage.FAILED.value]
    state_evidence = tracker.evidence_ids if tracker else []
    result = {
        "company_boot_status": BootStatus.FAILED.value,
        "failure_code": exc.code.value,
        "failure_stage": exc.stage.value,
        "failure_state": tracker.current.value if tracker else exc.terminal_state.value,
        "last_successful_state": (last_successful_state or (tracker.current if tracker else Stage.NEW)).value,
        "life_id_if_known": session.get("life_id"),
        "instance_id_if_known": session.get("instance_id"),
        "state_path": state_path,
        "evidence_ids": state_evidence + [evidence_id("BOOTFAIL", exc.code.value, exc.stage.value, exc.message)],
        "blocked_actions": BLOCKED_ACTIONS,
        "failed_at": utc_now_text(),
    }
    return stamp_result_sha256(result)


def validate_session(args: argparse.Namespace) -> int:
    session: dict[str, Any] | None = None
    tracker = StateTracker()
    try:
        tracker.transition(Stage.BOOTING)
        session = load_json(Path(args.session))
        current_state = load_json(Path(args.current_state))
        agent_registry = load_json(Path(args.agent_registry))
        handoff_path = Path(args.handoff)
        handoff = load_json(handoff_path)
        handoff_sha = sha256_file(handoff_path)
        agent, life_id, instance_id, attestation_id, grant_id, base_main_sha, assigned_workorder = validate_common_inputs(
            session, current_state, agent_registry, handoff
        )
        attestation = validate_attestation(session, agent_registry, agent, life_id, instance_id, attestation_id)
        tracker.transition(Stage.IDENTITY_VERIFIED)
        grant = validate_capability(session, agent_registry, life_id, instance_id, grant_id, assigned_workorder)
        tracker.transition(Stage.CAPABILITY_VERIFIED)
        validate_current_state(session, current_state, base_main_sha, assigned_workorder)
        tracker.transition(Stage.STATE_VERIFIED)
        validate_parent_handoff(session, handoff, handoff_sha)
        tracker.transition(Stage.HANDOFF_LOADED)
        tracker.transition(Stage.READ_ONLY_ACTIVE)

        current_main_sha = current_state["current_main_sha"]
        result = {
            "company_boot_status": BootStatus.PASS.value,
            "life_id": life_id,
            "instance_id": instance_id,
            "attestation_status": "VALID",
            "capability_status": "VALID",
            "revocation_status": "ACTIVE",
            "current_main_sha": current_main_sha,
            "expected_main_sha": session["base_main_sha"],
            "main_sha_match": session["base_main_sha"] == current_main_sha,
            "current_baseline_id": current_state["current_baseline_id"],
            "expected_baseline_id": session["expected_baseline_id"],
            "baseline_status": current_state["baseline_status"],
            "baseline_validation_passed": True,
            "parent_handoff_status": "FOUND" if session.get("parent_handoff_id") else "ROOT_SESSION_AUTHORIZED",
            "assigned_workorder_status": "VALID",
            "session_lock_status": "READ_ONLY_ALLOWED",
            "session_lock_holder_instance_id": instance_id,
            "state_path": tracker.path,
            "authorized_actions": grant["capabilities"],
            "forbidden_actions": FORBIDDEN_ACTIONS,
            "evidence_ids": [
                evidence_id("BOOT", life_id, instance_id, current_main_sha),
                evidence_id("HANDOFF", args.handoff, handoff_sha),
            ] + tracker.evidence_ids,
            "files_read": [
                str(Path(args.session)),
                str(Path(args.current_state)),
                str(Path(args.agent_registry)),
                str(Path(args.handoff)),
            ],
            "identity_binding": {
                "life_id": life_id,
                "instance_id": instance_id,
                "attestation_id": attestation["attestation_id"],
                "capability_grant_id": grant["grant_id"],
                "workorder_id": assigned_workorder,
            },
            "stale": False,
            "conflicted": False,
            "booted_at": utc_now_text(),
        }
        write_json(Path(args.output), stamp_result_sha256(result))
        return 0
    except BootFailure as exc:
        last_successful_state = tracker.current
        tracker.terminate(exc.terminal_state)
        write_json(Path(args.output), failure_result(exc, session, tracker, last_successful_state))
        return 2


def close_session(args: argparse.Namespace) -> int:
    try:
        boot_result = load_json(Path(args.boot_result))
        validate_boot_result(boot_result)
    except BootFailure:
        return 2

    archive_dir = Path(args.archive_dir)
    now = utc_now_text()
    handoff = {
        "handoff_id": f"HANDOFF-{boot_result['instance_id']}",
        "from_life_id": boot_result["life_id"],
        "from_instance_id": boot_result["instance_id"],
        "to_role": "NEXT_COMPANY_BOOT_SESSION",
        "workorder_id": boot_result["identity_binding"]["workorder_id"],
        "base_sha": boot_result["expected_main_sha"],
        "ending_sha": boot_result["current_main_sha"],
        "files_read": boot_result.get("files_read", []),
        "files_changed": [],
        "actions_completed": ["VALIDATE_SESSION", "READ_ONLY_AUDIT", "CREATE_HANDOFF_RECORD", "ARCHIVE_SESSION"],
        "actions_not_completed": [],
        "tests_run": [],
        "test_results": [],
        "open_blockers": [],
        "known_risks": [],
        "human_decisions": [],
        "forbidden_next_actions": FORBIDDEN_ACTIONS,
        "required_next_actions": ["START_NEW_SESSION_BIRTH_RECORD_BEFORE_FUTURE_WORK"],
        "recovery_point": "RECOVERY-20260721-KAIOS-AGENT-LIFE-ARCHITECTURE-V1",
        "evidence_paths": [str(Path(args.boot_result))],
        "created_at": now,
        "signature": "KAIOS_COMPANY_BOOT_RUNTIME_V0_1",
        "session_status": "ARCHIVED",
        "lock_status": "RELEASED",
        "ending_main_sha": boot_result["current_main_sha"],
    }
    tracker = StateTracker()
    for stage in (
        Stage.BOOTING,
        Stage.IDENTITY_VERIFIED,
        Stage.CAPABILITY_VERIFIED,
        Stage.STATE_VERIFIED,
        Stage.HANDOFF_LOADED,
        Stage.READ_ONLY_ACTIVE,
        Stage.HANDOFF_WRITTEN,
        Stage.ARCHIVED,
    ):
        tracker.transition(stage)
    handoff["state_path"] = tracker.path
    handoff["evidence_ids"] = handoff["evidence_ids"] + tracker.evidence_ids if "evidence_ids" in handoff else tracker.evidence_ids
    handoff = stamp_result_sha256(handoff)
    output = Path(args.handoff_output)
    archive_dir.mkdir(parents=True, exist_ok=True)
    write_json(output, handoff)
    archived = archive_dir / output.name
    write_json(archived, handoff)
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="company_boot")
    sub = parser.add_subparsers(dest="command", required=True)

    validate = sub.add_parser("validate-session")
    validate.add_argument("--session", required=True)
    validate.add_argument("--current-state", required=True)
    validate.add_argument("--agent-registry", required=True)
    validate.add_argument("--handoff", required=True)
    validate.add_argument("--output", required=True)
    validate.set_defaults(func=validate_session)

    close = sub.add_parser("close-session")
    close.add_argument("--boot-result", required=True)
    close.add_argument("--handoff-output", required=True)
    close.add_argument("--archive-dir", required=True)
    close.set_defaults(func=close_session)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
