import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[4]
REGISTRY_PATH = ROOT / "KGEN-KAIOS" / "worker_registry.json"
SCHEMA_PATH = ROOT / "KGEN-KAIOS" / "worker_status_schema.json"


def load_json(path):
    raw = path.read_bytes()
    if raw.startswith(b"\xef\xbb\xbf"):
        raise AssertionError(f"UTF-8 BOM is not allowed: {path}")
    return json.loads(raw.decode("utf-8"))


def normalize_cursor_branch(policy, task_id, requested_branch):
    canonical = policy["canonical_template"].replace("<Task-ID>", task_id)
    if requested_branch == canonical:
        return canonical
    if requested_branch.startswith("cursor/") and requested_branch.count("/") == 1:
        feature_name = requested_branch.split("/", 1)[1]
        if feature_name and feature_name != "<feature-name>":
            return canonical
    raise ValueError(policy["mismatch_result"])


class CursorWorkerRegistryRepairTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.registry = load_json(REGISTRY_PATH)
        cls.schema = load_json(SCHEMA_PATH)
        cls.cursor = next(
            worker
            for worker in cls.registry["workers"]
            if worker["worker_id"] == "cursor-01"
        )

    def test_all_workers_match_declared_schema_fields(self):
        required = set(self.schema["required"])
        properties = self.schema["properties"]
        for worker in self.registry["workers"]:
            self.assertFalse(required - set(worker), worker["worker_id"])
            self.assertFalse(set(worker) - set(properties), worker["worker_id"])
            for key, value in worker.items():
                allowed = properties[key].get("enum")
                if allowed is not None:
                    self.assertIn(value, allowed, f"{worker['worker_id']}:{key}")

    def test_one_executable_cursor_namespace(self):
        policy = self.registry["cursor_branch_policy"]
        self.assertEqual(policy["executable_namespace_count"], 1)
        self.assertEqual(policy["canonical_template"], "cursor-handoff/<Task-ID>")
        self.assertEqual(
            self.cursor["allowed_branch_pattern"], policy["canonical_template"]
        )

    def test_requested_feature_branch_is_normalized(self):
        policy = self.registry["cursor_branch_policy"]
        self.assertEqual(
            normalize_cursor_branch(
                policy,
                "KAIOS-PR67-CURSOR-FOUNDATIONAL-LIFE-CANDIDATES-001",
                "cursor/kaios-foundational-life-candidates-v1",
            ),
            "cursor-handoff/KAIOS-PR67-CURSOR-FOUNDATIONAL-LIFE-CANDIDATES-001",
        )

    def test_unlisted_branch_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "BRANCH_POLICY_MISMATCH"):
            normalize_cursor_branch(
                self.registry["cursor_branch_policy"],
                "KAIOS-PR67-CURSOR-FOUNDATIONAL-LIFE-CANDIDATES-001",
                "feature/unregistered",
            )

    def test_foundational_life_creator_scope(self):
        self.assertEqual(self.cursor["worker_class"], "FOUNDATIONAL_LIFE_CREATOR")
        self.assertEqual(
            self.cursor["worker_classes"],
            ["FOUNDATIONAL_LIFE_CREATOR", "LIFE_RESEARCH_ANALYST"],
        )
        self.assertEqual(self.cursor["permission"], "worker_code_limited")
        self.assertTrue(
            {"GRASS", "TREE", "FISH", "SHRIMP", "MOUNTAIN", "SOIL", "WATER", "RIVER"}
            <= set(self.cursor["allowed_work"])
        )
        self.assertTrue(
            {
                "WALLET",
                "KGEN",
                "CURRENT",
                "CANONICAL_SCHEMA",
                "UNIVERSE_LAW",
                "RUNTIME",
                "DEPLOYMENT",
                "MERGE",
            }
            <= set(self.cursor["forbidden_work"])
        )
        self.assertFalse(self.cursor["can_push_main"])
        self.assertEqual(self.cursor["reviewer"], "codex-gm-01")

    def test_ecology_candidate_dispatch_is_bounded(self):
        dispatch = next(
            item
            for item in self.registry["dispatch_history"]
            if item["task_id"] == "KAIOS-ECOLOGY-V1-CANDIDATE-DATA-001"
        )
        self.assertEqual(dispatch["worker_id"], self.cursor["worker_id"])
        self.assertEqual(
            dispatch["branch"],
            "cursor-handoff/KAIOS-ECOLOGY-V1-CANDIDATE-DATA-001",
        )
        self.assertEqual(dispatch["status"], "COMPLETED_CODEX_REVIEWED")
        self.assertTrue(
            {
                "FOUNDATIONAL_FOOD_RELATIONSHIP_DATASET",
                "HABITAT_COMPATIBILITY_MATRIX",
                "SPECIES_ENVIRONMENTAL_THRESHOLD_DATASET",
                "POPULATION_SCENARIO_FIXTURE",
                "ECOSYSTEM_VIEWER_CARD_DATA",
                "CANDIDATE_ECOLOGY_TEST",
            }
            <= set(self.cursor["allowed_work"])
        )

    def test_forest_candidate_dispatch_is_the_only_active_claim(self):
        active = [
            item
            for item in self.registry["dispatch_history"]
            if item["status"] in {"DISPATCHED", "IN_PROGRESS", "REVIEW"}
        ]
        self.assertEqual(len(active), 1)
        dispatch = active[0]
        self.assertEqual(dispatch["task_id"], "KAIOS-CURSOR-FOREST-LIFE-PACKAGES-001")
        self.assertEqual(dispatch["worker_id"], self.cursor["worker_id"])
        self.assertEqual(
            dispatch["branch"],
            "cursor-handoff/KAIOS-CURSOR-FOREST-LIFE-PACKAGES-001",
        )
        self.assertEqual(dispatch["output_status"], "CURSOR_RESEARCH_CANDIDATE_ONLY")
        self.assertEqual(self.cursor["current_task"], dispatch["task_id"])
        self.assertEqual(self.cursor["current_branch"], dispatch["branch"])
        self.assertIn("FOREST_LIFE_PACKAGE_RESEARCH", self.cursor["allowed_work"])

    def test_dispatch_history_preserves_foundational_life_lineage(self):
        dispatch = next(
            item
            for item in self.registry["dispatch_history"]
            if item["task_id"] == "KAIOS-PR67-CURSOR-FOUNDATIONAL-LIFE-CANDIDATES-001"
        )
        self.assertEqual(
            dispatch["branch"],
            "cursor-handoff/KAIOS-PR67-CURSOR-FOUNDATIONAL-LIFE-CANDIDATES-001",
        )
        self.assertEqual(dispatch["output_status"], "CANDIDATE_ONLY")


if __name__ == "__main__":
    unittest.main()
