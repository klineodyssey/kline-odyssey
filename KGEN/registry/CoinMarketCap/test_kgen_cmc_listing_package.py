import csv
import hashlib
import json
import unittest
import zipfile
from decimal import Decimal
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
CMC = ROOT / "KGEN" / "registry" / "CoinMarketCap"
API = ROOT / "api" / "kgen"

TOTAL = Decimal("71980505.786117825703641")
CIRCULATING = Decimal("4366878.985936300061217422")
EXCLUDED = Decimal("67613626.800181525642423578")
MAX_SUPPLY = Decimal("72000000")
BURNED = Decimal("19494.213882174296359")


class CmcListingPackageTests(unittest.TestCase):
    def test_supply_api_plain_numeric_bodies(self):
        expected = {
            "total-supply.txt": str(TOTAL),
            "circulating-supply.txt": str(CIRCULATING),
        }
        for name, value in expected.items():
            body = (API / name).read_bytes()
            self.assertEqual(body, value.encode("ascii"))
            self.assertNotIn(b"\n", body)
            self.assertNotIn(b",", body)
        self.assertEqual(
            (API / "total-supply").read_bytes(),
            (API / "total-supply.txt").read_bytes(),
        )
        self.assertEqual(
            (API / "circulating-supply").read_bytes(),
            (API / "circulating-supply.txt").read_bytes(),
        )

    def test_annex_a_exact_reconciliation(self):
        with (CMC / "KGEN_CMC_ANNEX_A_RICH_LIST_AND_RESERVES_V1.csv").open(
            encoding="utf-8", newline=""
        ) as handle:
            rows = list(csv.DictReader(handle))
        circulating = sum(
            Decimal(row["Token Balance KGEN"])
            for row in rows
            if row["Circulating Status"] == "CIRCULATING"
        )
        excluded = sum(
            Decimal(row["Token Balance KGEN"])
            for row in rows
            if row["Circulating Status"] == "NON_CIRCULATING"
        )
        self.assertEqual(circulating, CIRCULATING)
        self.assertEqual(excluded, EXCLUDED)
        self.assertEqual(circulating + excluded, TOTAL)

    def test_snapshot_supply_matches_annex(self):
        snapshot = json.loads(
            (CMC / "kgen_cmc_supply_snapshot.json").read_text(encoding="utf-8")
        )
        supply = snapshot["supply"]
        self.assertEqual(Decimal(supply["total_supply"]), TOTAL)
        self.assertEqual(Decimal(supply["circulating_supply"]), CIRCULATING)
        self.assertEqual(Decimal(supply["excluded_current_balances"]), EXCLUDED)
        self.assertEqual(Decimal(supply["nominal_max_supply"]), MAX_SUPPLY)
        self.assertEqual(Decimal(supply["burned_supply"]), BURNED)
        self.assertEqual(TOTAL + BURNED, MAX_SUPPLY)

    def test_only_five_evidenced_project_wallets_are_excluded(self):
        with (CMC / "KGEN_CMC_ANNEX_A_RICH_LIST_AND_RESERVES_V1.csv").open(
            encoding="utf-8", newline=""
        ) as handle:
            rows = list(csv.DictReader(handle))
        excluded = [
            row
            for row in rows
            if row["Circulating Status"] == "NON_CIRCULATING"
            and Decimal(row["Token Balance KGEN"]) > 0
        ]
        self.assertEqual(len(excluded), 5)
        self.assertEqual(
            {row["Classification"] for row in excluded},
            {"FOUNDER_OR_TEAM_CONTROLLED", "TREASURY", "BANK", "REWARD"},
        )
        reclassified = {
            row["Wallet Address"]: row
            for row in rows
            if row["Wallet Address"]
            in {
                "0xb73d6716005b37bec742d64482fa26033ee1a4e1",
                "0xef83804c264b47378fcf150086943b53fb90a90b",
            }
        }
        self.assertEqual(len(reclassified), 2)
        for row in reclassified.values():
            self.assertEqual(row["Classification"], "PUBLIC_CIRCULATING")
            self.assertEqual(row["Circulating Status"], "CIRCULATING")
            self.assertEqual(row["Project Control Status"], "OWNERSHIP_UNVERIFIED")

    def test_coingecko_wallet_package_has_only_five_project_wallets(self):
        report = (
            CMC / "KGEN_CMC_CIRCULATING_SUPPLY_VERIFICATION.md"
        ).read_text(encoding="utf-8")
        section = report.split(
            "## CoinGecko Vested/Locked Wallet Submission Package", 1
        )[1].split("## Reconciliation", 1)[0]
        expected = {
            "0xb3c54ca96de0ded4ca0151f629ff9781506ba261",
            "0xe87f6975fa3d4f3d56dce49fc978884285a3ed85",
            "0xfa4d34c46e86058e672936fa03cfd79f4c7a4b3c",
            "0x0fd21cf643211d067a18a416da219827da26e288",
            "0xcd60bf474e691f2484950a0276eaf507616ca4b9",
        }
        for address in expected:
            self.assertIn(address, section)
        self.assertEqual(section.count("| `0x"), 5)
        self.assertNotIn(
            "0xb73d6716005b37bec742d64482fa26033ee1a4e1", section
        )
        self.assertNotIn(
            "0xef83804c264b47378fcf150086943b53fb90a90b", section
        )

    def test_all_annex_classifications_documented(self):
        report = (
            CMC / "KGEN_CMC_ANNEX_A_RICH_LIST_AND_RESERVES_V1.md"
        ).read_text(encoding="utf-8")
        required = {
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
        }
        for classification in required:
            self.assertIn(f"`{classification}`", report)

    def test_emission_schedule_has_no_future_emission(self):
        with (CMC / "KGEN_CMC_EMISSION_RELEASE_SCHEDULE_V1.csv").open(
            encoding="utf-8", newline=""
        ) as handle:
            rows = list(csv.DictReader(handle))
        future = next(row for row in rows if row["Date"] == "FUTURE")
        self.assertEqual(future["Emission Amount KGEN"], "0")
        self.assertEqual(future["Release Amount KGEN"], "0")
        self.assertEqual(future["Policy"], "NO_SCHEDULED_ADDITIONAL_EMISSION")

    def test_workbooks_are_valid_xlsx_with_expected_sheets(self):
        expected = {
            "KGEN_CMC_ANNEX_A_RICH_LIST_AND_RESERVES_V1.xlsx": {
                "Annex A",
                "Reconciliation",
                "Sources",
            },
            "KGEN_CMC_EMISSION_RELEASE_SCHEDULE_V1.xlsx": {
                "Emission Schedule",
                "Policy Summary",
            },
        }
        for name, sheet_names in expected.items():
            with zipfile.ZipFile(CMC / name) as archive:
                self.assertIsNone(archive.testzip())
                workbook = archive.read("xl/workbook.xml").decode("utf-8")
                for sheet_name in sheet_names:
                    self.assertIn(f'name="{sheet_name}"', workbook)

    def test_artifact_sha256_values(self):
        expected = {
            "KGEN_CMC_ANNEX_A_RICH_LIST_AND_RESERVES_V1.xlsx":
                "9d5136e9b18c98db520eb85f46824aa10b05fa652de95aea6fd55b684d8f1c63",
            "KGEN_CMC_ANNEX_A_RICH_LIST_AND_RESERVES_V1.csv":
                "184f58f9ec4cb93ef17bd599cef547a475c88caf9abac9e9a5cc889c999171c5",
            "KGEN_CMC_EMISSION_RELEASE_SCHEDULE_V1.xlsx":
                "4044872d9d710270dcf93d953f362000f1f7e5d5f9a783738131954d2fce772a",
            "KGEN_CMC_EMISSION_RELEASE_SCHEDULE_V1.csv":
                "418127e023dcb16524b0a8c94065ffc1870dd4fd4afebe1dcb20b2b9c9b087ef",
        }
        for name, digest in expected.items():
            payload = (CMC / name).read_bytes()
            if name.endswith(".csv"):
                payload = payload.replace(b"\r\n", b"\n")
            actual = hashlib.sha256(payload).hexdigest()
            self.assertEqual(actual, digest)

    def test_submission_record_has_exact_final_values(self):
        record = (CMC / "KGEN_CMC_NEW_LISTING_SUBMISSION_V1.md").read_text(
            encoding="utf-8"
        )
        required = [
            str(TOTAL),
            str(CIRCULATING),
            str(MAX_SUPPLY),
            "https://klineodyssey.github.io/kline-odyssey/api/kgen/total-supply.txt",
            "https://klineodyssey.github.io/kline-odyssey/api/kgen/circulating-supply.txt",
            "https://klineodyssey.github.io/kline-odyssey/assets/kgen/kgen-logo-200.png",
            "NO_SCHEDULED_ADDITIONAL_EMISSION",
            "READY_FOR_EXTERNAL_SUBMISSION_NOT_SUBMITTED",
        ]
        for value in required:
            self.assertIn(value, record)
        self.assertNotIn("TODO", record)
        self.assertNotIn("TBD", record)

    def test_public_post_has_no_fabricated_ticket(self):
        post = (CMC / "KGEN_CMC_PUBLIC_VERIFICATION_POST_TEMPLATE_V1.md").read_text(
            encoding="utf-8"
        )
        self.assertIn("[INSERT_AFTER_SUBMISSION]", post)
        self.assertIn("DO_NOT_PUBLISH_BEFORE_REAL_TICKET_NUMBER", post)


if __name__ == "__main__":
    unittest.main()
