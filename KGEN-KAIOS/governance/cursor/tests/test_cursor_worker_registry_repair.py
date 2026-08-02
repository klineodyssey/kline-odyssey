import hashlib
import json
from pathlib import Path
import subprocess
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

    def test_fungi_release_precedes_the_single_microbial_claim(self):
        metadata = self.registry["metadata"]
        self.assertEqual(
            metadata["source_commit"],
            "7008e4f9449f6df050171cf47ec6ec56419925e9",
        )
        self.assertEqual(
            metadata["task_id"],
            "KAIOS-CURSOR-MICROBIAL-RESEARCH-001-MANUAL-CLAIM",
        )
        self.assertIn("manual non-atomic claim", metadata["change_reason"])

        locked = validate_one_task_lock(self.registry["dispatch_history"])
        self.assertEqual(len(locked), 1)
        self.assertEqual(
            locked[0]["task_id"], "KAIOS-CURSOR-MICROBIAL-RESEARCH-001"
        )
        self.assertEqual(len(self.registry["active_claims"]), 1)

        fungi_events = [
            event
            for event in self.registry["claim_events"]
            if event["task_id"] == "KAIOS-CURSOR-FUNGI-CANDIDATE-001"
        ]
        self.assertEqual(
            [event["event_type"] for event in fungi_events],
            ["CLAIM_CLOSED", "CLAIM_RELEASED"],
        )
        self.assertEqual([event["sequence"] for event in fungi_events], [1, 2])
        self.assertEqual(
            fungi_events[1]["previous_event_id"], fungi_events[0]["event_id"]
        )
        microbial_event = self.registry["claim_events"][-1]
        self.assertEqual(microbial_event["event_type"], "CLAIM_ACQUIRED")
        self.assertEqual(microbial_event["sequence"], 3)
        self.assertEqual(
            microbial_event["previous_event_id"], fungi_events[1]["event_id"]
        )

    def test_dispatch_history_ends_with_manually_dispatched_microbial(self):
        final_dispatch = self.registry["dispatch_history"][-1]
        self.assertEqual(
            final_dispatch["task_id"], "KAIOS-CURSOR-MICROBIAL-RESEARCH-001"
        )
        self.assertEqual(final_dispatch["status"], "DISPATCHED")
        self.assertEqual(
            final_dispatch["dispatch_mode"], "MANUAL_DISPATCH_NON_ATOMIC"
        )

    def test_microbial_research_has_one_bounded_manual_claim(self):
        self.assertEqual(self.registry["prepared_tasks"], [])
        claim = self.registry["active_claims"][0]
        self.assertEqual(
            claim["task_id"], "KAIOS-CURSOR-MICROBIAL-RESEARCH-001"
        )
        self.assertEqual(claim["worker_id"], self.cursor["worker_id"])
        self.assertEqual(
            claim["branch"],
            "cursor-handoff/KAIOS-CURSOR-MICROBIAL-RESEARCH-001",
        )
        self.assertEqual(
            claim["output_status"], "CURSOR_RESEARCH_PROPOSAL_ONLY"
        )
        self.assertEqual(
            self.cursor["current_task"], "KAIOS-CURSOR-MICROBIAL-RESEARCH-001"
        )
        self.assertEqual(self.cursor["current_branch"], claim["branch"])
        self.assertEqual(self.cursor["status"], "CLAIMED")
        self.assertIn("MICROBIAL_RESEARCH", self.cursor["allowed_work"])

        self.assertEqual(claim["status"], "DISPATCHED")
        self.assertEqual(claim["dispatch_mode"], "MANUAL_DISPATCH_NON_ATOMIC")
        self.assertEqual(claim["fencing_token"], 1)
        self.assertEqual(claim["record_version"], 1)
        self.assertFalse(claim["fencing_enforced"])
        self.assertFalse(claim["lease_enforced_by_transactional_service"])
        self.assertEqual(
            claim["session_kind"], "LOGICAL_MANUAL_DISPATCH_SESSION"
        )
        self.assertEqual(
            claim["source_base"],
            "7008e4f9449f6df050171cf47ec6ec56419925e9",
        )
        self.assertEqual(
            claim["execution_base_rule"],
            "CLAIM_RECORD_MERGE_COMMIT_DESCENDANT_OF_SOURCE_BASE",
        )
        self.assertFalse(claim["automatic"])
        self.assertFalse(claim["external_autonomy"])
        self.assertFalse(claim["merge_allowed"])
        self.assertFalse(claim["deploy_allowed"])
        self.assertEqual(
            claim["authorized_paths"],
            [
                "KAIOS/life/candidates/forest-agriculture-v1/microbial-research/"
            ],
        )
        self.assertEqual(
            claim["expected_files"],
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
            claim["actions"],
            [
                "READ_REPOSITORY_CONTEXT",
                "WRITE_ONLY_EXPECTED_FILES_UNDER_AUTHORIZED_PATH",
                "RUN_BOUNDED_LOCAL_TESTS",
                "RECORD_GIT_OBJECT_AND_SHA256_PROVENANCE",
                "COMMIT_EXACTLY_EXPECTED_FILES",
                "STOP_AT_PENDING_CODEX_REVIEW",
            ],
        )
        self.assertEqual(
            claim["review_owner_id"], "codex-gm-01"
        )
        self.assertEqual(
            claim["forbidden_paths"],
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
        self.assertEqual(
            claim["prior_worker_registry"],
            {
                "git_object": "93342ab913d0adab57c29a85017b9907b05b026e",
                "sha256": "af348f1ad3967ffc7aca13387a3d0a45827bc84fe2aa99804570435a67df34b2",
            },
        )
        self.assertEqual(
            claim["prior_queue"],
            {
                "git_object": "c0596410cc1b32190f4b8369c98b23b9539351b4",
                "sha256": "b2e044cf29ef031f2f47a04442001f4a0376cb14819e9834ede3dd200d75544b",
            },
        )

    def test_manual_claim_prior_evidence_matches_the_source_base_git_objects(self):
        claim = self.registry["active_claims"][0]
        evidence_by_path = {
            "KGEN-KAIOS/worker_registry.json": claim["prior_worker_registry"],
            "KAIOS/life/forest-agriculture/KAIOS_CURSOR_CONTINUOUS_WORK_QUEUE.json": claim["prior_queue"],
        }
        for path, evidence in evidence_by_path.items():
            object_id = subprocess.check_output(
                ["git", "rev-parse", f"{claim['source_base']}:{path}"],
                cwd=ROOT,
                text=True,
            ).strip()
            self.assertEqual(object_id, evidence["git_object"])
            payload = subprocess.check_output(
                ["git", "cat-file", "blob", object_id], cwd=ROOT
            )
            self.assertEqual(hashlib.sha256(payload).hexdigest(), evidence["sha256"])

    def test_continuous_queue_projects_the_reviewed_manual_claim(self):
        queue = self.forest_queue
        self.assertEqual(
            queue["continuous_dispatch_mode"],
            "CODEX_CONTROLLED_MANUAL_DISPATCH_NON_ATOMIC",
        )
        self.assertFalse(queue["automatic_unreviewed_dispatch"])
        self.assertTrue(
            {
                "PREVIOUS_TASK_CODEX_REVIEWED",
                "PREVIOUS_TASK_CLOSED",
                "PREVIOUS_LEASE_RELEASED",
                "EXPLICIT_TASK_ENVELOPE",
                "REVIEWED_MANUAL_CLAIM_RECORDED",
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
        self.assertEqual(by_priority[12]["status"], "DISPATCHED")
        self.assertEqual(by_priority[12]["task_id"], "KAIOS-CURSOR-MICROBIAL-RESEARCH-001")
        self.assertEqual(queue["active_claims"], self.registry["active_claims"])
        self.assertEqual(
            queue["worker_state"],
            {
                "worker_id": "cursor-01",
                "current_task": "KAIOS-CURSOR-MICROBIAL-RESEARCH-001",
                "current_branch": "cursor-handoff/KAIOS-CURSOR-MICROBIAL-RESEARCH-001",
                "status": "CLAIMED",
            },
        )
        self.assertIsNone(queue["prepared_task"])

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
