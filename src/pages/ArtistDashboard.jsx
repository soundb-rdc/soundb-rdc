import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function ArtistDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    if (!supabase) {
      setLoading(false);
      return;
    }

    const { data: auth } = await supabase.auth.getUser();

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

    if (!error) {
      setProfile(data);
    }

    setLoading(false);
  }

  if (loading) {
    return <p>Chargement de votre espace artiste...</p>;
  }

  if (!user) {
    return (
      <div className="notice">
        Connectez-vous pour accéder à votre espace artiste.
        <Link to="/connexion"> Se connecter</Link>
      </div>
    );
  }

  return (
    <section>
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
          <h2>
            {profile?.artist_name || "Artiste SOUND-B"}
          </h2>

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
          <b>—</b>
          <span>Écoutes</span>
        </div>

        <div className="stat">
          <b>—</b>
          <span>Téléchargements</span>
        </div>

        <div className="stat">
          <b>—</b>
          <span>Titres publiés</span>
        </div>
      </div>
    </section>
  );
}
