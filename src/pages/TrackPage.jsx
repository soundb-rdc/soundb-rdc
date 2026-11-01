import { useEffect, useState } from "react"; import { useParams, Link } from "react-router-dom"; import { supabase } from "../lib/supabase";
export default function TrackPage() { const { id } = useParams();
const [track, setTrack] = useState(null); const [artist, setArtist] = useState(null); const [audioUrl, setAudioUrl] = useState(""); const [coverUrl, setCoverUrl] = useState(""); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
async function recordEvent(eventType, trackId) { try { const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("track_events")
    .insert({
      track_id: trackId,
      event_type: eventType,
      user_id: auth.user?.id || null
    });

  if (error) {
    console.error("Erreur statistiques SOUND-B :", error);
  }
} catch (err) {
  console.error("Impossible d'enregistrer l'événement :", err);
}
}
useEffect(() => { let active = true;
async function loadTrack() {
  try {
    setLoading(true);
    setError("");

    const { data, error: trackError } = await supabase
      .from("tracks")
      .select("*")
      .eq("id", id)
      .eq("status", "approved")
      .single();

    if (trackError) throw trackError;

    if (!data.audio_path) {
      throw new Error("Aucun fichier audio associé à ce morceau.");
    }

    if (active) setTrack(data);

    const { data: audioData, error: audioError } =
      await supabase.storage
        .from("music-files")
        .createSignedUrl(data.audio_path, 3600);

    if (audioError) {
      throw new Error("Erreur de lecture audio : " + audioError.message);
    }

    if (active) setAudioUrl(audioData.signedUrl);

    if (data.cover_path) {
      const { data: coverData, error: coverError } =
        await supabase.storage
          .from("music-covers")
          .createSignedUrl(data.cover_path, 3600);

      if (!coverError && active) {
        setCoverUrl(coverData.signedUrl);
      }
    }

    const { data: artistData } = await supabase
      .from("profiles")
      .select("artist_name, avatar_url")
      .eq("id", data.artist_id)
      .maybeSingle();

    if (active) setArtist(artistData);

  } catch (err) {
    console.error("Erreur SOUND-B :", err);

    if (active) {
      setError(err.message);
    }
  } finally {
    if (active) setLoading(false);
  }
}

if (supabase) {
  loadTrack();
} else {
  setError("Connexion à Supabase impossible.");
  setLoading(false);
}

return () => {
  active = false;
};
}, [id]);
if (loading) return Chargement du titre...;
if (error) { return (  Titre indisponible {error}  Retour au catalogue   ); }
if (!track) return Titre introuvable.;
return ( 
  {coverUrl ? (
    <img
      src={coverUrl}
      alt={track.title}
      className="cover big"
    />
  ) : (
    <div className="cover big">♫</div>
  )}

  <p className="eyebrow">LECTURE SOUND-B</p>

  <h1>{track.title}</h1>

  <p className="muted">
    {artist?.artist_name || "Artiste SOUND-B"}
  </p>

  <audio
    controls
    className="audio"
    src={audioUrl}
    preload="metadata"
    onPlay={() => recordEvent("play", track.id)}
  >
    Ton navigateur ne prend pas en charge la lecture audio.
  </audio>

  <a
    href={audioUrl}
    download={`${track.title}.mp3`}
    className="btn primary"
    onClick={() => recordEvent("download", track.id)}
  >
    Télécharger la chanson
  </a>

  <br />

  <Link
    className="btn secondary"
    to={`/artiste/${track.artist_id}`}
  >
    Voir le profil artiste
  </Link>

</section>
); }
