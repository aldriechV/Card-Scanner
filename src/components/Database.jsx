import { useState } from "react";

function CardDatabase({ savedCards, clearDatabase }) {

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGame, setSelectedGame] = useState("All");
  const [selectedSet, setSelectedSet] = useState("All");
  const [selectedOwner, setSelectedOwner] = useState("All");

  const games = [
    "All",
    ...new Set(savedCards.map(card => card.game))
  ];

  const sets = [
    "All",
    ...new Set(savedCards.map(card => card.set))
  ];

  const filteredCards = savedCards.filter((card) => {

    const search = searchTerm.toLowerCase();

    const matchesSearch =
      card.name?.toLowerCase().includes(search) ||
      card.set?.toLowerCase().includes(search) ||
      card.game?.toLowerCase().includes(search);

    const matchesGame =
      selectedGame === "All" ||
      card.game === selectedGame;

    const matchesSet =
      selectedSet === "All" ||
      card.set === selectedSet;

    return matchesSearch && matchesGame && matchesSet;
  });

  return (
    <div className="database-section">

      <h2>Scanned Card Database</h2>

      <div className="database-layout">

        {/* Card entries */}
        <div className="database-entries">

          {filteredCards.length === 0 ? (
            <p>No cards found.</p>
          ) : (
            <div className="card-list">

              {filteredCards.map((card) => (
                <div key={card.id} className="saved-card">

                  <h3>
                    {card.name || "Unnamed Card"}
                  </h3>

                  <p>
                    <strong>Set:</strong>{" "}
                    {card.set || "N/A"}
                  </p>

                  <p>
                    <strong>Quantity:</strong>{" "}
                    {card.quantity || 1}
                  </p>

                  <p>
                    <strong>Scanned:</strong>{" "}
                    {card.dateScanned || "N/A"}
                  </p>

                </div>
              ))}

            </div>
          )}

        </div>

        {/* Search and filters */}
        <div className="database-filters">

          <h3>Search & Filter</h3>

          <input
            type="text"
            placeholder="Search cards..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <label>Game</label>

          <select
            value={selectedGame}
            onChange={(e) => setSelectedGame(e.target.value)}
          >
            {games.map((game) => (
              <option key={game} value={game}>
                {game}
              </option>
            ))}
          </select>

          <label>Set</label>

          <select
            value={selectedSet}
            onChange={(e) => setSelectedSet(e.target.value)}
          >
            {sets.map((set) => (
              <option key={set} value={set}>
                {set}
              </option>
            ))}
          </select>

        </div>

      </div>

      {savedCards.length > 0 && (
        <button onClick={clearDatabase}>
          Clear Database
        </button>
      )}

    </div>
  );
}

export default CardDatabase;