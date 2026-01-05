Backend skeleton: API endpoints, WebSocket server, services, models, config, tests.

Structure:
- `src/api/` : `auth`, `sensors`, `measurements`, `reports` endpoints
- `src/ws/` : realtime WebSocket server
- `src/services/` : auth, ingestion, reporting
- `src/models/` : Firestore models for `sensors`, `measurements`, `alerts`, `reports`, `users`
- `src/config/` : Firebase config and security rules
- `tests/` : unit tests

Backend Setup
------------

1. Install dependencies and dev types (Node & firebase-admin) in backend:

```powershell
cd backend
npm install
```

2. For TypeScript dev run, you can run:

```powershell
npm run dev
```

3. To enable admin features you must set a service account JSON in env var:

```powershell
setx GOOGLE_APPLICATION_CREDENTIALS "C:\path\to\serviceAccountKey.json"
```

4. The `src/config/firebase.config.ts` file contains a dynamic `require` fallback — if `firebase-admin` is not installed the code will not initialize and will export `null` for `db` and `auth`.

Connexion au frontend: voir `docs/architecture.md` (REST + WebSocket + JWT handshake).


Local development: start backend with Service Account
-----------------------------------------------

For local development you can either set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable
or use the included PowerShell helper which sets the variable for the current session and starts
the compiled Node server (`dist/index.js`). This avoids modifying source code and keeps credentials
out of the repo.

- Quick start (PowerShell, one-liner):

```powershell
# from repository root
cd "C:\Users\Mrabet\Desktop\PS\U4-Green Africa\backend"
$env:GOOGLE_APPLICATION_CREDENTIALS = "$PWD\serviceAccountKey.json"
node dist/index.js
```

- Helper script (recommended): run `run-local.ps1` which does the same but also validates the file.

Usage:

```powershell
cd "C:\Users\Mrabet\Desktop\PS\U4-Green Africa\backend"
./run-local.ps1
```

Notes:
- The helper script does not commit or modify any credentials; it only sets the env var for the
	running PowerShell process and launches `node`.
- For CI or container deployments prefer injecting credentials via CI secrets or the platform's
	service account mechanisms rather than storing files in the repository.
