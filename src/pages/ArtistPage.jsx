import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import TrackCard from "../components/TrackCard";

function SocialIcon({ name }) {
  const paths = {
    facebook: "M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.413c0-3.026 1.792-4.7 4.533-4.7 1.312 0 2.686.235 2.686.235v2.953h-1.513c-1.49 0-1.953.93-1.953 1.884v2.287h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z",
    instagram: "M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7Zm0 2h10c1.66 0 3 1.34 3 3v10c0 1.66-1.34 3-3 3H7c-1.66 0-3-1.34-3-3V7c0-1.66 1.34-3 3-3Zm11.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z",
    tiktok: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.9 2.9 0 0 1-2.9 2.9 2.9 2.9 0 1 1 2.9-2.9V12.2a6.35 6.35 0 1 0 6.9 6.32V11.5a8.2 8.2 0 0 0 4.8 1.54V9.6a4.85 4.85 0 0 1-4.48-2.91Z",
    youtube: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z",
    spotify: "M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24Zm5.5 17.3a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.1-10.55-1.15a.75.75 0 1 1-.33-1.46c4.58-1.05 8.5-.6 11.66 1.33.35.21.46.68.25 1.03Zm1.47-3.28a.94.94 0 0 1-1.3.31c-3.23-1.98-8.15-2.55-11.97-1.4a.94.94 0 1 1-.54-1.8c4.36-1.32 9.78-.68 13.5 1.6.44.27.58.85.31 1.29Zm.13-3.42c-3.88-2.3-10.28-2.52-13.98-1.4a1.13 1.13 0 1 1-.66-2.16c4.25-1.29 11.3-1.04 15.76 1.61a1.13 1.13 0 0 1-1.12 1.95Z"
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d={paths[name]} />
    </svg>
  );
}

export default function ArtistPage() {
  const { id } = useParams();

  const [artist, setArtist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadArtist();
  }, [id]);

  async function loadArtist() {
    if (!supabase) {
      setError("Connexion à la base de données impossible.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { data: artistData, error: artistError } = await supabase
        .from("profiles")
        .select(`
          id,
          artist_name,
          avatar_url,
          music_styles,
          bio,
          whatsapp_number,
          city,
          facebook_url,
          instagram_url,
          tiktok_url,
          youtube_url,
          spotify_url
        `)
        .eq("id", id)
        .eq("role", "artist")
        .maybeSingle();

      if (artistError) throw artistError;

      if (!artistData) {
        setArtist(null);
        setTracks([]);
        return;
      }

      setArtist(artistData);

      const { data: trackData, error: trackError } = await supabase
        .from("tracks")
        .select("*")
        .eq("artist_id", id)
        .eq("status", "approved");

      if (trackError) throw trackError;

      const tracksWithCovers = await Promise.all(
        (trackData || []).map(async (track) => {
          let coverUrl = null;

          if (track.cover_path) {
            const { data: coverData, error: coverError } =
              await supabase.storage
                .from("music-covers")
                .createSignedUrl(track.cover_path, 3600);

            if (coverError) {
              console.error("Erreur de chargement de la pochette :", coverError);
            }

            coverUrl = coverData?.signedUrl || null;
          }

          const { data: stats, error: statsError } = await supabase.rpc(
            "get_track_stats",
            { p_track_id: track.id }
          );

          if (statsError) {
            console.error("Erreur statistiques :", statsError);
          }

          const trackStats = stats?.[0] || {};

          return {
            ...track,
            cover_url: coverUrl,
            artist: artistData.artist_name || "Artiste SOUND-B",
            play_count: Number(trackStats.play_count || 0),
            download_count: Number(trackStats.download_count || 0)
          };
        })
      );

      setTracks(tracksWithCovers);
    } catch (err) {
      setError(err.message || "Impossible de charger cet artiste.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p>Chargement du profil artiste...</p>;
  }

  if (error) {
    return <div className="notice">{error}</div>;
  }

  if (!artist) {
    return (
      <section className="center">
        <h1>Artiste introuvable</h1>
        <Link className="btn primary" to="/artistes">
          Voir les artistes
        </Link>
      </section>
    );
  }

  return (
    <section>
      <div className="public-artist-header">
        <img
          src={
            artist.avatar_url ||
            "https://placehold.co/150x150/392416/ff8a32?text=SOUND-B"
          }
          alt={artist.artist_name}
          className="public-artist-photo large"
        />

        <div>
          <p className="eyebrow">ARTISTE SOUND-B
