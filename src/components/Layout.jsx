import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Layout({ children }) {
  const [role, setRole] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const navigate = useNavigate();

  // Récupération du rôle de l'utilisateur connecté
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

  // Fonction de déconnexion
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

  return (
    <div className="app-shell">

      {/* EN-TÊTE */}
      <header className="topbar">

        <Link className="brand" to="/">
          SOUND<span>-B</span>
        </Link>

        <nav>
          <NavLink to="/" end>
            Accueil
          </NavLink>

          <NavLink to="/recherche">
            Découvrir
          </NavLink>

          <NavLink to="/artistes">
  Artistes
</NavLink>

          {role === "artist" && (
            <NavLink to="/artiste/tableau-de-bord">
              Espace artiste
            </NavLink>
          )}

          {role === "admin" && (
            <NavLink to="/administration">
              Administration
            </NavLink>
          )}
        </nav>

        {/* CONNEXION OU DÉCONNEXION */}
        {role ? (
          <button
            className="logout-btn"
            onClick={logout}
            disabled={loggingOut}
          >
            {loggingOut ? "Déconnexion..." : "Déconnexion"}
          </button>
        ) : (
          <Link className="login-link" to="/connexion">
            Connexion
          </Link>
        )}

      </header>

      {/* CONTENU DES PAGES */}
      <main className="page-wrap">
        {children}
      </main>

      {/* NAVIGATION MOBILE EN BAS */}
      <nav className="bottom-navigation">

        <NavLink to="/" end>
          <span>⌂</span>
          Accueil
        </NavLink>

        <NavLink to="/recherche">
          <span>⌕</span>
          Découvrir
        </NavLink>

        {role === "artist" && (
          <NavLink to="/artiste/tableau-de-bord">
            <span>♫</span>
            Artiste
          </NavLink>
        )}

        {role === "admin" && (
          <NavLink to="/administration">
            <span>⚙</span>
            Admin
          </NavLink>
        )}

      </nav>

      {/* PIED DE PAGE */}
      <footer>
        © {new Date().getFullYear()} SOUND-B ·
        Une plateforme de DMP Creator Production
      </footer>

    </div>
  );
}
