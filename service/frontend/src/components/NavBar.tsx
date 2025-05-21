"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DropDownIcon, IssuesIcon, NewIcon, NotificationIcon, PullRequestIcon, SignInIcon, UserIcon } from "./Icons";
import { Sheet, SheetTitle, SheetTrigger, SheetContent, SheetDescription } from "@/components/ui/sheet";
import Image from "next/image";
import { SearchField } from "./SearchField";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import LeftMenu from "./LeftMenu";

type OAuthUser = {
  data: {
    viewer: {
      login: string;       // User name
      name: string;        // Full name
      email: string;       // Public email (if available)
      bio: string;         // Description / Biography
      avatarUrl: string;   // Avatar picture URL
      createdAt: string;   // Account creation date
      company?: string;    // Company or Organization (optional)
      location: string;    // User location
      websiteUrl?: string; // Personal website (optional)
    };
  };
};

const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [oauthStatus, setOauthStatus] = useState<{ [key: string]: boolean }>({});
  const [oauthUrls, setOauthUrls] = useState<{ [key: string]: string } | null>(null);
  const [oauthuser, setOAuthUser] = useState<{ [key:string]: OAuthUser}>({});


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

  
  useEffect(() => {
    if (Object.keys(oauthStatus).length === 0) return; // If oauthstatus is still empty
    fetch("/api/oauth/loggedinuser", { method: "GET", credentials: "include" })
      .then(async (res) => {
        const responseText = await res.text();
        console.log("🔍 Rohdaten vom Backend:", responseText); // Log zur Überprüfung

        if (!res.ok) throw new Error(`HTTP-Fehler ${res.status}: ${responseText}`);

        const parsedResponse: { [key: string]: OAuthUser } = JSON.parse(responseText); // API-Daten parsen

        // 🔄 **Alle Provider durchlaufen, um OAuthUser zu speichern**
        const updatedUsers: { [key: string]: OAuthUser } = { ...oauthuser };
        Object.entries(parsedResponse).forEach(([provider, userData]) => {
          if (userData?.data?.viewer) {
            updatedUsers[provider] = userData; // Speichert den OAuthUser unter dem Provider-Namen
          }
        });

        console.log("✅ Aktualisierte OAuthUser-Map:", updatedUsers);
        setOAuthUser(updatedUsers);
      })
      .catch((err) => console.error("❌ Fehler beim Abrufen der User-Daten:", err));
  }, [oauthStatus]);

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
      console.log("Provider:  ", provider)
      console.log("oauthUrls: ", oauthUrls)
      window.location.href = oauthUrls[provider];
    } else {
      console.log("❌ No OAuth URL found for provider:", provider);
    }
  };

  return (
    <div className="bg-gray-900 text-white">
      <nav className="flex items-center justify-between p-4 py-2 text-sm">
        {/* Left side: hamburger menu as a sheet */}
        <LeftMenu/>
        {/* 🔹 Logo & Nutzername */}
        <div className="flex items-center gap-6 ml-4">
          <Image src="/wolf-logo.png" alt="Wolf Logo" width={32} height={32} unoptimized />
          <span className="text-lg font-bold">WolfApp</span>
          {user && <span className="text-white">{user.username}</span>}
        </div>

        {/* 🔹 Right side: The search field and the navigation menu */}
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

        {/* 🔹 User menu as a sheet with the oauth status */}
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
              <VisuallyHidden>
                <SheetTitle><h2>Main Menu</h2></SheetTitle>
                <SheetDescription>The main user menu with user related functionality.</SheetDescription>
              </VisuallyHidden>

              {Object.keys(oauthuser).length > 0 && (
                <div className="flex flex-col gap-4">
                  {Object.keys(oauthuser).map((key) => {
                    const user = oauthuser[key].data.viewer;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <Image 
                          src={user.avatarUrl}
                          alt={user.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                          unoptimized={true} // Switches off optimization of external images
                        />
                        <p className="text-lg font-bold">{user.login}</p>
                      </div>

                    );
                  })}
                </div>
              )}

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
      <nav className="flex items-center justify-start  px-4 py-2  text-base">
        <Button variant="ghost" onClick={() => router.push("/overview")}>Overview</Button>
        <Button variant="ghost" onClick={() => router.push("/repositories")}>Repositories</Button>
        <Button variant="ghost" onClick={() => router.push("/projects")}>Projects</Button>
        <Button variant="ghost" onClick={() => router.push("/packages")}>Packages</Button>
        <Button variant="ghost" onClick={() => router.push("/stars")}>Stars</Button>
      </nav>
    </div>
  );
};

export default Navbar;

