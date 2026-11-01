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

  const [advanced, setAdvanced] = useState({
    top_tracks: [],
    daily_plays: [],
    recent_downloads: []
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

      const { data: profileData, error: profileError } =
        await supabase
          .from("profiles")
          .select("*")
          .eq("id", auth.user.id)
          .maybeSingle();

      if (profileError) throw profileError;

      setProfile(profileData);

      // Statistiques générales
      const { data: statistics, error: statsError } =
        await supabase.rpc("get_artist_statistics");

      if (statsError) throw statsError;

      const basicStats = Array.isArray(statistics)
        ? statistics[0]
        : statistics;

      if (basicStats) {
        setStats(basicStats);
      }

      // Statistiques avancées
      const { data: advancedData, error: advancedError } =
        await supabase.rpc("get_artist_advanced_statistics");

      if (advancedError) throw advancedError;

      if (advancedData) {
        setAdvanced({
          top_tracks: advancedData.top_tracks || [],
          daily_plays: advancedData.daily_plays || [],
          recent_downloads: advancedData.recent_downloads || []
        });
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

  const maxPlays = Math.max(
    1,
    ...advanced.daily_plays.map(day => Number(day.total))
  );

  return (
    <section className="page">

      <p className="eyebrow">ESPACE PERSONNEL</p>

      <h1>Tableau de bord artiste</h1>
      
{/* NOTIFICATION DE VALIDATION DU PROFIL */}

{profile?.validation_status === "pending" && (
  <div style={{
    padding: "16px",
    margin: "20px 0",
    borderRadius: "10px",
    background: "rgba(255, 170, 0, 0.12)",
    border: "1px solid #e6a23c"
  }}>
    <strong>⏳ Profil en cours de vérification</strong>
    <p>
      Votre demande d'inscription est bien reçue.
      Notre équipe examine actuellement votre profil.
      Vous serez informé dès qu'une décision sera prise.
    </p>
  </div>
)}

{profile?.validation_status === "approved" && (
  <div style={{
    padding: "16px",
    margin: "20px 0",
    borderRadius: "10px",
    background: "rgba(40, 180, 100, 0.12)",
    border: "1px solid #28b464"
  }}>
    <strong>🎉 Félicitations ! Votre profil est validé.</strong>
    <p>
      Votre profil artiste est maintenant approuvé
      et peut être visible sur SOUND-B.
      Bienvenue officiellement dans notre communauté !
    </p>
  </div>
)}

{profile?.validation_status === "rejected" && (
  <div style={{
    padding: "16px",
    margin: "20px 0",
    borderRadius: "10px",
    background: "rgba(220, 50, 50, 0.12)",
    border: "1px solid #dc3232"
  }}>
    <strong>⚠️ Votre demande n'a pas été approuvée.</strong>
    <p>
      Votre profil artiste n'a pas été accepté.
      Veuillez contacter l'administration SOUND-B
      pour obtenir davantage d'informations.
    </p>
  </div>
)}
      {/* PROFIL ARTISTE */}

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

      {/* STATISTIQUES GÉNÉRALES */}

      <h2>Mes performances</h2>

      <div className="dashboard-grid">

        <div className="stat">
          <b>
            {Number(stats.total_plays || 0).toLocaleString("fr-FR")}
          </b>
          <span>Écoutes</span>
        </div>

        <div className="stat">
          <b>
            {Number(stats.total_downloads || 0).toLocaleString("fr-FR")}
          </b>
          <span>Téléchargements</span>
        </div>

        <div className="stat">
          <b>
            {Number(stats.published_tracks || 0).toLocaleString("fr-FR")}
          </b>
          <span>Titres publiés</span>
        </div>

      </div>

      {/* GRAPHIQUE DES ÉCOUTES */}

      <div className="form-card" style={{ marginTop: "25px" }}>

        <h2>📊 Évolution des écoutes</h2>

        <p className="muted">
          Activité des 7 derniers jours
        </p>

        {advanced.daily_plays.length > 0 ? (
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-around",
              gap: "10px",
              height: "190px",
              paddingTop: "20px"
            }}
          >
            {advanced.daily_plays.map((day, index) => {
              const value = Number(day.total || 0);
              const height = (value / maxPlays) * 130;

              return (
                <div
                  key={index}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    height: "100%",
                    gap: "7px"
                  }}
                >
                  <small>{value}</small>

                  <div
                    style={{
                      width: "100%",
                      maxWidth: "35px",
                      height: `${Math.max(height, 4)}px`,
                      background: "#ff8a32",
                      borderRadius: "6px 6px 0 0"
                    }}
                  />

                  <small className="muted">
                    {new Date(day.day + "T12:00:00").toLocaleDateString(
                      "fr-FR",
                      { day: "2-digit", month: "2-digit" }
                    )}
                  </small>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="muted">Aucune donnée disponible.</p>
        )}

      </div>

      {/* TOP 5 DES CHANSONS */}

      <div className="form-card" style={{ marginTop: "25px" }}>

        <h2>🏆 Mes titres les plus écoutés</h2>

        {advanced.top_tracks.length > 0 ? (
          <div>
            {advanced.top_tracks.map((track, index) => (
              <div
                key={track.track_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  padding: "14px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.1)"
                }}
              >
                <div>
                  <strong>
                    {index + 1}. {track.title}
                  </strong>

                  <p className="muted" style={{ margin: "5px 0 0" }}>
                    🎧 {Number(track.plays)} écoutes
                  </p>
                </div>

                <span>
                  ⬇️ {Number(track.downloads)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            Aucun titre publié pour le moment.
          </p>
        )}

      </div>

      {/* TÉLÉCHARGEMENTS RÉCENTS */}

      <div className="form-card" style={{ marginTop: "25px" }}>

        <h2>⬇️ Téléchargements récents</h2>

        {advanced.recent_downloads.length > 0 ? (
          <div>
            {advanced.recent_downloads.map((item, index) => (
              <div
                key={index}
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.1)"
                }}
              >
                <strong>{item.title}</strong>

                <p className="muted" style={{ margin: "5px 0 0" }}>
                  {new Date(item.downloaded_at).toLocaleString("fr-FR")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">
            Aucun téléchargement enregistré.
          </p>
        )}

      </div>

    </section>
  );
}
