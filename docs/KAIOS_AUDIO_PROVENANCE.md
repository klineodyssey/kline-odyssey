# KAIOS Audio System — provenance and integration

Date: 2026-10-01. Scope: ordinary static WebAudio product integration only.
No purchase, external download, Mainnet action or economic authority.

## Audited existing organs and media

| World | Existing runtime / media | Finding and action |
|---|---|---|
| 11520 | `runtime/game-ui-product-fixes-v23.mjs`, `runtime/combat-fx-runtime.mjs` | Existing first-party oscillator score and synthesized effects. Preserve the original eight-note Journey/Battle motif (220, 261.63, 293.66, 329.63, 392, 329.63, 293.66, 261.63 Hz), .34 s beat, bass/pad and falling kick. Delegate to one shared context and mix. No external recordings. |
| 12345 Heart | `modules/kgen-12345-app-shell.js`, `modules/runtime-main.js`, `music/playlist.json` | Existing Heart audio/ambient oscillator and independent MP3 player. Shared original Heart/Life arrangement retains warm, gentle pulse identity; does **not** derive a melody from the listed commercial recordings. |
| 16888 Universe | `index.html`, `music/playlist.json`, root `playlist.json` | Existing Universe/Space ambient oscillator and multiple legacy MP3/auto-play patches. Shared original spacious, slow synth theme replaces active legacy player path. |
| 12345 commercial media | `music/Bruno Mars - Just The Way You Are.mp3`, `music/Greatest Love Of All.mp3`, `music/Take My Breath Away.mp3` | No affirmative redistribution/license grant found in the audited repository audio manifests. Preserved as historical files; not copied, fetched, selected, preloaded or represented as original KAIOS music. |
| 16888 commercial media | `music/情難枕.mp3`, `music/我曾用心愛著你.mp3`, `music/我相信.mp3` | Same rights-unverified exclusion. File existence is not a license. |

This audit is a source/provenance classification, not a legal certification of all
historical repository media. Existing archival documents and assets remain intact.

## One active authority

`assets/kaios-audio.mjs` owns AudioContext creation, lifecycle, bounded oscillator
nodes, gesture unlock, music scheduling, speech gain, four channel preferences,
mute, visibility and page lifecycle handling. `assets/kaios-audio-ui.mjs` and
`assets/kaios-audio.css` are the accessible shared control. The selected world is
the only active theme scheduler. A short, bounded crossfade retires old notes.
`assets/kaios-world-audio.mjs` bridges existing Heart/Universe controls to this
authority; the two known legacy media organs are stopped, not arbitrary media.

Portal **KAIOS Universe Theme**, Heart **心光**, Universe **星海**, and event motifs
are original algorithmic oscillator arrangements written for this work order.
They contain no sampled recording, downloaded media or commercial-song melody.
Portal sound is pentatonic/modal, soft bass and sparse bell-like sine notes;
Heart uses warmer triangle pulse, and Universe slower spacious sine layers.

Only settings are persisted as `KAIOS_AUDIO_PREFERENCES_V1`. No Player profile,
wallet address, account, credential, telemetry or music binary is stored there.
Music is silent by default. Even saved music-on preferences require a browser
gesture in a new document. Failed unlock is shown, never reported as playback.
The new page's theme fades in after unlock; outgoing navigation fades out first.
The system does not claim uninterrupted AudioContext transfer across documents.

Visibility/pagehide stops scheduling and pending sounds and suspends the context.
Return resumes only a previously unlocked, enabled, unmuted theme. Oscillator
duration and node allocation are bounded; ended nodes disconnect. Mute silences
music, SFX and AI voice, with visual feedback retained in the world UI.

## Validation

