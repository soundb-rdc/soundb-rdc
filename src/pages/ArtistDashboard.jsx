import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

const MUSIC_STYLES = [
  "Rumba congolaise",
  "Afrobeat",
  "Gospel",
  "Rap",
  "Hip-hop",
  "R&B",
  "Ndombolo",
  "Afropop",
  "Reggae",
  "Jazz",
  "Soul",
  "Autre",
];

export default function ArtistDashboard() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [styles, setStyles] = useState([]);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    if (!supabase) return;

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

    if (error) {
      setMessage(error.message);
    } else if (data) {
      setProfile(data);
      setName(
        data.artist_name ||
        auth.user.user_metadata?.full_name ||
        ""
      );
      setBio(data.bio || "");
      setStyles(data.music_styles || []);
    }

    setLoading(false);
  }

  function toggleStyle(style) {
    setStyles((current) =>
      current.includes(style)
        ? current.filter((item) => item !== style)
        : [...current, style]
    );
  }

  async function saveProfile(e) {
    e.preventDefault();

    if (!supabase || !user) return;

    setSaving(true);
    setMessage("");

    try {
      let avatarUrl = profile?.avatar_url || null;

      if (photo) {
        const extension = photo.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from("artist-avatars")
          .upload(filePath, photo, {
            upsert: true,
            contentType: photo.type,
          });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from("artist-avatars")
          .getPublicUrl(filePath);

        avatarUrl = data.publicUrl;
      }

      const { data, error } = await supabase
        .from("profiles")
        .update({
          artist_name: name,
          bio,
          music_styles: styles,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      setPhoto(null);
      setMessage("Votre profil a été mis à jour avec succès.");
    } catch (error) {
      setMessage(error.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
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
          <h2>{profile?.artist_name || name || "Artiste SOUND-B"}</h2>
          <p className="muted">{user.email}</p>

          {profile?.music_styles?.length > 0 && (
            <p className="muted">
              {profile.music_styles.join(" • ")}
            </p>
          )}
        </div>
      </div>

      <div className="artist-callout">
        <h2>Mon profil artistique</h2>
        <p className="muted">
          Présentez votre identité musicale à votre public.
        </p>

        <form onSubmit={saveProfile}>
          <label>
            Nom d'artiste
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
            />
          </label>

          <label>
            Photo de profil
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setPhoto(e.target.files[0] || null)}
            />
          </label>

          <label>
            Description / Biographie
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows="5"
              maxLength={1000}
              placeholder="Présentez votre parcours et votre musique..."
            />
          </label>

          <p><strong>Styles musicaux (plusieurs choix possibles)</strong></p>

          <div className="music-style-list">
            {MUSIC_STYLES.map((style) => (
              <label key={style} className="music-style-option">
                <input
                  type="checkbox"
                  checked={styles.includes(style)}
                  onChange={() => toggleStyle(style)}
                />
                {style}
              </label>
            ))}
          </div>

          <button className="btn primary" disabled={saving}>
            {saving ? "Enregistrement..." : "Enregistrer mon profil"}
          </button>
        </form>

        {message && <p className="notice">{message}</p>}
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

      <Link className="btn primary" to="/artiste/ajouter-musique">
        + Ajouter une musique
      </Link>
    </section>
  );
}
