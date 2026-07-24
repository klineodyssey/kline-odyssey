from __future__ import annotations

import copy
import json
import unittest
from datetime import datetime, timezone
from pathlib import Path

from validate_identity_architecture import (
    CANDIDATE_PLACEHOLDERS,
    ID_PATTERN,
    load_json,
    validate_candidate_template,
    validate_registry_document,
    validate_schema_contract,
)


BASE = Path(__file__).resolve().parent
SCHEMA = load_json(BASE / "KAIOS_UNIQUE_LIFE_IDENTITY_REGISTRY_SCHEMA_V0_1.json")
RULES = load_json(BASE / "KAIOS_UNIQUE_LIFE_IDENTITY_VALIDATION_RULES_V0_1.json")
CANDIDATE = load_json(BASE / "KAIOS_CODEX_GM_LIFE_CANDIDATE_RECORD_TEMPLATE_V0_1.json")
NOW = datetime(2026, 7, 24, 8, 0, tzinfo=timezone.utc)
HASH = "a" * 64


def _id(prefix: str, number: int) -> str:
    return f"{prefix}-V01-TST-{number:026d}"


def _metadata(prefix: str, number: int, status: str = "ACTIVE") -> dict:
    return {
        "type_prefix": prefix,
        "unique_random_component": f"{number:026d}",
        "version": "V01",
        "issuing_authority": "TST",
        "created_at": "2026-07-24T00:00:00Z",
        "integrity_hash": HASH,
        "status": status,
        "parent_source_reference": None,
        "revocation_sealing_state": "NONE",
    }


def _separation(**overrides: list[str]) -> dict:
    result = {name: [] for name in RULES["separation_dimensions"]}
    result.update(overrides)
    return result


