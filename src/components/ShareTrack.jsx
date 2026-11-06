import { useState } from "react";

export default function ShareTrack({ track, artist }) {
  const [copied, setCopied] = useState(false);

  const trackUrl =
    `${window.location.origin}/titre/${track.id}`;

  const artistName =
    artist?.artist_name || "Artiste SOUND-B";

  const message =
    `🎵 Écoute « ${track.title} » de ${artistName} sur SOUND-B : ${trackUrl}`;

  const whatsappUrl =
    `https://wa.me/?text=${encodeURIComponent(message)}`;

  const facebookUrl =
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(trackUrl)}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(trackUrl);
      setCopied(true);

      setTimeout(() => setCopied(false), 2200);
    } catch {
      window.prompt("Copiez le lien :", trackUrl);
    }
  }

  return (
    <div style={{ margin: "22px 0", width: "100%" }}>
      <p className="eyebrow">
        PARTAGER CE MORCEAU
      </p>

      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 10
      }}>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn secondary"
          style={{ textDecoration: "none" }}
        >
          ☘ WhatsApp
        </a>

        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn secondary"
          style={{ textDecoration: "none" }}
        >
          f Facebook
        </a>

        <button
          type="button"
          className="btn secondary"
          onClick={copyLink}
        >
          {copied ? "✓ Lien copié" : "🔗 Copier le lien"}
        </button>
      </div>
    </div>
  );
          }
