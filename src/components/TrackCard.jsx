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
<div className="track-statistics">
  <span className="track-stat-item">
    <span className="stat-icon">▶</span>
    <strong>
      {Number(track.play_count || 0).toLocaleString("fr-FR")}
    </strong>
    <small>Lectures</small>
  </span>

  <span className="track-stat-item">
    <span className="stat-icon">↓</span>
    <strong>
      {Number(track.download_count || 0).toLocaleString("fr-FR")}
    </strong>
    <small>Téléchargements</small>
  </span>
</div>
      </div>
    </article>
  );
}
