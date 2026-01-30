(() => {
  const list = document.querySelector("[data-project-list]");
  const featured = document.querySelector("[data-featured-projects]");
  if (!list && !featured) return;

  const el = (tag, className) => {
    const n = document.createElement(tag);
    if (className) n.className = className;
    return n;
  };

  const renderProjectCard = (p) => {
    const card = el("article", "project");

    const head = el("header", "project-head");
    const owner = el("div", "project-owner");

    const img = el("img");
    img.width = 44;
    img.height = 44;
    img.alt = p.ownerName ? `Avatar de ${p.ownerName}` : "Avatar";
    img.src = /ana/i.test(p.ownerName || "") ? "../assets/img/avatar-ana.svg" : "../assets/img/avatar-victor.svg";
    if (!/\/pages\//i.test(String(window.location.href || ""))) {
      img.src = img.src.replace("../", "");
    }

    const ownerText = el("div");
    const title = el("h3");
    title.textContent = p.title || "";
    const sub = el("p", "muted");
    sub.textContent = p.ownerName ? `Liderado por ${p.ownerName}${p.ownerRole ? ` · ${p.ownerRole}` : ""}` : "";
    ownerText.appendChild(title);
    ownerText.appendChild(sub);
    owner.appendChild(img);
    owner.appendChild(ownerText);

    const tag = el("span", "tag");
    tag.textContent = p.industry || "Proyecto";

    head.appendChild(owner);
    head.appendChild(tag);

    const desc = el("p");
    desc.textContent = p.summary || "";

    const results = Array.isArray(p.results) ? p.results : [];
    const bullets = Array.isArray(p.bullets) ? p.bullets : [];

    const chips = el("div", "chips");
    for (const r of results.slice(0, 4)) {
      const chip = el("span", "chip");
      chip.textContent = String(r);
      chips.appendChild(chip);
    }

    const ul = el("ul", "bullets");
    for (const b of bullets.slice(0, 4)) {
      const li = el("li");
      li.textContent = String(b);
      ul.appendChild(li);
    }

    card.appendChild(head);
    card.appendChild(desc);
    if (results.length) card.appendChild(chips);
    if (bullets.length) card.appendChild(ul);
    return card;
  };

  const renderFeaturedCase = (p) => {
    const card = el("article", "case");

    const person = el("div", "case-person");
    const img = el("img");
    img.width = 56;
    img.height = 56;
    img.alt = p.ownerName ? `Avatar de ${p.ownerName}` : "Avatar";
    img.src = /ana/i.test(p.ownerName || "") ? "assets/img/avatar-ana.svg" : "assets/img/avatar-victor.svg";

    const t = el("div");
    const h = el("h3", "case-title");
    h.textContent = p.ownerName || "Colaborador";
    const m = el("p", "muted");
    m.textContent = p.ownerRole || "";
    t.appendChild(h);
    t.appendChild(m);
    person.appendChild(img);
    person.appendChild(t);

    const d = el("p", "case-desc");
    d.textContent = p.title ? `${p.title}: ${p.summary || ""}` : p.summary || "";

    const chips = el("div", "chips");
    const results = Array.isArray(p.results) ? p.results : [];
    for (const r of results.slice(0, 3)) {
      const chip = el("span", "chip");
      chip.textContent = String(r);
      chips.appendChild(chip);
    }

    card.appendChild(person);
    card.appendChild(d);
    if (results.length) card.appendChild(chips);
    return card;
  };

  const load = async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) return;
      const data = await res.json();
      const projects = Array.isArray(data.projects) ? data.projects : [];

      if (list) {
        list.innerHTML = "";
        if (!projects.length) {
          const empty = el("div", "card");
          empty.textContent = "Aún no hay proyectos publicados.";
          list.appendChild(empty);
        } else {
          const grid = el("div", "grid-2");
          for (const p of projects) grid.appendChild(renderProjectCard(p));
          list.appendChild(grid);
        }
      }

      if (featured) {
        featured.innerHTML = "";
        const grid = el("div", "grid-2");
        for (const p of projects.slice(0, 2)) grid.appendChild(renderFeaturedCase(p));
        featured.appendChild(grid);
      }
    } catch {
      // ignore
    }
  };

  load();
})();

