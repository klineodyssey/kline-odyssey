from __future__ import annotations

import copy
import json
import sys
import tempfile
import unittest
from pathlib import Path

ORGANISM_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = ORGANISM_ROOT.parents[1]
sys.path.insert(0, str(ORGANISM_ROOT))

from natural_instantiation import candidate_organism_id, dry_run, migrate_legacy
from validate_organism import (
    CANONICAL_LEVELS,
    EXTENSION_19_LEVELS,
    PACKAGE_FILES,
    ValidationError,
    content_hash,
    load_json,
    validate_all,
    validate_boundaries,
    validate_integrity_hash,
    validate_manifest,
    validate_package,
    validate_species_registry,
    validate_taxonomy_registry,
    validate_unique_organism_ids,
)


class CanonicalOrganismImplementationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.taxonomy = load_json(ORGANISM_ROOT / "taxonomy_registry.json")
        cls.species = load_json(ORGANISM_ROOT / "species_registry.json")
        cls.package = ORGANISM_ROOT / "package-template"
        cls.manifest = load_json(cls.package / "organism.json")

    def species_record(self, species_id: str) -> dict:
        return next(record for record in self.species["species"] if record["species_id"] == species_id)

    def test_01_canonical_taxonomy_has_12_levels(self) -> None:
        self.assertEqual(12, len(CANONICAL_LEVELS))
        validate_taxonomy_registry(self.taxonomy)

    def test_02_extension_has_19_layers(self) -> None:
        self.assertEqual(19, len(EXTENSION_19_LEVELS))
        validate_taxonomy_registry(self.taxonomy)

    def test_03_species_program_binding_resolves(self) -> None:
        validate_species_registry(REPO_ROOT, self.species, self.taxonomy)

    def test_04_runtime_entrypoint_resolution(self) -> None:
        result = dry_run(REPO_ROOT, self.package)
        self.assertEqual("RELEASE", result["completed_through"])

    def test_05_organism_package_is_complete(self) -> None:
        self.assertEqual(16, len(PACKAGE_FILES))
        validate_package(REPO_ROOT, self.package)

    def test_06_dna_and_rna_references_resolve(self) -> None:
        validate_manifest(REPO_ROOT, self.manifest)
        self.assertTrue((REPO_ROOT / self.manifest["dna_ref"]).is_file())
        self.assertTrue((REPO_ROOT / self.manifest["rna_ref"]).is_file())

    def test_07_organ_references_are_valid(self) -> None:
        validate_package(REPO_ROOT, self.package)

    def test_08_invalid_organ_reference_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp) / "package"
            import shutil
            shutil.copytree(self.package, target)
            data = load_json(target / "organism.json")
            data["runtime_binding"]["required_organs"] = ["UNKNOWN_ORGAN"]
            (target / "organism.json").write_text(json.dumps(data), encoding="utf-8")
            with self.assertRaisesRegex(ValidationError, "invalid organ"):
                validate_package(REPO_ROOT, target)

    def test_09_cell_references_are_valid(self) -> None:
        cells = load_json(self.package / "dna" / "cells.json")
        self.assertEqual("PROGRAM_MODULE", cells["cells"][0]["organ_id"])

    def test_10_invalid_cell_reference_is_rejected(self) -> None:
        with tempfile.TemporaryDirectory() as temp:
            target = Path(temp) / "package"
            import shutil
            shutil.copytree(self.package, target)
            data = load_json(target / "dna" / "cells.json")
            data["cells"][0]["organ_id"] = "UNKNOWN"
            (target / "dna" / "cells.json").write_text(json.dumps(data), encoding="utf-8")
            with self.assertRaisesRegex(ValidationError, "unknown organ"):
                validate_package(REPO_ROOT, target)

    def test_11_energy_profiles_exist(self) -> None:
        profiles = load_json(ORGANISM_ROOT / "profiles" / "energy_profiles.json")
        self.assertEqual(5, len(profiles["profiles"]))

    def test_12_lifecycle_rules_are_category_appropriate(self) -> None:
        house = self.species_record("KAIOS_HOUSE_V1")
        land = self.species_record("KAIOS_LAND_PARCEL_V1")
        self.assertIn("BUILT", house["lifecycle"])
        self.assertIn("STEWARDED", land["lifecycle"])

    def test_13_reproduction_compatibility_validates(self) -> None:
        validate_species_registry(REPO_ROOT, self.species, self.taxonomy)

    def test_14_incompatible_reproduction_rule_is_rejected(self) -> None:
        candidate = copy.deepcopy(self.species)
        candidate["species"][0]["reproduction_rules_ref"] = (
            "KGEN-KAIOS/organism/profiles/reproduction_profiles.json#UNKNOWN"
        )
        with self.assertRaisesRegex(ValidationError, "incompatible reproduction"):
            validate_species_registry(REPO_ROOT, candidate, self.taxonomy)

    def test_15_mutation_policy_is_non_production(self) -> None:
        profiles = load_json(ORGANISM_ROOT / "profiles" / "mutation_profiles.json")
        self.assertTrue(all(not value.get("production_mutation", False) for value in profiles["profiles"].values()))

    def test_16_evolution_policy_requires_review(self) -> None:
        self.assertIn("review", self.manifest["life_behavior"]["evolution_policy"])

    def test_17_trade_profile_has_all_right_classes(self) -> None:
        trade = load_json(ORGANISM_ROOT / "profiles" / "trade_profiles.json")
        self.assertEqual(10, len(trade["rights"]))
        self.assertFalse(trade["settlement_active"])

    def test_18_ownership_and_occupancy_are_separate(self) -> None:
        embodiment = load_json(self.package / "embodiment" / "embodiment.json")
        self.assertIn("owner_id", embodiment)
        self.assertIn("occupant_id", embodiment)
        self.assertTrue(embodiment["ownership_and_occupancy_separated"])

    def test_19_land_title_handling(self) -> None:
        land = self.species_record("KAIOS_LAND_PARCEL_V1")
        self.assertTrue(land["trade_profile_ref"].endswith("#LAND_TITLE"))

    def test_20_building_title_handling(self) -> None:
        house = self.species_record("KAIOS_HOUSE_V1")
        self.assertTrue(house["trade_profile_ref"].endswith("#BUILDING_TITLE"))

    def test_21_app_life_binding(self) -> None:
        app = self.species_record("KAIOS_APP_LIFE_V1")
        self.assertTrue((REPO_ROOT / app["program_filename"]).is_file())

    def test_22_animal_life_examples(self) -> None:
        self.assertEqual("BIOLOGICAL_SIMULATION_ONLY", self.species_record("BOS_TAURUS_KAIOS_V1")["compatibility"][0])
        self.assertEqual("BIOLOGICAL_SIMULATION_ONLY", self.species_record("OVIS_ARIES_KAIOS_V1")["compatibility"][0])

    def test_23_robot_life_is_not_autonomous(self) -> None:
        robot = self.species_record("KAIOS_ORDINARY_ROBOT_V1")
        self.assertIn("NON_AUTONOMOUS_MACHINE", robot["compatibility"])

    def test_24_natural_instantiation_is_dry_run(self) -> None:
        result = dry_run(REPO_ROOT, self.package)
        self.assertEqual("DRY_RUN", result["release_status"])
        self.assertEqual("CANDIDATE_ONLY", result["organism_id_status"])

    def test_25_high_authority_rejected_without_authority(self) -> None:
        candidate = copy.deepcopy(self.manifest)
        candidate["organism_class"] = "WALLET_CONTROLLER"
        with self.assertRaisesRegex(ValidationError, "high-authority"):
            validate_manifest(REPO_ROOT, candidate)

    def test_26_placeholder_live_record_is_rejected(self) -> None:
        with self.assertRaisesRegex(ValidationError, "placeholder"):
            validate_manifest(REPO_ROOT, self.manifest, live_record=True)

    def test_27_duplicate_organism_id_is_rejected(self) -> None:
        with self.assertRaisesRegex(ValidationError, "duplicate"):
            validate_unique_organism_ids([{"organism_id": "same"}, {"organism_id": "same"}])

    def test_28_duplicate_species_id_is_rejected(self) -> None:
        candidate = copy.deepcopy(self.species)
        candidate["species"].append(copy.deepcopy(candidate["species"][0]))
        with self.assertRaisesRegex(ValidationError, "duplicate species"):
            validate_species_registry(REPO_ROOT, candidate, self.taxonomy)

    def test_29_invalid_taxonomy_ancestry_is_rejected(self) -> None:
        candidate = copy.deepcopy(self.taxonomy)
        candidate["records"][0]["taxonomy"]["species"] = "OTHER"
        with self.assertRaisesRegex(ValidationError, "ends at another Species"):
            validate_taxonomy_registry(candidate)

    def test_30_circular_taxonomy_is_rejected(self) -> None:
        candidate = copy.deepcopy(self.taxonomy)
        candidate["rank_parent_order"]["domain"] = "civilization"
        with self.assertRaisesRegex(ValidationError, "invalid taxonomy ancestry"):
            validate_taxonomy_registry(candidate)

    def test_31_runtime_activation_remains_false(self) -> None:
        result = dry_run(REPO_ROOT, self.package)
        self.assertFalse(result["runtime_life_started"])
        self.assertFalse(result["runtime_authority"])

    def test_32_wallet_creation_remains_false(self) -> None:
        self.assertFalse(dry_run(REPO_ROOT, self.package)["wallet_created"])

    def test_33_k11520_settlement_remains_false(self) -> None:
        self.assertFalse(dry_run(REPO_ROOT, self.package)["k11520_settlement"])

    def test_34_codex_birth_remains_false(self) -> None:
        self.assertFalse(dry_run(REPO_ROOT, self.package)["codex_birth"])

    def test_35_new_thread_authorization_remains_false(self) -> None:
        self.assertFalse(dry_run(REPO_ROOT, self.package)["new_thread_authorized"])

    def test_36_protected_boundary_scan_passes(self) -> None:
        validate_boundaries(REPO_ROOT)

    def test_37_legacy_manifest_remains_compatible(self) -> None:
        legacy = load_json(REPO_ROOT / "KGEN-KAIOS" / "examples" / "organisms" / "app-kaios-dashboard.organism.json")
        validate_manifest(REPO_ROOT, legacy)

    def test_38_migration_is_dry_run_and_no_write(self) -> None:
        path = REPO_ROOT / "KGEN-KAIOS" / "examples" / "organisms" / "app-kaios-dashboard.organism.json"
        before = path.read_bytes()
        result = migrate_legacy(REPO_ROOT, path)
        self.assertEqual("DRY_RUN", result["migration_status"])
        self.assertEqual(before, path.read_bytes())

    def test_39_candidate_id_is_deterministic(self) -> None:
        self.assertEqual(candidate_organism_id(self.manifest), candidate_organism_id(self.manifest))

    def test_40_content_hash_excludes_integrity_hash(self) -> None:
        first = copy.deepcopy(self.manifest)
        second = copy.deepcopy(self.manifest)
        first["integrity_hash"] = "0" * 64
        second["integrity_hash"] = "f" * 64
        self.assertEqual(content_hash(first), content_hash(second))
        first["integrity_hash"] = content_hash(first)
        validate_integrity_hash(first)
        first["integrity_hash"] = "f" * 64
        with self.assertRaisesRegex(ValidationError, "integrity hash mismatch"):
            validate_integrity_hash(first)

    def test_41_full_validator_passes(self) -> None:
        result = validate_all(REPO_ROOT)
        self.assertEqual(6, result["species"])

    def test_42_missing_species_implementation_is_rejected(self) -> None:
        candidate_taxonomy = copy.deepcopy(self.taxonomy)
        candidate_taxonomy["records"] = [
            record for record in candidate_taxonomy["records"]
            if record["species_id"] != "KAIOS_APP_LIFE_V1"
        ]
        with self.assertRaisesRegex(ValidationError, "invalid taxonomy ancestry"):
            validate_species_registry(REPO_ROOT, self.species, candidate_taxonomy)

    def test_43_missing_program_filename_is_rejected(self) -> None:
        candidate = copy.deepcopy(self.species)
        del candidate["species"][0]["program_filename"]
        with self.assertRaisesRegex(ValidationError, "missing fields"):
            validate_species_registry(REPO_ROOT, candidate, self.taxonomy)

    def test_44_nonexistent_runtime_entrypoint_is_rejected(self) -> None:
        candidate = copy.deepcopy(self.species)
        candidate["species"][0]["runtime_entrypoint"] = "KGEN-KAIOS/organism/runtime/missing.py#main"
        with self.assertRaisesRegex(ValidationError, "missing repository reference"):
            validate_species_registry(REPO_ROOT, candidate, self.taxonomy)

    def test_45_json_schema_declares_v2_contract(self) -> None:
        schema = load_json(REPO_ROOT / "KGEN-KAIOS" / "provenance" / "ORGANISM_MANIFEST_SCHEMA.json")
        self.assertEqual("https://json-schema.org/draft/2020-12/schema", schema["$schema"])
        self.assertEqual("2.0", schema["metadata"]["version"])
        self.assertTrue(
            {"taxonomy", "runtimeBinding", "lifeBehavior", "release"}.issubset(schema["$defs"])
        )

    def test_46_v2_schema_requires_expanded_fields(self) -> None:
        schema = load_json(REPO_ROOT / "KGEN-KAIOS" / "provenance" / "ORGANISM_MANIFEST_SCHEMA.json")
        required = set(schema["allOf"][0]["then"]["required"])
        for field in ("taxonomy", "runtime_binding", "life_behavior", "release", "integrity_hash"):
            self.assertIn(field, required)


if __name__ == "__main__":
    unittest.main()
