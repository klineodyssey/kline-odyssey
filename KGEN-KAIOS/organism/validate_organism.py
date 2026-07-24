"""Validation for the canonical KAIOS organism candidate implementation."""

from __future__ import annotations

import ast
import hashlib
import json
import re
from pathlib import Path
from typing import Any

CANONICAL_LEVELS = (
    "domain",
    "kingdom",
    "phylum",
    "class",
    "order",
    "family",
    "genus",
    "species",
    "cell",
    "organ",
    "runtime",
    "civilization",
)
EXTENSION_19_LEVELS = (
    "Domain",
    "Kingdom",
    "Phylum",
    "Class",
    "Order",
    "Family",
    "Genus",
    "Species",
    "Individual",
    "OrganSystem",
    "Organ",
    "Tissue",
    "Cell",
    "Organelle",
    "Genome",
    "DNA",
    "RNA",
    "Gene",
    "Expression",
)
LEGACY_REQUIRED = (
    "organism_id",
    "life_type",
    "domain",
    "kingdom",
    "phylum",
    "class",
    "order",
    "family",
    "genus",
    "species",
    "canonical_file",
    "runtime_entry",
    "dna_schema",
    "parent_species",
    "ancestor_versions",
    "compatible_mates",
    "mutation_rules",
    "fusion_rules",
    "split_rules",
    "upgrade_path",
    "status",
    "version",
    "author_agent",
    "reviewer_agent",
    "source_commit",
)
V2_REQUIRED = (
    "organism_name",
    "organism_version",
    "organism_class",
    "life_category",
    "taxonomy",
    "species_ref",
    "dna_ref",
    "rna_ref",
    "organs_ref",
    "cells_ref",
    "runtime_ref",
    "energy_profile_ref",
    "embodiment_profile_ref",
    "lifecycle_ref",
    "reproduction_rules_ref",
    "mutation_rules_ref",
    "trade_profile_ref",
    "ownership_profile_ref",
    "authority_profile_ref",
    "runtime_binding",
    "life_behavior",
    "release",
    "created_at",
    "integrity_hash",
)
SPECIES_REQUIRED = (
    "species_id",
    "species_name",
    "species_version",
    "taxonomy_ref",
    "species_manifest",
    "program_filename",
    "runtime_entrypoint",
    "compatibility",
    "reproduction_rules_ref",
    "mutation_rules_ref",
    "energy_profile_ref",
    "embodiment_profile_ref",
    "trade_profile_ref",
    "organ_requirements",
    "cell_requirements",
    "lifecycle",
    "release_policy",
    "organism_schema_version",
    "schema_version",
    "integrity_hash",
)
PACKAGE_FILES = (
    "README.md",
    "organism.json",
    "dna/species.json",
    "dna/rna.json",
    "dna/organs.json",
    "dna/cells.json",
    "dna/reproduction_rules.json",
    "dna/mutation_rules.json",
    "dna/lifecycle.json",
    "runtime/runtime.json",
    "runtime/status.json",
    "runtime/memory.json",
    "runtime/health.json",
    "embodiment/embodiment.json",
    "trade/trade_profile.json",
    "archive/previous_generations/README.md",
)
PLACEHOLDERS = {
    "AUTO_GENERATE",
    "NOT_CREATED",
    "NOT_ASSIGNED",
    "PENDING",
    "PENDING_PR",
    "PENDING_DRAFT_PR",
    "CANDIDATE_RELEASE_ONLY",
}
FORBIDDEN_ACTIVE_VALUES = {"ACTIVE", "PRODUCTION", "LIVE", "RUNTIME_LIFE"}
HIGH_AUTHORITY_CLASSES = {
    "CODEX_GM",
    "WALLET_CONTROLLER",
    "GOVERNANCE_AI",
    "AUTONOMOUS_FINANCIAL_AGENT",
    "WEAPON_SYSTEM",
    "INFRASTRUCTURE_ADMINISTRATOR",
}
TRADE_CLASSES = {
    "TRADEABLE_ENTITY",
    "TRADEABLE_ASSET",
    "NON_TRANSFERABLE_LIFE",
    "LICENSE_ONLY",
    "OCCUPANCY_ONLY",
    "USAGE_RIGHT_ONLY",
    "TITLE_TRANSFER",
    "NOT_TRADEABLE",
}


