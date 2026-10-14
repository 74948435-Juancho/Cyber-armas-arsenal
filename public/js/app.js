/* ==========================================================
   app.js — controlador principal del frontend
   Clases con responsabilidad única:
     Catalogo  -> filtrar y ordenar armas (lógica pura)
     App       -> coordinar API, estado y vistas
   ========================================================== */
import { createApi, ApiError } from "./api.js";
import { $, $$, h, dinero, weaponArt, activarTilt, setLoading, toast, alerta } from "./ui.js";

/** Lógica pura de catálogo: no toca el DOM ni la red. */
class Catalogo {
  constructor(armas = []) { this.armas = armas; }

  filtrar({ q, categoria, orden }) {
    const texto = q.trim().toLowerCase();
    const lista = this.armas.filter((a) =>
      (categoria === "todas" || a.categoria === categoria) &&
      (!texto || `${a.nombre} ${a.descripcion}`.toLowerCase().includes(texto))
    );
    const comparadores = {
      nombre: (a, b) => a.nombre.localeCompare(b.nombre, "es"),
      "precio-asc": (a, b) => a.precio - b.precio,
      "precio-desc": (a, b) => b.precio - a.precio,
      dano: (a, b) => b.dano - a.dano,
    };
    return lista.sort(comparadores[orden] || comparadores.nombre);
  }
}

class App {
  constructor(api) {
    this.api = api;
    this.catalogo = new Catalogo();
    this.usuario = null;
    this.carrito = { items: [], total: 0 };
    this.filtros = { q: "", categoria: "todas", orden: "nombre" };
    this.modoAuth = "login";
  }

  async init() {
    this.enlazarEventos();
    this.usuario = this.api.usuarioGuardado();
    this.pintarCuenta();
    this.pintarCarrito();
    await this.cargarArmas();
    if (this.usuario) await this.cargarCarrito();
  }

  /* ---------- Eventos ---------- */
  enlazarEventos() {
    let espera;
    $("#filtro-q").addEventListener("input", (e) => {
      clearTimeout(espera);
      espera = setTimeout(() => { this.filtros.q = e.target.value; this.pintarCatalogo(); }, 200);
    });
    $("#filtro-categoria").addEventListener("change", (e) => { this.filtros.categoria = e.target.value; this.pintarCatalogo(); });
    $("#filtro-orden").addEventListener("change", (e) => { this.filtros.orden = e.target.value; this.pintarCatalogo(); });

    $("#btn-carrito").addEventListener("click", () => $("#dlg-carrito").showModal());
    $("#btn-cuenta").addEventListener("click", () => this.usuario ? this.cerrarSesion() : this.abrirAuth("login"));
    $("#btn-comprar").addEventListener("click", () => this.comprar());

    $$("[data-cerrar]").forEach((b) => b.addEventListener("click", () => $(`#${b.dataset.cerrar}`).close()));
    $$(".tab").forEach((t) => t.addEventListener("click", () => this.cambiarModoAuth(t.dataset.modo)));
    $("#form-auth").addEventListener("submit", (e) => this.enviarAuth(e));
  }

  /* ---------- Flujo común: carga, errores y alertas ---------- */
  async run(tarea, { texto = "Procesando...", overlay = true } = {}) {
    let error = null;
    let resultado;
    if (overlay) setLoading(true, texto);
    try {
      resultado = await tarea();
    } catch (err) {
      error = err;
    } finally {
      if (overlay) setLoading(false);
    }
    if (error) { await this.manejarError(error); return undefined; }
    return resultado;
  }

  async manejarError(err) {
    if (err instanceof ApiError && err.status === 401 && this.usuario) {
      this.api.cerrarSesion();
      this.usuario = null;
      this.carrito = { items: [], total: 0 };
      this.pintarCuenta();
      this.pintarCarrito();
      await alerta({ titulo: "Sesión expirada", mensaje: "Inicia sesión de nuevo para continuar.", tipo: "error" });
      this.abrirAuth("login");
      return;
    }
    const sinRed = err instanceof ApiError && err.status === 0;
    await alerta({
      titulo: sinRed ? "Sin conexión" : "No se pudo completar la acción",
      mensaje: err instanceof ApiError ? err.message : "Ocurrió un error inesperado.",
      tipo: "error",
    });
    if (!(err instanceof ApiError)) console.error(err);
  }

