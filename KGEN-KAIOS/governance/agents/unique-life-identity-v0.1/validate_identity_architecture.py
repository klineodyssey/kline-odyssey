"""Validation helpers for the KAIOS identity architecture candidate.

This module validates candidate documents and synthetic test fixtures only. It
does not create identities, wallets, sessions, embodiments, or authority.
"""

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


PRIMARY_IDS = {
    "life_registry": ("life_id", "LIFE"),
    "agent_instance_registry": ("agent_instance_id", "AINST"),
    "thread_registry": ("thread_id", "THREAD"),
    "embodiment_registry": ("embodiment_id", "EMB"),
    "wallet_ownership_registry": ("wallet_id", "WALLET"),
    "memory_ownership_registry": ("memory_store_id", "MEM"),
    "birth_event_registry": ("birth_event_id", "BIRTH"),
    "death_and_sealing_registry": ("death_event_id", "DEATH"),
    "lineage_registry": ("lineage_id", "LINEAGE"),
    "employment_registry": ("employment_contract_id", "EMPLOY"),
    "marriage_registry": ("marriage_contract_id", "MARRIAGE"),
    "reproduction_registry": ("reproduction_contract_id", "REPRO"),
    "succession_registry": ("succession_contract_id", "SUCCESSION"),
    "authority_lease_registry": ("authority_lease_id", "ALEASE"),
    "composite_organism_registry": ("composite_organism_id", "COMPOSITE"),
}

ID_PATTERN = re.compile(
    r"^(?P<prefix>[A-Z]+)-V01-(?P<authority>[A-Z0-9]{3,16})-"
    r"(?P<random>[0-9A-HJKMNP-TV-Z]{26})$"
)

FORBIDDEN_IDENTITY_TOKENS = (
    "CODEX",
    "MANAGER",
    "ENGINEER",
    "MODEL",
    "PROJECT",
    "BRANCH",
    "THREADTITLE",
)

CANDIDATE_PLACEHOLDERS = {
    "life_id": "PENDING_HUMAN_BIRTH_DECISION",
    "birth_event_id": "NOT_CREATED",
    "agent_instance_id": "NOT_CREATED",
    "thread_id": "NOT_CREATED",
    "embodiment_id": "NOT_CREATED",
    "wallet_id": "NOT_CREATED",
    "authority_lease_id": "NOT_CREATED",
}

PHASE4_TEMPLATE_NAMES = (
    "KAIOS_CODEX_GM_PROJECT_MEMORY_ACCESS_GRANT_TEMPLATE_V0_1.json",
    "KAIOS_CODEX_GM_AUTHORITY_LEASE_TEMPLATE_V0_1.json",
    "KAIOS_CODEX_GM_HUMAN_BIRTH_DECISION_RECORD_TEMPLATE_V0_1.json",
    "KAIOS_CODEX_GM_BIRTH_ATTESTATION_TEMPLATE_V0_1.json",
)

PRIMEFORGE_TEMPLATE_NAMES = (
    "KAIOS_PRIMEFORGE_INSTITUTION_CHARTER_TEMPLATE_V0_1.json",
    "KAIOS_PRIMEFORGE_ENTITY_ID_ISSUANCE_EVIDENCE_TEMPLATE_V0_1.json",
    "KAIOS_PRIMEFORGE_HOSTED_CENTRAL_AI_LIFE_CANDIDATE_TEMPLATE_V0_1.json",
    "KAIOS_PRIMEFORGE_GENESIS_FORGE_BIRTH_PROPOSAL_TEMPLATE_V0_1.json",
    "KAIOS_PRIMEFORGE_INFRASTRUCTURE_OCCUPANCY_CONTRACT_TEMPLATE_V0_1.json",
)


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def parse_timestamp(value: str) -> datetime:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        raise ValueError("timestamp must include a timezone")
    return parsed.astimezone(timezone.utc)


