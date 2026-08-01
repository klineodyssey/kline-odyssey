import hashlib
import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
CANDIDATES = ROOT / "KAIOS" / "life" / "candidates"
SCHEMA_PATH = ROOT / "KAIOS_CANONICAL_LIFE_SCHEMA_V1.json"
EXTENSIONS_PATH = ROOT / "KAIOS_CANONICAL_LIFE_TYPE_EXTENSIONS_V1.json"
EXPECTED_PACKAGES = {
    "grass": ("PLANT_LIFE", ["PLANT_EXTENSION"]),
    "tree": ("PLANT_LIFE", ["PLANT_EXTENSION"]),
    "fish": ("MARINE_LIFE", ["MARINE_EXTENSION"]),
    "shrimp": ("MARINE_LIFE", ["MARINE_EXTENSION"]),
    "mountain": ("TERRAIN_LIFE", ["TERRAIN_EXTENSION"]),
    "soil": ("LAND_LIFE", ["LAND_EXTENSION", "SOIL_EXTENSION"]),
    "water": ("WATER_BODY_LIFE", ["WATER_BODY_EXTENSION"]),
    "river": ("WATER_BODY_LIFE", ["WATER_BODY_EXTENSION"]),
}
EXPECTED_FILES = {
    "README.md",
    "life.manifest.json",
    "taxonomy.json",
    "physics.json",
    "environment.json",
    "growth_or_formation.json",
    "health_or_integrity.json",
    "reproduction_or_change.json",
    "economy.json",
    "rights.json",
    "runtime.json",
    "viewer.json",
    "api.json",
    "provenance.json",
    "integrity.json",
    "event_log.json",
}
COVERED_FILES = sorted(EXPECTED_FILES - {"integrity.json"})
ZERO_HASH = "0" * 64
ALLOWED_CHANGED_PREFIXES = (
    "KAIOS/life/candidates/grass/",
    "KAIOS/life/candidates/tree/",
    "KAIOS/life/candidates/fish/",
    "KAIOS/life/candidates/shrimp/",
    "KAIOS/life/candidates/mountain/",
    "KAIOS/life/candidates/soil/",
    "KAIOS/life/candidates/water/",
    "KAIOS/life/candidates/river/",
    "KAIOS/life/tests/",
    "CURSOR_FOUNDATIONAL_LIFE_PACKAGE_REPORT.md",
)
DOMAIN_FIELDS = {
    "grass": ["taxonomy", "species_program", "mass_range", "height_range", "root_depth", "water_need", "sunlight_need", "soil_compatibility", "growth_rate", "seed", "reproduction", "season", "temperature_range", "disease", "grazing_role", "erosion_control_role", "economic_role", "event_log"],
    "tree": ["taxonomy", "species_program", "mass_range", "height_range", "root_system", "water_need", "sunlight_need", "soil_compatibility", "growth_stages", "seed", "flower", "fruit_optional", "wood_output", "habitat_role", "aging", "disease", "death", "economic_role", "event_log"],
    "fish": ["taxonomy", "body_plan", "mass_range", "length_range", "water_type", "temperature", "oxygen", "salinity", "diet", "movement", "energy", "health", "growth", "sex", "reproduction", "offspring", "lifespan", "predator_prey_role", "aquaculture_role", "harvest_output", "economic_role", "event_log"],
    "shrimp": ["taxonomy", "body_plan", "mass_range", "length_range", "water_type", "temperature", "oxygen", "salinity", "diet", "molting", "growth", "health", "reproduction", "larval_stages", "lifespan", "aquaculture_role", "water_quality_sensitivity", "harvest_output", "economic_role", "event_log"],
    "mountain": ["formation", "geology", "mass", "volume", "density", "elevation", "slope", "stability", "erosion", "weathering", "resource_deposits", "water_source_role", "transport_barrier", "hazards", "collapse_conditions", "economic_role", "civilization_role", "event_log"],
    "soil": ["composition", "mass", "volume", "density", "moisture", "fertility", "ph", "organic_matter", "compaction", "erosion", "contamination", "crop_support", "foundation_support", "water_retention", "economic_role", "event_log"],
    "water": ["composition", "mass", "volume", "temperature", "state", "energy", "purity", "pollution", "availability", "consumption", "evaporation", "freezing", "boiling", "economic_role", "life_support_role", "event_log"],
    "river": ["source", "path", "length", "width", "depth", "flow", "volume", "temperature", "oxygen", "sediment", "pollution", "inflow", "outflow", "flood", "drought", "bridge_interaction", "transport_blocking", "irrigation_role", "economic_role", "event_log"],
}