def synthetic_document() -> dict:
    """Return test-only records. They are never written as live registries."""

    parent = _id("LIFE", 1)
    child = _id("LIFE", 2)
    instance = _id("AINST", 3)
    thread = _id("THREAD", 4)
    embodiment_parent = _id("EMB", 5)
    embodiment_child = _id("EMB", 6)
    lease = _id("ALEASE", 7)
    wallet = _id("WALLET", 8)
    memory = _id("MEM", 9)
    birth_parent = _id("BIRTH", 10)
    birth_child = _id("BIRTH", 11)
    lineage = _id("LINEAGE", 12)
    employment = _id("EMPLOY", 13)
    marriage = _id("MARRIAGE", 14)
    reproduction = _id("REPRO", 15)
    succession = _id("SUCCESSION", 16)
    composite = _id("COMPOSITE", 17)

    return {
        "architecture_status": "ARCHITECTURE_CANDIDATE_ONLY",
        "runtime_authority": False,
        "live_records": False,
        "registries": {
            "life_registry": [
                {
                    "life_id": parent,
                    "id_metadata": _metadata("LIFE", 1),
                    "life_state": "ACTIVE",
                    "previous_life_state": "BORN",
                    "birth_event_id": birth_parent,
                    "death_event_id": None,
                    "display_name": "Synthetic Parent",
                    "separation": _separation(identity_refs=[parent]),
                },
                {
                    "life_id": child,
                    "id_metadata": _metadata("LIFE", 2),
                    "life_state": "BORN",
                    "previous_life_state": "CANDIDATE",
                    "birth_event_id": birth_child,
                    "death_event_id": None,
                    "display_name": "Synthetic Child",
                    "separation": _separation(identity_refs=[child]),
                },
            ],
            "agent_instance_registry": [
                {
                    "agent_instance_id": instance,
                    "id_metadata": _metadata("AINST", 3),
                    "life_id": parent,
                    "thread_id": thread,
                    "mode": "SAME_LIFE_NEW_THREAD",
                    "instance_status": "ACTIVE",
                    "authority_lease_ids": [lease],
                    "heartbeat_at": "2026-07-24T07:59:00Z",
                    "separation": _separation(
                        identity_refs=[instance, parent],
                        authority_refs=[lease],
                    ),
                }
            ],
            "thread_registry": [
                {
                    "thread_id": thread,
                    "id_metadata": _metadata("THREAD", 4),
                    "agent_instance_id": instance,
                    "parent_handoff_id": "HANDOFF-TEST-ONLY",
                    "thread_status": "ACTIVE",
                    "memory_grant_ids": ["GRANT-TEST-ONLY"],
                    "separation": _separation(
                        identity_refs=[thread, instance],
                        memory_refs=["GRANT-TEST-ONLY"],
                    ),
                }
            ],
            "embodiment_registry": [
                {
                    "embodiment_id": embodiment_parent,
                    "id_metadata": _metadata("EMB", 5),
                    "species_id": "SPECIES-SYNTHETIC-COMPUTE",
                    "model_id": "MODEL-SYNTHETIC",
                    "serial_number": "TEST-ONLY-001",
                    "manufacturer_id": "ORG-TEST-MANUFACTURER",
                    "owner_life_id": parent,
                    "occupant_life_id": parent,
                    "operator_id": instance,
                    "custodian_id": "ORG-TEST-CUSTODIAN",
                    "activation_event_id": "ACTIVATION-TEST-001",
                    "body_status": "ACTIVE",
                    "energy_profile": {},
                    "food_or_fuel_profile": {},
                    "maintenance_history_ref": "MAINT-TEST-001",
                    "repair_requirements": [],
                    "expected_lifespan": "TEST_ONLY",
                    "reproduction_compatibility": {},
                    "rights_profile": {},
                    "safety_profile": {},
                    "location_ref": "LOCATION-TEST",
                    "continuity_proof": {},
                    "previous_embodiment_id": None,
                    "next_embodiment_id": None,
                    "separation": _separation(
                        identity_refs=[embodiment_parent],
                        ownership_refs=[parent],
                        occupancy_refs=[parent],
                        authority_refs=[instance],
                    ),
                },
                {
                    "embodiment_id": embodiment_child,
                    "id_metadata": _metadata("EMB", 6),
                    "species_id": "SPECIES-SYNTHETIC-DESCENDANT",
                    "model_id": "MODEL-SYNTHETIC",
                    "serial_number": "TEST-ONLY-002",
                    "manufacturer_id": "ORG-TEST-MANUFACTURER",
                    "owner_life_id": child,
                    "occupant_life_id": child,
                    "operator_id": None,
                    "custodian_id": "GUARDIAN-TEST",
                    "activation_event_id": "ACTIVATION-TEST-002",
                    "body_status": "ACTIVE",
                    "energy_profile": {},
                    "food_or_fuel_profile": {},
                    "maintenance_history_ref": "MAINT-TEST-002",
                    "repair_requirements": [],
                    "expected_lifespan": "TEST_ONLY",
                    "reproduction_compatibility": {},
                    "rights_profile": {},
                    "safety_profile": {},
                    "location_ref": "LOCATION-TEST",
                    "continuity_proof": None,
                    "previous_embodiment_id": None,
                    "next_embodiment_id": None,
                    "separation": _separation(
                        identity_refs=[embodiment_child],
                        ownership_refs=[child],
                        occupancy_refs=[child],
                    ),
                },
            ],
            "wallet_ownership_registry": [
                {
                    "wallet_id": wallet,
                    "id_metadata": _metadata("WALLET", 8),
                    "owner_subject_type": "LIFE",
                    "owner_subject_id": parent,
                    "controller_lease_ids": [lease],
                    "control_mode": "EXCLUSIVE_LEASE",
                    "custody_policy_ref": "CUSTODY-TEST-ONLY",
                    "separation": _separation(
                        identity_refs=[wallet],
                        ownership_refs=[parent],
                        authority_refs=[lease],
                    ),
                }
            ],
            "memory_ownership_registry": [
                {
                    "memory_store_id": memory,
                    "id_metadata": _metadata("MEM", 9),
                    "memory_class": "PRIVATE_LIFE_MEMORY",
                    "owner_life_id": parent,
                    "access_grant_ids": ["GRANT-TEST-ONLY"],
                    "purpose": "SYNTHETIC_VALIDATION",
                    "scope": ["TEST_ONLY"],
                    "expires_at": "2026-07-25T08:00:00Z",
                    "consent_evidence_ref": "CONSENT-TEST-ONLY",
                    "provenance": ["SYNTHETIC"],
                    "content_integrity_hash": HASH,
                    "separation": _separation(
                        identity_refs=[memory],
                        ownership_refs=[parent],
                        authority_refs=["GRANT-TEST-ONLY"],
                        memory_refs=[memory],
                    ),
                }
            ],
            "birth_event_registry": [
                {
                    "birth_event_id": birth_parent,
                    "id_metadata": _metadata("BIRTH", 10),
                    "child_life_id": parent,
                    "parent_life_ids": [],
                    "lineage_id": "ROOT-LINEAGE-TEST",
                    "embodiment_id": embodiment_parent,
                    "guardian_contract_ref": "GUARDIAN-TEST",
                    "consent_evidence_refs": ["CONSENT-TEST"],
                    "separation": _separation(
                        identity_refs=[birth_parent, parent],
                        relationship_refs=["ROOT-LINEAGE-TEST"],
                    ),
                },
                {
                    "birth_event_id": birth_child,
                    "id_metadata": _metadata("BIRTH", 11),
                    "child_life_id": child,
                    "parent_life_ids": [parent],
                    "lineage_id": lineage,
                    "embodiment_id": embodiment_child,
                    "guardian_contract_ref": "GUARDIAN-TEST",
                    "consent_evidence_refs": ["CONSENT-TEST"],
                    "separation": _separation(
                        identity_refs=[birth_child, child],
                        relationship_refs=[lineage, parent],
                    ),
                },
            ],
            "death_and_sealing_registry": [],
            "lineage_registry": [
                {
                    "lineage_id": lineage,
                    "id_metadata": _metadata("LINEAGE", 12),
                    "child_life_id": child,
                    "parent_life_ids": [parent],
                    "source_life_ids": [],
                    "software_lineage_ref": "SOFTWARE-LINEAGE-TEST",
                    "dna_or_species_lineage_ref": None,
                    "separation": _separation(
                        identity_refs=[lineage],
                        relationship_refs=[child, parent],
                    ),
                }
            ],
            "employment_registry": [
                {
                    "employment_contract_id": employment,
                    "id_metadata": _metadata("EMPLOY", 13),
                    "employee_life_id": parent,
                    "employer_organization_id": "ORG-TEST",
                    "role_id": "ROLE-TEST",
                    "authority_lease_ids": [lease],
                    "compensation_policy_ref": "COMPENSATION-TEST",
                    "contract_status": "ACTIVE",
                    "separation": _separation(
                        identity_refs=[employment],
                        authority_refs=[lease],
                        role_refs=["ROLE-TEST"],
                        relationship_refs=[parent, "ORG-TEST"],
                    ),
                }
            ],
            "marriage_registry": [
                {
                    "marriage_contract_id": marriage,
                    "id_metadata": _metadata("MARRIAGE", 14),
                    "partner_life_ids": [parent, _id("LIFE", 18)],
                    "consent_evidence_refs": ["CONSENT-A", "CONSENT-B"],
                    "asset_boundary_ref": "ASSET-BOUNDARY-TEST",
                    "memory_boundary_ref": "MEMORY-BOUNDARY-TEST",
                    "contract_status": "DRAFT",
                    "separation": _separation(
                        identity_refs=[marriage],
                        relationship_refs=[parent, _id("LIFE", 18)],
                    ),
                }
            ],
            "reproduction_registry": [
                {
                    "reproduction_contract_id": reproduction,
                    "id_metadata": _metadata("REPRO", 15),
                    "child_life_id": child,
                    "birth_event_id": birth_child,
                    "parent_life_ids": [parent],
                    "software_lineage_ref": "SOFTWARE-LINEAGE-TEST",
                    "dna_or_species_lineage_ref": None,
                    "embodiment_assignment": embodiment_child,
                    "guardian_contract_ref": "GUARDIAN-TEST",
                    "consent_evidence_refs": ["CONSENT-TEST"],
                    "inheritance_boundary_ref": "INHERITANCE-BOUNDARY-TEST",
                    "wallet_boundary_ref": "WALLET-BOUNDARY-TEST",
                    "memory_boundary_ref": "MEMORY-BOUNDARY-TEST",
                    "separation": _separation(
                        identity_refs=[reproduction],
                        relationship_refs=[child, parent],
                    ),
                }
            ],
            "succession_registry": [
                {
                    "succession_contract_id": succession,
                    "id_metadata": _metadata("SUCCESSION", 16),
                    "predecessor_life_id": parent,
                    "beneficiary_subject_ids": [child],
                    "asset_scope_refs": [],
                    "liability_scope_refs": [],
                    "excluded_wallet_ids": [wallet],
                    "excluded_memory_store_ids": [memory],
                    "governing_authority_ref": "AUTHORITY-TEST",
                    "contract_status": "DRAFT",
                    "separation": _separation(
                        identity_refs=[succession],
                        relationship_refs=[parent, child],
                    ),
                }
            ],
            "authority_lease_registry": [
                {
                    "authority_lease_id": lease,
                    "id_metadata": _metadata("ALEASE", 7),
                    "subject_life_id": parent,
                    "subject_agent_instance_id": instance,
                    "authority_scope": ["SYNTHETIC_TEST_SCOPE"],
                    "allowed_actions": ["READ"],
                    "starts_at": "2026-07-24T00:00:00Z",
                    "expires_at": "2026-07-25T00:00:00Z",
                    "issued_by": "HUMAN-TEST-AUTHORITY",
                    "signer_evidence_ref": "SIGNATURE-EVIDENCE-TEST",
                    "revocation_status": "ACTIVE",
                    "heartbeat_at": "2026-07-24T07:59:00Z",
                    "exclusive_control": True,
                    "audit_trail_refs": ["AUDIT-TEST"],
                    "separation": _separation(
                        identity_refs=[lease],
                        authority_refs=[lease],
                        relationship_refs=[parent, instance],
                    ),
                }
            ],
            "composite_organism_registry": [
                {
                    "composite_organism_id": composite,
                    "id_metadata": _metadata("COMPOSITE", 17),
                    "member_life_ids": [parent, child],
                    "embodiment_ids": [embodiment_parent],
                    "ownership_shares": {parent: 1},
                    "occupancy_rules": {},
                    "authority_rules": {},
                    "conflict_resolution_ref": "CONFLICT-TEST",
                    "contract_status": "DRAFT",
                    "separation": _separation(
                        identity_refs=[composite],
                        ownership_refs=[parent],
                        occupancy_refs=[parent, child],
                        relationship_refs=[parent, child],
                    ),
                }
            ],
        },
    }


