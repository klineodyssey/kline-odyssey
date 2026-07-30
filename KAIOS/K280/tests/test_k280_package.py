import json
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
K280 = ROOT / "KAIOS" / "K280"
SPECIES = ROOT / "KAIOS" / "life" / "species" / "k280-raptor"
ORGANISM = ROOT / "KAIOS" / "life" / "organisms" / "KAIOS-RAPTOR-K280-001"


class K280PackageTests(unittest.TestCase):
    def load(self, path):
        return json.loads(path.read_text(encoding="utf-8"))

    def test_required_species_files(self):
        expected = {
            "species.json", "taxonomy.json", "species_manifest.json",
            "genome.schema.json", "genome.default.json", "body_plan.json",
            "organ_systems.json", "cell_system.json", "behavior_model.json",
            "memory_model.json", "lifecycle.json", "reproduction.json",
            "mutation_rules.json", "habitat_requirements.json",
            "civilization_affinity.json", "rights_template.json",
            "runtime_binding.json", "README.md",
        }
        self.assertEqual(expected - {p.name for p in SPECIES.iterdir()}, set())

    def test_required_organism_files(self):
        expected = {
            "identity.json", "life_identity.json", "organism_manifest.json",
            "birth_record.json", "provenance.json", "integrity.json",
            "genome.json", "phenotype.json", "body.json", "cells.json",
            "organs.json", "health.json", "energy.json", "needs.json",
            "behavior.json", "memory.json", "personality.json",
            "lifecycle.json", "reproduction_state.json",
            "mutation_history.json", "habitat.json",
            "civilization_state.json", "runtime_state.json",
            "event_log.json", "ownership.json", "custody.json",
            "operation_rights.json", "usage_rights.json",
            "breeding_rights.json", "commercial_license.json",
            "transfer_rights.json", "habitat_rights.json", "authority.json",
            "README.md",
        }
        self.assertEqual(expected - {p.name for p in ORGANISM.iterdir()}, set())

    def test_identity_scope(self):
        identity = self.load(ORGANISM / "identity.json")
        self.assertEqual(identity["life_id"], "LIFE-KAIOS-RAPTOR-K280-001")
        self.assertEqual(identity["organism_id"], "KAIOS-RAPTOR-K280-001")
        self.assertEqual(identity["identity_scope"], "K280_DIGITAL_LIFE_MVP_ONLY")
        self.assertFalse(identity["legal_personhood"])
        self.assertFalse(identity["sentience_claimed"])
        self.assertFalse(identity["real_biological_life"])

    def test_organism_schema_v2_references_resolve(self):
        manifest = self.load(ORGANISM / "organism_manifest.json")
        self.assertEqual(manifest["schema_version"], "2.0")
        for field in (
            "species_ref", "canonical_file", "runtime_entry", "dna_schema",
            "dna_ref", "rna_ref", "organs_ref", "cells_ref", "runtime_ref",
            "energy_profile_ref", "embodiment_profile_ref", "lifecycle_ref",
            "reproduction_rules_ref", "mutation_rules_ref",
            "trade_profile_ref", "ownership_profile_ref",
            "authority_profile_ref",
        ):
            self.assertTrue((ROOT / manifest[field].split("#", 1)[0]).is_file(), field)

    def test_genome_schema_and_checksum_shape(self):
        schema = self.load(SPECIES / "genome.schema.json")
        genome = self.load(ORGANISM / "genome.json")
        self.assertEqual(schema["properties"]["species_id"]["const"], genome["species_id"])
        self.assertRegex(genome["integrity_checksum"], r"^[a-f0-9]{64}$")
        self.assertFalse(genome["biological_instruction"])
        self.assertTrue(genome["simulation_only"])

    def test_birth_pipeline_is_fail_closed_shape(self):
        pipeline = self.load(K280 / "data" / "birth_pipeline.json")
        self.assertEqual(len(pipeline["stages"]), 10)
        self.assertTrue(all(stage["validation_status"] == "PASS" for stage in pipeline["stages"]))
        self.assertTrue(all(re.fullmatch(r"[a-f0-9]{64}", stage["integrity_checksum"]) for stage in pipeline["stages"]))
        self.assertFalse(pipeline["production_authority"])
        self.assertIsNone(pipeline["wallet"])
        self.assertFalse(pipeline["real_kgen"])

    def test_static_api_matches_canonical_package(self):
        pairs = {
            "species.json": SPECIES / "species.json",
            "organism.json": ORGANISM / "organism_manifest.json",
            "listing.json": ROOT / "KAIOS" / "exchange" / "11520" / "listings" / "KAIOS-RAPTOR-K280-001.listing.json",
            "rights.json": SPECIES / "rights_template.json",
        }
        for api_name, source in pairs.items():
            self.assertEqual(
                self.load(ROOT / "api" / "kaios" / "k280" / api_name),
                self.load(source),
            )

    def test_no_real_world_claims_or_authority(self):
        forbidden = [
            '"production_' + 'authority": true',
            '"wallet_' + 'authority": true',
            '"real_' + 'kgen": true',
        ]
        for path in [*K280.rglob("*"), *SPECIES.rglob("*"), *ORGANISM.rglob("*")]:
            if not path.is_file() or path.suffix not in {".json", ".js", ".mjs", ".md", ".html", ".css", ".py"}:
                continue
            text = path.read_text(encoding="utf-8")
            for pattern in forbidden:
                self.assertNotIn(pattern, text.lower())

    def test_viewer_contract_and_responsive_breakpoints(self):
        html = (ROOT / "KGEN-KAIOS" / "world-viewer" / "k280" / "index.html").read_text(encoding="utf-8")
        css = (ROOT / "KGEN-KAIOS" / "world-viewer" / "k280" / "styles.css").read_text(encoding="utf-8")
        for control in ("start-button", "pause-button", "step-button", "reset-button", "replay-button", "speed-select"):
            self.assertIn(f'id="{control}"', html)
        self.assertIn('name="viewport"', html)
        self.assertIn("@media (max-width: 980px)", css)
        self.assertIn("@media (max-width: 680px)", css)
        self.assertIn("orientation: landscape", css)

    def test_terminology_gate(self):
        targets = [
            path for root in (K280, SPECIES, ORGANISM, ROOT / "KGEN-KAIOS" / "world-viewer" / "k280")
            for path in root.rglob("*") if path.is_file()
        ]
        content = "\n".join(
            path.read_text(encoding="utf-8")
            for path in targets
            if path.suffix.lower() in {".json", ".js", ".mjs", ".md", ".html", ".css", ".py", ".svg"}
        )
        prohibited = "".join(chr(code) for code in (0x795e, 0x9650, 0x6587, 0x660e))
        self.assertNotIn(prohibited, content)
        self.assertNotIn("DIVINE" + "_LIMIT", content)
        self.assertIn("神仙文明", content)
        self.assertIn("IMMORTAL_CIVILIZATION", content)


if __name__ == "__main__":
    unittest.main()
