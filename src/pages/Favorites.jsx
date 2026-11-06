import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useFavorites } from "../context/FavoritesContext";
import TrackCard from "../components/TrackCard";

export default function Favorites() {
  const { favoriteIds } = useFavorites();

  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadFavorites() {
      if (!favoriteIds.length) {
        setTracks([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .in("id", favoriteIds)
        .eq("status", "approved");

      if (!active) return;

      if (error) {
        setError("Impossible de charger vos favoris.");
        console.error(error);
      } else {
        const orderedTracks = favoriteIds
          .map((id) =>
            data.find((track) => String(track.id) === String(id))
          )
          .filter(Boolean);

        setTracks(orderedTracks);
      }

      setLoading(false);
    }

    loadFavorites();

    return () => {
      active = false;
    };
  }, [favoriteIds]);

  return (
    <section className="page">
      <p className="eyebrow">VOTRE SÉLECTION MUSICALE</p>

      <h1>❤️ Mes favoris</h1>

      <p className="muted">
        Retrouvez ici toutes les chansons que vous aimez.
      </p>

      {loading && (
        <p className="muted">Chargement de vos favoris...</p>
      )}

      {error && (
        <p className="muted">{error}</p>
      )}

      {!loading && !error && tracks.length === 0 && (
        <div className="detail-card">
          <h3>Aucun favori pour le moment</h3>

          <p className="muted">
            Ajoutez vos morceaux préférés pour les retrouver
            facilement ici.
          </p>

          <Link to="/" className="btn primary">
            Découvrir les chansons
          </Link>
        </div>
      )}

      {!loading && tracks.length > 0 && (
        <>
          <p className="muted">
            {tracks.length} morceau(x) enregistré(s)
          </p>

          <div className="track-grid">
            {tracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
