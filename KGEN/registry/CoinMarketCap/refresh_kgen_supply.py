#!/usr/bin/env python3
"""Refresh the public KGEN supply snapshot from read-only BSC sources."""

from __future__ import annotations

import hashlib
import json
import urllib.request
from datetime import datetime, timezone
from decimal import Decimal, getcontext
from pathlib import Path

getcontext().prec = 80

TOKEN = "0xba3d3810e58735cb6813bc1cdc5458c0d71432be"
RPC_URLS = (
    "https://bsc-dataseed.bnbchain.org",
    "https://bsc-dataseed1.bnbchain.org",
)
GOPLUS_URL = (
    "https://api.gopluslabs.io/api/v1/token_security/56"
    f"?contract_addresses={TOKEN}"
)
MAJOR_THRESHOLD = Decimal("0.01")
ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"
MOTHER_ADDRESS = "0xcd60bf474e691f2484950a0276eaf507616ca4b9"
LEGACY_BANK_WALLET = "0xfa4d34c46e86058e672936fa03cfd79f4c7a4b3c"
PUBLIC_OWNERSHIP_UNVERIFIED_ADDRESSES = {
    "0xb73d6716005b37bec742d64482fa26033ee1a4e1",
    "0xef83804c264b47378fcf150086943b53fb90a90b",
}

ROOT = Path(__file__).resolve().parents[3]
REGISTRY_DIR = ROOT / "KGEN" / "registry" / "CoinMarketCap"
SNAPSHOT_PATH = REGISTRY_DIR / "kgen_cmc_supply_snapshot.json"
TOTAL_API_PATH = ROOT / "api" / "kgen" / "total-supply"
CIRCULATING_API_PATH = ROOT / "api" / "kgen" / "circulating-supply"
TOTAL_API_TXT_PATH = ROOT / "api" / "kgen" / "total-supply.txt"
CIRCULATING_API_TXT_PATH = ROOT / "api" / "kgen" / "circulating-supply.txt"


def _request_json(url: str, payload: dict | None = None) -> dict:
    body = None if payload is None else json.dumps(payload).encode("ascii")
    request = urllib.request.Request(
        url,
        data=body,
        headers={
            "Accept": "application/json",
            "Content-Type": "application/json",
            "User-Agent": "KGEN-CMC-supply-verifier/1.0",
        },
    )
    with urllib.request.urlopen(request, timeout=45) as response:
        return json.load(response)


def rpc(method: str, params: list) -> object:
    last_error: Exception | None = None
    for url in RPC_URLS:
        try:
            result = _request_json(
                url,
                {
                    "jsonrpc": "2.0",
                    "id": 1,
                    "method": method,
                    "params": params,
                },
            )
            if "error" in result:
                raise RuntimeError(result["error"])
            return result["result"]
        except Exception as exc:  # pragma: no cover - fallback depends on network
            last_error = exc
    raise RuntimeError(f"all configured BSC RPC endpoints failed: {last_error}")


def selector(signature: str) -> str:
    digest = str(rpc("web3_sha3", ["0x" + signature.encode("ascii").hex()]))
    return digest[2:10]


def eth_call(signature: str, block_tag: str, address: str | None = None) -> str:
    data = "0x" + selector(signature)
    if address:
        data += address.lower().removeprefix("0x").rjust(64, "0")
    return str(rpc("eth_call", [{"to": TOKEN, "data": data}, block_tag]))


def decode_uint(value: str) -> int:
    return int(value, 16)


def decode_address(value: str) -> str:
    return "0x" + value[-40:].lower()


def token_string(raw: int) -> str:
    whole, fractional = divmod(raw, 10**18)
    if not fractional:
        return str(whole)
    return f"{whole}.{fractional:018d}".rstrip("0")


def balance_of(address: str, block_tag: str) -> int:
    return decode_uint(eth_call("balanceOf(address)", block_tag, address))


