import { Sequelize } from "sequelize";
import db from "../config/database.js";
import bcrypt from "bcryptjs";
// import Notes from "./NotesModel.js"; // This import is not needed here

const { DataTypes } = Sequelize;

const User = db.define(
    "users",
    {
        username: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        refreshToken: {
            type: DataTypes.STRING, // New column for refresh token (hashed)
            allowNull: true, // Can be null if no refresh token is issued or it's revoked
        },
    },
    {
        timestamps: false,
    }
);

User.beforeCreate(async (user) => {
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
});

export default User; 