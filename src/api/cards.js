const API = "http://localhost:3001/cards";

export async function getCards() {
    const response = await fetch(API);
    return response.json();
}

export async function createCard(card) {
    const response = await fetch(API, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(card)
    });

    return response.json();
}

export async function clearCards() {
    const response = await fetch("http://localhost:3001/cards", {
        method: "DELETE",
    });

    if (!response.ok) {
        throw new Error("Failed to clear cards.");
    }

    return response.json();
}