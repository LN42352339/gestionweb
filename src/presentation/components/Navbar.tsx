import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../../config/firebaseConfig";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import logo from "../../assets/img/logocongreso.png";

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nombreUsuario, setNombreUsuario] = useState("");

  useEffect(() => {
    const obtenerNombre = async () => {
      if (!user) return;

      try {
        let nombreFinal = "";

        // 1️⃣ Intentar por UID (por si el doc se llama igual al uid)
        const docRef = doc(db, "usuarios", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          nombreFinal = data.nombre || "";
        } else {
          // 2️⃣ Si no hay doc con ese UID, buscamos por EMAIL
          const usuariosRef = collection(db, "usuarios");
          const q = query(usuariosRef, where("email", "==", user.email));
          const querySnap = await getDocs(q);

          if (!querySnap.empty) {
            const data = querySnap.docs[0].data();
            nombreFinal = data.nombre || "";
          }
        }

        // 3️⃣ Si encontramos nombre, lo usamos. Si no, "Usuario"
        setNombreUsuario(nombreFinal || "Usuario");
      } catch (error) {
        console.error("Error al obtener el nombre:", error);
        setNombreUsuario("Usuario");
      }
    };

    obtenerNombre();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <nav className="bg-red-500 text-white px-4 py-2 flex justify-between items-center">
      {/* Logo y título que redirige al dashboard */}
      <div
        className="flex items-center space-x-3 cursor-pointer"
        onClick={() => navigate("/dashboard")}
      >
        <img
          src={logo}
          alt="Logo"
          className="h-16 w-16 rounded-full object-cover border-2 border-white shadow-md"
        />
        <span className="text-xl font-bold">Congreso de la República</span>
      </div>

      {/* Usuario y botón de logout */}
      <div className="flex items-center space-x-4">
        {user && nombreUsuario && (
          <span className="font-semibold">{nombreUsuario}</span>
        )}
        <button
          onClick={handleLogout}
          className="!bg-white !text-red-600 !border-2 !border-red-600 
             !px-4 !py-2 !rounded-md !transition-all !duration-300 
             hover:!bg-black hover:!text-white hover:!shadow-lg hover:!scale-105"
        >
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}