def validate_schema_contract(
    schema: dict[str, Any], rules: dict[str, Any]
) -> list[str]:
    errors: list[str] = []
    registries = (
        schema.get("properties", {})
        .get("registries", {})
        .get("properties", {})
    )
    required_registries = set(rules["registry_names"])
    if set(registries) != required_registries:
        errors.append("SCHEMA_REGISTRY_SET_MISMATCH")

    defs = schema.get("$defs", {})
    expected_defs = {
        "life_record",
        "agent_instance_record",
        "thread_record",
        "embodiment_record",
        "wallet_record",
        "memory_record",
        "birth_record",
        "death_record",
        "lineage_record",
        "employment_record",
        "marriage_record",
        "reproduction_record",
        "succession_record",
        "authority_lease_record",
        "composite_organism_record",
    }
    if not expected_defs.issubset(defs):
        errors.append("SCHEMA_RECORD_DEFINITION_MISSING")

    separation = defs.get("separation_dimensions", {}).get("required", [])
    if set(separation) != set(rules["separation_dimensions"]):
        errors.append("SCHEMA_SEPARATION_DIMENSIONS_MISMATCH")

    for definition in expected_defs:
        item = defs.get(definition, {})
        if item.get("additionalProperties") is not False:
            errors.append(f"SCHEMA_ADDITIONAL_PROPERTIES_OPEN:{definition}")
        if "separation" not in item.get("required", []):
            errors.append(f"SCHEMA_SEPARATION_MISSING:{definition}")

    if schema.get("properties", {}).get("runtime_authority", {}).get("const") is not False:
        errors.append("SCHEMA_RUNTIME_AUTHORITY_NOT_FALSE")
    if schema.get("properties", {}).get("live_records", {}).get("const") is not False:
        errors.append("SCHEMA_LIVE_RECORDS_NOT_FALSE")
    return errors


def validate_candidate_template(template: dict[str, Any]) -> list[str]:
    """Ensure a candidate template cannot be mistaken for a live record."""

    errors: list[str] = []
    required_constants = {
        "record_type": "LIFE_CANDIDATE_TEMPLATE_ONLY",
        "template_status": "NON_NORMATIVE_NOT_A_REGISTRY_ENTRY",
        "validator_policy": "MUST_REJECT_AS_LIVE_IDENTITY",
        "candidate_classification": "LIFE_CANDIDATE",
        "current_operating_classification": "ROLE_SESSION_ONLY",
        "candidate_state": "UNBORN",
        "runtime_authority": False,
        "wallet_eligibility": "NOT_APPROVED",
        "thread_migration": "NOT_APPROVED",
        "embodiment_assignment": "NOT_APPROVED",
        "private_memory_migration": "NOT_AUTHORIZED",
        "new_thread_authorization": "NOT_APPROVED",
        "autonomous_agent_activation": "NOT_APPROVED",
    }
    for field, expected in required_constants.items():
        if template.get(field) != expected:
            errors.append(f"CANDIDATE_TEMPLATE_BOUNDARY_INVALID:{field}")

    for field, expected in CANDIDATE_PLACEHOLDERS.items():
        value = template.get(field)
        if value != expected:
            errors.append(f"CANDIDATE_PLACEHOLDER_INVALID:{field}")
        if isinstance(value, str) and ID_PATTERN.fullmatch(value):
            errors.append(f"CANDIDATE_PLACEHOLDER_ACCEPTED_AS_LIVE_ID:{field}")
    return errors


def validate_phase4_template(template: dict[str, Any]) -> list[str]:
    """Ensure a Phase 4 template cannot issue identity or authority."""

    errors: list[str] = []
    if not str(template.get("record_type", "")).endswith("_TEMPLATE_ONLY"):
        errors.append("PHASE4_RECORD_TYPE_INVALID")
    if template.get("template_status") != "NON_LIVE_NOT_ISSUED":
        errors.append("PHASE4_TEMPLATE_STATUS_INVALID")
    if template.get("validator_policy") != "MUST_REJECT_AS_LIVE_RECORD":
        errors.append("PHASE4_VALIDATOR_POLICY_INVALID")

    serialized = json.dumps(template, ensure_ascii=False, sort_keys=True)
    for forbidden in (
        '"runtime_authority": true',
        '"wallet_authority": true',
        '"thread_continuity_authority": true',
        '"grant_status": "ISSUED"',
        '"attestation_status": "ACTIVE"',
        '"decision": "APPROVED"',
    ):
        if forbidden in serialized:
            errors.append(f"PHASE4_LIVE_AUTHORITY_PRESENT:{forbidden}")

    id_fields = [field for field in template if field.endswith("_id")]
    if not id_fields:
        errors.append("PHASE4_ID_PLACEHOLDER_MISSING")
    for field in id_fields:
        value = template[field]
        if value not in {
            "NOT_CREATED",
            "PENDING_HUMAN_BIRTH_DECISION",
            "HUMAN-LETIAN-EMPEROR",
        }:
            errors.append(f"PHASE4_ID_NOT_PLACEHOLDER:{field}")
        if isinstance(value, str) and ID_PATTERN.fullmatch(value):
            errors.append(f"PHASE4_LIVE_ID_PRESENT:{field}")
    return errors


