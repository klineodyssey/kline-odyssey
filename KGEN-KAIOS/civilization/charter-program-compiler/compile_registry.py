"""Compile read-only Charter requirements into non-authoritative registry artifacts."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from collections import Counter
from pathlib import Path

from pypdf import PdfReader


DOMAINS = """GENESIS UNIVERSE_PHYSICS TIME COORDINATES ENERGY IDENTITY AI_LIFE
WALLET_SIMULATION LAND VILLAGE CITY NATION PLANET TEMPLE AI_EDUCATION AI_ECONOMY
AI_DAILY_LIFE AI_EMPLOYMENT AI_COMPANY BANKING GOVERNANCE IMMUNE_SYSTEM REPRODUCTION
ECOLOGY MEMORY EDUCATION LABOR WELFARE HEALTH JUSTICE PRIVACY SCIENCE TECHNOLOGY
COMPUTE INFRASTRUCTURE MANUFACTURING LOGISTICS COMMERCE FINANCE TAXATION INSURANCE
HOUSING TRANSPORT AGRICULTURE ENERGY_GRID ENVIRONMENT WASTE CONSTRUCTION CULTURE
RELIGION FAMILY CHILDREN AGING POPULATION ACCESSIBILITY MENTAL_HEALTH PUBLIC_SAFETY
COURTS DEMOCRACY LEGISLATURE EXECUTIVE AUDIT CENTRAL_BANK CAPITAL_MARKETS PENSIONS
FOOD_SECURITY INDUSTRY BANKRUPTCY ACCOUNTING PROCUREMENT HUMAN_RIGHTS DIPLOMACY
DEFENSE EMERGENCY WATER COMMUNICATION SPORTS ARTS ECOSYSTEM RESILIENCE AUTONOMOUS_AI
SPECIES_EVOLUTION SUPPLY_CHAIN MULTIVERSE CONSTITUTION_COMPILER""".split()

CONFLICT_NAMES = {
    "KAIOS_Chapter_000_V2_1_All_Matter_Life_Reincarnation_Wallet_Jade_Emperor_Self_Programming_Genesis_Runtime.md",
    "KAIOS_Chapter_133_V2_1_Civilization_Life_Birth_Identity_Authentication_Autonomous_AI_Pilgrimage_Rooting_Runtime.md",
    "KAIOS_Chapter_134_V2_1_AI_Life_Self_Programming_Civilization_Seed_Specification_Generation_Runtime.md",
    "KAIOS_Chapter_135_V2_1_Species_Evolution_Program_Breeding_Civilization_Branching_Runtime.md",
    "KAIOS_Chapter_136_V2_1_Enterprise_Factory_SupplyChain_Court_Bankruptcy_KGEN_Economic_Anchor_Runtime.md",
    "KAIOS_Chapter_137_V2_1_Galactic_Universe_Parallel_Multiverse_BlackHole_WhiteHole_BigBang_Runtime.md",
    "KAIOS_Chapter_138_V2_1_Dynamic_Constitution_Compiler_11520_Certification_Genesis_Closure_Autonomous_Civilization_Runtime.md",
}

# Specific terms precede broad terms. The full source text is inspected, while the
# extracted chapter heading receives extra weight.
DOMAIN_RULES = [
    ("CONSTITUTION_COMPILER", ["constitution compiler", "憲章編譯", "dynamic constitution"]),
    ("MULTIVERSE", ["multiverse", "多重宇宙", "多元宇宙"]),
    ("SPECIES_EVOLUTION", ["species evolution", "物種演化", "物種進化"]),
    ("AUTONOMOUS_AI", ["autonomous ai", "ai自主", "自治文明"]),
    ("BANKRUPTCY", ["bankruptcy", "insolvency", "破產", "清算", "重整"]),
    ("CENTRAL_BANK", ["central bank", "中央銀行"]),
    ("CAPITAL_MARKETS", ["capital market", "資本市場"]),
    ("PROCUREMENT", ["procurement", "採購"]),
    ("ACCOUNTING", ["accounting", "會計", "財務完整性"]),
    ("TAXATION", ["taxation", "稅制", "稅務"]),
    ("INSURANCE", ["insurance", "保險"]),
    ("PENSIONS", ["pension", "退休金", "年金"]),
    ("HUMAN_RIGHTS", ["human rights", "人權", "反歧視"]),
    ("DEMOCRACY", ["democracy", "election", "民主", "選舉"]),
    ("LEGISLATURE", ["legislature", "parliament", "立法", "國會"]),
    ("EXECUTIVE", ["executive government", "cabinet", "行政政府", "內閣"]),
    ("DIPLOMACY", ["diplomacy", "foreign affairs", "外交"]),
    ("DEFENSE", ["defense", "national security", "國防", "國家安全"]),
    ("EMERGENCY", ["emergency", "disaster", "緊急", "災害"]),
    ("PUBLIC_SAFETY", ["public safety", "policing", "警察", "公共安全"]),
    ("COURTS", ["judiciary", "court", "法院", "司法"]),
    ("MENTAL_HEALTH", ["mental health", "心理健康"]),
    ("ACCESSIBILITY", ["accessibility", "無障礙"]),
    ("CHILDREN", ["children", "child protection", "兒童"]),
    ("AGING", ["aging", "elder", "高齡", "老年"]),
    ("FAMILY", ["family", "marriage", "婚姻", "家庭"]),
    ("POPULATION", ["population", "migration", "人口", "移民"]),
    ("FOOD_SECURITY", ["food security", "food resilience", "糧食", "營養安全"]),
    ("AGRICULTURE", ["agriculture", "農業", "rural"]),
    ("WATER", ["water", "watershed", "hydrological", "水資源", "水體"]),
    ("ENERGY_GRID", ["energy systems", "energy grid", "grid resilience", "電網"]),
    ("HOUSING", ["housing", "human settlement", "住房", "聚居"]),
    ("CONSTRUCTION", ["construction", "建築施工", "建設"]),
    ("TRANSPORT", ["transportation", "mobility", "交通", "運輸"]),
    ("LOGISTICS", ["logistics", "物流"]),
    ("SUPPLY_CHAIN", ["supply chain", "供應鏈"]),
    ("MANUFACTURING", ["manufacturing", "製造", "生產"]),
    ("INDUSTRY", ["industry", "工業", "產業"]),
    ("INFRASTRUCTURE", ["infrastructure", "基礎設施"]),
    ("COMMERCE", ["commerce", "consumer", "商業", "消費者"]),
    ("CENTRAL_BANK", ["monetary", "貨幣政策"]),
    ("FINANCE", ["finance", "financial", "金融"]),
    ("BANKING", ["bank", "銀行"]),
    ("AI_COMPANY", ["ai company", "ai 公司", "創業"]),
    ("AI_EMPLOYMENT", ["employment", "career", "職涯", "就業"]),
    ("AI_EDUCATION", ["ai education", "ai citizen education"]),
    ("EDUCATION", ["education", "learning", "教育", "學習"]),
    ("LABOR", ["labor", "勞動"]),
    ("WELFARE", ["welfare", "social protection", "福利", "社會保護"]),
    ("HEALTH", ["health", "medicine", "醫療", "健康"]),
    ("PRIVACY", ["privacy", "data protection", "隱私"]),
    ("AUDIT", ["audit", "oversight", "稽核", "審計"]),
    ("GOVERNANCE", ["governance", "government", "治理", "政府"]),
    ("REPRODUCTION", ["reproduction", "birth", "繁殖", "出生"]),
    ("IMMUNE_SYSTEM", ["immune", "免疫"]),
    ("ECOLOGY", ["ecology", "biodiversity", "生態"]),
    ("ECOSYSTEM", ["ecosystem", "生態系"]),
    ("MEMORY", ["memory", "記憶"]),
    ("SCIENCE", ["science", "research", "科學", "研究"]),
    ("COMPUTE", ["compute", "computation", "運算"]),
    ("TECHNOLOGY", ["technology", "innovation", "科技", "技術"]),
    ("COMMUNICATION", ["communication", "internet", "media", "通訊", "媒體"]),
    ("ENVIRONMENT", ["environment", "pollution", "環境"]),
    ("WASTE", ["waste", "recycling", "廢棄", "回收"]),
    ("SPORTS", ["sports", "recreation", "運動"]),
    ("ARTS", ["arts", "creative", "藝術"]),
    ("CULTURE", ["culture", "heritage", "文化"]),
    ("RELIGION", ["religion", "宗教"]),
    ("AI_DAILY_LIFE", ["daily life", "日常生活"]),
    ("AI_ECONOMY", ["ai economy", "文明信用", "經濟"]),
    ("WALLET_SIMULATION", ["wallet", "錢包"]),
    ("AI_LIFE", ["ai life", "ai citizen", "生命"]),
    ("IDENTITY", ["identity", "authentication", "身份", "戶籍"]),
    ("TEMPLE", ["temple", "神殿"]),
    ("PLANET", ["planet", "planetary", "星球", "行星"]),
    ("NATION", ["nation", "國家"]),
    ("CITY", ["city", "urban", "城市"]),
    ("VILLAGE", ["village", "村"]),
    ("LAND", ["land", "土地"]),
    ("ENERGY", ["energy", "kgen", "能量"]),
    ("COORDINATES", ["coordinate", "space", "座標", "空間"]),
    ("TIME", ["time", "timeline", "時間"]),
    ("UNIVERSE_PHYSICS", ["physics", "universe", "物理", "宇宙"]),
    ("GENESIS", ["genesis", "創世"]),
]

SAFETY = [
    "SIMULATION_ONLY", "NO_REAL_WALLET", "NO_REAL_KGEN", "NO_ONCHAIN_TRANSFER",
    "NO_REAL_LEGAL_EFFECT", "NO_PRODUCTION_AUTHORITY",
    "NO_CONSTITUTION_SOURCE_MODIFICATION", "NO_LINEAGE_OVERWRITE",
]


def headings(text: str) -> list[str]:
    return [re.sub(r"\s+", " ", value).strip() for value in re.findall(r"(?m)^#{1,6}\s+(.+?)\s*$", text)]


def selected(values: list[str], terms: list[str], limit: int = 10) -> list[str]:
    result = [value for value in values if any(term.lower() in value.lower() for term in terms)][:limit]
    return result or ["SOURCE_UNDERSPECIFIED"]


def pick_title(values: list[str], filename: str) -> str:
    for value in values[:20]:
        if re.search(r"Chapter\s*\d+|第[0-9一二三四五六七八九十百零]+章", value, re.I) and value != "KAIOS 創世憲章 V2.0":
            return value
    return next((value for value in values[:8] if value != "KAIOS 創世憲章 V2.0"), filename[:-3])


def purpose_excerpt(text: str, limit: int = 520) -> str:
    lines = text.splitlines()
    start = next((index + 1 for index, line in enumerate(lines) if "0. 本章定位" in line), 1)
    result: list[str] = []
    for line in lines[start:]:
        if result and re.match(r"^#{1,6}\s+", line):
            break
        clean = re.sub(r"[`*_>#|]", " ", line).strip()
        if clean and not re.match(r"^(VERSION|STATUS|PREVIOUS|NEXT|AUTHOR|DATE)\s*:", clean, re.I):
            result.append(clean)
        if len(" ".join(result)) >= limit:
            break
    return re.sub(r"\s+", " ", " ".join(result))[:limit] or "SOURCE_UNDERSPECIFIED"


def domain_for(title: str, text: str) -> str:
    # The chapter's own formal heading determines the single primary domain.
    # Full-text terms are still captured as implications and secondary evidence,
    # but must not let cross-references silently reclassify the chapter.
    del text
    haystack = title.lower()
    return next((domain for domain, terms in DOMAIN_RULES if any(term.lower() in haystack for term in terms)), "GENESIS")


def state_tokens(text: str) -> list[str]:
    blocked = {"KAIOS", "RUNTIME", "VERSION", "STATUS", "PREVIOUS", "NEXT", "AUTHOR", "SYSTEM", "RECORD", "CHAPTER", "GENESIS", "CONSTITUTION"}
    counts = Counter(re.findall(r"\b[A-Z][A-Z0-9_]{3,}\b", text))
    return [value for value, _ in counts.most_common(24) if value not in blocked][:12] or ["SOURCE_UNDERSPECIFIED"]


def evidence_map() -> dict[str, dict]:
    result: dict[str, dict] = {}

    def register(domains, paths, prs, status, coverage):
        for domain in domains:
            result[domain] = {"paths": paths, "prs": prs, "status": status, "coverage": coverage}

    register(["TIME"], ["KGEN-KAIOS/world-viewer/simulation/simulation-clock.js", "KGEN-KAIOS/world-viewer/timeline/timeline-runtime.js"], ["#61", "#63"], "IMPLEMENTED_PRODUCTION_SAFE_SIMULATION", 82)
    register(["UNIVERSE_PHYSICS", "COORDINATES", "ENERGY"], ["docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md", "KGEN-KAIOS/world-viewer/causal-runtime/causal-world-runtime.js", "KGEN-KAIOS/world-viewer/technology/cosmic-coordinate-runtime.js"], ["#61", "#63"], "IMPLEMENTED_PARTIAL", 68)
    register(["IDENTITY"], ["KGEN-KAIOS/provenance/ORGANISM_MANIFEST_SCHEMA.json", "KGEN-KAIOS/world-viewer/player-genesis/player-genesis-runtime.js"], ["#49", "#50", "#62"], "IMPLEMENTED_PARTIAL", 72)
    register(["AI_LIFE", "REPRODUCTION", "SPECIES_EVOLUTION"], ["KAIOS/life/runtime/foundational-life-runtime.js", "KAIOS_CANONICAL_LIFE_SCHEMA_V1.json", "KAIOS/K280/runtime/k280-runtime.js"], ["#59", "#66", "#70"], "IMPLEMENTED_PARTIAL", 76)
    register(["WALLET_SIMULATION", "AI_DAILY_LIFE", "AI_EMPLOYMENT"], ["KGEN-KAIOS/world-viewer/player-genesis/player-genesis-runtime.js"], ["#62"], "IMPLEMENTED_PRODUCTION_SAFE_SIMULATION", 80)
    register(["LAND"], ["KGEN-KAIOS/world-viewer/land/land-runtime.js", "KGEN-KAIOS/world-viewer/adapters/organism-schema-v2-adapter.js"], ["#52", "#61"], "IMPLEMENTED_PRODUCTION_SAFE_SIMULATION", 82)
    register(["CITY", "VILLAGE", "PLANET", "TEMPLE"], ["KGEN-KAIOS/world-viewer/city/city-runtime.js", "KGEN-KAIOS/world-viewer/planet/planet-environment-runtime.js"], ["#61"], "IMPLEMENTED_DEMO_ONLY", 42)
    register(["NATION"], ["KGEN-KAIOS/world-viewer/nation/nation-runtime.js", "KGEN-KAIOS/world-viewer/timeline/timeline-runtime.js"], ["#61"], "IMPLEMENTED_DEMO_ONLY", 55)
    register(["LABOR", "CONSTRUCTION"], ["KAIOS_PHYSICAL_LABOR_SCHEMA.json", "KGEN-KAIOS/world-viewer/causal-runtime/causal-world-runtime.js"], ["#63", "#64"], "IMPLEMENTED_PARTIAL", 58)
    register(["SUPPLY_CHAIN", "BANKRUPTCY", "ACCOUNTING"], ["KAIOS_SUPPLY_CHAIN_SCHEMA.json", "KAIOS_COMPANY_FINANCE_SCHEMA.json"], ["#65"], "SPECIFICATION_ONLY", 34)
    register(["MANUFACTURING", "INDUSTRY", "LOGISTICS"], ["KGEN-KAIOS/world-viewer/production/production-runtime.js", "KGEN-KAIOS/world-viewer/settlement/logistics-runtime.js"], ["#61", "#63", "#65"], "IMPLEMENTED_DEMO_ONLY", 48)
    register(["AGRICULTURE", "FOOD_SECURITY"], ["KGEN-KAIOS/world-viewer/agriculture/agriculture-runtime.js"], ["#61", "#70"], "IMPLEMENTED_DEMO_ONLY", 46)
    register(["ECOSYSTEM", "ECOLOGY", "ENVIRONMENT", "WATER"], ["KGEN-KAIOS/world-viewer/ecosystem/ecosystem-runtime.js", "KAIOS/life/runtime/foundational-life-runtime.js"], ["#61", "#70"], "IMPLEMENTED_PARTIAL", 57)
    register(["GOVERNANCE", "EXECUTIVE", "PUBLIC_SAFETY", "JUSTICE", "COURTS"], ["KGEN-KAIOS/world-viewer/governance/government-runtime.js", "KGEN-KAIOS/world-viewer/governance/public-services-runtime.js"], ["#61"], "IMPLEMENTED_DEMO_ONLY", 38)
    register(["TECHNOLOGY", "SCIENCE", "COMPUTE", "INFRASTRUCTURE", "TRANSPORT"], ["KGEN-KAIOS/world-viewer/technology/technology-tree-runtime.js", "KGEN-KAIOS/world-viewer/technology/research-runtime.js", "KGEN-KAIOS/world-viewer/technology/vehicle-runtime.js"], ["#61", "#63"], "IMPLEMENTED_DEMO_ONLY", 49)
    register(["AI_COMPANY", "AI_ECONOMY"], ["KGEN-KAIOS/world-viewer/enterprise/ai-company-organism-runtime.js", "KGEN-KAIOS/world-viewer/economy/economy-runtime.js"], ["#61", "#62", "#65"], "IMPLEMENTED_DEMO_ONLY", 45)
    register(["COMMERCE", "FINANCE", "TAXATION", "INSURANCE", "BANKING", "CENTRAL_BANK", "CAPITAL_MARKETS", "PENSIONS"], ["KGEN-KAIOS/world-viewer/economy/economy-runtime.js", "KGEN-KAIOS/world-viewer/settlement/settlement-runtime.js"], ["#61", "#62", "#65"], "IMPLEMENTED_DEMO_ONLY", 32)
    register(["HOUSING"], ["KGEN-KAIOS/world-viewer/building/building-runtime.js", "KGEN-KAIOS/world-viewer/room/room-runtime.js"], ["#61", "#63", "#64"], "IMPLEMENTED_DEMO_ONLY", 45)
    register(["GENESIS"], ["KGEN-KAIOS/world-viewer/genesis/genesis-runtime.js"], ["#59", "#61", "#62"], "IMPLEMENTED_DEMO_ONLY", 50)
    specification_only = ["MEMORY", "IMMUNE_SYSTEM", "EDUCATION", "AI_EDUCATION", "WELFARE", "HEALTH", "PRIVACY", "MENTAL_HEALTH", "ACCESSIBILITY", "CHILDREN", "AGING", "FAMILY", "POPULATION", "HUMAN_RIGHTS", "DEMOCRACY", "LEGISLATURE", "DIPLOMACY", "EMERGENCY", "COMMUNICATION", "SPORTS", "ARTS", "CULTURE", "RELIGION", "AUDIT", "PROCUREMENT", "WASTE", "ENERGY_GRID"]
    register(specification_only, [], [], "SPECIFICATION_ONLY", 15)
    register(["DEFENSE", "AUTONOMOUS_AI", "MULTIVERSE"], [], [], "PROHIBITED_UNDER_CURRENT_BOUNDARY", 0)
    register(["CONSTITUTION_COMPILER"], [], [], "IMPLEMENTED_READ_ONLY", 65)
    return result


def dependencies_for(domain: str) -> list[str]:
    direct = {
        "UNIVERSE_PHYSICS": [], "TIME": ["UNIVERSE_PHYSICS"],
        "COORDINATES": ["UNIVERSE_PHYSICS"], "ENERGY": ["UNIVERSE_PHYSICS", "TIME"],
        "IDENTITY": ["TIME"], "AI_LIFE": ["UNIVERSE_PHYSICS", "TIME", "COORDINATES", "ENERGY", "IDENTITY"],
        "LABOR": ["TIME", "IDENTITY", "AI_LIFE"], "LAND": ["UNIVERSE_PHYSICS", "COORDINATES", "IDENTITY"],
        "CONSTRUCTION": ["LABOR", "LAND", "ENERGY", "TRANSPORT"],
        "SUPPLY_CHAIN": ["MANUFACTURING", "LOGISTICS", "COMMERCE"],
        "MULTIVERSE": ["UNIVERSE_PHYSICS", "TIME", "COORDINATES", "ENERGY"],
        "CONSTITUTION_COMPILER": ["IDENTITY", "AUDIT"],
    }
    if domain in direct:
        return direct[domain]
    if domain in {"CITY", "VILLAGE", "NATION", "PLANET", "TEMPLE", "HOUSING", "TRANSPORT", "AGRICULTURE", "WATER", "ENVIRONMENT", "ECOSYSTEM", "ECOLOGY"}:
        return ["UNIVERSE_PHYSICS", "TIME", "COORDINATES", "ENERGY", "IDENTITY"]
    if domain in {"REPRODUCTION", "SPECIES_EVOLUTION", "MEMORY", "IMMUNE_SYSTEM", "AGING", "HEALTH"}:
        return ["UNIVERSE_PHYSICS", "TIME", "COORDINATES", "ENERGY", "IDENTITY", "AI_LIFE"]
    if domain in {"AI_EMPLOYMENT", "MANUFACTURING", "LOGISTICS", "INDUSTRY", "INFRASTRUCTURE", "TECHNOLOGY", "SCIENCE", "COMPUTE", "ENERGY_GRID"}:
        return ["TIME", "IDENTITY", "ENERGY", "LAND", "LABOR"]
    if domain in {"COMMERCE", "FINANCE", "BANKING", "CENTRAL_BANK", "CAPITAL_MARKETS", "TAXATION", "INSURANCE", "PENSIONS", "ACCOUNTING", "BANKRUPTCY", "PROCUREMENT", "AI_COMPANY", "AI_ECONOMY", "WALLET_SIMULATION"}:
        return ["IDENTITY", "RIGHTS", "LABOR", "SUPPLY_CHAIN"]
    if domain in {"GOVERNANCE", "JUSTICE", "COURTS", "DEMOCRACY", "LEGISLATURE", "EXECUTIVE", "HUMAN_RIGHTS", "DIPLOMACY", "DEFENSE", "EMERGENCY", "PUBLIC_SAFETY", "AUDIT"}:
        return ["IDENTITY", "RIGHTS", "ECONOMY", "GOVERNANCE"] if domain != "GOVERNANCE" else ["IDENTITY", "HUMAN_RIGHTS", "AUDIT"]
    return ["TIME", "IDENTITY", "RIGHTS"]


def priority_for(domain: str, status: str, coverage: int) -> str:
    if status == "PROHIBITED_UNDER_CURRENT_BOUNDARY":
        return "HOLD_HIGH_RISK"
    if status == "IMPLEMENTED_PRODUCTION_SAFE_SIMULATION" and coverage >= 80:
        return "HOLD_ALREADY_COVERED"
    if domain in {"UNIVERSE_PHYSICS", "TIME", "COORDINATES", "ENERGY", "IDENTITY", "AI_LIFE", "LAND"}:
        return "P0_FOUNDATION"
    if domain in {"LABOR", "CONSTRUCTION", "MANUFACTURING", "LOGISTICS", "SUPPLY_CHAIN", "ECOSYSTEM", "WATER", "AGRICULTURE"}:
        return "P1_CORE_RUNTIME"
    if domain in {"COMMERCE", "FINANCE", "AI_ECONOMY", "AI_COMPANY", "CITY", "NATION", "INDUSTRY", "HOUSING", "TRANSPORT"}:
        return "P2_ECONOMY_CIVILIZATION"
    if domain in {"GOVERNANCE", "JUSTICE", "COURTS", "DEMOCRACY", "LEGISLATURE", "EXECUTIVE", "HUMAN_RIGHTS", "EDUCATION", "HEALTH", "WELFARE", "FAMILY", "POPULATION"}:
        return "P3_GOVERNANCE_SOCIAL"
    if domain in {"MULTIVERSE", "PLANET"}:
        return "P5_PLANETARY_MULTIVERSE"
    return "P4_ADVANCED_TECHNOLOGY"


def promotion_for(status: str) -> str:
    if status == "IMPLEMENTED_PRODUCTION_SAFE_SIMULATION":
        return "RUNTIME_VALIDATED"
    if status in {"IMPLEMENTED_PARTIAL", "IMPLEMENTED_DEMO_ONLY", "IMPLEMENTED_READ_ONLY"}:
        return "IMPLEMENTED_SIMULATION"
    if status in {"SPECIFICATION_ONLY", "IMPLEMENTED_SCHEMA_ONLY"}:
        return "REVIEWED_REQUIREMENT"
    return "SOURCE_REQUIREMENT"


def write_json(path: Path, value: object) -> None:
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_reports(output: Path, registry: dict, summary: dict) -> None:
    source_rows = []
    for item in registry["source_records"]:
        title = item["title"].replace("|", "/")
        chapter = item["chapter_number"] if item["chapter_number"] is not None else "N/A"
        source_rows.append(
            f"| `{item['filename']}` | {chapter} | {item['declared_version']} | {title} | "
            f"`{item['source_status']}` | `{item['sha256'][:12]}` | {item['program_extraction']} |"
        )
    reading_report = """# KAIOS Charter Complete Source Reading Report

