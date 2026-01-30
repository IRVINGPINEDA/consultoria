const express = require("express");

const { db } = require("../db");
const { requireAuth, requireRole } = require("../auth");

const router = express.Router();

const asJson = (v, fallback) => {
  try {
    const parsed = JSON.parse(v);
    return parsed;
  } catch {
    return fallback;
  }
};

const rowToProject = (r) => ({
  id: r.id,
  title: r.title,
  summary: r.summary,
  industry: r.industry,
  ownerName: r.owner_name,
  ownerRole: r.owner_role,
  results: asJson(r.results_json, []),
  bullets: asJson(r.bullets_json, []),
  clientEmail: r.client_email,
  published: Boolean(r.published),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

router.get("/", (req, res) => {
  const q = String(req.query?.q ?? "").trim().toLowerCase();
  const publishedOnly = true;

  let rows;
  if (q) {
    rows = db
      .prepare(
        `
        SELECT * FROM projects
        WHERE (${publishedOnly ? "published = 1 AND" : ""} (lower(title) LIKE ? OR lower(summary) LIKE ?))
        ORDER BY updated_at DESC
      `
      )
      .all(`%${q}%`, `%${q}%`);
  } else {
    rows = db.prepare(`SELECT * FROM projects WHERE published = 1 ORDER BY updated_at DESC`).all();
  }

  return res.json({ projects: rows.map(rowToProject) });
});

router.get("/all", requireAuth, requireRole(["admin1", "admin2"]), (_req, res) => {
  const rows = db.prepare("SELECT * FROM projects ORDER BY updated_at DESC").all();
  return res.json({ projects: rows.map(rowToProject) });
});

router.get("/mine", requireAuth, requireRole(["cliente"]), (req, res) => {
  const email = String(req.user.email || "").toLowerCase();
  const rows = db
    .prepare("SELECT * FROM projects WHERE published = 1 AND lower(client_email) = ? ORDER BY updated_at DESC")
    .all(email);
  return res.json({ projects: rows.map(rowToProject) });
});

router.post("/", requireAuth, requireRole(["admin1", "admin2"]), (req, res) => {
  const title = String(req.body?.title ?? "").trim();
  const summary = String(req.body?.summary ?? "").trim();
  const industry = String(req.body?.industry ?? "").trim();
  const ownerName = String(req.body?.ownerName ?? "").trim();
  const ownerRole = String(req.body?.ownerRole ?? "").trim();
  const results = Array.isArray(req.body?.results) ? req.body.results : [];
  const bullets = Array.isArray(req.body?.bullets) ? req.body.bullets : [];
  const clientEmail = String(req.body?.clientEmail ?? "").trim().toLowerCase() || null;
  const published = req.body?.published === false ? 0 : 1;

  if (!title || !summary) return res.status(400).json({ error: "missing_fields" });

  const stmt = db.prepare(`
    INSERT INTO projects (title, summary, industry, owner_name, owner_role, results_json, bullets_json, client_email, published, updated_at)
    VALUES (@title, @summary, @industry, @owner_name, @owner_role, @results_json, @bullets_json, @client_email, @published, datetime('now'))
  `);
  const info = stmt.run({
    title,
    summary,
    industry,
    owner_name: ownerName,
    owner_role: ownerRole,
    results_json: JSON.stringify(results),
    bullets_json: JSON.stringify(bullets),
    client_email: clientEmail,
    published,
  });

  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(info.lastInsertRowid);
  return res.json({ project: rowToProject(row) });
});

router.put("/:id", requireAuth, requireRole(["admin1", "admin2"]), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid_id" });

  const exists = db.prepare("SELECT id FROM projects WHERE id = ?").get(id);
  if (!exists) return res.status(404).json({ error: "not_found" });

  const title = String(req.body?.title ?? "").trim();
  const summary = String(req.body?.summary ?? "").trim();
  const industry = String(req.body?.industry ?? "").trim();
  const ownerName = String(req.body?.ownerName ?? "").trim();
  const ownerRole = String(req.body?.ownerRole ?? "").trim();
  const results = Array.isArray(req.body?.results) ? req.body.results : [];
  const bullets = Array.isArray(req.body?.bullets) ? req.body.bullets : [];
  const clientEmail = String(req.body?.clientEmail ?? "").trim().toLowerCase() || null;
  const published = req.body?.published === false ? 0 : 1;

  if (!title || !summary) return res.status(400).json({ error: "missing_fields" });

  db.prepare(
    `
    UPDATE projects
    SET title=@title,
        summary=@summary,
        industry=@industry,
        owner_name=@owner_name,
        owner_role=@owner_role,
        results_json=@results_json,
        bullets_json=@bullets_json,
        client_email=@client_email,
        published=@published,
        updated_at=datetime('now')
    WHERE id=@id
  `
  ).run({
    id,
    title,
    summary,
    industry,
    owner_name: ownerName,
    owner_role: ownerRole,
    results_json: JSON.stringify(results),
    bullets_json: JSON.stringify(bullets),
    client_email: clientEmail,
    published,
  });

  const row = db.prepare("SELECT * FROM projects WHERE id = ?").get(id);
  return res.json({ project: rowToProject(row) });
});

router.delete("/:id", requireAuth, requireRole(["admin1"]), (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return res.status(400).json({ error: "invalid_id" });
  db.prepare("DELETE FROM projects WHERE id = ?").run(id);
  return res.json({ ok: true });
});

module.exports = router;
