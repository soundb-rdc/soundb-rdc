import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import TrackCard from "../components/TrackCard";

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

      const { data: trackData, error: trackError } = await supabase
        .from("tracks")
        .select("*")
        .eq("artist_id", id)
        .eq("status", "approved");

      if (trackError) throw trackError;

      setArtist(artistData);

      setTracks(
        (trackData || []).map((track) => ({
          ...track,
          artist: artistData.artist_name || "Artiste SOUND-B",
        }))
      );

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
          <p className="eyebrow">ARTISTE SOUND-B</p>

          <h1>{artist.artist_name || "Artiste SOUND-B"}</h1>

          <p className="muted">
            {artist.music_styles?.length
              ? artist.music_styles.join(" • ")
              : "Style musical non renseigné"}
          </p>
        </div>

      </div>
            {/* INFORMATIONS ET CONTACT DE L'ARTISTE */}
      <div className="artist-extra-info">

        {artist.bio && (
          <div>
            <h2>À propos de l'artiste</h2>
            <p>{artist.bio}</p>
          </div>
        )}

        {artist.city && (
          <p>📍 Ville de résidence : {artist.city}</p>
        )}

        {artist.whatsapp_number && (
          <p>
            <a
              href={`https://wa.me/${artist.whatsapp_number.replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              💬 Contacter sur WhatsApp
            </a>
          </p>
        )}

        {(artist.facebook_url ||
          artist.instagram_url ||
          artist.tiktok_url ||
          artist.youtube_url ||
          artist.spotify_url) && (

          <div>
            <h2>Réseaux sociaux</h2>

            <div className="artist-social-links">

              {artist.facebook_url && (
                <a href={artist.facebook_url} target="_blank" rel="noopener noreferrer">
                  Facebook
                </a>
              )}

              {artist.instagram_url && (
                <a href={artist.instagram_url} target="_blank" rel="noopener noreferrer">
                  Instagram
                </a>
              )}

              {artist.tiktok_url && (
                <a href={artist.tiktok_url} target="_blank" rel="noopener noreferrer">
                  TikTok
                </a>
              )}

              {artist.youtube_url && (
                <a href={artist.youtube_url} target="_blank" rel="noopener noreferrer">
                  YouTube
                </a>
              )}

              {artist.spotify_url && (
                <a href={artist.spotify_url} target="_blank" rel="noopener noreferrer">
                  Spotify
                </a>
              )}

            </div>
          </div>
        )}

      </div>

      <div className="section-heading">
        <h2>Ses chansons</h2>
        <span className="muted">{tracks.length} titre(s)</span>
      </div>

      <div className="track-list">
        {tracks.map((track) => (
          <TrackCard key={track.id} track={track} />
        ))}
      </div>

      {tracks.length === 0 && (
        <p className="muted">
          Cet artiste n'a pas encore de chanson approuvée.
        </p>
      )}

      <Link className="btn secondary" to="/artistes">
        ← Retour aux artistes
      </Link>
    </section>
  );
}