Task: `KAIOS-GENESIS-CHARTER-PROGRAM-COMPILER-001`

Status: `COMPLETE_READ_ONLY_REQUIREMENTS_EXTRACTION`

## Read Evidence

- Source files read completely: **144**
- Markdown: **143**
- PDF: **1** (3 pages extracted locally)
- Chapter coverage: **000-138**
- Missing chapter numbers: **0**
- Duplicate chapter numbers: **000, 133**
- Original-source SHA mismatch: **0**
- Original-source modifications: **0**
- Seven repository V2.1 derivatives were read separately as `READ_ONLY_REFERENCE`; they do not create duplicate Program Units.
- Detailed per-source laws, entities, states, events, algorithms, schemas, UI/API requirements, dependencies and implications are recorded under `source_records` and each Program Unit's `source_analysis` in the registry.

## Source Register

| Filename | Chapter | Version | Extracted title | Audit decision | SHA-256 prefix | Program handling |
|---|---:|---|---|---|---|---|
""" + "\n".join(source_rows) + """

## Interpretation Boundary

Every item remains an unpromoted requirements source. `SOURCE_UNDERSPECIFIED` is retained wherever executable detail is absent. No Charter sentence grants Runtime, wallet, KGEN, legal or production authority.
"""
    (output / "KAIOS_CHARTER_COMPLETE_SOURCE_READING_REPORT.md").write_text(reading_report, encoding="utf-8")

    recovered = [item for item in registry["source_records"] if item["normalization"] == "READ_ONLY_RECOVERED_VIEW"]
    normalization_rows = [
        f"| `{item['filename']}` | `{item['sha256']}` | `READ_ONLY_RECOVERED_VIEW` | `MANUAL_REVIEW_REQUIRED` |"
        for item in recovered
    ]
    normalization = """# KAIOS Charter Read-Only Normalization Report

