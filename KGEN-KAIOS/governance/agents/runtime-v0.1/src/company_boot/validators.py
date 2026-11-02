from __future__ import annotations

import json
import re
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

HANDOFF_MESSAGE_FIELDS = {
    "MESSAGE_ID", "CORRELATION_ID", "IDEMPOTENCY_KEY",
    "FROM_SELF_NAME", "FROM_LIFE_ID", "FROM_WORKER_ID", "FROM_INSTANCE_ID",
    "TO_SELF_NAME", "TO_LIFE_ID", "TO_WORKER_ID", "TO_INSTANCE_ID",
    "CREATED_AT", "REPOSITORY", "BASE_SHA", "HEAD_SHA", "PAYLOAD",
    "PAYLOAD_SHA256", "MESSAGE_SHA256", "REPLY_TO", "ACK_STATUS",
    "DECISION_STATUS", "DELIVERY_STATUS", "SIGNATURE_TYPE", "SAFETY_BOUNDARY",
}
HANDOFF_EVENT_FIELDS = {
    "EVENT_ID", "MESSAGE_ID", "CORRELATION_ID", "STATUS",
    "ACTOR_SELF_NAME", "ACTOR_LIFE_ID", "ACTOR_WORKER_ID", "ACTOR_INSTANCE_ID",
    "CREATED_AT", "MESSAGE_SHA256", "PREVIOUS_EVENT_SHA256", "EVENT_SHA256",
}
INSTANCE_RECORD_FIELDS = {"INSTANCE_ID", "SELF_NAME", "LIFE_ID", "WORKER_ID", "STATUS"}
HANDOFF_SAFETY_FIELDS = {
    "MERGE", "PUSH_MAIN", "DEPLOYMENT", "PAYMENT", "TOKEN_TRANSFER",
    "TREASURY_ACTION", "GOVERNANCE_EXECUTION", "MAINNET_TRANSACTION",
    "CHAIN_WRITE", "PRIVATE_KEY_REQUEST", "PRIVATE_KEY_OUTPUT",
    "PRIVATE_KEY_STORAGE", "CONTROLLER_OR_SIGNER_IMPERSONATION",
    "SELF_REVIEW", "PUBLIC_AUTO_POST",
}
HANDOFF_TRANSITIONS = {
    "CREATED": {"QUEUED", "FAILED_CLOSED"},
    "QUEUED": {"DELIVERED", "FAILED_CLOSED"},
    "DELIVERED": {"ACKNOWLEDGED", "FAILED_CLOSED"},
    "ACKNOWLEDGED": {"ANSWERED", "FAILED_CLOSED"},
    "ANSWERED": {"REVIEWED", "FAILED_CLOSED"},
    "REVIEWED": set(),
    "FAILED_CLOSED": set(),
}
HANDOFF_SIGNATURE_TYPES = {
    "REPOSITORY_HASH_BOUND_OFFCHAIN",
    "TEXTUAL_ATTESTATION_NOT_CRYPTOGRAPHIC",
    "UNSIGNED_CANDIDATE",
}
GIT_SHA_RE = re.compile(r"^[0-9a-f]{40}$")
SHA256_RE = re.compile(r"^[0-9a-f]{64}$")


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


def _handoff_failure(code: FailureCode, message: str, terminal: Stage = Stage.FAILED) -> BootFailure:
    return BootFailure(code, Stage.HANDOFF_LOADED, message, terminal)


def _validate_instance_registry(instance_registry: dict[str, Any]) -> None:
    if not isinstance(instance_registry, dict):
        raise _handoff_failure(FailureCode.MISSING_VERIFIED_REPLY_TARGET, "instance registry must be an object")
    for instance_id, record in instance_registry.items():
        if not isinstance(record, dict) or set(record) != INSTANCE_RECORD_FIELDS:
            raise _handoff_failure(FailureCode.HANDOFF_SCHEMA_MISMATCH, "instance registry record schema mismatch")
        if record["INSTANCE_ID"] != instance_id or record["STATUS"] != "ACTIVE":
            raise _handoff_failure(FailureCode.MISSING_VERIFIED_REPLY_TARGET, "instance is missing or inactive")