def load_json(path):
    raw = path.read_bytes()
    assert not raw.startswith(b"\xef\xbb\xbf"), f"BOM detected: {path}"
    assert b"\x00" not in raw, f"NUL byte detected: {path}"
    text = raw.decode("utf-8")
    assert "\ufffd" not in text, f"replacement character detected: {path}"
    return json.loads(text)


def canonical_json(value):
    return json.dumps(value, ensure_ascii=True, sort_keys=True, separators=(",", ":")).encode("utf-8")


def component_bytes(package_dir, name):
    path = package_dir / name
    if path.suffix == ".json":
        value = load_json(path)
        if name == "life.manifest.json":
            value["integrity"]["checksum"] = ZERO_HASH
        return canonical_json(value)
    raw = path.read_bytes()
    assert not raw.startswith(b"\xef\xbb\xbf"), f"BOM detected: {path}"
    raw.decode("utf-8")
    return raw


def recompute_checksum(package_dir):
    digest = hashlib.sha256()
    for name in COVERED_FILES:
        payload = component_bytes(package_dir, name)
        digest.update(name.encode("utf-8"))
        digest.update(b"\n")
        digest.update(str(len(payload)).encode("ascii"))
        digest.update(b"\n")
        digest.update(payload)
        digest.update(b"\n")
    return digest.hexdigest()


def assert_schema_shape(manifest, schema):
    assert set(schema["required"]) == set(manifest), "manifest must contain exactly canonical top-level fields"
    assert manifest["schema_version"] == "1.0.0"
    assert manifest["life_type"] in schema["$defs"]["lifeType"]["enum"]
    assert manifest["life_id"].startswith("LIFE-")
    for measure_name in ["mass", "volume", "density"]:
        measure = manifest[measure_name]
        assert set(measure) == {"value", "unit"}
        assert isinstance(measure["value"], (int, float)) and measure["value"] > 0
        assert isinstance(measure["unit"], str) and measure["unit"]
    for binding_name in ["runtime_binding", "world_viewer_binding", "api_binding"]:
        binding = manifest[binding_name]
        assert set(binding) == {"mode", "reference", "authority"}
        assert binding["mode"] in schema["$defs"]["binding"]["properties"]["mode"]["enum"]
        assert binding["authority"] == "NO_PRODUCTION_AUTHORITY"
    assert set(manifest["field_applicability"]) == set(schema["$defs"]["applicabilityMap"]["propertyNames"]["enum"])
    assert set(manifest["rights"]) == set(schema["$defs"]["rights"]["required"])
    assert manifest["rights"]["tradeability"] in schema["$defs"]["rights"]["properties"]["tradeability"]["enum"]
    economy = manifest["economic_role"]
    assert set(economy) == set(schema["$defs"]["economy"]["required"])
    assert economy["K11520_eligibility"] == "SIMULATED_K11520_ONLY"
    safety = manifest["safety_boundaries"]
    assert safety == {
        "real_kgen": "NO_REAL_KGEN",
        "onchain_transfer": "NO_ONCHAIN_TRANSFER",
        "k11520": "SIMULATED_K11520_ONLY",
        "production_runtime": False,
        "wallet": "NONE",
        "legal_personhood": False,
    }


