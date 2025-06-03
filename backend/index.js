import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import db from "./config/database.js"
import NotesRoute from "./routes/NotesRoute.js";
import AuthRoute from "./routes/auth.js";
import User from "./models/UserModel.js";

dotenv.config();
const app = express();

try {
    await db.authenticate();
    console.log('Database Connected...');
    await User.sync(); // Ensure User table is created
} catch (error) {
    console.error(error);
}

app.use(cors());
app.use(express.json()); 
app.use(NotesRoute);
app.use('/api/auth', AuthRoute); // Use auth routes

app.listen(4000, function(){
    //()=> pengganti function
        console.log("server terhubung");
})
