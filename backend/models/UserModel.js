import { Sequelize } from "sequelize";
import db from "../config/database.js";
import bcrypt from "bcryptjs";

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