const canvas = document.getElementById("canvas");
const editor = document.getElementById("editor");
const emptyState = document.getElementById("emptyState");
let selected = null;

const defaults = {
  hero: {content:"Bouw iets bijzonders", button:"Bekijk meer", link:"#", bg:"#eef2ff", color:"#111827"},
  text: {content:"Dit is een professioneel tekstblok. Klik op dit onderdeel en pas de inhoud rechts aan.", bg:"#ffffff", color:"#111827"},
  image: {content:"", image:"https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1200&q=80", bg:"#ffffff", color:"#111827"},
  button: {content:"Neem contact op", button:"Neem contact op", link:"#", bg:"#ffffff", color:"#111827"},
  cards: {content:"", bg:"#ffffff", color:"#111827"},
  contact: {content:"Neem contact met ons op\\ninfo@voorbeeld.nl\\n+31 20 123 4567", bg:"#111827", color:"#ffffff"}
};

function escapeHtml(str="") {
  return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function createBlock(type, data={}) {
  const d = {...defaults[type], ...data};
  const el = document.createElement("section");
  el.className = `block ${type}`;
  el.dataset.type = type;
  el.dataset.content = d.content || "";
  el.dataset.button = d.button || "";
  el.dataset.link = d.link || "#";
  el.dataset.image = d.image || "";
  el.dataset.bg = d.bg || "#ffffff";
  el.dataset.color = d.color || "#111827";
  renderBlock(el);
  return el;
}
function renderBlock(el) {
  const t = el.dataset.type, c = escapeHtml(el.dataset.content), b = escapeHtml(el.dataset.button), l = escapeHtml(el.dataset.link), img = escapeHtml(el.dataset.image);
  el.style.background = el.dataset.bg;
  el.style.color = el.dataset.color;
  let body = "";
  if (t==="hero") body = `<h1>${c}</h1><p>Een sterke eerste indruk voor jouw website.</p><a class="cta" href="${l}">${b}</a>`;
  if (t==="text") body = `<div>${c.replace(/\n/g,"<br>")}</div>`;
  if (t==="image") body = `<img src="${img}" alt="Afbeelding">`;
  if (t==="button") body = `<a class="cta" href="${l}">${b}</a>`;
  if (t==="cards") body = `<div class="card"><h3>Snelle start</h3><p>Voeg eenvoudig nieuwe onderdelen toe.</p></div><div class="card"><h3>Professioneel</h3><p>Een moderne uitstraling op elk scherm.</p></div><div class="card"><h3>Flexibel</h3><p>Pas inhoud en stijl zelf aan.</p></div>`;
  if (t==="contact") body = `<h2>Contact</h2><p>${c.replace(/\n/g,"<br>")}</p>`;
  el.innerHTML = `<div class="block-tools"><button data-action="up">↑</button><button data-action="down">↓</button><button data-action="delete">✕</button></div>${body}`;
}
function selectBlock(el) {
  document.querySelectorAll(".block.selected").forEach(x=>x.classList.remove("selected"));
  selected = el;
  if (!el) { editor.hidden=true; emptyState.hidden=false; return; }
  el.classList.add("selected"); editor.hidden=false; emptyState.hidden=true;
  contentInput.value = el.dataset.content || "";
  buttonTextInput.value = el.dataset.button || "";
  linkInput.value = el.dataset.link || "";
  imageInput.value = el.dataset.image || "";
  bgInput.value = el.dataset.bg || "#ffffff";
  colorInput.value = el.dataset.color || "#111827";
}
canvas.addEventListener("click", e => {
  const tool = e.target.closest("[data-action]");
  const block = e.target.closest(".block");
  if (!block) return;
  if (tool) {
    const action = tool.dataset.action;
    if (action==="delete") block.remove();
    if (action==="up" && block.previousElementSibling) canvas.insertBefore(block, block.previousElementSibling);
    if (action==="down" && block.nextElementSibling) canvas.insertBefore(block.nextElementSibling, block);
    selectBlock(action==="delete" ? null : block);
    saveLocal();
    return;
  }
  selectBlock(block);
});
document.querySelectorAll(".add-block").forEach(btn => btn.addEventListener("click", () => {
  const el = createBlock(btn.dataset.type);
  canvas.appendChild(el); selectBlock(el); saveLocal();
}));
[contentInput,buttonTextInput,linkInput,imageInput,bgInput,colorInput].forEach(input => input.addEventListener("input", () => {
  if (!selected) return;
  selected.dataset.content = contentInput.value;
  selected.dataset.button = buttonTextInput.value;
  selected.dataset.link = linkInput.value;
  selected.dataset.image = imageInput.value;
  selected.dataset.bg = bgInput.value;
  selected.dataset.color = colorInput.value;
  renderBlock(selected); selectBlock(selected); saveLocal();
}));
deleteBtn.addEventListener("click", () => { if(selected){selected.remove(); selectBlock(null); saveLocal();} });
clearBtn.addEventListener("click", () => { if(confirm("Alles verwijderen?")) {canvas.innerHTML=""; selectBlock(null); saveLocal();} });
function saveLocal() {
  const data = [...canvas.children].map(el => ({
    type:el.dataset.type, content:el.dataset.content, button:el.dataset.button,
    link:el.dataset.link, image:el.dataset.image, bg:el.dataset.bg, color:el.dataset.color
  }));
  localStorage.setItem("websiteMakerProject", JSON.stringify(data));
}
function loadLocal() {
  try {
    const data = JSON.parse(localStorage.getItem("websiteMakerProject") || "[]");
    data.forEach(x => canvas.appendChild(createBlock(x.type,x)));
  } catch {}
}
saveBtn.addEventListener("click", () => { saveLocal(); toast("Project opgeslagen in je browser."); });
previewBtn.addEventListener("click", () => {
  document.body.classList.toggle("preview-mode");
  document.querySelector(".sidebar").hidden = !document.querySelector(".sidebar").hidden;
  document.querySelector(".properties").hidden = !document.querySelector(".properties").hidden;
});
downloadBtn.addEventListener("click", () => {
  const clone = canvas.cloneNode(true);
  clone.querySelectorAll(".block-tools").forEach(x=>x.remove());
  const html = `<!doctype html><html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mijn website</title><style>${exportCss()}</style></head><body>${clone.innerHTML}</body></html>`;
  const blob = new Blob([html], {type:"text/html"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download="mijn-website.html"; a.click();
  URL.revokeObjectURL(a.href);
});
function exportCss(){ return `.hero{padding:90px 50px;text-align:center;background:linear-gradient(135deg,#eef2ff,#fff)}.hero h1{font:800 52px Arial;margin:0 auto 15px;max-width:750px}.hero p{font:18px Arial;color:#4b5563;max-width:650px;margin:0 auto 28px}.cta{display:inline-block;background:#4f46e5;color:#fff;padding:12px 20px;border-radius:9px;text-decoration:none;font:16px Arial}.text-block{padding:45px 55px;line-height:1.75;font:17px Arial}.image-block{padding:35px 55px}.image-block img{width:100%;max-height:430px;object-fit:cover;border-radius:12px;display:block}.button-block{padding:35px;text-align:center}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:45px 55px}.card{padding:25px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;font:16px Arial}.contact{padding:45px 55px;background:#111827;color:white;font:16px Arial}@media(max-width:700px){.cards{grid-template-columns:1fr}.hero h1{font-size:38px}}`; }
function toast(msg){ const t=document.getElementById("toast"); t.textContent=msg; t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),1800); }
loadLocal();
if (!canvas.children.length) { const h=createBlock("hero"); canvas.appendChild(h); selectBlock(h); }