def _require_handoff_actor(message: dict[str, Any], instance_registry: dict[str, Any], prefix: str) -> dict[str, Any]:
    instance_id = message[f"{prefix}_INSTANCE_ID"]
    actor = instance_registry.get(instance_id)
    if not actor:
        raise _handoff_failure(FailureCode.MISSING_VERIFIED_REPLY_TARGET, f"verified {prefix.lower()} instance not found")
    expected = {
        "SELF_NAME": message[f"{prefix}_SELF_NAME"],
        "LIFE_ID": message[f"{prefix}_LIFE_ID"],
        "WORKER_ID": message[f"{prefix}_WORKER_ID"],
        "INSTANCE_ID": instance_id,
    }
    if any(actor[key] != value for key, value in expected.items()):
        raise _handoff_failure(FailureCode.HANDOFF_ACTOR_MISMATCH, f"{prefix.lower()} identity does not match verified instance")
    return actor


def handoff_message_hash(message: dict[str, Any]) -> str:
    content = dict(message)
    content.pop("MESSAGE_SHA256", None)
    return sha256_text(canonical_json(content))


def handoff_event_hash(event: dict[str, Any]) -> str:
    content = dict(event)
    content.pop("EVENT_SHA256", None)
    return sha256_text(canonical_json(content))


