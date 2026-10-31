import { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
export default function Register() {
  const [name,setName]=useState(""); const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(e){e.preventDefault(); if(!supabase){setMessage("Configure les variables Supabase dans .env.");return;} setBusy(true); const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name,role:"artist"}}}); setBusy(false); setMessage(error?error.message:"Compte créé. Vérifie ton adresse email si la confirmation est activée.");}
  return <section className="form-card"><p className="eyebrow">REJOINS SOUND-B</p><h1>Inscription artiste</h1><form onSubmit={submit}><label>Nom d’artiste ou nom complet<input required value={name} onChange={e=>setName(e.target.value)}/></label><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Mot de passe<input type="password" minLength="8" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="btn primary" disabled={busy}>{busy?"Création…":"Créer mon compte"}</button></form>{message&&<p className="notice">{message}</p>}<p className="muted">Déjà inscrit ? <Link to="/connexion">Connexion</Link></p><p className="muted small">Les profils et les morceaux seront soumis à validation avant publication.</p></section>;
}
