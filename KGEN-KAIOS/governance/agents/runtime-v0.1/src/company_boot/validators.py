from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from .evidence import canonical_json, sha256_text
from .models import BootFailure, FailureCode, Stage


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


def parse_time(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def contains_secret(value: Any) -> bool:
    text = canonical_json(value) if not isinstance(value, str) else value
    return any(pattern.search(text) for pattern in SECRET_PATTERNS)


def validate_state_sha(current_state: dict[str, Any]) -> None:
    expected = current_state.get("state_sha256")
    if not expected:
        raise BootFailure(FailureCode.STATE_SHA_MISMATCH, Stage.STATE_VERIFIED, "missing state_sha256")
    data = dict(current_state)
    data.pop("state_sha256", None)
    actual = sha256_text(canonical_json(data))
    if actual != expected:
        raise BootFailure(FailureCode.STATE_SHA_MISMATCH, Stage.STATE_VERIFIED, "state_sha256 mismatch")


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


def validate_boot_inputs(
    session: dict[str, Any],
    current_state: dict[str, Any],
    agent_registry: dict[str, Any],
    handoff: dict[str, Any],
    handoff_sha256: str,
) -> None:
    if contains_secret(session) or contains_secret(current_state) or contains_secret(agent_registry) or contains_secret(handoff):
        raise BootFailure(FailureCode.SECRET_IN_OUTPUT, Stage.NEW, "secret-like value found in input")

    life_id = require(session, "life_id", Stage.NEW)
    instance_id = require(session, "instance_id", Stage.NEW)
    attestation_id = require(session, "attestation_id", Stage.NEW)
    grant_id = require(session, "capability_grant_id", Stage.NEW)
    base_main_sha = require(session, "base_main_sha", Stage.NEW)
    assigned_workorder = require(session, "assigned_workorder", Stage.NEW)

    agent = find_agent(agent_registry, life_id)
    if agent.get("status") != "ACTIVE":
        raise BootFailure(FailureCode.FAKE_LIFE_ID, Stage.BOOTING, "Life ID is not active")

    existing_sessions = current_state.get("active_sessions", []) + current_state.get("active_agent_sessions", [])
    if instance_id in existing_sessions:
        raise BootFailure(FailureCode.DUPLICATE_SESSION_ID, Stage.BOOTING, "duplicate instance_id")

    attestation = find_mapping(agent_registry, "attestations", attestation_id, FailureCode.FAKE_ATTESTATION, Stage.IDENTITY_VERIFIED)
    if attestation.get("life_id") != life_id or attestation.get("revocation_status") != "ACTIVE":
        raise BootFailure(FailureCode.FAKE_ATTESTATION, Stage.IDENTITY_VERIFIED, "attestation does not match Life ID or is inactive")

    grant = find_mapping(agent_registry, "capability_grants", grant_id, FailureCode.EXPIRED_CAPABILITY, Stage.CAPABILITY_VERIFIED)
    if grant.get("life_id") != life_id or grant.get("instance_id") != instance_id:
        raise BootFailure(FailureCode.EXPIRED_CAPABILITY, Stage.CAPABILITY_VERIFIED, "grant identity binding mismatch")
    if grant.get("workorder_id") != assigned_workorder:
        raise BootFailure(FailureCode.UNAUTHORIZED_WORKORDER, Stage.CAPABILITY_VERIFIED, "grant WorkOrder mismatch")
    if parse_time(require(grant, "expires_at", Stage.CAPABILITY_VERIFIED)) <= now_utc():
        raise BootFailure(FailureCode.EXPIRED_CAPABILITY, Stage.CAPABILITY_VERIFIED, "grant expired")
    if grant.get("revocation_id_if_any"):
        raise BootFailure(FailureCode.REVOKED_CAPABILITY, Stage.REVOKED, "grant references revocation")
    revocations = agent_registry.get("revocations", {})
    if grant_id in revocations:
        raise BootFailure(FailureCode.REVOKED_CAPABILITY, Stage.REVOKED, "grant revoked")

    if current_state.get("conflicting_current_state"):
        raise BootFailure(FailureCode.CURRENT_STATE_CONFLICT, Stage.CONFLICTED, "current state conflict")
    if current_state.get("source_type") == "CACHE":
        raise BootFailure(FailureCode.CACHE_AS_CURRENT_TRUTH, Stage.STATE_VERIFIED, "cache cannot be current truth")
    validate_state_sha(current_state)

    current_main_sha = require(current_state, "current_main_sha", Stage.STATE_VERIFIED)
    if base_main_sha != current_main_sha:
        if session.get("allow_stale") is True:
            raise BootFailure(FailureCode.STALE_SESSION, Stage.STALE, "stale session")
        raise BootFailure(FailureCode.WRONG_MAIN_SHA, Stage.STATE_VERIFIED, "base_main_sha does not match current_main_sha")

    if assigned_workorder not in current_state.get("active_workorders", []):
        raise BootFailure(FailureCode.UNAUTHORIZED_WORKORDER, Stage.STATE_VERIFIED, "WorkOrder is not active")

    parent_handoff_id = session.get("parent_handoff_id")
    if not parent_handoff_id and session.get("initial_status") not in ("ROOT_SESSION", "HUMAN_AUTHORIZED_ORPHAN_SESSION"):
        raise BootFailure(FailureCode.MISSING_PARENT_HANDOFF, Stage.HANDOFF_LOADED, "missing parent handoff")
    if parent_handoff_id and handoff.get("handoff_id") != parent_handoff_id:
        raise BootFailure(FailureCode.MISSING_PARENT_HANDOFF, Stage.HANDOFF_LOADED, "handoff ID mismatch")
    expected_handoff_sha = session.get("parent_handoff_sha256")
    if expected_handoff_sha and expected_handoff_sha != handoff_sha256:
        raise BootFailure(FailureCode.HANDOFF_SHA_MISMATCH, Stage.HANDOFF_LOADED, "handoff sha mismatch")

    for lock in current_state.get("session_locks", []):
        if lock.get("status") == "ACTIVE" and lock.get("workorder_id") == assigned_workorder and lock.get("holder_instance_id") != instance_id:
            raise BootFailure(FailureCode.SESSION_LOCK_CONFLICT, Stage.CONFLICTED, "active lock held by another session")
