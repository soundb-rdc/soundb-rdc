import { Link } from "react-router-dom";
import { useAudioPlayer } from "../context/AudioPlayerContext";
import "./MiniPlayer.css";

function formatTime(time) {
  if (!Number.isFinite(time)) return "0:00";

  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export default function MiniPlayer() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    seekTo,
    closePlayer,
  } = useAudioPlayer();

  if (!currentTrack) return null;

  return (
    <div className="mini-player">
      <div className="mini-player-info">
        <img
          src={currentTrack.coverUrl || ""}
          alt="Pochette"
          className="mini-player-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />

        <div className="mini-player-text">
          <Link
            to={`/titre/${currentTrack.id}`}
            className="mini-player-title"
          >
            {currentTrack.title || "Titre sans nom"}
          </Link>

          <span className="mini-player-artist">
            {currentTrack.artistName || "Artiste SOUND-B"}
          </span>
        </div>
      </div>

      <div className="mini-player-controls">
        <button
          type="button"
          className="mini-player-play"
          onClick={togglePlay}
          aria-label={
            isPlaying ? "Mettre en pause" : "Reprendre la lecture"
          }
        >
          {isPlaying ? "Ⅱ" : "▶"}
        </button>
      </div>

      <div className="mini-player-progress">
        <span>{formatTime(currentTime)}</span>

        <input
          type="range"
          min="0"
          max={duration || 0}
          value={Math.min(currentTime, duration || 0)}
          onChange={(e) => seekTo(Number(e.target.value))}
          aria-label="Position de lecture"
          style={{
            "--progress": duration
              ? `${(currentTime / duration) * 100}%`
              : "0%",
          }}
        />

        <span>{formatTime(duration)}</span>
      </div>

      <button
        type="button"
        className="mini-player-close"
        onClick={closePlayer}
        aria-label="Fermer le lecteur"
      >
        ×
      </button>
    </div>
  );
}
