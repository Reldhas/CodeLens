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

Uniquement les routes et contrôleurs étudiants. Chaque endpoint répond **501**
avec une erreur JSON explicite et un `request_id`. Aucun succès fictif, stockage
en mémoire, compte synthétique ou job simulé n'est créé. Les corps de requête ne
sont pas encore traités ou validés : cela viendra avec les services et les mocks.

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

```sh
bundle install
bundle exec rackup --host 127.0.0.1 --port 3000
bundle exec rake test
```

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
ultérieurs. Ne remplacer les réponses 501 par des données qu'après raccordement
au contexte d'identité et de cours approprié.

Dans Coursemology, adapter la classe de base et l'enregistrement du composant
aux conventions de la branche cible : authentification existante, instance,
`current_course`, `current_course_user` et capacités. L'hôte minimal sous `test/dummy`
ne remplace pas ces mécanismes et ne constitue pas une configuration de production.

Les prochaines implémentations devront appliquer les contrats de la spécification :
propriété des tentatives et preuves, verrouillage optimiste, idempotence,
reviews immuables avec quatre critères, tests uniquement débutant, références
après soumission et feedbacks IA/TA séparés. Rien de cela n'est prétendu implémenté
par les réponses 501 actuelles.

Les tests inclus vérifient les dix routes, le format de l'erreur et l'absence des
routes exclues. Ils nécessitent Ruby et les gems pour s'exécuter.
