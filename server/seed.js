const { db } = require("./db");
const { hashPassword } = require("./auth");

const upsertSetting = db.prepare(
  "INSERT INTO settings (key, value) VALUES (@key, @value) ON CONFLICT(key) DO UPDATE SET value=excluded.value"
);

const upsertUser = db.prepare(`
  INSERT INTO users (email, name, role, password_hash)
  VALUES (@email, @name, @role, @password_hash)
  ON CONFLICT(email) DO UPDATE SET
    name=excluded.name,
    role=excluded.role,
    password_hash=excluded.password_hash
`);

const insertProject = db.prepare(`
  INSERT INTO projects (title, summary, industry, owner_name, owner_role, results_json, bullets_json, client_email, published, updated_at)
  VALUES (@title, @summary, @industry, @owner_name, @owner_role, @results_json, @bullets_json, @client_email, @published, datetime('now'))
`);

const main = async () => {
  const admin1Pass = process.env.SEED_ADMIN1_PASSWORD || "Admin1!123";
  const admin2Pass = process.env.SEED_ADMIN2_PASSWORD || "Admin2!123";
  const clientPass = process.env.SEED_CLIENT_PASSWORD || "Cliente!123";

  const admin1Hash = await hashPassword(admin1Pass);
  const admin2Hash = await hashPassword(admin2Pass);
  const clientHash = await hashPassword(clientPass);

  upsertUser.run({
    email: "admin1@demo.local",
    name: "Admin 1",
    role: "admin1",
    password_hash: admin1Hash,
  });
  upsertUser.run({
    email: "admin2@demo.local",
    name: "Admin 2",
    role: "admin2",
    password_hash: admin2Hash,
  });
  upsertUser.run({
    email: "cliente@demo.local",
    name: "Cliente Demo",
    role: "cliente",
    password_hash: clientHash,
  });

  upsertSetting.run({ key: "companyName", value: "Consultoría Nova" });
  upsertSetting.run({ key: "tagline", value: "Estrategia clara, ejecución medible." });
  upsertSetting.run({ key: "contactEmail", value: "hola@consultorianova.example" });
  upsertSetting.run({ key: "contactPhone", value: "+1 (000) 000-0000" });

  const existing = db.prepare("SELECT COUNT(*) as c FROM projects").get();
  if (existing.c === 0) {
    insertProject.run({
      title: "Optimización de atención al cliente",
      summary:
        "Rediseño del flujo de tickets, matriz de enrutamiento y escalamiento con enfoque “first-time-right”.",
      industry: "Servicios",
      owner_name: "Ana Morales",
      owner_role: "Consultora Senior · Operaciones",
      results_json: JSON.stringify(["-22% tiempo de respuesta", "+15% CSAT", "SLA 98%"]),
      bullets_json: JSON.stringify(["Mapa as-is / to-be", "KPIs operativos", "Guías y capacitación"]),
      client_email: "cliente@demo.local",
      published: 1,
    });
    insertProject.run({
      title: "Tablero ejecutivo y pronóstico de demanda",
      summary:
        "Tablero de indicadores con modelo de pronóstico y alertas para decisiones semanales de inventario.",
      industry: "Retail",
      owner_name: "Víctor Herrera",
      owner_role: "Consultor · Data & BI",
      results_json: JSON.stringify(["+11% precisión", "-30% tiempo de reporte", "Adopción 80%"]),
      bullets_json: JSON.stringify(["Catálogo de métricas", "Tablero por audiencia", "Entrenamiento"]),
      client_email: "cliente@demo.local",
      published: 1,
    });
  }

  // eslint-disable-next-line no-console
  console.log("Seed completado.");
  // eslint-disable-next-line no-console
  console.log("Usuarios demo:");
  // eslint-disable-next-line no-console
  console.log(" - admin1@demo.local / Admin1!123");
  // eslint-disable-next-line no-console
  console.log(" - admin2@demo.local / Admin2!123");
  // eslint-disable-next-line no-console
  console.log(" - cliente@demo.local / Cliente!123");
};

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});