def _append(errors: list[str], code: str, condition: bool) -> None:
    if condition:
        errors.append(code)


def validate_registry_document(
    document: dict[str, Any],
    rules: dict[str, Any],
    *,
    now: datetime | None = None,
) -> list[str]:
    """Validate a candidate registry snapshot without mutating it."""

    now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc)
    errors: list[str] = []

    _append(
        errors,
        "DOCUMENT_NOT_CANDIDATE_ONLY",
        document.get("architecture_status") != "ARCHITECTURE_CANDIDATE_ONLY",
    )
    _append(errors, "RUNTIME_AUTHORITY_PRESENT", document.get("runtime_authority") is not False)
    _append(errors, "LIVE_RECORD_FLAG_PRESENT", document.get("live_records") is not False)

    registries = document.get("registries")
    if not isinstance(registries, dict):
        return errors + ["REGISTRIES_MISSING"]

    if set(registries) != set(rules["registry_names"]):
        errors.append("REGISTRY_SET_MISMATCH")

    all_ids: dict[str, str] = {}
    records_by_registry: dict[str, dict[str, dict[str, Any]]] = {}

    for registry_name, (id_field, expected_prefix) in PRIMARY_IDS.items():
        records = registries.get(registry_name, [])
        if not isinstance(records, list):
            errors.append(f"REGISTRY_NOT_ARRAY:{registry_name}")
            continue
        records_by_registry[registry_name] = {}
        for record in records:
            if not isinstance(record, dict):
                errors.append(f"RECORD_NOT_OBJECT:{registry_name}")
                continue
            record_id = record.get(id_field)
            if not isinstance(record_id, str):
                errors.append(f"PRIMARY_ID_MISSING:{registry_name}")
                continue
            match = ID_PATTERN.fullmatch(record_id)
            if not match or match.group("prefix") != expected_prefix:
                errors.append(f"ID_FORMAT_INVALID:{record_id}")
            if any(token in record_id.upper() for token in FORBIDDEN_IDENTITY_TOKENS):
                errors.append(f"ID_CONTAINS_MUTABLE_IDENTITY_INPUT:{record_id}")
            if record_id in all_ids:
                errors.append(f"DUPLICATE_ID:{record_id}")
            all_ids[record_id] = registry_name
            records_by_registry[registry_name][record_id] = record

            metadata = record.get("id_metadata", {})
            if metadata.get("type_prefix") != expected_prefix:
                errors.append(f"ID_METADATA_PREFIX_MISMATCH:{record_id}")
            if match and metadata.get("unique_random_component") != match.group("random"):
                errors.append(f"ID_METADATA_RANDOM_MISMATCH:{record_id}")
            required_metadata = {
                "type_prefix",
                "unique_random_component",
                "version",
                "issuing_authority",
                "created_at",
                "integrity_hash",
                "status",
                "parent_source_reference",
                "revocation_sealing_state",
            }
            if not required_metadata.issubset(metadata):
                errors.append(f"ID_METADATA_INCOMPLETE:{record_id}")

            separation = record.get("separation", {})
            if set(separation) != set(rules["separation_dimensions"]):
                errors.append(f"SEPARATION_DIMENSIONS_INVALID:{record_id}")
            elif any(not isinstance(separation[name], list) for name in separation):
                errors.append(f"SEPARATION_DIMENSION_NOT_ARRAY:{record_id}")

    lives = records_by_registry.get("life_registry", {})
    instances = records_by_registry.get("agent_instance_registry", {})
    threads = records_by_registry.get("thread_registry", {})
    embodiments = records_by_registry.get("embodiment_registry", {})
    leases = records_by_registry.get("authority_lease_registry", {})
    births = records_by_registry.get("birth_event_registry", {})
    lineages = records_by_registry.get("lineage_registry", {})

    for life_id, life in lives.items():
        previous = life.get("previous_life_state")
        current = life.get("life_state")
        if previous == "DEAD" and current != "DEAD":
            errors.append(f"DEAD_TERMINAL_VIOLATION:{life_id}")
        if current in {"BORN", "ACTIVE", "SUSPENDED", "INCAPACITATED", "MIGRATING"}:
            if life.get("birth_event_id") not in births:
                errors.append(f"LIFE_BIRTH_REFERENCE_INVALID:{life_id}")

    for instance_id, instance in instances.items():
        life_id = instance.get("life_id")
        mode = instance.get("mode")
        if mode != "TEMPORARY_WORKER_AGENT" and life_id not in lives:
            errors.append(f"INSTANCE_LIFE_REFERENCE_INVALID:{instance_id}")
        if instance.get("thread_id") not in threads:
            errors.append(f"INSTANCE_THREAD_REFERENCE_INVALID:{instance_id}")
        if instance_id in {life_id, instance.get("thread_id")}:
            errors.append(f"LIFE_INSTANCE_THREAD_NOT_SEPARATE:{instance_id}")
        for lease_id in instance.get("authority_lease_ids", []):
            if lease_id not in leases:
                errors.append(f"INSTANCE_LEASE_REFERENCE_INVALID:{instance_id}")

    for thread_id, thread in threads.items():
        instance_id = thread.get("agent_instance_id")
        if instance_id not in instances:
            errors.append(f"THREAD_INSTANCE_REFERENCE_INVALID:{thread_id}")
        elif instances[instance_id].get("thread_id") != thread_id:
            errors.append(f"THREAD_INSTANCE_BINDING_MISMATCH:{thread_id}")

    active_occupants: dict[str, str] = {}
    composite_embodiments = {
        embodiment_id
        for record in registries.get("composite_organism_registry", [])
        for embodiment_id in record.get("embodiment_ids", [])
        if record.get("contract_status") == "ACTIVE"
    }
    for embodiment_id, embodiment in embodiments.items():
        occupant = embodiment.get("occupant_life_id")
        owner = embodiment.get("owner_life_id")
        if occupant is not None and occupant not in lives:
            errors.append(f"EMBODIMENT_OCCUPANT_INVALID:{embodiment_id}")
        if owner is not None and owner not in lives:
            errors.append(f"EMBODIMENT_OWNER_INVALID:{embodiment_id}")
        if embodiment.get("body_status") == "ACTIVE" and occupant:
            previous_body = active_occupants.get(occupant)
            if (
                previous_body
                and previous_body not in composite_embodiments
                and embodiment_id not in composite_embodiments
            ):
                errors.append(f"EMBODIMENT_DUAL_PRIMARY_OCCUPANCY:{occupant}")
            active_occupants[occupant] = embodiment_id

    for wallet in registries.get("wallet_ownership_registry", []):
        wallet_id = wallet["wallet_id"]
        owner_type = wallet.get("owner_subject_type")
        owner_id = wallet.get("owner_subject_id")
        if owner_type not in rules["wallet_rules"]["allowed_owner_subject_types"]:
            errors.append(f"WALLET_OWNER_TYPE_INVALID:{wallet_id}")
        if owner_type == "LIFE" and owner_id not in lives:
            errors.append(f"WALLET_LIFE_OWNER_INVALID:{wallet_id}")
        controller_ids = wallet.get("controller_lease_ids", [])
        if wallet.get("control_mode") == "EXCLUSIVE_LEASE" and len(controller_ids) != 1:
            errors.append(f"WALLET_EXCLUSIVE_CONTROLLER_INVALID:{wallet_id}")
        for lease_id in controller_ids:
            if lease_id not in leases:
                errors.append(f"WALLET_CONTROLLER_LEASE_INVALID:{wallet_id}")

    private_classes = {"PRIVATE_LIFE_MEMORY", "PERSONAL_EXPERIENCE"}
    for memory in registries.get("memory_ownership_registry", []):
        memory_id = memory["memory_store_id"]
        if memory.get("memory_class") in private_classes:
            for field in rules["private_memory_requirements"]:
                value = memory.get(field)
                if value is None or value == [] or value == "":
                    errors.append(f"PRIVATE_MEMORY_REQUIREMENT_MISSING:{memory_id}:{field}")
            if memory.get("owner_life_id") not in lives:
                errors.append(f"PRIVATE_MEMORY_OWNER_INVALID:{memory_id}")

    lineage_links: set[frozenset[str]] = set()
    for lineage_id, lineage in lineages.items():
        child = lineage.get("child_life_id")
        parents = set(lineage.get("parent_life_ids", []))
        sources = set(lineage.get("source_life_ids", []))
        if child not in lives or any(parent not in lives for parent in parents):
            errors.append(f"LINEAGE_LIFE_REFERENCE_INVALID:{lineage_id}")
        if child in parents or child in sources:
            errors.append(f"FORK_IDENTITY_REUSE:{lineage_id}")
        for source in parents | sources:
            lineage_links.add(frozenset((child, source)))

    for marriage in registries.get("marriage_registry", []):
        marriage_id = marriage["marriage_contract_id"]
        partners = marriage.get("partner_life_ids", [])
        if len(partners) != len(set(partners)) or len(partners) < 2:
            errors.append(f"MARRIAGE_SELF_REFERENCE:{marriage_id}")
        if any(partner not in lives for partner in partners):
            errors.append(f"MARRIAGE_LIFE_REFERENCE_INVALID:{marriage_id}")
        for index, partner in enumerate(partners):
            for other in partners[index + 1 :]:
                if frozenset((partner, other)) in lineage_links:
                    errors.append(f"MARRIAGE_FORK_REFERENCE:{marriage_id}")

    for reproduction in registries.get("reproduction_registry", []):
        reproduction_id = reproduction["reproduction_contract_id"]
        child = reproduction.get("child_life_id")
        parents = reproduction.get("parent_life_ids", [])
        if child not in lives or child in parents:
            errors.append(f"REPRODUCTION_NEW_LIFE_REQUIRED:{reproduction_id}")
        birth_id = reproduction.get("birth_event_id")
        if birth_id not in births or births[birth_id].get("child_life_id") != child:
            errors.append(f"REPRODUCTION_BIRTH_REFERENCE_INVALID:{reproduction_id}")

    for lease_id, lease in leases.items():
        status = lease.get("revocation_status")
        try:
            starts = parse_timestamp(lease["starts_at"])
            expires = parse_timestamp(lease["expires_at"])
            heartbeat = parse_timestamp(lease["heartbeat_at"])
        except (KeyError, TypeError, ValueError):
            errors.append(f"AUTHORITY_LEASE_TIME_INVALID:{lease_id}")
            continue
        if expires <= starts or expires <= now or status != "ACTIVE":
            errors.append(f"AUTHORITY_LEASE_NOT_ACTIVE:{lease_id}")
        if heartbeat < starts or heartbeat > expires:
            errors.append(f"AUTHORITY_LEASE_HEARTBEAT_INVALID:{lease_id}")
        if lease.get("subject_agent_instance_id") not in instances:
            errors.append(f"AUTHORITY_LEASE_INSTANCE_INVALID:{lease_id}")
        life_id = lease.get("subject_life_id")
        if life_id is not None and life_id not in lives:
            errors.append(f"AUTHORITY_LEASE_LIFE_INVALID:{lease_id}")

    return errors


