import { getApps, initializeApp, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getAuth, type Auth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
// Private keys are usually stored with literal "\n" sequences in env vars.
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

export const isAdminDbConfigured = Boolean(projectId && clientEmail && privateKey);

let app: App | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

if (isAdminDbConfigured) {
  app = getApps().length
    ? getApps()[0]
    : initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  db = getFirestore(app);
  auth = getAuth(app);
}

export { db as adminDb, auth as adminAuth };
