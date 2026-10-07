/*
KGEN_META
VERSION: V1
REVISION: 2026-10-07.RECOVERY_VERIFY_FEEDBACK.1
STATUS: DRAFT
LAST_UPDATED: 2026-10-07
UPDATED_BY: dot / TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER / HUMAN_AUTHORIZED_2026_10_05
REVIEWED_BY: dot (bounded source/probe self-review; exact-head CI and visual review pending)
SOURCE_COMMIT: eacb58a4004495f0675e09e260ccd9f09e66fb6d
TASK_ID: RECOVERY-VERIFY-FEEDBACK-20261007
CHANGE_REASON: Retain preserved async caller protections and fence an older failed Verify response from replacing newer page feedback.
ANCESTOR: Preserved Recovery PR #521 at eacb58a4, integrated with main f7f67950; existing Recovery V1 and 2cdf30d5 seam.
SOURCE_OF_TRUTH: FALSE
Changelog: KAIOS/backend/README.md. Legacy-only review candidate; no canonical authority promotion.
*/
import {
  createLocalPlayerStore,
  PLAYER_LIFE_SCHEMA,
  PLAYER_LIFE_SCOPE,
} from "../../../K線西遊記/temples/11520/runtime/player-life-runtime.mjs";
import { createPlayerCloudSync } from "../../../K線西遊記/temples/11520/runtime/player-cloud-sync.mjs";
let recoveryStart, recoveryStoreFactory;

