import assert from 'node:assert/strict';
import { NaiheVault, K4168_CANON } from './naihe-vault.mjs';

const vault = new NaiheVault({
  minimumReserve: { KGEN: 100, KAIOS: 50 },
  dailyOutflowCap: { KGEN: 500, KAIOS: 200 },
});

assert.equal(K4168_CANON.nodeId, 'K4168');
assert.equal(K4168_CANON.keeperNpc, '孟婆');
assert.deepEqual(K4168_CANON.waterAssets, ['KGEN', 'KAIOS']);

vault.deposit({ asset: 'KGEN', amount: 1000, source: 'HUA_GUO_SHAN', receiptId: 'r-kgen-1', replayKey: 'dep-kgen-1' });
vault.deposit({ asset: 'KAIOS', amount: 500, source: 'HUA_GUO_SHAN', receiptId: 'r-kaios-1', replayKey: 'dep-kaios-1' });
assert.equal(vault.snapshot().balance.KGEN, 1000);
assert.equal(vault.snapshot().balance.KAIOS, 500);

const drink = vault.requestDrink({ lifeId: 'LIFE-TEST-1', asset: 'KAIOS', amount: 25, eventId: 'drink-1', replayKey: 'drink-key-1' });
assert.equal(drink.status, 'ENTITLEMENT_APPROVED_PENDING_SETTLEMENT_RECEIPT');
assert.equal(vault.snapshot().balance.KAIOS, 475);

const conversion = vault.convertMatter({ lifeId: 'LIFE-TEST-2', inputAsset: 'KGEN', amount: 50, eventId: 'convert-1', replayKey: 'convert-key-1', darkMatterRate: 0.5 });
assert.equal(conversion.darkMatterEntitlement, 25);
assert.equal(conversion.status, 'ENTITLEMENT_ONLY_PENDING_VERIFIED_CONVERSION_RECEIPT');

const reserveHold = vault.requestDrink({ lifeId: 'LIFE-TEST-3', asset: 'KAIOS', amount: 450, eventId: 'drink-2', replayKey: 'drink-key-2' });
assert.equal(reserveHold.status, 'HOLD_MINIMUM_RESERVE');

assert.throws(() => vault.deposit({ asset: 'KGEN', amount: 1, source: 'HUA_GUO_SHAN', receiptId: 'r2', replayKey: 'dep-kgen-1' }), /REPLAY_BLOCKED/);
assert.throws(() => vault.requestDrink({ lifeId: 'LIFE-X', asset: 'BNB', amount: 1, eventId: 'x', replayKey: 'x' }), /UNSUPPORTED_ASSET/);

console.log('K4168_NAIHE_VAULT_TEST=PASS');