V2.9 extends this same synthesizer with first-party dynamic game arrangements:
EXPLORE, ENCOUNTER, COMBAT, BOSS, BOSS_LOW_HP, VICTORY, RARE_LOOT,
LEVEL_UP, GA600_LEVEL_UP, HOME and PORTAL. Tempo/motif/bass/percussion blends
continue on one scheduler rather than starting competing BGM players.
Combat, Boss, rarity and upgrade identities use generated sine/triangle/saw
envelopes and glides, not commercial recordings or copied melodies.
Priority SFX and speech duck music with bounded restoration. No new asset
download, paid music, sample pack or external composition is introduced.

`tests/kaios-audio.test.mjs` covers silence before gesture, preference restoration,
single context/scheduler, identity switching, crossfade bounds, canonical 11520
motif, mute, volume validation, speech callbacks, visibility, bounded cleanup,
all requested event motifs, failed storage and page lifecycle.
Real Chromium Portal/world screenshots and interaction QA are separate required
release evidence; unit tests alone do not constitute visual or acoustic QA.
No claim is made that automated browser checks verify human speaker quality.

## KAIOS Original OST — instrumental listening candidates (2026-10-02)

Historical initial delivery: **CANDIDATE / HUMAN LISTENING REVIEW PENDING / NOT INTEGRATED**.
This is an offline composition delivery, not a second game music runtime or a
replacement of any world UI. PR #468 remains Draft/Frozen; 16888's original
presentation, Warp, Wallet, Heart actions and settlement are not modified.

The review package is `artifacts/kaios-original-ost/` in the working checkout.
`listen.html` is a local audition sheet, not another public Portal. The package
contains six stereo PCM WAV masters, 192 kbps MP3 audition files, editable MIDI,
explicit per-note `.score.json` files, `render_ost.py` and a machine-readable
`KAIOS_AUDIO_PROVENANCE.json` with file hashes and measured signal checks.
These generated review artifacts are not automatically published or loaded by
production. Boot and active runtime registration are unchanged.

| ID / title | World | Tempo / score | Arrangement |
|---|---|---|---|
| 11520_THEME — 花果山戰歌 · 雲起金箍 | K11520 | 112 BPM, D Dorian, 32 bars | Intro → journey → combat → heroic reprise → resolution; additive flute, synthesized pluck, string pad, drums and metallic accents. |
| 12345_THEME — 心光 · 願火長明 | K12345 | 80 BPM, D major, 24 bars | Heart pulse → prayer → warm response → rest; soft FM keys, bells, warm pads and synthesized double heartbeat. |
| 16888_THEME — 星海 · 文明遠航 | K16888 | 76 BPM, D Lydian colour, 24 bars | Stargate → voyage → constellation → horizon; synth pads, sparse arpeggios, engine bass and bell delays. |
| BOSS_THEME — 六相天劫 · 破界 | K11520 Boss | 136 BPM, D minor, 24 bars | Arrival → confrontation → rage/low-HP intensity → final strike; low additive strings, brass-like synthesis and drum density. |
| VICTORY_THEME — 雲開 · 凱旋 | Shared | 108 BPM, D major, 8 bars | Rising response, bright identity motif, tonic release. |
| LEVEL_UP_MOTIF — 升光 · 星核覺醒 | Player / GA600 game progression | 104 BPM, D major, 4 bars | Engine rise into crystal identity motif; no real-trading unlock or financial authority. |

Per-track provenance (also written separately for each entry in the JSON):

```text
COMPOSER = 衡曜 / Codex — AI-assisted original composition for KAIOS
HUMAN_COMMISSIONING_OWNER = 沈英明
CREATION_METHOD = Original symbolic score + deterministic additive/FM/noise synthesis
SOURCE_ASSETS = render_ost.py + corresponding explicit score JSON
THIRD_PARTY_MEDIA = NO
COMMERCIAL_SONG_SAMPLE = NO
GAME_USE = YES
VIDEO_USE = YES
VOCAL_RECORDING = NONE / INSTRUMENTAL
HUMAN_LISTENING_APPROVAL = PENDING
PRODUCTION_INTEGRATION = NO
```

