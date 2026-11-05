from __future__ import annotations

import json
import re
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .evidence import canonical_json, sha256_text, verify_hashes
from .models import AUTHORIZED_ACTIONS, BootFailure, FailureCode, Stage


SECRET_PATTERNS = [
    re.compile(r"(?i)\btoken\s*[:=]\s*\S+"),
    re.compile(r"(?i)\bpassword\s*[:=]\s*\S+"),
    re.compile(r"(?i)private[_ -]?key\s*[:=]\s*\S+"),
    re.compile(r"(?i)\bmnemonic\s*[:=]\s*\S+"),
    re.compile(r"(?i)wallet[_ -]?seed\s*[:=]\s*\S+"),
    re.compile(r"(?i)\bcookie\s*[:=]\s*\S+"),
    re.compile(r"(?i)authorization\s*:\s*\S+"),
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
]

APPROVED_BASELINE_STATUSES = {"ARCHITECTURE_BASELINE_APPROVED"}
ATTESTATION_SCOPE = "KAIOS_COMPANY_BOOT_RUNTIME_V0_1"
RUNTIME_SCOPE_PREFIX = "KGEN-KAIOS/governance/agents/runtime-v0.1/"
REGISTRY_FIELDS = {"agents", "attestations", "capability_grants", "revocations", "workorders"}
AGENT_FIELDS = {"life_id", "status", "role", "attestation_ids", "allowed_capability_profiles"}
ATTESTATION_FIELDS = {
    "attestation_id", "life_id", "instance_id", "issued_at", "expires_at", "status", "revocation_status",
    "approved_by", "approval_evidence_id", "issuer", "scope", "registry_entry_sha256", "integrity_sha256",
}
GRANT_FIELDS = {
    "grant_id", "life_id", "instance_id", "workorder_id", "capabilities", "scope_paths", "issued_at",
    "expires_at", "status", "revocation_id_if_any", "integrity_sha256",
}
REVOCATION_FIELDS = {"revocation_id", "grant_id", "status", "reason", "revoked_at", "revoked_by", "integrity_sha256"}
WORKORDER_FIELDS = {"workorder_id", "status", "authorized_paths", "base_sha", "integrity_sha256"}
SESSION_FIELDS = {
    "session_birth_id", "life_id", "instance_id", "conversation_channel", "parent_handoff_id", "parent_handoff_sha256",
    "assigned_workorder", "base_main_sha", "expected_baseline_id", "capability_grant_id", "attestation_id",
    "initial_status", "allow_stale", "authorized_workorders",
}
SESSION_REQUIRED = {
    "session_birth_id", "life_id", "instance_id", "conversation_channel", "assigned_workorder", "base_main_sha",
    "expected_baseline_id", "capability_grant_id", "attestation_id",
}
CURRENT_STATE_FIELDS = {
    "current_main_sha", "current_baseline_id", "baseline_status", "current_recovery_point", "active_workorders",
    "superseded_workorders", "active_sessions", "active_agent_sessions", "revoked_sessions", "last_human_decision_id",
    "updated_at", "updated_by", "session_locks", "state_sha256", "source_type", "conflicting_current_state",
}
CURRENT_STATE_REQUIRED = CURRENT_STATE_FIELDS - {"source_type", "conflicting_current_state"}
PARENT_HANDOFF_FIELDS = {"handoff_id", "from_life_id", "from_instance_id", "ending_sha"}
SESSION_LOCK_FIELDS = {"lock_id", "workorder_id", "holder_instance_id", "scope", "acquired_at", "heartbeat_at", "expires_at", "status"}


