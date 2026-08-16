import { createRegistry } from "./index.mjs?v=3.3.0-public-request-gateway";
import { MemoryUniverseStore, IndexedDbUniverseStore } from "./store.mjs?v=3.3.0-public-request-gateway";
import { createLifeRegistry } from "../life/index.mjs";
import { createSpeciesRegistry } from "../species/index.mjs";
import { createAppRegistry, replayCanonicalAppRelease } from "../apps/index.mjs";
import { createCompanyRegistry } from "../company/index.mjs";
import { replayCanonicalCompanyGenesis, replayCanonicalCivilizationDemandCycle, replayCanonicalFirstCustomerArchitecture, replayCanonicalAiCivilizationOsArchitecture, replayCanonicalCustomerAcquisitionEngine, replayCanonicalPublicRequestGateway, validateWorktreeClassificationAudit, validateGitignoreProposal } from "../company/index.mjs";
import { createAssetRegistry } from "../assets/index.mjs";
import { createMarketRegistry } from "../market/index.mjs";
import { createJobRegistry } from "../jobs/index.mjs";
import { createServiceRegistry } from "../services/index.mjs";
import { createLicenseRegistry } from "../licenses/index.mjs";
import { createSpacecraftRegistry } from "../spacecraft/index.mjs";
import { createCurrencyRegistry } from "../currencies/index.mjs";
import { createLocationRegistry } from "../locations/index.mjs";
import { createBirthCertificateRegistry, appendResolvedLifeBirth } from "../birth/index.mjs";
import { replayCanonicalFirstWorkday } from "../jobs/index.mjs";
import { replayCanonical11520Listing } from "../market/index.mjs";
import { replayCanonicalMissionProgress } from "../missions/index.mjs";
import { replayCanonicalLifeSecurity } from "../security/life-security.mjs";