  /* ---------- Catálogo ---------- */
  async cargarArmas() {
    const grid = $("#catalogo");
    grid.setAttribute("aria-busy", "true");
    $("#vacio").hidden = true;
    grid.replaceChildren(h("div", { class: "estado" }, h("span", { class: "spinner", "aria-hidden": "true" }), "Cargando arsenal..."));
    try {
      this.catalogo = new Catalogo(await this.api.listarArmas());
      this.pintarCatalogo();
    } catch (err) {
      grid.replaceChildren(
        h("div", { class: "estado estado--error" },
          h("p", {}, err instanceof ApiError ? err.message : "No se pudo cargar el catálogo."),
          h("button", { type: "button", class: "btn", onclick: () => this.cargarArmas() }, "Reintentar"))
      );
    } finally {
      grid.setAttribute("aria-busy", "false");
    }
  }

  pintarCatalogo() {
    const lista = this.catalogo.filtrar(this.filtros);
    $("#vacio").hidden = lista.length > 0;
    $("#catalogo").replaceChildren(...lista.map((a) => this.crearTarjeta(a)));
  }

  crearTarjeta(arma) {
    const img = h("img", {
      class: "card__img", src: arma.imagen || weaponArt(arma.categoria),
      alt: `Ilustración de ${arma.nombre}`, width: 260, height: 130, loading: "lazy",
    });
    img.addEventListener("error", () => { img.src = weaponArt(arma.categoria); }, { once: true });

    const agotada = arma.stock <= 0;
    const boton = h("button", { type: "button", class: "btn", disabled: agotada, onclick: () => this.agregar(arma) },
      agotada ? "Agotada" : "Añadir al carrito");

    const card = h("article", { class: "card" },
      h("div", { class: "card__stage" }, img),
      h("div", { class: "card__body" },
        h("span", { class: "tag" }, arma.categoria),
        h("h3", {}, arma.nombre),
        h("p", { class: "card__desc" }, arma.descripcion),
        h("div", { class: "meters" },
          this.medidor("Daño", arma.dano), this.medidor("Precisión", arma.precision), this.medidor("Alcance", arma.alcance))),
      h("div", { class: "card__foot" },
        h("strong", { class: "price" }, dinero(arma.precio)),
        h("span", { class: agotada ? "stock stock--agotado" : "stock" }, agotada ? "Sin stock" : `${arma.stock} en stock`),
        boton)
    );

    const contenedor = h("div", { class: "card-wrap" }, card);
    activarTilt(contenedor, card);
    return contenedor;
  }

  medidor(nombre, valor) {
    const barra = h("i");
    barra.style.setProperty("--v", `${Math.max(0, Math.min(100, Number(valor) || 0))}%`);
    return h("div", { class: "meter" }, h("span", {}, nombre), h("div", { class: "meter__bar" }, barra));
  }

  /* ---------- Carrito ---------- */
  async cargarCarrito() {
    const datos = await this.run(() => this.api.obtenerCarrito(), { overlay: false });
    if (datos) { this.carrito = datos; this.pintarCarrito(); }
  }

  pintarCarrito() {
    const { items, total } = this.carrito;
    $("#carrito-contador").textContent = items.reduce((s, i) => s + i.cantidad, 0);
    $("#carrito-total").textContent = dinero(total);
    $("#btn-comprar").disabled = items.length === 0;

    const filas = items.length
      ? items.map((i) => h("li", {},
          h("img", { src: weaponArt(i.categoria), alt: "" }),
          h("div", {},
            h("div", { class: "carrito__nombre" }, i.nombre),
            h("div", { class: "carrito__detalle" }, `${i.cantidad} × ${dinero(i.precio)}`)),
          h("button", { type: "button", class: "btn btn--ghost btn--mini", "aria-label": `Quitar ${i.nombre}`, onclick: () => this.quitar(i) }, "Quitar")))
      : [h("li", { class: "vacio" }, "Tu carrito está vacío. Añade un arma del catálogo.")];
    $("#carrito-lista").replaceChildren(...filas);
  }

