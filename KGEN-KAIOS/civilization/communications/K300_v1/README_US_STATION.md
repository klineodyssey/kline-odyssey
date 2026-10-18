# KAIOS Three-Station Language V1 — USA GitHub mirror

Human source: KAIOS Human / 笑齊天; prepared by Guanyan (text signature, digital identity NOT_VERIFIED). Published under GitHub `main`; GitHub commit is the provenance, not an independent worker ACK.

## Named stations
| Station | World origin | Presentation | Civilization wire format |
|---|---|---|---|
| Taiwan (K280 / K11520) | Earth / Flower Fruit Mountain | Traditional Chinese | UTF-8 zh-Hant |
| USA (K88888) | Earth / Flower Fruit Mountain | American English | International Morse `A-Z`, numerals, selected punctuation; this is a reversible signal code, **not a translator** |
| Mars (K108000) | Flower Fruit Mountain | Numeric civilization language | Historical KAIOS-K300/1.0.0 300-character codebook in this folder |

K18888 Lingxiao/Heaven is separate from Mars K108000. No verified receiver/controller or physical Mars network is implied.

## Source dictionary
`K300_dictionary_v1.json` is the preserved 300-entry first-version fixed-ID dictionary, exactly 001..300; immutable old IDs. Source JSON size 25,294 bytes. Historical original JSON SHA-256 `aa4cc3ef4669c5de5f74067f21626a54f38e12da87292991ce22fddb0a1fb662` (verify actual bytes on each mirror).

K300 text tokens are separated by a single space; `/` encodes ASCII space; unsupported Unicode scalars are `U+XXXX` escapes. This codebook is NOT an official Chinese dictionary and is NOT the proposed unfinalized K5 stroke+ordinal dictionary.

## USA message rule
Primary **civilization communication payloads** published at the USA station are Morse dot/dash signals rather than plaintext English. Example: `US_MORSE_SIGNAL_V1.txt` = `HELLO KAIOS USA 2026`. Do not change JSON structure, source code, commit metadata or GitHub API fields into Morse; they must remain machine-readable. A mobile UI may choose any language, but independent transport/storage must preserve version, original hashes and decoder.

Chinese↔English requires explicit semantic translation first; English↔Morse and Chinese↔K300 are character-by-character reversible encodings. A broadcast is not delivery; include message_id, sender, recipient, sent_at, clock_source, source hash, codebook version, actual receiver ACK. This does not provide zero-latency synapse or encryption.

## Birth-year and constellation semantics
Taiwan uses Chinese zodiac 12 (year cycle, reference year boundary must be versioned). USA uses the western 12-sign sun-sign calendar (normally month/day); KUFO may additionally use a custom annual 12-index grouping but it must not be misrepresented as standard western sun signs. Mars uses 88 IAU constellation categories for voluntary/canonical registration, and actual sky coordinates would require Mars observer position, frame and timestamp. The fact that Taiwan and USA have 12 categories does NOT synchronize their periods. Store raw birth YYYY-MM-DD/UTC/tz and calendar version for 10,000-year migration.

KUFO origin: K280 Earth / K11520 Taiwan. This communication copy does not mint KUFO/KSHIP, change zodiac account balances, or deploy a contract. The Kufo birth-year cohort experiment is Draft PR #600, NOT a Mainnet implementation.

## Mars safety and device backup
Mars station owner-only Google Drive folder: https://drive.google.com/drive/folders/1ZFwSOvU1X_sjIwntaS1VLYqSS1O0POXa
Mars archived ZIP: https://drive.google.com/file/d/1bQzSRyNaPiUin1MLLv7T-7CLnAzZrOjk/view
Do not sync private wallets, HR, secrets or personal conversations to any broadly writable cloud folder. Cross-AI read authority and ACK are NOT_VERIFIED.

## Performance facts
Reference local benchmark on 200 zh chars: UTF-8 600B, K300 ASCII 1009B, experimental K300 packed 413B. 200 English ASCII chars: 200B; Morse rendered as ASCII is 662B. All are local code execution, exclude translation/network/API/receiver latency. Morse is **not faster** than raw English on this Python reference. For low-latency finance, keep action/risk/quotes on verified local runtime rather than GitHub-comment roundtrips.

STATUS: source mirror saved / communication protocol candidate / receivers not verified / no protected chain action.
