# -*- coding: utf-8 -*-
from __future__ import annotations

import importlib.util
import tempfile
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parents[1]
PIPELINE = ROOT / "scripts" / "tx_full_day_pipeline_v882_UTF8BOM.py"

spec = importlib.util.spec_from_file_location("tx_pipeline", PIPELINE)
module = importlib.util.module_from_spec(spec)
assert spec and spec.loader
spec.loader.exec_module(module)

H = module.HEADERS19


def row(date, month, o, h, l, c, vol, settle, oi, session):
    return [
        date, "TX", month, o, h, l, c,
        0, "0%", vol, settle, oi, 0, 0,
        0, 0, "", session, 0,
    ]


def main() -> None:
    # 2026-08-19 視為結算日：當月 202608 結算價 0，仍必須選 202608。
    # 2026-08-20 到期月已消失，才自然切換 202609。
    rows = [
        row("2026/08/19", "202608", 22800, 22900, 22700, 22850, 100, "", "", "盤後"),
        row("2026/08/19", "202608", 22860, 23000, 22800, 22980, 200, 0, 12345, "一般"),
        row("2026/08/19", "202609", 23000, 23100, 22900, 23050, 50, 23040, 54321, "一般"),
        row("2026/08/20", "202609", 23020, 23200, 23000, 23100, 120, "", "", "盤後"),
        row("2026/08/20", "202609", 23110, 23300, 23080, 23250, 220, 23240, 55000, "一般"),
    ]

    with tempfile.TemporaryDirectory() as tmp:
        csv_path = Path(tmp) / "Daily_202608.csv"
        master_path = Path(tmp) / "台指近全.xlsx"
        pd.DataFrame(rows, columns=H).to_csv(csv_path, index=False, encoding="utf-8-sig")

        outputs = module.run([str(csv_path)], str(master_path), None)
        assert master_path.exists(), outputs

        result = pd.read_excel(master_path)
        assert len(result) == 2

        d1 = result[result["交易日期"] == 20260819].iloc[0]
        assert str(int(d1["到期月份(週別)"])) == "202608"
        assert d1["開盤價"] == 22800
        assert d1["收盤價"] == 22980
        assert d1["最高價"] == 23000
        assert d1["最低價"] == 22700
        assert d1["成交量"] == 300
        assert d1["結算價"] == 0
        assert d1["未沖銷契約數"] == 12345

        d2 = result[result["交易日期"] == 20260820].iloc[0]
        assert str(int(d2["到期月份(週別)"])) == "202609"
        assert d2["開盤價"] == 23020
        assert d2["收盤價"] == 23250
        assert d2["成交量"] == 340

        module.validate_near_full(result)

    print("TAIFEX regression test passed")


if __name__ == "__main__":
    main()
