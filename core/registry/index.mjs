import { clone } from "../shared/utils.mjs";
import { invariant } from "../shared/errors.mjs";

export class Registry {
  constructor({ domain, stream, idField, validate, store }) {
    this.domain = domain;
    this.stream = stream;
    this.idField = idField;
    this.validate = validate;
    this.store = store;
  }

  async seed(entities, options = {}) {
    entities.forEach((entity) => this.validate(entity));
    await this.store.hydrate(this.domain, entities, this.idField, { stream: this.stream, ...options });
  }

  async register(entity, actorId = "SYSTEM") {
    this.validate(entity);
    const id = entity[this.idField];
    invariant(!(await this.get(id)), "DUPLICATE_ID", `${this.domain} ID already exists: ${id}`);
    await this.store.commit({ domain: this.domain, stream: this.stream, id, entity, event_type: `${this.domain}_REGISTERED`, actor_id: actorId, payload: { entity } });
    return this.get(id);
  }

  async get(id) { return this.store.getEntity(this.domain, id); }
  async list() { return this.store.listEntities(this.domain); }

  async updateMetadata(id, patch, actorId = "SYSTEM") {
    const current = await this.get(id);
    invariant(current, "NOT_FOUND", `${this.domain} not found: ${id}`);
    invariant(!Object.hasOwn(patch, this.idField) || patch[this.idField] === id, "IMMUTABLE_ID", `${this.idField} cannot change`);
    const next = { ...current, ...clone(patch), [this.idField]: id, updated_at: new Date().toISOString() };
    this.validate(next);
    await this.store.commit({ domain: this.domain, stream: this.stream, id, entity: next, event_type: `${this.domain}_METADATA_UPDATED`, actor_id: actorId, payload: { patch } });
    return this.get(id);
  }

  async setStatus(id, status, actorId = "SYSTEM") {
    return this.updateMetadata(id, { status }, actorId);
  }

  async resolve(id) {
    const entity = await this.get(id);
    return entity ? { entity, history: await this.history(id) } : null;
  }

  async history(id) { return this.store.history(id, this.stream); }
}

export function createRegistry(config) { return new Registry(config); }
