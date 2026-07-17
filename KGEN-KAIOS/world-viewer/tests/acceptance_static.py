#!/usr/bin/env python3
"""Offline Alpha contract checks for the synthetic KAIOS World Viewer."""

from __future__ import annotations

import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parents[1]
FIXTURE = ROOT / "data" / "synthetic-world.json"

REQUIRED_FILES = (
    "index.html",
    "app.js",
    "ui/styles.css",
    "ui/shell.js",
    "ui/context-menu.js",
    "camera/camera-controller.js",
    "renderer/map-renderer.js",
    "selection/selection-controller.js",
    "inspector/inspector-view.js",
    "lod/lod-controller.js",
    "input/input-controller.js",
    "land/land-runtime.js",
    "building/building-runtime.js",
    "room/room-runtime.js",
    "life/life-os-viewer.js",
    "life/life-runtime.js",
    "player/player-controller.js",
    "simulation/simulation-clock.js",
    "citizen/citizen-daily-runtime.js",
    "ai/ai-worker-runtime.js",
    "economy/economy-runtime.js",
    "planet/planet-environment-runtime.js",
    "genesis/genesis-runtime.js",
    "genesis/genesis-view.js",
    "agriculture/agriculture-runtime.js",
    "ecosystem/ecosystem-runtime.js",
    "production/production-runtime.js",
    "enterprise/ai-company-organism-runtime.js",
    "exchange/life-exchange-runtime.js",
    "city/city-runtime.js",
    "civilization/runtime-utils.js",
    "civilization/civilization-runtime.js",
    "civilization/civilization-view.js",
    "data/world-store.js",
    "data/synthetic-world.json",
    "tests/runtime_integrity.mjs",
    "tests/civilization_integrity.mjs",
    "tests/genesis_integrity.mjs",
    "tests/production_integrity.mjs",
)

PROTECTED_PREFIXES = (
    "contracts/",
    "wallet/",
    "bridge/",
    "KGEN/contracts/",
    "K\u7dda\u897f\u904a\u8a18/temples/12345/",
    "docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md",
    "docs/maps/UniverseMap_",
    "final-whitepaper/",
)

PROPOSAL_ACTIONS = {
    "RESIDENTIAL",
    "FARM",
    "FOREST",
    "FACTORY",
    "MARKETPLACE",
    "TEMPLE",
    "RESEARCH",
    "PUBLIC_FACILITY",
}

LIFE_LAYERS = {
    "Body": ("body", "body_layer"),
    "Species OS": ("species_os", "speciesOs"),
    "Individual Life OS": ("individual_life_os", "individualLifeOs"),
    "Mind": ("mind_runtime", "mind", "mindRuntime"),
    "Citizen": ("citizen_runtime", "citizen", "citizenRuntime"),
}

FORBIDDEN_PRIVATE_KEYS = {
    "auth_token",
    "exact_gps",
    "gps",
    "kyc",
    "latitude",
    "longitude",
    "mnemonic",
    "password",
    "payroll",
    "precise_location",
    "private_key",
    "raw_kyc",
    "salary",
    "secret",
    "seed_phrase",
    "wallet",
    "wallet_address",
}


