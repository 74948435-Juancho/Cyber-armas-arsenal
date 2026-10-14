/* ==========================================================
   api.js — Capa de acceso a datos (Fetch API + async/await)

   Contrato REST que debe cumplir tu backend:
     POST   /api/auth/register   {nombre,email,password}      -> {usuario}
     POST   /api/auth/login      {email,password}             -> {token, usuario:{id,nombre,email}}
     GET    /api/armas                                        -> [{id,nombre,categoria,descripcion,precio,stock,
                                                                   dano,precision,alcance,imagen?}]
     GET    /api/carrito         (Bearer token)               -> {items:[{armaId,nombre,categoria,precio,cantidad}], total}
     POST   /api/carrito         {armaId,cantidad}            -> {items, total}
     DELETE /api/carrito/:armaId                              -> {items, total}
     POST   /api/compras                                      -> {id,total}
   Los errores deben responder JSON: {mensaje: "..."} con el código HTTP adecuado (400, 401, 409...).
   ========================================================== */

export const CONFIG = {
  BASE_URL: "/api",
  /** true = datos simulados en memoria (para probar el frontend sin backend). */
  MOCK: false,
  TIMEOUT_MS: 10000,
};

const TOKEN_KEY = "cyberarms.token";
const USER_KEY = "cyberarms.usuario";

export class ApiError extends Error {
  constructor(mensaje, status = 0) {
    super(mensaje);
    this.name = "ApiError";
    this.status = status; // 0 = fallo de red / timeout
  }
}

/** Responsabilidad única: guardar y leer la sesión del navegador. */
class Sesion {
  get token() { return localStorage.getItem(TOKEN_KEY); }
  get usuario() {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  }
  guardar(token, usuario) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(usuario));
  }
  limpiar() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

/** Responsabilidad única: hablar HTTP con el backend. */
export class ApiClient {
  constructor(baseUrl = CONFIG.BASE_URL, sesion = new Sesion()) {
    this.baseUrl = baseUrl;
    this.sesion = sesion;
  }

  async #request(ruta, { method = "GET", body, auth = false } = {}) {
    const control = new AbortController();
    const temporizador = setTimeout(() => control.abort(), CONFIG.TIMEOUT_MS);
    const headers = { Accept: "application/json" };
    if (body) headers["Content-Type"] = "application/json";
    if (auth && this.sesion.token) headers.Authorization = `Bearer ${this.sesion.token}`;

