const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();


// =====================================================
// GET ALL CARDS
// GET /cards
// =====================================================
exports.getCards = async (req, res) => {
    try {
        const cards = await prisma.card.findMany();

        res.json(cards);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to retrieve cards."
        });
    }
};


// =====================================================
// GET CARD BY ID
// GET /cards/:id
// =====================================================
exports.getCardById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const card = await prisma.card.findUnique({
            where: {
                id: id
            }
        });

        if (!card) {
            return res.status(404).json({
                error: "Card not found."
            });
        }

        res.json(card);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "An error occurred while retrieving the card."
        });
    }
};


// =====================================================
// CREATE CARD
// POST /cards
// =====================================================
exports.createCard = async (req, res) => {
    try {
        const card = await prisma.card.create({
            data: {
                name: req.body.name,
                quantity: req.body.quantity ?? 1,

                // Include these if they exist in your Prisma model
                set: req.body.set,
                game: req.body.game,
                rarity: req.body.rarity
            }
        });

        res.status(201).json(card);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "An error occurred while creating the card."
        });
    }
};


// =====================================================
// UPDATE CARD
// PUT /cards/:id
// =====================================================
exports.updateCard = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        const updatedCard = await prisma.card.update({
            where: {
                id: id
            },

            data: {
                name: req.body.name,
                quantity: req.body.quantity,

                // Include these if they exist in your Prisma model
                set: req.body.set,
                game: req.body.game,
                rarity: req.body.rarity
            }
        });

        res.json(updatedCard);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "An error occurred while updating the card."
        });
    }
};


// =====================================================
// DELETE ONE CARD
// DELETE /cards/:id
// =====================================================
exports.deleteCard = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        await prisma.card.delete({
            where: {
                id: id
            }
        });

        res.json({
            message: "Card deleted successfully."
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "An error occurred while deleting the card."
        });
    }
};


// =====================================================
// DELETE ALL CARDS
// DELETE /cards
// =====================================================
exports.clearCards = async (req, res) => {
    try {
        await prisma.card.deleteMany();

        res.json({
            message: "Database cleared."
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            error: "Failed to clear database."
        });
    }
};