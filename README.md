# U4 Green Africa - Air Quality Monitoring System

Application web de surveillance en temps réel de la qualité de l'air avec prévisions LSTM et stockage de données historiques.

## 🚀 Configuration Initiale

### 1. Configuration du Frontend

1. Naviguer vers le dossier frontend :
   ```bash
   cd frontend
   ```

2. Copier le fichier d'exemple et configurer les variables :
   ```bash
   cp .env.example .env.local
   ```

3. Éditer `.env.local` avec vos propres valeurs Firebase :
   - Obtenir les credentials depuis [Firebase Console](https://console.firebase.google.com/)
   - Aller dans Project Settings > General > Your apps
   - Copier la configuration Firebase

4. Installer les dépendances :
   ```bash
   npm install
   ```

5. Lancer le serveur de développement :
   ```bash
   npm run dev
   ```

### 2. Configuration du Backend

1. Naviguer vers le dossier backend :
   ```bash
   cd backend
   ```

2. Copier le fichier d'exemple et configurer les variables :
   ```bash
   cp .env.example .env
   ```

3. Configurer Firebase Admin SDK :
   - Aller dans Firebase Console > Project Settings > Service Accounts
   - Cliquer sur "Generate New Private Key"
   - Sauvegarder le fichier JSON comme `serviceAccountKey.json` dans le dossier `backend/`

4. Installer les dépendances :
   ```bash
   npm install
   ```

5. Lancer le serveur backend :
   ```bash
   npm run dev
   ```

### 3. Configuration Embedded (ESP32)

Voir le dossier `embedded/` pour le code Arduino et les instructions de câblage.

## 📁 Structure du Projet

```
ps-main/
├── frontend/          # Application React + Vite
│   ├── .env.example  # Template de configuration
│   └── src/          # Code source
├── backend/          # API Node.js + Express
│   ├── .env.example  # Template de configuration
│   └── src/          # Code source
└── embedded/         # Code ESP32 (Arduino)
```

## 🔒 Sécurité

**IMPORTANT** : Ne jamais commiter les fichiers suivants :
- `.env` et `.env.local` (configuration)
- `serviceAccountKey.json` (credentials Firebase)
- `client_secret.json` (credentials OAuth)

Ces fichiers sont déjà inclus dans `.gitignore`.

## 📊 Fonctionnalités

- ✅ Surveillance en temps réel de la qualité de l'air
- ✅ Prévisions avec modèle LSTM hybride
- ✅ Stockage et visualisation des données historiques
- ✅ Détection de gaz avec capteur ESP32
- ✅ Dashboard d'analyse avancée

## 🛠️ Technologies

- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, Firebase Admin
- **Database**: Firebase Realtime Database
- **ML**: TensorFlow.js (LSTM)
- **Embedded**: ESP32, Arduino

## 📝 License

Copyright © 2026 U4 Green Africa