class ValidationError(ValueError):
    """Raised when a candidate violates the canonical organism contract."""


def load_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def canonical_json(value: Any) -> bytes:
    return json.dumps(
        value,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
    ).encode("utf-8")


def content_hash(value: dict[str, Any]) -> str:
    payload = dict(value)
    payload.pop("integrity_hash", None)
    return hashlib.sha256(canonical_json(payload)).hexdigest()


def validate_integrity_hash(record: dict[str, Any]) -> None:
    hash_value = record.get("integrity_hash", "")
    if not re.fullmatch(r"[a-f0-9]{64}", hash_value):
        raise ValidationError("invalid integrity hash format")
    if hash_value != content_hash(record):
        raise ValidationError("integrity hash mismatch")


def _require_fields(record: dict[str, Any], fields: tuple[str, ...], label: str) -> None:
    missing = [field for field in fields if field not in record]
    if missing:
        raise ValidationError(f"{label} missing fields: {', '.join(missing)}")


def _path_from_ref(root: Path, reference: str) -> Path:
    raw_path = reference.split("#", 1)[0]
    if not raw_path or ".." in Path(raw_path).parts:
        raise ValidationError(f"unsafe repository reference: {reference}")
    if re.match(r"^[A-Za-z]:[\\/]", raw_path) or raw_path.startswith(("/", "\\")):
        raise ValidationError(f"absolute repository reference: {reference}")
    candidate = (root / raw_path).resolve()
    try:
        candidate.relative_to(root.resolve())
    except ValueError as exc:
        raise ValidationError(f"reference escapes repository: {reference}") from exc
    if not candidate.is_file():
        raise ValidationError(f"missing repository reference: {reference}")
    return candidate


def _validate_entrypoint(root: Path, reference: str) -> None:
    path = _path_from_ref(root, reference)
    if "#" not in reference:
        return
    function_name = reference.split("#", 1)[1]
    if not function_name:
        raise ValidationError(f"empty Runtime entrypoint: {reference}")
    if path.suffix != ".py":
        raise ValidationError(f"named Runtime entrypoint requires Python source: {reference}")
    tree = ast.parse(path.read_text(encoding="utf-8"))
    functions = {node.name for node in tree.body if isinstance(node, ast.FunctionDef)}
    if function_name not in functions:
        raise ValidationError(f"Runtime entrypoint does not resolve: {reference}")


def validate_taxonomy_registry(registry: dict[str, Any]) -> None:
    if tuple(registry.get("canonical_levels", ())) != CANONICAL_LEVELS:
        raise ValidationError("canonical taxonomy levels are incomplete or reordered")
    extension = registry.get("extension_19", {})
    if tuple(extension.get("levels", ())) != EXTENSION_19_LEVELS:
        raise ValidationError("19-layer taxonomy extension is incompatible")
    parent_order = registry.get("rank_parent_order", {})
    expected_parent = None
    visited: set[str] = set()
    for rank in CANONICAL_LEVELS:
        if rank in visited:
            raise ValidationError("circular taxonomy rank")
        visited.add(rank)
        if parent_order.get(rank) != expected_parent:
            raise ValidationError(f"invalid taxonomy ancestry for {rank}")
        expected_parent = rank
    records = registry.get("records", [])
    species_ids: set[str] = set()
    for record in records:
        species_id = record.get("species_id")
        if not species_id or species_id in species_ids:
            raise ValidationError("duplicate or missing species_id in taxonomy registry")
        species_ids.add(species_id)
        taxonomy = record.get("taxonomy", {})
        if any(not isinstance(taxonomy.get(level), str) or not taxonomy[level] for level in CANONICAL_LEVELS):
            raise ValidationError(f"{species_id} taxonomy is incomplete")
        if taxonomy["species"] != species_id:
            raise ValidationError(f"{species_id} taxonomy ancestry ends at another Species")


