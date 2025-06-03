import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import db from "./config/database.js"
import NotesRoute from "./routes/NotesRoute.js";
import AuthRoute from "./routes/auth.js";
import User from "./models/UserModel.js";
import Notes from "./models/NotesModel.js"; // Import Notes model

dotenv.config();
const app = express();

try {
    await db.authenticate();
    console.log('Database Connected...');
    await User.sync(); // Ensure User table is created
    await Notes.sync(); // Ensure Notes table is created/updated (important for userId column)
} catch (error) {
    console.error(error);
}

// Define associations after both models are imported
User.hasMany(Notes, { foreignKey: 'userId', as: 'notes' });
Notes.belongsTo(User, { foreignKey: 'userId', as: 'user' });

app.use(cors());
app.use(express.json()); 
app.use(NotesRoute);
app.use('/api/auth', AuthRoute); // Use auth routes

app.listen(4000, function(){
    //()=> pengganti function
        console.log("server terhubung");
})
