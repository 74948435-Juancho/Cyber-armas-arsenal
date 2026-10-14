const { DataTypes } = require("sequelize");
const sequelize = require("../db/database");
const Usuario = require("./UsuarioModel");
const Arma = require("./ArmaModel");

const Carrito = sequelize.define(
  "Carrito",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Usuario, key: "id" },
    },
    arma_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Arma, key: "id" },
    },
    cantidad: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  },
  {
    tableName: "carrito",
    timestamps: false,
  },
);

// Relaciones para poder hacer consultas cruzadas
Carrito.belongsTo(Usuario, { foreignKey: "usuario_id" });
Carrito.belongsTo(Arma, { foreignKey: "arma_id" });

module.exports = Carrito;
