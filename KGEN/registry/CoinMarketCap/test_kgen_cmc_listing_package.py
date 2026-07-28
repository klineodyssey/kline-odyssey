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
CIRCULATING = Decimal("2896511.372639273602111511")
EXCLUDED = Decimal("69083994.413478552101529489")
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
                "c65ecb7eee667871a82f82bca1a89784cb11df76bac4974eea7c7cdb519059f4",
            "KGEN_CMC_ANNEX_A_RICH_LIST_AND_RESERVES_V1.csv":
                "5534c66af24b2ab167b69b9eb295aa17514ac8cad94f5ce837a046e259b64826",
            "KGEN_CMC_EMISSION_RELEASE_SCHEDULE_V1.xlsx":
                "2f7ec2eece6168cb781d58a4f7965a14cf35b5a75e3d9f1802d5c46851a39d6e",
            "KGEN_CMC_EMISSION_RELEASE_SCHEDULE_V1.csv":
                "970d2f6a2f1f2a8b21d3afceb43cc7563f53b31cefbf43575e5b4324d344a98f",
        }
        for name, digest in expected.items():
            actual = hashlib.sha256((CMC / name).read_bytes()).hexdigest()
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
