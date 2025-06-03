import { Sequelize } from "sequelize";
import db from "../config/database.js";
// import User from "./UserModel.js"; // Remove this import

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
                model: 'users', // KEMBALIKAN INI: Specify the table name as a string
                key: 'id',
            }
        }
    },
    {
        timestamps: true, 
    }
);

// Remove this association definition
// Notes.belongsTo(User, { foreignKey: 'userId', as: 'user' });

db.sync().then(() => console.log("Database tersinkron"));

export default Notes;
