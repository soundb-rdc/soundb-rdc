import { useEffect, useState } from "react";

export default function InstallButton() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstalled(true);
    }
    const onPrompt = (e) => {
      e.preventDefault();
      setPromptEvent(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  const handleClick = async () => {
    if (promptEvent) {
      promptEvent.prompt();
      await promptEvent.userChoice;
      setPromptEvent(null);
    } else {
      setShowHelp(true);
    }
  };

  return (
    <div style={{ textAlign: "center", margin: "12px 0" }}>
      <button
        onClick={handleClick}
        style={{
          background: "#1db954",
          color: "#fff",
          border: "none",
          borderRadius: 24,
          padding: "10px 22px",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        📲 Installer l'application
      </button>
      {showHelp && (
        <p style={{ fontSize: 13, marginTop: 8, opacity: 0.8 }}>
          Ouvre le menu de ton navigateur (⋮ ou Partager), puis choisis
          « Installer l'application » ou « Sur l'écran d'accueil ».
        </p>
      )}
    </div>
  );
}
