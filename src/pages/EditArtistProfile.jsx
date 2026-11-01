import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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

export default function EditArtistProfile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
const [city, setCity] = useState("");
const [facebook, setFacebook] = useState("");
const [instagram, setInstagram] = useState("");
const [tiktok, setTiktok] = useState("");
const [youtube, setYoutube] = useState("");
const [spotify, setSpotify] = useState("");
  const [styles, setStyles] = useState([]);
  const [photo, setPhoto] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    if (!supabase) {
      setMessage("Connexion à la base de données impossible.");
      setLoading(false);
      return;
    }

    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      navigate("/connexion");
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

setWhatsapp(data.whatsapp_number || "");
setCity(data.city || "");
setFacebook(data.facebook_url || "");
setInstagram(data.instagram_url || "");
setTiktok(data.tiktok_url || "");
setYoutube(data.youtube_url || "");
setSpotify(data.spotify_url || "");
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
        const extension = photo.name.split(".").pop().toLowerCase();

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
  bio: bio,
  music_styles: styles,
  avatar_url: avatarUrl,

  whatsapp_number: whatsapp.trim(),
  city: city.trim(),
  facebook_url: facebook.trim(),
  instagram_url: instagram.trim(),
  tiktok_url: tiktok.trim(),
  youtube_url: youtube.trim(),
  spotify_url: spotify.trim(),
})
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;

      setProfile(data);
      setPhoto(null);

      setMessage("Profil mis à jour avec succès !");

    } catch (error) {
      setMessage(
        error.message || "Erreur lors de la modification du profil."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p>Chargement du profil...</p>;
  }

  return (
    <section>
      <p className="eyebrow">ESPACE ARTISTE</p>

      <h1>Modifier mon profil</h1>

      <p className="muted">
        Personnalisez votre identité artistique sur SOUND-B.
      </p>

      <div className="artist-callout">

        <form onSubmit={saveProfile}>

          <label>
            Nom d'artiste

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Votre nom d'artiste"
              maxLength={80}
              required
            />
          </label>

          <label>
            Photo de profil

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const selected = e.target.files[0];

                if (selected && selected.size > 5 * 1024 * 1024) {
                  setMessage("La photo ne doit pas dépasser 5 Mo.");
                  e.target.value = "";
                  setPhoto(null);
                  return;
                }

                setMessage("");
                setPhoto(selected || null);
              }}
            />
          </label>

          <div className="artist-profile">
            <img
              className="artist-profile-photo"
              src={
                photo
                  ? URL.createObjectURL(photo)
                  : profile?.avatar_url ||
                    "https://placehold.co/150x150/392416/ff8a32?text=SOUND-B"
              }
              alt="Aperçu du profil"
            />

            <span className="muted">
              Aperçu de votre photo de profil
            </span>
          </div>

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
<div className="artist-contact-fields">

  <h2>Informations supplémentaires</h2>

  <label>
    Numéro WhatsApp
    <input
      type="tel"
      value={whatsapp}
      onChange={(e) => setWhatsapp(e.target.value)}
      placeholder="+243 82 000 00 00"
    />
  </label>

  <label>
    Ville de résidence
    <input
      type="text"
      value={city}
      onChange={(e) => setCity(e.target.value)}
      placeholder="Ex : Bandundu, Kinshasa..."
    />
  </label>

  <h3>Mes réseaux sociaux</h3>
  <p className="muted">Tous ces champs sont facultatifs.</p>

  <label>
    Facebook
    <input
      type="url"
      value={facebook}
      onChange={(e) => setFacebook(e.target.value)}
      placeholder="https://facebook.com/..."
    />
  </label>

  <label>
    Instagram
    <input
      type="url"
      value={instagram}
      onChange={(e) => setInstagram(e.target.value)}
      placeholder="https://instagram.com/..."
    />
  </label>

  <label>
    TikTok
    <input
      type="url"
      value={tiktok}
      onChange={(e) => setTiktok(e.target.value)}
      placeholder="https://tiktok.com/@..."
    />
  </label>

  <label>
    YouTube
    <input
      type="url"
      value={youtube}
      onChange={(e) => setYoutube(e.target.value)}
      placeholder="https://youtube.com/..."
    />
  </label>

  <label>
    Spotify
    <input
      type="url"
      value={spotify}
      onChange={(e) => setSpotify(e.target.value)}
      placeholder="https://open.spotify.com/..."
    />
  </label>

</div>
          <p>
            <strong>Styles musicaux</strong>
          </p>

          <p className="muted">
            Vous pouvez sélectionner plusieurs styles.
          </p>

          <div className="music-style-list">
            {MUSIC_STYLES.map((style) => (
              <label
                key={style}
                className="music-style-option"
              >
                <input
                  type="checkbox"
                  checked={styles.includes(style)}
                  onChange={() => toggleStyle(style)}
                />

                {style}
              </label>
            ))}
          </div>

          <button
            className="btn primary"
            type="submit"
            disabled={saving}
          >
            {saving
              ? "Enregistrement..."
              : "Enregistrer les modifications"}
          </button>

        </form>

        {message && (
          <p className="notice">{message}</p>
        )}

        <br />

        <Link
          className="btn secondary"
          to="/artiste/tableau-de-bord"
        >
          ← Retour au tableau de bord
        </Link>

      </div>
    </section>
  );
}