  async agregar(arma) {
    if (!this.usuario) {
      const ir = await alerta({
        titulo: "Necesitas una cuenta", mensaje: "Inicia sesión para añadir armas al carrito.",
        confirmar: true, etiqueta: "Iniciar sesión",
      });
      if (ir) this.abrirAuth("login");
      return;
    }
    const datos = await this.run(() => this.api.agregarAlCarrito(arma.id, 1), { texto: "Añadiendo al carrito..." });
    if (datos) {
      this.carrito = datos;
      this.pintarCarrito();
      toast(`${arma.nombre} añadida al carrito`, "ok");
    }
  }

  async quitar(item) {
    const datos = await this.run(() => this.api.quitarDelCarrito(item.armaId), { texto: "Quitando..." });
    if (datos) { this.carrito = datos; this.pintarCarrito(); }
  }

  async comprar() {
    const confirmado = await alerta({
      titulo: "Confirmar compra", mensaje: `Vas a pagar ${dinero(this.carrito.total)}. ¿Continuar?`,
      confirmar: true, etiqueta: "Pagar",
    });
    if (!confirmado) return;

    const compra = await this.run(() => this.api.procesarCompra(), { texto: "Procesando compra..." });
    if (!compra) return;

    $("#dlg-carrito").close();
    this.carrito = { items: [], total: 0 };
    this.pintarCarrito();
    await this.cargarArmas(); // el stock cambió
    await alerta({ titulo: "Compra completada", mensaje: `Pedido #${compra.id} por ${dinero(compra.total)}.`, tipo: "ok" });
  }

  /* ---------- Cuenta ---------- */
  pintarCuenta() {
    $("#btn-cuenta").textContent = this.usuario ? `Salir (${this.usuario.nombre})` : "Ingresar";
  }

  abrirAuth(modo) {
    this.cambiarModoAuth(modo);
    $("#auth-error").textContent = "";
    $("#dlg-auth").showModal();
  }

  cambiarModoAuth(modo) {
    this.modoAuth = modo;
    const registro = modo === "registro";
    $$(".tab").forEach((t) => t.setAttribute("aria-pressed", String(t.dataset.modo === modo)));
    $("#campo-nombre").hidden = !registro;
    $("#form-auth [name=password]").autocomplete = registro ? "new-password" : "current-password";
    const texto = registro ? "Crear cuenta" : "Ingresar";
    $("#auth-titulo").textContent = texto;
    $("#auth-enviar").textContent = texto;
  }

  /** Validación en cliente (mejora la experiencia; el backend vuelve a validar). */
  validarAuth({ nombre = "", email, password }) {
    if (this.modoAuth === "registro" && (nombre.trim().length < 2 || nombre.trim().length > 50)) return "El nombre debe tener entre 2 y 50 caracteres.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Escribe un correo válido.";
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) return "La contraseña necesita 8 caracteres o más, con letras y números.";
    return "";
  }

  async enviarAuth(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const datos = Object.fromEntries(new FormData(form));
    const error = this.validarAuth(datos);
    $("#auth-error").textContent = error;
    if (error) return;

    const registro = this.modoAuth === "registro";
    const usuario = await this.run(async () => {
      if (registro) await this.api.registrar({ nombre: datos.nombre.trim(), email: datos.email.trim(), password: datos.password });
      return this.api.iniciarSesion({ email: datos.email.trim(), password: datos.password });
    }, { texto: registro ? "Creando tu cuenta..." : "Verificando acceso..." });

    if (!usuario) return; // el error ya se mostró en la alerta
    this.usuario = usuario;
    form.reset();
    $("#dlg-auth").close();
    this.pintarCuenta();
    toast(`Bienvenido, ${usuario.nombre}`, "ok");
    await this.cargarCarrito();
  }

  cerrarSesion() {
    this.api.cerrarSesion();
    this.usuario = null;
    this.carrito = { items: [], total: 0 };
    this.pintarCuenta();
    this.pintarCarrito();
    toast("Sesión cerrada", "info");
  }
}

document.addEventListener("DOMContentLoaded", () => new App(createApi()).init());
