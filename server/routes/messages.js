const express = require("express");

const { db } = require("../db");
const { requireAuth, requireRole } = require("../auth");

const router = express.Router();

router.get("/", requireAuth, requireRole(["admin1", "admin2"]), (_req, res) => {
  const rows = db.prepare("SELECT id, name, email, company, message, created_at FROM messages ORDER BY created_at DESC LIMIT 200").all();
  return res.json({ messages: rows });
});

module.exports = router;

