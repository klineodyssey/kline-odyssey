# KAIOS World Portal / Audio System

Owner: codex-gm-01. Human product order: 2026-10-01.
Scope: repository-only product navigation and original synthesized sound.

## Canonical entry

The official Portal is `https://klineodyssey.github.io/kline-odyssey/`.
`K線西遊記/index.html` is a compatibility entry, not a second Portal.
The root Portal derives world statuses and destinations from
`assets/kaios-world-registry.mjs`. Only the three Human-designated playable
worlds receive Play navigation: K11520, K12345 Heart and K16888 Universe.
PLAYABLE describes the game entry, not Mainnet or financial readiness.
Other worlds/research remain discoverable without pretending to be playable.

Historical documents are retained. `tests/kaios-portal-link-audit.mjs` records
141 former main-entry links against base
`a6e65af31b7070425d44cdf08862ab26e26e0a9f`: 96 informational, 36 duplicate,
4 playable links (including repeated destinations across pages), 3 stale,
1 superseded Portal and 1 missing `whitepaper/donation/` destination.
The missing donation link is not exposed by the new Portal. No payment or
replacement donation address is invented. External provider uptime and every
historical document link are outside this bounded main-CTA audit.

## Player privacy

Portal personalization reads the existing validated Player Life domain. It is
not a login, cloud account, identity proof or economic ledger. Only display name,
level, home world and allowlisted last world belong in the welcome view. No wallet
address, birthday, GPS or secret is rendered. A guest starts without a wallet.
Browser storage can be unavailable or corrupt: the Portal must still offer play.

## Audio authority

`assets/kaios-audio.mjs` owns shared playback, bus volumes, mute and lifecycle.
`assets/kaios-audio-ui.mjs` presents one settings control. Preferences persist
on the same origin; AudioContext unlock does **not** persist across documents.
A new document requires a fresh gesture if the browser requires it. Do not
promise uninterrupted playback through a full-page navigation: fade-out and a
clear unlock prompt are honest compatibility behavior.

Original procedural notes require no MP3 download, paid subscription or external
asset fetch. Theme identities: Universe/exploration, Journey/battle, Heart/life,
Universe/space. See `docs/KAIOS_AUDIO_PROVENANCE.md` for the asset audit.
Commercial songs merely present in the repository confer no reuse license.

Mute and all volume controls apply to shared music, SFX and speech. Event sound
is supplementary; visual text/feedback remains available while muted. Hidden
documents stop scheduling and suspend; pagehide disposes scheduling. The user
can always stop sound. Reduced motion disables decorative animation.

## Boundaries and delivery

No token, wallet approval, settlement rule, Oracle cap, Physics PR #459, land
ownership or payout authority is changed. All runtime additions are registered
in the master/frontend indexes and README. Boot CURRENT and Boot ancestors stay
unchanged because their edit permission is separately reserved by AGENTS.

Candidate delivery requires registry/audio tests, real Chromium responsive QA at
360/390/412/432/480 portrait and 844×390 landscape, guest/returning player,
navigation, audio lifecycle, expanded controls, and directly reviewed screenshots.
The dedicated workflow `KAIOS Portal Product QA` retains exact-head artifacts.
Existing K11520 Game/Responsive/Universal/Trading checks remain applicable.
Final delivery is a PR for the requested second review, not a claim of production
publication before that review.

## Local integration evidence and known limits

Before PR submission: 9 Portal unit cases, 14 shared-audio cases, 173 K11520
runtime cases and 260 wallet/universal/product cases passed. The Portal browser
suite covered six sizes, mute/unmute/volume/reload, three rotation cycles and
read-only Player Life recovery. Existing K11520 responsive browser regression
passed. Heart/Universe audio + return navigation passed four browser profiles;
K11520 audio + muted home-build feedback passed both orientations. Screenshots
were directly reviewed, including compact audio panels and all four gain controls.

Heart/Universe retain their pre-existing dense/scaled legacy gameplay HUDs; this
change does not claim to redesign those worlds. The legacy external WalletConnect
2.12.2 UMD `process is not defined` error is reported separately in browser evidence,
not hidden or treated as a new shared-audio error. No live wallet transaction was
attempted. Automated audio checks establish lifecycle/mixing, not human listening
quality or physical iOS speaker validation.

## Public mobile audio correction (2026-10-01)

Human reported inaudible mobile playback after #460. A fresh PUBLIC Heart page
reproduced the defect: one real touch unlocked the context but left music disabled.
The earlier browser test pressed an extra Play button and missed first-tap UX.
All primary controls now enable/unmute music on the first activation; compact
world controls open advanced settings only on a subsequent tap while playing.
New documents still require gesture; mute and intentional zero volumes persist.

The old Portal sampled peak/RMS was approximately 0.009/0.0047 (-46.6 dBFS RMS),
not proof of phone speaker audibility. New unsaved Music defaults to 65%, Master
remains 65%, and the first-party theme bus has gain 3 (about +13.3 dB combined
versus old unsaved defaults). Existing saved volumes are not overwritten. Music
envelopes/fade and node limits remain bounded. Browser QA measures destination
PCM with nonzero floor and clipping checks, rather than only checking the clock.
This is digital output evidence, not calibrated speaker SPL or a physical Android
device listening test. Voice depends on an installed browser/OS speech voice.

Context state changes stop suspended/interrupted scheduling and refresh UI;
zero Master/Music never reports playing. Portal shows theme/status outside its
settings panel. A recovery-gesture latch prevents Chrome's implicit pre-click
context resume from turning a visible "enable sound" tap into an accidental mute.
Real touch, reload, back/forward, four worlds, zero-volume/mute,
background/foreground and saved preferences remain the acceptance scope.
No commercial media, payment, financial logic or protected chain action changes.
