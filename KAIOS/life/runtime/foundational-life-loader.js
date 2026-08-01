import { FOUNDATIONAL_LIFE_PACKAGES } from "./foundational-life-runtime.js";

const COMPONENTS = Object.freeze([
  "life.manifest.json",
  "environment.json",
  "growth_or_formation.json",
  "health_or_integrity.json",
  "reproduction_or_change.json"
]);

export async function loadFoundationalLifeDefinitions({
  baseUrl = new URL("../candidates/", import.meta.url),
  fetchImpl = globalThis.fetch
} = {}) {
  if (typeof fetchImpl !== "function") throw new TypeError("fetch implementation is required");
  return Promise.all(FOUNDATIONAL_LIFE_PACKAGES.map(async (packageName) => {
    const records = await Promise.all(COMPONENTS.map(async (component) => {
      const url = new URL(`${packageName}/${component}`, baseUrl);
      const response = await fetchImpl(url);
      if (!response.ok) throw new Error(`${packageName}/${component} returned HTTP ${response.status}`);
      return response.json();
    }));
    const [manifest, environment, growth, health, change] = records;
    return {
      package_name: packageName,
      manifest,
      environment,
      growth_or_formation: growth,
      health_or_integrity: health,
      reproduction_or_change: change
    };
  }));
}
