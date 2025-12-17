// src/pages/Login.tsx

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../config/firebaseConfig";
import { useNavigate, Link } from "react-router-dom";
import bgCongreso from "../../assets/img/bg-congreso.webp";  
import logo from "../../assets/img/logo.webp";      


export default function Login() {
  const [email, setEmail] = useState(""); // Estado del correo
  const [password, setPassword] = useState(""); // Estado de la contraseña
  const [errorMsg, setErrorMsg] = useState(""); // Mensaje de error si algo falla
  const navigate = useNavigate();

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password); // Autenticación con Firebase
      navigate("/dashboard"); // Redirige si fue exitoso
    } catch (error) {
      setErrorMsg("Error al iniciar sesión. Revisa tus credenciales.");
      console.error("Error en login:", error);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Sección izquierda con imagen de fondo */}
      <div
        className="hidden md:flex md:w-1/2 bg-cover bg-center"
        style={{
          backgroundImage: `url(${bgCongreso})`,
        }}
      >
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
        >
          <div className="text-white text-center p-8">
            <h1 className="text-5xl mb-6">
              Sistema de Gestion del Directorio Institucional
            </h1>
            <p className="text-lg">Congreso de la República del Perú</p>
          </div>
        </div>
      </div>

      {/* Sección derecha con el formulario */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-sm m-6 border border-gray-200">
          {/* Logo superior */}
          <div className="flex items-center justify-center mb-6">
            <img src={logo} alt="Logo" className="h-30 w-auto" />
          </div>

          <h2 className="text-2xl font-bold mb-4 text-center">
            Iniciar Sesión
          </h2>
          {errorMsg && (
            <p className="text-red-500 mb-2 text-center">{errorMsg}</p>
          )}

          {/* Formulario de inicio de sesión */}
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block mb-1 font-medium text-gray-700"
              >
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                placeholder="Ingrese su correo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="off"
                className="border border-black rounded w-full p-2 text-black focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="block mb-1 font-medium text-gray-700"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="off"
                className="border border-black rounded w-full p-2 text-black focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 transition"
            >
              Iniciar Sesión
            </button>
          </form>

          {/* Enlaces debajo del formulario */}
          <div className="mt-4 text-center">
            <Link
              to="/forgot-password"
              className="text-blue-600 hover:text-blue-800 transition"
            >
              ¿Olvidaste tu contraseña?
            </Link>
            <br />
            {/*  Enlace corregido con React Router */}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-800 transition"
            >
              ¿No tienes cuenta? Regístrate
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
