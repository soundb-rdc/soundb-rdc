import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function TrackPage() {
  const { id } = useParams();

  const [track, setTrack] = useState(null);
  const [artist, setArtist] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadTrack() {
      if (!supabase) {
        setError("Connexion à Supabase impossible.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: trackError } = await supabase
          .from("tracks")
          .select("*")
          .eq("id", id)
          .eq("status", "approved")
          .single();

        if (trackError) throw trackError;

        const { data: audioData, error: audioError } =
          await supabase.storage
            .from("music-files")
            .createSignedUrl(data.audio_path, 3600);

        if (audioError) throw audioError;

        let imageUrl = "";

        if (data.cover_path) {
          const { data: coverData, error: coverError } =
            await supabase.storage
              .from("music-covers")
              .createSignedUrl(data.cover_path, 3600);

          if (coverError) throw coverError;

          imageUrl = coverData.signedUrl;
        }

        const { data: artistData } = await supabase
          .from("profiles")
          .select("artist_name, avatar_url")
          .eq("id", data.artist_id)
          .maybeSingle();

        if (!active) return;

        setTrack(data);
        setArtist(artistData);
        setAudioUrl(audioData.signedUrl);
        setCoverUrl(imageUrl);

      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadTrack();

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <p>Chargement du titre...</p>;

  if (error || !track) {
    return (
      <section className="form-card">
        <h2>Titre indisponible</h2>
        <p className="notice">
          {error || "Ce titre est introuvable ou n'est pas encore approuvé."}
        </p>
        <Link className="btn secondary" to="/recherche">
          Retour au catalogue
        </Link>
      </section>
    );
  }

  return (
    <section className="detail-card">
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
      >
        Ton navigateur ne prend pas en charge la lecture audio.
      </audio>

      <a
        href={audioUrl}
        download={`${track.title}.mp3`}
        className="btn primary"
        target="_blank"
        rel="noreferrer"
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
  );
}
