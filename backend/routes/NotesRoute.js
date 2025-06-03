import express from "express"
import { getNotes, createNotes, updateNotes, deleteNotes, getNoteById} from "../controller/NotesController.js"
import auth from '../middleware/auth.js'

const router = express.Router()

router.get("/notes", auth, getNotes)
router.get("/notes/:id", auth, getNoteById); 
router.post("/add-notes", auth, createNotes);
router.put("/edit-notes/:id", auth, updateNotes);
router.delete("/delete-notes/:id", auth, deleteNotes);

export default router;