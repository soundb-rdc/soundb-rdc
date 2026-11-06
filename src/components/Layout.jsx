import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Layout({ children }) {
  const [role, setRole] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const [newReleaseCount, setNewReleaseCount] = useState(0);

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

  // SUIVI ET ACTUALISATION DES NOUVEAUTÉS
  useEffect(() => {
    if (!supabase) return;

    const storageKey = "soundb_last_visit";
    const now = new Date();

    // Récupérer la date de la précédente visite
    let previousVisitDate = null;

    try {
      const lastVisit = localStorage.getItem(storageKey);

      if (lastVisit) {
        const parsed = new Date(lastVisit);
        if (!isNaN(parsed.getTime())) {
          previousVisitDate = parsed;
        }
      }

      // Enregistrer la visite actuelle
      localStorage.setItem(storageKey, now.toISOString());
    } catch (err) {
      console.error("Stockage local indisponible :", err);
    }

    async function checkNewReleases() {
      const currentDate = new Date();

      // Début de la semaine : lundi à 00h00
      const weekStart = new Date(currentDate);
      const day = (currentDate.getDay() + 6) % 7;

      weekStart.setDate(currentDate.getDate() - day);
      weekStart.setHours(0, 0, 0, 0);

      // Utiliser la date la plus récente
      const since =
        previousVisitDate && previousVisitDate > weekStart
          ? previousVisitDate
          : weekStart;

      const { count, error } = await supabase
        .from("tracks")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved")
        .gte("published_at", since.toISOString());

      if (error) {
        console.error("Erreur de comptage des nouveautés :", error);
        return;
      }

      setNewReleaseCount(count || 0);
    }

    // Première vérification
    checkNewReleases();

    // Actualisation toutes les 60 secondes
    const interval = setInterval(() => {
      checkNewReleases();
    }, 60000);

    return () => {
      clearInterval(interval);
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
          <NavLink to="/playliste">Playliste</NavLink>

          <NavLink to="/nouveautes" className="nav-nouveautes">
            Nouveautés

            {newReleaseCount > 0 && (
              <span className="new-release-badge">
                {newReleaseCount > 99 ? "99+" : newReleaseCount}
              </span>
            )}
          </NavLink>

          <NavLink to="/artistes">Artistes</NavLink>
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
      <main className="page-wrap">{children}</main>

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
  © {new Date().getFullYear()} SOUND-B · Une plateforme de DMP Creator
  Production · <Link to="/a-propos">À propos</Link>
</footer>
    </div>
  );
}
