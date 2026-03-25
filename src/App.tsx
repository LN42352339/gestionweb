import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "../src/presentation/views/Login";
import Dashboard from "./presentation/views/Dashboard";
import ForgotPassword from "./presentation/views/ForgotPassword";
import Register from "./presentation/views/Register";
import History from "./presentation/views/History";
import Statistics from "./presentation/views/Statistics";
import Perfil from "./presentation/views/Perfil";
import ProtectedRoute from "./presentation/components/ProtectedRoute";
import Layout from "./presentation/components/Layout";


function App() {
  return (
    <Router>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Rutas protegidas con layout */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/historial" element={<History />} />
          <Route path="/estadisticas" element={<Statistics />} />
          <Route path="/perfil" element={<Perfil />} />
         
        </Route>

        {/* Ruta por defecto */}
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
