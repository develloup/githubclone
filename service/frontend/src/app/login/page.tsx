"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const Login: React.FC = () => {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault(); // ✅ Verhindert das Standard-Submit-Verhalten
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      if (!response.ok) {
        alert("Login failed! Bitte überprüfe deine Zugangsdaten.");
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (data.oauth_login_urls) {
        if (typeof window !== "undefined") {
          localStorage.setItem("oauthUrls", JSON.stringify(data.oauth_login_urls)); // ✅ Speichert OAuth-URLs sicher
        }
        router.push("/dashboard"); // Weiterleitung zur Dashboard-Seite
      } else {
        alert("Login fehlgeschlagen! Bitte erneut versuchen.");
      }
    } catch (error) {
      console.error("Fehler beim Login:", error);
      alert("Ein Fehler ist aufgetreten. Bitte später erneut versuchen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Login</h2>

        <form onSubmit={handleLogin} className="w-full">
          <input
            type="text"
            placeholder="Email oder Username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            className="w-full px-4 py-2 mb-3 border rounded-md focus:outline-none"
            required
          />
          <input
            type="password"
            placeholder="Passwort"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 mb-3 border rounded-md focus:outline-none"
            required
          />
          <button
            type="submit"
            className={`w-full px-4 py-2 rounded-md ${loading ? "bg-gray-500 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
            disabled={loading}
          >
            {loading ? "⏳ Wird geladen..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
