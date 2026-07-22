from __future__ import annotations

from dataclasses import dataclass, field

from .evidence import evidence_id
from .models import BootFailure, FailureCode, Stage


ALLOWED_TRANSITIONS: dict[Stage, set[Stage]] = {
    Stage.NEW: {Stage.BOOTING, Stage.FAILED},
    Stage.BOOTING: {Stage.IDENTITY_VERIFIED, Stage.FAILED, Stage.CONFLICTED},
    Stage.IDENTITY_VERIFIED: {Stage.CAPABILITY_VERIFIED, Stage.FAILED, Stage.REVOKED},
    Stage.CAPABILITY_VERIFIED: {Stage.STATE_VERIFIED, Stage.FAILED, Stage.REVOKED},
    Stage.STATE_VERIFIED: {Stage.HANDOFF_LOADED, Stage.STALE, Stage.CONFLICTED, Stage.FAILED},
    Stage.HANDOFF_LOADED: {Stage.READ_ONLY_ACTIVE, Stage.FAILED, Stage.CONFLICTED},
    Stage.READ_ONLY_ACTIVE: {Stage.HANDOFF_WRITTEN, Stage.FAILED},
    Stage.HANDOFF_WRITTEN: {Stage.ARCHIVED},
    Stage.FAILED: {Stage.HANDOFF_WRITTEN, Stage.ARCHIVED},
    Stage.REVOKED: {Stage.HANDOFF_WRITTEN, Stage.ARCHIVED},
    Stage.STALE: {Stage.HANDOFF_WRITTEN, Stage.ARCHIVED},
    Stage.CONFLICTED: {Stage.HANDOFF_WRITTEN, Stage.ARCHIVED},
    Stage.ARCHIVED: set(),
}


def assert_transition(current: Stage, next_state: Stage) -> None:
    if next_state not in ALLOWED_TRANSITIONS[current]:
        raise BootFailure(
            FailureCode.INVALID_STATE_TRANSITION,
            current,
            f"invalid transition {current.value} -> {next_state.value}",
        )


@dataclass
class StateTracker:
    current: Stage = Stage.NEW
    path: list[str] = field(default_factory=lambda: [Stage.NEW.value])
    evidence_ids: list[str] = field(default_factory=list)

    def transition(self, next_state: Stage) -> None:
        assert_transition(self.current, next_state)
        self.evidence_ids.append(evidence_id("STATE", self.current.value, next_state.value))
        self.current = next_state
        self.path.append(next_state.value)

    def fail(self, failure_state: Stage) -> None:
        if failure_state == self.current:
            return
        try:
            self.transition(failure_state)
        except BootFailure:
            self.transition(Stage.FAILED)
