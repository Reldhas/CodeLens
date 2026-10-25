# CodeLens — monorepo du POC étudiant

Squelette de module **Ruby on Rails**, basé sur la spécification API v0.2 du
20 octobre 2026. Le dossier initial ne contenait pas l'application Coursemology :
ce module est donc fourni sous forme de Rails Engine, avec un hôte local minimal.
Il n'est pas encore intégré ni validé dans Coursemology.

## Organisation du dépôt

Le backend Rails reste à la racine ; le futur frontend React/TypeScript est
réservé dans `client/`. Les deux parties peuvent évoluer dans une même PR.

```text
CodeLens/
├── app/                         # Backend Rails
├── config/                      # Routes et configuration backend
├── lib/                         # Rails Engine
├── test/                        # Tests backend et hôte Rails minimal
├── client/
│   ├── app/
│   │   ├── api/course/codelens/  # Futur adaptateur API et types des échanges
│   │   └── bundles/course/codelens/ # Future interface étudiant
│   ├── mocks/                  # Futurs mocks de développement frontend
│   └── public/                 # Ressources statiques publiques
├── Gemfile
└── codelens.gemspec
```

Voir [le guide frontend](client/README.md) pour les responsabilités et les
limites d'intégration. Les dossiers frontend sont des emplacements réservés :
aucune application React, dépendance JavaScript ou commande de build n'est
encore installée. Les commandes ci-dessous concernent uniquement le backend.

## Périmètre actuel

Routes et contrôleurs étudiants, avec deux modes :

- Par défaut, chaque endpoint répond **501**, sans backend connecté.
- Avec `CODELENS_MOCK_MODE=1`, un parcours étudiant en mémoire permet de démarrer
  une tentative, lire l'exercice, sauvegarder un brouillon, soumettre une review
  et consulter les références. Les tests et feedbacks IA simulés disposent d'un
  cycle de job consultable. Le feedback TA retourne `null` en l'absence de retour humain.

Le mode mock utilise le cours 12, l'activité 15 et une identité synthétique
configurée côté serveur. Il est refusé hors développement/test. Les données
disparaissent au redémarrage et ne sont pas partagées entre processus.
Voir [le walkthrough mock](docs/mock-workflow.md) pour démarrer et essayer le parcours.

Aucune connexion à PostgreSQL, Redis, Keycloak, Docker/Polyglot ou à un fournisseur
IA. Aucun endpoint `activities`, `manage`, inscription ou authentification.
La lecture du feedback TA appartient au parcours étudiant ; son écriture est exclue.

Préfixe `B` : `/courses/:course_id/codelens`.

| Méthode | Route | Future responsabilité |
|---|---|---|
| POST | `B/attempts` | Démarrer une tentative, niveau et version figés |
| GET | `B/attempts/:id` | Exercice, brouillon, capacités |
| PATCH | `B/attempts/:id/draft` | Sauvegarder avec `lock_version` |
| POST | `B/attempts/:attempt_id/test_runs` | Demander des tests au niveau débutant |
| GET | `B/test_runs/:id` | Lire le statut et les résultats |
| POST | `B/attempts/:attempt_id/review_submissions` | Figer une review et ses preuves |
| POST | `B/review_submissions/:review_submission_id/ai_assessments` | Demander un feedback IA |
| GET | `B/ai_assessments/:id` | Lire le statut et le feedback IA |
| GET | `B/attempts/:id/reference_solutions` | Références après soumission |
| GET | `B/review_submissions/:id/ta_feedback` | Feedback humain distinct |

Les noms `attempt_id` et `review_submission_id` sont les paramètres Rails des
ressources imbriquées ; les URL correspondent à celles de la spécification.

## Lancement local

Prérequis : Ruby >= 3.2 et Bundler. La plage Rails déclarée sert au squelette ;
la version finale devra correspondre au Gemfile.lock de la branche Coursemology.

Configuration locale vérifiée le 24 octobre 2026 : Ruby 3.4.11, Bundler 2.6.9
et Rails 8.1.4 sous Windows. `.ruby-version` indique la version Ruby du POC et
`Gemfile.lock` fixe les versions résolues des gems. Le lockfile actuel cible
`x64-mingw-ucrt` ; les autres plateformes devront être ajoutées lors de leur
validation. La dépendance `tzinfo-data` fournit les fuseaux horaires sous Windows.

```sh
bundle config set --local path vendor/bundle
bundle install
bundle exec rackup --host 127.0.0.1 --port 3000
```

Dans un autre terminal, lancer les tests :

```sh
bundle exec rake test
```

Après installation de Ruby sous Windows, ouvrir un nouveau terminal pour charger
le PATH. Utiliser `curl.exe` dans PowerShell si `curl` désigne un alias.
Les avertissements Puma concernant les signaux Unix indisponibles sous Windows
n'empêchent pas le serveur de fonctionner. Arrêter le serveur avec `Ctrl+C`.

```sh
curl -i http://127.0.0.1:3000/courses/12/codelens/attempts/81
```

Réponse actuelle :

```json
{
  "errors": [{
    "code": "ENDPOINT_NOT_IMPLEMENTED",
    "message": "This endpoint is declared but its backend is not connected.",
    "field": null
  }],
  "request_id": "<identifiant de la requête>"
}
```

## Suite de l'intégration

Les contrôleurs sont séparés par ressource pour accueillir les services/mocks
ultérieurs. `Codelens::Mock::Workflow` fournit le test double local ; il ne remplace
pas l'authentification et les permissions de Coursemology. L'identité de ce mode
est configurée dans l'hôte local, jamais fournie par une requête.

Dans Coursemology, adapter la classe de base et l'enregistrement du composant
aux conventions de la branche cible : authentification existante, instance,
`current_course`, `current_course_user` et capacités. L'hôte minimal sous `test/dummy`
ne remplace pas ces mécanismes et ne constitue pas une configuration de production.

Le mode mock vérifie le propriétaire/cours, le verrouillage optimiste, l'idempotence
des soumissions, les quatre critères et les références de lignes. Chaque soumission
conserve un snapshot distinct et l'état d'exposition aux références. Un verrou
protège les mutations concurrentes dans le processus. Ces garanties devront être
portées vers les transactions et contraintes de la base lors de l'intégration.
Les dix endpoints étudiants sont fonctionnels en mode mock. Les tests débutants
simulent uniquement l'exercice fixe ; aucun code n'est exécuté. Seuls les runs
terminés de la même tentative/version sont acceptés comme preuves simulées.
Les jobs avancent lors du polling et les feedbacks IA sont explicitement factices.
Les adapters réels, la queue durable, la persistance et l'authentification
Coursemology restent à intégrer. Voir [les contrats mock](docs/mock-workflow.md).

Les tests inclus vérifient les dix routes, le format de l'erreur et l'absence des
routes exclues. Ils nécessitent Ruby et les gems pour s'exécuter.

Les tests couvrent le mode désactivé et le parcours mock : validation, conflits,
idempotence, isolation, concurrence et déverrouillage des références. Ils ne
valident pas encore une intégration à Coursemology ou aux services externes.
