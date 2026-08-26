import { useState } from "react";

function CardDatabase({ savedCards, clearDatabase }) {

  const [searcchTerm, setSearchTerm] = useState("");
  const [selecetedGame, setSelectedGame] = useState("All");
  const [selectedSet, setSelectedSet] = useState("All");
  const [selectedOwner, setSelectedOwner] = useState("All");

  return (
    <div className="database-section">
      <h2>Scanned Card Database</h2>

      {savedCards.length > 0 && (
        <button onClick={clearDatabase}>
          Clear Database
        </button>
      )}

      {savedCards.length === 0 ? (
        <p>No cards saved yet.</p>
      ) : (
        <div className="card-list">
          {savedCards.map((card) => (
            <div key={card.id} className="saved-card">
              <h3>{card.name || "Unnamed Card"}</h3>

              <p>
                <strong>Set:</strong> {card.set || "N/A"}
              </p>

              <p>
                <strong>Quantity:</strong> {card.quantity || 1}
              </p>
              
              <p>
                <strong>Scanned:</strong> {card.dateScanned || "N/A"}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CardDatabase;