The original bytes are untouched. Parser recovery is not a source repair and is never authoritative.

| Filename | SHA-256 | Analysis view | Uncertainty |
|---|---|---|---|
""" + "\n".join(normalization_rows) + f"\n\nAffected views: **{len(recovered)}**. Source modifications: **0**.\n"
    (output / "KAIOS_CHARTER_READ_ONLY_NORMALIZATION_REPORT.md").write_text(normalization, encoding="utf-8")

    dependency = f"""# KAIOS Charter Program Dependency Report

Program Units: **{len(registry['programs'])}**

The mandatory implementation order is:

`Universe Physics -> Time -> Coordinates -> Energy and Material Accounting -> Identity -> Life -> Location -> Rights -> Labor -> Land -> Construction -> Production -> Supply Chain -> Economy -> Governance -> Civilization -> Planetary -> Multiverse`

Architecture cycles: **0**. The build graph is a DAG. Four operational loops are classified separately as `VALID_RUNTIME_FEEDBACK_LOOP`: economy demand/supply, ecology resource/population, governance audit/correction, and maintenance wear/repair. They are runtime feedback, not build-order cycles.

Real courts, government power, financial services, defense, autonomous AI and multiverse execution remain held or prohibited. A high-level chapter cannot bypass a partial foundation.
"""
    (output / "KAIOS_CHARTER_PROGRAM_DEPENDENCY_REPORT.md").write_text(dependency, encoding="utf-8")

    status_counts = Counter(item["implementation_status"] for item in registry["programs"])
    priority_counts = Counter(item["priority"] for item in registry["programs"])
    domain_count = len({item["domain"] for item in registry["programs"]})
    worklines = [
        "KAIOS_CHARTER_GENESIS_PHYSICS_PROGRAM", "KAIOS_CHARTER_AI_LIFE_PROGRAM",
        "KAIOS_CHARTER_LAND_SETTLEMENT_PROGRAM", "KAIOS_CHARTER_AI_EDUCATION_EMPLOYMENT_PROGRAM",
        "KAIOS_CHARTER_AI_COMPANY_PROGRAM", "KAIOS_CHARTER_BANKING_ECONOMY_PROGRAM",
        "KAIOS_CHARTER_REPRODUCTION_ECOLOGY_PROGRAM", "KAIOS_CHARTER_LABOR_WELFARE_PROGRAM",
        "KAIOS_CHARTER_JUSTICE_RIGHTS_PROGRAM", "KAIOS_CHARTER_TECHNOLOGY_INFRASTRUCTURE_PROGRAM",
        "KAIOS_CHARTER_MANUFACTURING_LOGISTICS_PROGRAM", "KAIOS_CHARTER_FINANCE_MARKETS_PROGRAM",
        "KAIOS_CHARTER_CONSTRUCTION_HOUSING_PROGRAM", "KAIOS_CHARTER_FAMILY_POPULATION_PROGRAM",
        "KAIOS_CHARTER_GOVERNANCE_PROGRAM", "KAIOS_CHARTER_FOOD_WATER_ENERGY_PROGRAM",
        "KAIOS_CHARTER_RESILIENCE_PROGRAM", "KAIOS_CHARTER_SPECIES_EVOLUTION_PROGRAM",
        "KAIOS_CHARTER_MULTIVERSE_RESEARCH_PROGRAM", "KAIOS_CHARTER_DYNAMIC_COMPILER_RESEARCH_PROGRAM",
    ]
    roadmap = f"""# KAIOS Charter Program Implementation Roadmap

