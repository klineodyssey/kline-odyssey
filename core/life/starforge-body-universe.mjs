import { invariant } from "../shared/errors.mjs";

export const STARFORGE_BODY_UNIVERSE = Object.freeze({
  life_id: "LIFE-KAIOS-STARFORGE-0001", birth_universe_layer: "B4",
  map_reference_exponent: 4, body_map_scale_exponent: -8, body_map_scale: "0.00000001",
  reference_display_price_usd_per_kgen: "0.0002524", price_floor: -4, price_alpha: "2.524",
  market_pair: "KGEN/WBNB", pair_address: "0xf36640d7327b53ba3d7fcc1d98dfc1b85574b6c2",
  pair_price_unit: "WBNB_PER_KGEN", display_price_unit: "USD_PER_KGEN",
  stable_quote_meter: "USDT_PER_KGEN", official_kgen_usdt_pair: null
});

export function mapStarforgeBodyCoordinate(value) {
  const text=String(value); invariant(/^-?\d+$/.test(text),"BODY_COORDINATE_INTEGER_REQUIRED","K coordinate must be an integer");
  const n=BigInt(text); if(n===0n) return "0"; const sign=n<0n?"-":""; const a=n<0n?-n:n;
  const whole=a/100000000n, fraction=(a%100000000n).toString().padStart(8,"0");
  return `${sign}${whole}.${fraction}`;
}

export function resolveStablePriceLayer(price) {
  const p=Number(price); invariant(Number.isFinite(p)&&p>0,"DISPLAY_PRICE_INVALID","USD/USDT display price must be positive");
  const floor=Math.floor(Math.log10(p)); const alpha=p/(10**floor);
  return Object.freeze({ price_floor:floor, price_alpha:Number(alpha.toFixed(12)), universe_layer:floor<0?`B${Math.abs(floor)}`:`L${floor}` });
}
