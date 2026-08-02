import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[4]
REGISTRY_PATH = ROOT / "KGEN-KAIOS" / "worker_registry.json"
SCHEMA_PATH = ROOT / "KGEN-KAIOS" / "worker_status_schema.json"
FOREST_QUEUE_PATH = (
    ROOT
    / "KAIOS"
    / "life"
    / "forest-agriculture"
    / "KAIOS_CURSOR_CONTINUOUS_WORK_QUEUE.json"
)


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


KNOWN_CLAIM_STATES = {
    "DISPATCHED",
    "CLAIMED",
    "ACTIVE",
    "IN_PROGRESS",
    "REVIEW",
    "REPAIR",
    "APPROVED",
    "CLOSED",
    "RELEASED",
    "BLOCKED",
    "REJECTED",
    "CANCELLED",
    "EXPIRED",
    "ABANDONED",
    "COMPLETED_CODEX_REVIEWED",
}

UNLOCKED_CLAIM_STATES = {
    "RELEASED",
    "COMPLETED_CODEX_REVIEWED",
}


def lock_holding_claims(dispatch_history):
    observed = {item["status"] for item in dispatch_history}
    unknown = observed - KNOWN_CLAIM_STATES
    if unknown:
        raise ValueError(f"UNKNOWN_CLAIM_STATE:{sorted(unknown)}")
    return [
        item
        for item in dispatch_history
        if item["status"] not in UNLOCKED_CLAIM_STATES
    ]


def validate_one_task_lock(dispatch_history):
    locked = lock_holding_claims(dispatch_history)
    if len(locked) > 1:
        raise ValueError("CURSOR_ONE_TASK_LOCK_CONFLICT")
    return locked


class CursorWorkerRegistryRepairTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.registry = load_json(REGISTRY_PATH)
        cls.schema = load_json(SCHEMA_PATH)
        cls.forest_queue = load_json(FOREST_QUEUE_PATH)
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
                "RIGHTS_AUTHORITY",
                "ECONOMY_AUTHORITY",
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

    def test_fungi_close_release_order_leaves_zero_active_claims(self):
        metadata = self.registry["metadata"]
        self.assertEqual(
            metadata["source_commit"],
            "beb982fda885fa7acc4dc35407df611d1019a544",
        )
        self.assertEqual(
            metadata["task_id"],
            "KAIOS-CURSOR-FUNGI-CANDIDATE-001-RELEASE-PREPARE-MICROBIAL",
        )
        self.assertIn("Close and release", metadata["change_reason"])

        locked = validate_one_task_lock(self.registry["dispatch_history"])
        self.assertEqual(locked, [])
        self.assertEqual(self.registry["active_claims"], [])

        events = [
            event
            for event in self.registry["claim_events"]
            if event["task_id"] == "KAIOS-CURSOR-FUNGI-CANDIDATE-001"
        ]
        self.assertEqual(
            [event["event_type"] for event in events],
            ["CLAIM_CLOSED", "CLAIM_RELEASED"],
        )
        self.assertEqual([event["sequence"] for event in events], [1, 2])
        self.assertEqual(
            events[1]["previous_event_id"], events[0]["event_id"]
        )

    def test_dispatch_history_ends_with_released_fungi_and_excludes_microbial(self):
        final_dispatch = self.registry["dispatch_history"][-1]
        self.assertEqual(
            final_dispatch["task_id"], "KAIOS-CURSOR-FUNGI-CANDIDATE-001"
        )
        self.assertEqual(final_dispatch["status"], "RELEASED")
        self.assertNotIn(
            "KAIOS-CURSOR-MICROBIAL-RESEARCH-001",
            {item["task_id"] for item in self.registry["dispatch_history"]},
        )

    def test_microbial_research_is_prepared_but_not_claimed(self):
        prepared_task = next(
            item
            for item in self.registry["prepared_tasks"]
            if item["task_id"] == "KAIOS-CURSOR-MICROBIAL-RESEARCH-001"
        )
        self.assertEqual(len(self.registry["prepared_tasks"]), 1)
        self.assertEqual(prepared_task["status"], "READY_FOR_ATOMIC_CLAIM")
        self.assertEqual(prepared_task["claim_state"], "UNCLAIMED")
        self.assertEqual(
            prepared_task["task_id"], "KAIOS-CURSOR-MICROBIAL-RESEARCH-001"
        )
        self.assertEqual(prepared_task["worker_id"], self.cursor["worker_id"])
        self.assertEqual(
            prepared_task["branch"],
            "cursor-handoff/KAIOS-CURSOR-MICROBIAL-RESEARCH-001",
        )
        self.assertEqual(
            prepared_task["output_status"], "CURSOR_RESEARCH_PROPOSAL_ONLY"
        )
        self.assertIsNone(self.cursor["current_task"])
        self.assertIsNone(self.cursor["current_branch"])
        self.assertEqual(self.cursor["status"], "IDLE")
        self.assertIn("MICROBIAL_RESEARCH", self.cursor["allowed_work"])

        envelope = prepared_task
        self.assertEqual(envelope["status"], "READY_FOR_ATOMIC_CLAIM")
        self.assertEqual(envelope["claim_state"], "UNCLAIMED")
        self.assertEqual(envelope["claim_required"], "ATOMIC_CLAIM_BEFORE_WORK")
        self.assertEqual(
            envelope["authorized_paths"],
            [
                "KAIOS/life/candidates/forest-agriculture-v1/microbial-research/"
            ],
        )
        self.assertEqual(
            envelope["expected_files"],
            [
                "CURSOR_MICROBIAL_DECOMPOSER_RESEARCH_REPORT.md",
                "microbial-decomposer-process-proposals.json",
                "microbial-environment-threshold-proposals.json",
                "microbial-resource-accounting-scenarios.json",
                "microbial-competition-and-succession-proposals.json",
                "microbial-safety-boundaries.json",
                "microbial-test-scenarios.json",
                "CURSOR_MICROBIAL_RESEARCH_IMPROVEMENT_PROPOSAL.md",
            ],
        )
        self.assertEqual(
            envelope["actions"],
            [
                "READ_REPOSITORY_CONTEXT",
                "WRITE_ONLY_EXPECTED_FILES_UNDER_AUTHORIZED_PATH",
                "RUN_BOUNDED_LOCAL_TESTS",
                "RECORD_GIT_OBJECT_AND_SHA256_PROVENANCE",
                "COMMIT_EXACTLY_EXPECTED_FILES",
                "STOP_AT_PENDING_CODEX_REVIEW",
            ],
        )
        self.assertEqual(envelope["reviewer"], "codex-gm-01")
        self.assertEqual(
            envelope["source_base"],
            "beb982fda885fa7acc4dc35407df611d1019a544",
        )
        self.assertEqual(
            envelope["forbidden_paths"],
            [
                "KGEN-KAIOS/**",
                "KGEN/**",
                "KAIOS/**/Runtime/**",
                "KAIOS/**/Wallet/**",
                "**/*CURRENT*",
                "api/**",
                "docs/**",
                "README.md",
                "PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md",
            ],
        )

    def test_continuous_queue_requires_formal_release_and_atomic_claim(self):
        queue = self.forest_queue
        self.assertEqual(
            queue["continuous_dispatch_mode"],
            "CODEX_CONTROLLED_AFTER_FORMAL_RELEASE",
        )
        self.assertFalse(queue["automatic_unreviewed_dispatch"])
        self.assertTrue(
            {
                "PREVIOUS_TASK_CODEX_REVIEWED",
                "PREVIOUS_TASK_CLOSED",
                "PREVIOUS_LEASE_RELEASED",
                "EXPLICIT_TASK_ENVELOPE",
                "ATOMIC_CLAIM_SUCCEEDED",
            }
            <= set(queue["next_dispatch_requires"])
        )
        self.assertTrue(queue["one_task_at_a_time"])
        by_priority = {item["priority"]: item for item in queue["queue"]}
        self.assertEqual(by_priority[1]["status"], "RELEASED")
        self.assertEqual(by_priority[2]["status"], "RELEASED")
        self.assertEqual(by_priority[3]["status"], "RELEASED")
        self.assertEqual(by_priority[4]["status"], "RELEASED")
        self.assertEqual(by_priority[5]["status"], "RELEASED")
        self.assertEqual(by_priority[6]["status"], "RELEASED")
        self.assertEqual(by_priority[7]["status"], "RELEASED")
        self.assertEqual(by_priority[8]["status"], "RELEASED")
        self.assertEqual(by_priority[9]["status"], "RELEASED")
        self.assertEqual(by_priority[10]["status"], "RELEASED")
        self.assertEqual(by_priority[11]["status"], "RELEASED")
        self.assertEqual(by_priority[12]["status"], "READY_FOR_ATOMIC_CLAIM")
        self.assertEqual(by_priority[12]["task_id"], "KAIOS-CURSOR-MICROBIAL-RESEARCH-001")
        self.assertEqual(queue["active_claims"], [])
        self.assertIsNone(queue["worker_state"]["current_task"])
        self.assertIsNone(queue["worker_state"]["current_branch"])
        self.assertEqual(
            queue["prepared_task"]["expected_files"],
            self.registry["prepared_tasks"][0]["expected_files"],
        )

    def test_approved_or_closed_claim_still_holds_lock_until_release(self):
        next_claim = {"task_id": "NEXT", "status": "DISPATCHED"}
        for status in ("APPROVED", "CLOSED"):
            previous_claim = {"task_id": "PREVIOUS", "status": status}
            with self.assertRaisesRegex(
                ValueError, "CURSOR_ONE_TASK_LOCK_CONFLICT"
            ):
                validate_one_task_lock([previous_claim, next_claim])

        released_claim = {"task_id": "PREVIOUS", "status": "RELEASED"}
        self.assertEqual(
            validate_one_task_lock([released_claim, next_claim]), [next_claim]
        )

    def test_unknown_claim_state_fails_closed(self):
        with self.assertRaisesRegex(ValueError, "UNKNOWN_CLAIM_STATE"):
            validate_one_task_lock([{"task_id": "UNKNOWN", "status": "DONE"}])

    def test_every_continuous_queue_work_class_is_authorized(self):
        queue_work = {item["work"] for item in self.forest_queue["queue"]}
        self.assertTrue(queue_work)
        self.assertFalse(queue_work - set(self.cursor["allowed_work"]))

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
