import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function UploadTrack() {
  const [productionYear, setProductionYear] = useState("2026");
  const [productionLabel, setProductionLabel] = useState("");
  const [releaseType, setReleaseType] = useState("single");
  const [releaseTitle, setReleaseTitle] = useState("");
  const [audioFiles, setAudioFiles] = useState([]);
  const [cover, setCover] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();

    if (!supabase) {
      setMessage("Supabase n'est pas configuré.");
      return;
    }

    if (audioFiles.length === 0) {
      setMessage("Sélectionne au moins un fichier audio.");
      return;
    }

    if (releaseType === "single" && audioFiles.length !== 1) {
      setMessage("Un single doit contenir une seule chanson.");
      return;
    }

    const invalidAudio = audioFiles.some(file => {
      const extension = file.name.split(".").pop().toLowerCase();
      return !["mp3", "wav", "ogg", "m4a", "aac", "flac"].includes(extension);
    });

    if (invalidAudio) {
      setMessage("Format audio non accepté. Utilise MP3, WAV, OGG, M4A, AAC ou FLAC.");
      return;
    }

    if (cover && !cover.type.startsWith("image/")) {
      setMessage("La couverture doit être une image.");
      return;
    }

    if (
      !productionYear ||
      Number(productionYear) < 1900 ||
      Number(productionYear) > new Date().getFullYear()
    ) {
      setMessage("Année de production invalide.");
      return;
    }

    if (!releaseTitle.trim()) {
      setMessage(
        releaseType === "album"
          ? "Indique le nom de l'album."
          : "Indique le titre du single."
      );
      return;
    }

    if (!productionLabel.trim()) {
      setMessage("Indique le label de production.");
      return;
    }

    setLoading(true);
    setMessage("Préparation de la publication...");

    const uploadedAudioPaths = [];
    let coverPath = null;
    let albumId = null;

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("Connecte-toi avant de publier.");
      }

      const user = authData.user;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.role !== "artist") {
        throw new Error("Seuls les artistes peuvent publier.");
      }

      // Créer la couverture
      if (cover) {
        const extension = cover.name.split(".").pop().toLowerCase();

        coverPath = `${user.id}/${Date.now()}_cover.${extension}`;

        const { error: coverError } = await supabase.storage
          .from("music-covers")
          .upload(coverPath, cover);

        if (coverError) throw coverError;
      }

      // Créer l'album ou le single
      const { data: album, error: albumError } = await supabase
        .from("albums")
        .insert({
          artist_id: user.id,
          title: releaseTitle.trim(),
          release_type: releaseType,
          cover_path: coverPath,
          production_year: Number(productionYear),
          production_label: productionLabel.trim(),
          status: "pending"
        })
        .select("id")
        .single();

      if (albumError) throw albumError;

      albumId = album.id;

      // Envoyer les fichiers audio
      const trackRows = [];

      for (let index = 0; index < audioFiles.length; index++) {
        const file = audioFiles[index];
        const extension = file.name.split(".").pop().toLowerCase();

        const audioPath =
          `${user.id}/${Date.now()}_${index}.${extension}`;

        setMessage(
          `Envoi du morceau ${index + 1}/${audioFiles.length}...`
        );

        const { error: uploadError } = await supabase.storage
          .from("music-files")
          .upload(audioPath, file);

        if (uploadError) throw uploadError;

        uploadedAudioPaths.push(audioPath);

        const trackTitle =
          releaseType === "single"
            ? releaseTitle.trim()
            : file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ").trim();

        trackRows.push({
          title: trackTitle,
          artist_id: user.id,
          album_id: albumId,
          track_number: index + 1,
          audio_path: audioPath,
          cover_path: coverPath,
          production_year: Number(productionYear),
          production_label: productionLabel.trim(),
          release_type: releaseType,
          album_title: releaseType === "album" ? releaseTitle.trim() : null,
          status: "pending"
        });
      }

      // Enregistrer tous les morceaux
      const { error: tracksError } = await supabase
        .from("tracks")
        .insert(trackRows);

      if (tracksError) throw tracksError;

      setMessage(
        releaseType === "album"
          ? `Album envoyé avec succès : ${audioFiles.length} morceau(x) en attente de validation.`
          : "Single envoyé avec succès ! En attente de validation."
      );

      setProductionYear("2026");
      setProductionLabel("");
      setReleaseType("single");
      setReleaseTitle("");
      setAudioFiles([]);
      setCover(null);

      e.target.reset();

    } catch (error) {
      // Nettoyer les fichiers en cas d'échec
      if (uploadedAudioPaths.length > 0) {
        await supabase.storage
          .from("music-files")
          .remove(uploadedAudioPaths);
      }

      if (coverPath) {
        await supabase.storage
          .from("music-covers")
          .remove([coverPath]);
      }

      if (albumId) {
        await supabase
          .from("albums")
          .delete()
          .eq("id", albumId);
      }

      setMessage("Erreur : " + error.message);

    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="form-card">
      <p className="eyebrow">DMP CREATOR PRODUCTION</p>

      <h1>Publier une musique</h1>

      <form onSubmit={submit}>

        <label>
          Type de publication

          <select
            value={releaseType}
            onChange={e => {
              setReleaseType(e.target.value);
              setAudioFiles([]);
              setReleaseTitle("");
            }}
          >
            <option value="single">Single</option>
            <option value="album">Album</option>
          </select>
        </label>

        <label>
          {releaseType === "album"
            ? "Nom de l'album"
            : "Titre du single"}

          <input
            required
            value={releaseTitle}
            onChange={e => setReleaseTitle(e.target.value)}
            placeholder={
              releaseType === "album"
                ? "Ex : Mon premier album"
                : "Ex : Légende"
            }
          />
        </label>

        <label>
          Année de production

          <input
            type="number"
            required
            min="1900"
            max={new Date().getFullYear()}
            value={productionYear}
            onChange={e => setProductionYear(e.target.value)}
          />
        </label>

        <label>
          Label de production

          <input
            required
            value={productionLabel}
            onChange={e => setProductionLabel(e.target.value)}
            placeholder="Ex : DMP Creator Production"
          />
        </label>

        <label>
          {releaseType === "album"
            ? "Fichiers audio des chansons"
            : "Fichier audio du single"}

          <input
            type="file"
            accept=".mp3,.wav,.ogg,.m4a,.aac,.flac"
            multiple={releaseType === "album"}
            required
            onChange={e => setAudioFiles(Array.from(e.target.files || []))}
          />
        </label>

        {audioFiles.length > 0 && (
          <div className="notice">
            <strong>{audioFiles.length} morceau(x) sélectionné(s)</strong>

            {audioFiles.map((file, index) => (
              <p key={`${file.name}-${index}`}>
                {index + 1}. {file.name}
              </p>
            ))}
          </div>
        )}

        <label>
          Couverture de la publication

          <input
            type="file"
            accept="image/*"
            onChange={e => setCover(e.target.files[0] || null)}
          />
        </label>

        <button className="btn primary" disabled={loading}>
          {loading
            ? "Publication en cours..."
            : "Soumettre pour validation"}
        </button>

      </form>

      {message && <p className="notice">{message}</p>}

      <p className="muted small">
        Les morceaux seront publiés uniquement après validation
        de l'ensemble de la publication par l'administration SOUND-B.
      </p>
    </section>
  );
}
