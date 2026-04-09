import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
// import { connectFunctionsEmulator } from "firebase/functions"; // (opcional)

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** =========================
 * ✅ Apps
 * ========================= */

// ✅ App principal (web admin)
export const primaryApp: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

// ✅ App secundaria (para crear usuarios sin tumbar sesión del admin)
export const secondaryApp: FirebaseApp = (() => {
  try {
    return getApp("secondary");
  } catch {
    return initializeApp(firebaseConfig, "secondary");
  }
})();

/** =========================
 * ✅ Services
 * ========================= */

export const db = getFirestore(primaryApp);
export const auth = getAuth(primaryApp);
export const secondaryAuth = getAuth(secondaryApp);

// ✅ Functions (para reset seguro)
export const functions = getFunctions(primaryApp, "us-central1");

// (Opcional) Si algún día usas emulator en local:
// if (import.meta.env.DEV) {
//   connectFunctionsEmulator(functions, "localhost", 5001);
// }
