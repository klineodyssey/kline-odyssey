import assert from 'node:assert/strict';
import { NaiheLifeReservoir, K4168_CANON } from './naihe-vault.mjs';

const vault = new NaiheLifeReservoir({
  minimumReserveBNB: 0.01,
  dailyOutflowCapBNB: 0.001,
  targetActivationBNB: 0.00005,
  maxActivationBNB: 0.0001,
});

assert.equal(K4168_CANON.bridgeId, 'K4168');
assert.equal(K4168_CANON.reservoirRole, 'SEPARATE_FROM_BRIDGE');
assert.equal(K4168_CANON.keeperNpc, '孟婆');
assert.equal(K4168_CANON.soupAsset, 'BNB');
assert.deepEqual(K4168_CANON.identityAssets, ['KGEN', 'KAIOS']);

vault.depositBNB({ amount: 0.02, source: 'HUA_GUO_SHAN', receiptId: 'bnb-in-1', replayKey: 'dep-bnb-1' });
assert.equal(vault.snapshot().balanceBNB, 0.02);

const identity = vault.assessIdentity({
  lifeId: 'LIFE-TEST-1',
  wallet: '0x111',
  walletControlVerified: true,
  kgenBalance: 1,
  kaiosBalance: 0,
  civilizationActivity: 1,
});
assert.equal(identity.decision, 'ALLOW');
assert.equal(identity.holdingEvidence, true);

const soup = vault.requestMengPoSoup({
  lifeId: 'LIFE-TEST-1',
  wallet: '0x111',
  currentBNB: 0,
  identity,
  eventId: 'soup-1',
  replayKey: 'soup-key-1',
});
assert.equal(soup.asset, 'BNB');
assert.equal(soup.amountBNB, 0.00005);
assert.equal(soup.purpose, 'LIFE_MINIMUM_GAS');
assert.equal(soup.status, 'ENTITLEMENT_APPROVED_PENDING_SETTLEMENT_RECEIPT');

const enoughAlready = vault.requestMengPoSoup({
  lifeId: 'LIFE-TEST-2',
  wallet: '0x222',
  currentBNB: 0.00005,
  identity: { decision: 'ALLOW' },
  eventId: 'soup-2',
  replayKey: 'soup-key-2',
});
assert.equal(enoughAlready.status, 'NO_SOUP_NEEDED');

const extractive = vault.assessIdentity({
  lifeId: 'LIFE-ALIEN-1',
  wallet: '0x333',
  walletControlVerified: true,
  extractiveHistory: true,
  civilizationActivity: 0,
});
assert.equal(extractive.decision, 'QUARANTINE');
assert.equal(extractive.reason, 'EXTERNAL_EXTRACTIVE_VISITOR_RISK');

const denied = vault.requestMengPoSoup({
  lifeId: 'LIFE-ALIEN-1',
  wallet: '0x333',
  currentBNB: 0,
  identity: extractive,
  eventId: 'soup-3',
  replayKey: 'soup-key-3',
});
assert.equal(denied.status, 'DENIED_IDENTITY_GATE');

vault.rememberLife({ lifeId: 'LIFE-RETURN-1', wallet: '0x444', outcome: 'WORKED', reason: 'CIVILIZATION_ACTIVITY', evidenceId: 'work-1' });
const returning = vault.assessIdentity({
  lifeId: 'LIFE-RETURN-1',
  wallet: '0x444',
  walletControlVerified: true,
  civilizationActivity: 2,
});
assert.equal(returning.decision, 'ALLOW');
assert.equal(returning.previousLifeRecords, 1);

const conversion = vault.convertMatter({
  lifeId: 'LIFE-TEST-1',
  materialType: 'RESOURCE_MATTER',
  materialAmount: 50,
  eventId: 'convert-1',
  replayKey: 'convert-key-1',
  conversionRate: 0.5,
});
assert.equal(conversion.darkMatterEntitlement, 25);
assert.equal(conversion.status, 'ENTITLEMENT_ONLY_PENDING_VERIFIED_CONVERSION_RECEIPT');

assert.throws(() => vault.depositBNB({ amount: 1, source: 'HUA_GUO_SHAN', receiptId: 'r2', replayKey: 'dep-bnb-1' }), /REPLAY_BLOCKED/);
assert.equal(K4168_CANON.povertyRule, 'POVERTY_IS_NOT_FAILURE_AND_SOUP_IS_NOT_WEALTH_GRANT');

console.log('K4168_NAIHE_VAULT_TEST=PASS');
