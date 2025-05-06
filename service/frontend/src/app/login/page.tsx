"use client"

import React, { useState } from "react";

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [oauthUrls, setOauthUrls] = useState<{ [key: string]: string } | null>(null);

  const handleLogin = async () => {
    const response = await fetch("http://localhost:8080/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await response.json();
    if (data.oauth_login_urls) {
      setOauthUrls(data.oauth_login_urls);
    } else {
      alert("Login failed!");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-6 bg-white shadow-md rounded-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Login</h2>
        <input
          type="text"
          placeholder="Email oder Username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="w-full px-4 py-2 mb-3 border rounded-md focus:outline-none"
        />
        <input
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 mb-3 border rounded-md focus:outline-none"
        />
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Login
        </button>

        {oauthUrls && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">OAuth2 Anmeldung:</h3>
            {Object.keys(oauthUrls).map((provider) => (
              <a
                key={provider}
                href={oauthUrls[provider]}
                className="block px-4 py-2 mt-2 text-white bg-gray-800 rounded-md hover:bg-gray-900"
              >
                {`Mit ${provider} anmelden`}
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
