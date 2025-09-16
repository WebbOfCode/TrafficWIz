import { useState } from "react";
import { api } from "./lib/api";

export default function Risk() {
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState("");
  async function run(){
    setBusy(true); setErr("");
    try { const r = await api.predictRisk({ state:"TN", hour:17, weather:"Rain" }); setOut(r); }
    catch(e){ setErr(e.message); }
    setBusy(false);
  }
  return (
    <>
      <h1>Risk</h1>
      <div className="card">
        <button onClick={run} disabled={busy}>{busy? "Predicting…" : "Predict Risk"}</button>
        {err && <div className="error" style={{marginTop:10}}>{err}</div>}
        {out && <pre style={{background:"#0b1020",color:"#cbd5e1",padding:12,borderRadius:8,marginTop:10}}>
{JSON.stringify(out,null,2)}
        </pre>}
      </div>
    </>
  );
}
