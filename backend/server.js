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
