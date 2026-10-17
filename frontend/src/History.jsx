export default function History({ items, onOpen, onRestore, onDelete, onClear, onDownload }) {
  if (!items.length) {
    return (
      <section className="card">
        <h2>History</h2>
        <p className="muted">No checks yet. Run a check and it will be saved here, on this device only.</p>
      </section>
    );
  }
  return (
    <section className="card">
      <div className="split">
        <h2>History ({items.length})</h2>
        <button className="ghost" onClick={onClear}>Clear all</button>
      </div>
      <ul className="hist">
        {items.map((e) => (
          <li key={e.id}>
            <div>
              <strong>{new Date(e.date).toLocaleString()}</strong>
              <p className="muted">{e.labels.join(", ")}</p>
              <p>
                Top match:{" "}
                <button className="link" onClick={() => onOpen(e.predictions[0].disease)}>
                  {e.predictions[0].disease}
                </button>{" "}
                ({Math.round(e.predictions[0].probability)}%)
              </p>
            </div>
            <div className="row-actions">
              <button className="ghost" onClick={() => onRestore(e)}>Reopen</button>
              <button className="ghost" onClick={() => onDownload(e)}>Report</button>
              <button className="ghost" onClick={() => onDelete(e.id)} aria-label="Delete this check">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
