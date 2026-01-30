const path = require("node:path");

const express = require("express");

const { dbPath } = require("./db");
const authRoutes = require("./routes/auth");
const projectsRoutes = require("./routes/projects");
const settingsRoutes = require("./routes/settings");
const messagesRoutes = require("./routes/messages");
const usersRoutes = require("./routes/users");

const app = express();

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => res.json({ ok: true, dbPath }));

app.use("/api/auth", authRoutes);
app.use("/api/projects", projectsRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/messages", messagesRoutes);
app.use("/api/users", usersRoutes);

app.post("/api/contact", (req, res) => {
  const name = String(req.body?.name ?? "").trim();
  const email = String(req.body?.email ?? "").trim();
  const company = String(req.body?.company ?? "").trim();
  const message = String(req.body?.message ?? "").trim();

  if (!name || !email || !message) return res.status(400).json({ error: "missing_fields" });
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) return res.status(400).json({ error: "invalid_email" });

  const { db } = require("./db");
  const stmt = db.prepare(
    "INSERT INTO messages (name, email, company, message) VALUES (@name, @email, @company, @message)"
  );
  const info = stmt.run({ name, email, company, message });
  return res.json({ ok: true, id: info.lastInsertRowid });
});

// Static files
const rootDir = process.cwd();
app.use(express.static(rootDir, { extensions: ["html"] }));
app.use("/pages", express.static(path.join(rootDir, "pages"), { extensions: ["html"] }));

// Fallback to index
app.get("/", (_req, res) => res.sendFile(path.join(rootDir, "index.html")));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${port}`);
});