def classify(
    address: str,
    owner: str,
    deployment_creator: str,
    bank: str,
    reward: str,
    auto_lp: str,
    pair: str,
) -> tuple[str, bool, str, str]:
    evidence = f"https://bscscan.com/token/{TOKEN}?a={address}"
    if address == owner:
        return (
            "GOVERNANCE",
            False,
            "Current on-chain owner; governance authority is distinct from deployment provenance.",
            evidence,
        )
    if address == deployment_creator:
        return (
            "FOUNDER_OR_TEAM_CONTROLLED",
            False,
            "Deployment creator reported by the holder index; not the current on-chain owner.",
            evidence,
        )
    if address == bank:
        return ("BANK", False, "Current on-chain bankWallet.", evidence)
    if address == LEGACY_BANK_WALLET:
        return (
            "BANK_LEGACY_RESERVE",
            False,
            "Historical KGEN bank receiver; changing bankWallet does not make its retained reserve circulating.",
            evidence,
        )
    if address == reward:
        return ("REWARD", False, "Current on-chain rewardWallet.", evidence)
    if address == auto_lp:
        return (
            "TREASURY",
            False,
            "Current on-chain autoLPWallet; project-controlled allocation.",
            evidence,
        )
    if address == MOTHER_ADDRESS:
        return (
            "FOUNDER_OR_TEAM_CONTROLLED",
            False,
            "Repository runtime records identify this address as MOTHER.",
            evidence,
        )
    if address == pair:
        return (
            "LIQUIDITY_POOL",
            True,
            "Canonical PancakeSwap V2 pair; KGEN is available to the public market.",
            evidence,
        )
    if address in PUBLIC_OWNERSHIP_UNVERIFIED_ADDRESSES:
        return (
            "PUBLIC_CIRCULATING",
            True,
            "Ownership is unverified; no evidence establishes project control, lock, vesting, or non-circulating status.",
            evidence,
        )
    return (
        "PUBLIC_CIRCULATING",
        True,
        "No evidence establishes project control, lock, vesting, or non-circulating status.",
        evidence,
    )


