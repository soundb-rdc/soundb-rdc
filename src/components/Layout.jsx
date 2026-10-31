import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Layout({ children }) {
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (!supabase) return;

    let active = true;

    async function loadRole(session) {
      if (!session?.user) {
        if (active) setRole(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .maybeSingle();

      if (active) setRole(data?.role || null);
    }

    supabase.auth.getSession().then(({ data }) => {
      loadRole(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        loadRole(session);
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          SOUND<span>-B</span>
        </Link>

        <nav>
          <NavLink to="/">Accueil</NavLink>
          <NavLink to="/recherche">Découvrir</NavLink>
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

        {!role && (
          <Link className="login-link" to="/connexion">
            Connexion
          </Link>
        )}
      </header>

      <main className="page-wrap">{children}</main>

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

      <footer>
        © {new Date().getFullYear()} SOUND-B ·
        Une plateforme de DMP Creator Production
      </footer>
    </div>
  );
}