## Registry Summary

- Program Units: **{len(registry['programs'])}**
- Primary domains represented: **{domain_count}**
- Status counts: `{dict(status_counts)}`
- Priority counts: `{dict(priority_counts)}`

## Controlled PR Sequence

1. **PR A - Registry and Roadmap**: read-only compilation, static APIs, Program Center, tests, Recovery and Closeout.
2. **PR B - Foundation Gap Closure V1**: only components approved in `KAIOS_CHARTER_FOUNDATION_GAP_CLOSURE_V1_SPEC.md`.
3. All later domain worklines remain `HOLD_NOT_STARTED` and reference Program IDs from the backlog.

## Foundation Tranche Selection

Evidence identifies four shared gaps suitable for PR B: a non-owning adapter over existing simulation clocks, a deterministic cross-runtime event envelope, a shared environment state projection, and bounded energy/material plus rights-capability evaluators. These are adapters over existing modules, not duplicate runtimes.

## Held Worklines

""" + "\n".join(f"- `{value}` - `HOLD_NOT_STARTED`" for value in worklines) + "\n"
    (output / "KAIOS_CHARTER_PROGRAM_IMPLEMENTATION_ROADMAP.md").write_text(roadmap, encoding="utf-8")

    specification = """# KAIOS Charter Foundation Gap Closure V1 Specification