The newly composed shared identity cell is D–E–A–F(♯)–E / D–B(♭)–A,
with asymmetric pickup timing and distinct minor/major/modal voicings per world.
It is not transcribed from, prompted to imitate, sampled from or recorded from a
third-party song. No legacy commercial MP3 is read by the renderer. Generated
white noise and sine partials supply all timbres/percussion. NumPy performs
numeric synthesis; `lameenc` encodes the authored PCM to MP3 and contributes no
musical/audio source. MIDI is an editable symbolic interchange; DAW playback
depends on the user's instruments and is not the exact synthesized master.

GAME_USE/VIDEO_USE record the project's intended use, not a legal opinion or a
guarantee of copyright registrability/worldwide melodic uniqueness. No paid
music license or third-party media rights are claimed. Re-recording a commercial
track or converting it to MP3 does not establish permission; such inputs remain
excluded from KAIOS BGM and SFX.

The six exports have composed endings and are **not certified seamless loops**.
The existing dynamic states/SFX stay active and unchanged. Separate adaptive
stems, all requested new one-shot SFX, a full vocal song and final in-game wiring
are follow-on production work after these listening candidates are selected.
No claim is made that offline rendering or RMS/peak checks substitute for Human
listening on actual speakers. No Mainnet transaction, purchase, cloud service or
private credential is involved in this creation package.

## Direct game integration candidate — 2026-10-02

Human subsequently authorized direct candidate integration. This section
supersedes the listening-only status, preserving its six complete master scores.
Two additional first-party arrangements provide a compact eight-track library:
`JOURNEY_THEME`《雲徑・取經晨行》, 92 BPM; `DEEP_SPACE_THEME`《星航・歸途微光》,
68 BPM. No commercial song was played, transcribed, sampled or imported. There
is no vocal recording or paid music dependency. Intended game/video use is not
a legal guarantee of copyright registrability or worldwide melodic uniqueness.

### New path registration

All paths below are relative to `C:/Desktop/kline-odyssey/`.

| Path | Purpose |
|---|---|
| `assets/kaios-ost/render.py` | Promoted offline first-party score/synth authoring tool (NumPy); NOT a playback/runtime authority. |
| `assets/kaios-ost/KAIOS_AUDIO_PROVENANCE.json` | Per-track composer, creation method/date, source, rights flags, master/loop hashes and signal metrics. |
| `assets/kaios-ost/01-huaguoshan-battle-song.score.json`, `assets/kaios-ost/01-huaguoshan-battle-song.loop.wav` | Encounter / combat score and game loop. |
| `assets/kaios-ost/02-heart-light.score.json`, `assets/kaios-ost/02-heart-light.loop.wav` | Heart theme. |
| `assets/kaios-ost/03-sea-of-stars.score.json`, `assets/kaios-ost/03-sea-of-stars.loop.wav` | Universe theme / first playlist entry. |
| `assets/kaios-ost/04-six-phase-titan.score.json`, `assets/kaios-ost/04-six-phase-titan.loop.wav` | Boss / low-HP theme. |
| `assets/kaios-ost/05-dawn-after-battle.score.json`, `assets/kaios-ost/05-dawn-after-battle.loop.wav` | Victory theme. |
| `assets/kaios-ost/06-light-of-ascent.score.json`, `assets/kaios-ost/06-light-of-ascent.loop.wav` | Player / GA600 level-up / rare-loot motif. |
| `assets/kaios-ost/07-mountain-path.score.json`, `assets/kaios-ost/07-mountain-path.loop.wav` | Explore / journey / home arrangement. |
| `assets/kaios-ost/08-starlight-home.score.json`, `assets/kaios-ost/08-starlight-home.loop.wav` | Deep-space / homeward arrangement; second Universe playlist entry. |
| `tests/kaios-ost-browser.mjs` | Real decode, nonzero destination PCM, resampled seam, state selection and lifecycle QA. |

