# Plan de Développement de l'Équipe : WorkFinder (Cycle Complet)

## Rôles de l'Équipe & Domaines
| Nom          | Rôle                            | Domaine de Concentration                                      |
| :----------- | :------------------------------ | :------------------------------------------------------------ |
| **Fares**    | **Chef de Projet / Dev Back 1** | Architecture, DevOps, API Core, Sécurité, Orchestration       |
| **Danielle** | **Dev Back 2**                  | Ingestion de Données (Scraping), Normalisation, Dédoublonnage |
| **Ruth**     | **Lead Front / Dev Front 1**    | Système de Design, Page d'Accueil, UX de Recherche            |  |
| **Amadou**   | **Dev Front 2**                 | Présentation des Offres, Responsivité, Intégration API        |
| **Miguel**   | **Dev Front 3**                 | Comptes Utilisateurs, UI Watchlists/Alertes, Tableau de Bord  |

---

## Découpage des Sprints (14 Semaines / 7 Sprints)

### Sprint 1 : Initialisation & Architecture (Semaines 1-2)
*Objectif : Initialisation du projet, mise en place des environnements et définition de l'architecture.*

#### Semaine 1 : Fondations Backend & Données
*   **Fares (Chef de Projet)** :
    *   Initialiser le dépôt Git avec les branches `main` et `dev`.
    *   Configurer `docker-compose.yml` (PostgreSQL, Redis, services Python/Node de base).
    *   Concevoir le schéma de base de données PostgreSQL (Tables Users, Jobs, Sources).
*   **Danielle** :
    *   Analyser la structure HTML des sites cibles (Jobartis, Emploi.cm).
    *   Configurer l'environnement de Scraping Python (BeautifulSoup/Playwright).
    *   Créer un script "Proof of Concept" pour récupérer 1 page de Remotive.

#### Semaine 2 : Initialisation Frontend
*   **Ruth (Front Lead)** :
    *   Initialiser le projet Vite + React.
    *   Configurer Tailwind CSS & Définir le Système de Design (Couleurs, Polices).
    *   Créer les composants `Navbar` et `Footer`.
*   **Amadou** :
    *   Configurer React Router (Structure des routes).
    *   Créer les pages squelettes (Home, JobDetails, Login, 404).
    *   Ébaucher la structure HTML/CSS de la "Job Card".
*   **Miguel** :
    *   Concevoir les maquettes/formulaires de Connexion & Inscription (Statique).
    *   Configurer la logique de validation de formulaire côté client (Zod/React Hook Form).

### Sprint 2 : MVP d'Ingestion (Semaines 3-4)
*Objectif : Collecter des données depuis des sources faciles (APIs/RSS) et stocker en DB.*

#### Semaine 3 : Implémentation Backend
*   **Fares (Chef de Projet)** :
    *   Construire le squelette FastAPI (Routeurs, Injection de Dépendances).
    *   Configurer les modèles SQLAlchemy ORM.
    *   Implémenter le "Registre des Sources" (DB stockant les sources actives).
*   **Danielle** :
    *   Implémenter le scraping/fetcher API pour **Remotive**.
    *   Implémenter le fetcher API pour **Adzuna**.
    *   Créer l'utilitaire de normalisation des données (JSON brut -> Modèle `Job`).

#### Semaine 4 : Implémentation Frontend
*   **Ruth (Front Lead)** :
    *   Construire le composant "Barre de Recherche" (Input + UI Filtres).
    *   Concevoir la "Sidebar de Filtres" (Groupes de cases à cocher pour Compétences, Lieu).
*   **Amadou** :
    *   Construire le composant "Liste d'Offres" (Mise en page Grille/Liste).
    *   Implémenter les composants UI de pagination.
*   **Miguel** :
    *   Construire la mise en page statique du "Tableau de Bord Utilisateur".
    *   Implémenter le "Sélecteur de Thème" (Mode Sombre/Clair).

### Sprint 3 : Ingestion Avancée & Dédoublonnage (Semaines 5-6)
*Objectif : Collecter des données de sources complexes (HTML) et gérer les doublons.*

#### Semaine 5 : Backend & Traitement des Données
*   **Fares (Chef de Projet)** :
    *   Configurer Celery pour la planification des tâches asynchrones (Le Scheduler).
    *   Gestion des migrations de base de données (Alembic).
    *   Configurer Logging & Monitoring (Sentry/Logs).
*   **Danielle** :
    *   Implémenter le parseur HTML pour **Jobartis**.
    *   Implémenter le parseur HTML pour **Emploi.cm**.
    *   Implémenter le parseur RSS pour **WeWorkRemotely**.

#### Semaine 6 : Raffinement Frontend
*   **Ruth (Front Lead)** :
    *   Affiner la responsivité mobile pour la Recherche & Accueil.
    *   Implémenter les "Loading Skeletons" pour une meilleure UX.
*   **Amadou** :
    *   Construire la page "Détails de l'Offre" (Description, Affichage des méta-données).
    *   Implémenter la fonctionnalité "Partager l'Offre".
*   **Miguel** :
    *   Créer la mise en page de la page "Paramètres Profil".
    *   Implémenter l'UI de la liste "Offres Sauvegardées" (UI uniquement).

