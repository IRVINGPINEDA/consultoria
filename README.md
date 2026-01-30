# Consultoria

Proyecto de consultoria con plataforma web (sitio publico + panel) desarrollado como practica de trabajo en equipo y control de versiones con Git/GitHub.

---

## Tecnologias utilizadas

- Node.js
- HTML
- CSS
- JavaScript
- **Git / GitHub**

---

## Arquitectura del proyecto

Aplicacion web con:

- **Frontend estatico** (HTML/CSS/JS) servido como archivos estaticos.
- **Backend** (Node.js + Express) con endpoints REST bajo `/api/*`.
- **Base de datos** SQLite (generada localmente).

---

## Estructura del proyecto (actual)

```
.
|-- index.html
|-- pages/
|   |-- about.html
|   |-- contact.html
|   |-- mv.html
|   |-- panel.html
|   |-- projects.html
|   `-- services.html
|-- assets/
|   |-- css/
|   |   `-- styles.css
|   |-- js/
|   |   |-- main.js
|   |   |-- panel.js
|   |   `-- projects.js
|   `-- img/
|       |-- logo.svg
|       |-- avatar-ana.svg
|       `-- avatar-victor.svg
|-- server/
|   |-- index.js
|   |-- db.js
|   |-- auth.js
|   |-- seed.js
|   `-- routes/
|       |-- auth.js
|       |-- messages.js
|       |-- projects.js
|       |-- settings.js
|       `-- users.js
|-- package.json
`-- package-lock.json
```

Notas:
- `node_modules/` se genera con `npm install` y no se versiona.
- La base de datos SQLite vive en `server/data/` (ignorada por `.gitignore`).

---

## Trabajo en equipo y ramas

Ramas:

- `main` -> version estable
- `irving/*` -> dev
- `joshua/*` -> dev

---

## Requisitos previos

- Node.js (LTS recomendado) y npm
- Git (para clonar)

---

## Como correr el proyecto localmente

1) Instalar dependencias:

`npm install`

2) Levantar el servidor:

`npm start`

3) Abrir en el navegador:
- `http://localhost:3000`
- Healthcheck: `http://localhost:3000/api/health`

---

## Funcionalidades

- Sitio publico (home + paginas informativas en `/pages`)
- Panel (`/pages/panel.html`) con consumo de API
- API REST (`/api/*`) con autenticacion y persistencia en SQLite
- Formulario de contacto (`POST /api/contact`)

---

## Autores

**IRVING ISAY PINEDA PINEDA**
- https://github.com/IRVINGPINEDA

**JOSHUA MEDINA**
- https://github.com/goku58432
