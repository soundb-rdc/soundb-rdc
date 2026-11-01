import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ArtistDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({
    total_plays: 0,
    total_downloads: 0,
    published_tracks: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    if (!supabase) {
      setLoading(false);
      return;
    }

    try {
      const { data: auth, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      if (!auth.user) {
        setLoading(false);
        return;
      }

      setUser(auth.user);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .maybeSingle();

      if (error) throw error;

      setProfile(data);

      const { data: statistics, error: statsError } =
        await supabase.rpc("get_artist_statistics");

      if (statsError) throw statsError;

      if (Array.isArray(statistics) && statistics.length > 0) {
        setStats(statistics[0]);
      } else if (statistics && !Array.isArray(statistics)) {
        setStats(statistics);
      }
    } catch (error) {
      console.error("Erreur tableau de bord SOUND-B :", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p className="muted">Chargement de votre espace artiste...</p>;
  }

  if (!user) {
    return (
      <section className="page">
        <p>Connectez-vous pour accéder à votre espace artiste.</p>
        <Link className="btn primary" to="/connexion">
          Se connecter
        </Link>
      </section>
    );
  }

  return (
    <section className="page">
      <p className="eyebrow">ESPACE PERSONNEL</p>

      <h1>Tableau de bord artiste</h1>

      <div className="artist-profile">
        <img
          className="artist-profile-photo"
          src={
            profile?.avatar_url ||
            "https://placehold.co/150x150/392416/ff8a32?text=SOUND-B"
          }
          alt="Photo de profil"
        />

        <div>
          <h2>{profile?.artist_name || "Artiste SOUND-B"}</h2>
          <p className="muted">{user.email}</p>

          {profile?.music_styles?.length > 0 && (
            <p className="muted">
              {profile.music_styles.join(" • ")}
            </p>
          )}
        </div>
      </div>

      <div className="actions">
        <Link
          className="btn primary"
          to="/artiste/modifier-profil"
        >
          ✎ Modifier mon profil
        </Link>

        <Link
          className="btn secondary"
          to="/artiste/ajouter-musique"
        >
          + Ajouter une musique
        </Link>
      </div>

      <div className="dashboard-grid">
        <div className="stat">
          <b>{Number(stats.total_plays).toLocaleString("fr-FR")}</b>
          <span>Écoutes</span>
        </div>

        <div className="stat">
          <b>{Number(stats.total_downloads).toLocaleString("fr-FR")}</b>
          <span>Téléchargements</span>
        </div>

        <div className="stat">
          <b>{Number(stats.published_tracks).toLocaleString("fr-FR")}</b>
          <span>Titres publiés</span>
        </div>
      </div>
    </section>
  );
}
