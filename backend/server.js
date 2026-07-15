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

app.get("/cards", async (req, res) => {
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

app.listen(3001, () => {
    console.log("Server is running on port 3001.");

});