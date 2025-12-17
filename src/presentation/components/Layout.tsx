// src/components/Layout.tsx
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900">
      <Navbar />
      <main className="w-full p-6">
        <Outlet />
      </main>
    </div>
  );
}