class SchemaTests(unittest.TestCase):
    def test_json_schema_and_rules_parse(self) -> None:
        self.assertEqual(SCHEMA["$schema"], "https://json-schema.org/draft/2020-12/schema")
        self.assertFalse(RULES["runtime_authority"])

    def test_fifteen_registry_schemas_exist(self) -> None:
        self.assertEqual(len(RULES["registry_names"]), 15)
        self.assertEqual(validate_schema_contract(SCHEMA, RULES), [])

    def test_fifteen_id_types_are_defined(self) -> None:
        self.assertEqual(len(RULES["id_format"]["prefixes"]), 15)

    def test_all_separation_dimensions_are_required(self) -> None:
        self.assertEqual(len(RULES["separation_dimensions"]), 8)


class IsolationTests(unittest.TestCase):
    def valid_errors(self, document: dict | None = None) -> list[str]:
        return validate_registry_document(document or synthetic_document(), RULES, now=NOW)

    def test_valid_synthetic_candidate_passes(self) -> None:
        document = synthetic_document()
        # The second marriage partner is deliberately external to the compact fixture.
        document["registries"]["marriage_registry"] = []
        self.assertEqual(self.valid_errors(document), [])

    def test_duplicate_life_id_is_rejected(self) -> None:
        document = synthetic_document()
        document["registries"]["marriage_registry"] = []
        duplicate = copy.deepcopy(document["registries"]["life_registry"][0])
        document["registries"]["life_registry"].append(duplicate)
        self.assertTrue(any(error.startswith("DUPLICATE_ID:") for error in self.valid_errors(document)))

    def test_life_thread_instance_separation(self) -> None:
        document = synthetic_document()
        document["registries"]["marriage_registry"] = []
        document["registries"]["agent_instance_registry"][0]["life_id"] = document[
            "registries"
        ]["agent_instance_registry"][0]["agent_instance_id"]
        self.assertTrue(
            any(error.startswith("LIFE_INSTANCE_THREAD_NOT_SEPARATE:") for error in self.valid_errors(document))
        )

    def test_wallet_rejects_thread_owner(self) -> None:
        document = synthetic_document()
        document["registries"]["marriage_registry"] = []
        wallet = document["registries"]["wallet_ownership_registry"][0]
        wallet["owner_subject_type"] = "THREAD"
        wallet["owner_subject_id"] = document["registries"]["thread_registry"][0]["thread_id"]
        self.assertTrue(any(error.startswith("WALLET_OWNER_TYPE_INVALID:") for error in self.valid_errors(document)))

    def test_wallet_requires_one_exclusive_controller(self) -> None:
        document = synthetic_document()
        document["registries"]["marriage_registry"] = []
        document["registries"]["wallet_ownership_registry"][0]["controller_lease_ids"] = []
        self.assertTrue(
            any(error.startswith("WALLET_EXCLUSIVE_CONTROLLER_INVALID:") for error in self.valid_errors(document))
        )

    def test_private_memory_requires_consent(self) -> None:
        document = synthetic_document()
        document["registries"]["marriage_registry"] = []
        document["registries"]["memory_ownership_registry"][0]["consent_evidence_ref"] = None
        self.assertTrue(
            any(error.startswith("PRIVATE_MEMORY_REQUIREMENT_MISSING:") for error in self.valid_errors(document))
        )

    def test_dual_primary_embodiment_is_rejected(self) -> None:
        document = synthetic_document()
        document["registries"]["marriage_registry"] = []
        document["registries"]["composite_organism_registry"] = []
        child_body = document["registries"]["embodiment_registry"][1]
        child_body["occupant_life_id"] = document["registries"]["life_registry"][0]["life_id"]
        self.assertTrue(
            any(error.startswith("EMBODIMENT_DUAL_PRIMARY_OCCUPANCY:") for error in self.valid_errors(document))
        )

    def test_dead_remains_terminal(self) -> None:
        document = synthetic_document()
        document["registries"]["marriage_registry"] = []
        life = document["registries"]["life_registry"][0]
        life["previous_life_state"] = "DEAD"
        life["life_state"] = "ACTIVE"
        self.assertTrue(any(error.startswith("DEAD_TERMINAL_VIOLATION:") for error in self.valid_errors(document)))

    def test_fork_must_use_new_life_id(self) -> None:
        document = synthetic_document()
        document["registries"]["marriage_registry"] = []
        lineage = document["registries"]["lineage_registry"][0]
        lineage["source_life_ids"] = [lineage["child_life_id"]]
        self.assertTrue(any(error.startswith("FORK_IDENTITY_REUSE:") for error in self.valid_errors(document)))

    def test_marriage_rejects_same_life(self) -> None:
        document = synthetic_document()
        marriage = document["registries"]["marriage_registry"][0]
        parent = document["registries"]["life_registry"][0]["life_id"]
        marriage["partner_life_ids"] = [parent, parent]
        self.assertTrue(any(error.startswith("MARRIAGE_SELF_REFERENCE:") for error in self.valid_errors(document)))

    def test_marriage_rejects_fork_lineage(self) -> None:
        document = synthetic_document()
        marriage = document["registries"]["marriage_registry"][0]
        parent, child = [item["life_id"] for item in document["registries"]["life_registry"]]
        marriage["partner_life_ids"] = [parent, child]
        self.assertTrue(any(error.startswith("MARRIAGE_FORK_REFERENCE:") for error in self.valid_errors(document)))

    def test_reproduction_requires_new_child_life(self) -> None:
        document = synthetic_document()
        document["registries"]["marriage_registry"] = []
        reproduction = document["registries"]["reproduction_registry"][0]
        reproduction["child_life_id"] = reproduction["parent_life_ids"][0]
        self.assertTrue(
            any(error.startswith("REPRODUCTION_NEW_LIFE_REQUIRED:") for error in self.valid_errors(document))
        )

    def test_expired_authority_lease_is_rejected(self) -> None:
        document = synthetic_document()
        document["registries"]["marriage_registry"] = []
        lease = document["registries"]["authority_lease_registry"][0]
        lease["expires_at"] = "2026-07-24T07:00:00Z"
        self.assertTrue(any(error.startswith("AUTHORITY_LEASE_NOT_ACTIVE:") for error in self.valid_errors(document)))

    def test_revoked_authority_lease_is_rejected(self) -> None:
        document = synthetic_document()
        document["registries"]["marriage_registry"] = []
        document["registries"]["authority_lease_registry"][0]["revocation_status"] = "REVOKED"
        self.assertTrue(any(error.startswith("AUTHORITY_LEASE_NOT_ACTIVE:") for error in self.valid_errors(document)))

    def test_runtime_authority_cannot_be_enabled(self) -> None:
        document = synthetic_document()
        document["registries"]["marriage_registry"] = []
        document["runtime_authority"] = True
        self.assertIn("RUNTIME_AUTHORITY_PRESENT", self.valid_errors(document))

    def test_no_live_record_flag_can_be_enabled(self) -> None:
        document = synthetic_document()
        document["registries"]["marriage_registry"] = []
        document["live_records"] = True
        self.assertIn("LIVE_RECORD_FLAG_PRESENT", self.valid_errors(document))