    let respuesta;
    try {
      respuesta = await fetch(this.baseUrl + ruta, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: control.signal,
      });
    } catch (err) {
      throw new ApiError(
        err.name === "AbortError"
          ? "El servidor tardó demasiado en responder. Inténtalo de nuevo."
          : "No hay conexión con el servidor. Revisa tu red.",
        0
      );
    } finally {
      clearTimeout(temporizador);
    }

    let datos = null;
    try { datos = await respuesta.json(); } catch { /* respuesta sin cuerpo JSON */ }

    if (!respuesta.ok) {
      throw new ApiError(datos?.mensaje || `Error del servidor (${respuesta.status}).`, respuesta.status);
    }
    return datos;
  }

  usuarioGuardado() { return this.sesion.token ? this.sesion.usuario : null; }

  listarArmas() { return this.#request("/armas"); }

  registrar({ nombre, email, password }) {
    return this.#request("/auth/register", { method: "POST", body: { nombre, email, password } });
  }

  async iniciarSesion({ email, password }) {
    const { token, usuario } = await this.#request("/auth/login", { method: "POST", body: { email, password } });
    this.sesion.guardar(token, usuario);
    return usuario;
  }

  cerrarSesion() { this.sesion.limpiar(); }

  obtenerCarrito() { return this.#request("/carrito", { auth: true }); }

  agregarAlCarrito(armaId, cantidad = 1) {
    return this.#request("/carrito", { method: "POST", auth: true, body: { armaId, cantidad } });
  }

  quitarDelCarrito(armaId) {
    return this.#request(`/carrito/${encodeURIComponent(armaId)}`, { method: "DELETE", auth: true });
  }

  procesarCompra() { return this.#request("/compras", { method: "POST", auth: true }); }
}

/* ----------------------------------------------------------
   Modo demo: misma interfaz que ApiClient, datos en memoria.
   Solo sirve para ver el frontend funcionando sin servidor.
   ---------------------------------------------------------- */
const pausa = (ms = 500) => new Promise((r) => setTimeout(r, ms));

export class MockApi {
  constructor() {
    this.sesion = new Sesion();
    this.usuarios = new Map();
    this.carrito = new Map(); // armaId -> cantidad
    this.armas = [
      { id: 1, nombre: "Pulsar P-9", categoria: "pistola", descripcion: "Pistola de pulsos compacta, ideal para duelos cortos.", precio: 1200, stock: 45, dano: 45, precision: 82, alcance: 30 },
      { id: 2, nombre: "Viper Mk2", categoria: "pistola", descripcion: "Cañón magnético con ráfaga de tres disparos.", precio: 2100, stock: 33, dano: 55, precision: 76, alcance: 35 },
      { id: 3, nombre: "Nova SMG", categoria: "subfusil", descripcion: "Cadencia altísima y retroceso controlado.", precio: 3400, stock: 27, dano: 50, precision: 62, alcance: 40 },
      { id: 4, nombre: "Specter AR-7", categoria: "rifle", descripcion: "Rifle versátil con mira holográfica integrada.", precio: 4800, stock: 37, dano: 68, precision: 74, alcance: 70 },
      { id: 5, nombre: "Aegis R-15", categoria: "rifle", descripcion: "Chasis reforzado y cargador de plasma de 40 celdas.", precio: 5600, stock: 40, dano: 74, precision: 70, alcance: 75 },
      { id: 6, nombre: "Breacher-12", categoria: "escopeta", descripcion: "Dispersión devastadora a corta distancia.", precio: 3900, stock: 23, dano: 90, precision: 40, alcance: 25 },
      { id: 7, nombre: "Hydra Pump", categoria: "escopeta", descripcion: "Acción de bombeo con triple cámara.", precio: 3200, stock: 42, dano: 82, precision: 45, alcance: 28 },
      { id: 8, nombre: "Longinus L-50", categoria: "francotirador", descripcion: "Alcance extremo con estabilizador giroscópico.", precio: 9800, stock: 27, dano: 96, precision: 95, alcance: 98 },
    ];
  }

  usuarioGuardado() { return this.sesion.token ? this.sesion.usuario : null; }

  async listarArmas() { await pausa(); return structuredClone(this.armas); }

  async registrar({ nombre, email, password }) {
    await pausa();
    if (this.usuarios.has(email)) throw new ApiError("Ese correo ya está registrado.", 409);
    this.usuarios.set(email, { id: this.usuarios.size + 1, nombre, email, password });
    return { usuario: { nombre, email } };
  }

  async iniciarSesion({ email, password }) {
    await pausa();
    const u = this.usuarios.get(email);
    if (!u || u.password !== password) throw new ApiError("Correo o contraseña incorrectos.", 401);
    const usuario = { id: u.id, nombre: u.nombre, email: u.email };
    this.sesion.guardar("token-demo", usuario);
    return usuario;
  }

  cerrarSesion() { this.sesion.limpiar(); this.carrito.clear(); }

  #vistaCarrito() {
    const items = [...this.carrito].map(([armaId, cantidad]) => {
      const a = this.armas.find((x) => x.id === armaId);
      return { armaId, nombre: a.nombre, categoria: a.categoria, precio: a.precio, cantidad };
    });
    return { items, total: items.reduce((s, i) => s + i.precio * i.cantidad, 0) };
  }

  async obtenerCarrito() { await pausa(200); return this.#vistaCarrito(); }

  async agregarAlCarrito(armaId, cantidad = 1) {
    await pausa(300);
    const arma = this.armas.find((a) => a.id === armaId);
    if (!arma) throw new ApiError("El arma no existe.", 404);
    const nueva = (this.carrito.get(armaId) || 0) + cantidad;
    if (nueva > arma.stock) throw new ApiError(`Stock insuficiente de ${arma.nombre}.`, 409);
    this.carrito.set(armaId, nueva);
    return this.#vistaCarrito();
  }

  async quitarDelCarrito(armaId) {
    await pausa(300);
    this.carrito.delete(Number(armaId));
    return this.#vistaCarrito();
  }

  async procesarCompra() {
    await pausa(900);
    const { items, total } = this.#vistaCarrito();
    if (!items.length) throw new ApiError("El carrito está vacío.", 400);
    items.forEach((i) => { this.armas.find((a) => a.id === i.armaId).stock -= i.cantidad; });
    this.carrito.clear();
    return { id: Math.floor(Math.random() * 9000) + 1000, total };
  }
}

export const createApi = () => (CONFIG.MOCK ? new MockApi() : new ApiClient());
