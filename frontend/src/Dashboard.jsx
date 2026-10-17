const pct = (v) => Math.round(v * 100);

function Bar({ value, tone }) {
  return (
    <div className="hbar" aria-hidden="true">
      <div className={tone} style={{ width: `${Math.max(1.5, pct(value))}%` }} />
    </div>
  );
}

export default function Dashboard({ metrics }) {
  if (!metrics || !metrics.validation) {
    return <section className="card"><h2>Model dashboard</h2><p className="muted">No metrics yet. Train the model first.</p></section>;
  }
  const models = Object.entries(metrics.validation);
  const recall = Object.entries(metrics.per_disease_recall_40pct_hidden || {}).sort((a, b) => a[1] - b[1]);

  return (
    <div className="dash">
      <section className="stats">
        {[
          ["Conditions", metrics.n_diseases],
          ["Symptoms", metrics.n_symptoms],
          ["Unique records", metrics.n_unique_rows],
          ["Best model", metrics.best_model],
        ].map(([k, v]) => (
          <div className="stat" key={k}><strong>{v}</strong><span>{k}</span></div>
        ))}
      </section>

      <section className="card">
        <h2>Model comparison</h2>
        <p className="muted">Validation accuracy. “40% hidden” removes 40% of symptoms to mimic partial input.</p>
        {models.map(([name, s]) => (
          <div className="mrow" key={name}>
            <strong>{name}{name === metrics.best_model ? " (used)" : ""}</strong>
            <div><Bar value={s.accuracy_full_symptoms} tone="a" /><span>{pct(s.accuracy_full_symptoms)}% all symptoms</span></div>
            <div><Bar value={s.accuracy_40pct_hidden} tone="b" /><span>{pct(s.accuracy_40pct_hidden)}% 40% hidden</span></div>
          </div>
        ))}
        {metrics.testing_csv_accuracy != null && (
          <p className="muted">Accuracy on the separate Testing.csv file: {pct(metrics.testing_csv_accuracy)}%</p>
        )}
      </section>

      {recall.length > 0 && (
        <section className="card">
          <h2>Accuracy by condition</h2>
          <p className="muted">Share of validation cases found when 40% of symptoms are hidden. Weakest first. Each condition has few validation cases, so treat these as rough.</p>
          {recall.map(([d, v]) => (
            <div className="drow" key={d}>
              <span>{d}</span>
              <Bar value={v} tone={v < 0.6 ? "c" : "a"} />
              <em>{pct(v)}%</em>
            </div>
          ))}
        </section>
      )}
      <p className="foot">{metrics.note}</p>
    </div>
  );
}
