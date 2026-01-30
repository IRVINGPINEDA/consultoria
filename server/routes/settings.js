const express = require("express");

const { db } = require("../db");
const { requireAuth, requireRole } = require("../auth");

const router = express.Router();

const getAllSettings = () => {
  const rows = db.prepare("SELECT key, value FROM settings").all();
  const out = {};
  for (const r of rows) out[r.key] = r.value;
  return out;
};

router.get("/", (_req, res) => {
  return res.json({ settings: getAllSettings() });
});

router.put("/", requireAuth, requireRole(["admin1"]), (req, res) => {
  const settings = req.body?.settings;
  if (!settings || typeof settings !== "object") return res.status(400).json({ error: "invalid_payload" });

  const insert = db.prepare("INSERT INTO settings (key, value) VALUES (@key, @value) ON CONFLICT(key) DO UPDATE SET value=excluded.value");
  const tx = db.transaction(() => {
    for (const [key, value] of Object.entries(settings)) {
      const k = String(key).trim();
      if (!k) continue;
      insert.run({ key: k, value: String(value ?? "") });
    }
  });
  tx();

  return res.json({ settings: getAllSettings() });
});

module.exports = router;

