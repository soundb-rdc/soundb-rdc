import { useEffect, useState } from "react";
import TrackCard from "../components/TrackCard";
import { loadApprovedTracks } from "../lib/loadApprovedTracks";

export default function Nouveautes() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await loadApprovedTracks();

      const latestTracks = [...data]
        .filter(track => track.published_at)
        .sort(
          (a, b) =>
            new Date(b.published_at) - new Date(a.published_at)
        )
        .slice(0, 8);

      setTracks(latestTracks);
      setLoading(false);
    }

    load();
  }, []);

  return (
    <>
      <section>
        <p className="eyebrow">LES DERNIÈRES SORTIES</p>

        <h1>🆕 Nouveautés SOUND-B</h1>

        <p className="muted">
          Découvre les dernières chansons publiées
          par les artistes sur SOUND-B.
        </p>
      </section>

      <section>
        {loading ? (
          <p className="muted">
            Chargement des nouveautés...
          </p>
        ) : tracks.length > 0 ? (
          <div className="track-list">
            {tracks.map(track => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        ) : (
          <p className="muted">
            Aucune nouveauté disponible pour le moment.
          </p>
        )}
      </section>
    </>
  );
}
