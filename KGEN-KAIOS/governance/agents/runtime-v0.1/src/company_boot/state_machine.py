from __future__ import annotations

from .models import Stage


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
        raise ValueError(f"invalid transition {current.value} -> {next_state.value}")
