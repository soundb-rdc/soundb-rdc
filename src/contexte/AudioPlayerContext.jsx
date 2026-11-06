import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";

const AudioPlayerContext = createContext(null);

export function AudioPlayerProvider({ children }) {
  const audioRef = useRef(null);

  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const playTrack = useCallback(
    async (track, audioUrl, coverUrl, artistName, onPlay) => {
      const audio = audioRef.current;

      if (!audio || !audioUrl) return;

      const sameTrack =
        currentTrack?.id === track.id &&
        audio.src === new URL(audioUrl, window.location.href).href;

      if (!sameTrack) {
        audio.src = audioUrl;

        setCurrentTrack({
          ...track,
          coverUrl,
          artistName,
        });

        setCurrentTime(0);
        setDuration(0);
      }

      try {
        await audio.play();
        setIsPlaying(true);

        if (typeof onPlay === "function") {
          onPlay();
        }
      } catch (error) {
        console.error("Erreur de lecture :", error);
        setIsPlaying(false);
      }
    },
    [currentTrack]
  );

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;

    if (!audio || !audio.src) return;

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error("Erreur de lecture :", error);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const seekTo = useCallback((value) => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.currentTime = value;
    setCurrentTime(value);
  }, []);

  const closePlayer = useCallback(() => {
    const audio = audioRef.current;

    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }

    setCurrentTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, []);

  useEffect(() => {
    const audio = audioRef.current;

    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime || 0);
    };

    const updateDuration = () => {
      setDuration(
        Number.isFinite(audio.duration) ? audio.duration : 0
      );
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", updateTime);
    audio.addEventListener("loadedmetadata", updateDuration);
    audio.addEventListener("durationchange", updateDuration);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateTime);
      audio.removeEventListener("loadedmetadata", updateDuration);
      audio.removeEventListener("durationchange", updateDuration);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        playTrack,
        togglePlay,
        seekTo,
        closePlayer,
      }}
    >
      {children}

      <audio
        ref={audioRef}
        preload="metadata"
        style={{ display: "none" }}
      />
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);

  if (!context) {
    throw new Error(
      "useAudioPlayer doit être utilisé dans AudioPlayerProvider"
    );
  }

  return context;
}
