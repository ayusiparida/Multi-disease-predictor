import { useEffect, useState } from "react";
import { getDisease } from "./api";

export default function DiseaseModal({ name, onClose }) {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getDisease(name).then(setInfo).catch((e) => setError(e.message));
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [name, onClose]);

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={name} onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        <h2>{name}</h2>
        {error && <p className="error">{error}</p>}
        {!info && !error && <p className="muted">Loading…</p>}
        {info && (
          <>
            <p>{info.description}</p>
            {info.precautions.length > 0 && (
              <>
                <h3>What you can do</h3>
                <ul>{info.precautions.map((p) => <li key={p}>{p}</li>)}</ul>
              </>
            )}
            <h3>When to see a doctor</h3>
            <p className={info.urgent ? "urgent" : ""}>{info.see_doctor}</p>
            <p className="muted">Suggested specialist: {info.specialist}</p>
            <p className="disclaimer">{info.disclaimer}</p>
          </>
        )}
      </div>
    </div>
  );
}
