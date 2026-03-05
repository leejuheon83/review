import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getServiceAccountConfig():
  | {
      projectId: string;
      clientEmail: string;
      privateKey: string;
      databaseURL?: string;
    }
  | null {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    try {
      const parsed = JSON.parse(rawJson) as {
        project_id?: string;
        client_email?: string;
        private_key?: string;
        databaseURL?: string;
      };
      if (parsed.project_id && parsed.client_email && parsed.private_key) {
        return {
          projectId: parsed.project_id,
          clientEmail: parsed.client_email,
          privateKey: parsed.private_key.replace(/\\n/g, "\n"),
          databaseURL:
            typeof parsed.databaseURL === "string" ? parsed.databaseURL : process.env.FIREBASE_DATABASE_URL,
        };
      }
    } catch {
      return null;
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) return null;
  return { projectId, clientEmail, privateKey, databaseURL: process.env.FIREBASE_DATABASE_URL };
}

export function isFirebaseEnabled(): boolean {
  return Boolean(getServiceAccountConfig());
}

export function getFirestoreAdmin() {
  const config = getServiceAccountConfig();
  if (!config) return null;
  try {
    if (!getApps().length) {
      initializeApp({
        credential: cert({
          projectId: config.projectId,
          clientEmail: config.clientEmail,
          privateKey: config.privateKey,
        }),
        databaseURL: config.databaseURL,
      });
    }
    return getFirestore();
  } catch {
    return null;
  }
}
