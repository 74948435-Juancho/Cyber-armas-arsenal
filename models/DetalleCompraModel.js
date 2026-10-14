const { DataTypes } = require("sequelize");
const sequelize = require("../db/database");
const Compra = require("./CompraModel");
const Arma = require("./ArmaModel");

const DetalleCompra = sequelize.define(
    "DetalleCompra",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        compra_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Compra, key: "id" },
        },
        arma_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: Arma, key: "id" },
        },
        cantidad: { type: DataTypes.INTEGER, allowNull: false },
        precio_unitario: { type: DataTypes.FLOAT, allowNull: false },
    },
    {
        tableName: "detalle_compra",
        timestamps: false,
    },
);

DetalleCompra.belongsTo(Compra, { foreignKey: "compra_id" });
DetalleCompra.belongsTo(Arma, { foreignKey: "arma_id" });

module.exports = DetalleCompra;
