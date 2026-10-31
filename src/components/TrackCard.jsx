import { Link } from "react-router-dom";

export default function TrackCard({ track }) {
  return (
    <article className="track-card">
      <Link to={`/titre/${track.id}`}>
        {track.cover_url ? (
          <img
            src={track.cover_url}
            alt={track.title}
            className="cover"
          />
        ) : (
          <div className="cover">
            {track.emoji || "♫"}
          </div>
        )}
      </Link>

      <div>
        <Link
          className="track-title"
          to={`/titre/${track.id}`}
        >
          {track.title}
        </Link>

        <Link
          className="muted"
          to={`/artiste/${track.artist_id || "profil"}`}
        >
          {track.artist || "Artiste SOUND-B"}
        </Link>
      </div>

      <span className="tag">
        {track.genre || "Musique"}
      </span>
    </article>
  );
}
