import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
// Private keys are usually stored with literal "\n" sequences in env vars.
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

const credentialsPresent = Boolean(projectId && clientEmail && privateKey);

let app: App | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

// This runs at module import time — every route that (even transitively)
// imports this file pays for it on cold start. Unguarded, a malformed
// FIREBASE_ADMIN_PRIVATE_KEY (extremely easy to end up with pasting into a
// hosting provider's env var UI — stray quotes, collapsed newlines, etc.)
// throws here and crashes every one of those serverless functions before
// their own code ever runs, surfacing client-side as an opaque HTML error
// page instead of any of this app's own error handling. Catching it and
// falling back to isAdminDbConfigured = false — the same state as "no
// credentials set" — keeps a bad key from taking down the whole app; the
// specific parse error is still logged so it's diagnosable from the
// platform's function logs.
if (credentialsPresent) {
  try {
    app = getApps().length
      ? getApps()[0]
      : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (err) {
    console.error(
      "[licensing/admin-db] Firebase Admin SDK failed to initialize — falling back to demo mode. " +
        "This usually means FIREBASE_ADMIN_PRIVATE_KEY isn't formatted correctly (check for missing " +
        "newlines or extra quotes from how it was pasted into your hosting provider's env var UI):",
      err,
    );
    app = null;
    db = null;
    auth = null;
  }
}

export const isAdminDbConfigured = credentialsPresent && db !== null && auth !== null;
export { db as adminDb, auth as adminAuth };
