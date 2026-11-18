# Isolated native-media fixture

Only `tests/kaios-portal-browser.mjs` uses these responses. Product code and the
preview `dist/` never import them. Every API/frame response is fulfilled from
local bytes, clearly labeled as a fixture; no request reaches YouTube.

The API stub implements the official Player interface for controller tests.
It controls a real HTML video in the fixture frame and derives player state
from native media events. It does not simulate successful playback by simply
setting a positive state. The fixture's internal postMessage channel is test
transport and is not a product YouTube protocol implementation.

`media.webm` is a locally generated 3-second, 256x144 VP8 test pattern with a
quiet 440 Hz mono Opus track. Source: ffmpeg `lavfi` testsrc2 and sine only;
no downloaded media. SHA256:
`3e25f41be66fe418b95bdfca136efa7503b389f6f35db23832df615a6bf0f4ea`.

`embed.html` is a template; `fixture-tools.mjs` inserts the clip as a data URI.
The calling test must install its loopback GET/HEAD allowlist and fulfill these
explicit responses before aborting every other external request. Never use
external `route.fetch`, autoplay-policy bypass flags or real wallet calls.

These tests can prove controller behavior and local Chromium media playback.
They cannot verify real YouTube playback, media freshness, a physical phone,
or that a human heard audio.
