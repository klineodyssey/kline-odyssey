from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


DYNAMIC_HASH_FIELDS = {
    "timestamp",
    "booted_at",
    "failed_at",
    "created_at",
    "archived_at",
    "uuid",
}

HASH_FIELDS = {
    "content_sha256",
    "record_sha256",
    "result_sha256",
}


def canonical_json(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def strip_hash_fields(data: dict[str, Any]) -> dict[str, Any]:
    result = dict(data)
    return result


def stable_content(data: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in data.items() if key not in DYNAMIC_HASH_FIELDS and key not in HASH_FIELDS}


def record_content(data: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in data.items() if key not in HASH_FIELDS}


def stamp_hashes(data: dict[str, Any]) -> dict[str, Any]:
    result = strip_hash_fields(data)
    result["content_sha256"] = sha256_text(canonical_json(stable_content(result)))
    result["record_sha256"] = sha256_text(canonical_json(record_content(result)))
    # Compatibility alias for V0.1 reports that still reference result_sha256.
    result["result_sha256"] = result["record_sha256"]
    return result


def stamp_result_sha256(data: dict[str, Any]) -> dict[str, Any]:
    return stamp_hashes(data)


def evidence_id(prefix: str, *parts: str) -> str:
    return f"{prefix}-{sha256_text('|'.join(parts))[:16]}"
