/* ==========================================================
   ui.js — utilidades de interfaz (sin lógica de negocio)
   Todo el contenido dinámico se inserta como texto (nunca innerHTML)
   para evitar XSS (OWASP A03).
   ========================================================== */

export const $ = (selector, raiz = document) => raiz.querySelector(selector);
export const $$ = (selector, raiz = document) => [...raiz.querySelectorAll(selector)];

/** Crea elementos de forma segura: h("p", {class:"x"}, "texto") */
export function h(tag, attrs = {}, ...hijos) {
  const el = document.createElement(tag);
  for (const [clave, valor] of Object.entries(attrs)) {
    if (valor == null || valor === false) continue;
    if (clave === "class") el.className = valor;
    else if (clave.startsWith("on") && typeof valor === "function") el.addEventListener(clave.slice(2), valor);
    else el.setAttribute(clave, valor === true ? "" : valor);
  }
  for (const hijo of hijos.flat()) {
    if (hijo == null || hijo === false) continue;
    el.append(hijo instanceof Node ? hijo : document.createTextNode(String(hijo)));
  }
  return el;
}

export const dinero = (n) => `${Number(n).toLocaleString("es-PE")} cr`;

/* ---------- Ilustraciones de respaldo (siluetas estilo videojuego) ---------- */
const SILUETAS = {
  pistola: '<rect x="50" y="52" width="170" height="28" rx="4"/><rect x="220" y="58" width="34" height="14"/><path d="M80 80h46l-12 58H72z"/><path d="M130 80h28v14h-28z"/>',
  subfusil: '<rect x="50" y="56" width="170" height="26" rx="3"/><rect x="220" y="62" width="40" height="10"/><path d="M110 82h22v54h-22z"/><path d="M165 82h20l-8 38h-18z"/><path d="M20 58h34v22H20z"/>',
  rifle: '<rect x="50" y="64" width="210" height="22" rx="3"/><rect x="260" y="70" width="34" height="8"/><path d="M12 58h42v46H12z"/><path d="M130 86h28l-6 44h-28z"/><path d="M92 86h20l-8 36H84z"/><rect x="150" y="54" width="40" height="10" rx="3"/>',
  escopeta: '<rect x="70" y="60" width="224" height="13" rx="3"/><rect x="70" y="76" width="224" height="9" rx="3"/><rect x="140" y="88" width="64" height="14" rx="5"/><path d="M8 56h66l-6 36H22z"/>',
  francotirador: '<rect x="40" y="72" width="256" height="11" rx="3"/><rect x="96" y="48" width="96" height="13" rx="6"/><rect x="138" y="61" width="7" height="11"/><path d="M6 66h40l6 36H16z"/><path d="M104 83h24l-8 34H96z"/><path d="M200 83v20h12v-20z"/>',
};

export function weaponArt(categoria) {
  const formas = SILUETAS[categoria] || SILUETAS.pistola;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 160">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8f86ff"/><stop offset="1" stop-color="#3de0c5"/></linearGradient></defs>
    <g fill="url(#g)">${formas}</g>
    <rect x="50" y="40" width="200" height="3" fill="#ffb020" opacity=".9"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/* ---------- Efecto 3D: inclinación según el cursor ---------- */
export function activarTilt(contenedor, tarjeta) {
  const sinHover = matchMedia("(hover: none)").matches;
  const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (sinHover || sinMovimiento) return;

  const reiniciar = () => {
    tarjeta.classList.remove("is-hover");
    tarjeta.style.setProperty("--rx", "0deg");
    tarjeta.style.setProperty("--ry", "0deg");
  };

  contenedor.addEventListener("pointerenter", () => tarjeta.classList.add("is-hover"));
  contenedor.addEventListener("pointermove", (e) => {
    const r = contenedor.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    tarjeta.style.setProperty("--ry", `${((x - 0.5) * 22).toFixed(2)}deg`);
    tarjeta.style.setProperty("--rx", `${((0.5 - y) * 18).toFixed(2)}deg`);
    tarjeta.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
    tarjeta.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
  });
  contenedor.addEventListener("pointerleave", reiniciar);
}

/* ---------- Estado de carga global ---------- */
export function setLoading(activo, texto = "Cargando...") {
  $("#loader-texto").textContent = texto;
  $("#loader").hidden = !activo;
}

/* ---------- Avisos breves ---------- */
export function toast(mensaje, tipo = "info", ms = 3200) {
  const el = h("div", { class: `toast toast--${tipo}`, role: "status" }, mensaje);
  $("#toasts").append(el);
  setTimeout(() => el.remove(), ms);
}

/* ---------- Alertas interactivas (reemplazan a alert/confirm) ---------- */
export function alerta({ titulo, mensaje, tipo = "info", confirmar = false, etiqueta = "Entendido" }) {
  const dlg = $("#dlg-alerta");
  dlg.dataset.tipo = tipo;
  $("#alerta-titulo").textContent = titulo;
  $("#alerta-msg").textContent = mensaje;
  $("#alerta-ok").textContent = etiqueta;
  $("#alerta-cancelar").hidden = !confirmar;

  return new Promise((resolver) => {
    dlg.addEventListener("close", () => resolver(dlg.returnValue === "ok"), { once: true });
    dlg.returnValue = "cancel";
    dlg.showModal();
  });
}
