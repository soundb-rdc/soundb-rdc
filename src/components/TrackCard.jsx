import { Link } from "react-router-dom";

export default function TrackCard({ track }) {
  return (
    <article className="track-card">
      <Link to={`/titre/${track.id}`} className="track-cover-link">
        {track.cover_url ? (
          <img
            src={track.cover_url}
            alt={track.title}
            className="track-cover-image"
          />
        ) : (
          <div className="track-cover-placeholder">
            {track.emoji || "♫"}
          </div>
        )}
      </Link>

      <div className="track-card-info">
        <Link
          className="track-title"
          to={`/titre/${track.id}`}
        >
          {track.title}
        </Link>

        <Link
          className="track-artist"
          to={`/artiste/${track.artist_id || "profil"}`}
        >
          {track.artist || "Artiste SOUND-B"}
        </Link>
      </div>
    </article>
  );
}
