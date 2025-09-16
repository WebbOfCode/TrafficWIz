import { Outlet, NavLink } from "react-router-dom";

export default function App() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <h2>TrafficWiz</h2>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/incidents">Incidents</NavLink>
          <NavLink to="/risk">Risk</NavLink>
        </nav>
      </aside>
      <main className="main">
        <Outlet/>
      </main>
    </div>
  );
}