def load_json(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001 - CLI turns this into safe failure JSON.
        raise BootFailure(FailureCode.INVALID_JSON, Stage.BOOTING, str(exc)) from exc
    if not isinstance(data, dict):
        raise BootFailure(FailureCode.INVALID_JSON, Stage.BOOTING, "top-level JSON must be object")
    return data


def require(data: dict[str, Any], field: str, stage: Stage) -> Any:
    if field not in data or data[field] in ("", None):
        raise BootFailure(FailureCode.MISSING_FIELD, stage, f"missing field: {field}")
    return data[field]


def require_baseline(data: dict[str, Any], field: str) -> Any:
    if field not in data or data[field] in ("", None):
        raise BootFailure(FailureCode.BASELINE_VALIDATION_FAILED, Stage.CONFLICTED, f"missing baseline field: {field}")
    return data[field]


def parse_time(value: str) -> datetime:
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except (TypeError, ValueError) as exc:
        raise ValueError("invalid timestamp") from exc
    if parsed.tzinfo is None:
        raise ValueError("timestamp must include timezone")
    return parsed


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def contains_secret(value: Any) -> bool:
    text = canonical_json(value) if not isinstance(value, str) else value
    return any(pattern.search(text) for pattern in SECRET_PATTERNS)


def validate_state_sha(current_state: dict[str, Any]) -> None:
    expected = current_state.get("state_sha256")
    if not expected:
        raise BootFailure(FailureCode.STATE_SHA_MISMATCH, Stage.STATE_VERIFIED, "missing state_sha256", Stage.CONFLICTED)
    data = dict(current_state)
    data.pop("state_sha256", None)
    actual = sha256_text(canonical_json(data))
    if actual != expected:
        raise BootFailure(FailureCode.STATE_SHA_MISMATCH, Stage.STATE_VERIFIED, "state_sha256 mismatch", Stage.CONFLICTED)


def find_agent(agent_registry: dict[str, Any], life_id: str) -> dict[str, Any]:
    agents = agent_registry.get("agents", {})
    if isinstance(agents, list):
        for agent in agents:
            if agent.get("life_id") == life_id:
                return agent
    elif isinstance(agents, dict) and life_id in agents:
        return agents[life_id]
    raise BootFailure(FailureCode.FAKE_LIFE_ID, Stage.BOOTING, "Life ID not found")


def find_mapping(registry: dict[str, Any], section: str, key: str, code: FailureCode, stage: Stage) -> dict[str, Any]:
    data = registry.get(section, {})
    if isinstance(data, dict) and key in data and isinstance(data[key], dict):
        return data[key]
    raise BootFailure(code, stage, f"{section} not found: {key}")


def record_hash(record: dict[str, Any], field: str) -> str:
    data = dict(record)
    data.pop(field, None)
    return sha256_text(canonical_json(data))


def validate_record_fields(
    record: Any, allowed: set[str], required: set[str], code: FailureCode, stage: Stage, label: str, terminal: Stage = Stage.FAILED
) -> None:
    if not isinstance(record, dict) or not required.issubset(record) or not set(record).issubset(allowed):
        raise BootFailure(code, stage, f"{label} schema mismatch", terminal)


def validate_registry_shape(agent_registry: dict[str, Any]) -> None:
    if set(agent_registry) != REGISTRY_FIELDS:
        raise BootFailure(FailureCode.ATTESTATION_VALIDATION_FAILED, Stage.BOOTING, "agent registry schema mismatch")
    for key in REGISTRY_FIELDS:
        if not isinstance(agent_registry[key], dict):
            raise BootFailure(FailureCode.ATTESTATION_VALIDATION_FAILED, Stage.BOOTING, f"registry section is not an object: {key}")
    for record in agent_registry["agents"].values():
        validate_record_fields(record, AGENT_FIELDS, AGENT_FIELDS, FailureCode.FAKE_LIFE_ID, Stage.BOOTING, "agent")
    for record in agent_registry["attestations"].values():
        validate_record_fields(
            record, ATTESTATION_FIELDS, ATTESTATION_FIELDS, FailureCode.ATTESTATION_VALIDATION_FAILED, Stage.IDENTITY_VERIFIED, "attestation"
        )
    for record in agent_registry["capability_grants"].values():
        validate_record_fields(
            record, GRANT_FIELDS, GRANT_FIELDS, FailureCode.CAPABILITY_VALIDATION_FAILED, Stage.CAPABILITY_VERIFIED, "capability grant"
        )
    for record in agent_registry["revocations"].values():
        validate_record_fields(
            record, REVOCATION_FIELDS, REVOCATION_FIELDS, FailureCode.CAPABILITY_VALIDATION_FAILED, Stage.CAPABILITY_VERIFIED, "revocation"
        )
    for record in agent_registry["workorders"].values():
        validate_record_fields(
            record, WORKORDER_FIELDS, WORKORDER_FIELDS, FailureCode.UNAUTHORIZED_WORKORDER, Stage.CAPABILITY_VERIFIED, "WorkOrder"
        )


def validate_input_shapes(session: dict[str, Any], current_state: dict[str, Any], handoff: dict[str, Any]) -> None:
    validate_record_fields(session, SESSION_FIELDS, SESSION_REQUIRED, FailureCode.MISSING_FIELD, Stage.BOOTING, "session birth")
    if not {"current_baseline_id", "baseline_status"}.issubset(current_state):
        raise BootFailure(
            FailureCode.BASELINE_VALIDATION_FAILED, Stage.STATE_VERIFIED, "current state baseline fields missing", Stage.CONFLICTED
        )
    validate_record_fields(
        current_state, CURRENT_STATE_FIELDS, CURRENT_STATE_REQUIRED, FailureCode.CURRENT_STATE_CONFLICT, Stage.STATE_VERIFIED, "current state", Stage.CONFLICTED
    )
    validate_record_fields(
        handoff, PARENT_HANDOFF_FIELDS, PARENT_HANDOFF_FIELDS, FailureCode.MISSING_PARENT_HANDOFF, Stage.HANDOFF_LOADED, "parent handoff"
    )
    locks = current_state.get("session_locks")
    if not isinstance(locks, list):
        raise BootFailure(FailureCode.CURRENT_STATE_CONFLICT, Stage.STATE_VERIFIED, "session_locks must be an array", Stage.CONFLICTED)
    for lock in locks:
        validate_record_fields(
            lock, SESSION_LOCK_FIELDS, SESSION_LOCK_FIELDS, FailureCode.SESSION_LOCK_CONFLICT, Stage.STATE_VERIFIED, "session lock", Stage.CONFLICTED
        )


def require_timestamp(record: dict[str, Any], field: str, code: FailureCode, stage: Stage, terminal: Stage) -> datetime:
    try:
        return parse_time(require(record, field, stage))
    except (BootFailure, ValueError) as exc:
        raise BootFailure(code, stage, f"invalid or missing {field}", terminal) from exc


def validate_common_inputs(
    session: dict[str, Any],
    current_state: dict[str, Any],
    agent_registry: dict[str, Any],
    handoff: dict[str, Any],
) -> tuple[dict[str, Any], str, str, str, str, str, str]:
    if contains_secret(session) or contains_secret(current_state) or contains_secret(agent_registry) or contains_secret(handoff):
        raise BootFailure(FailureCode.SECRET_IN_OUTPUT, Stage.NEW, "secret-like value found in input", Stage.FAILED)
    validate_input_shapes(session, current_state, handoff)
    validate_registry_shape(agent_registry)

    life_id = require(session, "life_id", Stage.NEW)
    instance_id = require(session, "instance_id", Stage.NEW)
    attestation_id = require(session, "attestation_id", Stage.NEW)
    grant_id = require(session, "capability_grant_id", Stage.NEW)
    base_main_sha = require(session, "base_main_sha", Stage.NEW)
    assigned_workorder = require(session, "assigned_workorder", Stage.NEW)
    expected_baseline_id = require_baseline(session, "expected_baseline_id")

    agent = find_agent(agent_registry, life_id)
    if agent.get("status") != "ACTIVE":
        raise BootFailure(FailureCode.FAKE_LIFE_ID, Stage.BOOTING, "Life ID is not active", Stage.FAILED)

    existing_sessions = current_state.get("active_sessions", []) + current_state.get("active_agent_sessions", [])
    if instance_id in existing_sessions:
        raise BootFailure(FailureCode.DUPLICATE_SESSION_ID, Stage.BOOTING, "duplicate instance_id", Stage.CONFLICTED)

    return agent, life_id, instance_id, attestation_id, grant_id, base_main_sha, assigned_workorder


def validate_attestation(
    session: dict[str, Any], agent_registry: dict[str, Any], agent: dict[str, Any], life_id: str, instance_id: str, attestation_id: str
) -> dict[str, Any]:
    attestation = find_mapping(
        agent_registry, "attestations", attestation_id, FailureCode.FAKE_ATTESTATION, Stage.IDENTITY_VERIFIED
    )
    code = FailureCode.ATTESTATION_VALIDATION_FAILED
    terminal = Stage.FAILED
    if attestation_id not in agent.get("attestation_ids", []):
        raise BootFailure(code, Stage.IDENTITY_VERIFIED, "attestation is not linked from agent registry", terminal)
    if ATTESTATION_SCOPE not in agent.get("allowed_capability_profiles", []):
        raise BootFailure(code, Stage.IDENTITY_VERIFIED, "agent registry does not allow attestation scope", terminal)
    if attestation.get("attestation_id") != attestation_id:
        raise BootFailure(code, Stage.IDENTITY_VERIFIED, "attestation ID mismatch", terminal)
    if attestation.get("life_id") != life_id:
        raise BootFailure(code, Stage.IDENTITY_VERIFIED, "attestation Life ID mismatch", terminal)
    if attestation.get("instance_id") != instance_id:
        raise BootFailure(code, Stage.IDENTITY_VERIFIED, "attestation Instance ID mismatch", terminal)
    status = attestation.get("status")
    if status in {"REVOKED", "SUPERSEDED", "EXPIRED"}:
        raise BootFailure(code, Stage.IDENTITY_VERIFIED, f"attestation status is {status}", Stage.REVOKED)
    if status != "ACTIVE" or attestation.get("revocation_status") != "ACTIVE":
        raise BootFailure(code, Stage.IDENTITY_VERIFIED, "attestation is not active", terminal)
    issued_at = require_timestamp(attestation, "issued_at", code, Stage.IDENTITY_VERIFIED, terminal)
    expires_at = require_timestamp(attestation, "expires_at", code, Stage.IDENTITY_VERIFIED, Stage.REVOKED)
    if issued_at > now_utc() or expires_at <= now_utc():
        raise BootFailure(code, Stage.IDENTITY_VERIFIED, "attestation is expired or not yet active", Stage.REVOKED)
    for field in ("approved_by", "approval_evidence_id", "issuer"):
        if not attestation.get(field):
            raise BootFailure(code, Stage.IDENTITY_VERIFIED, f"missing attestation evidence: {field}", terminal)
    if attestation.get("scope") != ATTESTATION_SCOPE:
        raise BootFailure(code, Stage.IDENTITY_VERIFIED, "attestation scope mismatch", terminal)
    expected_registry_hash = sha256_text(canonical_json(agent))
    if attestation.get("registry_entry_sha256") != expected_registry_hash:
        raise BootFailure(code, Stage.IDENTITY_VERIFIED, "attestation registry link hash mismatch", terminal)
    integrity_hash = attestation.get("integrity_sha256")
    if not integrity_hash or integrity_hash != record_hash(attestation, "integrity_sha256"):
        raise BootFailure(code, Stage.IDENTITY_VERIFIED, "attestation integrity hash mismatch", terminal)
    return attestation


def scope_is_safe(path: str) -> bool:
    normalized = path.replace("\\", "/")
    if not normalized or normalized in {".", "./"} or "*" in normalized:
        return False
    if normalized.startswith("/") or re.match(r"^[A-Za-z]:/", normalized):
        return False
    if ".." in normalized.split("/"):
        return False
    return normalized.startswith(RUNTIME_SCOPE_PREFIX)


def validate_capability(
    session: dict[str, Any], agent_registry: dict[str, Any], life_id: str, instance_id: str, grant_id: str, assigned_workorder: str
) -> dict[str, Any]:
    workorder = agent_registry.get("workorders", {}).get(assigned_workorder)
    if assigned_workorder not in session.get("authorized_workorders", [assigned_workorder]) or not isinstance(workorder, dict):
        raise BootFailure(FailureCode.UNAUTHORIZED_WORKORDER, Stage.CAPABILITY_VERIFIED, "session WorkOrder is not authorized")
    grant = find_mapping(
        agent_registry, "capability_grants", grant_id, FailureCode.CAPABILITY_VALIDATION_FAILED, Stage.CAPABILITY_VERIFIED
    )
    code = FailureCode.CAPABILITY_VALIDATION_FAILED
    if grant.get("grant_id") != grant_id or grant.get("life_id") != life_id or grant.get("instance_id") != instance_id:
        raise BootFailure(code, Stage.CAPABILITY_VERIFIED, "grant identity binding mismatch", Stage.FAILED)
    if grant.get("workorder_id") != assigned_workorder:
        raise BootFailure(code, Stage.CAPABILITY_VERIFIED, "grant WorkOrder mismatch", Stage.FAILED)
    if grant.get("status") != "ACTIVE":
        terminal = Stage.REVOKED if grant.get("status") in {"REVOKED", "EXPIRED"} else Stage.FAILED
        raise BootFailure(code, Stage.CAPABILITY_VERIFIED, "grant status is not active", terminal)
    issued_at = require_timestamp(grant, "issued_at", code, Stage.CAPABILITY_VERIFIED, Stage.FAILED)
    expires_at = require_timestamp(grant, "expires_at", FailureCode.EXPIRED_CAPABILITY, Stage.CAPABILITY_VERIFIED, Stage.REVOKED)
    if issued_at > now_utc() or expires_at <= now_utc():
        raise BootFailure(FailureCode.EXPIRED_CAPABILITY, Stage.CAPABILITY_VERIFIED, "grant expired or not yet active", Stage.REVOKED)
    revocation = agent_registry.get("revocations", {}).get(grant_id)
    if revocation and revocation.get("integrity_sha256") != record_hash(revocation, "integrity_sha256"):
        raise BootFailure(code, Stage.CAPABILITY_VERIFIED, "revocation integrity hash mismatch", Stage.CONFLICTED)
    if grant.get("revocation_id_if_any") or revocation:
        raise BootFailure(FailureCode.REVOKED_CAPABILITY, Stage.CAPABILITY_VERIFIED, "grant revoked", Stage.REVOKED)
    capabilities = grant.get("capabilities")
    if not isinstance(capabilities, list) or not capabilities or any(action not in AUTHORIZED_ACTIONS for action in capabilities):
        raise BootFailure(code, Stage.CAPABILITY_VERIFIED, "grant contains missing or unauthorized capability", Stage.FAILED)
    scope_paths = grant.get("scope_paths")
    if not isinstance(workorder, dict) or workorder.get("status") != "ACTIVE":
        raise BootFailure(FailureCode.UNAUTHORIZED_WORKORDER, Stage.CAPABILITY_VERIFIED, "WorkOrder registry record missing or inactive")
    if workorder.get("workorder_id") != assigned_workorder:
        raise BootFailure(FailureCode.UNAUTHORIZED_WORKORDER, Stage.CAPABILITY_VERIFIED, "WorkOrder identity mismatch")
    if workorder.get("integrity_sha256") != record_hash(workorder, "integrity_sha256"):
        raise BootFailure(FailureCode.UNAUTHORIZED_WORKORDER, Stage.CAPABILITY_VERIFIED, "WorkOrder integrity hash mismatch", Stage.CONFLICTED)
    authorized_paths = workorder.get("authorized_paths")
    if not isinstance(scope_paths, list) or scope_paths != authorized_paths or not all(isinstance(path, str) and scope_is_safe(path) for path in scope_paths):
        raise BootFailure(code, Stage.CAPABILITY_VERIFIED, "grant scope is unsafe or does not match WorkOrder", Stage.FAILED)
    integrity_hash = grant.get("integrity_sha256")
    if not integrity_hash or integrity_hash != record_hash(grant, "integrity_sha256"):
        raise BootFailure(code, Stage.CAPABILITY_VERIFIED, "grant integrity hash mismatch", Stage.FAILED)
    return grant


def validate_current_state(
    session: dict[str, Any], current_state: dict[str, Any], base_main_sha: str, assigned_workorder: str
) -> None:
    expected_baseline_id = require_baseline(session, "expected_baseline_id")

    if current_state.get("conflicting_current_state"):
        raise BootFailure(FailureCode.CURRENT_STATE_CONFLICT, Stage.STATE_VERIFIED, "current state conflict", Stage.CONFLICTED)
    if current_state.get("source_type") == "CACHE":
        raise BootFailure(FailureCode.CACHE_AS_CURRENT_TRUTH, Stage.STATE_VERIFIED, "cache cannot be current truth")
    validate_state_sha(current_state)

    current_main_sha = require(current_state, "current_main_sha", Stage.STATE_VERIFIED)
    current_baseline_id = require_baseline(current_state, "current_baseline_id")
    baseline_status = require_baseline(current_state, "baseline_status")
    if expected_baseline_id != current_baseline_id:
        raise BootFailure(FailureCode.BASELINE_VALIDATION_FAILED, Stage.STATE_VERIFIED, "expected_baseline_id does not match current_baseline_id", Stage.STALE)
    if baseline_status not in APPROVED_BASELINE_STATUSES:
        raise BootFailure(FailureCode.BASELINE_VALIDATION_FAILED, Stage.STATE_VERIFIED, f"baseline_status not approved: {baseline_status}", Stage.CONFLICTED)

    if base_main_sha != current_main_sha:
        if session.get("allow_stale") is True:
            raise BootFailure(FailureCode.STALE_SESSION, Stage.STATE_VERIFIED, "stale session", Stage.STALE)
        raise BootFailure(FailureCode.WRONG_MAIN_SHA, Stage.STATE_VERIFIED, "base_main_sha does not match current_main_sha", Stage.STALE)

    if assigned_workorder not in current_state.get("active_workorders", []):
        raise BootFailure(FailureCode.UNAUTHORIZED_WORKORDER, Stage.STATE_VERIFIED, "WorkOrder is not active")

    for lock in current_state.get("session_locks", []):
        if lock.get("status") == "ACTIVE" and lock.get("workorder_id") == assigned_workorder and lock.get("holder_instance_id") != session["instance_id"]:
            raise BootFailure(FailureCode.SESSION_LOCK_CONFLICT, Stage.STATE_VERIFIED, "active lock held by another session", Stage.CONFLICTED)


def validate_parent_handoff(session: dict[str, Any], handoff: dict[str, Any], handoff_sha256: str) -> None:

    parent_handoff_id = session.get("parent_handoff_id")
    if not parent_handoff_id and session.get("initial_status") not in ("ROOT_SESSION", "HUMAN_AUTHORIZED_ORPHAN_SESSION"):
        raise BootFailure(FailureCode.MISSING_PARENT_HANDOFF, Stage.HANDOFF_LOADED, "missing parent handoff")
    if parent_handoff_id and handoff.get("handoff_id") != parent_handoff_id:
        raise BootFailure(FailureCode.MISSING_PARENT_HANDOFF, Stage.HANDOFF_LOADED, "handoff ID mismatch")
    expected_handoff_sha = session.get("parent_handoff_sha256")
    if expected_handoff_sha and expected_handoff_sha != handoff_sha256:
        raise BootFailure(FailureCode.HANDOFF_SHA_MISMATCH, Stage.HANDOFF_LOADED, "handoff sha mismatch", Stage.CONFLICTED)


def validate_boot_inputs(
    session: dict[str, Any], current_state: dict[str, Any], agent_registry: dict[str, Any], handoff: dict[str, Any], handoff_sha256: str
) -> None:
    agent, life_id, instance_id, attestation_id, grant_id, base_main_sha, assigned_workorder = validate_common_inputs(
        session, current_state, agent_registry, handoff
    )
    validate_attestation(session, agent_registry, agent, life_id, instance_id, attestation_id)
    validate_capability(session, agent_registry, life_id, instance_id, grant_id, assigned_workorder)
    validate_current_state(session, current_state, base_main_sha, assigned_workorder)
    validate_parent_handoff(session, handoff, handoff_sha256)


def validate_boot_result(result: dict[str, Any]) -> None:
    required = {
        "company_boot_status", "life_id", "instance_id", "attestation_status", "capability_status", "revocation_status",
        "current_main_sha", "expected_main_sha", "main_sha_match", "current_baseline_id", "expected_baseline_id",
        "baseline_status", "baseline_validation_passed", "parent_handoff_status", "assigned_workorder_status",
        "session_lock_status", "session_lock_holder_instance_id", "state_path", "authorized_actions", "forbidden_actions",
        "evidence_ids", "files_read", "identity_binding", "stale", "conflicted", "booted_at", "content_sha256",
        "record_sha256", "result_sha256",
    }
    if set(result) != required:
        raise BootFailure(FailureCode.INVALID_BOOT_RESULT, Stage.READ_ONLY_ACTIVE, "Boot Result fields are missing or unknown")
    if contains_secret(result):
        raise BootFailure(FailureCode.INVALID_BOOT_RESULT, Stage.READ_ONLY_ACTIVE, "Boot Result contains secret-like content")
    if not verify_hashes(result):
        raise BootFailure(FailureCode.INVALID_BOOT_RESULT, Stage.READ_ONLY_ACTIVE, "Boot Result hash verification failed")
    if result.get("company_boot_status") != "COMPANY_BOOT_PASS" or result.get("state_path", [])[-1:] != [Stage.READ_ONLY_ACTIVE.value]:
        raise BootFailure(FailureCode.INVALID_BOOT_RESULT, Stage.READ_ONLY_ACTIVE, "Boot Result is not in approved pre-close state")
    if not result.get("life_id") or not result.get("instance_id"):
        raise BootFailure(FailureCode.INVALID_BOOT_RESULT, Stage.READ_ONLY_ACTIVE, "Boot Result identity missing")
    binding = result.get("identity_binding")
    if not isinstance(binding, dict) or set(binding) != {"life_id", "instance_id", "attestation_id", "capability_grant_id", "workorder_id"}:
        raise BootFailure(FailureCode.INVALID_BOOT_RESULT, Stage.READ_ONLY_ACTIVE, "Boot Result identity binding invalid")
    if binding["life_id"] != result["life_id"] or binding["instance_id"] != result["instance_id"]:
        raise BootFailure(FailureCode.INVALID_BOOT_RESULT, Stage.READ_ONLY_ACTIVE, "Boot Result identity binding mismatch")
    if result.get("attestation_status") != "VALID" or result.get("capability_status") != "VALID" or result.get("revocation_status") != "ACTIVE":
        raise BootFailure(FailureCode.INVALID_BOOT_RESULT, Stage.READ_ONLY_ACTIVE, "identity or capability validation did not pass")
    if result.get("baseline_validation_passed") is not True or result.get("current_baseline_id") != result.get("expected_baseline_id"):
        raise BootFailure(FailureCode.INVALID_BOOT_RESULT, Stage.READ_ONLY_ACTIVE, "baseline validation did not pass")
    if result.get("baseline_status") not in APPROVED_BASELINE_STATUSES or result.get("main_sha_match") is not True:
        raise BootFailure(FailureCode.INVALID_BOOT_RESULT, Stage.READ_ONLY_ACTIVE, "main or baseline state is stale")
    if result.get("stale") is not False or result.get("conflicted") is not False:
        raise BootFailure(FailureCode.INVALID_BOOT_RESULT, Stage.READ_ONLY_ACTIVE, "Boot Result is stale or conflicted")
    if result.get("session_lock_status") != "READ_ONLY_ALLOWED" or result.get("session_lock_holder_instance_id") != result["instance_id"]:
        raise BootFailure(FailureCode.INVALID_BOOT_RESULT, Stage.READ_ONLY_ACTIVE, "session lock identity mismatch")
    actions = result.get("authorized_actions")
    if not isinstance(actions, list) or not actions or any(action not in AUTHORIZED_ACTIONS for action in actions):
        raise BootFailure(FailureCode.INVALID_BOOT_RESULT, Stage.READ_ONLY_ACTIVE, "Boot Result contains unauthorized action")
    if not {"CREATE_HANDOFF_RECORD", "ARCHIVE_SESSION", "RELEASE_SESSION_LOCK"}.issubset(actions):
        raise BootFailure(FailureCode.INVALID_BOOT_RESULT, Stage.READ_ONLY_ACTIVE, "Boot Result lacks close-session capabilities")
    if not isinstance(result.get("evidence_ids"), list) or not result["evidence_ids"]:
        raise BootFailure(FailureCode.INVALID_BOOT_RESULT, Stage.READ_ONLY_ACTIVE, "Boot Result evidence missing")


# Engineering receipts are a separate, non-authorizing prerequisite. They must
# never be accepted as an attestation, capability, Company Boot Result or grant.
WORKFLOW_BOOT_FILE = "PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md"
WORKFLOW_STAGES = ("READ_CANON", "LINEAGE", "EXISTING_RUNTIME", "ACTIVE_WORK", "DESIGN", "CODE", "TEST")
WORKFLOW_COMPANY_CHECKS = frozenset({
    "company_runtime", "worker_registry", "active_work", "handoffs", "queue", "prs",
    "ci", "p0_p1", "owners", "closeout", "outages", "human_decisions",
})
WORKFLOW_REQUIRED_SOURCES = frozenset({
    "PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md",
    "docs/maps/README.md",
    "KGEN/whitepaper/math/KGEN_SignedUniverse_MathLaw_V7.5-GENESIS-01.md",
    "KGEN-Canon/KGEN_CANON_MASTER.json",
    "KGEN-KAIOS/constitution/KAIOS_CONSTITUTION.md",
    "KGEN-AI-Company/WORKSPACE_POLICY.md",
    "KGEN-Agent-Office/DO_NOT_TOUCH.md",
    "KGEN-KAIOS/worker_registry.json",
    "KGEN-Organization/WorkOrders/WORK_QUEUE.md",
    "KGEN-KAIOS/governance/autopilot/company_boot_manifest.json",
})
WORKFLOW_LINEAGE_INDEXES = frozenset({
    "neural/NEURAL_MAP.json", "neural/ORGAN_INDEX.json", "neural/RUNTIME_DEPENDENCY.json",
    "docs/KGEN_MASTER_INDEX.md", "KGEN_MASTER_LIBRARY_INDEX.md",
})


class WorkflowEvidenceError(ValueError):
    """Safe failure code only; do not echo untrusted receipt contents."""


def _workflow_check(condition: bool, code: str) -> None:
    if not condition:
        raise WorkflowEvidenceError(code)


def _workflow_shape(value: Any, keys: set[str]) -> None:
    _workflow_check(isinstance(value, dict) and set(value) == keys, "WORKFLOW_SCHEMA_MISMATCH")


def _workflow_text(value: Any) -> bool:
    return isinstance(value, str) and 0 < len(value) <= 1024 and value == value.strip() and not any(ord(c) < 32 for c in value)


def _workflow_sha(value: Any, size: int = 40) -> bool:
    return isinstance(value, str) and re.fullmatch(r"[0-9a-f]{" + str(size) + r"}", value) is not None


def _workflow_path(value: Any) -> bool:
    return (_workflow_text(value) and not value.startswith(("/", "-")) and "\\" not in value
            and ":" not in value and not any(p in {"", ".", ".."} for p in value.split("/")))


def _workflow_git(repository: Path, *args: str) -> bytes:
    try:
        result = subprocess.run(
            ["git", "--no-replace-objects", "-C", str(repository), *args],
            capture_output=True, check=True, timeout=15,
        )
        return result.stdout
    except (OSError, subprocess.SubprocessError) as exc:
        raise WorkflowEvidenceError("WORKFLOW_GIT_SOURCE_UNAVAILABLE") from exc


def _workflow_sources(repository: Path, main: str) -> dict[str, str]:
    _workflow_check(_workflow_sha(main), "WORKFLOW_INVALID_MAIN")
    actual = _workflow_git(repository, "rev-parse", "--verify", f"{main}^{{commit}}").decode().strip()
    _workflow_check(actual == main, "WORKFLOW_INVALID_MAIN")
    sources = {}
    for entry in _workflow_git(repository, "ls-tree", "-r", "-z", main).split(b"\0"):
        if not entry:
            continue
        info, path = entry.split(b"\t", 1)
        mode, kind, blob = info.split()
        # Symlinks, submodules and directory objects are not readable source receipts.
        if kind == b"blob" and mode in {b"100644", b"100755"}:
            sources[path.decode("utf-8")] = blob.decode("ascii")
    return sources


def _workflow_source_text(repository: Path, sources: dict[str, str], path: str) -> str:
    _workflow_check(path in sources, "WORKFLOW_SOURCE_MISSING")
    try:
        return _workflow_git(repository, "cat-file", "blob", sources[path]).decode("utf-8")
    except UnicodeError as exc:
        raise WorkflowEvidenceError("WORKFLOW_SOURCE_NOT_TEXT") from exc


def _workflow_time(value: Any) -> datetime:
    _workflow_check(_workflow_text(value), "WORKFLOW_INVALID_TIME")
    try:
        return parse_time(value)
    except ValueError as exc:
        raise WorkflowEvidenceError("WORKFLOW_INVALID_TIME") from exc


def _validate_workflow_checkpoint(checkpoint: Any, repository: Path) -> None:
    keys = {
        "checkpoint_id", "phase", "recorded_at", "BOOT_FILE", "BOOT_BLOB", "LATEST_MAIN", "ORDER",
        "READ_RECEIPTS", "PATH_RESOLUTIONS", "COMPANY_SYNC", "DOMAIN_CANON_READ", "CANON_CONFLICT", "STAGES",
    }
    # Earlier prototype receipts remain immutable history. They cannot satisfy
    # current-cycle admission until a real linked forward checkpoint is appended.
    if isinstance(checkpoint, dict) and "CYCLE" in checkpoint:
        keys.add("CYCLE")
    _workflow_shape(checkpoint, keys)
    _workflow_check(_workflow_text(checkpoint["checkpoint_id"]), "WORKFLOW_CHECKPOINT_ID_MISSING")
    _workflow_check(checkpoint["phase"] in ("PRE_CODE", "POST_TEST"), "WORKFLOW_INVALID_PHASE")
    recorded = _workflow_time(checkpoint["recorded_at"])
    _workflow_check(recorded <= now_utc(), "WORKFLOW_FUTURE_CHECKPOINT")
    _workflow_check(checkpoint["BOOT_FILE"] == WORKFLOW_BOOT_FILE, "WORKFLOW_WRONG_BOOT_FILE")
    _workflow_check(checkpoint["ORDER"] == ["BOOT", "COMPANY_SYNC", "HUMAN_PROMPT"], "WORKFLOW_WRONG_ORDER")
    sources = _workflow_sources(repository, checkpoint["LATEST_MAIN"])
    receipts = checkpoint["READ_RECEIPTS"]
    _workflow_check(isinstance(receipts, list) and 1 <= len(receipts) <= 256, "WORKFLOW_READ_RECEIPTS_MISSING")
    read_paths = set()
    for receipt in receipts:
        _workflow_shape(receipt, {"path", "blob"})
        path = receipt["path"]
        _workflow_check(_workflow_path(path) and path not in read_paths, "WORKFLOW_INVALID_SOURCE_PATH")
        _workflow_check(_workflow_sha(receipt["blob"]) and sources.get(path) == receipt["blob"], "WORKFLOW_SOURCE_BLOB_MISMATCH")
        read_paths.add(path)
    _workflow_check(receipts[0] == {"path": WORKFLOW_BOOT_FILE, "blob": checkpoint["BOOT_BLOB"]}, "WORKFLOW_BOOT_NOT_FIRST")
    _workflow_check(WORKFLOW_REQUIRED_SOURCES <= read_paths, "WORKFLOW_REQUIRED_SOURCE_NOT_READ")

    # Resolve Boot's own mandatory path index. Never select a historical Physics
    # version by keyword or silently substitute a similarly named missing file.
    boot = _workflow_source_text(repository, sources, WORKFLOW_BOOT_FILE)
    section = re.search(r"^# 14\. AI 開機讀取順序\s*$(.*?)^# 15\.", boot, re.M | re.S)
    _workflow_check(section is not None, "WORKFLOW_BOOT_INDEX_UNRESOLVED")
    required = re.findall(r"^\d+\. /([^\s]+\.\w+)$", section.group(1), re.M)
    _workflow_check(len(required) >= 14, "WORKFLOW_BOOT_INDEX_UNRESOLVED")
    resolutions = checkpoint["PATH_RESOLUTIONS"]
    _workflow_check(isinstance(resolutions, list) and len(resolutions) <= 32, "WORKFLOW_INVALID_PATH_RESOLUTION")
    resolved = {}
    for item in resolutions:
        _workflow_shape(item, {"requested", "resolved", "index", "reason"})
        requested, target, index = item["requested"], item["resolved"], item["index"]
        _workflow_check(all(_workflow_path(p) for p in (requested, target, index)), "WORKFLOW_INVALID_PATH_RESOLUTION")
        _workflow_check(requested in required and requested not in sources and requested not in resolved,
                        "WORKFLOW_INVALID_PATH_RESOLUTION")
        _workflow_check(index in WORKFLOW_LINEAGE_INDEXES and index in read_paths and target in read_paths,
                        "WORKFLOW_UNVERIFIED_PATH_RESOLUTION")
        inventory = _workflow_source_text(repository, sources, index).replace("\\", "/")
        _workflow_check(target in inventory and requested.rsplit("/", 1)[-1] == target.rsplit("/", 1)[-1]
                        and _workflow_text(item["reason"]), "WORKFLOW_UNVERIFIED_PATH_RESOLUTION")
        resolved[requested] = target
    _workflow_check(all(resolved.get(p, p) in read_paths for p in required), "WORKFLOW_BOOT_LINEAGE_NOT_READ")

    # The map selector chooses its active manifest; the manifest chooses its base.
    # These reads inspect existing owners and do not interpret or change map laws.
    selector = _workflow_source_text(repository, sources, "docs/maps/README.md")
    active_section = re.search(r"^## Current Shared Map\s*$(.*?)(?=^## |\Z)", selector, re.M | re.S)
    active = re.search(r"^- `([^`]+\.json)`", active_section.group(1), re.M) if active_section else None
    _workflow_check(active is not None, "WORKFLOW_MAP_SELECTOR_UNRESOLVED")
    map_path = "docs/maps/" + active.group(1)
    _workflow_check(_workflow_path(map_path) and map_path in read_paths, "WORKFLOW_CURRENT_MAP_NOT_READ")
    try:
        manifest = json.loads(_workflow_source_text(repository, sources, map_path))
    except (ValueError, TypeError) as exc:
        raise WorkflowEvidenceError("WORKFLOW_MAP_SELECTOR_UNRESOLVED") from exc
    _workflow_check(isinstance(manifest, dict), "WORKFLOW_MAP_SELECTOR_UNRESOLVED")
    if "base_map" in manifest:
        base = manifest["base_map"]
        _workflow_check(isinstance(base, str) and _workflow_path(base.lstrip("/")) and base.lstrip("/") in read_paths,
                        "WORKFLOW_MAP_BASE_NOT_READ")

    def valid_ref(ref: Any) -> bool:
        return _workflow_text(ref) and (ref in read_paths or bool(re.fullmatch(
            r"(?:https://github\.com/[^\s]+|human-message:Sentinel_[A-Za-z0-9_-]+|evidence:[A-Za-z0-9_./-]+)", ref)))

    if "CYCLE" in checkpoint:
        cycle = checkpoint["CYCLE"]
        _workflow_shape(cycle, {"number", "previous_checkpoint_id", "pre_code_checkpoint_id",
                                "reason", "reason_ref", "test_outcome"})
        _workflow_check(type(cycle["number"]) is int and 1 <= cycle["number"] <= 128,
                        "WORKFLOW_INVALID_CYCLE_NUMBER")
        _workflow_check(cycle["previous_checkpoint_id"] is None or _workflow_text(cycle["previous_checkpoint_id"]),
                        "WORKFLOW_INVALID_CYCLE_BINDING")
        _workflow_check(_workflow_text(cycle["pre_code_checkpoint_id"]) and valid_ref(cycle["reason_ref"]),
                        "WORKFLOW_INVALID_CYCLE_BINDING")
        _workflow_check(cycle["reason"] in ("INITIAL", "REWORK", "SOURCE_REFRESH", "TEST_RESULT", "LEGACY_FORWARD_CHECKPOINT"),
                        "WORKFLOW_INVALID_CYCLE_REASON")
        outcomes = ("NOT_RUN",) if checkpoint["phase"] == "PRE_CODE" else ("PASS", "FAIL", "BLOCKED")
        _workflow_check(cycle["test_outcome"] in outcomes, "WORKFLOW_INVALID_CYCLE_TEST_OUTCOME")

    sync = checkpoint["COMPANY_SYNC"]
    _workflow_shape(sync, {"main_sha", "observed_at", "checks"})
    _workflow_check(sync["main_sha"] == checkpoint["LATEST_MAIN"], "WORKFLOW_COMPANY_MAIN_MISMATCH")
    _workflow_check(_workflow_time(sync["observed_at"]) <= recorded, "WORKFLOW_COMPANY_TIME_MISMATCH")
    checks = sync["checks"]
    _workflow_check(isinstance(checks, list) and len(checks) == len(WORKFLOW_COMPANY_CHECKS), "WORKFLOW_COMPANY_SYNC_INCOMPLETE")
    categories = set()
    for check in checks:
        _workflow_shape(check, {"category", "status", "source_ref", "source_revision", "summary"})
        _workflow_check(isinstance(check["category"], str) and check["category"] in WORKFLOW_COMPANY_CHECKS
                        and check["category"] not in categories, "WORKFLOW_COMPANY_SYNC_INCOMPLETE")
        _workflow_check(check["status"] in ("CHECKED", "WAITING_EXTERNAL", "UNAVAILABLE", "NOT_APPLICABLE")
                        and valid_ref(check["source_ref"]) and _workflow_text(check["summary"]), "WORKFLOW_INVALID_COMPANY_CHECK")
        revision = check["source_revision"]
        _workflow_check(revision is None or _workflow_sha(revision), "WORKFLOW_INVALID_COMPANY_REVISION")
        if check["source_ref"] in read_paths:
            _workflow_check(revision == sources[check["source_ref"]], "WORKFLOW_COMPANY_SOURCE_MISMATCH")
        categories.add(check["category"])
    domain = checkpoint["DOMAIN_CANON_READ"]
    _workflow_check(isinstance(domain, list) and 1 <= len(domain) <= 128
                    and all(isinstance(p, str) and p in read_paths for p in domain)
                    and len(domain) == len(set(domain)), "WORKFLOW_DOMAIN_CANON_NOT_READ")
    conflicts = checkpoint["CANON_CONFLICT"]
    _workflow_check(isinstance(conflicts, list) and len(conflicts) <= 128, "WORKFLOW_INVALID_CONFLICT_RECORD")
    for conflict in conflicts:
        _workflow_shape(conflict, {"source_ref", "disposition", "resolution_ref", "reason"})
        _workflow_check(conflict["disposition"] in ("RESOLVED_BY_PRECEDENCE", "RECORDED_OUTSIDE_SCOPE", "BLOCKED_AFFECTED_SCOPE")
                        and valid_ref(conflict["source_ref"]) and valid_ref(conflict["resolution_ref"])
                        and _workflow_text(conflict["reason"]), "WORKFLOW_INVALID_CONFLICT_RECORD")
        _workflow_check(conflict["disposition"] != "BLOCKED_AFFECTED_SCOPE", "WORKFLOW_AFFECTED_CANON_CONFLICT")
    stages = checkpoint["STAGES"]
    expected = WORKFLOW_STAGES[:5] if checkpoint["phase"] == "PRE_CODE" else WORKFLOW_STAGES
    _workflow_check(isinstance(stages, list) and len(stages) == len(expected), "WORKFLOW_STAGE_ORDER_INVALID")
    for stage, name in zip(stages, expected):
        _workflow_shape(stage, {"stage", "evidence_ref"})
        _workflow_check(stage["stage"] == name and valid_ref(stage["evidence_ref"]), "WORKFLOW_STAGE_ORDER_INVALID")


def validate_workflow_evidence(
    record: Any, repository: Path, expected_main: str, expected_work: str,
    expected_session: str, expected_workspace: str, previous: Any = None,
) -> dict[str, Any]:
    """Check receipts against local Git and caller's independently observed main.

    This cannot establish the latest remote ref, authenticated authorship, actual
    cognitive reading, source relevance, Human consent or execution permission.
    """
    keys = {"schema_version", "work_id", "session_id", "workspace_id", "checkpoints", "record_sha256"}
    for item in (record,) if previous is None else (previous, record):
        _workflow_shape(item, keys)
        _workflow_check(item["schema_version"] == "BOOT_FIRST_WORKFLOW_V1", "WORKFLOW_UNKNOWN_VERSION")
        _workflow_check(not contains_secret(item), "WORKFLOW_SECRET_IN_EVIDENCE")
        _workflow_check(_workflow_sha(item["record_sha256"], 64)
                        and item["record_sha256"] == record_hash(item, "record_sha256"), "WORKFLOW_RECORD_HASH_MISMATCH")
        for key, expected in (("work_id", expected_work), ("session_id", expected_session), ("workspace_id", expected_workspace)):
            _workflow_check(_workflow_text(expected) and item[key] == expected, "WORKFLOW_CONTEXT_MISMATCH")
        checkpoints = item["checkpoints"]
        _workflow_check(isinstance(checkpoints, list) and 1 <= len(checkpoints) <= 128, "WORKFLOW_CHECKPOINTS_MISSING")
    checkpoints = record["checkpoints"]
    if previous is None:
        _workflow_check(len(checkpoints) == 1 and isinstance(checkpoints[0], dict)
                        and checkpoints[0].get("phase") == "PRE_CODE", "WORKFLOW_PREVIOUS_EVIDENCE_REQUIRED")
    else:
        old = previous["checkpoints"]
        _workflow_check(len(checkpoints) == len(old) + 1 and checkpoints[:-1] == old, "WORKFLOW_HISTORY_REWRITTEN")
    identifiers = set()
    last_time = None
    prior_checkpoint = None
    cycle_started = False
    historical_cycle_not_recorded = 0
    for checkpoint in checkpoints:
        _validate_workflow_checkpoint(checkpoint, repository)
        at = _workflow_time(checkpoint["recorded_at"])
        _workflow_check(checkpoint["checkpoint_id"] not in identifiers, "WORKFLOW_DUPLICATE_CHECKPOINT")
        _workflow_check(last_time is None or at > last_time, "WORKFLOW_CHECKPOINT_TIME_NOT_MONOTONIC")
        _workflow_check(last_time is None or _workflow_time(checkpoint["COMPANY_SYNC"]["observed_at"]) >= last_time,
                        "WORKFLOW_COMPANY_REFRESH_REQUIRED")
        cycle = checkpoint.get("CYCLE")
        if cycle is None:
            _workflow_check(not cycle_started, "WORKFLOW_CYCLE_EVIDENCE_REMOVED")
            historical_cycle_not_recorded += 1
        else:
            cycle_started = True
            previous_id = prior_checkpoint["checkpoint_id"] if prior_checkpoint else None
            _workflow_check(cycle["previous_checkpoint_id"] == previous_id, "WORKFLOW_CYCLE_PARENT_MISMATCH")
            if prior_checkpoint is None or "CYCLE" not in prior_checkpoint:
                reason = "INITIAL" if prior_checkpoint is None else "LEGACY_FORWARD_CHECKPOINT"
                _workflow_check(cycle["number"] == 1 and checkpoint["phase"] == "PRE_CODE"
                                and cycle["reason"] == reason, "WORKFLOW_CYCLE_START_INVALID")
            elif checkpoint["phase"] == "PRE_CODE":
                number = prior_checkpoint["CYCLE"]["number"] + (prior_checkpoint["phase"] == "POST_TEST")
                _workflow_check(cycle["number"] == number and cycle["reason"] in ("REWORK", "SOURCE_REFRESH"),
                                "WORKFLOW_CYCLE_RESET_INVALID")
            else:
                _workflow_check(prior_checkpoint["phase"] == "PRE_CODE"
                                and cycle["number"] == prior_checkpoint["CYCLE"]["number"]
                                and cycle["pre_code_checkpoint_id"] == previous_id
                                and cycle["reason"] == "TEST_RESULT", "WORKFLOW_POST_TEST_WITHOUT_MATCHING_PRE_CODE")
                for field in ("BOOT_FILE", "BOOT_BLOB", "LATEST_MAIN", "READ_RECEIPTS", "PATH_RESOLUTIONS", "DOMAIN_CANON_READ"):
                    _workflow_check(checkpoint[field] == prior_checkpoint[field], "WORKFLOW_CYCLE_SOURCE_DRIFT")
                _workflow_check(checkpoint["STAGES"][:5] == prior_checkpoint["STAGES"], "WORKFLOW_CYCLE_PRE_CODE_CHANGED")
            if checkpoint["phase"] == "PRE_CODE":
                _workflow_check(cycle["pre_code_checkpoint_id"] == checkpoint["checkpoint_id"], "WORKFLOW_CYCLE_PRE_CODE_MISMATCH")
        identifiers.add(checkpoint["checkpoint_id"])
        last_time, prior_checkpoint = at, checkpoint
    _workflow_check(cycle_started, "WORKFLOW_CYCLE_EVIDENCE_NOT_RECORDED")
    _workflow_check(checkpoints[0]["phase"] == "PRE_CODE", "WORKFLOW_PRE_CODE_EVIDENCE_REQUIRED")
    _workflow_check(_workflow_sha(expected_main) and checkpoints[-1]["LATEST_MAIN"] == expected_main, "WORKFLOW_STALE_MAIN")
    _workflow_git(repository, "merge-base", "--is-ancestor", expected_main, "HEAD")
    return {
        "workflow_evidence_status": "CONSISTENT",
        "scope": "READ_ONLY_RECORD_AND_GIT_CONSISTENCY",
        "phase": checkpoints[-1]["phase"],
        "checkpoint_count": len(checkpoints),
        "current_cycle": checkpoints[-1]["CYCLE"]["number"],
        "current_test_outcome": checkpoints[-1]["CYCLE"]["test_outcome"],
        "historical_cycle_evidence_not_recorded": historical_cycle_not_recorded,
        "readiness_evaluated": False,
        "record_sha256": record["record_sha256"],
        "observed_main": expected_main,
        "authorship_verified": False,
        "cognitive_reading_verified": False,
        "remote_freshness_verified": False,
        "authority_verified": False,
        "actions_granted": [],
    }
