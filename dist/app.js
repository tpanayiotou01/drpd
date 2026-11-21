const catalog = document.querySelector("#catalog");
const search = document.querySelector("#search");
const expandButton = document.querySelector("#expand-all");
const featuredGrid = document.querySelector("#featured-grid");
const instagramUrl = "https://ig.me/m/drpd.snkrz";
let data;
const escapeHtml = (value) => value.replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
const euro = (value) => new Intl.NumberFormat("en-IE", { style:"currency", currency:"EUR", maximumFractionDigits:0 }).format(value);
const orderUrl = (model, item) => {
  const message = `Hi DRPD, I'm interested in the ${model.name} — ${item.name} (${euro(item.price)}). Is it available?`;
  return `${instagramUrl}?text=${encodeURIComponent(message)}`;
};
const brandOrder = ["Jordan", "Nike", "Adidas", "New Balance", "Maison Margiela", "AMIRI", "Loro Piana", "Zegna"];
const brandFor = (name) => {
  if (name.startsWith("Air Jordan")) return "Jordan";
  if (name.startsWith("Nike") || name.startsWith("Kobe") || name.startsWith("Air Max")) return "Nike";
  if (name.startsWith("Adidas") || name.startsWith("Yeezy")) return "Adidas";
  if (name.startsWith("New Balance")) return "New Balance";
  if (name.startsWith("Maison Margiela")) return "Maison Margiela";
  if (name.startsWith("AMIRI")) return "AMIRI";
  if (name.startsWith("Loro Piana")) return "Loro Piana";
  if (name.startsWith("Zegna")) return "Zegna";
  if (name.startsWith("Mind")) return "Nike";
  return "Other";
};
function render(query = "") {
  const needle = query.trim().toLowerCase();
  const filtered = data.models.map((model) => {
    const brand = brandFor(model.name);
    if (!needle || brand.toLowerCase().includes(needle) || model.name.toLowerCase().includes(needle)) return { ...model, brand };
    const matches = model.colorways.filter((item) => item.name.toLowerCase().includes(needle));
    return matches.length ? { ...model, brand, colorways:matches } : null;
  }).filter(Boolean);
  if (!filtered.length) { catalog.innerHTML = `<p class="empty">No models or colourways match “${escapeHtml(query)}”.</p>`; return; }
  const grouped = filtered.reduce((map, model) => {
    if (!map.has(model.brand)) map.set(model.brand, []);
    map.get(model.brand).push(model);
    return map;
  }, new Map());
  const brands = [...grouped.entries()].sort(([a], [b]) => {
    const ai = brandOrder.indexOf(a), bi = brandOrder.indexOf(b);
    return (ai < 0 ? 999 : ai) - (bi < 0 ? 999 : bi) || a.localeCompare(b);
  });
  brands.forEach(([, models]) => models.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric:true })));
  catalog.innerHTML = brands.map(([brand, models]) => `
    <details class="brand" ${needle ? "open" : ""}>
      <summary class="brand-summary"><div><span class="brand-label">Brand</span><h3>${escapeHtml(brand)}</h3></div><span class="brand-meta">${models.length} ${models.length === 1 ? "model" : "models"} · ${models.reduce((sum, model) => sum + model.colorways.length, 0)} colourways</span><span class="brand-arrow" aria-hidden="true"></span></summary>
      <div class="brand-models">${models.map((model, index) => `
    <details class="model" ${needle ? "open" : ""}>
      <summary><span class="index">${String(index + 1).padStart(2, "0")}</span><h4>${escapeHtml(model.name)}</h4><span class="model-meta"><span>${model.colorways.length} colourways</span><span class="model-price">${model.priceLabel || euro(model.price)}</span></span><span class="plus" aria-hidden="true"></span></summary>
      <div class="colourways">${model.colorways.map((item) => `
        <article class="colourway"><div class="image-wrap"><img src="${item.image}" alt="${escapeHtml(model.name)} — ${escapeHtml(item.name)}" loading="lazy"></div><div class="product-info"><h4>${escapeHtml(item.name)}</h4><div class="product-bottom"><span class="price">${euro(item.price)}</span><a class="order-button" href="${orderUrl(model, item)}" target="_blank" rel="noreferrer" aria-label="Ask about ${escapeHtml(model.name)} — ${escapeHtml(item.name)} on Instagram">DM to order</a></div></div></article>`).join("")}</div>
    </details>`).join("")}</div>
    </details>`).join("");
  bindAccordions();
}
function bindAccordions() {
  const brands = [...catalog.querySelectorAll(":scope > .brand")];
  brands.forEach((brand) => brand.addEventListener("toggle", (event) => {
    if (!event.isTrusted || !brand.open) return;
    brands.forEach((other) => {
      if (other === brand) return;
      other.open = false;
      other.querySelectorAll(".model[open]").forEach((model) => { model.open = false; });
    });
  }));
  catalog.querySelectorAll(".brand-models").forEach((group) => {
    const models = [...group.querySelectorAll(":scope > .model")];
    models.forEach((model) => model.addEventListener("toggle", (event) => {
      if (!event.isTrusted || !model.open) return;
      models.forEach((other) => { if (other !== model) other.open = false; });
    }));
  });
}
function renderFeatured() {
  const preferred = ["Nike G.T. Cut", "Kobe 5", "Adidas Samba", "New Balance 9060"];
  const picks = preferred.map((name, index) => {
    const model = data.models.find((entry) => entry.name === name);
    if (!model?.colorways.length) return null;
    const item = model.colorways[Math.min(index, model.colorways.length - 1)];
    return { model, item };
  }).filter(Boolean);
  featuredGrid.innerHTML = picks.map(({ model, item }) => `
    <article class="featured-card">
      <div class="featured-image"><img src="${item.image}" alt="${escapeHtml(model.name)} — ${escapeHtml(item.name)}" loading="lazy"></div>
      <div class="featured-copy"><small>${escapeHtml(model.name)}</small><h3>${escapeHtml(item.name)}</h3><div class="featured-bottom"><span class="featured-price">${euro(item.price)}</span><a class="order-button" href="${orderUrl(model, item)}" target="_blank" rel="noreferrer">Enquire</a></div></div>
    </article>`).join("");
  if (picks[0]) {
    document.querySelector("#hero-image-main").src = picks[0].item.image;
    document.querySelector("#hero-image-main").alt = `${picks[0].model.name} — ${picks[0].item.name}`;
    document.querySelector("#hero-label-main").textContent = picks[0].model.name;
  }
  if (picks[1]) {
    document.querySelector("#hero-image-small").src = picks[1].item.image;
    document.querySelector("#hero-image-small").alt = `${picks[1].model.name} — ${picks[1].item.name}`;
    document.querySelector("#hero-label-small").textContent = picks[1].model.name;
  }
}
fetch("catalog.json").then((response) => response.json()).then((payload) => {
  data = payload;
  document.querySelector("#model-count").textContent = payload.totals.models;
  document.querySelector("#colorway-count").textContent = payload.totals.colorways;
  renderFeatured();
  render();
}).catch(() => {
  catalog.innerHTML = '<p class="empty">The catalogue could not be loaded.</p>';
  featuredGrid.innerHTML = '<p class="empty">Featured pairs could not be loaded.</p>';
});
search.addEventListener("input", () => render(search.value));
expandButton.addEventListener("click", () => { const sections = [...document.querySelectorAll(".brand, .model")]; const shouldOpen = sections.some((section) => !section.open); sections.forEach((section) => { section.open = shouldOpen; }); expandButton.textContent = shouldOpen ? "Collapse all" : "Expand all"; });


// Keep campaign photos on the page in a native accessible dialog.
const photoViewer = document.querySelector("#photo-viewer");
const viewerImage = photoViewer.querySelector(".photo-viewer-image");
const viewerCaption = photoViewer.querySelector(".photo-viewer-caption");
document.querySelectorAll(".campaign-open").forEach((button) => {
  button.addEventListener("click", () => {
    viewerImage.src = button.dataset.photo;
    viewerImage.alt = button.querySelector("img").alt;
    viewerCaption.textContent = button.querySelector("figcaption strong").textContent;
    photoViewer.showModal();
    document.body.classList.add("photo-viewer-open");
  });
});
photoViewer.querySelector(".photo-viewer-close").addEventListener("click", () => photoViewer.close());
photoViewer.addEventListener("click", (event) => {
  if (event.target !== photoViewer) return;
  const bounds = photoViewer.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) photoViewer.close();
});
photoViewer.addEventListener("close", () => {
  document.body.classList.remove("photo-viewer-open");
  viewerImage.removeAttribute("src");
});
