import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Layout({ children }) {
  const [role, setRole] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

const showLogout =
  location.pathname === "/artiste/tableau-de-bord" ||
  location.pathname === "/administration";

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    async function loadRole(session) {
      if (!session?.user) {
        if (active) setRole(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (active) {
        setRole(error ? null : data?.role || null);
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      loadRole(data.session);
    });

    const { data: listener } =
      supabase.auth.onAuthStateChange(
        (_event, session) => {
          loadRole(session);
        }
      );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function logout() {
    if (!supabase || loggingOut) return;

    setLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Erreur lors de la déconnexion : " + error.message);
      setLoggingOut(false);
      return;
    }

    setRole(null);
    navigate("/connexion", { replace: true });
    setLoggingOut(false);
  }

  const accountLink =
    role === "artist"
      ? "/artiste/tableau-de-bord"
      : role === "admin"
      ? "/administration"
      : "/connexion";

  return (
    <div className="app-shell">

      {/* BARRE DE NAVIGATION PRINCIPALE */}
      <header className="topbar">

        <Link className="brand" to="/">
          SOUND<span>-B</span>
        </Link>

        <nav>
          <NavLink to="/playliste">
            Playliste
          </NavLink>

          <NavLink to="/artistes">
            Artistes
          </NavLink>
        </nav>

        {role && showLogout ? (
  <button
    className="logout-btn"
    onClick={logout}
    disabled={loggingOut}
  >
    {loggingOut ? "Déconnexion..." : "Déconnexion"}
  </button>
) : null}

      </header>

      {/* CONTENU DES PAGES */}
      <main className="page-wrap">
        {children}
      </main>

      {/* NAVIGATION MOBILE */}
      <nav className="bottom-navigation">

        <NavLink to="/" end>
          <span>⌂</span>
          Accueil
        </NavLink>

        <NavLink to="/recherche">
          <span>⌕</span>
          Découvrir
        </NavLink>

        <NavLink to={accountLink}>
          <span>♙</span>
          Compte
        </NavLink>

      </nav>

      {/* PIED DE PAGE */}
      <footer>
        © {new Date().getFullYear()} SOUND-B ·
        Une plateforme de DMP Creator Production
      </footer>

    </div>
  );
}
