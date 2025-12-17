// src/components/ProtectedRoute.tsx

// 🔁 Importamos Navigate para redireccionar al login si el usuario no está autenticado
import { Navigate } from "react-router-dom";

// 🔒 Importamos nuestro custom hook de autenticación para obtener el usuario y el estado de carga
import { useAuth } from "../context/AuthContext";

// 🧱 Importamos ReactNode para tipar correctamente los elementos hijos
import { ReactNode } from "react";

// 📦 Definimos una interfaz que dice que este componente recibirá children (hijos) como prop
interface ProtectedRouteProps {
  children: ReactNode;
}

// 🔐 Componente que protege las rutas
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // 🧠 Obtenemos el usuario actual y el estado de carga desde el contexto de autenticación
  const { user, loading } = useAuth();

  // ⏳ Si todavía se está verificando el estado del usuario, mostramos un mensaje temporal
  if (loading) {
    return <div>Cargando...</div>;
  }

  // 🚫 Si no hay usuario (es decir, no está autenticado), lo redirigimos al login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Si el usuario está autenticado, mostramos el contenido protegido (children)
  return children;
}
