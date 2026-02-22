# THIBDEV © 2026

# Ayimolou Express - Backend API 🍛

Le moteur backend de l'application Ayimolou Express, gérant les commandes, les livreurs, le suivi GPS en temps réel et les notifications.

## 🚀 Technologies
- **Node.js & Express** : Framework principal.
- **TypeScript** : Pour un code robuste et typé.
- **Firebase Admin SDK** : Firestore (Base de données) et FCM (Notifications).
- **Clerk** : Gestion complète de l'authentification.
- **Cloudinary** : Stockage et optimisation des images.
- **Zod** : Validation stricte des schémas de données.

---

## 🛠️ Installation et Démarrage

### Prérequis
- Node.js (v18+)
- Compte Firebase (Service Account)
- Compte Clerk (Publishable & Secret Key)

### Configuration
Créez un fichier `.env` à la racine :
```env
PORT=3000
CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Firebase
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# Cloudinary
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Commandes
```bash
npm install        # Installer les dépendances
npm run dev        # Démarrer en mode développement
npm run build      # Compiler pour la production
npm start          # Démarrer en production
```

---

## 🔒 Authentification
Toutes les routes protégées nécessitent un jeton JWT de **Clerk** dans les headers :
`Authorization: Bearer <clerk_session_token>`

---

## 📖 Documentation API

### 👤 Utilisateurs (`/api/users`)
| Méthode | Route | Description | Rôle requis |
| :--- | :--- | :--- | :--- |
| POST | `/sync` | Synchronise l'utilisateur Clerk avec Firestore | Tous |
| GET | `/vendors` | Liste toutes les vendeuses enregistrées | Tous |
| GET | `/:uid` | Récupère le profil complet d'un utilisateur | Tous |
| PATCH | `/:uid/role` | Met à jour le rôle (vendeur, livreur, client) | Tous |
| PATCH | `/:uid/vendor-profile` | Met à jour les infos du restaurant | Vendeur |

### 🚗 Livreurs & GPS (`/api/users` & `/api/drivers`)
| Méthode | Route | Description | Rôle requis |
| :--- | :--- | :--- | :--- |
| PATCH | `/:uid/driver-location` | Met à jour le GPS (Throttling 5s/10m) | Livreur |
| PATCH | `/:uid/driver-availability` | Change le statut En ligne/Hors ligne | Livreur |
| GET | `/drivers/:uid/location` | Récupère la position actuelle du livreur | Client/Vendeur |

### 🍛 Produits & Catégories (`/api/products` & `/api/categories`)
| Méthode | Route | Description | Rôle requis |
| :--- | :--- | :--- | :--- |
| GET | `/products` | Liste tous les produits (filtre possible) | Tous |
| POST | `/products` | Crée un nouveau produit | Vendeur |
| GET | `/categories` | Liste les catégories | Tous |

### 🛒 Commandes (`/api/orders`)
**Flux de statut :** `PENDING` → `ACCEPTED` → `PREPARING` → `READY` → `DELIVERING` → `COMPLETED`

| Méthode | Route | Description | Rôle requis |
| :--- | :--- | :--- | :--- |
| POST | `/` | Crée une nouvelle commande | Client |
| GET | `/vendor-orders` | Liste les commandes à préparer | Vendeur |
| GET | `/available-deliveries`| Commandes `READY` prêtes à être livrées | Livreur |
| PATCH | `/:id/assign` | Le livreur accepte la course (Atomic) | Livreur |
| PATCH | `/:id/complete` | Marque la livraison comme terminée | Livreur |
| POST | `/verify-payment` | Vérifie le statut du paiement mobile | Client |

---

## 🔔 Système de Notifications
Le backend envoie automatiquement des notifications push via Firebase Cloud Messaging (FCM) :
1. **Nouvelle commande** : Vers le vendeur.
2. **Changement de statut** : Vers le client.
3. **Assignation** : Vers le client quand le livreur accepte.
4. **Proximité (500m)** : Le client est prévenu quand le livreur approche de son adresse de livraison.

---

## 📂 Architecture des dossiers
- `src/controllers/` : Logique de traitement des requêtes.
- `src/services/` : Logique métier et interactions avec Firestore/FCM.
- `src/models/` : Interfaces TypeScript et définitions de données.
- `src/routes/` : Définition des endpoints API.
- `src/middlewares/` : Securité (Clerk), Upload (Multer) et Validation.

---

## 📝 Licence
Ce projet est privé. Toute reproduction non autorisée est interdite. 

