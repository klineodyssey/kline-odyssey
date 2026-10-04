import {
  createLocalPlayerStore,
  PLAYER_LIFE_SCHEMA,
  PLAYER_LIFE_SCOPE,
} from "../../../K線西遊記/temples/11520/runtime/player-life-runtime.mjs";
import { createPlayerCloudSync } from "../../../K線西遊記/temples/11520/runtime/player-cloud-sync.mjs";
const $ = (id) => document.getElementById(id);
let local = createLocalPlayerStore({ storage: localStorage }),
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
async function run(fn) {
  try {
    await fn();
  } catch (e) {
    message(
      {
        CONFLICT: "版本衝突，兩份資料已保存。請先檢查雲端版本。",
        STALE_RESTORE: "版本已更新，請重新預覽。",
        CORRUPTED: "備份損壞，已拒絕恢復。",
        AUTH_REQUIRED: "請先登入。",
        SESSION_EXPIRED: "登入已過期，請重新簽章。",
        BACKEND_NOT_CONFIGURED: "雲端服務尚未配置，本機旅程仍可使用。",
      }[e.message] ?? e.message,
    );
  }
}
async function refresh() {
  local = createLocalPlayerStore({ storage: localStorage });
  const me = await api("/player/me");
  activeId = me.playerId;
  current = await api("/player/state");
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
  const own = local.activePlayer();
  cloud =
    own?.playerId === activeId
      ? createPlayerCloudSync({ localStore: local, storage: localStorage })
      : null;
  if (cloud) {
    await cloud.refresh();
    if (["CONFLICT", "REMOTE_NEWER"].includes(cloud.status().status))
      $("health").textContent = "本機與雲端版本不同：請檢查後明確選擇版本";
  }
  $("sync").disabled = !cloud;
  const list = await api("/backups");
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
      button("驗證備份", async () => {
        const v = await api("/backups/" + s.snapshotId + "/verify");
        message(health[v.status] ?? v.status);
      }),
      button("恢復預覽", () => showPreview({ snapshotId: s.snapshotId })),
      button("匯出", async () => {
        const pkg = await api("/backups/" + s.snapshotId + "/export"),
          a = document.createElement("a"),
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
async function showPreview(source) {
  preview = await api("/recovery/preview", {
    ...source,
    baseRevision: current.revision,
  });
  $("preview").hidden = false;
  $("confirm").checked = false;
  $("restore").disabled = true;
  const a = preview.summary.current,
    b = preview.summary.candidate;
  $("summary").textContent =
    `目前：等級 ${a.level} / XP ${a.xp} / 世界 ${a.lastWorld}；恢復後：等級 ${b.level} / XP ${b.xp} / 世界 ${b.lastWorld}。位置 ${`X ${a.lastXYZ.x}、Y ${a.lastXYZ.y}、Z ${a.lastXYZ.z}`} → ${`X ${b.lastXYZ.x}、Y ${b.lastXYZ.y}、Z ${b.lastXYZ.z}`}`;
  $("preview").scrollIntoView({ behavior: "smooth", block: "start" });
}
async function login(demo) {
  let p = local.ensurePlayer(),
    wallet,
    chainId;
  if (demo) {
    if (!allowDemo) throw new Error("本機測試未啟用");
    wallet = "0x0000000000000000000000000000000000000097";
    chainId = 97;
  } else {
    if (!window.ethereum) throw new Error("請使用支援錢包的瀏覽器。");
    [wallet] = await ethereum.request({ method: "eth_requestAccounts" });
    chainId = Number(await ethereum.request({ method: "eth_chainId" }));
  }
  const challenge = await api(
    "/auth/challenge?" +
      new URLSearchParams({
        walletAddress: wallet,
        chainId,
        playerId: p.playerId,
      }),
  );
  const signature = demo
    ? "LOCAL_DEMO:" + challenge.challengeId
    : await ethereum.request({
        method: "personal_sign",
        params: [
          "0x" +
            Array.from(new TextEncoder().encode(challenge.message), (byte) =>
              byte.toString(16).padStart(2, "0"),
            ).join(""),
          wallet,
        ],
      });
  if (!demo) {
    const accounts = await ethereum.request({ method: "eth_accounts" }),
      activeChain = Number(await ethereum.request({ method: "eth_chainId" }));
    if (
      accounts[0]?.toLowerCase() !== wallet.toLowerCase() ||
      activeChain !== chainId
    )
      throw new Error("簽章期間錢包或鏈已改變，請重新登入。");
  }
  await api("/auth/verify", {
    challengeId: challenge.challengeId,
    signature,
    walletAddress: wallet,
    chainId,
    domain: challenge.domain,
  });
  const state = await api("/player/state");
  if (!state.state && challenge.playerId === p.playerId) {
    const initialCloud = createPlayerCloudSync({
      localStore: local,
      storage: localStorage,
    });
    if (!initialCloud.status().pending) initialCloud.enqueue();
    const initial = await initialCloud.flush();
    if (initial.status !== "SYNCED")
      throw new Error("初次同步未完成；本機候選已保留。");
  }
  await refresh();
  message(
    demo
      ? "本機示範模式：測試資料，不是已驗證的真實錢包。"
      : "已驗證錢包身分，沒有送出交易。",
  );
}
$("conflictPreview").onclick = () =>
  run(() => showPreview({ conflictId: current.conflict.conflictId }));
$("demo").onclick = () => run(() => login(true));
$("wallet").onclick = () => run(() => login(false));
$("refresh").onclick = () => run(refresh);
$("sync").onclick = () =>
  run(async () => {
    if (!cloud) throw new Error("請先載入同一 Player Life");
    local = createLocalPlayerStore({ storage: localStorage });
    cloud = createPlayerCloudSync({ localStore: local, storage: localStorage });
    const status = cloud.status();
    if (!status.pending) cloud.enqueue();
    const result = await cloud.flush();
    await refresh();
    message(
      result.status === "SYNCED"
        ? "本機旅程已同步。"
        : result.status === "CONFLICT"
          ? "版本衝突，已保留本機候選與雲端版本，沒有覆蓋。"
          : "離線候選已保留，稍後可重試。",
    );
  });
$("backup").onclick = () =>
  run(async () => {
    await api("/backups/create", {
      baseRevision: current.revision,
      reason: "manual",
    });
    await refresh();
    message("已建立不可變歷史備份。");
  });
$("confirm").onchange = () => {
  $("restore").disabled = !$("confirm").checked;
};
$("cancel").onclick = () => {
  $("preview").hidden = true;
  preview = null;
};
$("restore").onclick = () =>
  run(async () => {
    if (!preview || !$("confirm").checked) return;
    $("restore").disabled = true;
    const r = await api("/recovery/restore", {
      previewId: preview.previewId,
      baseRevision: preview.expectedRevision,
      confirm: true,
    });
    $("preview").hidden = true;
    preview = null;
    await refresh();
    $("receipt").textContent =
      `已恢復至版本 ${r.revision}。恢復前備份已保存。遊戲後端收據：${r.recoveryReceipt.recoveryReceiptId}（不是區塊鏈收據）`;
    message("恢復成功。");
  });
$("import").onchange = () =>
  run(async () => {
    const f = $("import").files[0];
    if (!f) return;
    if (f.size > 512000) throw new Error("備份檔案太大");
    await showPreview({ package: JSON.parse(await f.text()) });
  });
$("apply").onclick = () =>
  run(async () => {
    if (!confirm("將雲端版本載入本機？會先保留目前本機遊戲備份。")) return;
    local = createLocalPlayerStore({ storage: localStorage });
    const latest = await api("/player/state");
    if (latest.revision !== current.revision)
      throw new Error("雲端版本已更新，請重新整理後再確認。");
    if (
      local.activePlayer()?.playerId !== activeId &&
      local.listPlayers().some((p) => p.playerId === activeId)
    )
      local.activatePlayer(activeId);
    const existing = local.activePlayer();
    if (existing?.playerId === activeId) {
      local.restoreGameBackup(current.state.player, {
        expectedRevision: local.snapshot().revision,
        confirmGameRestore: true,
      });
    } else {
      local.importPlayer(
        JSON.stringify({
          schema: PLAYER_LIFE_SCHEMA,
          scope: PLAYER_LIFE_SCOPE,
          player: current.state.player,
        }),
        { confirmLocalCandidate: true },
      );
    }
    cloud = createPlayerCloudSync({ localStore: local, storage: localStorage });
    cloud.acceptServerRevision(current.revision, {
      confirmDiscardPending: true,
    });
    await refresh();
    message("雲端旅程已載入本機，原本資料已保護保存。");
  });
run(async () => {
  const h = await api("/health");
  allowDemo = h.localDemo === true;
  $("wallet").disabled = false;
  $("demo").hidden = !allowDemo;
  $("mode").textContent = allowDemo
    ? "僅限本機測試，無真實錢包權限。"
    : "遊戲資料同步服務";
  try {
    await refresh();
    message("已載入玩家生命。");
  } catch {
    message("請登入後查看自己的備份。");
  }
}).catch(() => message("雲端尚未配置，本機旅程仍可使用。"));