### Sprint 4 : Qualité des Données & Cœur Backend (Semaines 7-8)
*Objectif : Logique de dédoublonnage et préparation de l'API de Recherche.*

#### Semaine 7 : Logique Backend
*   **Fares (Chef de Projet)** :
    *   Implémenter l'API `GET /jobs` avec logique de filtrage (Filtres SQLAlchemy).
    *   Implémenter la Recherche Plein Texte (Ciblant PostgreSQL `tsvector`).
*   **Danielle** :
    *   **Tâche Principale** : Implémenter la Logique de Dédoublonnage.
        *   Étape 1 : Génération de Hash (Titre + Entreprise).
        *   Étape 2 : Intégration du Fuzzy Matching (RapidFuzz) pour les titres similaires.
    *   Écrire les Tests Unitaires pour tous les parseurs.

#### Semaine 8 : Mocking & État Frontend
*   **Ruth (Front Lead)** :
    *   Connecter la "Barre de Recherche" aux données API mockées (simuler les délais).
    *   Implémenter l'état "Zéro Résultat".
*   **Amadou** :
    *   Connecter la "Liste d'Offres" aux données API mockées.
    *   Refactoriser le CSS pour une correspondance parfaite avec les types de données backend.
*   **Miguel** :
    *   Concevoir le Modal/Formulaire de "Création de Watchlist".
    *   Concevoir le Tableau de "Gestion des Watchlists".

### Sprint 5 : Authentification & Intégration API (Semaines 9-10)
*Objectif : Comptes utilisateurs et connexion Front-Back.*

#### Semaine 9 : Auth Backend & Optimisation
*   **Fares (Chef de Projet)** :
    *   Implémenter l'API d'Auth (`/login`, `/register`, `/me`).
    *   Implémenter la génération et vérification de Tokens JWT.
    *   Sécuriser les endpoints `POST /watchlists`.
*   **Danielle** :
    *   Optimiser la Performance d'Ingestion (Inserts en masse).
    *   Configurer la politique de réessai pour les scrapes échoués.

#### Semaine 10 : Intégration Frontend
*   **Ruth (Front Lead)** :
    *   **Intégration** : Connecter Accueil/Recherche au Backend Réel (`GET /jobs`).
    *   Gérer les états d'Erreur API (Erreur réseau, Erreur serveur).
*   **Amadou** :
    *   **Intégration** : Connecter Détails de l'Offre au Backend Réel.
    *   Implémenter la logique "Offres Similaires" sur le frontend (si l'API le supporte).
*   **Miguel** :
    *   **Intégration** : Connecter Connexion/Inscription au Backend Réel.
    *   Implémenter le Contexte d'Auth Global (Stocker JWT, gérer Déconnexion).

### Sprint 6 : Watchlists & Notifications (Semaines 11-12)
*Objectif : La partie "Intelligente" - Alertes Email.*

#### Semaine 11 : Fonctionnalités Backend
*   **Fares (Chef de Projet)** :
    *   Implémenter l'API CRUD `Watchlist`.
    *   Implémenter le "Moteur de Notification" (Tâche Cron : Match nouvelles offres vs Watchlists).
    *   Configurer le Service d'Envoi d'Email (SMTP/SendGrid).
*   **Danielle** :
    *   Assister Fares avec l'"Algorithme de Matching" pour les alertes.
    *   Finaliser la documentation des Scrapers.

#### Semaine 12 : Polish Frontend
*   **Ruth (Front Lead)** :
    *   Tests Utilisateurs Finaux & Polish UI (Animations, Transitions).
    *   Audit d'Accessibilité (A11y).
*   **Amadou** :
    *   Tests Cross-browser (Chrome, Firefox, Edge).
    *   Corriger les bugs de mise en page sur Tablettes.
*   **Miguel** :
    *   Intégrer "Création de Watchlist" au Backend Réel.
    *   Afficher "Mes Alertes" dans le Tableau de Bord Utilisateur.

### Sprint 7 : Déploiement & Livraison Finale (Semaines 13-14)
*Objectif : Déploiement en Production et Documentation.*

#### Semaine 13 : DevOps Backend & Données
*   **Fares (Chef de Projet)** :
    *   Configurer les Images Docker de Production (Optimisées).
    *   Déployer Backend & DB sur Render/VPS.
    *   Configurer Domaine & SSL.
*   **Danielle** :
    *   Peupler la Base de Données de Production (Seed).
    *   Écrire la Section Rapport Technique (Stratégie d'Ingestion).

#### Semaine 14 : Déploiement Frontend & Documentation
*   **Ruth (Front Lead)** :
    *   Déployer Frontend sur Vercel/Netlify.
    *   Écrire le Manuel Utilisateur (Captures d'écran).
*   **Amadou** :
    *   Vérifier tous les liens et redirections externes.
    *   Préparation des Slides de Présentation (Démo Frontend).
*   **Miguel** :
    *   Écrire la Section Rapport Technique (Fonctionnalités Utilisateur).
    *   Préparation des Slides de Présentation (Parcours utilisateur).