class LocalReferenceParser(HTMLParser):
    """Collect local page references without attempting to interpret HTML."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.references: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attributes = dict(attrs)
        for name in ("href", "src"):
            value = attributes.get(name)
            if value:
                self.references.append((tag, value))


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def entity_ids(data: dict) -> list[str]:
    entities = [data.get("earth")]
    for key in ("regions", "cities", "parcels", "buildings", "rooms", "lifeProfiles"):
        entities.extend(data.get(key, []))
    return [str(entity.get("id")) for entity in entities if isinstance(entity, dict)]


def first_mapping(record: dict, aliases: tuple[str, ...]) -> dict | None:
    for alias in aliases:
        value = record.get(alias)
        if isinstance(value, dict):
            return value
    stack = record.get("life_stack") or record.get("layers")
    if isinstance(stack, dict):
        for alias in aliases:
            value = stack.get(alias)
            if isinstance(value, dict):
                return value
    return None


def nested_keys(value: object) -> set[str]:
    keys: set[str] = set()
    if isinstance(value, dict):
        for key, child in value.items():
            keys.add(str(key).lower())
            keys.update(nested_keys(child))
    elif isinstance(value, list):
        for child in value:
            keys.update(nested_keys(child))
    return keys


def parse_json_and_jsonl(errors: list[str]) -> int:
    parsed = 0
    for path in sorted(ROOT.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in {".json", ".jsonl"}:
            continue
        try:
            text = path.read_text(encoding="utf-8")
            if path.suffix.lower() == ".json":
                json.loads(text)
                parsed += 1
            else:
                for line_number, line in enumerate(text.splitlines(), start=1):
                    if not line.strip():
                        continue
                    json.loads(line)
                    parsed += 1
        except (OSError, UnicodeError, json.JSONDecodeError) as error:
            fail(errors, f"strict JSON parse failed: {path.relative_to(ROOT)}: {error}")
    return parsed


def check_local_references(errors: list[str], html: str) -> int:
    parser = LocalReferenceParser()
    parser.feed(html)
    checked = 0
    for tag, raw_reference in parser.references:
        split = urlsplit(raw_reference)
        if split.scheme or split.netloc or raw_reference.startswith(("#", "data:")):
            continue
        relative = unquote(split.path)
        if not relative:
            continue
        target = (REPO / relative.lstrip("/")) if relative.startswith("/") else (ROOT / relative)
        if not target.resolve().is_relative_to(REPO.resolve()):
            fail(errors, f"local {tag} reference escapes repository: {raw_reference}")
        elif not target.is_file():
            fail(errors, f"broken local {tag} reference: {raw_reference}")
        checked += 1

    import_pattern = re.compile(r"(?:from\s+|import\s*)[\"'](\.[^\"']+)[\"']")
    for module in sorted(ROOT.rglob("*.js")):
        source = module.read_text(encoding="utf-8")
        for reference in import_pattern.findall(source):
            target = (module.parent / reference).resolve()
            if not target.is_file():
                fail(errors, f"broken module import: {module.relative_to(ROOT)} -> {reference}")
            checked += 1
    return checked


def check_life_contract(errors: list[str], data: dict, life_source: str) -> None:
    profiles = data.get("lifeProfiles", [])
    for profile in profiles:
        if not isinstance(profile, dict):
            fail(errors, "life profile is not an object")
            continue
        profile_id = profile.get("id", "UNKNOWN")
        privacy_class = str(profile.get("privacy_class", ""))
        if privacy_class not in {"PUBLIC_SYNTHETIC", "PUBLIC_LIFE_STATUS"}:
            fail(errors, f"life profile {profile_id} lacks a public-safe privacy class")
        for layer_name, aliases in LIFE_LAYERS.items():
            layer = first_mapping(profile, aliases)
            if layer is None:
                fail(errors, f"life profile {profile_id} missing {layer_name} layer")
                continue
            for field in ("id", "status", "version"):
                if field not in layer:
                    fail(errors, f"life profile {profile_id} {layer_name} missing {field}")
        exposed = nested_keys(profile) & FORBIDDEN_PRIVATE_KEYS
        if exposed:
            fail(errors, f"life profile {profile_id} exposes private keys: {sorted(exposed)}")

    for label in LIFE_LAYERS:
        if label.lower() not in life_source.lower():
            fail(errors, f"Life viewer does not render the {label} layer")
    if "privacy" not in life_source.lower() or not any(
        marker in life_source.lower() for marker in ("read-only", "local-only")
    ):
        fail(errors, "Life viewer lacks an explicit privacy-safe local simulation contract")


def check_alpha_contract(errors: list[str], data: dict, source_text: str, html: str) -> None:
    meta = data.get("meta", {})
    alpha_values = [
        meta.get("product_stage"),
        meta.get("release_stage"),
        meta.get("fixture_id"),
        meta.get("source_revision"),
    ]
    if meta.get("alpha") is not True and not any(
        "ALPHA" in str(value).upper() or "SPRINT-002" in str(value).upper()
        for value in alpha_values
    ):
        fail(errors, "fixture does not declare the World Viewer Alpha contract")
    if "alpha" not in (html + source_text).lower():
        fail(errors, "product UI does not identify the Alpha state")

    player = data.get("player", {})
    if player.get("location_consent") is not False:
        fail(errors, "mock location consent must default to false")
    location_mode = str(player.get("location_mode", ""))
    if "MOCK" not in location_mode or "COARSE" not in location_mode:
        fail(errors, "player location mode must be mock and coarse")
    private_player_keys = nested_keys(player) & {
        "exact_gps", "gps", "latitude", "longitude", "precise_location"
    }
    if private_player_keys:
        fail(errors, f"player fixture contains precise location fields: {sorted(private_player_keys)}")
    consent_signals = (
        "location-consent",
        "location_consent",
        "mock location consent",
        "consent-dialog",
    )
    lowered = source_text.lower()
    if not any(signal in lowered for signal in consent_signals):
        fail(errors, "explicit mock location consent UI/handler is missing")
    if "navigator.geolocation" in lowered or "getcurrentposition" in lowered:
        fail(errors, "real browser geolocation is forbidden in the Alpha")

    civilization = data.get("civilization_alpha", {})
    if civilization.get("simulation_only") is not True:
        fail(errors, "Civilization Alpha must declare simulation_only")
    if civilization.get("real_payment") is not False:
        fail(errors, "Civilization Alpha must prohibit real payment")
    if civilization.get("authoritative_registry") is not False:
        fail(errors, "Civilization Alpha cannot become the authoritative registry")
    for label in ("Sleep", "Breakfast", "Work", "Study", "Shopping", "Exercise", "Entertainment"):
        if label.upper() not in source_text.upper():
            fail(errors, f"Citizen schedule is missing {label}")
    for resource in ("RICE", "VEGETABLE", "FRUIT", "FISH", "PIG", "CHICKEN", "EGG", "MILK", "WATER", "WOOD", "STONE", "IRON", "ELECTRICITY"):
        if resource not in source_text:
            fail(errors, f"resource catalog is missing {resource}")

    production = data.get("production_alpha", {})
    if production.get("decision_id") != "HUMAN-SPRINT-005-CIVILIZATION-PRODUCTION":
        fail(errors, "Production Alpha decision ID is invalid")
    if production.get("simulation_only") is not True:
        fail(errors, "Production Alpha must be simulation only")
    if any(production.get(key) is not False for key in ("real_biology", "real_trade", "legal_securities", "authoritative_registry")):
        fail(errors, "Production Alpha crosses a real-world or authoritative boundary")
    expected_lineage = [
        "UNICELLULAR", "CAMBRIAN_OCEAN", "FISH", "AMPHIBIAN", "REPTILE",
        "BIRD", "MAMMAL", "PRIMITIVE_HUMAN", "CIVILIZATION", "INDUSTRIAL",
        "AI_CIVILIZATION",
    ]
    if [stage.get("stage_id") for stage in production.get("evolution_stages", [])] != expected_lineage:
        fail(errors, "Cambrian-to-AI evolution lineage is incomplete")
    species_labels = {species.get("label") for species in production.get("species_catalog", [])}
    expected_species = {
        "Tiger", "Lion", "Elephant", "Cow", "Pig", "Chicken", "Fish", "Bee",
        "Tree", "Rice", "Corn", "Cabbage", "Fruit Tree", "Flower", "Mushroom",
        "Bacteria",
    }
    if not expected_species.issubset(species_labels):
        fail(errors, f"Production species catalog incomplete: {sorted(expected_species - species_labels)}")
    facility_types = {facility.get("facility_type") for facility in production.get("agriculture_facilities", [])}
    expected_facilities = {
        "MIXED_FARM", "FISH_FARM", "PIG_FARM", "CHICKEN_FARM", "FRUIT_FARM",
        "FOREST", "VEGETABLE_FARM", "BEE_FARM", "WATER_SYSTEM",
    }
    if facility_types != expected_facilities:
        fail(errors, f"Agriculture facility organisms incomplete: {sorted(str(value) for value in facility_types)}")
    supply_categories = {node.get("category") for node in production.get("supply_nodes", [])}
    expected_supply = {
        "ELECTRICITY", "WATER", "ENGINEERS", "WORKERS", "EQUIPMENT", "SILICON",
        "CHEMICALS", "INDUSTRIAL_GAS", "TRANSPORTATION", "WAREHOUSE", "FINANCE",
        "AI_COMPANY",
    }
    if supply_categories != expected_supply:
        fail(errors, f"Factory supply chain incomplete: {sorted(str(value) for value in supply_categories)}")
    if production.get("factory", {}).get("product_recipe", {}).get("product_id") != "REFRIGERATOR_ALPHA":
        fail(errors, "Refrigerator product chain is missing")
    if production.get("ai_company", {}).get("organism_type") != "AI_COMPANY_ORGANISM":
        fail(errors, "AI Company organism is missing")
    exchange = production.get("exchange", {})
    if exchange.get("exchange_id") != "K11520" or any(
        item.get("review_status") != "CANDIDATE_REVIEW_REQUIRED"
        for item in exchange.get("candidates", [])
    ):
        fail(errors, "K11520 candidate-only exchange boundary is invalid")


def main() -> int:
    errors: list[str] = []

    for relative_path in REQUIRED_FILES:
        if not (ROOT / relative_path).is_file():
            fail(errors, f"missing file: {relative_path}")

    if (ROOT / "assets").exists() and any((ROOT / "assets").iterdir()):
        fail(errors, "legacy assets/ contains duplicate runtime modules")

    parsed_json_records = parse_json_and_jsonl(errors)
    try:
        data = json.loads(FIXTURE.read_text(encoding="utf-8"))
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        fail(errors, f"fixture JSON invalid: {error}")
        data = {}

    meta = data.get("meta", {})
    checks = {
        "synthetic fixture": meta.get("synthetic") is True,
        "non-authoritative fixture": (
            meta.get("non_authoritative") is True and meta.get("authoritative") is not True
        ),
        "Earth K280": data.get("earth", {}).get("surface_k") == 280,
        "one region": len(data.get("regions", [])) == 1,
        "one city overlay": len(data.get("cities", [])) == 1,
        "twelve parcels": len(data.get("parcels", [])) == 12,
        "building templates": len(data.get("buildingTemplates", [])) == 8,
        "two buildings": len(data.get("buildings", [])) == 2,
        "three rooms": len(data.get("rooms", [])) == 3,
        "furniture": len(data.get("furniture", [])) == 3,
        "equipment": len(data.get("equipment", [])) == 3,
        "room organisms": len(data.get("organisms", [])) == 5,
        "life profiles": len(data.get("lifeProfiles", [])) >= 5,
        "Genesis one-time claim": data.get("genesis", {}).get("one_time_claim") is True,
        "Genesis is not real KGEN": data.get("genesis", {}).get("real_kgen") is False,
        "five Planet profiles": len(data.get("planet_profiles", [])) == 5,
        "unknown parcel": any(
            parcel.get("status") == "UNKNOWN" for parcel in data.get("parcels", [])
        ),
    }
    for label, passed in checks.items():
        if not passed:
            fail(errors, f"fixture check failed: {label}")

    raw_actions = data.get("proposalActions", [])
    action_ids = {
        action if isinstance(action, str) else action.get("id")
        for action in raw_actions
        if isinstance(action, (str, dict))
    }
    if action_ids != PROPOSAL_ACTIONS or len(raw_actions) != len(PROPOSAL_ACTIONS):
        fail(errors, f"proposal actions mismatch: {sorted(str(item) for item in action_ids)}")
    for action in raw_actions:
        if isinstance(action, dict) and not action.get("label"):
            fail(errors, f"proposal action lacks label: {action.get('id', 'UNKNOWN')}")

    ids = entity_ids(data)
    if len(ids) != len(set(ids)):
        fail(errors, "world entity IDs are not unique")

    valid_parents = {
        "regions": {data.get("earth", {}).get("id")},
        "cities": {item.get("id") for item in data.get("regions", [])},
        "parcels": {item.get("id") for item in data.get("cities", [])},
        "buildings": {item.get("id") for item in data.get("parcels", [])},
        "rooms": {item.get("id") for item in data.get("buildings", [])},
    }
    for collection, parents in valid_parents.items():
        for entity in data.get(collection, []):
            if entity.get("parent_id") not in parents:
                fail(errors, f"invalid parent: {collection}/{entity.get('id')}")

    starter_id = data.get("player", {}).get("starter_parcel_id")
    starter = next((item for item in data.get("parcels", []) if item.get("id") == starter_id), {})
    if (
        not starter
        or starter.get("owner_id") != data.get("player", {}).get("player_id")
        or "PROPOSE" not in starter.get("capabilities", [])
        or starter.get("status") != "ACTIVE"
    ):
        fail(errors, "Starter Parcel does not satisfy the proposal permission contract")
    if not starter.get("revision_history") or not starter.get("ownership_timeline"):
        fail(errors, "Starter Parcel lacks revision or ownership history")
    player = data.get("player", {})
    for field, collection in (
        ("life_id", "lifeProfiles"),
        ("home_building_id", "buildings"),
        ("home_room_id", "rooms"),
    ):
        target_ids = {item.get("id") for item in data.get(collection, [])}
        if player.get(field) not in target_ids:
            fail(errors, f"player {field} does not resolve into {collection}")
    organism_types = {item.get("organism_type") for item in data.get("organisms", [])}
    expected_organism_types = {"PLAYER", "AI_WORKER", "NPC", "PET", "PLANT"}
    if not expected_organism_types.issubset(organism_types):
        fail(errors, f"room organism types incomplete: {sorted(str(item) for item in organism_types)}")

    genesis = data.get("genesis", {})
    if genesis.get("starter_fortune_options") != [1, 8, 88, 188, 388, 888]:
        fail(errors, "Genesis Fortune options do not match the approved one-time set")
    planet_ids = {profile.get("planet_id") for profile in data.get("planet_profiles", [])}
    if planet_ids != {"EARTH", "MOON", "MARS", "JUPITER", "FUTURE_PLANET"}:
        fail(errors, f"Planet profile IDs mismatch: {sorted(str(item) for item in planet_ids)}")
    for profile in data.get("planet_profiles", []):
        missing = {
            "atmosphere", "gravity_g", "temperature", "pressure", "water",
            "radiation", "magnetic_field", "day_length_hours", "year_length_days",
            "native_species", "food_availability", "energy", "life_compatibility",
            "resource_rules", "civilization_rules", "travel_rules",
        } - set(profile)
        if missing:
            fail(errors, f"Planet profile {profile.get('planet_id')} missing: {sorted(missing)}")

    html = (ROOT / "index.html").read_text(encoding="utf-8")
    if 'src="./app.js"' not in html or 'href="./ui/styles.css"' not in html:
        fail(errors, "index.html does not use the approved module entry and stylesheet")
    if html.count("<script") != 1:
        fail(errors, "index.html must have exactly one script entry")
    if "viewport-fit=cover" not in html:
        fail(errors, "viewport metadata lacks safe-area support")

    source_paths = sorted(
        path for path in ROOT.rglob("*")
        if path.is_file() and path.suffix.lower() in {".html", ".js", ".json", ".md", ".css", ".py"}
        and "tests/evidence" not in path.as_posix()
    )
    source_text = "\n".join(
        path.read_text(encoding="utf-8", errors="replace") for path in source_paths
    )
    runtime_source = "\n".join(
        path.read_text(encoding="utf-8", errors="replace")
        for path in sorted(ROOT.rglob("*"))
        if path.is_file() and path.suffix.lower() in {".html", ".js", ".css"}
    )
    check_alpha_contract(errors, data, runtime_source, html)
    check_life_contract(
        errors,
        data,
        (ROOT / "life" / "life-os-viewer.js").read_text(encoding="utf-8"),
    )
    checked_references = check_local_references(errors, html)

    proposal_source = (ROOT / "ui" / "context-menu.js").read_text(encoding="utf-8")
    proposal_tokens = (
        'proposal_type: "LAND_USE_PROPOSAL"',
        "owner_id",
        "authorized_requester_ids",
        'includes("PROPOSE")',
        'status === "ACTIVE"',
        "persisted: false",
    )
    for token in proposal_tokens:
        if token not in proposal_source:
            fail(errors, f"proposal permission/draft contract missing token: {token}")
    if re.search(
        r"\bmethod\s*:\s*[\"'](?:POST|PUT|PATCH|DELETE)[\"']",
        runtime_source,
        flags=re.IGNORECASE,
    ):
        fail(errors, "World Viewer contains a mutating network request")

    safe_area_tokens = (
        "safe-area-inset-top",
        "safe-area-inset-right",
        "safe-area-inset-bottom",
        "safe-area-inset-left",
        "--touch: 44px",
    )
    styles = (ROOT / "ui" / "styles.css").read_text(encoding="utf-8")
    for token in safe_area_tokens:
        if token not in styles:
            fail(errors, f"responsive contract missing CSS token: {token}")

    secret_patterns = (
        r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----",
        r"\b(?:seed phrase|mnemonic)\s*[:=]",
        r"\b(?:api[_ -]?key|private[_ -]?key)\s*[:=]\s*[\"'][^\"']+",
        r"\b(?:sk|pk)_[a-zA-Z0-9]{24,}\b",
    )
    for pattern in secret_patterns:
        if re.search(pattern, source_text, flags=re.IGNORECASE):
            fail(errors, f"possible secret matched pattern: {pattern}")

    changed = [line.strip() for line in sys.stdin if line.strip()] if not sys.stdin.isatty() else []
    for path in changed:
        normalized = path.replace("\\", "/").lstrip("./")
        if any(normalized.startswith(prefix) for prefix in PROTECTED_PREFIXES):
            fail(errors, f"protected path in changed-file input: {normalized}")

    if errors:
        print("FAIL")
        for error in sorted(set(errors)):
            print(f" - {error}")
        return 1

    print(
        "PASS",
        f"{len(REQUIRED_FILES)} files;",
        f"{parsed_json_records} JSON records;",
        f"{checked_references} local references;",
        "Civilization Production Alpha + Planet/Land/Building/Room/Life/Ecosystem/Agriculture/SupplyChain/Factory/AICompany/K11520 runtimes + 8 proposals; protected-path input clean",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
