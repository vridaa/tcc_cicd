//GET (ngambil data)
import Notes from "../models/NotesModel.js"

async function getNotes(req, res){
    try {
        const result = await Notes.findAll() 
        res.status(200).json(result)
    } catch (error) {
        console.log(error.message)
    }
}

// POST
async function createNotes(req, res) {
    try {
        const inputResult = req.body;
        const newNotes = await Notes.create(inputResult);
        res.status(201).json(newNotes);
    } catch (error) {
        console.log(error.message)
    }
}

// PUT/PATCH: Update Notes
async function updateNotes(req, res) {
    console.log("Received Body:", req.body); // Debugging

    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "Request body cannot be empty" });
    }

    const { id } = req.params;
    const notes = await Notes.findByPk(id);

    if (!notes) {
        return res.status(404).json({ message: "Note not found" });
    }

    notes.set(req.body);
    await notes.save();

    return res.status(200).json({
        message: "Note updated successfully",
        data: notes
    });
}

// DELETE
async function deleteNotes(req, res) {
    try {
      
    const { id } = req.params;
    const notes = await Notes.findByPk(id);

    if (!notes) {
        return res.status(404).json({ message: "Note not found" });
    }
  
      await Notes.destroy({where : {id}}); 
      res.status(200).json({ message : "Notes deleted succesfully"})
    } catch (error) {
      console.log(error.message)
    }
    
  }

  // GET (ngambil data berdasarkan ID)
async function getNoteById(req, res) {
    try {
        const { id } = req.params;
        const note = await Notes.findByPk(id);
        if (!note) {
            return res.status(404).json({ message: "Note not found" });
        }
        res.status(200).json(note);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Server error" });
    }
}


export { getNotes, createNotes, updateNotes, deleteNotes, getNoteById };

