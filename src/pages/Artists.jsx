import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function Artists() {
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadArtists();
  }, []);

  async function loadArtists() {
    if (!supabase) {
      setError("Connexion à la base de données impossible.");
      setLoading(false);
      return;
    }

    try {
      // Récupérer les titres approuvés
      const { data: tracks, error: tracksError } = await supabase
        .from("tracks")
        .select("artist_id")
        .eq("status", "approved");

      if (tracksError) throw tracksError;

      // Identifier les artistes ayant au moins un titre approuvé
      const artistIds = [
        ...new Set((tracks || []).map((track) => track.artist_id).filter(Boolean))
      ];

      if (artistIds.length === 0) {
        setArtists([]);
        setLoading(false);
        return;
      }

      // Récupérer uniquement les informations publiques
      const { data, error: artistsError } = await supabase
        .from("profiles")
        .select("id, artist_name, avatar_url, music_styles")
        .eq("role", "artist")
        .in("id", artistIds);

      if (artistsError) throw artistsError;

      setArtists(data || []);

    } catch (err) {
      setError(err.message || "Impossible de charger les artistes.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <p>Chargement des artistes...</p>;
  }

  return (
    <section>
      <p className="eyebrow">COMMUNAUTÉ SOUND-B</p>

      <h1>Nos artistes</h1>

      <p className="muted">
        Découvrez les artistes qui font vivre la musique sur SOUND-B.
      </p>

      {error && <p className="notice">{error}</p>}

      {artists.length > 0 ? (
        <div className="artists-grid">

          {artists.map((artist) => (
            <Link
              to={`/artiste/${artist.id}`}
              className="public-artist-card"
              key={artist.id}
            >
              <img
                src={
                  artist.avatar_url ||
                  "https://placehold.co/150x150/392416/ff8a32?text=SOUND-B"
                }
                alt={artist.artist_name || "Artiste SOUND-B"}
                className="public-artist-photo"
              />

              <h3>
                {artist.artist_name || "Artiste SOUND-B"}
              </h3>

              <p className="muted">
                {artist.music_styles?.length
                  ? artist.music_styles.join(" • ")
                  : "Style musical non renseigné"}
              </p>

              <span className="artist-view-link">
                Découvrir l'artiste →
              </span>
            </Link>
          ))}

        </div>
      ) : (
        <div className="notice">
          Aucun artiste approuvé pour le moment.
        </div>
      )}
    </section>
  );
}
