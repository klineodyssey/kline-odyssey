> Last archived: 2026-01-20

# Archive（歷史文件封存區）

本資料夾為《KLINE ODYSSEY / 花果山台灣》專案之  
**歷史版本與已退役內容封存區**。

---

## 📌 封存原則

- 本資料夾內所有內容 **皆不再作為現行規則**
- 僅供研究、回溯、時間線比對與歷史保存
- 現行制度、敘事與系統規則  
  **一律以 Repo 根目錄 README.md 為唯一準則**

---

## 📂 封存結構說明

### /site_v0_genesis/
- 初代官網版本（Genesis 時期）
- 包含早期白皮書、敘事結構與網站原型
- 為宇宙誕生階段的完整歷史紀錄

### /engine_autopilot_v0/（若存在）
- 舊版 Autopilot / Engine 架構
- 已被新版系統取代

---

## ⚠️ 重要聲明

- Archive 中的內容 **不代表未來承諾**
- 不構成投資建議
- 不保證任何系統行為或報酬

---

🕰️ **Archive 是記憶，不是方向。**  
🚀 **未來，只存在於主世界線。**

## Partial Navigator source recovery — 2026-10-06

One content-addressed [inert source snapshot](recovery/2026-10-06/65350fe6569059212f7ccc5b911605a123c3dc5e.txt) is retained under the existing archive purpose. This is a preservation branch only: no active runtime, PR, main merge, Boot adoption or release. The original source header is preserved verbatim as evidence and does not make this archive ACTIVE. This single recovered blob is not the complete Navigator candidate.

```json
{
  "work_id": "DOT-NAVIGATOR-SOURCE-RECOVERY-20261006",
  "recorded_at": "2026-10-06T13:37:42Z",
  "purpose": "Inert preservation of one independently verified source blob; not an active runtime or complete candidate",
  "status": "PARTIAL_SOURCE_RECOVERY",
  "labels": [
    "WIP",
    "NOT_RELEASEABLE",
    "RECOVERY_REQUIRED"
  ],
  "owner": "dot / Human-authorized temporary external engineering maintainer",
  "parent_work_id": "Q15",
  "policy_owner_pr": 516,
  "branch": "dot/recovery-navigator-blob-20261006",
  "base": "e26f3a76ef0be7f43058225f46def3fbe123371e",
  "head": null,
  "head_binding": "Containing archive commit; verified remote ref/HEAD recorded by existing engineering handoff",
  "preserved_file": "archive/recovery/2026-10-06/65350fe6569059212f7ccc5b911605a123c3dc5e.txt",
  "original_path": "K線西遊記/temples/11520/runtime/game-5d-main.mjs",
  "source": {
    "kind": "Existing immutable GitHub blob, fetched and independently rehashed; no reconstruction",
    "git_blob_sha1": "65350fe6569059212f7ccc5b911605a123c3dc5e",
    "sha256": "9ace7bc824bc84a1386d18d05aefc13d9224864d60f337392743806aa6187d1f",
    "bytes": 117042,
    "source_url": "https://api.github.com/repos/klineodyssey/kline-odyssey/git/blobs/65350fe6569059212f7ccc5b911605a123c3dc5e"
  },
  "provenance_limit": "A recoverable individual blob does not establish membership in, equivalence to, or recovery of the claimed complete Navigator candidate commit/tree",
  "candidate_gap": {
    "reported_latest_head": "a021e5e556a18df13d124e99fb9a75d751998bbd",
    "reported_latest_tree": "ae216d9489221b7f65d29b6c8fe626427fd4834a",
    "reported_earlier_head": "2642c430882c18795f63fc99c3b3fb05346f3c37",
    "reported_earlier_tree": "97fabd701245d184ced9648bfa19f9408a7bc512",
    "status": "LOST_OR_NOT_VERIFIED",
    "exact_candidate_tree_equivalence": "NOT_ESTABLISHED",
    "other_candidate_files": "NOT_PRESERVED_BY_THIS_CHECKPOINT"
  },
  "verification": {
    "git_blob_sha1": "PASS_EXACT_BYTES",
    "sha256_and_size": "PASS",
    "secret_scan": "PASS bounded common credential patterns over recovered content; credential/URL-context manual review; not universal detection",
    "runtime_tests": "NOT_RUN",
    "browser_qa": "NOT_RUN",
    "ci": "No matching push/PR filters among 19 workflows at base; not CI PASS"
  },
  "inert_boundary": "The original ACTIVE header is retained only as historical bytes. The .txt archive is not imported, installed, executed, served as the game runtime, merged, or deployed.",
  "governance": "No formal Worker identity, claim, runtime permission, protected-path change, financial action, force push, blocked-blob retry, main adoption or release. New archive inventory is candidate-only; formal Boot/index adoption is not completed.",
  "next_action": "Preserve this branch and compare only against independently recovered source evidence. Do not reconstruct missing bytes or promote this subset to whole-candidate recovery."
}
```
