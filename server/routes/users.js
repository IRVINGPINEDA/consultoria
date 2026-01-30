const express = require("express");

const { db } = require("../db");
const { requireAuth, requireRole, hashPassword } = require("../auth");

const router = express.Router();

router.get("/", requireAuth, requireRole(["admin1"]), (req, res) => {
  const role = String(req.query?.role ?? "").trim();
  const rows = role
    ? db.prepare("SELECT id, email, name, role, created_at FROM users WHERE role = ? ORDER BY created_at DESC").all(role)
    : db.prepare("SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC").all();
  return res.json({ users: rows });
});

router.post("/", requireAuth, requireRole(["admin1"]), async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const name = String(req.body?.name ?? "").trim();
  const role = String(req.body?.role ?? "").trim();
  const password = String(req.body?.password ?? "");

  if (!email || !name || !role || !password) return res.status(400).json({ error: "missing_fields" });
  if (!["admin1", "admin2", "cliente"].includes(role)) return res.status(400).json({ error: "invalid_role" });
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) return res.status(400).json({ error: "invalid_email" });
  if (password.length < 8) return res.status(400).json({ error: "weak_password" });

  const passwordHash = await hashPassword(password);
  try {
    const info = db
      .prepare("INSERT INTO users (email, name, role, password_hash) VALUES (@email, @name, @role, @password_hash)")
      .run({ email, name, role, password_hash: passwordHash });
    const user = db.prepare("SELECT id, email, name, role, created_at FROM users WHERE id = ?").get(info.lastInsertRowid);
    return res.json({ user });
  } catch (e) {
    return res.status(409).json({ error: "email_exists" });
  }
});

module.exports = router;

