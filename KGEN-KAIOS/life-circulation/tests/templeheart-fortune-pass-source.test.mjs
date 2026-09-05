import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../../..");
const source = fs.readFileSync(path.join(repo, "KGEN", "contracts", "KGEN_TempleHeart_Upgradeable.sol"), "utf8");
const fortuneStart = source.indexOf("function fortuneClaim(bytes32 proofId)");
const fortuneEnd = source.indexOf("function voluntaryRepayFortune", fortuneStart);
const fortuneSource = source.slice(fortuneStart, fortuneEnd);

test("TempleHeart declares the exact raw 1 KGEN Fortune pass", () => {
  assert.match(source, /MIN_FORTUNE_KGEN_PASS_RAW\s*=\s*1_000_000_000_000_000_000;/u);
  assert.match(source, /HEARTBEAT_REWARD_WHOLE\s*=\s*1;/u);
  assert.match(source, /IGNITE_REWARD_WHOLE\s*=\s*8;/u);
  assert.match(source, /fortuneMinWhole\s*=\s*1;/u);
  assert.match(source, /fortuneMaxWhole\s*=\s*8;/u);
  assert.match(source, /heartbeatMaxClaimsPerHour\s*=\s*88;/u);
  assert.match(source, /igniteMaxClaimsPerDay\s*=\s*88;/u);
});

test("the claimant balance is read and rejected before Fortune state or payout", () => {
  const balanceRead = fortuneSource.indexOf("kgen.balanceOf(msg.sender)");
  const thresholdCheck = fortuneSource.indexOf("FortuneKgenPassRequired");
  const proofConsumed = fortuneSource.indexOf("fortuneBurnProofConsumed[proofId] = true");
  const payout = fortuneSource.indexOf("kgen.safeTransfer(msg.sender, rewardAmount)");
  assert.ok(balanceRead >= 0);
  assert.ok(balanceRead < thresholdCheck);
  assert.ok(thresholdCheck < proofConsumed);
  assert.ok(proofConsumed < payout);
});

test("fortuneClaim cannot burn, seize, lock, approve, or pull the 1 KGEN pass", () => {
  assert.doesNotMatch(fortuneSource, /\.burn\(|safeTransferFrom|\.approve\(|\b(?:seize|lock|escrow)\b/iu);
  assert.equal((fortuneSource.match(/kgen\.safeTransfer\(/gu) ?? []).length, 1);
  assert.match(fortuneSource, /kgen\.safeTransfer\(msg\.sender, rewardAmount\)/u);
});
