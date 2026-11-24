import http from 'node:http';
import { createHash, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { isIPv4 } from 'node:net';
import { networkInterfaces } from 'node:os';
import { mkdir, readFile, realpath, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  cancelSimulationOrder, closeSimulationPosition, createKgenLedger,
  observeSimulationPrice, placeSimulationOrder, simulationSnapshot,
} from '../runtime/kgen-margin-runtime.mjs';
import { FREE_ORACLE_MAX_AGE_MS, PUBLIC_MARKET_QUOTE_SOURCE } from '../runtime/public-market-quotes.mjs';
import { requireV1TradingC } from '../controls/nonlinear-controls.mjs';
import { createKgenKaiosSpotSimulation } from '../modules/kgen-native-market-cell.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '../../../..');
const gamePath = '/K線西遊記/temples/11520/';
const gameUrl = encodeURI(gamePath + 'game-5d.html') + '?world=12682&preview=server';
const spotPath = gamePath + 'index.html';
const spotUrl = encodeURI(spotPath) + '#/SPOT';
const dataFileDefault = resolve(here, 'data', 'players.json');
const spotDataFileDefault = resolve(here, 'data', 'spot-players.json');
const resourceManifest = resolve(here, '..', 'assets', 'resource-manifest.json');
const schema = 'K11520_SERVER_SIMULATION_V1';
const spotSchema = 'K11520_SPOT_SIMULATION_JOURNAL_V1';
const spotJournalLimit = 1000;
const spotOrderLimit = spotJournalLimit / 2;
const spotRequestId = /^[A-Za-z0-9][A-Za-z0-9:._-]{7,127}$/;
const spotPlayerId = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/;
const spotDecimal = /^\d{1,12}(?:\.\d{1,8})?$/;
const markets = Object.freeze({ KX: 'BTCUSDT', KY: 'ETHUSDT', KZ: 'BNBUSDT' });
const symbols = Object.values(markets);
const requestKeyPattern = /^[a-zA-Z0-9_.:-]{1,128}$/;
const tokenPattern = /^[a-f0-9]{48}$/;
const accessCodePattern = /^[a-f0-9]{32,128}$/;
const privateIpv4Pattern = /^(?:10\.|172\.(?:1[6-9]|2[0-9]|3[01])\.|192\.168\.)/;
const accessCookie = 'k11520_lan_preview';
const accessLifetimeSeconds = 8 * 60 * 60;
const lanMarker = '<meta name="k11520-private-preview" content="lan">';

export const BINANCE_AGGREGATE_SOURCE = PUBLIC_MARKET_QUOTE_SOURCE.id;
export const BYBIT_TRADES_SOURCE = 'BYBIT_PUBLIC_RECENT_TRADES';

const contentTypes = new Map(Object.entries({
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
}));

function response(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store', 'x-content-type-options': 'nosniff',
  });
  res.end(body);
}

async function requestBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 16384) throw new RangeError('BODY_TOO_LARGE');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function bodyOf(req) {
  const text = await requestBody(req);
  const body = text ? JSON.parse(text) : {};
  if (!record(body)) throw new TypeError('INVALID_JSON_OBJECT');
  return body;
}

function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function digest(text) {
  return createHash('sha256').update(text).digest('hex');
}

function playerView(player) {
  const { id, name, xyz, kaios, kufo, hp, home, updatedAt } = player;
  return { id, name, xyz, kgen: player.ledger?.free ?? player.kgen, kaios, kufo, hp, home, updatedAt };
}

async function providerJson(fetchImpl, url) {
  const res = await fetchImpl(url.href, {
    method: 'GET', credentials: 'omit', cache: 'no-store', redirect: 'error',
    signal: AbortSignal.timeout(6000), headers: { accept: 'application/json' },
  });
  if (!res?.ok) throw new Error('PUBLIC_FEED_UNAVAILABLE');
  return res.json();
}

async function binanceObservationBatch(fetchImpl, { market, afterSequence }) {
  const url = new URL('/api/v3/aggTrades', PUBLIC_MARKET_QUOTE_SOURCE.origin);
  url.searchParams.set('symbol', market);
  url.searchParams.set('limit', afterSequence === null ? '1' : '1000');
  if (afterSequence !== null) url.searchParams.set('fromId', String(afterSequence + 1));
  const data = await providerJson(fetchImpl, url);
  if (!Array.isArray(data) || data.length > 1000) throw new Error('INVALID_OBSERVATION_BATCH');
  return data.map(row => ({
    market, price: Number(row.p), updatedAt: row.T, sequence: row.a, source: BINANCE_AGGREGATE_SOURCE,
  }));
}