Run `python assets/kaios-ost/render.py` with NumPy to reproduce these assets and
eight full 44.1 kHz stereo WAV masters under
`artifacts/kaios-original-ost/game-masters/*.master.wav`. Complete masters are
offline video/game exports, never requested by the runtime. The six earlier
MP3/MIDI audition files remain historical candidates. Game loops are 22.05 kHz
stereo 16-bit PCM, 0.8–2.5 MB each; the ~13.8 MB library is NOT preloaded.

Loops preserve whole harmonic cycles. Note tails and reverb wrap modulo the
sample period, not a trimmed MP3 ending. A 3 ms raised-cosine guard prevents
browser-resampling clicks without changing beat length. PCM endpoint delta=0;
Chromium-resampled seam <0.000007 FS in local QA (gate <0.0002). RMS≈-16.5 dBFS,
peak below -3 dBFS, clipped samples=0. These are PCM measurements, not LUFS or
physical phone-speaker/listening certification. All instruments use authored
additive/FM/noise synthesis; no recorded sample input.

### Integration and safety

`assets/kaios-audio.mjs` remains the only context/playback authority. No second
HTMLAudio player or scheduler is added. Gesture gates both context and fetch.
Only a selected, allowlisted same-origin track loads. Cache ≤3 decoded tracks;
≤2 sources during a 400 ms crossfade, one afterward. Requests abort on pause,
mute/disposal; generation tokens reject late responses. Loading/failure does
not report fake playback. Pause retains position; Stop resets. Existing music
bus/master gain and SFX/voice ducking govern PCM too. Hidden/pagehide suspends;
resume respects mute and required browser gestures.

11520's existing gameplay state selects Journey for EXPLORE/HOME, battle for
ENCOUNTER/COMBAT, titan for BOSS/LOW_HP, victory for VICTORY, ascent for level/
GA600/rare loot. Shared-track states preserve playhead and blend intensity.
Actual joystick/combat/Boss browser tests verify the existing state wiring,
not only direct API state injection. Trading risk and gameplay authorities do
not change.

12345 has zero program changes in its world folder. The audio bridge observes
rendered `kh-log` success receipts and plays Wish/Repay/Heartbeat/Lamp/Festival/
New Year motifs. It never wraps/calls sendHeart, reads amounts, signs, changes
eligibility or substitutes transaction success. Original transaction-boundary
tests confirm four actions exactly once, corresponding success motifs and
unchanged invalid-input/allowance/cancellation gates.

16888 uses #468's narrow original presentation restore in this candidate; #468
itself remains Draft. Existing universe-nav positions, original 飛碟音響 and
music-panel are retained; no shared floating controls are mounted. Inline CSS
and classic scripts are hash-identical to the audited original baseline. Warp,
Wallet, Life, physics, game logic and one canonical return remain unchanged.
Play/Pause/Stop/Volume/Mute/Loop and two-track Previous/Next/Shuffle use only
`KAIOS_FIRST_PARTY_OST_ONLY`. Shuffle chooses a different track on manual
Previous/Next; Loop repeats selected track. Loop off ends cleanly. Local media
import and historical playlist loaders remain disabled.

16888 review is portrait only: 360/390/412/432/480×844. Its known WalletConnect
CDN `process is not defined` QR issue is separate, not hidden by audio PASS.
Browser QA serves the exact pinned original fairy image locally to avoid
stalled raw-GitHub transport; it does not stub world initialization/layout.

Local gates: 36 audio/domain tests; real Chromium eight-loop/signal/mute/lifecycle;
12345 canonical transaction stubs and responsive stability; original Universe
playlist; 11520 real combat and Boss at 390×844 and 844×390. Screenshots require
direct inspection. Exact-head CI is required before release. Human physical
phone listening remains pending; candidate readiness is not a public release.

README, Master Index and Frontend Index register these paths. Boot V1.4 remains
unchanged under its explicit-update-permission rule; no bootstrap/runtime added.
MAINNET_TX_SENT=NO; PAID_MUSIC_PURCHASE=NO; COMMERCIAL_MEDIA_PLAYED=NO;
THIRD_PARTY_RECORDING=NO; THIRD_PARTY_SAMPLE=NO. No financial authority changed.
