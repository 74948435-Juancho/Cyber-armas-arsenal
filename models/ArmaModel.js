const { DataTypes } = require("sequelize");
const sequelize = require("../db/database");

const Arma = sequelize.define(
    "Arma",
    {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        nombre: { type: DataTypes.STRING, allowNull: false },
        descripcion: { type: DataTypes.STRING },
        categoria: { type: DataTypes.STRING, allowNull: false },
        dano: { type: DataTypes.INTEGER, allowNull: false },
        precision_arma: { type: DataTypes.INTEGER, allowNull: false },
        alcance: { type: DataTypes.INTEGER, allowNull: false },
        precio: { type: DataTypes.INTEGER, allowNull: false },
        stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        imagen: { type: DataTypes.STRING },
    },
    {
        tableName: "armas",
        timestamps: false,
    },
);

module.exports = Arma;
