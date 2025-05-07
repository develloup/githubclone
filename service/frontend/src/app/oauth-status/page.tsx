"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const OAuthStatus: React.FC = () => {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; username: string; email: string } | null>(null);
  const [oauthStatus, setOauthStatus] = useState<{ [key: string]: boolean }>({});
  const [oauthUrls, setOauthUrls] = useState<{ [key: string]: string } | null>(null);
  const [currentProvider, setCurrentProvider] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const response = await fetch("/api/loggedinuser");
      if (!response.ok) {
        router.push("/login");
        return;
      }
      setUser(await response.json());
    };

    fetchUser();
  }, [router]);

  useEffect(() => {
    const storedOauthUrls = localStorage.getItem("oauthUrls");
    if (storedOauthUrls) {
      setOauthUrls(JSON.parse(storedOauthUrls)); // ✅ OAuth-Links aus `localStorage` setzen
    }
  }, []);

  useEffect(() => {
    const checkOAuthStatus = async () => {
      const response = await fetch("/api/oauth-status");
      const statusData = await response.json();
      setOauthStatus(statusData);

      const nextProvider = Object.keys(statusData).find(provider => !statusData[provider]);
      if (nextProvider) {
        setCurrentProvider(nextProvider);
      } else {
        router.push("/dashboard"); // Falls alle erfolgreich, weiter zum Dashboard
      }
    };

    const interval = setInterval(checkOAuthStatus, 2000);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    if (currentProvider && oauthUrls) {
      window.location.href = oauthUrls[currentProvider]; // Automatische Weiterleitung zum nächsten Login
    }
  }, [currentProvider, oauthUrls]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">OAuth2 Status</h2>

        {user && (
          <div>
            <p className="text-lg font-semibold text-gray-700">👤 Eingeloggt als:</p>
            <p className="text-gray-600">{user.username}</p>
            <p className="text-gray-600">{user.email}</p>
          </div>
        )}

        {oauthStatus && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">OAuth2 Anmeldung:</h3>
            {Object.keys(oauthStatus).map((provider) => (
              <p key={provider} className={`text-sm ${oauthStatus[provider] ? "text-green-600" : "text-red-600"}`}>
                {oauthStatus[provider] ? `✅ ${provider} erfolgreich` : `❌ ${provider} ausstehend`}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OAuthStatus;
