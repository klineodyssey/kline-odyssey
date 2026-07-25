"""Dry-run KAIOS natural organism instantiation pipeline."""

from __future__ import annotations

import argparse
import copy
import hashlib
import json
from pathlib import Path
from typing import Any

from validate_organism import (
    ValidationError,
    canonical_json,
    load_json,
    validate_all,
    validate_manifest,
    validate_package,
)

PIPELINE = (
    "SPECIFICATION",
    "VALIDATION",
    "TAXONOMY",
    "ORGANISM_ID",
    "RELEASE",
    "RUNTIME_LIFE",
)


def candidate_organism_id(manifest: dict[str, Any]) -> str:
    payload = copy.deepcopy(manifest)
    payload["organism_id"] = "AUTO_GENERATE"
    payload.pop("integrity_hash", None)
    digest = hashlib.sha256(canonical_json(payload)).hexdigest()[:24]
    return f"candidate-organism-{digest}"


def dry_run(root: Path, package_dir: Path) -> dict[str, Any]:
    manifest = validate_package(root, package_dir)
    validate_all(root)
    candidate_id = candidate_organism_id(manifest)
    return {
        "pipeline": list(PIPELINE),
        "completed_through": "RELEASE",
        "runtime_life_started": False,
        "organism_id": candidate_id,
        "organism_id_status": "CANDIDATE_ONLY",
        "release_status": "DRY_RUN",
        "activation_status": "NOT_ACTIVE",
        "production_authority": False,
        "runtime_authority": False,
        "wallet_created": False,
        "k11520_settlement": False,
        "codex_birth": False,
        "new_thread_authorized": False,
        "files_written": 0,
    }


def migrate_legacy(root: Path, path: Path) -> dict[str, Any]:
    legacy = load_json(path)
    validate_manifest(root, legacy)
    mapped = {
        "schema_version": "2.0",
        "organism_id": legacy["organism_id"],
        "organism_name": legacy.get("organism_name", legacy["species"]),
        "organism_version": legacy["version"],
        "organism_class": legacy["life_type"],
        "domain": legacy["domain"],
        "kingdom": legacy["kingdom"],
        "phylum": legacy["phylum"],
        "class": legacy["class"],
        "order": legacy["order"],
        "family": legacy["family"],
        "genus": legacy["genus"],
        "species": legacy["species"],
        "program_filename": legacy["canonical_file"],
        "runtime_entrypoint": legacy["runtime_entry"],
        "dna_ref": legacy["dna_schema"],
        "compatible_species": legacy["compatible_mates"],
        "status": "DRY_RUN",
    }
    unresolved = [
        "life_category",
        "taxonomy.cell",
        "taxonomy.organ",
        "taxonomy.runtime",
        "taxonomy.civilization",
        "rna_ref",
        "energy_profile_ref",
        "embodiment_profile_ref",
        "lifecycle_ref",
        "trade_profile_ref",
        "ownership_profile_ref",
        "authority_profile_ref",
    ]
    return {
        "migration_status": "DRY_RUN",
        "source_unchanged": True,
        "mapped": mapped,
        "unresolved": unresolved,
        "files_written": 0,
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=("validate", "dry-run", "migrate"))
    parser.add_argument("path", nargs="?")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    organism_root = root / "KGEN-KAIOS" / "organism"
    try:
        if args.command == "validate":
            result = validate_all(root)
        elif args.command == "dry-run":
            package = Path(args.path).resolve() if args.path else organism_root / "package-template"
            result = dry_run(root, package)
        else:
            if not args.path:
                parser.error("migrate requires a legacy manifest path")
            result = migrate_legacy(root, Path(args.path).resolve())
    except (OSError, KeyError, ValidationError, json.JSONDecodeError) as exc:
        print(json.dumps({"status": "VALIDATION_FAILED", "error": str(exc)}, indent=2))
        return 1
    print(json.dumps({"status": "PASS", **result}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
