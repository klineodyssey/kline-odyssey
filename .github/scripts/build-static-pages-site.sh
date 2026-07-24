#!/usr/bin/env bash
set -euo pipefail

rm -rf _site
mkdir -p _site
touch _site/.nojekyll

copy_file() {
  local src="$1"
  local dest="${2:-$1}"
  if [ -f "$src" ]; then
    mkdir -p "_site/$(dirname "$dest")"
    cp -a "$src" "_site/$dest"
  fi
}

copy_dir() {
  local src="$1"
  local dest="${2:-$1}"
  if [ -d "$src" ]; then
    mkdir -p "_site/$(dirname "$dest")"
    cp -a "$src" "_site/$dest"
  fi
}

if [ ! -f "index.html" ]; then
  echo "::error::Root index.html is required for the official homepage."
  exit 1
fi
copy_file "index.html"

copy_file "12345.html"
copy_file "wallet-12345.html"
copy_file "wallet.html"
copy_file "kgen32.svg"
copy_file "logo.png"
copy_file "README.md"
copy_file "MANIFEST.json"
copy_file "VERSION"
copy_file "PRIMEFORGE_GENESIS_BOOT_SEQUENCE.md"
copy_file "PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4.md"
copy_file "OfficialLinks.json"
copy_file "KGEN-OFFICIAL-LINKS.json"
copy_file "KGEN_PUBLIC_INFORMATION_AUDIT.md"
copy_file "KGEN_LP_LOCK_PUBLIC_PROOF.md"

copy_dir "K線西遊記"
copy_dir "docs"
copy_dir "archive"
copy_dir "assets"
copy_dir "KGEN"
copy_dir "KGEN-Genesis"
copy_dir "KGEN-Runtime"
copy_dir "KGEN-SDK"
copy_dir "KGEN-Canon"
copy_dir "KGEN-Cursor-WorkOrders"
copy_dir "KGEN-Agent-Office"
copy_dir "KGEN-Organization"
copy_dir "KGEN-AI-Company"
copy_dir "KGEN-KAIOS"
copy_dir "boot"
copy_dir "operating-center"
copy_dir "ai-company"
copy_dir "workqueue"
copy_dir "civilization"
copy_dir "economy"
copy_dir "exchange"
copy_dir "wallet"
copy_dir "membership"
copy_dir "library"
copy_dir "evolution-governance"
copy_dir "workforce"
copy_dir "video"
copy_dir "official"
copy_dir "community"
copy_dir "markets"
copy_dir "security"
copy_dir "liquidity-lock"
copy_dir "PRIMEFORGE_GENESIS_BOOT_SEQUENCE"
copy_dir "PRIMEFORGE_GENESIS_BOOT_SEQUENCE_V1_4"

mkdir -p "_site/KGEN-KAIOS/dashboard"
cat > "_site/KGEN-KAIOS/dashboard/build-info.json" <<EOF
{
  "main_commit": "${GITHUB_SHA:-local}",
  "branch": "${GITHUB_REF_NAME:-local}",
  "workflow": "${GITHUB_WORKFLOW:-local}",
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "mode": "read-only"
}
EOF

for version in V8 V8.1 V8.2 V8.3 V9.0 V9.1 V9.2 V9.3 V10; do
  mkdir -p "_site/KGEN-KAIOS/${version}"
  cat > "_site/KGEN-KAIOS/${version}/build-info.json" <<EOF
{
  "main_commit": "${GITHUB_SHA:-local}",
  "branch": "${GITHUB_REF_NAME:-local}",
  "workflow": "${GITHUB_WORKFLOW:-local}",
  "generated_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "mode": "read-only",
  "kaios_version": "${version}"
}
EOF
done

copy_file "KGEN_MASTER_LIBRARY_INDEX.md"
copy_file "KGEN_BIOLOGICAL_VERSIONING_AUDIT.md"
copy_file "KGEN_UNAUTHORIZED_CONTRIBUTION_AUDIT.md"
copy_dir "whitepaper"
copy_dir "wukong-temple"

for route in boot operating-center ai-company workqueue civilization economy exchange wallet membership library evolution-governance workforce video; do
  if [ ! -f "_site/${route}/index.html" ]; then
    echo "::error::Missing permanent Pages route: /${route}/"
    exit 1
  fi
done

echo "Static site built for ${GITHUB_WORKFLOW:-local} @ ${GITHUB_SHA:-local}"
find _site -maxdepth 3 -type f | sort | sed 's#^_site/##' | head -n 200 || true
