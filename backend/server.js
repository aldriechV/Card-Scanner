const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Hello World!" });
});

// Retrieves all cards from the database and returns them as a JSON response.
app.get("/cards", async (req, res) => {
    try {
        const cards = await prisma.card.findMany();
        res.json(cards);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to retrieve cards."
        });
    }
});

//creates a card for the user to add to their collection. If quantity is not provided, it defaults to 1.
app.post("/cards", async (req, res) => {
    try {
        const card = await prisma.card.create({
            data: {
                name: req.body.name,
                quantity: req.body.quantity ?? 1
            }
        });

        res.status(201).json(card);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while creating the card." });
    }

});

//Searching and locating for a single card by its ID. If the card is not found, it returns a 404 error.]
//format your card like: /cards/1 to test it out at the backend server. If the card is found, it returns the card details as a JSON response.
app.get("/cards/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const card = await prisma.card.findUnique({
            where: { 
                id: id
            }
        });

        if (!card) {
            return res.status(404).json({ error: "Card not found." });
        }

        res.json(card);
    } catch (error) {
        console.error(error);
        res.status(500).json({ 
            error: "An error occurred while retrieving the card." 
        });
    }
});

app.listen(3001, () => {
    console.log("Server is running on port 3001.");

});

//updating a card:
app.put("/cards/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updateCard = await prisma.card.update({
            where: { id: id },
            data: {
                name: req.body.name,
                quantity: req.body.quantity
            }
        });
        res.json(updateCard);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "An error occurred while updating the card." });
    }
});