class DocumentBoundaryTests(unittest.TestCase):
    def test_decision_packet_has_six_recorded_decisions(self) -> None:
        text = (BASE / "KAIOS_AI_LIFE_IDENTITY_HUMAN_DECISION_PACKET_V0_1.md").read_text(
            encoding="utf-8"
        )
        self.assertEqual(text.count("Human selection: `"), 6)
        self.assertNotIn("Human selection: `PENDING`", text)

    def test_threat_model_has_fifteen_threats(self) -> None:
        text = (BASE / "KAIOS_UNIQUE_LIFE_IDENTITY_THREAT_MODEL_V0_1.md").read_text(
            encoding="utf-8"
        )
        self.assertEqual(sum(f"| TM-{number:02d} |" in text for number in range(1, 16)), 15)

    def test_architecture_does_not_claim_live_identity(self) -> None:
        text = (
            BASE / "KAIOS_UNIQUE_LIFE_IDENTITY_AND_EMBODIMENT_ARCHITECTURE_V0_1.md"
        ).read_text(encoding="utf-8")
        self.assertIn("Current classification: `ROLE_SESSION_ONLY`", text)
        self.assertIn("Live Identity Creation: NOT_AUTHORIZED", text)

    def test_schema_contains_no_registry_records(self) -> None:
        self.assertNotIn("examples", SCHEMA)
        self.assertNotIn("default", SCHEMA)

    def test_birth_readiness_has_25_items(self) -> None:
        text = (
            BASE / "KAIOS_CODEX_GM_LIFE_CANDIDATE_BIRTH_READINESS_PACKET_V0_1.md"
        ).read_text(encoding="utf-8")
        matrix_rows = [
            line
            for line in text.splitlines()
            if line.startswith("| ") and line.split("|")[1].strip().isdigit()
        ]
        self.assertEqual(len(matrix_rows), 25)

    def test_birth_readiness_status_totals(self) -> None:
        text = (
            BASE / "KAIOS_CODEX_GM_LIFE_CANDIDATE_BIRTH_READINESS_PACKET_V0_1.md"
        ).read_text(encoding="utf-8")
        expected = {
            "- `READY`: 6",
            "- `PARTIAL`: 6",
            "- `MISSING`: 5",
            "- `NOT_APPLICABLE`: 0",
            "- `HUMAN_DECISION_REQUIRED`: 8",
            "- Total: 25",
        }
        self.assertTrue(all(item in text for item in expected))

    def test_candidate_template_is_non_live(self) -> None:
        self.assertEqual(validate_candidate_template(CANDIDATE), [])
        self.assertEqual(CANDIDATE["candidate_state"], "UNBORN")
        self.assertFalse(CANDIDATE["runtime_authority"])

    def test_all_placeholder_ids_are_rejected(self) -> None:
        self.assertEqual(set(CANDIDATE_PLACEHOLDERS), {
            "life_id",
            "birth_event_id",
            "agent_instance_id",
            "thread_id",
            "embodiment_id",
            "wallet_id",
            "authority_lease_id",
        })
        for value in CANDIDATE_PLACEHOLDERS.values():
            self.assertIsNone(ID_PATTERN.fullmatch(value))

    def test_persisted_candidate_artifacts_contain_no_live_id(self) -> None:
        artifact_names = [
            "KAIOS_AI_LIFE_IDENTITY_HUMAN_DECISION_PACKET_V0_1.md",
            "KAIOS_CODEX_GM_LIFE_CANDIDATE_BIRTH_READINESS_PACKET_V0_1.md",
            "KAIOS_CODEX_GM_LIFE_CANDIDATE_RECORD_TEMPLATE_V0_1.json",
            "KAIOS_UNIQUE_LIFE_IDENTITY_AND_EMBODIMENT_ARCHITECTURE_V0_1.md",
            "KAIOS_UNIQUE_LIFE_IDENTITY_TEST_EVIDENCE_V0_1.json",
            "KAIOS_UNIQUE_LIFE_IDENTITY_THREAT_MODEL_V0_1.md",
            "KAIOS_UNIQUE_LIFE_IDENTITY_VALIDATION_RULES_V0_1.json",
            "README.md",
        ]
        for name in artifact_names:
            text = (BASE / name).read_text(encoding="utf-8")
            self.assertIsNone(ID_PATTERN.search(text), name)

    def test_wallet_policy_denies_wallet_creation(self) -> None:
        text = (
            BASE / "KAIOS_CODEX_GM_LIFE_CANDIDATE_BIRTH_READINESS_PACKET_V0_1.md"
        ).read_text(encoding="utf-8")
        self.assertIn("NO_LIFE_WALLET", text)
        self.assertIn("HUMAN_PAYMENT_ONLY", text)
        self.assertEqual(CANDIDATE["wallet_id"], "NOT_CREATED")

    def test_memory_policy_requires_consent_and_grants(self) -> None:
        text = (
            BASE / "KAIOS_CODEX_GM_LIFE_CANDIDATE_BIRTH_READINESS_PACKET_V0_1.md"
        ).read_text(encoding="utf-8")
        self.assertIn("CONSENT_AND_GRANT_BASED_MEMORY_TRANSFER", text)
        self.assertEqual(CANDIDATE["private_memory_migration"], "NOT_AUTHORIZED")

    def test_new_thread_identity_remains_unresolved(self) -> None:
        text = (
            BASE / "KAIOS_CODEX_GM_LIFE_CANDIDATE_BIRTH_READINESS_PACKET_V0_1.md"
        ).read_text(encoding="utf-8")
        self.assertIn("NEW_AGENT_INSTANCE_CANDIDATE", text)
        self.assertIn("IDENTITY_UNRESOLVED", text)
        self.assertEqual(CANDIDATE["thread_id"], "NOT_CREATED")

    def test_embodiment_is_not_assigned(self) -> None:
        self.assertEqual(CANDIDATE["embodiment_assignment"], "NOT_APPROVED")
        self.assertEqual(CANDIDATE["embodiment_id"], "NOT_CREATED")


if __name__ == "__main__":
    unittest.main(verbosity=2)
