import { Sequelize } from "sequelize";

const db = new Sequelize("notes-rani-db", "root", "rani123", {
    host: "34.121.186.109",
    dialect: "mysql"
})

export default db;