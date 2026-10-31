import { useEffect, useMemo, useState } from "react";
import TrackCard from "../components/TrackCard";
import { loadApprovedTracks } from "../lib/loadApprovedTracks";

export default function Search() {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await loadApprovedTracks();
      setTracks(data);
      setLoading(false);
    }

    load();
  }, []);

  const results = useMemo(() => {
    return tracks.filter(track =>
      (
        track.title + " " +
        track.artist + " " +
        track.genre
      )
        .toLowerCase()
        .includes(query.toLowerCase())
    );
  }, [tracks, query]);

  return (
    <section>
      <p className="eyebrow">CATALOGUE</p>

      <h1>Découvrir la musique</h1>

      <input
        className="search-input"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Rechercher un titre, un artiste ou un genre..."
      />

      {loading ? (
        <p className="muted">Chargement du catalogue...</p>
      ) : (
        <>
          <div className="track-list">
            {results.map(track => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>

          {!results.length && (
            <p className="muted">
              Aucun résultat pour cette recherche.
            </p>
          )}
        </>
      )}
    </section>
  );
}