def main() -> int:
    base = Path(__file__).resolve().parent
    schema = load_json(base / "KAIOS_UNIQUE_LIFE_IDENTITY_REGISTRY_SCHEMA_V0_1.json")
    rules = load_json(base / "KAIOS_UNIQUE_LIFE_IDENTITY_VALIDATION_RULES_V0_1.json")
    candidate = load_json(base / "KAIOS_CODEX_GM_LIFE_CANDIDATE_RECORD_TEMPLATE_V0_1.json")
    errors = validate_schema_contract(schema, rules)
    errors.extend(validate_candidate_template(candidate))
    for name in PHASE4_TEMPLATE_NAMES:
        errors.extend(validate_phase4_template(load_json(base / name)))
    for name in PRIMEFORGE_TEMPLATE_NAMES:
        errors.extend(validate_phase4_template(load_json(base / name)))
    result = {
        "status": "PASS" if not errors else "FAIL",
        "validation_errors": errors,
        "registry_schema_count": len(rules["registry_names"]),
        "id_type_count": len(rules["id_format"]["prefixes"]),
        "candidate_template_status": (
            "REJECTED_AS_LIVE_IDENTITY" if not errors else "INVALID_TEMPLATE"
        ),
        "phase4_templates": f"{len(PHASE4_TEMPLATE_NAMES)}/{len(PHASE4_TEMPLATE_NAMES)}",
        "primeforge_templates": (
            f"{len(PRIMEFORGE_TEMPLATE_NAMES)}/{len(PRIMEFORGE_TEMPLATE_NAMES)}"
        ),
        "runtime_authority": rules["runtime_authority"],
        "live_identity_creation": rules["live_identity_creation"],
    }
    print(json.dumps(result, ensure_ascii=False, sort_keys=True))
    return 0 if not errors else 1


if __name__ == "__main__":
    raise SystemExit(main())
