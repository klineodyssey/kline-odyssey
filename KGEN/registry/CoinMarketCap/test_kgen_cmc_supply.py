#!/usr/bin/env python3
"""Offline validation for the frozen KGEN CMC supply snapshot."""

from __future__ import annotations

import hashlib
import json
import re
import unittest
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
REGISTRY = ROOT / "KGEN" / "registry" / "CoinMarketCap"
SNAPSHOT = REGISTRY / "kgen_cmc_supply_snapshot.json"
TOTAL_API = ROOT / "api" / "kgen" / "total-supply.txt"
CIRCULATING_API = ROOT / "api" / "kgen" / "circulating-supply.txt"
LEGACY_TOTAL_API = ROOT / "api" / "kgen" / "total-supply"
LEGACY_CIRCULATING_API = ROOT / "api" / "kgen" / "circulating-supply"
NUMBER = re.compile(rb"^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$")


class KgenCmcSupplyTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.data = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        cls.supply = cls.data["supply"]

    def test_contract_and_max_supply(self) -> None:
        self.assertEqual(
            self.data["contract"], "0xba3d3810e58735cb6813bc1cdc5458c0d71432be"
        )
        self.assertEqual(self.data["decimals"], 18)
        self.assertEqual(self.supply["nominal_max_supply"], "72000000")

    def test_supply_reconciliation(self) -> None:
        total = Decimal(self.supply["total_supply"])
        circulating = Decimal(self.supply["circulating_supply"])
        excluded = Decimal(self.supply["excluded_current_balances"])
        burned = Decimal(self.supply["burned_supply"])
        self.assertEqual(circulating + excluded, total)
        self.assertEqual(total + burned, Decimal("72000000"))
        self.assertTrue(
            self.supply["reconciliation"][
                "circulating_plus_excluded_equals_total"
            ]
        )

    def test_all_major_holders_are_accounted_for(self) -> None:
        holders = self.data["major_holders"]
        self.assertGreater(len(holders), 0)
        self.assertEqual(len({item["address"] for item in holders}), len(holders))
        for holder in holders:
            self.assertGreaterEqual(
                Decimal(holder["share_of_total_supply"]), Decimal("0.01")
            )
            self.assertIn(
                holder["category"],
                {
                    "PUBLIC_CIRCULATING",
                    "LIQUIDITY_POOL",
                    "FOUNDER_OR_TEAM_CONTROLLED",
                    "TREASURY",
                    "BANK",
                    "REWARD",
                    "LOCKED",
                    "BURN_ADDRESS",
                    "CONTRACT_HELD",
                    "UNKNOWN",
                },
            )
            self.assertTrue(holder["bscscan_evidence"].startswith("https://bscscan.com/"))

    def test_mandatory_project_categories_are_excluded(self) -> None:
        for holder in self.data["major_holders"]:
            if holder["category"] in {
                "FOUNDER_OR_TEAM_CONTROLLED",
                "TREASURY",
                "BANK",
                "REWARD",
                "LOCKED",
                "BURN_ADDRESS",
                "CONTRACT_HELD",
            }:
                self.assertFalse(holder["included_in_circulating"])

    def test_ownership_unverified_holders_are_circulating(self) -> None:
        expected = {
            "0xb73d6716005b37bec742d64482fa26033ee1a4e1",
            "0xef83804c264b47378fcf150086943b53fb90a90b",
        }
        holders = {
            item["address"]: item
            for item in self.data["major_holders"]
            if item["address"] in expected
        }
        self.assertEqual(set(holders), expected)
        for holder in holders.values():
            self.assertEqual(holder["category"], "PUBLIC_CIRCULATING")
            self.assertTrue(holder["included_in_circulating"])

    def test_liquidity_is_separate_from_project_control(self) -> None:
        pools = [
            item
            for item in self.data["major_holders"]
            if item["category"] == "LIQUIDITY_POOL"
        ]
        self.assertEqual(len(pools), 1)
        self.assertTrue(pools[0]["included_in_circulating"])

    def test_pure_number_api_files(self) -> None:
        total_body = TOTAL_API.read_bytes()
        circulating_body = CIRCULATING_API.read_bytes()
        self.assertRegex(total_body, NUMBER)
        self.assertRegex(circulating_body, NUMBER)
        self.assertNotIn(b"\n", total_body)
        self.assertNotIn(b"\n", circulating_body)
        self.assertEqual(total_body.decode("ascii"), self.supply["total_supply"])
        self.assertEqual(
            circulating_body.decode("ascii"), self.supply["circulating_supply"]
        )
        self.assertEqual(LEGACY_TOTAL_API.read_bytes(), total_body)
        self.assertEqual(LEGACY_CIRCULATING_API.read_bytes(), circulating_body)

    def test_snapshot_integrity_hash(self) -> None:
        unsigned = dict(self.data)
        expected = unsigned.pop("integrity_sha256")
        canonical = json.dumps(
            unsigned, ensure_ascii=False, indent=2, sort_keys=True
        ).encode("utf-8")
        self.assertEqual(hashlib.sha256(canonical).hexdigest(), expected)

    def test_no_live_side_effects(self) -> None:
        self.assertEqual(
            self.data["non_actions"],
            {
                "token_transfer": False,
                "wallet_connection": False,
                "private_key_access": False,
                "contract_change": False,
                "token_configuration_change": False,
            },
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)
