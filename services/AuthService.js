const bcrypt = require("bcryptjs");
const Usuario = require("../models/UsuarioModel");

class AuthService {
  async registrar(nombre, email, password) {
    // Buscar si el usuario ya existe
    const usuarioExistente = await Usuario.findOne({ where: { email } });
    if (usuarioExistente) {
      throw new Error("El correo ya está registrado");
    }

    // Hashear la contraseña y crear usuario
    const password_hash = await bcrypt.hash(password, 10);
    const nuevoUsuario = await Usuario.create({
      nombre,
      email,
      password_hash,
    });

    return nuevoUsuario;
  }

  async login(email, password) {
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      throw new Error("Credenciales inválidas");
    }

    const passwordValida = await bcrypt.compare(
      password,
      usuario.password_hash,
    );
    if (!passwordValida) {
      throw new Error("Credenciales inválidas");
    }

    return usuario;
  }
}

module.exports = new AuthService();