def main() -> None:
    go_plus = _request_json(GOPLUS_URL)
    token_info = go_plus["result"][TOKEN]
    ranked_holders = token_info["holders"]
    if not ranked_holders:
        raise RuntimeError("GoPlus returned no holders")
    if Decimal(ranked_holders[-1]["percent"]) >= MAJOR_THRESHOLD:
        raise RuntimeError("holder response does not extend below the major threshold")

    block_number = int(str(rpc("eth_blockNumber", [])), 16)
    block_tag = hex(block_number)
    block = rpc("eth_getBlockByNumber", [block_tag, False])
    block_hash = str(block["hash"])
    block_time = datetime.fromtimestamp(
        int(str(block["timestamp"]), 16), timezone.utc
    ).isoformat().replace("+00:00", "Z")

    total_raw = decode_uint(eth_call("totalSupply()", block_tag))
    max_raw = decode_uint(eth_call("TOTAL_SUPPLY()", block_tag))
    owner = decode_address(eth_call("owner()", block_tag))
    bank = decode_address(eth_call("bankWallet()", block_tag))
    reward = decode_address(eth_call("rewardWallet()", block_tag))
    auto_lp = decode_address(eth_call("autoLPWallet()", block_tag))
    pair = token_info["dex"][0]["pair"].lower()

    if Decimal(token_info["total_supply"]) != Decimal(token_string(total_raw)):
        raise RuntimeError("GoPlus total supply and frozen-block RPC total differ")
    deployment_creator = token_info["creator_address"].lower()
    if deployment_creator == ZERO_ADDRESS or owner == ZERO_ADDRESS:
        raise RuntimeError("creator or current on-chain owner is zero")

    major_holders: list[dict] = []
    excluded_raw = 0
    for ranked in ranked_holders:
        if Decimal(ranked["percent"]) < MAJOR_THRESHOLD:
            continue
        address = ranked["address"].lower()
        raw_balance = balance_of(address, block_tag)
        category, circulating, reason, evidence = classify(
            address, owner, deployment_creator, bank, reward, auto_lp, pair
        )
        if not circulating:
            excluded_raw += raw_balance
        major_holders.append(
            {
                "address": address,
                "balance": token_string(raw_balance),
                "balance_raw": str(raw_balance),
                "share_of_total_supply": format(
                    Decimal(raw_balance) / Decimal(total_raw), ".18f"
                ),
                "category": category,
                "included_in_circulating": circulating,
                "reason": reason,
                "bscscan_evidence": evidence,
                "is_contract": bool(ranked["is_contract"]),
            }
        )

    contract_balance_raw = balance_of(TOKEN, block_tag)
    if contract_balance_raw:
        excluded_raw += contract_balance_raw

    circulating_raw = total_raw - excluded_raw
    burned_raw = max_raw - total_raw
    if circulating_raw < 0 or burned_raw < 0:
        raise RuntimeError("invalid supply arithmetic")

    snapshot = {
        "schema_version": "1.0.0",
        "status": "VERIFIED_READ_ONLY_SNAPSHOT",
        "network": "BNB Smart Chain",
        "chain_id": 56,
        "contract": TOKEN,
        "decimals": 18,
        "snapshot": {
            "block_number": block_number,
            "block_hash": block_hash,
            "block_timestamp_utc": block_time,
            "generated_at_utc": datetime.now(timezone.utc)
            .isoformat()
            .replace("+00:00", "Z"),
            "rpc_method": "eth_call at frozen block",
            "holder_index_source": GOPLUS_URL,
            "holder_count": int(token_info["holder_count"]),
            "major_holder_threshold": "0.01",
        },
        "supply": {
            "nominal_max_supply": token_string(max_raw),
            "nominal_max_supply_raw": str(max_raw),
            "total_supply": token_string(total_raw),
            "total_supply_raw": str(total_raw),
            "burned_supply": token_string(burned_raw),
            "burned_supply_raw": str(burned_raw),
            "excluded_current_balances": token_string(excluded_raw),
            "excluded_current_balances_raw": str(excluded_raw),
            "circulating_supply": token_string(circulating_raw),
            "circulating_supply_raw": str(circulating_raw),
            "reconciliation": {
                "circulating_plus_excluded_equals_total": (
                    circulating_raw + excluded_raw == total_raw
                ),
                "total_plus_burned_equals_nominal_max": (
                    total_raw + burned_raw == max_raw
                ),
            },
        },
        "on_chain_roles": {
            "owner": owner,
            "deployment_creator_indexer": deployment_creator,
            "owner_matches_deployment_creator": owner == deployment_creator,
            "bank_wallet": bank,
            "legacy_bank_wallet": LEGACY_BANK_WALLET,
            "reward_wallet": reward,
            "auto_lp_wallet": auto_lp,
            "liquidity_pair": pair,
            "mother_repository_reference": MOTHER_ADDRESS,
        },
        "major_holders": major_holders,
        "other_classifications": [
            {
                "address": ZERO_ADDRESS,
                "balance": token_string(balance_of(ZERO_ADDRESS, block_tag)),
                "category": "BURN_ADDRESS",
                "included_in_circulating": False,
                "note": (
                    "Burns reduce totalSupply; burned_supply is outside current "
                    "holder balances and is not subtracted twice."
                ),
                "bscscan_evidence": f"https://bscscan.com/token/{TOKEN}?a={ZERO_ADDRESS}",
            },
            {
                "address": TOKEN,
                "balance": token_string(contract_balance_raw),
                "category": "CONTRACT_HELD",
                "included_in_circulating": False,
                "note": "Any non-zero token-contract balance is excluded.",
                "bscscan_evidence": f"https://bscscan.com/token/{TOKEN}?a={TOKEN}",
            },
        ],
        "methodology": {
            "formula": "circulating_supply = total_supply - excluded_current_balances",
            "major_holder_rule": "balance >= 1% of frozen totalSupply",
            "ownership_unverified_rule": (
                "Ownership-unverified balances remain circulating unless evidence "
                "establishes project control, lock, vesting, or another "
                "non-circulating classification."
            ),
            "liquidity_rule": (
                "Tokens in the public PancakeSwap pair are circulating; LP-token "
                "ownership is a separate classification."
            ),
            "coinmarketcap_reference": (
                "https://support.coinmarketcap.com/hc/en-us/articles/360043396252-"
                "Supply-Circulating-Total-Max"
            ),
        },
        "non_actions": {
            "token_transfer": False,
            "wallet_connection": False,
            "private_key_access": False,
            "contract_change": False,
            "token_configuration_change": False,
        },
    }

    canonical = json.dumps(
        snapshot, ensure_ascii=False, indent=2, sort_keys=True
    ).encode("utf-8")
    snapshot["integrity_sha256"] = hashlib.sha256(canonical).hexdigest()
    REGISTRY_DIR.mkdir(parents=True, exist_ok=True)
    SNAPSHOT_PATH.write_text(
        json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    TOTAL_API_PATH.parent.mkdir(parents=True, exist_ok=True)
    for path in (TOTAL_API_PATH, TOTAL_API_TXT_PATH):
        path.write_text(token_string(total_raw), encoding="ascii")
    for path in (CIRCULATING_API_PATH, CIRCULATING_API_TXT_PATH):
        path.write_text(token_string(circulating_raw), encoding="ascii")
    print(f"block={block_number}")
    print(f"total_supply={token_string(total_raw)}")
    print(f"excluded={token_string(excluded_raw)}")
    print(f"circulating_supply={token_string(circulating_raw)}")
    print(f"major_holders={len(major_holders)}")


if __name__ == "__main__":
    main()
