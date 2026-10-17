const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Downloads a standalone HTML report (open it and use Print > Save as PDF if you want a PDF).
export function downloadReport({ date, labels, predictions }) {
  const when = new Date(date).toLocaleString();
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Symptom report</title>
<style>body{font-family:system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;color:#12282d;line-height:1.5}
h1{margin-bottom:0}small,.m{color:#587076}table{width:100%;border-collapse:collapse;margin:16px 0}
td,th{text-align:left;padding:8px;border-bottom:1px solid #d5dfe2}</style></head><body>
<h1>Symptom report</h1><small>${esc(when)}</small>
<h3>Symptoms reported</h3><p>${labels.map(esc).join(", ")}</p>
<h3>Most likely conditions</h3>
<table><tr><th>Condition</th><th>Match</th><th>Suggested specialist</th></tr>
${predictions.map((p) => `<tr><td>${esc(p.disease)}</td><td>${p.probability}%</td><td>${esc(p.specialist)}</td></tr>`).join("")}</table>
<p class="m">This is a screening aid, not a diagnosis. See a qualified doctor for medical advice.</p></body></html>`;
  const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `symptom-report-${new Date(date).toISOString().slice(0, 10)}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
