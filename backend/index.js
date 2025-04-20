import express from "express"
import cors from "cors"
import NotesRoute from "./routes/NotesRoute.js";
const app = express();

app.use(cors());
app.use(express.json()); 
app.use(NotesRoute);

app.listen(4000, function(){
    //()=> pengganti function
        console.log("server terhubung");
})
