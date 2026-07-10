# Deployment Standard

**Document ID:** KAIOS-V10-DEPLOYMENT-STANDARD  
**Version:** V10.0  
**Status:** Draft for Review

Deployment covers GitHub Pages, GitHub Actions, releases, package publishing and operational promotion. V10 defines standards only.

## GitHub Integration

| Integration | Rule |
|---|---|
| GitHub Repository | Source of code and docs |
| GitHub Pages | Static public documentation and dashboards |
| GitHub Actions | CI and static deploy |
| GitHub Releases | Future release artifacts |
| GitHub Issues | Future issue intake |
| GitHub Discussions | Future community discussion |
| GitHub Projects | Future planning surface |
| GitHub Packages | Future package hosting |
| GitHub Token Policy | No token in repository |

## Secret Locations

Local Secret, GitHub Secret and Environment Secret are allowed. Repository files are not allowed to contain tokens.

