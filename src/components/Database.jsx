function CardDatabase({ savedCards }) {
  return (
    <div className="database-section">
      <h2>Scanned Card Database</h2>

      {savedCards.length === 0 ? (
        <p>No cards saved yet.</p>
      ) : (
        <div className="card-list">
          {savedCards.map((card) => (
            <div key={card.id} className="saved-card">
              <h3>{card.name || "Unnamed Card"}</h3>

              <p>
                <strong>Text:</strong> {card.text || "No text saved"}
              </p>

              <p>
                <strong>Set:</strong> {card.set || "N/A"}
              </p>

              <p>
                <strong>Number:</strong> {card.number || "N/A"}
              </p>

              <p className="date-scanned">
                Scanned: {card.dateScanned}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CardDatabase;