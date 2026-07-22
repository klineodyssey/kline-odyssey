# KAIOS Company Boot Runtime V0.1 Implementation Option Review

Status: OPTION_REVIEW_ONLY
Implementation: NOT_STARTED

## Purpose

This document compares Python and Node.js as future candidates for a local minimum Company Boot verifier. It does not implement either option.

## Comparison

| Dimension | Python | Node.js |
|---|---|---|
| JSON Schema support | Strong with `jsonschema`, but external dependency may be needed | Strong with `ajv`, but external dependency may be needed |
| CLI testability | Excellent for deterministic file and hash checks | Excellent for JSON and web-adjacent workflows |
| Cross-platform | Strong on Windows, macOS and Linux | Strong on Windows, macOS and Linux |
| Error handling | Clear exceptions, easy nonzero exit codes | Clear exceptions, easy nonzero exit codes |
| Hash calculation | Built-in `hashlib` | Built-in `crypto` |
| UTF-8 reliability | Strong explicit encoding support | Strong UTF-8 file read support |
| Test tools | Built-in `unittest`; `pytest` optional | Built-in `node:test`; npm packages optional |
| Dependency count | Can be zero if schema validation is structural/manual; one dependency for full JSON Schema | Can be zero for structural/manual checks; one dependency for full JSON Schema |
| Windows compatibility | Already used in repository workflows; good PowerShell interoperability | Good Windows support; requires Node availability |
| Future extensibility | Strong for repository audit, hash, JSON and text scans | Strong for browser, web, API and future UI-adjacent checks |

## Recommendation

Primary recommendation for V0.1: Python.

Reason:

- The repository already uses Python-oriented validation workflows.
- The V0.1 proof is file, JSON, SHA-256, UTF-8 and boundary-check heavy.
- A zero-dependency Python verifier can cover the minimum proof before adding full JSON Schema validation.

Secondary candidate: Node.js.

Node.js remains attractive for later browser, Web App or GitHub API-adjacent automation, but V0.1 should stay small and local.

## Non-Implementation Boundary

No verifier, package, dependency, fixture, command wrapper or runtime was created by this option review.
