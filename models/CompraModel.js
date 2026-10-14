const { DataTypes } = require("sequelize");
const sequelize = require("../db/database");
const Usuario = require("./UsuarioModel");

const Compra = sequelize.define(
  "Compra",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Usuario, key: "id" },
    },
    total: { type: DataTypes.FLOAT, allowNull: false },
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  },
  {
    tableName: "compras",
    timestamps: false,
  },
);

Compra.belongsTo(Usuario, { foreignKey: "usuario_id" });

module.exports = Compra;
