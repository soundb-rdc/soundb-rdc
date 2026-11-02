import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function UploadTrack() {
  const [title, setTitle] = useState("");
  const [productionYear, setProductionYear] = useState("2026");
  const [productionLabel, setProductionLabel] = useState("");
  const [releaseType, setReleaseType] = useState("single");
  const [albumTitle, setAlbumTitle] = useState("");
  const [audio, setAudio] = useState(null);
  const [cover, setCover] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();

    if (!supabase) {
      setMessage("Supabase n'est pas configuré.");
      return;
    }

    if (!audio) {
      setMessage("Choisis un fichier audio.");
      return;
    }

    if (!audio.type.startsWith("audio/")) {
      setMessage("Le fichier sélectionné doit être audio.");
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

    if (releaseType === "album" && !albumTitle.trim()) {
      setMessage("Indique le nom de l'album.");
      return;
    }

    setLoading(true);
    setMessage("Envoi en cours...");

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !authData.user) {
        throw new Error("Connecte-toi avant d'envoyer une chanson.");
      }

      const user = authData.user;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role, artist_name")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      if (profile.role !== "artist") {
        throw new Error("Seuls les artistes peuvent envoyer des chansons.");
      }

      const audioExtension = audio.name.split(".").pop().toLowerCase();
      const audioPath = `${user.id}/${Date.now()}.${audioExtension}`;

      const { error: audioError } = await supabase.storage
        .from("music-files")
        .upload(audioPath, audio);

      if (audioError) throw audioError;

      let coverPath = null;

      if (cover) {
        const coverExtension = cover.name.split(".").pop().toLowerCase();
        coverPath = `${user.id}/${Date.now()}.${coverExtension}`;

        const { error: coverError } = await supabase.storage
          .from("music-covers")
          .upload(coverPath, cover);

        if (coverError) {
          await supabase.storage.from("music-files").remove([audioPath]);
          throw coverError;
        }
      }

      const { error: insertError } = await supabase
        .from("tracks")
        .insert({
          title: title.trim(),
          artist_id: user.id,
          audio_path: audioPath,
          cover_path: coverPath,
          production_year: Number(productionYear),
          production_label: productionLabel.trim(),
          release_type: releaseType,
          album_title: releaseType === "album" ? albumTitle.trim() : null,
          status: "pending"
        });

      if (insertError) {
        await supabase.storage.from("music-files").remove([audioPath]);

        if (coverPath) {
          await supabase.storage.from("music-covers").remove([coverPath]);
        }

        throw insertError;
      }

      setMessage(
        "Chanson envoyée avec succès ! Elle est en attente de validation."
      );

      setTitle("");
      setProductionYear("2026");
      setProductionLabel("");
      setReleaseType("single");
      setAlbumTitle("");
      setAudio(null);
      setCover(null);

      e.target.reset();

    } catch (error) {
      setMessage("Erreur : " + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="form-card">
      <p className="eyebrow">NOUVEAU TITRE</p>
      <h1>Ajouter une musique</h1>

      <form onSubmit={submit}>
        <label>
          Titre de la musique
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : Légende"
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
            onChange={(e) => setProductionYear(e.target.value)}
          />
        </label>

        <label>
          Label de production
          <input
            required
            value={productionLabel}
            onChange={(e) => setProductionLabel(e.target.value)}
            placeholder="Ex : DMP Creator Production"
          />
        </label>

        <label>
          Type de sortie
          <select
            value={releaseType}
            onChange={(e) => {
              setReleaseType(e.target.value);
              setAlbumTitle("");
            }}
          >
            <option value="single">Single</option>
            <option value="album">Album</option>
          </select>
        </label>

        {releaseType === "album" && (
          <label>
            Nom de l'album
            <input
              required
              value={albumTitle}
              onChange={(e) => setAlbumTitle(e.target.value)}
              placeholder="Nom de l'album"
            />
          </label>
        )}

        <label>
          Fichier audio (MP3)
          <input
            type="file"
            accept="audio/*"
            required
            onChange={(e) => setAudio(e.target.files[0])}
          />
        </label>

        <label>
          Image de couverture
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCover(e.target.files[0])}
          />
        </label>

        <button className="btn primary" disabled={loading}>
          {loading ? "Envoi en cours..." : "Soumettre pour validation"}
        </button>
      </form>

      {message && <p className="notice">{message}</p>}

      <p className="muted small">
        Ne téléverse que les morceaux dont tu détiens les droits
        ou dont tu as l'autorisation écrite.
      </p>
    </section>
  );
}
