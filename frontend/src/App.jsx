import { useEffect, useMemo, useState } from "react";
import { getSymptoms, getMetrics, predict } from "./api";
import { groupOf, GROUP_ORDER } from "./groups";
import DiseaseModal from "./DiseaseModal";
import History from "./History";
import Dashboard from "./Dashboard";
import { downloadReport } from "./report";

export default function App() {
  const [symptoms, setSymptoms] = useState([]);
  const [selected, setSelected] = useState([]);
  const [query, setQuery] = useState("");
  const [area, setArea] = useState("All");
  const [result, setResult] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState("check");
  const [openDisease, setOpenDisease] = useState(null);
  const [history, setHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem("history") || "[]"); } catch { return []; }
  });
  const saveHistory = (h) => {
    setHistory(h);
    try { localStorage.setItem("history", JSON.stringify(h)); } catch { /* storage unavailable */ }
  };

  useEffect(() => {
    getSymptoms()
      .then((d) => setSymptoms(d.symptoms.map((s) => ({ ...s, area: groupOf(s.id) }))))
      .catch((e) => setError(e.message));
    getMetrics().then(setMetrics).catch(() => {});
  }, []);

  const labelOf = useMemo(() => Object.fromEntries(symptoms.map((s) => [s.id, s.label])), [symptoms]);

  const areas = useMemo(() => {
    const counts = {};
    symptoms.forEach((s) => (counts[s.area] = (counts[s.area] || 0) + 1));
    return GROUP_ORDER.filter((a) => counts[a]).map((a) => ({ name: a, count: counts[a] }));
  }, [symptoms]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return symptoms.filter(
      (s) => (area === "All" || s.area === area) && s.label.toLowerCase().includes(q)
    );
  }, [symptoms, query, area]);

  const toggle = (id) => {
    setResult(null);
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await predict(selected);
      setResult(r);
      saveHistory([
        { id: Date.now(), date: new Date().toISOString(), symptoms: selected, labels: selected.map((id) => labelOf[id] || id), predictions: r.predictions },
        ...history,
      ].slice(0, 30));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setSelected([]);
    setResult(null);
    setError("");
  };

  const val = metrics?.validation?.[metrics?.best_model];
  const need = Math.max(0, 3 - selected.length);

  return (
    <div className="page">
      <header className="hero">
        <h1>What are you feeling?</h1>
        <p>
          Tick every symptom that applies. The model compares them against {metrics?.n_diseases ?? "dozens of"} conditions
          and ranks the closest matches.
        </p>
      </header>

      <nav className="nav" aria-label="Sections">
        {[["check", "Check"], ["history", `History (${history.length})`], ["dashboard", "Model dashboard"]].map(([k, l]) => (
          <button key={k} className={view === k ? "on" : ""} onClick={() => setView(k)}>{l}</button>
        ))}
      </nav>

      {view === "history" && (
        <History
          items={history}
          onOpen={setOpenDisease}
          onRestore={(e) => { setSelected(e.symptoms); setResult(null); setView("check"); }}
          onDelete={(id) => saveHistory(history.filter((h) => h.id !== id))}
          onClear={() => saveHistory([])}
          onDownload={downloadReport}
        />
      )}
      {view === "dashboard" && <Dashboard metrics={metrics} />}

      {view === "check" && (
      <main className="layout">
        <section className="picker" aria-label="Symptoms">
          <input
            className="search"
            type="search"
            placeholder={`Search ${symptoms.length || ""} symptoms`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="areas" role="tablist" aria-label="Body area">
            {[{ name: "All", count: symptoms.length }, ...areas].map((a) => (
              <button
                key={a.name}
                role="tab"
                aria-selected={area === a.name}
                className={"area" + (area === a.name ? " on" : "")}
                onClick={() => setArea(a.name)}
              >
                {a.name} <span>{a.count}</span>
              </button>
            ))}
          </div>

          <div className="chips">
            {visible.map((s) => (
              <button
                key={s.id}
                type="button"
                className={"chip" + (selected.includes(s.id) ? " on" : "")}
                aria-pressed={selected.includes(s.id)}
                onClick={() => toggle(s.id)}
              >
                {s.label}
              </button>
            ))}
            {symptoms.length > 0 && visible.length === 0 && (
              <p className="muted">Nothing matches “{query}” in this area. Try “All”.</p>
            )}
          </div>
        </section>

        <aside className="panel" aria-live="polite">
          <h2>
            Your symptoms <span className="count">{selected.length}</span>
          </h2>

          {selected.length === 0 ? (
            <p className="muted">Nothing selected yet. Pick a body area and start ticking.</p>
          ) : (
            <ul className="tray">
              {selected.map((id) => (
                <li key={id}>
                  <button type="button" onClick={() => toggle(id)} aria-label={`Remove ${labelOf[id]}`}>
                    {labelOf[id]} <span aria-hidden="true">×</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {need > 0 && selected.length > 0 && (
            <p className="muted">Add {need} more for a more reliable result.</p>
          )}

          <div className="actions">
            <button className="primary" disabled={!selected.length || loading} onClick={run}>
              {loading ? "Checking…" : "Find likely conditions"}
            </button>
            <button className="ghost" disabled={!selected.length} onClick={clear}>
              Clear
            </button>
          </div>

          {error && <p className="error" role="alert">{error}</p>}

          {result && (
            <div className="results">
              {result.urgent && (
                <p className="urgent" role="alert">
                  This pattern can be a medical emergency. Get urgent care now.
                </p>
              )}
              {result.low_confidence && (
                <p className="warn">Low confidence. Adding more symptoms will narrow this down.</p>
              )}

              <ol>
                {result.predictions.map((p, i) => (
                  <li key={p.disease} className={i === 0 ? "lead" : ""}>
                    <div className="pct">{Math.round(p.probability)}<small>%</small></div>
                    <div className="body">
                      <button className="link" onClick={() => setOpenDisease(p.disease)} title="About this condition">{p.disease}</button>
                      <div className="bar"><div style={{ width: `${Math.max(2, p.probability)}%` }} /></div>
                      <span className="spec">Suggested specialist: {p.specialist}</span>
                    </div>
                  </li>
                ))}
              </ol>
              <p className="disclaimer">{result.disclaimer}</p>
              <button
                className="ghost"
                onClick={() => downloadReport({ date: new Date().toISOString(), labels: selected.map((id) => labelOf[id] || id), predictions: result.predictions })}
              >
                Download report
              </button>
            </div>
          )}
        </aside>
      </main>
      )}

      {val && (
        <footer className="foot">
          Model: {metrics.best_model}, trained on {metrics.n_unique_rows} unique symptom records. Validation accuracy
          {" "}{Math.round(val.accuracy_full_symptoms * 100)}% with complete symptom lists and{" "}
          {Math.round(val.accuracy_40pct_hidden * 100)}% when 40% of symptoms are missing. The data is a symptom
          checklist, not clinical records.
        </footer>
      )}
      {openDisease && <DiseaseModal name={openDisease} onClose={() => setOpenDisease(null)} />}
    </div>
  );
}
