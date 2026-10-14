const { DataTypes } = require("sequelize");
const sequelize = require("../db/database");

const Usuario = sequelize.define(
  "Usuario",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password_hash: { type: DataTypes.STRING, allowNull: false },
    rol: { type: DataTypes.STRING, allowNull: false, defaultValue: "cliente" },
    creado_en: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "usuarios",
    timestamps: false,
  },
);

module.exports = Usuario;
