"""Offline lifecycle tests: no external HTTP, no existing site modification."""
import json
import sys
import tempfile
import unittest
from pathlib import Path

import sync


class DirectoryLifecycleTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.original = (sync.ROOT, sync.FOLDER, sync.SEED, sync.CATALOG, sync.TODAY, sync.probe, sys.argv[:])
        root = Path(self.temp.name)
        folder = root / "service-directory"
        folder.mkdir()
        sync.ROOT, sync.FOLDER = root, folder
        sync.SEED, sync.CATALOG, sync.TODAY = folder / "seed.json", folder / "catalog.json", "2026-10-09"
        self.slug = "sample-tool"
        self.page = root / self.slug / "index.html"
        self.page.parent.mkdir()
        self.page.write_text("<!doctype html><html><head><title>サンプル</title></head><body>利用可能</body></html>", encoding="utf-8")
        self.item = {
            "id": self.slug,
            "name": "サンプルツール",
            "description": "これは検証用の第一者サービスです。",
            "category": "その他",
            "tags": ["便利"],
            "url": "https://osakenpiro.github.io/sample-tool/",
            "source_path": "sample-tool/index.html",
            "commercial_relation": "none",
        }
        self.write_seed([self.item])
        sync.CATALOG.write_text(json.dumps({"services": []}, ensure_ascii=False), encoding="utf-8")
        sync.probe = lambda url: (False, "HTTP 503")

    def tearDown(self):
        sync.ROOT, sync.FOLDER, sync.SEED, sync.CATALOG, sync.TODAY, sync.probe, prior_args = self.original
        sys.argv = prior_args
        self.temp.cleanup()

    def write_seed(self, services):
        sync.SEED.write_text(json.dumps({"services": services}, ensure_ascii=False), encoding="utf-8")

    def cycle(self):
        sys.argv = ["sync.py"]
        sync.run()
        return json.loads(sync.CATALOG.read_text(encoding="utf-8"))["services"]

    def test_three_failures_hide_without_deleting_history_then_recovery(self):
        a = self.cycle()[0]
        self.assertEqual((a["state"], a["failures"]), ("watch", 1))
        b = self.cycle()[0]
        self.assertEqual((b["state"], b["failures"]), ("watch", 2))
        c = self.cycle()[0]
        self.assertEqual((c["state"], c["failures"]), ("hidden", 3))
        sync.probe = lambda url: (True, "HTTP 200確認")
        d = self.cycle()[0]
        self.assertEqual((d["state"], d["failures"]), ("active", 0))
        self.assertEqual(len(self.cycle()), 1)

    def test_noindex_vetoes_promotion(self):
        self.page.write_text(
            '<!doctype html><html><head><meta name="robots" content="noindex,follow"><title>サンプル</title></head></html>',
            encoding="utf-8",
        )
        sync.probe = lambda url: (True, "HTTP 200確認")
        r = self.cycle()[0]
        self.assertEqual(r["state"], "hidden")
        self.assertIn("noindex", r["reason"])

    def test_retirement_is_preserved_after_index_is_removed(self):
        sync.probe = lambda url: (True, "HTTP 200確認")
        self.assertEqual(self.cycle()[0]["state"], "active")
        retired = dict(self.item, retired=True)
        self.write_seed([retired])
        self.page.unlink()
        self.assertEqual(self.cycle()[0]["state"], "retired")
        self.write_seed([])
        self.assertEqual(self.cycle()[0]["state"], "retired")

    def test_first_party_manifest_auto_adds_then_hides_without_erasure(self):
        self.write_seed([])
        manifest = self.page.parent / "service-entry.json"
        contents = dict(self.item)
        contents.pop("source_path")
        manifest.write_text(json.dumps(contents, ensure_ascii=False), encoding="utf-8")
        sync.probe = lambda url: (True, "HTTP 200確認")
        r = self.cycle()[0]
        self.assertEqual((r["id"], r["state"], r["source"]), ("sample-tool", "active", "self-manifest"))
        manifest.unlink()
        r = self.cycle()[0]
        self.assertEqual((r["state"], r["id"]), ("hidden", "sample-tool"))
        self.assertIn("登録元", r["reason"])

    def test_wrong_domain_cannot_be_listed(self):
        self.item["url"] = "https://example.net/"
        self.write_seed([self.item])
        self.assertEqual(self.cycle()[0]["state"], "hidden")


if __name__ == "__main__":
    unittest.main()