def validate_handoff_message(
    message: dict[str, Any],
    instance_registry: dict[str, Any],
    seen_messages: dict[str, str] | None = None,
    seen_idempotency_keys: dict[str, str] | None = None,
) -> str:
    """Validate one immutable, hash-bound off-chain handoff envelope.

    Delivery is allowed only when both instances are present in an independently
    supplied active instance registry. The function never discovers, creates or
    promotes an identity by itself.
    """
    if not isinstance(message, dict) or set(message) != HANDOFF_MESSAGE_FIELDS:
        raise _handoff_failure(FailureCode.HANDOFF_SCHEMA_MISMATCH, "handoff message fields are missing or unknown")
    if contains_secret(message):
        raise _handoff_failure(FailureCode.SECRET_IN_OUTPUT, "handoff message contains secret-like content")
    if not isinstance(message["PAYLOAD"], dict):
        raise _handoff_failure(FailureCode.HANDOFF_SCHEMA_MISMATCH, "handoff payload must be an object")
    _validate_instance_registry(instance_registry)
    if not all(isinstance(message[field], str) and message[field] for field in (
        "MESSAGE_ID", "CORRELATION_ID", "IDEMPOTENCY_KEY", "FROM_SELF_NAME", "FROM_LIFE_ID",
        "FROM_WORKER_ID", "FROM_INSTANCE_ID", "TO_SELF_NAME", "TO_LIFE_ID", "TO_WORKER_ID",
        "TO_INSTANCE_ID", "CREATED_AT", "REPOSITORY", "BASE_SHA", "HEAD_SHA", "PAYLOAD_SHA256",
        "MESSAGE_SHA256", "ACK_STATUS", "DECISION_STATUS", "DELIVERY_STATUS", "SIGNATURE_TYPE",
    )):
        raise _handoff_failure(FailureCode.HANDOFF_SCHEMA_MISMATCH, "handoff message contains empty identity or integrity field")
    try:
        parse_time(message["CREATED_AT"])
    except ValueError as exc:
        raise _handoff_failure(FailureCode.HANDOFF_SCHEMA_MISMATCH, "handoff created_at is invalid") from exc
    if not GIT_SHA_RE.fullmatch(message["BASE_SHA"]) or not GIT_SHA_RE.fullmatch(message["HEAD_SHA"]):
        raise _handoff_failure(FailureCode.HANDOFF_SCHEMA_MISMATCH, "base/head SHA must be lowercase 40-hex Git object IDs")
    if not SHA256_RE.fullmatch(message["PAYLOAD_SHA256"]) or not SHA256_RE.fullmatch(message["MESSAGE_SHA256"]):
        raise _handoff_failure(FailureCode.HANDOFF_SCHEMA_MISMATCH, "payload/message SHA-256 must be lowercase 64-hex")
    if message["PAYLOAD_SHA256"] != sha256_text(canonical_json(message["PAYLOAD"])):
        raise _handoff_failure(FailureCode.HANDOFF_PAYLOAD_HASH_MISMATCH, "payload hash mismatch", Stage.CONFLICTED)
    if message["MESSAGE_SHA256"] != handoff_message_hash(message):
        raise _handoff_failure(FailureCode.HANDOFF_PAYLOAD_HASH_MISMATCH, "message hash mismatch", Stage.CONFLICTED)
    if message["ACK_STATUS"] != "NOT_ACKNOWLEDGED" or message["DECISION_STATUS"] != "PENDING" or message["DELIVERY_STATUS"] != "CREATED":
        raise _handoff_failure(FailureCode.HANDOFF_TRANSITION_INVALID, "immutable envelope must begin CREATED/PENDING/NOT_ACKNOWLEDGED")
    if message["SIGNATURE_TYPE"] not in HANDOFF_SIGNATURE_TYPES:
        raise _handoff_failure(FailureCode.HANDOFF_SCHEMA_MISMATCH, "unsupported signature type")
    safety = message["SAFETY_BOUNDARY"]
    if not isinstance(safety, dict) or set(safety) != HANDOFF_SAFETY_FIELDS or any(value is not False for value in safety.values()):
        raise _handoff_failure(FailureCode.HANDOFF_SCHEMA_MISMATCH, "handoff safety boundary must explicitly deny every protected action")
    if message["FROM_INSTANCE_ID"] == message["TO_INSTANCE_ID"]:
        raise _handoff_failure(FailureCode.HANDOFF_ACTOR_MISMATCH, "sender and recipient instances must be distinct")
    _require_handoff_actor(message, instance_registry, "FROM")
    _require_handoff_actor(message, instance_registry, "TO")
    seen_messages = seen_messages or {}
    seen_idempotency_keys = seen_idempotency_keys or {}
    prior_message_hash = seen_messages.get(message["MESSAGE_ID"])
    prior_idempotency_hash = seen_idempotency_keys.get(message["IDEMPOTENCY_KEY"])
    if prior_message_hash is not None or prior_idempotency_hash is not None:
        if prior_message_hash == message["MESSAGE_SHA256"] and prior_idempotency_hash == message["MESSAGE_SHA256"]:
            return "IDEMPOTENT_NOOP"
        raise _handoff_failure(FailureCode.HANDOFF_REPLAY_CONFLICT, "message or idempotency key replayed with different content", Stage.CONFLICTED)
    reply_to = message["REPLY_TO"]
    if reply_to is not None and (not isinstance(reply_to, str) or reply_to not in seen_messages):
        raise _handoff_failure(FailureCode.HANDOFF_REPLAY_CONFLICT, "reply_to does not resolve to a known message", Stage.CONFLICTED)
    return "VALIDATED_CREATED"


