import { useEffect, useState } from "react";
import { api } from "./lib/api";

export default function Incidents() {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    api.byMonth("TN").then(setRows).catch(e => setErr(e.message));
  }, []);

  return (
    <>
      <h1>Incidents</h1>
      {err && <div className="error">{err}</div>}
      <div className="card">
        <h3>Accidents by Month (TN)</h3>
        <table style={{width:"100%",borderCollapse:"collapse"}}>
          <thead><tr><th style={{textAlign:"left"}}>Month</th><th style={{textAlign:"left"}}>Count</th></tr></thead>
          <tbody>
            {rows.map((d,i)=> <tr key={i}><td>{d.month}</td><td>{d.count}</td></tr>)}
          </tbody>
        </table>
      </div>
    </>
  );
}
