"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DropDownIcon, IssuesIcon, NewIcon, NotificationIcon, PullRequestIcon, SignInIcon } from "./Icons";
import Image from "next/image";
import { SearchField } from "./SearchField";
import LeftMenu from "./LeftMenu";
import RightMenu from "./RightMenu";
import NavigationMenu from "./NavigationMenu";
import { OAuthUser } from "@/types/typesUser";
import { User } from "@/types/typesUser";
import { fetchWithAuth } from "@/lib/fetchWithAuth";


const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User>(null);
  const [oauthStatus, setOauthStatus] = useState<{ [key: string]: boolean }>({});
  const [oauthUrls, setOauthUrls] = useState<{ [key: string]: string } | null>(null);
  const [oauthuser, setOAuthUser] = useState<{ [key:string]: OAuthUser}>({});


  // Function for OAuth status and to load URL
  const fetchOAuthStatus = async () => {
    // console.log("Fetching OAuth status...");
    const response = await fetch("/api/oauth-status", { credentials: "include" });

    if (response.ok) {
      const statusData = await response.json();
      // console.log("OAuth status loaded:", statusData);
      setOauthStatus(statusData);
    } else {
      console.log("Failed to fetch OAuth status.");
    }
  };

  const fetchOAuthUrls = async () => {
    // console.log("Fetching OAuth provider URLs...");
    const response = await fetch("/api/oauth-urls", { credentials: "include" });

    if (response.ok) {
      const urls = await response.json();
      // console.log("OAuth URLs loaded:", urls);
      setOauthUrls(urls);
      localStorage.setItem("oauthUrls", JSON.stringify(urls));
    } else {
      console.log("Failed to fetch OAuth URLs.");
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      // console.log("Fetching user data...");
      const response = await fetchWithAuth("/api/loggedinuser", { credentials: "include" });

      if (response.ok) {
        const userData = await response.json();
        // console.log("User data loaded:", userData);
        setUser(userData);

        // After login request OAuth data
        fetchOAuthStatus();
        fetchOAuthUrls();
      } else {
        console.log("No user logged in.");
        setUser(null);
      }
    };

    fetchUser();
  }, [pathname]);

  useEffect(() => {
    // console.log("Checking stored OAuth URLs...");
    const storedOauthUrls = localStorage.getItem("oauthUrls");

    if (storedOauthUrls) {
      // console.log("Loaded OAuth URLs from localStorage:", storedOauthUrls);
      setOauthUrls(JSON.parse(storedOauthUrls));
    } else {
      // console.log("No OAuth URLs found in localStorage.");
      fetchOAuthUrls();
    }
  }, []);

  
  useEffect(() => {
    if (Object.keys(oauthStatus).length === 0) return; // If oauthstatus is still empty
    fetchWithAuth("/api/oauth/loggedinuser", { method: "GET", credentials: "include" })
      .then(async (res) => {
        const responseText = await res.text();
        // console.log("Raw data from backend:", responseText);

        if (!res.ok) throw new Error(`HTTP-Fehler ${res.status}: ${responseText}`);

        const parsedResponse: { [key: string]: OAuthUser } = JSON.parse(responseText); // Parse API data

        // Run through all provider to save OAuthUser
        const updatedUsers: { [key: string]: OAuthUser } = { ...oauthuser };
        Object.entries(parsedResponse).forEach(([provider, userData]) => {
          if (userData?.data?.viewer) {
            updatedUsers[provider] = userData; // Saves the OAuthUser under the provider name
          }
        });

        // console.log("Updated OAuthUser map", updatedUsers);
        setOAuthUser(updatedUsers);
      })
      .catch((err) => console.error("Error during request of user data: ", err));
  }, [oauthStatus]);

  const handleLogout = async () => {
    // console.log("Logging out...");
    await fetch("/api/logout", { method: "POST", credentials: "include" });

    document.cookie = "session_id=; Max-Age=0";
    localStorage.removeItem("oauth_status");
    setUser(null);
    setOauthStatus({});

    // console.log("Logout completed. Redirecting to login...");
    router.push("/login");
  };

  const handleOAuthLogin = (provider: string) => {
    console.log(`🔹 Attempting OAuth login for provider: ${provider}`);

    if (oauthUrls && oauthUrls[provider]) {
      // console.log("Redirecting to OAuth login URL:", oauthUrls[provider]);
      // console.log("Provider:  ", provider)
      // console.log("oauthUrls: ", oauthUrls)
      window.location.href = oauthUrls[provider];
    } else {
      console.log("No OAuth URL found for provider:", provider);
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full shadow-md z-50 bg-gray-900 text-white">
      <nav className="flex items-center justify-between p-4 py-2 text-sm">
        {/* Left side: hamburger menu as a sheet */}
        <LeftMenu/>
        {/* 🔹 Logo & username */}
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
          <RightMenu 
            user={user}
            oauthUrls={oauthUrls || {}}
            oauthStatus={oauthStatus}
            oauthuser={oauthuser}
            handleOAuthLogin={handleOAuthLogin}
            handleLogout={handleLogout}
          />
        )}

      </nav>
      <NavigationMenu/>
    </div>
  );
};

export default Navbar;

