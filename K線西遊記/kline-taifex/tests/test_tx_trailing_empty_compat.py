# -*- coding: utf-8 -*-
from __future__ import annotations

import csv
import importlib.util
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PIPELINE_PATH = ROOT / "scripts" / "tx_full_day_pipeline_v882_UTF8BOM.py"


def load_pipeline():
    spec = importlib.util.spec_from_file_location("tx_pipeline_trailing_empty_compat", PIPELINE_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class TrailingEmptyCompatibilityTests(unittest.TestCase):
    def setUp(self):
        self.module = load_pipeline()
        self.row19 = [
            "2026/08/04", "TX", "202608", "1", "2", "0", "1", "0", "0%", "1",
            "1", "1", "1", "1", "2", "0", "", "一般", "",
        ]
        self.assertEqual(len(self.row19), 19)

    def _write_csv(self, row):
        handle = tempfile.NamedTemporaryFile("w", encoding="utf-8", newline="", suffix=".csv", delete=False)
        path = Path(handle.name)
        try:
            writer = csv.writer(handle, lineterminator="\n")
            writer.writerow(self.module.HEADERS19)
            writer.writerow(row)
        finally:
            handle.close()
        self.addCleanup(path.unlink, missing_ok=True)
        return path

    def test_accepts_exactly_one_extra_terminal_empty_field(self):
        path = self._write_csv(self.row19 + [""])
        frame = self.module.read_csv_strict_19_multiline(str(path))
        self.assertEqual(frame.shape, (1, 19))
        self.assertEqual(frame.iloc[0].tolist(), self.row19)

    def test_rejects_nonempty_twentieth_field(self):
        path = self._write_csv(self.row19 + ["unexpected"])
        with self.assertRaisesRegex(ValueError, "20 欄"):
            self.module.read_csv_strict_19_multiline(str(path))

    def test_rejects_more_than_one_extra_terminal_empty_field(self):
        path = self._write_csv(self.row19 + ["", ""])
        with self.assertRaisesRegex(ValueError, "21 欄"):
            self.module.read_csv_strict_19_multiline(str(path))


if __name__ == "__main__":
    unittest.main()
