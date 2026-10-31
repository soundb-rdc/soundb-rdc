import { useState } from "react";
import { supabase } from "../lib/supabase";
export default function UploadTrack() {
  const [title,setTitle]=useState(""); const [audio,setAudio]=useState(null); const [cover,setCover]=useState(null); const [message,setMessage]=useState("");
  async function submit(e){e.preventDefault(); if(!supabase){setMessage("Configure Supabase avant l’envoi.");return;} if(!audio){setMessage("Choisis un fichier audio.");return;} setMessage("Formulaire prêt. Il faut créer le bucket privé/public et la table tracks avant d’activer l’envoi.");}
  return <section className="form-card"><p className="eyebrow">NOUVEAU TITRE</p><h1>Ajouter une musique</h1><form onSubmit={submit}><label>Titre de la musique<input required value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Fichier audio (MP3)<input type="file" accept="audio/mpeg,audio/*" onChange={e=>setAudio(e.target.files[0])}/></label><label>Image de couverture<input type="file" accept="image/*" onChange={e=>setCover(e.target.files[0])}/></label><button className="btn primary">Soumettre pour validation</button></form>{message&&<p className="notice">{message}</p>}<p className="muted small">Ne téléverse que les morceaux dont tu détiens les droits ou dont tu as l’autorisation écrite.</p></section>;
}
