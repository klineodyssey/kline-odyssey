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
SOFTWARE_QUEUE_PATH = (
    ROOT / "KAIOS" / "software-life" / "KAIOS_AI_WORKFORCE_24H_QUEUE.json"
)
PUBLIC_QUEUE_PATH = ROOT / "api" / "kaios" / "ai-company" / "v1" / "cursor-queue.json"
LIFE_ENERGY_ENVELOPE_PATH = (
    ROOT
    / "KAIOS"
    / "economy"
    / "life-energy-payroll"
    / "KAIOS_CURSOR_LIFE_ENERGY_PAYROLL_TASK_ENVELOPE.json"
)
LIFE_ENERGY_CLAIM_PATH = (
    ROOT
    / "KGEN-AI-Company"
    / "reports"
    / "claims"
    / "KAIOS-CURSOR-LIFE-ENERGY-PAYROLL-CANDIDATES-001_claim.json"
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
    "REWORK_REQUIRED_CLAIM_RELEASED",
    "EXPIRED_UNDELIVERED_RELEASED",
    "CLOSED_NO_DELIVERY_WORKER_OFFBOARDED",
}

UNLOCKED_CLAIM_STATES = {
    "RELEASED",
    "COMPLETED_CODEX_REVIEWED",
    "REWORK_REQUIRED_CLAIM_RELEASED",
    "EXPIRED_UNDELIVERED_RELEASED",
    "CLOSED_NO_DELIVERY_WORKER_OFFBOARDED",
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
        cls.software_queue = load_json(SOFTWARE_QUEUE_PATH)
        cls.public_queue = load_json(PUBLIC_QUEUE_PATH)
        cls.life_energy_envelope = load_json(LIFE_ENERGY_ENVELOPE_PATH)
        cls.life_energy_claim = load_json(LIFE_ENERGY_CLAIM_PATH)
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

    def test_archived_foundational_life_creator_preserves_history_without_authority(self):
        self.assertEqual(self.cursor["worker_class"], "FOUNDATIONAL_LIFE_CREATOR")
        self.assertEqual(
            self.cursor["worker_classes"],
            ["FOUNDATIONAL_LIFE_CREATOR", "LIFE_RESEARCH_ANALYST"],
        )
        self.assertEqual(self.cursor["permission"], "pending_readonly")
        self.assertEqual(self.cursor["employee_status"], "ARCHIVED")
        self.assertEqual(self.cursor["trust_level"], "T0")
        self.assertEqual(self.cursor["status"], "OFFLINE")
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

    def test_fungi_release_and_life_energy_manual_claim_are_serialized(self):
        metadata = self.registry["metadata"]
        self.assertEqual(metadata["source_commit"], "80002b27b91fd951c470cfe32dc243162ea906af")
        self.assertEqual(
            metadata["task_id"],
            "KAIOS-EXPIRED-CURSOR-R2-CLAIM-RECONCILIATION-001",
        )
        self.assertIn("offboarding", metadata["change_reason"])

        locked = validate_one_task_lock(self.registry["dispatch_history"])
        self.assertEqual(locked, [])
        self.assertEqual(self.registry["active_claims"], [])

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
        self.assertNotIn(
            "KAIOS-CURSOR-MICROBIAL-RESEARCH-001",
            {event["task_id"] for event in self.registry["claim_events"]},
        )
        life_energy_events = [
            event
            for event in self.registry["claim_events"]
            if event["task_id"]
            == "KAIOS-CURSOR-LIFE-ENERGY-PAYROLL-CANDIDATES-001"
        ]
        self.assertEqual(
            [event["event_type"] for event in life_energy_events],
            ["CLAIM_REGISTERED", "CLAIM_CLOSED_REWORK_REQUIRED", "CLAIM_RELEASED"],
        )
        r2_events = [
            event
            for event in self.registry["claim_events"]
            if event["task_id"] == "KAIOS-CURSOR-LIFE-ENERGY-PAYROLL-R2-001"
        ]
        self.assertEqual(
            [event["event_type"] for event in r2_events],
            ["CLAIM_REGISTERED", "CLAIM_RECONCILIATION", "TASK_CLOSED_WORKER_OFFBOARDED"],
        )
        self.assertEqual([event["sequence"] for event in r2_events], [1, 2, 3])
        self.assertEqual(r2_events[1]["new_state"], "OPEN")
        self.assertTrue(r2_events[1]["task_reassignable"])
        self.assertEqual(r2_events[2]["previous_event_id"], r2_events[1]["event_id"])
        self.assertEqual(r2_events[2]["old_state"], "OPEN")
        self.assertEqual(r2_events[2]["new_state"], "CLOSED")
        self.assertFalse(r2_events[2]["task_reassignable"])

    def test_dispatch_history_ends_with_life_energy_claim_and_excludes_microbial(self):
        final_dispatch = self.registry["dispatch_history"][-1]
        self.assertEqual(
            final_dispatch["task_id"],
            "KAIOS-CURSOR-LIFE-ENERGY-PAYROLL-R2-001",
        )
        self.assertEqual(final_dispatch["status"], "CLOSED_NO_DELIVERY_WORKER_OFFBOARDED")
        self.assertNotIn(
            "KAIOS-CURSOR-MICROBIAL-RESEARCH-001",
            {item["task_id"] for item in self.registry["dispatch_history"]},
        )

    def test_microbial_research_preparation_is_cancelled_after_offboarding(self):
        self.assertEqual(len(self.registry["prepared_tasks"]), 1)
        prepared = self.registry["prepared_tasks"][0]
        self.assertEqual(
            prepared["task_id"], "KAIOS-CURSOR-MICROBIAL-RESEARCH-001"
        )
        self.assertEqual(prepared["worker_id"], self.cursor["worker_id"])
        self.assertEqual(prepared["status"], "CANCELLED_WORKER_OFFBOARDED")
        self.assertEqual(prepared["claim_state"], "CLOSED_NOT_CLAIMABLE")
        self.assertEqual(prepared["dispatch_state"], "CANCELLED")
        self.assertIsNone(prepared["execution_base"])
        self.assertEqual(
            prepared["execution_base_binding"],
            "SEPARATE_ACTIVATION_PR_MUST_BIND_EXACT_PREPARATION_MERGE_SHA",
        )
        self.assertFalse(prepared["descendant_wildcard_allowed"])
        self.assertEqual(
            prepared["planned_branch"],
            "cursor-handoff/KAIOS-CURSOR-MICROBIAL-RESEARCH-001",
        )
        self.assertEqual(prepared["branch_state"], "NOT_CREATED")
        self.assertEqual(prepared["isolated_worktree_state"], "NOT_CREATED")
        self.assertEqual(
            prepared["output_status"], "CURSOR_RESEARCH_PROPOSAL_ONLY"
        )
        self.assertIsNone(self.cursor["current_task"])
        self.assertIsNone(self.cursor["current_branch"])
        self.assertEqual(self.cursor["status"], "OFFLINE")
        self.assertEqual(self.cursor["heartbeat"], "2026-08-16T12:49:02Z")
        self.assertIn("MICROBIAL_RESEARCH", self.cursor["allowed_work"])

        self.assertEqual(
            prepared["preparation_source_commit"],
            "7008e4f9449f6df050171cf47ec6ec56419925e9",
        )
        self.assertEqual(
            prepared["activation_steps"],
            [
                "MERGE_PREPARATION_PR",
                "RECORD_EXACT_PREPARATION_MERGE_SHA",
                "CREATE_PLANNED_BRANCH_AT_EXACT_PREPARATION_MERGE_SHA",
                "VERIFY_ISOLATED_WORKTREE_AT_EXACT_PREPARATION_MERGE_SHA",
                "OPEN_SEPARATE_ACTIVATION_PR_BINDING_EXACT_BASE",
                "DEFINE_FAIL_CLOSED_EXPIRY_AND_REVALIDATION",
                "RECORD_CLAIMED_ONLY_AFTER_ACTIVATION_PR_MERGES",
            ],
        )
        for forbidden_field in (
            "claim_id",
            "session_id",
            "branch",
            "source_base",
            "execution_base_rule",
            "dispatch_mode",
            "fencing_token",
            "record_version",
            "issued_at",
            "lease_expiry",
        ):
            self.assertNotIn(forbidden_field, prepared)
        self.assertFalse(prepared["automatic"])
        self.assertFalse(prepared["external_autonomy"])
        self.assertFalse(prepared["merge_allowed"])
        self.assertFalse(prepared["deploy_allowed"])
        self.assertEqual(
            prepared["authorized_paths"],
            [
                "KAIOS/life/candidates/forest-agriculture-v1/microbial-research/"
            ],
        )
        self.assertEqual(
            prepared["expected_files"],
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
            prepared["actions_after_activation_only"],
            [
                "READ_REPOSITORY_CONTEXT",
                "WRITE_ONLY_EXPECTED_FILES_UNDER_AUTHORIZED_PATH",
                "RUN_BOUNDED_LOCAL_TESTS",
                "RECORD_GIT_OBJECT_AND_SHA256_PROVENANCE",
                "COMMIT_EXACTLY_EXPECTED_FILES",
                "STOP_AT_PENDING_CODEX_REVIEW",
            ],
        )
        self.assertEqual(prepared["reviewer"], "codex-gm-01")
        self.assertEqual(
            prepared["forbidden_paths"],
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
            prepared["prior_worker_registry"],
            {
                "git_object": "93342ab913d0adab57c29a85017b9907b05b026e",
                "sha256": "af348f1ad3967ffc7aca13387a3d0a45827bc84fe2aa99804570435a67df34b2",
            },
        )
        self.assertEqual(
            prepared["prior_queue"],
            {
                "git_object": "c0596410cc1b32190f4b8369c98b23b9539351b4",
                "sha256": "b2e044cf29ef031f2f47a04442001f4a0376cb14819e9834ede3dd200d75544b",
            },
        )

    def test_preparation_prior_evidence_matches_source_git_objects(self):
        prepared = self.registry["prepared_tasks"][0]
        evidence_by_path = {
            "KGEN-KAIOS/worker_registry.json": prepared["prior_worker_registry"],
            "KAIOS/life/forest-agriculture/KAIOS_CURSOR_CONTINUOUS_WORK_QUEUE.json": prepared["prior_queue"],
        }
        for path, evidence in evidence_by_path.items():
            object_id = subprocess.check_output(
                [
                    "git",
                    "rev-parse",
                    f"{prepared['preparation_source_commit']}:{path}",
                ],
                cwd=ROOT,
                text=True,
            ).strip()
            self.assertEqual(object_id, evidence["git_object"])
            payload = subprocess.check_output(
                ["git", "cat-file", "blob", object_id], cwd=ROOT
            )
            self.assertEqual(hashlib.sha256(payload).hexdigest(), evidence["sha256"])

    def test_continuous_queue_is_disabled_after_offboarding(self):
        queue = self.forest_queue
        self.assertEqual(
            queue["continuous_dispatch_mode"],
            "DISABLED_WORKER_OFFBOARDED",
        )
        self.assertFalse(queue["automatic_unreviewed_dispatch"])
        self.assertTrue(
            {
                "NEW_CURSOR_APPLICATION",
                "IDENTITY_CHECK",
                "INTERVIEW_AND_SANDBOX_TRIAL",
                "HUMAN_APPROVED_ONBOARDING",
                "NEW_WORKER_REGISTRY_ACTIVATION",
                "NEW_EXPLICIT_TASK_AND_CLAIM",
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
        self.assertEqual(by_priority[12]["status"], "CANCELLED_WORKER_OFFBOARDED")
        for priority in range(13, 21):
            self.assertEqual(by_priority[priority]["status"], "CANCELLED_WORKER_OFFBOARDED")
        self.assertEqual(by_priority[12]["task_id"], "KAIOS-CURSOR-MICROBIAL-RESEARCH-001")
        self.assertEqual(queue["active_claims"], self.registry["active_claims"])
        self.assertEqual(
            queue["worker_state"],
            {
                "worker_id": "cursor-01",
                "current_task": None,
                "current_branch": None,
                "status": "OFFLINE",
                "availability_for_current_work": "NOT_EMPLOYED",
                "availability_reason": "HUMAN_DIRECTED_NON_DISCIPLINARY_OFFBOARDING_CURSOR_NOT_IN_USE",
            },
        )
        self.assertEqual(queue["prepared_task"], self.registry["prepared_tasks"][0])

    def test_four_way_active_claims_are_equal_and_empty(self):
        claim_sets = [
            self.registry["active_claims"],
            self.forest_queue["active_claims"],
            self.software_queue["active_claims"],
            self.public_queue["active_claims"],
        ]
        self.assertTrue(all(len(claims) == 0 for claims in claim_sets))
        self.assertTrue(all(claims == claim_sets[0] for claims in claim_sets[1:]))
        self.assertEqual(self.public_queue["worker_state"], self.forest_queue["worker_state"])
        self.assertEqual(self.public_queue["prepared_task"], self.forest_queue["prepared_task"])
        self.assertEqual(
            self.software_queue["cursor"]["current_status"],
            "ARCHIVED_WORKER_OFFBOARDED",
        )
        self.assertEqual(
            self.software_queue["cursor"]["current_task"],
            None,
        )
        self.assertEqual(
            self.software_queue["cursor"]["current_branch"],
            None,
        )
        self.assertEqual(
            self.software_queue["cursor"]["prepared_task_status"],
            "CANCELLED_WORKER_OFFBOARDED",
        )
        self.assertIsNone(self.software_queue["cursor"]["execution_base"])
        self.assertFalse(
            self.software_queue["cursor"]["descendant_wildcard_allowed"]
        )

    def test_life_energy_claim_is_closed_and_not_reactivatable(self):
        envelope = self.life_energy_envelope
        claim = self.life_energy_claim
        task_id = "KAIOS-CURSOR-LIFE-ENERGY-PAYROLL-CANDIDATES-001"
        expected_paths = [
            "KAIOS/economy/candidates/payroll-v0/",
            "KAIOS/economy/candidates/colony-ledger-v0/",
            "KAIOS/world-viewer/candidates/life-energy-payroll/",
            "KGEN-AI-Company/reports/",
        ]
        self.assertEqual(envelope["task_id"], task_id)
        self.assertEqual(claim["task_id"], task_id)
        self.assertEqual(self.registry["active_claims"], [])
        self.assertEqual(envelope["status"], "R2_CLOSED_NO_DELIVERY_WORKER_OFFBOARDED")
        self.assertEqual(claim["status"], "CLOSED_AND_RELEASED_REWORK_REQUIRED")
        self.assertTrue(envelope["claim_created"])
        self.assertTrue(envelope["human_response_file_received"])
        self.assertEqual(envelope["allowed_paths"], expected_paths)
        self.assertEqual(claim["allowed_paths"], expected_paths)
        self.assertEqual(len(envelope["expected_files"]), 7)
        self.assertEqual(envelope["expected_files"], claim["expected_files"])
        self.assertEqual(envelope["claim_id"], "CLAIM-KAIOS-LIFE-ENERGY-PAYROLL-R2-001-cursor-01")
        self.assertEqual(envelope["fencing_token"], "FENCE-KAIOS-LIFE-ENERGY-PAYROLL-R2-001-R2")
        self.assertFalse(envelope["r2_reconciliation"]["task_reassignable"])
        self.assertEqual(
            envelope["r2_reconciliation"]["claim_release_event_id"],
            "CLAIM-EVENT-KAIOS-LIFE-ENERGY-PAYROLL-R2-001-002",
        )
        self.assertEqual(
            envelope["r2_reconciliation"]["task_close_event_id"],
            "CLAIM-EVENT-KAIOS-LIFE-ENERGY-PAYROLL-R2-001-003",
        )
        self.assertTrue(envelope["automatic"] is False)
        self.assertTrue(envelope["external_autonomy"] is False)
        self.assertTrue(envelope["cursor_api_key_required"] is False)
        self.assertTrue(envelope["external_wake_workflow_allowed"] is False)
        self.assertTrue(claim["manual_execution_only"])
        self.assertFalse(claim["external_autonomy"])
        self.assertFalse(claim["cursor_api_key_required"])
        self.assertFalse(claim["external_wake_workflow_allowed"])
        self.assertEqual(
            claim["activation_delivery"],
            "CODEX_FAST_FORWARD_MAIN_COMPARE_AND_SET_NO_CURSOR_WAKE",
        )
        self.assertFalse(claim["can_push_main"])
        self.assertFalse(claim["merge_allowed"])
        self.assertFalse(claim["deploy_allowed"])

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
