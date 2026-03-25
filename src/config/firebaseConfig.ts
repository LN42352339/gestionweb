import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getFunctions } from "firebase/functions";
// import { connectFunctionsEmulator } from "firebase/functions"; // (opcional)

const firebaseConfig = {
  apiKey: "AIzaSyDsAtvXK608p-qsJr6h5eukwNKcd0gsKYE",
  authDomain: "gestioncontactos-a145c.firebaseapp.com",
  projectId: "gestioncontactos-a145c",
  storageBucket: "gestioncontactos-a145c.appspot.com",
  messagingSenderId: "526517937231",
  appId: "1:526517937231:web:2d45f0f12754d0d8e8b63a",
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