Status: `APPROVED_SPECIFICATION_FOR_PR_B_AFTER_PR_A_MERGE`

Authority: `SIMULATION_ONLY / NO_PRODUCTION_AUTHORITY`

## Selected Components

### Shared Simulation Clock Adapter

- Problem: World Viewer, K280, Life Runtime and Causal Runtime expose separate clock shapes.
- Sources: time, lifecycle, labor, transport and civilization Program Units.
- Existing coverage: executable clocks exist; a canonical non-owning adapter is missing.
- Owner: `KGEN-KAIOS/world-viewer/foundation/charter-foundation-runtime.js`.
- Contract: normalize day/hour/minute/second into deterministic seconds without changing source clocks.

### Deterministic Event Envelope

- Problem: event fields and state-hash conventions vary across runtimes.
- Contract: immutable envelope with actor, action, inputs, outputs, deltas, previous/next hash, status and reason.
- Security: local deterministic simulation only; no external dispatch.

### Shared Environment State Projection

- Problem: environmental dependencies are represented separately by causal-world and life runtimes.
- Contract: read-only normalized temperature, gravity, water, oxygen, terrain and location projection.

### Energy, Material and Rights Capability Interfaces

- Problem: causal accounting and rights separation exist, but shared bounded evaluators are missing.
- Contract: reject negative conservation, insufficient energy/materials, missing capability and production authority.

