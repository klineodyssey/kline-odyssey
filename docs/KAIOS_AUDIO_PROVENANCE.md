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
