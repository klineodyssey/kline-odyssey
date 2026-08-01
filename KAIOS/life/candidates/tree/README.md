# Foundational Tree Candidate

Status: `CANDIDATE_ONLY`
Package State: `CANDIDATE_LIFE_PACKAGES`
Review State: `PENDING_CODEX_REVIEW`

This package is a local validation candidate for `KAIOS-PR67-CURSOR-FOUNDATIONAL-LIFE-CANDIDATES-001`. It uses the PR66 Canonical Life Schema and approved type extensions without granting legal personhood, sentience, wallet authority, real KGEN, on-chain transfer, production runtime authority, settlement, deployment, or canonical status.

Integrity procedure: sort the declared component file names, exclude `integrity.json`, read canonical UTF-8 bytes for each component, and for `life.manifest.json` replace only `integrity.checksum` with 64 zeroes before canonical JSON serialization. For each component, hash `filename + newline + byte_length + newline + bytes + newline` with SHA-256.