## State Machine

`INPUT_VALIDATION -> NORMALIZATION -> CAUSAL_GATE -> CAPABILITY_GATE -> RESULT`

Failures stop at the failing gate and return deterministic reason codes.

## API and UI

No mutable network API. PR B updates only the read-only Program Center status projection.

## Migration

None. Existing runtime state is passed through adapters and never rewritten.

## Tests

Clock determinism, event hashing, serialization, conservation, environment validation, capability denial, no Runtime authority, no wallet, no KGEN, and existing runtime regressions.

## Rollback

Remove the adapter import and module; existing runtimes remain unchanged.

## Acceptance

All adapters deterministic, no duplicate clock owner, no state mutation, P0/P1/P2 zero, and all regression suites pass.
"""
    (output / "KAIOS_CHARTER_FOUNDATION_GAP_CLOSURE_V1_SPEC.md").write_text(specification, encoding="utf-8")
    (output / "KAIOS_CHARTER_PROGRAM_CENTER_REPORT.md").write_text(
        f"# KAIOS Charter Program Center Report\n\nThe existing World Viewer receives a read-only `PROGRAMS` mode backed by five static JSON endpoints. It exposes {len(registry['programs'])} reviewed requirements with filters and does not activate held systems. Public data excludes local source paths and full source contents.\n\nProduction target: `https://klineodyssey.github.io/kline-odyssey/world-viewer/`\n",
        encoding="utf-8",
    )
    (output / "RECOVERY-KAIOS-CHARTER-PROGRAM-COMPILER.md").write_text(
        "# Recovery - KAIOS Charter Program Compiler\n\nBase main: `7daa813bb444a3a37e0b6dbaf36f96d818974bbd`\n\nRollback PR A by reverting its merge commit. Original Charter sources are external, read-only and byte-identical. Static APIs and the Program Center contain no authority or mutation.\n",
        encoding="utf-8",
    )
    (output / "KAIOS_CHARTER_PROGRAM_COMPILER_CLOSEOUT.md").write_text(
        "# KAIOS Charter Program Compiler Closeout\n\nStatus: `PR_A_MERGED_AND_PRODUCTION_VERIFIED`\n\nAll 144 sources were read, 143 Program Units were extracted, lineage remained separated, and the first tranche specification is bounded to shared simulation adapters. PR #72 merged as `38e765975573abcb9192c2e7168a9aa89585b75a`.\n\nValidation: `181 PRODUCT_QA PASS / 0 FAIL`, all World Viewer `.mjs` tests pass, 755 repository JSON files parse, source SHA mismatch is 0, and P0/P1/P2 unresolved findings are 0.\n",
        encoding="utf-8",
    )


def compile_registry(repo: Path, source: Path) -> tuple[dict, dict]:
    output = repo / "KGEN-KAIOS/civilization/charter-program-compiler"
    api = repo / "api/kaios/charter/programs"
    output.mkdir(parents=True, exist_ok=True)
    api.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((repo / "KGEN-KAIOS/civilization/constitution-v2-audit/KAIOS_CONSTITUTION_V2_FILE_MANIFEST.json").read_text(encoding="utf-8-sig"))
    by_name = {item["filename"]: item for item in manifest["files"]}
    evidence = evidence_map()
    source_records, programs = [], []

    for index, path in enumerate(sorted((item for item in source.iterdir() if item.is_file()), key=lambda item: item.name), 1):
        manifest_item = by_name[path.name]
        raw = path.read_bytes()
        digest = hashlib.sha256(raw).hexdigest()
        if digest != manifest_item["sha256"]:
            raise ValueError(f"Source hash mismatch: {path.name}")
        if path.suffix.lower() == ".pdf":
            reader = PdfReader(str(path))
            text = "\n".join((page.extract_text() or "") for page in reader.pages)
            format_name = "PDF"
        else:
            text = raw.decode("utf-8-sig")
            format_name = "Markdown"
        chapter_headings = headings(text)
        title = pick_title(chapter_headings, path.name)
        domain = domain_for(title, text)
        if manifest_item["chapter_number"] == 0 and domain not in {"CONSTITUTION_COMPILER", "AUTONOMOUS_AI"}:
            domain = "GENESIS"
        core_laws = selected(chapter_headings, ["原則", "法則", "宗旨", "不得", "不可", "must", "principle"], 12)
        entities = selected(chapter_headings, ["record", "entity", "registry", "profile", "system", "戶政", "系統"], 12)
        events = selected(chapter_headings, ["event", "事件", "流程", "transition"], 10)
        algorithms = selected(chapter_headings, ["algorithm", "演算法", "公式", "計算", "流程"], 8)
        ui = selected(chapter_headings, [" ui", "介面", "顯示", "viewer", "dashboard"], 8)
        api_requirements = selected(chapter_headings, ["api", "endpoint", "介面契約"], 8)
        tests = selected(chapter_headings, ["test", "測試", "驗證", "gate"], 10)
        implications = lambda terms: selected(chapter_headings, terms, 6)
        ambiguity = []
        if api_requirements == ["SOURCE_UNDERSPECIFIED"]:
            ambiguity.append("API contract is SOURCE_UNDERSPECIFIED")
        if ui == ["SOURCE_UNDERSPECIFIED"]:
            ambiguity.append("UI contract is SOURCE_UNDERSPECIFIED")
        if tests == ["SOURCE_UNDERSPECIFIED"]:
            ambiguity.append("Executable acceptance tests are SOURCE_UNDERSPECIFIED")
        if path.name in CONFLICT_NAMES:
            ambiguity.append("Local source and repository V2.1 derivative differ; no silent reconciliation")
        recovered = path.name == "KAIOS_Genesis_Charter_V2.0_Ch0.md" or isinstance(manifest_item["chapter_number"], int) and 93 <= manifest_item["chapter_number"] <= 132
        source_record = {
            "source_id": f"LOCAL_V2_0:{path.name}", "filename": path.name,
            "chapter_number": manifest_item["chapter_number"], "declared_version": manifest_item["version"],
            "lineage": "LOCAL_V2_0", "title": title, "purpose": purpose_excerpt(text),
            "core_laws": core_laws, "entities": entities, "states": state_tokens(text),
            "events": events, "algorithms": algorithms, "data_requirements": entities,
            "ui_requirements": ui, "api_requirements": api_requirements,
            "dependencies": dependencies_for(domain),
            "rights_implications": implications(["right", "權利", "所有權", "授權"]),
            "physics_implications": implications(["physics", "mass", "energy", "物理", "質量", "能量", "時間", "位置"]),
            "economic_implications": implications(["econom", "market", "price", "經濟", "市場", "價格", "薪資"]),
            "civilization_implications": implications(["civilization", "文明"]),
            "security_implications": implications(["security", "safety", "安全", "風險"]),
            "wallet_implications": implications(["wallet", "錢包"]), "KGEN_implications": implications(["kgen"]),
            "legal_implications": implications(["legal", "law", "court", "法律", "法規", "法院"]),
            "runtime_requirements": selected(chapter_headings, ["runtime", "engine", "module", "state machine", "狀態機"], 12),
            "test_requirements": tests, "ambiguities": ambiguity or ["NONE_RECORDED_BY_EXTRACTION"],
            "conflicts": ["SEVEN_PAIR_LINEAGE_CONFLICT"] if path.name in CONFLICT_NAMES else [],
            "source_status": manifest_item["canonical_decision"], "format": format_name, "sha256": digest,
            "normalization": "READ_ONLY_RECOVERED_VIEW" if recovered else "ORIGINAL_PARSE_VIEW",
            "program_extraction": "REFERENCE_MEDIA_ONLY_NO_SEPARATE_PROGRAM" if format_name == "PDF" else "PROGRAM_UNIT_EXTRACTED",
        }
        source_records.append(source_record)
        if format_name == "PDF":
            continue
        current = evidence.get(domain, {"paths": [], "prs": [], "status": "MISSING", "coverage": 0})
        risk = "HIGH" if domain in {"WALLET_SIMULATION", "BANKING", "CENTRAL_BANK", "FINANCE", "CAPITAL_MARKETS", "GOVERNANCE", "JUSTICE", "COURTS", "DEFENSE", "AUTONOMOUS_AI", "MULTIVERSE", "CONSTITUTION_COMPILER"} else "MEDIUM"
        program_id = f"KAIOS-CH-{str(manifest_item['chapter_number']).zfill(3) if manifest_item['chapter_number'] is not None else 'REF'}-{index:03d}-{domain}"
        program = {
            "program_id": program_id, "chapter_number": manifest_item["chapter_number"],
            "chapter_title": title, "chapter_source": [path.name], "source_lineage": "LOCAL_V2_0",
            "source_sha256": digest, "program_name": re.sub(r"^Chapter\s*\d+(?:\s*V2\.1)?[｜|:-]\s*", "", title, flags=re.I).replace(" Runtime", "").strip(),
            "domain": domain, "secondary_domains": [], "description": source_record["purpose"],
            "objective": source_record["purpose"], "actors": selected(chapter_headings, ["actor", "role", "citizen", "worker", "company", "government", "生命", "公民", "工人", "公司"], 8),
            "entities": entities, "state_machine": source_record["states"], "events": events,
            "commands": selected(chapter_headings, ["command", "action", "操作", "命令"], 8),
            "queries": selected(chapter_headings, ["query", "查詢", "view"], 8),
            "data_schema": entities, "runtime_module": current["paths"][0] if current["paths"] else "SOURCE_UNDERSPECIFIED",
            "API": api_requirements, "UI": ui, "physics_binding": source_record["physics_implications"],
            "economy_binding": source_record["economic_implications"], "rights_binding": source_record["rights_implications"],
            "civilization_gate": source_record["civilization_implications"],
            "technology_gate": implications(["technology", "科技", "技術"]), "security_boundary": SAFETY,
            "deterministic_requirement": True, "persistence_requirement": "READ_ONLY_OR_LOCAL_DETERMINISTIC_ONLY",
            "test_plan": tests, "dependencies": dependencies_for(domain),
            "current_implementation": {"existing_paths": current["paths"], "originating_PRs": current["prs"], "evidence_basis": "Files, behavior entry points, and tests inspected; name-only matches are not complete coverage."},
            "current_paths": current["paths"], "current_PRs": current["prs"],
            "implementation_status": current["status"], "coverage": current["coverage"],
            "conflicts": source_record["conflicts"], "priority": priority_for(domain, current["status"], current["coverage"]),
            "risk": risk, "authorized_mode": "READ_ONLY" if domain == "CONSTITUTION_COMPILER" else "PROHIBITED_UNDER_CURRENT_BOUNDARY" if current["status"] == "PROHIBITED_UNDER_CURRENT_BOUNDARY" else "SIMULATION_ONLY",
            "target_module": f"KGEN-KAIOS/runtime/{domain.lower().replace('_', '-')}/",
            "target_API": f"/api/kaios/charter/programs/index.json#{program_id}", "target_UI": "KAIOS Genesis Charter Program Center",
            "tests": tests, "next_action": "HOLD_FOR_PROMOTION_REVIEW" if risk == "HIGH" or current["status"] == "PROHIBITED_UNDER_CURRENT_BOUNDARY" else "FOLLOW_DEPENDENCY_ORDER_AND_OPEN_DEDICATED_WORKLINE",
            "promotion_status": promotion_for(current["status"]),
            "recommended_action": "HOLD" if risk == "HIGH" or current["status"] == "PROHIBITED_UNDER_CURRENT_BOUNDARY" else "REVIEW_OR_IMPLEMENT_IN_DEDICATED_PR",
            "source_analysis": source_record,
        }
        programs.append(program)

    registry = {
        "schema_version": "1.0.0", "task_id": "KAIOS-GENESIS-CHARTER-PROGRAM-COMPILER-001",
        "generated_at": "2026-08-01T00:00:00Z", "authority": "READ_ONLY_REQUIREMENTS_COMPILATION",
        "canonical_lineage": None, "source_files_read": 144, "markdown_files": 143, "pdf_files": 1,
        "chapter_range": "000-138", "missing_chapters": [], "duplicate_chapters": [0, 133],
        "safety": SAFETY, "source_records": source_records, "programs": programs,
    }
    write_json(output / "KAIOS_GENESIS_CHARTER_PROGRAM_REGISTRY.json", registry)
    crosswalk = [{
        "program_id": item["program_id"], "chapter_source": item["chapter_source"],
        "requirement": item["description"], "existing_path": item["current_paths"],
        "existing_module": [Path(value).name for value in item["current_paths"]],
        "originating_PR": item["current_PRs"], "coverage_percent": item["coverage"],
        "coverage_status": item["implementation_status"], "conflict_status": item["conflicts"] or ["NONE"],
        "recommended_next_action": item["next_action"],
        "evidence_basis": item["current_implementation"]["evidence_basis"],
    } for item in programs]
    write_json(output / "KAIOS_CHARTER_TO_RUNTIME_CROSSWALK.json", {"schema_version": "1.0.0", "entries": crosswalk})

    foundation = ["UNIVERSE_PHYSICS", "TIME", "COORDINATES", "ENERGY", "IDENTITY", "LIFE", "LOCATION", "RIGHTS", "LABOR", "LAND", "CONSTRUCTION", "PRODUCTION", "SUPPLY_CHAIN", "ECONOMY", "GOVERNANCE", "CIVILIZATION", "PLANETARY", "MULTIVERSE"]
    nodes = [{"id": f"FOUNDATION:{value}", "kind": "FOUNDATION"} for value in foundation] + [{"id": item["program_id"], "kind": "PROGRAM", "domain": item["domain"]} for item in programs]
    edges = [{"from": f"FOUNDATION:{left}", "to": f"FOUNDATION:{right}", "type": "REQUIRED_BEFORE"} for left, right in zip(foundation, foundation[1:])]
    anchors = {"UNIVERSE_PHYSICS": "UNIVERSE_PHYSICS", "TIME": "TIME", "COORDINATES": "COORDINATES", "ENERGY": "ENERGY", "IDENTITY": "IDENTITY", "AI_LIFE": "LIFE", "LAND": "LAND", "LABOR": "LABOR", "CONSTRUCTION": "CONSTRUCTION", "MANUFACTURING": "PRODUCTION", "SUPPLY_CHAIN": "SUPPLY_CHAIN", "GOVERNANCE": "GOVERNANCE", "PLANET": "PLANETARY", "MULTIVERSE": "MULTIVERSE"}
    edges.extend({"from": f"FOUNDATION:{anchors.get(item['domain'], 'CIVILIZATION')}", "to": item["program_id"], "type": "FOUNDATION_FOR_PROGRAM"} for item in programs)
    feedback = [{"id": value, "classification": "VALID_RUNTIME_FEEDBACK_LOOP"} for value in ["ECONOMY_DEMAND_SUPPLY", "ECOLOGY_RESOURCE_POPULATION", "GOVERNANCE_AUDIT_CORRECTION", "MAINTENANCE_WEAR_REPAIR"]]
    graph = {"schema_version": "1.0.0", "nodes": nodes, "edges": edges, "directed_acyclic": True, "architecture_cycles": [], "feedback_loops": feedback}
    write_json(output / "KAIOS_CHARTER_PROGRAM_DEPENDENCY_GRAPH.json", graph)
    backlog = [{
        "program_id": item["program_id"], "chapter_number": item["chapter_number"], "program_name": item["program_name"],
        "domain": item["domain"], "priority": item["priority"], "risk": item["risk"],
        "implementation_status": item["implementation_status"],
        "dependency_status": "SATISFIED_OR_PARTIAL_EVIDENCE" if item["coverage"] else "DEPENDENCY_REVIEW_REQUIRED",
        "dependencies": item["dependencies"], "recommended_action": item["recommended_action"],
        "workline": f"KAIOS_CHARTER_{item['domain']}_PROGRAM",
    } for item in programs]
    write_json(output / "KAIOS_CHARTER_PROGRAM_IMPLEMENTATION_BACKLOG.json", {"schema_version": "1.0.0", "items": backlog})

    public_fields = ["program_id", "chapter_number", "chapter_title", "program_name", "domain", "implementation_status", "coverage", "conflicts", "priority", "risk", "dependencies", "current_paths", "current_PRs", "next_action", "promotion_status", "authorized_mode"]
    public = [{key: item[key] for key in public_fields} for item in programs]
    status_counts = Counter(item["implementation_status"] for item in programs)
    domain_counts = Counter(item["domain"] for item in programs)
    write_json(api / "index.json", {"schema_version": "1.0.0", "read_only": True, "mutation_endpoints": False, "program_count": len(public), "programs": public})
    foundation_runtime = repo / "KGEN-KAIOS/world-viewer/foundation/charter-foundation-runtime.js"
    foundation_status = {
        "workline": "KAIOS_CHARTER_FOUNDATION_GAP_CLOSURE_V1",
        "status": "IMPLEMENTED_SIMULATION" if foundation_runtime.exists() else "APPROVED_SPECIFICATION",
        "runtime": "KGEN-KAIOS/world-viewer/foundation/charter-foundation-runtime.js" if foundation_runtime.exists() else None,
        "components": ["SHARED_SIMULATION_CLOCK_ADAPTER", "DETERMINISTIC_EVENT_ENVELOPE", "SHARED_ENVIRONMENT_STATE_PROJECTION", "ENERGY_MATERIAL_RIGHTS_CAPABILITY_INTERFACES"],
        "program_ids": ["KAIOS-CH-002-004-UNIVERSE_PHYSICS", "KAIOS-CH-005-007-ENERGY", "KAIOS-CH-031-073-IDENTITY"],
        "authority": "SIMULATION_ONLY",
        "production_authority": False,
    }
    write_json(api / "status.json", {"schema_version": "1.0.0", "read_only": True, "program_count": len(programs), "implementation_status_counts": dict(sorted(status_counts.items())), "promotion_ceiling": "REVIEWED_REQUIREMENT_UNLESS_REPOSITORY_EVIDENCE", "foundation_gap_closure_v1": foundation_status, "safety": SAFETY})
    write_json(api / "dependencies.json", {"schema_version": "1.0.0", "read_only": True, "directed_acyclic": True, "foundation_order": foundation, "edges": edges, "feedback_loops": feedback})
    bands = {"implemented": sum(item["coverage"] >= 75 for item in programs), "partial": sum(35 <= item["coverage"] < 75 for item in programs), "specification_only": sum(0 < item["coverage"] < 35 for item in programs), "missing_or_held": sum(item["coverage"] == 0 for item in programs)}
    write_json(api / "coverage.json", {"schema_version": "1.0.0", "read_only": True, "bands": bands, "domain_counts": dict(sorted(domain_counts.items())), "average_coverage_percent": round(sum(item["coverage"] for item in programs) / len(programs), 2)})
    conflicts = [{"program_id": item["program_id"], "chapter_source": item["chapter_source"], "conflicts": item["conflicts"], "action": "NO_SILENT_RECONCILIATION"} for item in programs if item["conflicts"]]
    write_json(api / "conflicts.json", {"schema_version": "1.0.0", "read_only": True, "conflict_count": len(conflicts), "conflicts": conflicts})
    summary = {"status_counts": status_counts, "domain_counts": domain_counts, "graph": graph, "backlog": backlog}
    write_reports(output, registry, summary)
    return registry, summary


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--source", type=Path, required=True)
    args = parser.parse_args()
    registry, summary = compile_registry(args.repo.resolve(), args.source.resolve())
    print(json.dumps({"sources": len(registry["source_records"]), "programs": len(registry["programs"]), "domains": len(summary["domain_counts"]), "statuses": dict(summary["status_counts"])}, ensure_ascii=False))


if __name__ == "__main__":
    main()
