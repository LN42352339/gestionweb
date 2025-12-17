import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDsAtvXK608p-qsJr6h5eukwNKcd0gsKYE",
  authDomain: "gestioncontactos-a145c.firebaseapp.com",
  projectId: "gestioncontactos-a145c",
  storageBucket: "gestioncontactos-a145c.appspot.com",
  messagingSenderId: "526517937231",
  appId: "1:526517937231:web:2d45f0f12754d0d8e8b63a",
};

// ✅ App principal (web admin)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// ✅ App secundaria SOLO para crear usuarios sin tumbar la sesión del admin
const secondaryApp = initializeApp(firebaseConfig, "secondary");

export const db = getFirestore(app);
export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);