export async function loadCanonicalSeed(url = new URL("../data/canonical.json", import.meta.url)) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Canonical seed unavailable: HTTP ${response.status}`);
  return response.json();
}

export async function createUniverseRuntime({ seed, store = new MemoryUniverseStore() }) {
  const registries = {
    life: createLifeRegistry(store, createRegistry),
    species: createSpeciesRegistry(store, createRegistry),
    app: createAppRegistry(store, createRegistry),
    company: createCompanyRegistry(store, createRegistry),
    asset: createAssetRegistry(store, createRegistry),
    market: createMarketRegistry(store, createRegistry),
    job: createJobRegistry(store, createRegistry),
    service: createServiceRegistry(store, createRegistry),
    license: createLicenseRegistry(store, createRegistry),
    spacecraft: createSpacecraftRegistry(store, createRegistry),
    currency: createCurrencyRegistry(store, createRegistry),
    location: createLocationRegistry(store, createRegistry),
    birthCertificate: createBirthCertificateRegistry(store, createRegistry)
  };
  const mappings = [
    ["life", "lives"], ["species", "species"], ["app", "apps"], ["company", "companies"],
    ["asset", "assets"], ["market", "listings"], ["job", "jobs"], ["service", "services"],
    ["license", "licenses"], ["spacecraft", "spacecraft"], ["currency", "currencies"], ["location", "locations"],
    ["birthCertificate", "birth_certificates"]
  ];
  for (const [registryName, seedName] of mappings) {
    if (registryName === "birthCertificate") continue;
    const forceCanonical = ["currency", "service"].includes(registryName) || (registryName === "company" && !seed.company_genesis);
    await registries[registryName].seed(seed[seedName] ?? [], { forceCanonical, canonicalVersion: seed.schema_version });
  }
  for (const certificate of (seed.birth_certificates ?? []).filter((item) => item.status === "BORN")) {
    const history = await store.history(certificate.life_id, "LIFE");
    if (!history.some((event) => event.event_type === "BIRTH_EVENT")) {
      const life = await registries.life.get(certificate.life_id);
      await appendResolvedLifeBirth({ store, life, certificate });
    }
  }
  await registries.birthCertificate.seed(seed.birth_certificates ?? [], {
    forceCanonical: (seed.birth_certificates ?? []).some((item) => item.status === "BORN"),
    canonicalVersion: seed.schema_version
  });
  if (seed.post_birth_runtime?.first_work_cycle) {
    const life = await registries.life.get(seed.post_birth_runtime.life_id);
    await replayCanonicalFirstWorkday({ store, life, runtime: seed.post_birth_runtime });
  }
  if (seed.company_genesis) {
    await replayCanonicalCompanyGenesis({
      store,
      company: (seed.companies ?? []).find((item) => item.company_id === seed.company_genesis.company_id),
      founderLife: await registries.life.get(seed.company_genesis.founder_life_id),
      charter: seed.next_stage?.company_charter,
      genesis: seed.company_genesis
    });
    const companyAsset = (seed.assets ?? []).find((item) => item.asset_id === seed.company_genesis.company_id);
    if (companyAsset) await registries.asset.seed([companyAsset], { forceCanonical: true, canonicalVersion: seed.schema_version });
  }
  if (seed.company_genesis && seed.next_stage?.civilization_demand_engine) {
    const priority = seed.next_stage.product_priority;
    await replayCanonicalCivilizationDemandCycle({
      store,
      company: await registries.company.get("AI_ANT_COMPANY_0001"),
      demandEngine: seed.next_stage.civilization_demand_engine,
      productPriority: {
        selected: priority.candidates.filter((candidate) => priority.selected_product_ids.includes(candidate.product_id)),
        selection_is_customer_order: priority.selection_is_customer_order
      },
      proposals: seed.next_stage.business_proposals,
      recordedAt: seed.next_stage.civilization_demand_engine.recorded_at
    });
  }
  if (seed.company_genesis && seed.next_stage?.first_real_customer_architecture) {
    const architecture = seed.next_stage.first_real_customer_architecture;
    await replayCanonicalFirstCustomerArchitecture({
      store,
      company: await registries.company.get("AI_ANT_COMPANY_0001"),
      pipeline: architecture.first_customer_pipeline,
      product: architecture.first_product,
      recordedAt: architecture.recorded_at
    });
  }
  if (seed.company_genesis && seed.next_stage?.ai_civilization_os) {
    await replayCanonicalAiCivilizationOsArchitecture({
      store,
      company: await registries.company.get("AI_ANT_COMPANY_0001"),
      os: seed.next_stage.ai_civilization_os,
      recordedAt: seed.next_stage.ai_civilization_os.recorded_at
    });
  }
  if (seed.company_genesis && seed.next_stage?.customer_acquisition_engine) {
    await replayCanonicalCustomerAcquisitionEngine({
      store,
      company: await registries.company.get("AI_ANT_COMPANY_0001"),
      engine: seed.next_stage.customer_acquisition_engine
    });
  }
  if (seed.company_genesis && seed.next_stage?.public_civilization_request_gateway) {
    await replayCanonicalPublicRequestGateway({
      store,
      company: await registries.company.get("AI_ANT_COMPANY_0001"),
      gateway: seed.next_stage.public_civilization_request_gateway
    });
  }
  if (seed.next_stage?.worktree_classification_audit) validateWorktreeClassificationAudit(seed.next_stage.worktree_classification_audit);
  if (seed.next_stage?.gitignore_proposal) validateGitignoreProposal(seed.next_stage.gitignore_proposal);
  for (const listing of (seed.listings ?? []).filter((item) => item.status === "LISTED" && item.registry_scope === "LOCAL_11520")) {
    const [life, asset] = await Promise.all([registries.life.get(listing.seller_id), registries.asset.get(listing.asset_id)]);
    await replayCanonical11520Listing({ store, listing, asset, life });
    const canonicalApp = (seed.apps ?? []).find((app) => app.life_id === life.life_id && app.status === "RELEASED_LOCAL");
    if (canonicalApp) {
      const appAsset = (seed.assets ?? []).find((item) => item.asset_id === canonicalApp.app_id);
      await replayCanonicalAppRelease({ store, app: canonicalApp, life: await registries.life.get(life.life_id), listing, appAsset });
    }
    if (seed.missions?.[life.life_id]) await replayCanonicalMissionProgress({ store, life: await registries.life.get(life.life_id), milestones: seed.missions[life.life_id], recordedAt: seed.company_genesis?.approved_at ?? canonicalApp?.released_at ?? listing.start_time, schemaVersion: seed.schema_version });
  }
  if (seed.life_security?.DIGITAL_ANT_0001) {
    await replayCanonicalLifeSecurity({ store, life: await registries.life.get("DIGITAL_ANT_0001"), security: seed.life_security.DIGITAL_ANT_0001 });
  }
  return Object.freeze({ store, registries, seed });
}

export function createBrowserUniverseStore(name) { return new IndexedDbUniverseStore(name); }
