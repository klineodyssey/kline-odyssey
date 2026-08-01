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


if __name__ == "__main__":
    unittest.main()
