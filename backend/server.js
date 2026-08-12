const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const cardRoutes = require("./routes/cardRoutes");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Hello World!" });
});

app.use("/cards", cardRoutes);

app.listen(3001, () => {
    console.log("Server is running on port 3001.");
});