def validate_handoff_audit(
    message: dict[str, Any],
    events: list[dict[str, Any]],
    instance_registry: dict[str, Any],
) -> str:
    """Validate an append-only, recipient-ACKed handoff transition chain."""
    validate_handoff_message(message, instance_registry)
    if not isinstance(events, list) or not events:
        raise _handoff_failure(FailureCode.HANDOFF_TRANSITION_INVALID, "handoff audit trail is empty")
    previous_status: str | None = None
    previous_hash: str | None = None
    event_ids: set[str] = set()
    for event in events:
        if not isinstance(event, dict) or set(event) != HANDOFF_EVENT_FIELDS:
            raise _handoff_failure(FailureCode.HANDOFF_SCHEMA_MISMATCH, "handoff event fields are missing or unknown")
        if contains_secret(event):
            raise _handoff_failure(FailureCode.SECRET_IN_OUTPUT, "handoff event contains secret-like content")
        if event["EVENT_ID"] in event_ids:
            raise _handoff_failure(FailureCode.HANDOFF_REPLAY_CONFLICT, "duplicate event ID", Stage.CONFLICTED)
        event_ids.add(event["EVENT_ID"])
        if event["MESSAGE_ID"] != message["MESSAGE_ID"] or event["CORRELATION_ID"] != message["CORRELATION_ID"]:
            raise _handoff_failure(FailureCode.HANDOFF_ACTOR_MISMATCH, "event lineage does not match message")
        if event["MESSAGE_SHA256"] != message["MESSAGE_SHA256"]:
            raise _handoff_failure(FailureCode.HANDOFF_PAYLOAD_HASH_MISMATCH, "event message hash mismatch", Stage.CONFLICTED)
        if event["PREVIOUS_EVENT_SHA256"] != previous_hash:
            raise _handoff_failure(FailureCode.HANDOFF_REPLAY_CONFLICT, "event hash chain is broken", Stage.CONFLICTED)
        if event["EVENT_SHA256"] != handoff_event_hash(event):
            raise _handoff_failure(FailureCode.HANDOFF_PAYLOAD_HASH_MISMATCH, "event hash mismatch", Stage.CONFLICTED)
        try:
            parse_time(event["CREATED_AT"])
        except ValueError as exc:
            raise _handoff_failure(FailureCode.HANDOFF_SCHEMA_MISMATCH, "event timestamp is invalid") from exc
        actor = instance_registry.get(event["ACTOR_INSTANCE_ID"])
        if (
            not actor
            or actor["INSTANCE_ID"] != event["ACTOR_INSTANCE_ID"]
            or any(actor[key] != event[f"ACTOR_{key}"] for key in ("SELF_NAME", "LIFE_ID", "WORKER_ID"))
        ):
            raise _handoff_failure(FailureCode.HANDOFF_ACTOR_MISMATCH, "event actor does not match verified instance")
        status = event["STATUS"]
        if previous_status is None:
            if status != "CREATED" or event["ACTOR_INSTANCE_ID"] != message["FROM_INSTANCE_ID"]:
                raise _handoff_failure(FailureCode.HANDOFF_TRANSITION_INVALID, "first event must be sender-created")
        elif status not in HANDOFF_TRANSITIONS.get(previous_status, set()):
            raise _handoff_failure(FailureCode.HANDOFF_TRANSITION_INVALID, f"invalid handoff transition: {previous_status}->{status}")
        if status in {"ACKNOWLEDGED", "ANSWERED"}:
            if event["ACTOR_INSTANCE_ID"] == message["FROM_INSTANCE_ID"]:
                raise _handoff_failure(FailureCode.HANDOFF_ACK_IMPERSONATION, "sender cannot acknowledge or answer for recipient", Stage.CONFLICTED)
            if event["ACTOR_INSTANCE_ID"] != message["TO_INSTANCE_ID"]:
                raise _handoff_failure(FailureCode.HANDOFF_ACTOR_MISMATCH, "ACK/answer actor is not the verified recipient")
        if status == "REVIEWED" and event["ACTOR_INSTANCE_ID"] in {message["FROM_INSTANCE_ID"], message["TO_INSTANCE_ID"]}:
            raise _handoff_failure(FailureCode.HANDOFF_ACTOR_MISMATCH, "review must be performed by a distinct verified instance")
        previous_status = status
        previous_hash = event["EVENT_SHA256"]
    return previous_status or "FAILED_CLOSED"


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
