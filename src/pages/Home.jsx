import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import TrackCard from "../components/TrackCard";
import { loadApprovedTracks } from "../lib/loadApprovedTracks";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [tracks, setTracks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [featuredArtist, setFeaturedArtist] = useState(null);

  useEffect(() => {
    async function load() {
      const data = await loadApprovedTracks();
      setTracks(data);
      setLoading(false);
    }

    async function loadFeaturedArtist() {
      const { data: featured, error: featuredError } = await supabase
        .from("featured_artist")
        .select("artist_id")
        .eq("id", 1)
        .maybeSingle();

      if (featuredError || !featured?.artist_id) {
        setFeaturedArtist(null);
        return;
      }

      const { data: artist, error: artistError } = await supabase
        .from("profiles")
        .select("id, artist_name, avatar_url, music_styles")
        .eq("id", featured.artist_id)
        .eq("is_verified", true)
        .eq("is_suspended", false)
        .maybeSingle();

      if (!artistError && artist) {
        setFeaturedArtist(artist);
      }
    }

    load();
    loadFeaturedArtist();
  }, []);

  return (
    <>
      {/* SECTION D'ACCUEIL */}
      <section className="hero">
        <p className="eyebrow">LA MUSIQUE À PORTÉE DE CLIC</p>

        <h1>
          Découvre les sons<br />
          <span>qui te ressemblent.</span>
        </h1>

        <p>
          Écoute et découvre les artistes.
          Retrouve la musique que tu aimes sur SOUND-B.
        </p>

        <div className="actions">
          <Link className="btn primary" to="/recherche">
            Explorer la musique
          </Link>
        </div>
      </section>

      {/* ARTISTE À LA UNE */}
      {featuredArtist && (
        <section className="featured-artist">
          <div className="section-heading">
            <h2>⭐ ARTISTE À LA UNE</h2>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              flexWrap: "wrap",
              padding: "22px",
              borderRadius: "18px",
              background: "var(--card, #171717)",
              border: "1px solid rgba(255,255,255,0.12)"
            }}
          >
            <img
              src={featuredArtist.avatar_url || "/default-avatar.png"}
              alt={featuredArtist.artist_name}
              style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                objectFit: "cover"
              }}
            />

            <div style={{ flex: "1", minWidth: "180px" }}>
              <p className="eyebrow">À DÉCOUVRIR SUR SOUND-B</p>

              <h2 style={{ margin: "8px 0" }}>
                {featuredArtist.artist_name?.trim() || "Artiste SOUND-B"}
                <span
                  style={{
                    color: "#22c55e",
                    marginLeft: "8px",
                    fontSize: "16px"
                  }}
                >
                  ✓
                </span>
              </h2>

              <p className="muted">
                {Array.isArray(featuredArtist.music_styles)
                  ? featuredArtist.music_styles.join(" • ")
                  : "Artiste musical"}
              </p>

              <Link
                className="btn primary"
                to={`/artiste/${featuredArtist.id}`}
              >
                Découvrir l’artiste →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* TITRES À DÉCOUVRIR */}
      <section>
        <div className="section-heading">
          <h2>Titres à découvrir</h2>
          <Link to="/recherche">Tout voir →</Link>
        </div>

        {loading ? (
          <p className="muted">Chargement des musiques...</p>
        ) : tracks.length > 0 ? (
          <div className="track-list">
            {tracks.map(track => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        ) : (
          <p className="muted">
            Aucune musique disponible pour le moment.
          </p>
        )}
      </section>

      {/* ESPACE ARTISTE */}
      <section className="artist-callout">
        <h2>Tu fais de la musique ?</h2>

        <p>
          Crée ton espace artiste et soumets tes titres
          à l’équipe SOUND-B pour validation.
        </p>

        <Link className="btn primary" to="/inscription">
          Créer mon compte artiste
        </Link>
      </section>
    </>
  );
}
