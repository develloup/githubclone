"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import Image from "next/image"

const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [oauthStatus, setOauthStatus] = useState<{ [key: string]: boolean }>({});
  const [oauthUrls, setOauthUrls] = useState<{ [key: string]: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const response = await fetch("/api/loggedinuser", { credentials: "include" });
      if (response.ok) {
        setUser(await response.json());
      } else {
        setUser(null);
      }
    };

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

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    document.cookie = "session_id=; Max-Age=0";
    setUser(null);
    router.push("/login");
  };

  const handleOAuthLogin = (provider: string) => {
    if (oauthUrls && oauthUrls[provider]) {
      window.location.href = oauthUrls[provider]; // ✅ Startet den OAuth-Login-Prozess
    }
  };

  return (
    <nav className="flex items-center justify-between p-4 bg-gray-900 text-white">
      {/* 🔹 Linke Seite: Hamburger Menü als Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost">☰</Button>
        </SheetTrigger>
        <SheetContent side="left">
          <p className="font-bold">📌 Seiten</p>
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>Dashboard</Button>
          <Button variant="ghost" onClick={() => router.push("/profile")}>Profil</Button>
        </SheetContent>
      </Sheet>

      {/* 🔹 Logo & Nutzername */}
      <div className="flex items-center gap-4">
        <Image src="wolf-logo.png" alt="Wolf Logo" width={32} height={32} />
        <span className="text-lg font-bold">WolfApp</span>
        {user && <span className="text-white">{user.username}</span>}
      </div>

      {/* 🔹 Rechte Seite: Suchfeld & Navigation-Menü */}
      <div className="flex items-center gap-4 ml-auto">
        <div className="relative flex items-center">
          <Input placeholder="Type / to search" className="bg-gray-800 text-white" />
        </div>
        {/* 🔹 Weitere Buttons für Issues, Pulls & Notifications */}
        <Button variant="ghost" onClick={() => router.push("/issues")}>⬤</Button>
        <Button variant="ghost" onClick={() => router.push("/pulls")}>🔄</Button>
        <Button variant="ghost" onClick={() => router.push("/notifications")}>🔔</Button>
       </div>

      {/* 🔹 User-Menü als Sheet mit OAuth-Status */}
      {!user ? (
        <Button onClick={() => router.push("/login")} variant="default">Sign in</Button>
      ) : (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost">⚙️</Button>
          </SheetTrigger>
          <SheetContent side="right">
            <p className="text-lg font-bold">{user.username}</p>
            <Button variant="ghost" onClick={() => router.push("/settings")}>⚙️ Einstellungen</Button>
            <Button variant="ghost" onClick={handleLogout}>🚪 Logout</Button>

            <hr className="my-2 border-gray-600" />
            <p className="font-bold">OAuth Status</p>
            {oauthUrls && (
              <div className="flex flex-col gap-2">
                {Object.keys(oauthUrls).map((provider) => (
                  <div key={provider} className="flex items-center gap-2 cursor-pointer" onClick={() => handleOAuthLogin(provider)}>
                    {oauthStatus[provider] ? <span>✅ {provider}</span> : <span>❌ {provider}</span>}
                  </div>
                ))}
              </div>
            )}
          </SheetContent>
        </Sheet>
      )}
    </nav>
  );
};

export default Navbar;
