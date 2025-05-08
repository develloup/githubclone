"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const Dashboard: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const response = await fetch("/api/users", { credentials: "include" }); // ✅ Damit Session-Cookies gesendet werden
      if (!response.ok) {
        router.push("/login"); // Falls kein Nutzer gefunden wird, zurück zur Login-Seite
        return;
      }

      const data = await response.json();
      setUser(data); // Speichert die Benutzerinformationen
    };

    fetchUser();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Dashboard</h2>

        {user ? (
          <div>
            <p className="text-lg font-semibold text-gray-700">👤 Eingeloggt als:</p>
            <p className="text-gray-600">{user.username}</p>
            <p className="text-gray-600">{user.email}</p>
          </div>
        ) : (
          <p className="text-red-600">🔄 Lade Benutzerinformationen...</p>
        )}

        <button
          onClick={() => {
            document.cookie = "session_id=; Max-Age=0"; // Löscht das Cookie
            router.push("/login");
          }}
          className="w-full bg-red-600 text-white px-4 py-2 rounded-md mt-4 hover:bg-red-700"
        >
          Abmelden
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
