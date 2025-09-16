import { useEffect, useState } from "react";
import { api } from "./lib/api";

export default function Dashboard() {
  const [status, setStatus] = useState("checking…");
  const [err, setErr] = useState("");
  useEffect(() => { api.health().then(r=>setStatus(r.status||"ok")).catch(e=>setErr(e.message)); }, []);
  return (
    <>
      <h1>Dashboard</h1>
      {err ? <div className="error">Backend error: {err}</div> : <p>Backend health: <b>{status}</b></p>}
      <div className="card"><p>Welcome to TrafficWiz.</p></div>
    </>
  );
}
