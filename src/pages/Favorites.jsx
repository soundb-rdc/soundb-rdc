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
      if (!favoriteIds || favoriteIds.length === 0) {
        setTracks([]);
        setError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const { data: rows, error: tracksError } =
          await supabase
            .from("tracks")
            .select("*")
            .in("id", favoriteIds)
            .eq("status", "approved");

        if (tracksError) throw tracksError;

        if (!rows || rows.length === 0) {
          if (active) setTracks([]);
          return;
        }

        const artistIds = [
          ...new Set(
            rows.map(t => t.artist_id).filter(Boolean)
          ),
        ];

        let artists = [];

        if (artistIds.length > 0) {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, artist_name")
            .in("id", artistIds);

          if (!error) {
            artists = data || [];
          }
        }

        const enrichedTracks = await Promise.all(
          rows.map(async track => {
            const artist = artists.find(
              a => String(a.id) === String(track.artist_id)
            );

            let coverUrl = null;

            if (track.cover_path) {
              const { data, error } = await supabase.storage
                .from("music-covers")
                .createSignedUrl(track.cover_path, 3600);

              if (!error) {
                coverUrl = data?.signedUrl || null;
              }
            }

            let playCount = 0;
            let downloadCount = 0;

            const { data: stats, error: statsError } =
              await supabase.rpc(
                "get_track_stats",
                { p_track_id: track.id }
              );

            if (!statsError) {
              const result = Array.isArray(stats)
                ? stats[0]
                : stats;

              playCount = Number(result?.play_count || 0);
              downloadCount = Number(
                result?.download_count || 0
              );
            } else {
              console.error(statsError);
            }

            return {
              ...track,
              artist:
                artist?.artist_name || "Artiste SOUND-B",
              cover_url: coverUrl,
              play_count: playCount,
              download_count: downloadCount,
              emoji: "♫",
            };
          })
        );

        const orderedTracks = favoriteIds
          .map(id =>
            enrichedTracks.find(
              track => String(track.id) === String(id)
            )
          )
          .filter(Boolean);

        if (active) {
          setTracks(orderedTracks);
        }

      } catch (err) {
        console.error(err);

        if (active) {
          setError("Impossible de charger vos favoris.");
        }

      } finally {
        if (active) setLoading(false);
      }
    }

    loadFavorites();

    return () => {
      active = false;
    };

  }, [favoriteIds]);

  return (
    <section className="page">

      <p className="eyebrow">
        VOTRE SÉLECTION MUSICALE
      </p>

      <h1>❤️ Mes favoris</h1>

      <p className="muted">
        Retrouvez ici toutes les chansons que vous aimez.
      </p>

      {loading && (
        <p className="muted">
          Chargement de vos favoris...
        </p>
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

      {!loading && !error && tracks.length > 0 && (
        <>
          <p className="muted">
            {tracks.length} morceau(x) enregistré(s)
          </p>

          <div className="track-grid">

            {tracks.map(track => (
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