def assert_taxonomy(package_name, manifest):
    taxonomy = manifest["taxonomy"]
    for rank in ["DOMAIN", "KINGDOM", "PHYLUM", "CLASS", "ORDER", "FAMILY", "GENUS", "SPECIES", "LIFE_INSTANCE"]:
        assert taxonomy.get(rank), f"{package_name}: missing taxonomy rank {rank}"
    extension_19 = taxonomy.get("extension_19")
    assert isinstance(extension_19, dict), f"{package_name}: missing extension_19 compatibility decision"
    if package_name in {"grass", "tree", "fish", "shrimp"}:
        expected_19 = ["Domain", "Kingdom", "Phylum", "Class", "Order", "Family", "Genus", "Species", "Individual", "OrganSystem", "Organ", "Tissue", "Cell", "Organelle", "Genome", "DNA", "RNA", "Gene", "Expression"]
        assert set(extension_19) == set(expected_19), f"{package_name}: biological 19-layer taxonomy incomplete"
    else:
        assert extension_19["status"] == "NOT_APPLICABLE"


def assert_extension(package_name, manifest, extension_map):
    expected_type, expected_extensions = EXPECTED_PACKAGES[package_name]
    assert manifest["life_type"] == expected_type
    found = [extension["extension_id"] for extension in manifest["extensions"]]
    assert found == expected_extensions, f"{package_name}: expected {expected_extensions}, got {found}"
    canonical = extension_map["type_extension_map"][expected_type]
    for required in canonical.get("required", []):
        assert required in found
    for required in canonical.get("required_one_of", []):
        if expected_type == "BIOLOGICAL_LIFE":
            assert required in found
    allowed = set(canonical.get("required", [])) | set(canonical.get("optional", []))
    if allowed:
        assert set(found).issubset(allowed)


def assert_physics(package_name, package_dir, manifest):
    physics = load_json(package_dir / "physics.json")
    mass = manifest["mass"]["value"]
    volume = manifest["volume"]["value"]
    density = manifest["density"]["value"]
    assert abs((mass / volume) - density) <= max(1e-6, density * 0.000001), f"{package_name}: mass-volume-density mismatch"
    assert physics["density_check"]["computed_kg_per_m3"] > 0
    env = load_json(package_dir / "environment.json")
    assert env["resource_inputs"], f"{package_name}: missing resource inputs"
    assert env["resource_outputs"], f"{package_name}: missing resource outputs"
    growth = load_json(package_dir / "growth_or_formation.json")
    growth_text = json.dumps(growth, sort_keys=True).lower()
    if package_name in {"mountain", "river", "water", "soil"}:
        assert "instant_formation" in growth_text or "elapsed time" in growth_text or "elapsed_time" in growth_text
    if package_name == "mountain":
        assert "geologic time" in growth_text
    if package_name == "river":
        flow = growth["flow"]
        assert flow["source_elevation_m"] > flow["mouth_elevation_m"], "river cannot flow uphill without cause"
        assert flow["no_unexplained_uphill_flow"] is True
        assert growth["instant_formation"] is False


def assert_boundaries(package_name, package_dir, manifest):
    runtime = load_json(package_dir / "runtime.json")
    rights = load_json(package_dir / "rights.json")
    api = load_json(package_dir / "api.json")
    assert runtime["simulation_only"] is True
    assert runtime["production_authority"] is False
    assert runtime["executable"] is False
    assert runtime["wallet"] == "NONE"
    assert runtime["settlement"] is False
    assert rights["legal_personhood"] is False
    assert rights["wallet"] == "NONE"
    assert api["writes_allowed"] is False
    assert api["production_authority"] is False
    assert manifest["transfer"]["enabled"] is False
    assert manifest["transfer"]["onchain_transfer"] == "NO_ONCHAIN_TRANSFER"
    assert manifest["operation"]["simulation_only"] is True
    assert manifest["authority"]["production_authority"] is False