// Awaitable caller contract only. The default remains the legacy owner; this
// seam does not admit canonical storage, migration or restore authority.
export function startRecoveryCenter({
  storeFactory = createLocalPlayerStore,
} = {}) {
  if (recoveryStart) {
    if (storeFactory !== recoveryStoreFactory)
      throw new Error("RECOVERY_CENTER_ALREADY_STARTED");
    return recoveryStart;
  }
  recoveryStoreFactory = storeFactory;
  recoveryStart = Promise.resolve().then(async () => {
    const createLegacyStore = () => storeFactory({ storage: localStorage });
const $ = (id) => document.getElementById(id);
let local = await createLegacyStore(),
  current,
  preview,
  cloud,
  activeId,
  allowDemo = false;
const health = {
  HEALTHY: "健康，備份可用",
  STALE: "較久未同步",
  CONFLICT: "版本衝突：已保留兩份資料",
  CORRUPTED: "備份損壞，請選其他版本",
  MIGRATION_REQUIRED: "需要資料版本轉換",
  RECOVERY_AVAILABLE: "可以建立或載入旅程",
};
const date = (t) => (t ? new Date(t).toLocaleString("zh-TW") : "尚無");
const message = (t) => {
  $("message").textContent = t;
};
async function api(path, body) {
  const r = await fetch("/api/v1" + path, {
    method: body ? "POST" : "GET",
    credentials: "same-origin",
    headers: body
      ? {
          "content-type": "application/json",
          "idempotency-key": crypto.randomUUID(),
        }
      : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (
    r.status === 404 ||
    !r.headers.get("content-type")?.includes("application/json")
  )
    throw new Error("BACKEND_NOT_CONFIGURED");
  const data = await r.json();
  if (!r.ok) throw new Error(data.code ?? data.status ?? "服務暫時無法使用");
  return data;
}
function button(label, fn) {
  const b = document.createElement("button");
  b.textContent = label;
  b.addEventListener("click", () => run(fn));
  return b;
}
let generation = 0;
const selectedId = (store) => store.activePlayer()?.playerId ?? null;
function assertGeneration(context) {
  if (context.generation !== generation || local !== context.store)
    throw new Error("RECOVERY_SUPERSEDED");
}
function assertContext(context, expectedPlayer = context.playerId) {
  assertGeneration(context);
  if (selectedId(context.store) !== expectedPlayer)
    throw new Error("RECOVERY_PLAYER_CHANGED");
}
async function acknowledged(
  context,
  completion,
  expectedPlayer = context.playerId,
) {
  const result = await completion;
  assertContext(context, expectedPlayer);
  context.playerId = expectedPlayer;
  return result;
}
// An explicit reread may adopt a different prepared selection. This flag is
// not a freshness witness for other writers or a future canonical authority.
function adoptPreparedStore(context, prepared, { freshRead = false } = {}) {
  assertGeneration(context);
  if (!freshRead) {
    assertContext(context);
    if (selectedId(prepared) !== context.playerId)
      throw new Error("RECOVERY_PLAYER_CHANGED");
  }
  local = context.store = prepared;
  context.playerId = selectedId(prepared);
}
// A newer action fences presentation and subsequent work. It cannot cancel or
// undo a local/server operation that was already submitted to its existing owner.
async function run(fn) {
  const context = {
    generation: ++generation,
    store: local,
    playerId: selectedId(local),
  };
  try {
    await fn(context);
  } catch (e) {
    if (
      e.message === "RECOVERY_SUPERSEDED" ||
      context.generation !== generation
    )
      return;
    message(
      {
        RECOVERY_ACCOUNT_CHANGED:
          "Account 已變更。請切回原本 Account 後重新整理。",
        RECOVERY_PLAYER_CHANGED:
          "本機玩家已變更。請重新整理並確認儲存結果後再繼續。",
        CONFLICT: "版本衝突，兩份資料已保存。請先檢查雲端版本。",
        STALE_RESTORE: "版本已更新，請重新預覽。",
        CORRUPTED: "備份損壞，已拒絕恢復。",
        AUTH_REQUIRED: "請先登入。",
        ACCOUNT_AUTH_REQUIRED: "請先登入 Account。",
        SESSION_EXPIRED: "登入已過期，請重新簽章。",
        BACKEND_NOT_CONFIGURED: "雲端服務尚未配置，本機旅程仍可使用。",
      }[e.message] ?? e.message,
    );
  }
}
async function refresh(context, { freshRead = false, expectedPlayerId } = {}) {
  if (freshRead) assertGeneration(context);
  else assertContext(context);
  const prepared = await createLegacyStore();
  adoptPreparedStore(context, prepared, { freshRead });
  const me = await acknowledged(context, api("/player/me"));
  assertContext(context);
  if (expectedPlayerId !== undefined && me.playerId !== expectedPlayerId)
    throw new Error("RECOVERY_ACCOUNT_CHANGED");
  const next = await acknowledged(context, api("/player/state"));
  assertContext(context);
  if (next.state && next.state.player.playerId !== me.playerId)
    throw new Error("WRONG_PLAYER");
  const own = prepared.activePlayer();
  const nextCloud =
    own?.playerId === me.playerId
      ? createPlayerCloudSync({
          localStore: prepared,
          storage: localStorage,
        })
      : null;
  if (nextCloud) {
    await acknowledged(context, nextCloud.refresh());
    assertContext(context);
  }
  const list = await acknowledged(context, api("/backups"));
  assertContext(context);
  // Server responses are detached projections, published only for this context.
  activeId = me.playerId;
  current = next;
  cloud = nextCloud;
  $("dashboard").hidden = false;
  $("login").hidden = true;
  $("identity").textContent = "Player Life " + activeId;
  $("health").textContent = health[current.health] ?? current.health;
  $("revision").textContent = current.revision;
  $("lastSync").textContent = date(current.updatedAt);
  $("lastBackup").textContent = date(current.lastBackup?.createdAt);
  $("progress").textContent = current.state
    ? `等級 ${current.state.player.level} · XP ${current.state.player.xp} · 世界 ${current.state.player.lastWorld}`
    : "尚未同步旅程";
  $("apply").hidden = !current.state;
  $("conflict").hidden = !current.conflict;
  if (current.conflict) {
    const c = current.conflict;
    $("conflictSummary").textContent =
      `雲端版本 ${c.currentRevision}：等級 ${c.currentState.player.level}，XP ${c.currentState.player.xp}；本機候選（基於版本 ${c.baseRevision}）：等級 ${c.candidateState.player.level}，XP ${c.candidateState.player.xp}。`;
  }
  if (cloud && ["CONFLICT", "REMOTE_NEWER"].includes(cloud.status().status))
    $("health").textContent = "本機與雲端版本不同：請檢查後明確選擇版本";
  $("sync").disabled = !cloud;
  $("snapshots").replaceChildren();
  for (const s of list.snapshots) {
    const li = document.createElement("li"),
      p = document.createElement("p"),
      detail = document.createElement("p");
    p.textContent = `版本 ${s.sourceRevision} · ${date(s.createdAt)}`;
    detail.textContent =
      {
        manual: "手動備份",
        sync: "同步備份",
        "pre-restore": "恢復前保護備份",
        "pre-migration": "轉換前備份",
        milestone: "旅程里程碑",
        "import-candidate": "匯入候選",
        "conflict-candidate": "衝突候選保護備份",
      }[s.reason] ?? s.reason;
    li.append(
      p,
      detail,
      button("驗證備份", async (context) => {
        const v = await acknowledged(
          context,
          api("/backups/" + s.snapshotId + "/verify"),
        );
        assertContext(context);
        message(health[v.status] ?? v.status);
      }),
      button("恢復預覽", (context) =>
        showPreview({ snapshotId: s.snapshotId }, context),
      ),
      button("匯出", async (context) => {
        const pkg = await acknowledged(
          context,
          api("/backups/" + s.snapshotId + "/export"),
        );
        assertContext(context);
        const a = document.createElement("a"),
          url = URL.createObjectURL(
            new Blob([JSON.stringify(pkg, null, 2)], {
              type: "application/json",
            }),
          );
        a.href = url;
        a.download = "KAIOS-Player-Backup-" + s.snapshotId + ".json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }),
    );
    $("snapshots").append(li);
  }
}
async function showPreview(source, context) {
  assertContext(context);
  const nextPreview = await acknowledged(
    context,
    api("/recovery/preview", {
      ...source,
      baseRevision: current.revision,
    }),
  );
  assertContext(context);
  preview = nextPreview;
  $("preview").hidden = false;
  $("confirm").checked = false;
  $("restore").disabled = true;
  const a = preview.summary.current,
    b = preview.summary.candidate;
  $("summary").textContent =
    `目前：等級 ${a.level} / XP ${a.xp} / 世界 ${a.lastWorld}；恢復後：等級 ${b.level} / XP ${b.xp} / 世界 ${b.lastWorld}。位置 ${`X ${a.lastXYZ.x}、Y ${a.lastXYZ.y}、Z ${a.lastXYZ.z}`} → ${`X ${b.lastXYZ.x}、Y ${b.lastXYZ.y}、Z ${b.lastXYZ.z}`}`;
  $("preview").scrollIntoView({ behavior: "smooth", block: "start" });
}
let enrollmentSecret, verificationFlight, savedRecoveryCodes;
const newSecret = () =>
  Array.from(crypto.getRandomValues(new Uint8Array(32)), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
async function finishAccount(data, context) {
  assertContext(context);
  const me = await acknowledged(context, api("/account/me"));
  assertContext(context);
  if (me.accountId !== data.accountId)
    throw new Error("RECOVERY_ACCOUNT_CHANGED");
  let expectedPlayerId = me.playerId;
  if (!me.playerId) {
    const enrollment = await acknowledged(
      context,
      api("/account/life/enroll", {}),
    );
    assertContext(context);
    if (
      enrollment.accountId !== data.accountId ||
      enrollment.playerId !== enrollment.initialPlayer?.playerId
    )
      throw new Error("RECOVERY_ACCOUNT_CHANGED");
    expectedPlayerId = enrollment.playerId;
    await acknowledged(
      context,
      local.importPlayer(
        JSON.stringify({
          schema: PLAYER_LIFE_SCHEMA,
          scope: PLAYER_LIFE_SCOPE,
          player: enrollment.initialPlayer,
        }),
        { confirmLocalCandidate: true },
      ),
      enrollment.initialPlayer.playerId,
    );
    assertContext(context);
    const sync = createPlayerCloudSync({
      localStore: local,
      storage: localStorage,
    });
    await acknowledged(context, sync.enqueue());
    assertContext(context);
    await acknowledged(context, sync.flush());
  }
  await refresh(context, { expectedPlayerId });
  assertContext(context);
  message(
    "已登入 Account。復原碼只顯示這一次，請下載並離線保存；Email 不是高強度 MFA。",
  );
}
async function requestEmail(context) {
  assertContext(context);
  enrollmentSecret = newSecret();
  await acknowledged(
    context,
    api("/account/email/request", {
      email: $("email").value,
      purpose: $("emailPurpose").value,
      browserSecret: enrollmentSecret,
    }),
  );
  assertContext(context);
  message(
    "若符合條件，驗證信將送出。請在此瀏覽器確認；正式 Email provider 尚未配置。",
  );
}
function verifyEmail() {
  // A verification token is one-use. Join before starting another UI action;
  // successful authentication output is not a disposable presentation result.
  if (verificationFlight) return verificationFlight;
  const requestGeneration = generation;
  const origin = { store: local, playerId: selectedId(local) };
  const request = {
    token: $("emailToken").value,
    purpose: $("emailPurpose").value,
    browserSecret: enrollmentSecret,
    recoveryCode: $("recoveryCode").value || undefined,
  };
  verificationFlight = (async () => {
    const data = await api("/account/email/verify", request);
    if (typeof data.accountId !== "string" || !data.accountId)
      throw new Error("RECOVERY_ACCOUNT_CHANGED");
    const codes =
      data.recoveryCodes ?? (data.recoveryCode ? [data.recoveryCode] : []);
    if (codes.length)
      savedRecoveryCodes = { accountId: data.accountId, codes: [...codes] };
    // Preserve the originating Account's one-time result in page memory even if
    // a newer view or Player selection prevents local enrollment follow-through.
    if ($("emailToken").value === request.token) $("emailToken").value = "";
    if ($("recoveryCode").value === (request.recoveryCode ?? ""))
      $("recoveryCode").value = "";
    await run(async (context) => {
      if (
        selectedId(origin.store) !== origin.playerId ||
        context.playerId !== origin.playerId
      )
        throw new Error("RECOVERY_PLAYER_CHANGED");
      await finishAccount(data, context);
    });
  })()
    .catch((error) => {
      // No secret values are displayed or persisted. Failures cannot clear an
      // earlier successful result; Account matching is checked again on download.
      // An older failure must not replace feedback from a newer page action.
      if (requestGeneration !== generation) return;
      message(
        error.message === "RECOVERY_ACCOUNT_CHANGED"
          ? "Account 已變更。請切回原本 Account 後重新整理。"
          : error.message,
      );
    })
    .finally(() => {
      verificationFlight = null;
    });
  return verificationFlight;
}
async function login(demo, context) {
  assertContext(context);
  if (demo) {
    if (!allowDemo) throw new Error("本機測試未啟用");
    $("email").value = "demo-" + crypto.randomUUID() + "@example.test";
    $("emailPurpose").value = "signup";
    await requestEmail(context);
    assertContext(context);
    const response = await acknowledged(context, fetch("/__test/mail"));
    assertContext(context);
    const messages = await acknowledged(context, response.json());
    assertContext(context);
    $("emailToken").value = messages.findLast(
      (m) => m.to === $("email").value,
    ).token;
    await verifyEmail(context);
    return;
  }
  let p = local.activePlayer(),
    wallet,
    chainId;
  if (!p) throw new Error("請先登入 Account");
  if (!window.ethereum) throw new Error("請使用支援錢包的瀏覽器。");
  [wallet] = await acknowledged(
    context,
    ethereum.request({ method: "eth_requestAccounts" }),
  );
  assertContext(context);
  chainId = Number(
    await acknowledged(context, ethereum.request({ method: "eth_chainId" })),
  );
  assertContext(context);
  const challenge = await acknowledged(
    context,
    api(
      "/auth/challenge?" +
        new URLSearchParams({
          walletAddress: wallet,
          chainId,
          playerId: p.playerId,
        }),
    ),
  );
  assertContext(context);
  const signature = await acknowledged(
    context,
    ethereum.request({
      method: "personal_sign",
      params: [
        "0x" +
          Array.from(new TextEncoder().encode(challenge.message), (byte) =>
            byte.toString(16).padStart(2, "0"),
          ).join(""),
        wallet,
      ],
    }),
  );
  assertContext(context);
  if (!demo) {
    const accounts = await acknowledged(
      context,
      ethereum.request({ method: "eth_accounts" }),
    );
    assertContext(context);
    const activeChain = Number(
      await acknowledged(context, ethereum.request({ method: "eth_chainId" })),
    );
    assertContext(context);
    if (
      accounts[0]?.toLowerCase() !== wallet.toLowerCase() ||
      activeChain !== chainId
    )
      throw new Error("簽章期間錢包或鏈已改變，請重新登入。");
  }
  await acknowledged(
    context,
    api("/auth/verify", {
      challengeId: challenge.challengeId,
      signature,
      walletAddress: wallet,
      chainId,
      domain: challenge.domain,
      recoveryCode: $("walletCode").value,
    }),
  );
  assertContext(context);
  $("walletCode").value = "";
  await refresh(context);
  assertContext(context);
  message(
    "已驗證錢包身分並建立綁定；Account 與 Player Life 不變，沒有送出交易。",
  );
}
$("requestEmail").onclick = () => run(requestEmail);
$("verifyEmail").onclick = () => verifyEmail();
$("saveCodes").onclick = () =>
  run(async (context) => {
    const retained = savedRecoveryCodes;
    if (!retained?.codes.length) throw new Error("本次沒有新的復原碼。");
    const me = await acknowledged(context, api("/account/me"));
    assertContext(context);
    if (me.accountId !== retained.accountId || savedRecoveryCodes !== retained)
      throw new Error("RECOVERY_ACCOUNT_CHANGED");
    const url = URL.createObjectURL(
      new Blob([retained.codes.join("\n")], { type: "text/plain" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "KAIOS-private-recovery-codes.txt";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
$("conflictPreview").onclick = () =>
  run((context) =>
    showPreview({ conflictId: current.conflict.conflictId }, context),
  );
$("demo").onclick = () => run((context) => login(true, context));
$("wallet").onclick = () => run((context) => login(false, context));
$("refresh").onclick = () =>
  run(async (context) => {
    await refresh(context, { freshRead: true });
    assertContext(context);
    message("已重新載入本機與雲端旅程狀態。");
  });
$("sync").onclick = () =>
  run(async (context) => {
    if (!cloud) throw new Error("請先載入同一 Player Life");
    const prepared = await acknowledged(context, createLegacyStore());
    adoptPreparedStore(context, prepared);
    if (selectedId(prepared) !== activeId)
      throw new Error("請先載入同一 Player Life");
    const sync = createPlayerCloudSync({
      localStore: prepared,
      storage: localStorage,
    });
    const status = sync.status();
    if (!status.pending) await acknowledged(context, sync.enqueue());
    assertContext(context);
    const result = await acknowledged(context, sync.flush());
    await refresh(context);
    assertContext(context);
    message(
      result.status === "SYNCED"
        ? "本機旅程已同步。"
        : result.status === "CONFLICT"
          ? "版本衝突，已保留本機候選與雲端版本，沒有覆蓋。"
          : "離線候選已保留，稍後可重試。",
    );
  });
$("backup").onclick = () =>
  run(async (context) => {
    await acknowledged(
      context,
      api("/backups/create", {
        baseRevision: current.revision,
        reason: "manual",
      }),
    );
    await refresh(context);
    assertContext(context);
    message("已建立不可變歷史備份。");
  });
$("confirm").onchange = () => {
  $("restore").disabled = !$("confirm").checked;
};
$("cancel").onclick = () => {
  generation++;
  $("preview").hidden = true;
  preview = null;
};
$("restore").onclick = () =>
  run(async (context) => {
    if (!preview || !$("confirm").checked) return;
    $("restore").disabled = true;
    const r = await acknowledged(
      context,
      api("/recovery/restore", {
        previewId: preview.previewId,
        baseRevision: preview.expectedRevision,
        confirm: true,
      }),
    );
    assertContext(context);
    $("preview").hidden = true;
    preview = null;
    await refresh(context);
    assertContext(context);
    $("receipt").textContent =
      `已恢復至版本 ${r.revision}。恢復前備份已保存。遊戲後端收據：${r.recoveryReceipt.recoveryReceiptId}（不是區塊鏈收據）`;
    message("恢復成功。");
  });
$("import").onchange = () =>
  run(async (context) => {
    const f = $("import").files[0];
    if (!f) return;
    if (f.size > 512000) throw new Error("備份檔案太大");
    const contents = await acknowledged(context, f.text());
    assertContext(context);
    await showPreview({ package: JSON.parse(contents) }, context);
  });
$("apply").onclick = () =>
  run(async (context) => {
    if (!confirm("將雲端版本載入本機？會先保留目前本機遊戲備份。")) return;
    const target = current,
      targetId = activeId;
    const prepared = await acknowledged(context, createLegacyStore());
    adoptPreparedStore(context, prepared);
    const latest = await acknowledged(context, api("/player/state"));
    assertContext(context);
    if (
      latest.revision !== target.revision ||
      latest.state?.player.playerId !== targetId
    )
      throw new Error("雲端版本已更新，請重新整理後再確認。");
    if (
      selectedId(prepared) !== targetId &&
      prepared.listPlayers().some((p) => p.playerId === targetId)
    )
      await acknowledged(context, prepared.activatePlayer(targetId), targetId);
    assertContext(context);
    const existing = prepared.activePlayer();
    if (existing?.playerId === targetId) {
      await acknowledged(
        context,
        prepared.restoreGameBackup(target.state.player, {
          expectedRevision: prepared.snapshot().revision,
          confirmGameRestore: true,
        }),
      );
    } else {
      await acknowledged(
        context,
        prepared.importPlayer(
          JSON.stringify({
            schema: PLAYER_LIFE_SCHEMA,
            scope: PLAYER_LIFE_SCOPE,
            player: target.state.player,
          }),
          { confirmLocalCandidate: true },
        ),
        targetId,
      );
    }
    assertContext(context);
    const sync = createPlayerCloudSync({
      localStore: prepared,
      storage: localStorage,
    });
    await acknowledged(
      context,
      sync.acceptServerRevision(target.revision, {
        confirmDiscardPending: true,
      }),
    );
    await refresh(context);
    assertContext(context);
    message("雲端旅程已載入本機，原本資料已保護保存。");
  });
return run(async (context) => {
  const h = await acknowledged(context, api("/health"));
  assertContext(context);
  allowDemo = h.localDemo === true;

  $("demo").hidden = !allowDemo;
  $("mode").textContent = allowDemo
    ? "僅限本機測試，無真實錢包權限。"
    : "遊戲資料同步服務";
  try {
    await refresh(context, { freshRead: true });
    assertContext(context);
    message("已載入玩家生命。");
  } catch (error) {
    if (!["AUTH_REQUIRED", "SESSION_EXPIRED"].includes(error.message))
      throw error;
    assertContext(context);
    message("請登入後查看自己的備份。");
  }
});
  });
  return recoveryStart;
}

// app.mjs remains the Recovery Center page entry.
startRecoveryCenter().catch((error) => {
  document.getElementById("message").textContent = error.message;
});