def validate_species_registry(root: Path, registry: dict[str, Any], taxonomy: dict[str, Any]) -> None:
    taxonomy_ids = {record["species_id"] for record in taxonomy.get("records", [])}
    species_ids: set[str] = set()
    for species in registry.get("species", []):
        _require_fields(species, SPECIES_REQUIRED, "Species")
        species_id = species["species_id"]
        if species_id in species_ids:
            raise ValidationError(f"duplicate species_id: {species_id}")
        species_ids.add(species_id)
        if species_id not in taxonomy_ids:
            raise ValidationError(f"Species has invalid taxonomy ancestry: {species_id}")
        for field in (
            "taxonomy_ref",
            "species_manifest",
            "program_filename",
            "runtime_entrypoint",
            "reproduction_rules_ref",
            "mutation_rules_ref",
            "energy_profile_ref",
            "embodiment_profile_ref",
            "trade_profile_ref",
        ):
            _path_from_ref(root, species[field])
        _validate_entrypoint(root, species["runtime_entrypoint"])
        if not species["organ_requirements"]:
            raise ValidationError(f"{species_id} has no organ implementation")
        if not species["cell_requirements"]:
            raise ValidationError(f"{species_id} has no cell implementation")
        if species["release_policy"] != "DRY_RUN_ONLY":
            raise ValidationError(f"{species_id} attempts active release")
        reproduction = load_json(_path_from_ref(root, species["reproduction_rules_ref"]))
        profile_name = species["reproduction_rules_ref"].split("#", 1)[-1]
        profile = reproduction.get("profiles", {}).get(profile_name)
        if not profile:
            raise ValidationError(f"{species_id} has incompatible reproduction rule")
        if profile.get("mode") == "BIOLOGICAL" and "BIOLOGICAL_SIMULATION_ONLY" not in species["compatibility"]:
            raise ValidationError(f"{species_id} biological reproduction lacks simulation boundary")


def validate_unique_organism_ids(records: list[dict[str, Any]]) -> None:
    organism_ids: set[str] = set()
    for record in records:
        organism_id = record.get("organism_id")
        if not organism_id or organism_id in organism_ids:
            raise ValidationError("duplicate or missing organism_id")
        organism_ids.add(organism_id)


def validate_manifest(root: Path, manifest: dict[str, Any], live_record: bool = False) -> None:
    _require_fields(manifest, LEGACY_REQUIRED, "organism manifest")
    if manifest.get("schema_version") != "2.0":
        return
    _require_fields(manifest, V2_REQUIRED, "organism manifest 2.0")
    taxonomy = manifest["taxonomy"]
    if any(not taxonomy.get(level) for level in CANONICAL_LEVELS):
        raise ValidationError("organism taxonomy is incomplete")
    for level in CANONICAL_LEVELS[:8]:
        if manifest[level] != taxonomy[level]:
            raise ValidationError(f"flat taxonomy conflicts with taxonomy.{level}")
    references = (
        "species_ref",
        "canonical_file",
        "runtime_entry",
        "dna_schema",
        "dna_ref",
        "rna_ref",
        "organs_ref",
        "cells_ref",
        "runtime_ref",
        "energy_profile_ref",
        "embodiment_profile_ref",
        "lifecycle_ref",
        "reproduction_rules_ref",
        "mutation_rules_ref",
        "trade_profile_ref",
        "ownership_profile_ref",
        "authority_profile_ref",
    )
    for field in references:
        _path_from_ref(root, manifest[field])
    binding = manifest["runtime_binding"]
    for field in ("program_filename", "runtime_entrypoint", "state_path", "memory_path", "archive_path"):
        _path_from_ref(root, binding[field])
    _validate_entrypoint(root, binding["runtime_entrypoint"])
    behavior = manifest["life_behavior"]
    if behavior.get("trade_eligibility") not in TRADE_CLASSES:
        raise ValidationError("invalid K11520 trade classification")
    release = manifest["release"]
    expected_false = ("production_authority", "runtime_authority", "wallet_authority", "exchange_settlement")
    if release.get("activation_status") != "NOT_ACTIVE" or any(release.get(field) is not False for field in expected_false):
        raise ValidationError("candidate release attempts activation")
    if manifest.get("organism_class") in HIGH_AUTHORITY_CLASSES:
        raise ValidationError("high-authority organism requires a separate authority decision")
    if live_record:
        values = _flatten_strings(manifest)
        if values & PLACEHOLDERS:
            raise ValidationError("placeholder cannot be accepted as a live record")
        if manifest.get("status") in {"DRY_RUN", "CANDIDATE_ONLY", "NOT_ACTIVE", "REFERENCE_EXAMPLE"}:
            raise ValidationError("candidate status cannot be accepted as a live record")
    hash_value = manifest.get("integrity_hash", "")
    if not re.fullmatch(r"[a-f0-9]{64}", hash_value):
        raise ValidationError("invalid integrity hash format")
    if live_record:
        validate_integrity_hash(manifest)