def assert_event_and_provenance(package_name, package_dir, manifest):
    event_log = load_json(package_dir / "event_log.json")
    assert event_log["events"] == manifest["event_log"]
    assert event_log["events"], f"{package_name}: empty event log"
    first = event_log["events"][0]
    expected_hash = hashlib.sha256(f"{manifest['deterministic_seed']}|{manifest['life_id']}|CREATED_CANDIDATE".encode("utf-8")).hexdigest()
    assert first["previous_state_hash"] is None
    assert first["next_state_hash"] == expected_hash
    provenance = load_json(package_dir / "provenance.json")
    assert provenance["task_id"] == "KAIOS-PR67-CURSOR-FOUNDATIONAL-LIFE-CANDIDATES-001"
    assert provenance["base_snapshot_sha"] == "a29a0f5228022bbbf054f9ae9d486264cc957998"
    assert provenance["current_origin_main_sha"] == "74009c7906ef671c1fe250199b901c0d0045c6dc"


def assert_integrity(package_name, package_dir, manifest):
    integrity = load_json(package_dir / "integrity.json")
    expected = recompute_checksum(package_dir)
    assert integrity["checksum"] == expected, f"{package_name}: integrity.json checksum mismatch"
    assert manifest["integrity"]["checksum"] == expected, f"{package_name}: manifest checksum mismatch"
    assert sorted(integrity["covers"]) == COVERED_FILES
    assert sorted(manifest["integrity"]["covers"]) == COVERED_FILES
    assert "integrity.json" in integrity["excludes"]
    assert "life.manifest.json#/integrity/checksum" in integrity["excludes"]


def assert_domain_content(package_name, package_dir):
    combined = []
    for path in sorted(package_dir.iterdir()):
        if path.suffix == ".json":
            combined.append(json.dumps(load_json(path), sort_keys=True).lower())
        else:
            combined.append(path.read_text(encoding="utf-8").lower())
    text = "\n".join(combined)
    for field in DOMAIN_FIELDS[package_name]:
        assert field.lower() in text, f"{package_name}: missing domain content {field}"


def assert_protected_changes():
    diff_result = subprocess.run(
        ["git", "diff", "--name-only", "origin/main...HEAD"],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )
    status_result = subprocess.run(
        ["git", "status", "--porcelain=v1", "--untracked-files=all"],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=True,
    )
    changed = [line.strip().replace("\\", "/") for line in diff_result.stdout.splitlines() if line.strip()]
    for line in status_result.stdout.splitlines():
        if not line.strip():
            continue
        path = line[3:].strip().replace("\\", "/")
        if " -> " in path:
            path = path.split(" -> ", 1)[1]
        changed.append(path)
    for path in changed:
        assert path.startswith(ALLOWED_CHANGED_PREFIXES), f"protected or unlisted path changed: {path}"


def main():
    schema = load_json(SCHEMA_PATH)
    extension_map = load_json(EXTENSIONS_PATH)
    actual_packages = {path.name for path in CANDIDATES.iterdir() if path.is_dir()}
    assert actual_packages == set(EXPECTED_PACKAGES), f"unexpected package dirs: {actual_packages}"
    for package_name in sorted(EXPECTED_PACKAGES):
        package_dir = CANDIDATES / package_name
        actual_files = {path.name for path in package_dir.iterdir() if path.is_file()}
        assert actual_files == EXPECTED_FILES, f"{package_name}: incorrect file set {actual_files}"
        manifest = load_json(package_dir / "life.manifest.json")
        assert_schema_shape(manifest, schema)
        assert_taxonomy(package_name, manifest)
        assert_extension(package_name, manifest, extension_map)
        assert_physics(package_name, package_dir, manifest)
        assert_boundaries(package_name, package_dir, manifest)
        assert_event_and_provenance(package_name, package_dir, manifest)
        assert_integrity(package_name, package_dir, manifest)
        assert_domain_content(package_name, package_dir)
    assert_protected_changes()
    print("FOUNDATIONAL_LIFE_CANDIDATE_VALIDATION_PASS")


if __name__ == "__main__":
    main()
