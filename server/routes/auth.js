const express = require("express");

const { db } = require("../db");
const { signToken, verifyPassword, requireAuth } = require("../auth");

const router = express.Router();

router.post("/login", async (req, res) => {
  const email = String(req.body?.email ?? "").trim().toLowerCase();
  const password = String(req.body?.password ?? "");
  if (!email || !password) return res.status(400).json({ error: "missing_fields" });

  const user = db
    .prepare("SELECT id, email, name, role, password_hash FROM users WHERE email = ?")
    .get(email);
  if (!user) return res.status(401).json({ error: "invalid_credentials" });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "invalid_credentials" });

  const token = signToken(user);
  return res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
});

router.get("/me", requireAuth, (req, res) => {
  return res.json({ user: { id: req.user.sub, email: req.user.email, name: req.user.name, role: req.user.role } });
});

module.exports = router;

