const API_URL = "http://localhost:3001/cards";

export async function getCards() {
    const response = await fetch(API_URL);

    if (!response.ok) {
        throw new Error("Failed to fetch cards");
    }

    return response.json();
}

export async function createCard(card) {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(card),
    });

    if (!response.ok) {
        throw new Error("Failed to create card");
    }

    return response.json();
}

export async function updateCard(id, card) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(card),
    });

    if (!response.ok) {
        throw new Error("Failed to update card");
    }

    return response.json();
}

export async function deleteCard(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
    });

    if (!response.ok) {
        throw new Error("Failed to delete card");
    }
}

export async function clearCards() {
    await fetch(API_URL, {
        method: "DELETE",
    });
}