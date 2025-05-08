"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";

const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [oauthStatus, setOauthStatus] = useState<{ [key: string]: boolean }>({});
  const [oauthUrls, setOauthUrls] = useState<{ [key: string]: string } | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null); // ✅ Referenz für das User-Menü

  const fetchUser = async () => {
    const response = await fetch("/api/loggedinuser", { credentials: "include" });
    if (response.ok) {
      setUser(await response.json());
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  useEffect(() => {
    const fetchOAuthStatus = async () => {
      const response = await fetch("/api/oauth-status", { credentials: "include" });
      if (response.ok) {
        setOauthStatus(await response.json());
      }
    };

    const storedOauthUrls = localStorage.getItem("oauthUrls");
    if (storedOauthUrls) {
      setOauthUrls(JSON.parse(storedOauthUrls));
    }

    fetchOAuthStatus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false); // ✅ Schließt das Menü, wenn außerhalb geklickt wird
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    document.cookie = "session_id=; Max-Age=0";
    setUser(null);
    router.push("/login");
  };

  return (
    <nav className="flex items-center justify-between p-4 bg-gray-900 text-white">
      {/* 🔹 Linke Seite: Menü-Button, Logo & Nutzername */}
      <div className="flex items-center gap-4">
        <button onClick={() => setMenuOpen(!menuOpen)} className="text-xl">☰</button>
        <img src="/wolf-logo.png" alt="Wolf Logo" className="h-8 w-8" />
        <span className="text-lg font-bold">WolfApp</span>
        {user && <span className="text-white">{user.username}</span>}
      </div>

      {/* 🔹 Rechte Seite: Suchfeld & Buttons */}
      <div className="flex items-center gap-4 ml-auto">
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Type / to search"
            className="px-3 py-1 bg-gray-800 text-white rounded-md focus:outline-none"
          />
          <span className="absolute right-2 text-gray-400">🔍</span>
        </div>

        <button className="mx-2">➕</button>
        <button onClick={() => router.push("/issues")} className="mx-2">⬤</button>
        <button className="mx-2">🔄</button>
        <button className="mx-2">🔔</button>

        {!user ? (
          <button onClick={() => router.push("/login")} className="bg-green-600 px-3 py-1 rounded hover:bg-green-700">
            Sign in
          </button>
        ) : (
          <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="mx-2">⚙️</button>
        )}
      </div>

      {/* 🔹 User-Menü mit Logout & OAuth-Status */}
      {user && userMenuOpen && (
        <div ref={userMenuRef} className="absolute top-12 right-4 bg-gray-800 w-48 p-4 shadow-lg">
          <p className="text-white">{user.username}</p>
          <hr className="my-2 border-gray-600" />

          <button onClick={() => router.push("/settings")} className="block my-2">⚙️ Einstellungen</button>
          <button onClick={handleLogout} className="block my-2">🚪 Logout</button>

          {oauthUrls && (
            <div className="flex flex-col gap-2">
              {Object.keys(oauthUrls).map((provider) => (
                <div key={provider} className="flex items-center gap-2">
                  {oauthStatus[provider] ? <span>✅ {provider}</span> : null} 
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🔹 Seiten-Menü */}
      {menuOpen && (
        <div className="absolute top-12 left-0 bg-gray-800 w-64 p-4 shadow-lg">
          <p className="font-bold">📌 Seiten</p>
          <button onClick={() => router.push("/dashboard")} className="block my-2">Dashboard</button>
          <button onClick={() => router.push("/profile")} className="block my-2">Profil</button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
