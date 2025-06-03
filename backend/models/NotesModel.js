import { Sequelize } from "sequelize";
import db from "../config/database.js";
const { DataTypes } = Sequelize;

const Notes = db.define(
    "notes",
    {
        title: DataTypes.STRING,
        content: DataTypes.STRING,
        category: DataTypes.STRING,
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'users', 
                key: 'id',
            }
        }
    },
    {
        timestamps: true, 
    }
);

db.sync().then(() => console.log("Database tersinkron"));

export default Notes;