async function bybitObservation(fetchImpl, { market }) {
  const url = new URL('/v5/market/recent-trade', 'https://api.bybit.com');
  url.searchParams.set('category', 'spot');
  url.searchParams.set('symbol', market);
  url.searchParams.set('limit', '1');
  const data = await providerJson(fetchImpl, url);
  const row = data?.retCode === 0 && data?.result?.category === 'spot' && data?.result?.list?.[0];
  if (!row || !row.execId || row.symbol !== market) throw new Error('INVALID_INDEPENDENT_OBSERVATION');
  return {
    market, price: Number(row.price), updatedAt: Number(row.time),
    tradeId: String(row.execId), source: BYBIT_TRADES_SOURCE,
  };
}

function fresh(observation, time) {
  return observation && Number.isSafeInteger(time) && Number.isSafeInteger(observation.updatedAt) &&
    observation.updatedAt > 0 && observation.updatedAt <= time &&
    time - observation.updatedAt <= FREE_ORACLE_MAX_AGE_MS;
}

function validObservation(input, market, source) {
  return input?.market === market && input.source === source &&
    Number.isFinite(input.price) && input.price > 0 && Number.isSafeInteger(input.updatedAt) &&
    input.updatedAt > 0;
}

function safeStaticPath(pathname, spotPreview) {
  if (pathname.includes('\\') || pathname.includes('%') || pathname.includes('\0') ||
      pathname.split('/').some(part => part === '..' || part.startsWith('.'))) return false;
  if (pathname.startsWith(gamePath)) {
    const portable = pathname.slice(gamePath.length);
    if (spotPreview && /^(?:index\.html|app\.mjs|styles\.css)$/.test(portable)) return true;
    return /^(game-5d\.html|sw\.js|manifest\.webmanifest)$/.test(portable) ||
      /^(assets|controls|data|runtime)\//.test(portable);
  }
  if (spotPreview && pathname === '/K線西遊記/temples/12345/assets/ethers-5.7.2.umd.min.js') return true;
  return /^\/(assets|core|docs|K線西遊記\/data)\//.test(pathname);
}

function ipv4Number(address) {
  return address.split('.').reduce((value, part) => value * 256 + Number(part), 0);
}

function privateLanInterface(config) {
  if (!config) return null;
  const { address, accessCode } = config;
  if (!isIPv4(address) || !privateIpv4Pattern.test(address) ||
      !accessCodePattern.test(accessCode ?? '')) throw new Error('INVALID_PRIVATE_PREVIEW_CONFIGURATION');
  const selected = Object.values(networkInterfaces()).flat().find(entry =>
    entry && entry.family === 'IPv4' && !entry.internal && entry.address === address);
  if (!selected || !isIPv4(selected.netmask)) throw new Error('PRIVATE_PREVIEW_INTERFACE_NOT_ASSIGNED');
  return { address, mask: ipv4Number(selected.netmask), expectedCode: digest(accessCode), sessionKey: randomBytes(32) };
}

function lanAccessForm(res, world) {
  const html = `<!doctype html><html lang="zh-Hant"><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>K11520 私人試玩</title><style>
body{color:#f2f6fa;background:#071422;font:17px system-ui,sans-serif;padding:24px;margin:0}
main{max-width:28rem;margin:5vh auto} h1{font-size:24px} label,input,button{display:block}
input,button{box-sizing:border-box;min-height:48px;font:inherit;border-radius:8px;margin:8px 0 16px;padding:8px 12px}
input{width:100%} button{background:#a9dfbf;border:0;color:#102a21;font-weight:700}
</style><main><h1>K11520 私人試玩</h1><p>請輸入私人試玩碼。模擬下單不需要錢包。</p>
<form method="post" action="/preview/access"><input type="hidden" name="world" value="${world}">
<label for="code">試玩碼</label><input id="code" name="code" type="password" maxlength="128"
autocomplete="off" autocapitalize="none" required><button type="submit">進入遊戲</button></form></main></html>`;
  res.writeHead(401, {
    'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store',
    'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'",
  });
  return res.end(html);
}

