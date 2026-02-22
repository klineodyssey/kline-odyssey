/* ============================================================
   KLINE Odyssey — Universe Candle Engine
   File: K線西遊記/engine/kline_engine_v1_0.js
   Version: V1.0.0 (Deterministic / Seeded / No real market)
   ============================================================

   Design goals:
   - Deterministic candle generation (same seed => same candle)
   - Uses "Universe Map" inputs (CT, flow, volatility, events)
   - Produces OHLC + meta (seed, drift, range, wick) for verification
   - Can be extended later to integrate Brain/Heart/Mars event signals

   Public API:
   - UniverseEngine.loadParams(url) -> params
   - UniverseEngine.create(seedStr, params) -> engine
   - engine.nextCandle(input) -> { candle, state }
   - UniverseEngine.settleBet(bet, candle, params) -> settlement result

   NOTE:
   - This is NOT investment advice. It's a universe simulation engine.
*/

(function(global){

  // ---------- Utilities ----------
  function clamp(x, a, b){ return Math.max(a, Math.min(b, x)); }
  function lerp(a, b, t){ return a + (b - a) * t; }

  // FNV-1a 32-bit hash for stable seed -> uint32
  function fnv1a32(str){
    let h = 0x811c9dc5;
    for(let i=0;i<str.length;i++){
      h ^= str.charCodeAt(i);
      h = (h + ((h<<1) + (h<<4) + (h<<7) + (h<<8) + (h<<24))) >>> 0;
    }
    return h >>> 0;
  }

  // xorshift32 PRNG (deterministic)
  function XorShift32(seedU32){
    let x = seedU32 >>> 0;
    return {
      nextU32(){
        x ^= (x << 13) >>> 0;
        x ^= (x >>> 17) >>> 0;
        x ^= (x << 5) >>> 0;
        return x >>> 0;
      },
      nextFloat(){
        // [0,1)
        return (this.nextU32() >>> 0) / 4294967296;
      }
    };
  }

  function nowUTCISO(){
    return new Date().toISOString();
  }

  // ---------- Engine ----------
  function normalizeInput(input){
    // CT: [-1..+1] 方向（多空）
    // flow: [-1..+1] 資金流/拔河結果（多空）
    // vol: [0..1] 波動
    // events: { ignite:boolean, heartbeat:boolean, payroll:boolean, wishTrigger:boolean, split:boolean }
    const out = Object.assign({
      ct: 0,
      flow: 0,
      vol: 0.35,
      // you can pass price anchor to "feel like a map coordinate" (not real market)
      anchor: 30000,
      // per candle step id/time
      t: nowUTCISO(),
      events: {}
    }, input || {});

    out.ct = clamp(Number(out.ct || 0), -1, 1);
    out.flow = clamp(Number(out.flow || 0), -1, 1);
    out.vol = clamp(Number(out.vol ?? 0.35), 0, 1);
    out.anchor = Number(out.anchor || 30000);

    out.events = Object.assign({
      ignite:false,
      heartbeat:false,
      payroll:false,
      wishTrigger:false,
      split:false
    }, out.events || {});

    return out;
  }

  function buildEventVolBoost(events, params){
    // 波動加成：事件越多 => V 越大（可調）
    // 這裡只做最小可用版本：用 weights 乘上事件布林
    const w = (params && params.volatilityWeights) || {};
    let boost = 0;

    if(events.ignite)      boost += Number(w.ignite ?? 0.15);
    if(events.heartbeat)   boost += Number(w.heartbeat ?? 0.05);
    if(events.payroll)     boost += Number(w.rollPayroll ?? 0.10);
    if(events.split)       boost += Number(w.split ?? 0.08);
    if(events.wishTrigger) boost += Number(w.wishTrigger ?? 0.25);

    return clamp(boost, 0, 1.5); // 允許超過 1，代表「神級波動」
  }

  function defaultParams(){
    return {
      version: "V1.0.0",
      baseRange: 300, // base candle range in "KGEN points"
      weights: { ct: 0.6, flow: 0.4 },
      volatility: { kV: 1.0, kN: 0.6 },
      wick: { min: 0.12, max: 0.55 },
      drift: { maxAbs: 0.85 }, // drift normalized clamp
      payout: {
        bonusClamp: { min: 0.30, max: 0.90 },
        lossClamp:  { min: 0.60, max: 1.00 },
        drawRefund: 0.90
      },
      volatilityWeights: {
        ignite: 0.15,
        heartbeat: 0.05,
        rollPayroll: 0.10,
        split: 0.08,
        wishTrigger: 0.25
      }
    };
  }

  function UniverseEngine(seedStr, params){
    const P = Object.assign(defaultParams(), params || {});
    const seedU32 = fnv1a32(String(seedStr || "KLINE_GENESIS"));
    const rng = XorShift32(seedU32);

    // internal state
    const state = {
      version: P.version,
      seedStr: String(seedStr || "KLINE_GENESIS"),
      seedU32,
      step: 0,
      lastClose: null,
      lastAnchor: null
    };

    function nextCandle(input){
      const I = normalizeInput(input);
      state.step += 1;

      // ---- Anchor & open ----
      const anchor = I.anchor; // map coordinate anchor (not real market)
      const open = (state.lastClose == null) ? anchor : state.lastClose;

      // ---- Drift (direction) ----
      // tug-of-war result:
      const tug = (P.weights.ct * I.ct) + (P.weights.flow * I.flow); // [-1..1]
      const driftN = clamp(tug, -P.drift.maxAbs, P.drift.maxAbs);    // normalized drift

      // ---- Volatility / Range ----
      // baseRange scaled by vol and event boosts + slight noise
      const eventBoost = buildEventVolBoost(I.events, P);
      const noise = (rng.nextFloat() * 2 - 1); // [-1..1]
      const v = clamp(I.vol * P.volatility.kV + eventBoost * P.volatility.kN, 0, 2.0);

      const rawRange = P.baseRange * (0.65 + 0.85 * v) * (0.90 + 0.20 * Math.abs(noise));
      const range = Math.max(10, rawRange); // 최소 범위

      // ---- Close ----
      // drift controls where close lands in candle body
      const bodyBias = (driftN + (noise * 0.20)); // [-1.2..1.2]
      const close = open + (bodyBias * (range * 0.45)); // body uses part of range

      // ---- Wick ----
      const wickMin = clamp(P.wick.min, 0, 1);
      const wickMax = clamp(P.wick.max, wickMin, 1);

      // wickFactor depends on volatility and randomness
      const wickFactor = lerp(wickMin, wickMax, clamp(v/2.0, 0, 1)) * (0.75 + 0.5 * rng.nextFloat());

      const hi = Math.max(open, close) + range * wickFactor;
      const lo = Math.min(open, close) - range * wickFactor;

      // ---- Save state ----
      state.lastClose = close;
      state.lastAnchor = anchor;

      const candle = {
        t: I.t,
        step: state.step,
        seedStr: state.seedStr,
        seedU32: state.seedU32,
        input: {
          ct: I.ct, flow: I.flow, vol: I.vol, anchor: I.anchor,
          events: Object.assign({}, I.events)
        },
        meta: {
          tug,
          driftN,
          volatilityV: v,
          eventBoost,
          noise
        },
        o: open,
        h: hi,
        l: lo,
        c: close
      };

      return { candle, state: Object.assign({}, state) };
    }

    return { params: P, state, nextCandle };
  }

  // ---------- Settlement (for WishPool / bet game) ----------
  // bet: { side:"LONG"|"SHORT", amount:number, entry:number, ctPrice?:number }
  // candle: {o,h,l,c}
  function settleBet(bet, candle, params){
    const P = Object.assign(defaultParams(), params || {});
    const side = String((bet && bet.side) || "").toUpperCase();
    const amount = Number((bet && bet.amount) || 0);
    const entry = Number((bet && bet.entry) || candle.o);

    if(!(side==="LONG" || side==="SHORT")) return { ok:false, reason:"BAD_SIDE" };
    if(!(amount>0)) return { ok:false, reason:"BAD_AMOUNT" };

    // define win if direction matches candle close vs entry
    const dir = (candle.c - entry);
    const win = (side==="LONG" && dir>0) || (side==="SHORT" && dir<0);
    const draw = (dir===0);

    const absMove = Math.abs(dir);
    const range = Math.max(1, (candle.h - candle.l));

    // trend strength T based on how close close is to extremes
    const posInRange = clamp((candle.c - candle.l) / range, 0, 1); // 0..1
    const T = (side==="LONG") ? posInRange : (1 - posInRange);     // more extreme => stronger

    // payout curve
    const bonusMin = P.payout.bonusClamp.min;
    const bonusMax = P.payout.bonusClamp.max;
    const lossMin  = P.payout.lossClamp.min;
    const lossMax  = P.payout.lossClamp.max;

    // also scale by normalized move size
    const moveFactor = clamp(absMove / (range * 0.60), 0, 1); // 0..1
    const strength = clamp(0.35 + 0.65 * (0.5*T + 0.5*moveFactor), 0, 1);

    if(draw){
      const refund = amount * P.payout.drawRefund;
      return {
        ok:true, result:"DRAW",
        amountIn: amount,
        payout: refund,
        delta: refund - amount,
        debug: { dir, range, T, moveFactor, strength }
      };
    }

    if(win){
      const bonusRate = lerp(bonusMin, bonusMax, strength); // 0.30..0.90
      const payout = amount * (1 + bonusRate);
      return {
        ok:true, result:"WIN",
        amountIn: amount,
        payout,
        delta: payout - amount,
        bonusRate,
        debug: { dir, range, T, moveFactor, strength }
      };
    }else{
      const lossRate = lerp(lossMax, lossMin, strength); // 1.00..0.60 (strong trend => lose more)
      const payout = amount * (1 - lossRate);
      return {
        ok:true, result:"LOSE",
        amountIn: amount,
        payout,
        delta: payout - amount,
        lossRate,
        debug: { dir, range, T, moveFactor, strength }
      };
    }
  }

  // ---------- Loader ----------
  async function loadParams(url){
    const r = await fetch(url, { cache:"no-store" });
    if(!r.ok) throw new Error("Failed to load params: " + r.status);
    return await r.json();
  }

  global.UniverseEngine = {
    defaultParams,
    loadParams,
    create: (seedStr, params)=> UniverseEngine(seedStr, params),
    settleBet
  };

})(window);
