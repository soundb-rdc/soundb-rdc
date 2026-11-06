import { Link } from "react-router-dom";

export default function About() {
  return (
    <section className="page">
      <p className="eyebrow">À PROPOS</p>
      <h1>SOUND-B</h1>
      <p className="muted">
        La plateforme musicale qui met en avant les artistes congolais.
      </p>

      <div className="detail-card">
        <p className="eyebrow">NOTRE MISSION</p>
        <p>
          SOUND-B permet aux artistes de publier leurs chansons, de se faire
          connaître et d'être écoutés partout. Chaque titre est vérifié avant
          sa publication pour garantir la qualité du catalogue.
        </p>
      </div>

      <div className="detail-card">
        <p className="eyebrow">POUR LES AUDITEURS</p>
        <p>
          Écoutez gratuitement, découvrez les nouveautés chaque semaine et
          téléchargez vos chansons préférées avec leurs informations
          officielles (artiste, titre, pochette).
        </p>
      </div>

      <div className="detail-card">
        <p className="eyebrow">POUR LES ARTISTES</p>
        <p>
          Créez votre profil, ajoutez vos chansons et suivez leurs lectures et
          téléchargements. Après validation par notre équipe, vos titres sont
          visibles par tous.
        </p>
        <Link className="btn primary" to="/inscription">
          Devenir artiste SOUND-B
        </Link>
      </div>

      <div className="detail-card">
        <p className="eyebrow">DROITS D'AUTEUR</p>
        <p>
          Les artistes certifient détenir les droits des titres qu'ils
          publient. Pour toute réclamation, contactez-nous.
        </p>
      </div>

      <p className="muted">
        SOUND-B est une plateforme de DMP Creator Production.
      </p>

      <Link className="btn secondary" to="/">
        ← Retour à l'accueil
      </Link>
    </section>
  );
}