async function load(file) {
  let bytes;
  try {
    bytes = await readFile(file, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return { schema, players: {}, observations: {} };
  }
  const data = JSON.parse(bytes.replace(/^\uFEFF/, ''));
  if (!record(data)) throw new Error('INVALID_SIMULATION_DATA');
  if (data.schema === schema) {
    if (!record(data.players) || !record(data.observations)) throw new Error('INVALID_SIMULATION_DATA');
    return data;
  }
  if (Object.hasOwn(data, 'schema')) throw new Error('UNSUPPORTED_SIMULATION_SCHEMA');
  // Legacy accounts are retained verbatim. Their unauthenticated IDs are not credentials.
  return { schema, players: data, observations: {} };
}

async function save(file, data) {
  await mkdir(dirname(file), { recursive: true });
  const temp = file + '.' + randomUUID() + '.tmp';
  try {
    await writeFile(temp, JSON.stringify(data), { flag: 'wx', flush: true, mode: 0o600 });
    await rename(temp, file);
  } finally {
    await rm(temp, { force: true }).catch(() => {});
  }
}

function bearer(req) {
  return /^Bearer ([a-f0-9]{48})$/i.exec(req.headers.authorization || '')?.[1] ?? null;
}

function account(state, token) {
  if (typeof token !== 'string' || !tokenPattern.test(token)) return null;
  const hash = digest(token);
  return Object.values(state.players).find(player => player?.tokenHash === hash && player.ledger) ?? null;
}

function isSpotPlayer(state, id) {
  if (typeof id !== 'string' || !spotPlayerId.test(id) || !Object.hasOwn(state.players, id)) return false;
  const player = state.players[id];
  return player?.id === id && player.ledger?.owner === id &&
    typeof player.tokenHash === 'string' && /^[a-f0-9]{64}$/.test(player.tokenHash);
}

function spotOrderTerms(action, body) {
  if (!record(body) || typeof body.requestId !== 'string' || !spotRequestId.test(body.requestId)) return null;
  if (action === 'cancel') {
    if (Object.keys(body).length !== 2 || typeof body.orderId !== 'string' || !/^O\d{1,10}$/.test(body.orderId)) return null;
    return { requestId: body.requestId, orderId: body.orderId };
  }
  if (action !== 'place' || Object.keys(body).length !== 4 || !['BUY', 'SELL'].includes(body.side) ||
      typeof body.price !== 'string' || !spotDecimal.test(body.price) ||
      typeof body.quantity !== 'string' || !spotDecimal.test(body.quantity)) return null;
  return { requestId: body.requestId, side: body.side, price: body.price, quantity: body.quantity };
}

function readSpotJournal(state) {
  if (!Object.hasOwn(state, 'spot')) return [];
  const { spot } = state;
  if (!record(spot) || spot.schema !== spotSchema || !Array.isArray(spot.journal) ||
      spot.journal.length > spotJournalLimit ||
      spot.journal.filter(event => event?.action === 'place').length > spotOrderLimit) {
    throw new Error('INVALID_SPOT_SIMULATION_JOURNAL');
  }
  return spot.journal;
}

function restoreSpotSimulation(state) {
  let time = 0;
  const market = createKgenKaiosSpotSimulation({ clock: () => time });
  const requests = new Map();
  for (const id of Object.keys(state.players)) if (isSpotPlayer(state, id)) market.addPlayer(id);

  const getRequest = (id, requestId) => requests.get(id + ':' + requestId);
  const fingerprint = (action, terms) => digest(JSON.stringify([action, terms]));
  function execute({ action, playerId, at, terms }) {
    time = at;
    const result = action === 'place' ? market.placeOrder(playerId, terms) : market.cancelOrder(playerId, terms);
    requests.set(playerId + ':' + terms.requestId, { fingerprint: fingerprint(action, terms), result });
    return result;
  }

  for (const event of readSpotJournal(state)) {
    const terms = record(event) && spotOrderTerms(event.action, event.terms);
    if (!terms || !isSpotPlayer(state, event.playerId) ||
        !Number.isSafeInteger(event.at) || event.at < 0 || event.at > 8.64e15 ||
        getRequest(event.playerId, terms.requestId)) throw new Error('INVALID_SPOT_SIMULATION_JOURNAL_EVENT');
    execute({ ...event, terms });
  }
  return { market, getRequest, fingerprint, execute };
}

export async function createK11520Server({
  spotPreview = false, dataFile = spotPreview ? spotDataFileDefault : dataFileDefault,
  now = Date.now, fetchImpl = globalThis.fetch,
  readMarket = input => binanceObservationBatch(fetchImpl, input),
  readIndependent = input => bybitObservation(fetchImpl, input),
  pollIntervalMs = spotPreview ? 0 : 1200, jumpRatio = 0.05, corroborationRatio = 0.02, serveStatic = true, lanPreview = null,
} = {}) {
  const file = resolve(dataFile);
  const lan = privateLanInterface(lanPreview);
  let state = await load(file);
  let spot = spotPreview ? restoreSpotSimulation(state) : null;
  let tail = Promise.resolve();
  let loop = null;
  const pendingPolls = new Map();
  const acceptedBatches = new Map();
  let closed = false;
  const channel = Object.fromEntries(symbols.map(market => [market, { status: 'WAITING', reason: 'NO_OBSERVATION' }]));
  const serial = action => {
    const result = tail.then(action);
    tail = result.catch(() => {});
    return result;
  };

  async function commit(candidate, candidateSpot = spot) {
    await save(file, candidate);
    state = candidate;
    spot = candidateSpot;
  }

  function wait(market, reason) {
    channel[market] = { status: 'WAITING', reason };
  }

  function marketView(market, time = now()) {
    if (channel[market].status !== 'READY') return { ...channel[market], available: false };
    return fresh(state.observations[market], time) ?
      { status: 'READY', reason: null, available: true } :
      { status: 'WAITING', reason: 'STALE_PRICE', available: false };
  }

  async function acceptBatch(market, observations, resumeBoundary) {
    if (!observations.length) return;
    await serial(async () => {
      const next = structuredClone(state);
      for (const [index, observation] of observations.entries()) {
        for (const player of Object.values(next.players)) {
          if (!player?.ledger) continue;
          const book = player.ledger.simulation;
          if (!book || !book.orders.some(order => order.market === market && order.status === 'PENDING') &&
                       !book.positions.some(position => position.market === market && position.status === 'OPEN')) continue;
          const result = observeSimulationPrice(player.ledger, {
            ...observation, observedAt: observation.updatedAt, now: observation.receivedAt,
            productV1: true, resumeBoundary: resumeBoundary && index === 0,
          });
          // The cursor and each affected ledger must advance together.
          if (!result.ok) throw new Error(result.reason);
        }
        next.observations[market] = observation;
      }
      await commit(next);
    });
  }

  async function publishBatch(market, batch) {
    try {
      await acceptBatch(market, batch.observations, batch.resumeBoundary);
    } catch {
      wait(market, 'LEDGER_PERSISTENCE_UNAVAILABLE');
      return;
    }
    acceptedBatches.delete(market);
    if (batch.stopReason) {
      wait(market, batch.stopReason);
      return;
    }
    if ((batch.uninterrupted || batch.observations.length > 0) && fresh(state.observations[market], now())) {
      channel[market] = { status: 'READY', reason: null };
    } else {
      wait(market, state.observations[market] ? 'STALE_PRICE' : 'NO_OBSERVATION');
    }
  }

  async function refreshMarket(market) {
    const awaitingCommit = acceptedBatches.get(market);
    if (awaitingCommit) return publishBatch(market, awaitingCommit);
    const previous = state.observations[market];
    const uninterrupted = marketView(market).available;
    try {
      const incoming = await readMarket({ market, afterSequence: uninterrupted ? previous.sequence : null, now: now() });
      if (!Array.isArray(incoming) || incoming.length > 1000) {
        wait(market, 'INVALID_OBSERVATION_BATCH');
        return;
      }
      // On reconnect the current point has no trusted path from the pre-gap price.
      const batch = uninterrupted ? incoming : incoming.slice(-1);
      let carry = previous, stopReason = null;
      const accepted = [];
      for (const sample of batch) {
        const receivedAt = now();
        if (!validObservation(sample, market, BINANCE_AGGREGATE_SOURCE) ||
            !Number.isSafeInteger(sample.sequence) || sample.sequence < 0) {
          stopReason = 'INVALID_OBSERVATION';
          break;
        }
        if (!fresh(sample, receivedAt)) {
          stopReason = 'STALE_PRICE';
          break;
        }
        if (carry && (sample.sequence <= carry.sequence || sample.updatedAt < carry.updatedAt)) {
          if (sample.sequence === carry.sequence && sample.updatedAt === carry.updatedAt && sample.price === carry.price) continue;
          stopReason = 'OUT_OF_ORDER_PRICE';
          break;
        }
        if (uninterrupted && carry && sample.sequence !== carry.sequence + 1) {
          stopReason = 'QUOTE_SEQUENCE_GAP';
          break;
        }
        let corroboration;
        if (carry && Math.abs(sample.price - carry.price) / carry.price >= jumpRatio) {
          wait(market, 'ANOMALY_UNVERIFIED');
          try {
            corroboration = await readIndependent({ market, now: receivedAt });
          } catch {
            stopReason = 'ANOMALY_UNVERIFIED';
            break;
          }
          const verifiedAt = now();
          if (!validObservation(corroboration, market, BYBIT_TRADES_SOURCE) ||
              !fresh(corroboration, verifiedAt) || !fresh(sample, verifiedAt) ||
              Math.abs(sample.price - corroboration.price) / corroboration.price > corroborationRatio) {
            stopReason = 'ANOMALY_UNVERIFIED';
            break;
          }
          corroboration = {
            source: corroboration.source, price: corroboration.price, updatedAt: corroboration.updatedAt,
            tradeId: typeof corroboration.tradeId === 'string' ? corroboration.tradeId : null,
          };
        }
        const { price, updatedAt, sequence, source } = sample;
        carry = { market, price, updatedAt, sequence, source, receivedAt: now(),
          ...(corroboration ? { corroboration } : {}) };
        accepted.push(carry);
      }
      if (stopReason) wait(market, stopReason);
      const batchToCommit = { observations: accepted, resumeBoundary: !uninterrupted, uninterrupted, stopReason };
      if (accepted.length) acceptedBatches.set(market, batchToCommit);
      await publishBatch(market, batchToCommit);
    } catch {
      wait(market, 'QUOTE_SOURCE_UNAVAILABLE');
    }
  }

  function poll() {
    if (closed) return Promise.resolve();
    return Promise.all(symbols.map(market => {
      if (!pendingPolls.has(market)) {
        pendingPolls.set(market, refreshMarket(market).finally(() => pendingPolls.delete(market)));
      }
      return pendingPolls.get(market);
    }));
  }

  function updatePlayer(next, player, result) {
    player.kgen = player.ledger.free;
    player.updatedAt = new Date(now()).toISOString();
    return commit(next).then(() => ({ ...result, player: playerView(player) }));
  }

  async function login(req, params) {
    const token = bearer(req) ?? params.token;
    if (token != null || params.playerId != null) {
      const existing = account(state, token);
      if (!existing || params.playerId != null && params.playerId !== existing.id) return null;
      return { ok: true, token, player: playerView(existing), orderMode: 'OFFCHAIN_SIMULATION' };
    }
    return serial(async () => {
      const next = structuredClone(state), id = randomUUID(), credential = randomBytes(24).toString('hex');
      const ledger = createKgenLedger(10);
      ledger.owner = id;
      const player = { id, name: String(params.name || '旅人').slice(0, 40), xyz: { x: 0, y: 0, z: 0 },
        kgen: ledger.free, kaios: 1000, kufo: 1, hp: 100, home: null,
        updatedAt: new Date(now()).toISOString(), tokenHash: digest(credential), ledger, requests: {} };
      next.players[id] = player;
      await commit(next, spotPreview ? restoreSpotSimulation(next) : null);
      return { ok: true, token: credential, player: playerView(player), orderMode: 'OFFCHAIN_SIMULATION' };
    });
  }

  function submitSpot(id, action, body) {
    return serial(async () => {
      const terms = spotOrderTerms(action, body);
      if (!terms) return { status: 400, payload: { ok: false, reason: 'INVALID_SPOT_REQUEST' } };
      const earlier = spot.getRequest(id, terms.requestId);
      if (earlier) {
        return earlier.fingerprint === spot.fingerprint(action, terms) ?
          { status: 200, payload: { ok: true, result: earlier.result, replayed: true, ...spot.market.snapshot(id) } } :
          { status: 409, payload: { ok: false, reason: 'REQUEST_CONFLICT' } };
      }
      const journal = readSpotJournal(state);
      // Reserve up to one later journal slot for cancelling each accepted order.
      if (journal.length >= spotJournalLimit ||
          action === 'place' && journal.filter(event => event.action === 'place').length >= spotOrderLimit) {
        return { status: 409, payload: { ok: false, reason: 'SPOT_PREVIEW_JOURNAL_FULL' } };
      }
      const at = now();
      if (!Number.isSafeInteger(at) || at < 0 || at > 8.64e15) throw new Error('INVALID_SPOT_SIMULATION_CLOCK');
      const event = { action, playerId: id, terms, at };
      // The candidate can consume sequence numbers or mutate its book while filling.
      // Only swap it into the live view after the same event is durably saved.
      const candidate = restoreSpotSimulation(state);
      let result;
      try {
        result = candidate.execute(event);
      } catch (error) {
        if (error instanceof TypeError || error instanceof RangeError ||
            ['SPOT_INVALID_DECIMAL', 'SPOT_INVALID_SIDE'].includes(error?.message)) {
          return { status: 400, payload: { ok: false, reason: 'INVALID_SPOT_REQUEST' } };
        }
        if (['SPOT_INSUFFICIENT_BALANCE', 'SPOT_OPEN_ORDER_NOT_FOUND',
          'SELF_MATCH_FORBIDDEN_SAME_OWNER', 'SELF_MATCH_FORBIDDEN_SAME_CONTROLLER'].includes(error?.message)) {
          return { status: 409, payload: { ok: false, reason: error.message } };
        }
        throw error;
      }
      const next = { ...state, spot: { schema: spotSchema, journal: [...journal, event] } };
      await commit(next, candidate);
      return { status: 200, payload: { ok: true, result, replayed: false, ...candidate.market.snapshot(id) } };
    });
  }

  function submit(id, body) {
    return serial(async () => {
      if (typeof body.requestId !== 'string' || !requestKeyPattern.test(body.requestId) ||
          typeof body.axis !== 'string' || !Object.hasOwn(markets, body.axis) ||
          body.market !== markets[body.axis]) return { ok: false, reason: 'INVALID_REQUEST_OR_MARKET' };
      const { axis, market, c, side, lots, triggerPrice = null, stopPrice = null, takeProfitPrice = null } = body;
      const terms = { axis, market, c, side, lots, triggerPrice, stopPrice, takeProfitPrice };
      const key = digest(body.requestId), fingerprint = digest(JSON.stringify(terms));
      const earlier = state.players[id].requests?.[key];
      if (earlier) return earlier.fingerprint === fingerprint ?
        { ...earlier.result, replayed: true } : { ok: false, reason: 'REQUEST_CONFLICT' };

      const time = now(), status = marketView(market, time);
      if (!status.available) return { ok: false, reason: 'WAITING_VALID_QUOTE', quoteReason: status.reason };
      try { requireV1TradingC(c); } catch (error) { return { ok: false, reason: error.message }; }
      const next = structuredClone(state), player = next.players[id], quote = next.observations[market];
      // Seed a per-player observation only at admission, using the server cursor.
      const book = player.ledger.simulation ??= { sequence: 0, orders: [], positions: [], receipts: [], observations: {} };
      if (book.observations[market]?.sequence !== quote.sequence) {
        const active = book.orders.some(order => order.market === market && order.status === 'PENDING') ||
          book.positions.some(position => position.market === market && position.status === 'OPEN');
        if (active) return { ok: false, reason: 'LEDGER_CURSOR_UNVERIFIED' };
        book.observations[market] = { at: quote.updatedAt, source: quote.source, sequence: quote.sequence,
          price: quote.price, simulationOnly: true };
      }
      const result = placeSimulationOrder(player.ledger, {
        ...terms, triggerPrice: triggerPrice ?? quote.price, now: time,
      });
      if (!result.ok) return result;
      player.requests ??= {};
      player.requests[key] = { fingerprint, result };
      return updatePlayer(next, player, { ...result, replayed: false });
    });
  }

  function manage(id, body, action) {
    return serial(async () => {
      const next = structuredClone(state), player = next.players[id];
      let result;
      if (action === 'cancel') {
        result = cancelSimulationOrder(player.ledger, body.orderId);
      } else {
        const position = player.ledger.simulation?.positions.find(row => row.positionId === body.positionId);
        if (!position || position.status !== 'OPEN') return { ok: false, reason: 'POSITION_NOT_OPEN' };
        const status = marketView(position.market);
        if (!status.available || player.ledger.simulation.observations[position.market]?.sequence !==
            next.observations[position.market]?.sequence) {
          return { ok: false, reason: 'WAITING_VALID_QUOTE', quoteReason: status.reason };
        }
        result = closeSimulationPosition(player.ledger, body.positionId, { now: now() });
      }
      return result.ok ? updatePlayer(next, player, result) : result;
    });
  }

  async function staticResponse(res, path, method, privatePreview) {
    if (path === '/') {
      res.writeHead(302, { location: spotPreview ? spotUrl : gameUrl, 'cache-control': 'no-store' });
      return res.end();
    }
    if (!safeStaticPath(path, spotPreview)) return response(res, 404, { ok: false, reason: 'NOT_FOUND' });
    const type = contentTypes.get(extname(path));
    if (!type) return response(res, 404, { ok: false, reason: 'NOT_FOUND' });
    try {
      const target = await realpath(resolve(repo, '.' + path));
      const key = relative(await realpath(repo), target);
      if (key.startsWith('..' + sep) || !safeStaticPath('/' + key.split(sep).join('/'), spotPreview) ||
          !(await stat(target)).isFile()) return response(res, 404, { ok: false, reason: 'NOT_FOUND' });
      let bytes = method === 'HEAD' ? undefined : await readFile(target);
      if (bytes && privatePreview && (path === gamePath + 'game-5d.html' || spotPreview && path === spotPath)) {
        const shell = bytes.toString('utf8');
        if (!shell.includes('</head>')) throw new Error('PRIVATE_PREVIEW_SHELL_UNAVAILABLE');
        bytes = shell.replace('</head>', lanMarker + '</head>');
      }
      res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
      return res.end(bytes);
    } catch (error) {
      if (error.code !== 'ENOENT' && error.code !== 'ENOTDIR') throw error;
      return response(res, 404, { ok: false, reason: 'NOT_FOUND' });
    }
  }

  function sessionSignature(address, expires) {
    return createHmac('sha256', lan.sessionKey).update(address + ':' + expires).digest('hex');
  }

  function lanAuthorized(req) {
    const raw = (req.headers.cookie ?? '').split(';').map(item => item.trim())
      .find(item => item.startsWith(accessCookie + '='));
    const match = raw?.slice(accessCookie.length + 1).match(/^(\d{10,14})\.([a-f0-9]{64})$/);
    return !!match && Number(match[1]) > now() &&
      timingSafeEqual(Buffer.from(match[2]), Buffer.from(sessionSignature(req.socket.remoteAddress, match[1])));
  }

  async function handleLanAccess(req, res, base) {
    if (req.headers.origin !== base.origin) {
      return response(res, 403, { ok: false, reason: 'SAME_ORIGIN_REQUIRED' });
    }
    if (req.headers['content-type']?.split(';', 1)[0] !== 'application/x-www-form-urlencoded') {
      return response(res, 400, { ok: false, reason: 'INVALID_PREVIEW_ACCESS_FORM' });
    }
    const fields = new URLSearchParams(await requestBody(req));
    const requestedWorld = fields.get('world');
    const world = spotPreview && requestedWorld === 'SPOT' ? 'SPOT' :
      requestedWorld === '88888' ? '88888' : '12682';
    const code = fields.get('code') ?? '';
    if (!accessCodePattern.test(code) ||
        !timingSafeEqual(Buffer.from(digest(code)), Buffer.from(lan.expectedCode))) return lanAccessForm(res, world);
    const expiry = String(now() + accessLifetimeSeconds * 1000);
    res.writeHead(303, {
      location: world === 'SPOT' ? spotUrl : gameUrl.replace('world=12682', 'world=' + world),
      'set-cookie': `${accessCookie}=${expiry}.${sessionSignature(req.socket.remoteAddress, expiry)}; Path=/; Max-Age=${accessLifetimeSeconds}; HttpOnly; SameSite=Strict`,
      'cache-control': 'no-store',
    });
    return res.end();
  }

  async function handle(req, res, privatePreview) {
    const method = req.method;
    try {
      const host = req.headers.host ?? '';
      if (privatePreview) {
        const remote = req.socket.remoteAddress;
        if (host !== `${lan.address}:${req.socket.localPort}` || req.socket.localAddress !== lan.address ||
            !isIPv4(remote) || !privateIpv4Pattern.test(remote) || (ipv4Number(remote) & lan.mask) !== (ipv4Number(lan.address) & lan.mask)) {
          return response(res, 403, { ok: false, reason: 'PRIVATE_PREVIEW_NETWORK_REQUIRED' });
        }
        res.setHeader('referrer-policy', 'same-origin');
        res.setHeader('x-frame-options', 'DENY');
      } else if (!/^(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host)) {
        return response(res, 403, { ok: false, reason: 'LOCAL_HOST_REQUIRED' });
      }
      const base = new URL('http://' + host);
      if (req.headers.origin && req.headers.origin !== base.origin) {
        return response(res, 403, { ok: false, reason: 'SAME_ORIGIN_REQUIRED' });
      }
      const url = new URL(req.url, base);
      const path = decodeURIComponent(url.pathname);
      if (privatePreview && method === 'POST' && path === '/preview/access') return await handleLanAccess(req, res, base);
      if (privatePreview && !lanAuthorized(req)) {
        const wantsSpot = spotPreview && (path === '/' || path === spotPath);
        if (method === 'GET' && (wantsSpot || path === '/' || path === gamePath + 'game-5d.html')) {
          const world = wantsSpot ? 'SPOT' : url.searchParams.get('world') === '88888' ? '88888' : '12682';
          return lanAccessForm(res, world);
        }
        return response(res, 401, { ok: false, reason: 'PRIVATE_PREVIEW_ACCESS_REQUIRED' });
      }
      if (method === 'GET' && path === '/health') {
        return response(res, 200, { ok: true, service: 'k11520-backend', mode: 'OFFCHAIN_SIMULATION' });
      }
      if (method === 'GET' && path === '/api/v1/resources') {
        return response(res, 200, JSON.parse(await readFile(resourceManifest, 'utf8')));
      }
      if (method === 'GET' && path === '/api/v1/markets') {
        const time = now();
        return response(res, 200, {
          observations: state.observations,
          statuses: Object.fromEntries(symbols.map(market => [market, marketView(market, time)])),
        });
      }
      if (path === '/api/v1/spot' || path === '/api/v1/spot/orders' || path === '/api/v1/spot/orders/cancel') {
        if (!spotPreview) return response(res, 404, { ok: false, reason: 'NOT_FOUND' });
        const player = account(state, bearer(req));
        const id = isSpotPlayer(state, player?.id) ? player.id : null;
        if (method === 'GET' && path === '/api/v1/spot') {
          if (!id && req.headers.authorization !== undefined) {
            return response(res, 401, { ok: false, reason: 'UNAUTHORIZED' });
          }
          return response(res, 200, { ok: true, ...spot.market.snapshot(id) });
        }
        if (method === 'POST' && path !== '/api/v1/spot') {
          if (!id) return response(res, 401, { ok: false, reason: 'UNAUTHORIZED' });
          const action = path.endsWith('/cancel') ? 'cancel' : 'place';
          const { status, payload } = await submitSpot(id, action, await bodyOf(req));
          return response(res, status, payload);
        }
        return response(res, 404, { ok: false, reason: 'NOT_FOUND' });
      }
      if (method === 'POST' && path === '/api/v1/login') {
        const result = await login(req, await bodyOf(req));
        return response(res, result ? 200 : 401, result ?? { ok: false, reason: 'UNAUTHORIZED' });
      }
      if (!path.startsWith('/api/') && serveStatic && (method === 'GET' || method === 'HEAD')) {
        return await staticResponse(res, path, method, privatePreview);
      }
      const player = account(state, bearer(req));
      if (!player) return response(res, 401, { ok: false, reason: 'UNAUTHORIZED' });
      if (method === 'GET' && path === '/api/v1/player') {
        return response(res, 200, { ok: true, player: playerView(player) });
      }
      if (method === 'GET' && path === '/api/v1/orders') {
        return response(res, 200, { ...simulationSnapshot(player.ledger), ok: true });
      }
      if (method === 'PUT' && path === '/api/v1/player') {
        const params = await bodyOf(req);
        const result = await serial(async () => {
          const next = structuredClone(state), current = next.players[player.id];
          if (params.xyz) current.xyz = { x: Number(params.xyz.x) || 0, y: Number(params.xyz.y) || 0, z: Number(params.xyz.z) || 0 };
          if (Array.isArray(params.home) && params.home.length === 2) current.home = params.home.map(Number);
          return updatePlayer(next, current, { ok: true });
        });
        return response(res, 200, result);
      }
      if (method === 'POST' && ['/api/v1/order', '/api/v1/order/cancel', '/api/v1/order/close'].includes(path)) {
        const params = await bodyOf(req);
        const result = path === '/api/v1/order' ?
          await submit(player.id, params) : await manage(player.id, params, path.split('/').at(-1));
        const status = result.ok ? 200 : result.reason === 'WAITING_VALID_QUOTE' ? 503 : 409;
        return response(res, status, result);
      }
      return response(res, 404, { ok: false, reason: 'NOT_FOUND' });
    } catch (error) {
      const status = error instanceof SyntaxError || error instanceof TypeError || error instanceof RangeError ||
        error instanceof URIError ? 400 : 500;
      return response(res, status, { ok: false, reason: status === 400 ? 'INVALID_REQUEST' : 'SIMULATION_SERVER_ERROR' });
    }
  }

  const server = http.createServer((req, res) => handle(req, res, false));
  const lanServer = lan && http.createServer((req, res) => handle(req, res, true));
  const bind = (listener, address, port) => new Promise((resolveListen, reject) => {
    listener.once('error', reject);
    listener.listen(port, address, () => {
      listener.removeListener('error', reject);
      resolveListen();
    });
  });
  const stopListener = listener => new Promise((resolveClose, reject) =>
    listener.close(error => error ? reject(error) : resolveClose()));

  async function listen({ port = 11520 } = {}) {
    await bind(server, '127.0.0.1', port);
    try {
      if (lanServer) await bind(lanServer, lan.address, server.address().port);
    } catch (error) {
      await stopListener(server);
      throw error;
    }
    if (pollIntervalMs > 0) {
      void poll();
      loop = setInterval(() => { void poll(); }, pollIntervalMs);
    }
    return server.address();
  }

  async function close() {
    closed = true;
    if (loop !== null) clearInterval(loop);
    await Promise.all(pendingPolls.values());
    await tail;
    await Promise.all([server, lanServer].filter(listener => listener?.listening).map(stopListener));
  }

  return { server, poll, listen, close };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const lanAddress = process.env.K11520_PREVIEW_LAN_ADDRESS;
  const lanCode = process.env.K11520_PREVIEW_LAN_CODE;
  const app = await createK11520Server({
    spotPreview: process.env.K11520_SPOT_PREVIEW === '1',
    dataFile: process.env.K11520_PREVIEW_DATA_FILE || undefined,
    lanPreview: lanAddress || lanCode ? { address: lanAddress, accessCode: lanCode } : null,
  });
  const address = await app.listen({ port: Number(process.env.PORT || 11520) });
  console.log('K11520 local simulation preview: http://' + address.address + ':' + address.port + '/');
  if (lanAddress) console.log('K11520 private Wi-Fi preview: http://' + lanAddress + ':' + address.port + '/');
}
