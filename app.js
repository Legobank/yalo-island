// Yalo Island - app.js

// ===== Helpers =====
const $ = (q, root=document) => root.querySelector(q);
const $$ = (q, root=document) => [...root.querySelectorAll(q)];

function toast(msg){
  const t = $("#toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(()=>t.classList.remove("show"), 1700);
}

// ===== Year =====
const yearEl = $("#year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ===== Mobile menu =====
const menuBtn = $("#menuBtn");
const menu = $("#menu");
menuBtn?.addEventListener("click", () => {
  menu?.classList.toggle("open");
  menuBtn.textContent = menu?.classList.contains("open") ? "✕ Close" : "☰ Menu";
});
menu?.addEventListener("click", (e) => {
  if (e.target.closest("a.pill")) {
    menu.classList.remove("open");
    menuBtn.textContent = "☰ Menu";
  }
});

// ===== Theme toggle =====
const root = document.body;
function setTheme(theme){
  root.setAttribute("data-theme", theme);
  localStorage.setItem("yaloTheme", theme);
}
function toggleTheme(){
  const cur = root.getAttribute("data-theme") || "dark";
  setTheme(cur === "dark" ? "light" : "dark");
  toast(cur === "dark" ? "Light mode ☀️" : "Dark mode 🌙");
}
$("#themeBtn")?.addEventListener("click", toggleTheme);
$("#themeBtn2")?.addEventListener("click", toggleTheme);
const saved = localStorage.getItem("yaloTheme");
if (saved === "light" || saved === "dark") setTheme(saved);

// ===== Reveal on scroll =====
const io = new IntersectionObserver((entries) => {
  entries.forEach(en => { if (en.isIntersecting) en.target.classList.add("in"); });
}, { threshold: 0.12 });
$$(".reveal").forEach(el => io.observe(el));

// ===== Service filtering =====
const serviceFilters = $("#serviceFilters");
const serviceCards = $$("#serviceGrid .service");

serviceFilters?.addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;

  $$(".chip", serviceFilters).forEach(c => c.classList.remove("active"));
  btn.classList.add("active");

  const f = (btn.dataset.filter || "all").toLowerCase();
  serviceCards.forEach(card => {
    const cat = (card.dataset.cat || "").toLowerCase();
    const show = (f === "all") || (cat === f);
    card.style.display = show ? "" : "none";
  });
});

// ===== Gallery filtering + search =====
const galleryFilters = $("#galleryFilters");
const gallerySearch = $("#gallerySearch");
const shots = $$("#galleryGrid .shot");

let currentG = "all";
let query = "";

function applyGallery(){
  const q = (query || "").trim().toLowerCase();
  const chosen = (currentG || "all").trim().toLowerCase();

  shots.forEach(s => {
    const cat = (s.dataset.gcat || "").trim().toLowerCase();
    const title = (s.dataset.title || "").trim().toLowerCase();

    const matchCat = (chosen === "all") || (cat === chosen);
    const matchQ = !q || title.includes(q) || cat.includes(q);

    s.style.display = (matchCat && matchQ) ? "" : "none";
  });
}


galleryFilters?.addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return;

  currentG = (btn.dataset.g || "all").toLowerCase();
  $$(".chip", galleryFilters).forEach(c => c.classList.remove("active"));
  btn.classList.add("active");
  applyGallery();
});

gallerySearch?.addEventListener("input", (e) => {
  query = e.target.value || "";
  applyGallery();
});

// If some images missing, show hint
const anyMissing = shots.some(s => s.classList.contains("missing"));
const missingHint = $("#missingHint");
if (anyMissing && missingHint) missingHint.style.display = "block";

// ===== Modal preview (gallery) =====
const modal = $("#modal");
const modalTitle = $("#modalTitle");
const modalDesc = $("#modalDesc");
const modalImg = $("#modalImg");

function openModal({title, src, cat}){
  if (!modal || !modalTitle || !modalDesc || !modalImg) return;
  modalTitle.textContent = title;
  modalDesc.textContent = `Category: ${cat}.`;
  modalImg.src = src;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
}
function closeModal(){
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}

$("#modalClose")?.addEventListener("click", closeModal);
modal?.addEventListener("click", (e) => { if (e.target === modal) closeModal(); });
window.addEventListener("keydown", (e) => { if (e.key === "Escape" && modal?.classList.contains("open")) closeModal(); });

shots.forEach(s => {
  s.addEventListener("click", () => {
    if (s.classList.contains("missing")) {
      toast("Add a real image file first 📸");
      return;
    }
    const title = s.querySelector("b")?.textContent || "Preview";
    const src = s.querySelector("img")?.getAttribute("src") || "";
    const cat = (s.dataset.gcat || "all").toLowerCase();
    openModal({ title, src, cat });
  });
});

// ===== Booking message generator + copy =====
const form = $("#bookForm");
const box = $("#messageBox");
const msgEl = $("#messageText");
const copyBtn = $("#copyBtn");

function fmtDate(yyyy_mm_dd){
  const [y,m,d] = (yyyy_mm_dd || "").split("-").map(Number);
  if (!y || !m || !d) return yyyy_mm_dd || "";
  return new Date(y, m-1, d).toLocaleDateString(undefined, {
    weekday:"short", month:"short", day:"numeric", year:"numeric"
  });
}

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("#clientName")?.value?.trim() || "";
  const contact = $("#clientContact")?.value?.trim() || "";
  const service = $("#clientService")?.value?.trim() || "";
  const date = $("#clientDate")?.value?.trim() || "";
  const time = $("#clientTime")?.value?.trim() || "";
  const details = $("#clientDetails")?.value?.trim() || "";

  if (!name || !contact || !service || !date || !time || !details) {
    toast("Fill all fields ✍️");
    return;
  }

  const msg =
`Hi! I’d like to book with Yalo Island ✨

Name: ${name}
Contact: ${contact}
Service: ${service}
Preferred: ${fmtDate(date)} at ${time}

Details / inspo:
${details}

Please send pricing/quote for this service and let me know deposit + payment method (if any).`;

  if (msgEl) msgEl.textContent = msg;
  if (box) box.hidden = false;
  toast("Message created ✅");
  box?.scrollIntoView({ behavior:"smooth", block:"nearest" });
});

copyBtn?.addEventListener("click", async () => {
  const txt = (msgEl?.textContent || "").trim();
  if (!txt) { toast("Generate message first ✨"); return; }

  try{
    await navigator.clipboard.writeText(txt);
    toast("Copied ✅");
  }catch{
    const ta = document.createElement("textarea");
    ta.value = txt;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
    toast("Copied ✅");
  }
});