def _flatten_strings(value: Any) -> set[str]:
    if isinstance(value, dict):
        result: set[str] = set()
        for nested in value.values():
            result.update(_flatten_strings(nested))
        return result
    if isinstance(value, list):
        result = set()
        for nested in value:
            result.update(_flatten_strings(nested))
        return result
    return {value} if isinstance(value, str) else set()


def validate_package(root: Path, package_dir: Path) -> dict[str, Any]:
    for relative in PACKAGE_FILES:
        if not (package_dir / relative).is_file():
            raise ValidationError(f"organism package missing {relative}")
    manifest = load_json(package_dir / "organism.json")
    validate_manifest(root, manifest)
    organs = load_json(package_dir / "dna" / "organs.json")
    cells = load_json(package_dir / "dna" / "cells.json")
    organ_ids = {record.get("organ_id") for record in organs.get("organs", [])}
    cell_ids = {record.get("cell_id") for record in cells.get("cells", [])}
    required_organs = set(manifest["runtime_binding"]["required_organs"])
    required_cells = set(manifest["runtime_binding"]["required_cells"])
    if not required_organs.issubset(organ_ids):
        raise ValidationError("invalid organ reference")
    if not required_cells.issubset(cell_ids):
        raise ValidationError("invalid cell reference")
    for cell in cells.get("cells", []):
        if cell.get("organ_id") not in organ_ids:
            raise ValidationError("cell references an unknown organ")
    return manifest


def validate_boundaries(root: Path) -> None:
    forbidden_markers = {
        "runtime_authority\": true",
        "production_authority\": true",
        "settlement_active\": true",
        "wallet_authority\": true",
        "codex_birth_authorized\": true",
        "new_thread_authorized\": true",
    }
    implementation_root = root / "KGEN-KAIOS" / "organism"
    for path in implementation_root.rglob("*"):
        if not path.is_file() or path.suffix not in {".json", ".md", ".py"}:
            continue
        text = path.read_text(encoding="utf-8").lower()
        for marker in forbidden_markers:
            if marker in text:
                raise ValidationError(f"forbidden activation marker in {path.relative_to(root)}")


def validate_all(root: Path) -> dict[str, int]:
    organism_root = root / "KGEN-KAIOS" / "organism"
    taxonomy = load_json(organism_root / "taxonomy_registry.json")
    species = load_json(organism_root / "species_registry.json")
    validate_taxonomy_registry(taxonomy)
    validate_species_registry(root, species, taxonomy)
    validate_package(root, organism_root / "package-template")
    validate_boundaries(root)
    json_files = list(organism_root.rglob("*.json"))
    for path in json_files:
        load_json(path)
    return {
        "taxonomy_levels": len(CANONICAL_LEVELS),
        "taxonomy_extension_levels": len(EXTENSION_19_LEVELS),
        "species": len(species["species"]),
        "package_files": len(PACKAGE_FILES),
        "json_files": len(json_files),
    }
