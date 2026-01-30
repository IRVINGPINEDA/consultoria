(() => {
  const SCHEME_KEY = "cn_scheme_v1";
  const TOKEN_KEY = "cn_token_v1";
  const USER_KEY = "cn_user_v1";

  const normalizeScheme = (scheme) => (scheme === "dark" ? "dark" : "light");

  const readScheme = () => {
    try {
      return localStorage.getItem(SCHEME_KEY);
    } catch {
      return null;
    }
  };

  const writeScheme = (scheme) => {
    try {
      localStorage.setItem(SCHEME_KEY, normalizeScheme(scheme));
    } catch {
      // ignore
    }
  };

  const applyScheme = (scheme) => {
    const normalized = normalizeScheme(scheme);
    document.documentElement.dataset.theme = normalized;
    return normalized;
  };

  const readJson = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const getSession = () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const user = readJson(USER_KEY);
      if (!token || !user) return null;
      return { token, user };
    } catch {
      return null;
    }
  };

  const clearSession = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      // ignore
    }
  };

  const getRole = () => String(getSession()?.user?.role ?? "");

  const roleAllowed = (rolesAttr, role) => {
    const list = String(rolesAttr || "")
      .trim()
      .split(/[\s,]+/)
      .filter(Boolean);
    if (!list.length) return true;
    return list.includes(role);
  };

  const applyAuth = () => {
    const session = getSession();
    const role = getRole();
    document.documentElement.dataset.role = role || "";

    document.querySelectorAll("[data-roles]").forEach((el) => {
      const allowed = roleAllowed(el.getAttribute("data-roles"), role);
      el.toggleAttribute("hidden", !allowed);
    });

    document.querySelectorAll("[data-auth='required']").forEach((el) => {
      el.toggleAttribute("hidden", Boolean(session));
    });
    document.querySelectorAll("[data-auth='present']").forEach((el) => {
      el.toggleAttribute("hidden", !session);
    });

    const badge = document.querySelector("[data-role-badge]");
    if (badge instanceof HTMLElement) {
      badge.textContent = session ? `Rol: ${role}` : "";
    }
  };

  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  const header = document.querySelector("[data-header]");

  const setNavOpen = (open) => {
    if (!navToggle || !nav || !header) return;
    header.classList.toggle("nav-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
  };

  if (navToggle && nav && header) {
    navToggle.addEventListener("click", () => {
      const open = navToggle.getAttribute("aria-expanded") !== "true";
      setNavOpen(open);
    });

    nav.addEventListener("click", (e) => {
      const target = e.target;
      if (target instanceof HTMLAnchorElement) setNavOpen(false);
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setNavOpen(false);
    });
  }

  const basePath = () => {
    const href = String(window.location.href || "");
    return /\/pages\//i.test(href) ? "" : "pages/";
  };

  const ensurePanelLink = () => {
    if (!nav) return;
    const href = `${basePath()}panel.html`;

    if (!nav.querySelector("[data-login-link]")) {
      const login = document.createElement("a");
      login.href = href;
      login.textContent = "Acceso";
      login.setAttribute("data-login-link", "true");
      login.setAttribute("data-auth", "required");
      nav.insertBefore(login, nav.lastElementChild);
    }

    if (!nav.querySelector("[data-panel-link]")) {
      const panel = document.createElement("a");
      panel.href = href;
      panel.textContent = "Panel";
      panel.setAttribute("data-panel-link", "true");
      panel.setAttribute("data-auth", "present");
      nav.insertBefore(panel, nav.lastElementChild);
    }
  };

  const ensureRoleBadge = () => {
    if (!nav) return;
    if (nav.querySelector("[data-role-badge]")) return;
    const badge = document.createElement("span");
    badge.className = "role-badge";
    badge.setAttribute("data-role-badge", "true");
    badge.setAttribute("data-auth", "present");
    nav.insertBefore(badge, nav.firstChild);
  };

  const ensureThemeToggle = () => {
    if (!nav) return;
    if (nav.querySelector("[data-theme-toggle]")) return;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "theme-toggle";
    btn.setAttribute("data-theme-toggle", "true");

    const sync = () => {
      const scheme = normalizeScheme(document.documentElement.dataset.theme);
      btn.setAttribute("aria-pressed", String(scheme === "dark"));
      btn.textContent = scheme === "dark" ? "Claro" : "Oscuro";
      btn.setAttribute("aria-label", scheme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
    };

    btn.addEventListener("click", () => {
      const current = normalizeScheme(document.documentElement.dataset.theme);
      const next = current === "dark" ? "light" : "dark";
      writeScheme(next);
      applyScheme(next);
      sync();
    });

    sync();
    nav.insertBefore(btn, nav.lastElementChild);
  };

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  const applySettingsToDom = (settings) => {
    if (!settings || typeof settings !== "object") return;

    document.querySelectorAll("[data-setting]").forEach((el) => {
      const key = el.getAttribute("data-setting");
      if (!key) return;
      const value = settings[key];
      if (value == null) return;
      el.textContent = String(value);
    });

    document.querySelectorAll("[data-setting-href]").forEach((el) => {
      const spec = el.getAttribute("data-setting-href") || "";
      const [scheme, key] = spec.split(":");
      if (!scheme || !key) return;
      const value = settings[key];
      if (value == null) return;
      if (el instanceof HTMLAnchorElement) {
        if (scheme === "tel") {
          const raw = String(value);
          const normalized = raw.replace(/[^\d+]/g, "");
          el.href = `tel:${normalized || raw}`;
        } else {
          el.href = `${scheme}:${String(value)}`;
        }
      }
    });
  };

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) return;
      const data = await res.json();
      applySettingsToDom(data.settings || {});
    } catch {
      // ignore
    }
  };

  const contactForm = document.querySelector("[data-contact-form]");
  const toast = document.querySelector("[data-toast]");
  if (contactForm instanceof HTMLFormElement && toast instanceof HTMLElement) {
    const showToast = (message) => {
      toast.textContent = message;
      toast.hidden = false;
      toast.classList.add("show");
      window.clearTimeout(showToast._t);
      showToast._t = window.setTimeout(() => {
        toast.classList.remove("show");
        toast.hidden = true;
      }, 3200);
    };

    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(contactForm);
      const name = String(formData.get("nombre") ?? "").trim();
      const email = String(formData.get("email") ?? "").trim();
      const company = String(formData.get("empresa") ?? "").trim();
      const message = String(formData.get("mensaje") ?? "").trim();

      if (!name || !email || !message) {
        showToast("Completa nombre, email y mensaje.");
        return;
      }

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (!emailOk) {
        showToast("Ingresa un email válido.");
        return;
      }

      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, company, message }),
        });
        if (!res.ok) {
          showToast("No se pudo enviar. Intenta nuevamente.");
          return;
        }
        contactForm.reset();
        showToast("Mensaje enviado. Gracias, te contactaremos pronto.");
      } catch {
        showToast("No se pudo enviar (sin servidor).");
      }
    });
  }

  applyScheme(readScheme() || "light");
  ensurePanelLink();
  ensureRoleBadge();
  ensureThemeToggle();
  applyAuth();
  loadSettings();
})();

