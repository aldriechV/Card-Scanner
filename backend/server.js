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
        const cards = await prisma.card.findMany();

        res.json(cards);
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: "Failed to retrieve cards."
        });
    }
});

app.listen(3001, () => {
    console.log("Server is running on port 3001.");

});