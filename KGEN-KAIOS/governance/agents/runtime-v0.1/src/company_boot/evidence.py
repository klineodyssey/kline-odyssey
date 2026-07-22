from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any


def canonical_json(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def sha256_file(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def stamp_result_sha256(data: dict[str, Any]) -> dict[str, Any]:
    result = dict(data)
    result.pop("result_sha256", None)
    result["result_sha256"] = sha256_text(canonical_json(result))
    return result


def evidence_id(prefix: str, *parts: str) -> str:
    return f"{prefix}-{sha256_text('|'.join(parts))[:16]}"
