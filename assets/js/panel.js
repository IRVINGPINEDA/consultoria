(() => {
  const TOKEN_KEY = "cn_token_v1";
  const USER_KEY = "cn_user_v1";
  const VIEW_KEY = "cn_panel_view_v1";

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

  const setSession = (token, user) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      // ignore
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

  const apiFetch = async (url, options = {}) => {
    const session = getSession();
    const headers = new Headers(options.headers || {});
    if (!headers.has("Content-Type") && options.body) headers.set("Content-Type", "application/json");
    if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);
    return fetch(url, { ...options, headers });
  };

  const showToast = (toastEl, message) => {
    if (!(toastEl instanceof HTMLElement)) return;
    toastEl.textContent = message;
    toastEl.hidden = false;
    toastEl.classList.add("show");
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      toastEl.classList.remove("show");
      toastEl.hidden = true;
    }, 3200);
  };

  const viewButtons = Array.from(document.querySelectorAll("[data-view-btn]")).filter(
    (el) => el instanceof HTMLButtonElement
  );
  const viewSections = Array.from(document.querySelectorAll("[data-view]")).filter(
    (el) => el instanceof HTMLElement
  );

  const setView = (view) => {
    for (const section of viewSections) {
      const v = section.getAttribute("data-view") || "";
      if (v === view) section.setAttribute("data-active", "true");
      else section.removeAttribute("data-active");
    }
    for (const btn of viewButtons) {
      const v = btn.getAttribute("data-view-btn");
      if (v === view) btn.setAttribute("aria-current", "page");
      else btn.removeAttribute("aria-current");
    }
    try {
      localStorage.setItem(VIEW_KEY, view);
    } catch {
      // ignore
    }
  };

  const pickInitialView = () => {
    const visibleButtons = viewButtons.filter((b) => !b.hasAttribute("hidden"));
    if (!visibleButtons.length) return null;

    let saved = null;
    try {
      saved = localStorage.getItem(VIEW_KEY);
    } catch {
      saved = null;
    }

    if (saved && visibleButtons.some((b) => b.getAttribute("data-view-btn") === saved)) return saved;
    return visibleButtons[0].getAttribute("data-view-btn");
  };

  viewButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const v = btn.getAttribute("data-view-btn");
      if (v) setView(v);
    });
  });

  const sessionInfo = document.querySelector("[data-session-info]");
  const logoutBtn = document.querySelector("[data-logout]");

  const loginForm = document.querySelector("[data-login-form]");
  const loginToast = document.querySelector("[data-login-toast]");

  const projectForm = document.querySelector("[data-project-form]");
  const projectToast = document.querySelector("[data-project-toast]");
  const projectCancel = document.querySelector("[data-project-cancel]");
  const projectNew = document.querySelector("[data-project-new]");
  const adminProjects = document.querySelector("[data-admin-projects]");
  const clientProjects = document.querySelector("[data-client-projects]");
  const messagesBox = document.querySelector("[data-messages]");

  const settingsForm = document.querySelector("[data-settings-form]");
  const settingsToast = document.querySelector("[data-settings-toast]");

  const userForm = document.querySelector("[data-user-form]");
  const userToast = document.querySelector("[data-user-toast]");
  const usersBox = document.querySelector("[data-users]");

  const refreshSessionInfo = () => {
    const session = getSession();
    if (sessionInfo instanceof HTMLElement) {
      sessionInfo.textContent = session ? `${session.user.name} · ${session.user.email} · ${session.user.role}` : "—";
    }
  };

  const parseLines = (s) =>
    String(s || "")
      .split("\n")
      .map((x) => x.trim())
      .filter(Boolean);

  const renderAdminProjects = (projects, role) => {
    if (!(adminProjects instanceof HTMLElement)) return;
    adminProjects.innerHTML = "";
    if (!projects.length) {
      adminProjects.textContent = "No hay proyectos.";
      return;
    }

    const scroll = document.createElement("div");
    scroll.className = "table-scroll";

    const table = document.createElement("table");
    table.className = "panel-table";

    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    for (const h of ["ID", "Título", "Cliente", "Publicado", "Acciones"]) {
      const th = document.createElement("th");
      th.textContent = h;
      hr.appendChild(th);
    }
    thead.appendChild(hr);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    for (const p of projects) {
      const tr = document.createElement("tr");

      const tdId = document.createElement("td");
      tdId.textContent = String(p.id);

      const tdT = document.createElement("td");
      tdT.textContent = String(p.title || "");

      const tdC = document.createElement("td");
      tdC.textContent = p.clientEmail ? String(p.clientEmail) : "—";

      const tdP = document.createElement("td");
      tdP.textContent = p.published ? "Sí" : "No";

      const tdA = document.createElement("td");

      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "button secondary";
      edit.textContent = "Editar";
      edit.style.marginRight = "0.4rem";

      const del = document.createElement("button");
      del.type = "button";
      del.className = "button ghost";
      del.textContent = "Eliminar";
      if (role !== "admin1") {
        del.disabled = true;
        del.title = "Solo admin1 puede eliminar";
      }

      edit.addEventListener("click", () => fillProjectForm(p));
      del.addEventListener("click", async () => {
        if (!confirm("¿Eliminar este proyecto? (solo admin1)")) return;
        try {
          const res = await apiFetch(`/api/projects/${p.id}`, { method: "DELETE" });
          if (!res.ok) {
            showToast(projectToast, "No se pudo eliminar (¿rol admin1?).");
            return;
          }
          await refreshAll();
          showToast(projectToast, "Proyecto eliminado.");
        } catch {
          showToast(projectToast, "Error eliminando.");
        }
      });

      tdA.appendChild(edit);
      tdA.appendChild(del);

      tr.appendChild(tdId);
      tr.appendChild(tdT);
      tr.appendChild(tdC);
      tr.appendChild(tdP);
      tr.appendChild(tdA);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    scroll.appendChild(table);
    adminProjects.appendChild(scroll);
  };

  const renderClientProjects = (projects) => {
    if (!(clientProjects instanceof HTMLElement)) return;
    clientProjects.innerHTML = "";
    if (!projects.length) {
      clientProjects.textContent = "No hay proyectos asignados.";
      return;
    }
    const list = document.createElement("div");
    list.className = "grid-2";
    for (const p of projects) {
      const card = document.createElement("article");
      card.className = "project";
      const h = document.createElement("h3");
      h.textContent = p.title || "";
      const d = document.createElement("p");
      d.className = "muted";
      d.textContent = p.summary || "";
      card.appendChild(h);
      card.appendChild(d);
      list.appendChild(card);
    }
    clientProjects.appendChild(list);
  };

  const renderMessages = (messages) => {
    if (!(messagesBox instanceof HTMLElement)) return;
    messagesBox.innerHTML = "";
    if (!messages.length) {
      messagesBox.textContent = "No hay mensajes.";
      return;
    }
    const ul = document.createElement("ul");
    ul.className = "bullets";
    for (const m of messages.slice(0, 50)) {
      const li = document.createElement("li");
      li.textContent = `${m.created_at} · ${m.name} <${m.email}> ${
        m.company ? `(${m.company})` : ""
      } — ${m.message}`;
      ul.appendChild(li);
    }
    messagesBox.appendChild(ul);
  };

  const renderUsers = (users) => {
    if (!(usersBox instanceof HTMLElement)) return;
    usersBox.innerHTML = "";
    if (!users.length) {
      usersBox.textContent = "No hay usuarios.";
      return;
    }

    const scroll = document.createElement("div");
    scroll.className = "table-scroll";

    const table = document.createElement("table");
    table.className = "panel-table";

    const thead = document.createElement("thead");
    const hr = document.createElement("tr");
    for (const h of ["Email", "Nombre", "Rol", "Creado"]) {
      const th = document.createElement("th");
      th.textContent = h;
      hr.appendChild(th);
    }
    thead.appendChild(hr);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    for (const u of users) {
      const tr = document.createElement("tr");
      const tdE = document.createElement("td");
      tdE.textContent = String(u.email || "");
      const tdN = document.createElement("td");
      tdN.textContent = String(u.name || "");
      const tdR = document.createElement("td");
      tdR.textContent = String(u.role || "");
      const tdC = document.createElement("td");
      tdC.textContent = String(u.created_at || "");
      tr.appendChild(tdE);
      tr.appendChild(tdN);
      tr.appendChild(tdR);
      tr.appendChild(tdC);
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);
    scroll.appendChild(table);
    usersBox.appendChild(scroll);
  };

  const fillProjectForm = (p) => {
    if (!(projectForm instanceof HTMLFormElement)) return;
    projectForm.elements.id.value = String(p.id ?? "");
    projectForm.elements.title.value = String(p.title ?? "");
    projectForm.elements.summary.value = String(p.summary ?? "");
    projectForm.elements.industry.value = String(p.industry ?? "");
    projectForm.elements.ownerName.value = String(p.ownerName ?? "");
    projectForm.elements.ownerRole.value = String(p.ownerRole ?? "");
    projectForm.elements.results.value = Array.isArray(p.results) ? p.results.join("\n") : "";
    projectForm.elements.bullets.value = Array.isArray(p.bullets) ? p.bullets.join("\n") : "";
    projectForm.elements.clientEmail.value = String(p.clientEmail ?? "");
    projectForm.elements.published.checked = Boolean(p.published);
    showToast(projectToast, "Editando proyecto. Guarda para aplicar.");
    setView("projects");
    projectForm.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resetProjectForm = () => {
    if (!(projectForm instanceof HTMLFormElement)) return;
    projectForm.reset();
    projectForm.elements.id.value = "";
    projectForm.elements.published.checked = true;
  };

  const loadProjectsAll = async () => {
    const res = await apiFetch("/api/projects/all");
    if (!res.ok) throw new Error("projects_failed");
    const data = await res.json();
    return Array.isArray(data.projects) ? data.projects : [];
  };

  const loadMyProjects = async () => {
    const res = await apiFetch("/api/projects/mine");
    if (!res.ok) throw new Error("mine_failed");
    const data = await res.json();
    return Array.isArray(data.projects) ? data.projects : [];
  };

  const loadMessages = async () => {
    const res = await apiFetch("/api/messages");
    if (!res.ok) throw new Error("messages_failed");
    const data = await res.json();
    return Array.isArray(data.messages) ? data.messages : [];
  };

  const loadSettings = async () => {
    const res = await apiFetch("/api/settings");
    if (!res.ok) throw new Error("settings_failed");
    const data = await res.json();
    return data.settings || {};
  };

  const loadUsers = async () => {
    const res = await apiFetch("/api/users");
    if (!res.ok) throw new Error("users_failed");
    const data = await res.json();
    return Array.isArray(data.users) ? data.users : [];
  };

  const refreshAll = async () => {
    refreshSessionInfo();
    const session = getSession();
    const role = String(session?.user?.role ?? "");

    const initial = pickInitialView();
    if (initial) setView(initial);

    if (role === "cliente") {
      try {
        const mine = await loadMyProjects();
        renderClientProjects(mine);
      } catch {
        if (clientProjects instanceof HTMLElement) clientProjects.textContent = "No se pudo cargar.";
      }
      return;
    }

    if (role === "admin1" || role === "admin2") {
      try {
        const projects = await loadProjectsAll();
        renderAdminProjects(projects, role);
      } catch {
        if (adminProjects instanceof HTMLElement) adminProjects.textContent = "No se pudo cargar.";
      }
      try {
        const msgs = await loadMessages();
        renderMessages(msgs);
      } catch {
        if (messagesBox instanceof HTMLElement) messagesBox.textContent = "No se pudo cargar.";
      }
      if (role === "admin1" && settingsForm instanceof HTMLFormElement) {
        try {
          const s = await loadSettings();
          settingsForm.elements.companyName.value = String(s.companyName ?? "");
          settingsForm.elements.tagline.value = String(s.tagline ?? "");
          settingsForm.elements.contactEmail.value = String(s.contactEmail ?? "");
          settingsForm.elements.contactPhone.value = String(s.contactPhone ?? "");
        } catch {
          // ignore
        }
        if (usersBox instanceof HTMLElement) {
          try {
            const users = await loadUsers();
            renderUsers(users);
          } catch {
            usersBox.textContent = "No se pudo cargar.";
          }
        }
      }
    }
  };

  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!(loginForm instanceof HTMLFormElement)) return;
    const formData = new FormData(loginForm);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        showToast(loginToast, "Credenciales inválidas.");
        return;
      }
      const data = await res.json();
      setSession(data.token, data.user);
      showToast(loginToast, "Sesión iniciada.");
      window.location.reload();
    } catch {
      showToast(loginToast, "No hay servidor. Ejecuta el backend.");
    }
  });

  logoutBtn?.addEventListener("click", () => {
    clearSession();
    window.location.reload();
  });

  projectCancel?.addEventListener("click", () => resetProjectForm());
  projectNew?.addEventListener("click", () => {
    resetProjectForm();
    setView("projects");
  });

  projectForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!(projectForm instanceof HTMLFormElement)) return;
    const fd = new FormData(projectForm);
    const id = String(fd.get("id") ?? "").trim();
    const payload = {
      title: String(fd.get("title") ?? "").trim(),
      summary: String(fd.get("summary") ?? "").trim(),
      industry: String(fd.get("industry") ?? "").trim(),
      ownerName: String(fd.get("ownerName") ?? "").trim(),
      ownerRole: String(fd.get("ownerRole") ?? "").trim(),
      results: parseLines(fd.get("results")),
      bullets: parseLines(fd.get("bullets")),
      clientEmail: String(fd.get("clientEmail") ?? "").trim(),
      published: Boolean(fd.get("published")),
    };

    if (!payload.title || !payload.summary) {
      showToast(projectToast, "Título y resumen son obligatorios.");
      return;
    }

    try {
      const res = await apiFetch(id ? `/api/projects/${id}` : "/api/projects", {
        method: id ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        showToast(projectToast, "No se pudo guardar (permiso o servidor).");
        return;
      }
      resetProjectForm();
      await refreshAll();
      showToast(projectToast, "Proyecto guardado.");
    } catch {
      showToast(projectToast, "Error guardando.");
    }
  });

  settingsForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!(settingsForm instanceof HTMLFormElement)) return;
    const fd = new FormData(settingsForm);
    const settings = {
      companyName: String(fd.get("companyName") ?? ""),
      tagline: String(fd.get("tagline") ?? ""),
      contactEmail: String(fd.get("contactEmail") ?? ""),
      contactPhone: String(fd.get("contactPhone") ?? ""),
    };
    try {
      const res = await apiFetch("/api/settings", { method: "PUT", body: JSON.stringify({ settings }) });
      if (!res.ok) {
        showToast(settingsToast, "No se pudo guardar (solo admin1).");
        return;
      }
      showToast(settingsToast, "Configuración guardada.");
    } catch {
      showToast(settingsToast, "Error guardando.");
    }
  });

  userForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!(userForm instanceof HTMLFormElement)) return;
    const fd = new FormData(userForm);
    const payload = {
      email: String(fd.get("email") ?? "").trim(),
      name: String(fd.get("name") ?? "").trim(),
      role: String(fd.get("role") ?? "").trim(),
      password: String(fd.get("password") ?? ""),
    };
    try {
      const res = await apiFetch("/api/users", { method: "POST", body: JSON.stringify(payload) });
      if (!res.ok) {
        showToast(userToast, "No se pudo crear (solo admin1).");
        return;
      }
      userForm.reset();
      showToast(userToast, "Usuario creado.");
      try {
        const users = await loadUsers();
        renderUsers(users);
      } catch {
        // ignore
      }
    } catch {
      showToast(userToast, "Error creando usuario.");
    }
  });

  refreshSessionInfo();
  refreshAll();
})();
