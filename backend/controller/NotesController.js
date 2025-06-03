//GET (ngambil data)
import Notes from "../models/NotesModel.js"

async function getNotes(req, res){
    try {
        const result = await Notes.findAll({
            where: { userId: req.user.id } // Filter notes by authenticated user's ID
        }) 
        res.status(200).json(result)
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Server error" })
    }
}

// POST
async function createNotes(req, res) {
    try {
        const inputResult = { ...req.body, userId: req.user.id }; // Add userId from authenticated user
        const newNotes = await Notes.create(inputResult);
        res.status(201).json(newNotes);
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Server error" })
    }
}

// PUT/PATCH: Update Notes
async function updateNotes(req, res) {
    console.log("Received Body:", req.body); // Debugging

    if (Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "Request body cannot be empty" });
    }

    const { id } = req.params;
    const notes = await Notes.findOne({
        where: { id, userId: req.user.id } // Find note by ID and ensure it belongs to the user
    });

    if (!notes) {
        return res.status(404).json({ message: "Note not found or you don't have permission to update it" });
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
        const notes = await Notes.findOne({
            where: { id, userId: req.user.id } // Find note by ID and ensure it belongs to the user
        });

        if (!notes) {
            return res.status(404).json({ message: "Note not found or you don't have permission to delete it" });
        }
  
        await Notes.destroy({where : {id: notes.id}}); 
        res.status(200).json({ message : "Notes deleted succesfully"})
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: "Server error" })
    }
}

// GET (ngambil data berdasarkan ID)
async function getNoteById(req, res) {
    try {
        const { id } = req.params;
        const note = await Notes.findOne({
            where: { id, userId: req.user.id } // Find note by ID and ensure it belongs to the user
        });
        if (!note) {
            return res.status(404).json({ message: "Note not found or you don't have permission to view it" });
        }
        res.status(200).json(note);
    } catch (error) {
        console.log(error.message);
        res.status(500).json({ message: "Server error" });
    }
}

export { getNotes, createNotes, updateNotes, deleteNotes, getNoteById };

