import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

function cleanFileName(value) {
  return String(value || "")
    .trim()
    .replace(/[\\/:*?"<>|]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_");
}
export default function TrackPage() {
  const { id } = useParams();

  const [track, setTrack] = useState(null);
  const [artist, setArtist] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function recordEvent(eventType, trackId) {
    try {
      const { data: auth } = await supabase.auth.getUser();

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
async function downloadTrack() {
  try {
    if (!audioUrl) {
      throw new Error("Fichier audio indisponible.");
    }

    if (!coverUrl) {
      throw new Error("Cette chanson ne possède pas de couverture.");
    }

    const { ID3Writer } = await import(
      /* @vite-ignore */
      "https://esm.sh/browser-id3-writer@6.4.0"
    );

    const audioResponse = await fetch(audioUrl);

    if (!audioResponse.ok) {
      throw new Error("Impossible de récupérer la chanson.");
    }

    const audioBuffer = await audioResponse.arrayBuffer();

    const coverResponse = await fetch(coverUrl);

    if (!coverResponse.ok) {
      throw new Error("Impossible de récupérer la couverture.");
    }

    const coverBlob = await coverResponse.blob();

const imageBitmap = await createImageBitmap(coverBlob);

const canvas = document.createElement("canvas");
canvas.width = imageBitmap.width;
canvas.height = imageBitmap.height;

const context = canvas.getContext("2d");

context.drawImage(imageBitmap, 0, 0);

imageBitmap.close();

const jpegBlob = await new Promise((resolve, reject) => {
  canvas.toBlob((blob) => {
    if (blob) {
      resolve(blob);
    } else {
      reject(new Error("Conversion de la couverture impossible."));
    }
  }, "image/jpeg", 0.90);
});

const coverBuffer = await jpegBlob.arrayBuffer();

    const title = cleanFileName(track.title);
    const artistName = cleanFileName(
      artist?.artist_name || "Artiste_SOUND_B"
    );

    const year = track.production_year || new Date().getFullYear();

    const extension = track.audio_path.split(".").pop().toLowerCase();

    if (extension !== "mp3") {
      throw new Error("Cette fonctionnalité est réservée aux fichiers MP3.");
    }

    const writer = new ID3Writer(audioBuffer);

    writer
      .setFrame("TIT2", track.title)
      .setFrame("TPE1", [artistName])
      .setFrame("TYER", Number(year));

    if (track.production_label) {
      writer.setFrame("TPUB", track.production_label);
    }

    if (track.album_title) {
      writer.setFrame("TALB", track.album_title);
    }

    writer.setFrame("APIC", {
      type: 3,
      data: coverBuffer,
      description: "Pochette officielle SOUND-B"
    });

    writer.addTag();

    const blob = writer.getBlob();
    const fileUrl = URL.createObjectURL(blob);

    const fileName =
      `${title}_${artistName}_Audio_Officiel_${year}.mp3`;

    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(fileUrl), 2000);

    recordEvent("download", track.id);

  } catch (err) {
    console.error("Erreur de téléchargement SOUND-B :", err);
    alert("Téléchargement impossible : " + err.message);
  }
}
  useEffect(() => {
    let active = true;

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

  if (loading) {
    return <p className="muted">Chargement du titre...</p>;
  }

  if (error) {
    return (
      <section className="page">
        <h1>Titre indisponible</h1>
        <p className="muted">{error}</p>
        <Link className="btn secondary" to="/">
          Retour au catalogue
        </Link>
      </section>
    );
  }

  if (!track) {
    return <p className="muted">Titre introuvable.</p>;
  }

  return (
    <section className="page">
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
<div className="detail-card track-production">
  <p className="eyebrow">INFORMATIONS DE PRODUCTION</p>

  <div className="production-info">
    <div>
      <span>Année de production</span>
      <strong>{track.production_year || "Non renseignée"}</strong>
    </div>

    <div>
      <span>Label de production</span>
      <strong>{track.production_label || "Indépendant"}</strong>
    </div>

    <div>
      <span>Format de sortie</span>
      <strong>
        {track.release_type === "album" ? "Album" : "Single"}
      </strong>
    </div>

    {track.release_type === "album" && track.album_title && (
      <div>
        <span>Nom de l'album</span>
        <strong>{track.album_title}</strong>
      </div>
    )}
  </div>
</div>
      <button
  type="button"
  className="btn primary"
  onClick={downloadTrack}
>
  Télécharger la chanson
</button>
      

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
