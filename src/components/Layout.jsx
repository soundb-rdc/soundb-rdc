import { Link, NavLink } from "react-router-dom";
export default function Layout({ children }) {
  return <div className="app-shell">
    <header className="topbar">
      <Link className="brand" to="/">SOUND<span>-B</span></Link>
      <nav>
        <NavLink to="/">Accueil</NavLink>
        <NavLink to="/recherche">Découvrir</NavLink>
        <NavLink to="/artiste/tableau-de-bord">Espace artiste</NavLink>
      </nav>
      <Link className="login-link" to="/connexion">Connexion</Link>
    </header>
    <main className="page-wrap">{children}</main>
    <footer>© {new Date().getFullYear()} SOUND-B · Une plateforme de DMP Creator Production</footer>
  </div>;
}
