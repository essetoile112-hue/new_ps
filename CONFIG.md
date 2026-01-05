# U4 Green Africa - Configuration Guide

## 🔧 Configuration Requise

Ce projet nécessite plusieurs fichiers de configuration qui contiennent des **informations sensibles** et ne sont **PAS** inclus dans Git pour des raisons de sécurité.

### Backend Configuration

1. **Créer `backend/.env`** en copiant le template :
   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Remplir les valeurs** :
   - `FIREBASE_PROJECT_ID` : ID de votre projet Firebase
   - `FIREBASE_DATABASE_URL` : URL de votre Realtime Database
   - `GOOGLE_CLIENT_ID` : Client ID OAuth Google
   - `GOOGLE_APPLICATION_CREDENTIALS` : Chemin vers votre serviceAccountKey.json

3. **Télécharger le Service Account Key** :
   - Aller sur Firebase Console > Project Settings > Service Accounts
   - Cliquer "Generate new private key"
   - Sauvegarder comme `backend/serviceAccountKey.json`

### Frontend Configuration

1. **Créer `frontend/.env`** en copiant le template :
   ```bash
   cp frontend/.env.example frontend/.env
   ```

2. **Remplir les valeurs Firebase** depuis Firebase Console > Project Settings > General

### 🔒 Sécurité

⚠️ **IMPORTANT** : Ne JAMAIS commit les fichiers `.env` ou `serviceAccountKey.json` !

Ces fichiers sont déjà ignorés dans `.gitignore`.

## 📝 Fichiers Requis (Non versionnés)

- `backend/.env` - Variables d'environnement backend
- `backend/serviceAccountKey.json` - Clé de compte service Firebase
- `frontend/.env` - Variables d'environnement frontend

## 🚀 Démarrage

Après avoir configuré les fichiers ci-dessus :

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (nouveau terminal)
cd frontend
npm install
npm run dev
```

Application disponible sur : http://localhost:5173
