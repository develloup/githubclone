"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DropDownIcon, IssuesIcon, MenuIcon, NewIcon, NotificationIcon, PullRequestIcon, SignInIcon, UserIcon } from "./Icons";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import Image from "next/image";
import { SearchField } from "./SearchField";

const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [oauthStatus, setOauthStatus] = useState<{ [key: string]: boolean }>({});
  const [oauthUrls, setOauthUrls] = useState<{ [key: string]: string } | null>(null);

  // ✅ Funktion für OAuth-Status- und URLs-Laden
  const fetchOAuthStatus = async () => {
    console.log("🔹 Fetching OAuth status...");
    const response = await fetch("/api/oauth-status", { credentials: "include" });

    if (response.ok) {
      const statusData = await response.json();
      console.log("✅ OAuth status loaded:", statusData);
      setOauthStatus(statusData);
    } else {
      console.log("❌ Failed to fetch OAuth status.");
    }
  };

  const fetchOAuthUrls = async () => {
    console.log("🔹 Fetching OAuth provider URLs...");
    const response = await fetch("/api/oauth-urls", { credentials: "include" });

    if (response.ok) {
      const urls = await response.json();
      console.log("✅ OAuth URLs loaded:", urls);
      setOauthUrls(urls);
      localStorage.setItem("oauthUrls", JSON.stringify(urls));
    } else {
      console.log("❌ Failed to fetch OAuth URLs.");
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      console.log("🔹 Fetching user data...");
      const response = await fetch("/api/loggedinuser", { credentials: "include" });

      if (response.ok) {
        const userData = await response.json();
        console.log("✅ User data loaded:", userData);
        setUser(userData);

        // ✅ Direkt nach Login OAuth-Daten abrufen
        fetchOAuthStatus();
        fetchOAuthUrls();
      } else {
        console.log("❌ No user logged in.");
        setUser(null);
      }
    };

    fetchUser();
  }, [pathname]);

  useEffect(() => {
    console.log("🔹 Checking stored OAuth URLs...");
    const storedOauthUrls = localStorage.getItem("oauthUrls");

    if (storedOauthUrls) {
      console.log("✅ Loaded OAuth URLs from localStorage:", storedOauthUrls);
      setOauthUrls(JSON.parse(storedOauthUrls));
    } else {
      console.log("❌ No OAuth URLs found in localStorage.");
      fetchOAuthUrls();
    }
  }, []);

  const handleLogout = async () => {
    console.log("🔹 Logging out...");
    await fetch("/api/logout", { method: "POST", credentials: "include" });

    document.cookie = "session_id=; Max-Age=0";
    localStorage.removeItem("oauth_status");
    setUser(null);
    setOauthStatus({});

    console.log("✅ Logout completed. Redirecting to login...");
    router.push("/login");
  };

  const handleOAuthLogin = (provider: string) => {
    console.log(`🔹 Attempting OAuth login for provider: ${provider}`);

    if (oauthUrls && oauthUrls[provider]) {
      console.log("✅ Redirecting to OAuth login URL:", oauthUrls[provider]);
      window.location.href = oauthUrls[provider];
    } else {
      console.log("❌ No OAuth URL found for provider:", provider);
    }
  };

  return (
    <nav className="flex items-center justify-between p-4 bg-gray-900 text-white">
      {/* 🔹 Linke Seite: Hamburger Menü als Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" className="rounded-lg border border-gray-500 p-2">
            <MenuIcon />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <p className="font-bold">📌 Seiten</p>
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>Dashboard</Button>
          <Button variant="ghost" onClick={() => router.push("/profile")}>Profil</Button>
        </SheetContent>
      </Sheet>

      {/* 🔹 Logo & Nutzername */}
      <div className="flex items-center gap-6 ml-4">
        <Image src="/wolf-logo.png" alt="Wolf Logo" width={32} height={32} unoptimized />
        <span className="text-lg font-bold">WolfApp</span>
        {user && <span className="text-white">{user.username}</span>}
      </div>

      {/* 🔹 Rechte Seite: Suchfeld & Navigation-Menü */}
      <div className="flex items-center gap-4 ml-auto">
        <SearchField />

        <Button variant="ghost" onClick={() => router.push("/new")} className="rounded-lg border border-gray-500 p-2">
          <NewIcon />
          <div className="w-px h-full bg-gray-500"></div>
          <DropDownIcon />
        </Button>
        <Button variant="ghost" onClick={() => router.push("/issues")} className="rounded-lg border border-gray-500 p-2"><IssuesIcon /></Button>
        <Button variant="ghost" onClick={() => router.push("/pulls")} className="rounded-lg border border-gray-500 p-2"><PullRequestIcon /></Button>
        <Button variant="ghost" onClick={() => router.push("/notifications")} className="rounded-lg border border-gray-500 p-2"><NotificationIcon /></Button>
      </div>

      {/* 🔹 User-Menü als Sheet mit OAuth-Status */}
      {!user ? (
        <Button onClick={() => router.push("/login")} variant="ghost" className="rounded-lg border border-gray-500 p-2 ml-4">
          <SignInIcon />
        </Button>
      ) : (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="rounded-lg p-2 ml-4">
              <UserIcon />
            </Button>
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
