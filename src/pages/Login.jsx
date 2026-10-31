import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
export default function Login() {
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false); const nav=useNavigate();
  async function submit(e){e.preventDefault(); if(!supabase){setMessage("Configure les variables Supabase dans .env.");return;} setBusy(true); const {error}=await supabase.auth.signInWithPassword({email,password}); setBusy(false); if(error)setMessage(error.message); else nav("/artiste/tableau-de-bord");}
  return <section className="form-card"><p className="eyebrow">BON RETOUR</p><h1>Connexion</h1><form onSubmit={submit}><label>Email<input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label><label>Mot de passe<input type="password" required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="btn primary" disabled={busy}>{busy?"Connexion…":"Se connecter"}</button></form>{message&&<p className="notice">{message}</p>}<p className="muted">Pas encore de compte ? <Link to="/inscription">Créer un compte</Link></p></section>;
}
