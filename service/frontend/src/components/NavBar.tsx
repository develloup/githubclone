"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import Image from "next/image";

const MenuIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7H4" />
    <path d="M20 12H4" />
    <path d="M20 17H4" />
  </svg>
);

const NewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 12H18M12 6V18"/>
  </svg>
);

const DropDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M11.808 14.77L8.0936 10.3126C7.65938 9.79159 8.02988 9.0005 8.70815 9.0005H15.2921C15.9703 9.0005 16.3409 9.79159 15.9067 10.3126L12.1923 14.77C12.0923 14.89 11.9081 14.89 11.808 14.77Z" fill="currentColor"/>
    </svg>
);

const IssuesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path fillRule="evenodd" d="M2.5 12a9.5 9.5 0 1119 0 9.5 9.5 0 01-19 0zM12 1C5.925 1 1 5.925 1 12s4.925 11 11 11 11-4.925 11-11S18.075 1 12 1zm0 13a2 2 0 100-4 2 2 0 000 4z"></path>
  </svg>
);



const PullRequestIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path fillRule="evenodd" d="M4.75 3a1.75 1.75 0 100 3.5 1.75 1.75 0 000-3.5zM1.5 4.75a3.25 3.25 0 116.5 0 3.25 3.25 0 01-6.5 0zM4.75 17.5a1.75 1.75 0 100 3.5 1.75 1.75 0 000-3.5zM1.5 19.25a3.25 3.25 0 116.5 0 3.25 3.25 0 01-6.5 0zm17.75-1.75a1.75 1.75 0 100 3.5 1.75 1.75 0 000-3.5zM16 19.25a3.25 3.25 0 116.5 0 3.25 3.25 0 01-6.5 0z"></path>
    <path fillRule="evenodd" d="M4.75 7.25A.75.75 0 015.5 8v8A.75.75 0 014 16V8a.75.75 0 01.75-.75zm8.655-5.53a.75.75 0 010 1.06L12.185 4h4.065A3.75 3.75 0 0120 7.75v8.75a.75.75 0 01-1.5 0V7.75a2.25 2.25 0 00-2.25-2.25h-4.064l1.22 1.22a.75.75 0 01-1.061 1.06l-2.5-2.5a.75.75 0 010-1.06l2.5-2.5a.75.75 0 011.06 0z"></path>
  </svg>
);

const NotificationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path fillRule="evenodd" clipRule="evenodd" d="M8.87378 18.6934C9.28799 18.6934 9.62378 19.0291 9.62378 19.4434C9.62378 19.6166 9.66765 19.7955 9.76263 19.9722C9.85831 20.15 10.0063 20.3258 10.21 20.4827C10.4138 20.6396 10.6653 20.7712 10.9534 20.8631C11.2413 20.955 11.5544 21.0035 11.8734 21.0035C12.1923 21.0035 12.5054 20.955 12.7933 20.8631C13.0814 20.7712 13.3329 20.6396 13.5367 20.4827C13.7404 20.3258 13.8884 20.15 13.9841 19.9722C14.0791 19.7955 14.1229 19.6166 14.1229 19.4434C14.1229 19.0291 14.4587 18.6934 14.8729 18.6934C15.2871 18.6934 15.6229 19.0291 15.6229 19.4434C15.6229 19.8769 15.5116 20.2987 15.3051 20.6827C15.0993 21.0653 14.8054 21.3989 14.452 21.6711C14.0987 21.9431 13.6889 22.1519 13.2492 22.2922C12.8093 22.4325 12.3422 22.5035 11.8734 22.5035C11.4045 22.5035 10.9374 22.4325 10.4975 22.2922C10.0578 22.1519 9.64798 21.9431 9.29471 21.6711C8.94129 21.3989 8.64739 21.0653 8.44158 20.6827C8.23509 20.2987 8.12378 19.8769 8.12378 19.4434C8.12378 19.0291 8.45957 18.6934 8.87378 18.6934Z"></path>
    <path fillRule="evenodd" clipRule="evenodd" d="M8.28966 2.36993C10.5476 1.24631 13.1934 1.20809 15.4828 2.26601L15.6874 2.36056C18.0864 3.46909 19.6223 5.87083 19.6223 8.51353L19.6223 9.82417C19.6223 10.8777 19.8519 11.9185 20.2951 12.8742L20.5598 13.445C21.7754 16.0663 20.1923 19.1303 17.3509 19.6555L17.2146 18.918L17.3509 19.6555L17.1907 19.6851C13.6756 20.3349 10.0711 20.3349 6.55594 19.6851C3.6763 19.1529 2.15285 15.967 3.54631 13.3914L3.77272 12.9729C4.3316 11.9399 4.62426 10.7839 4.62426 9.60942L4.62426 8.28813C4.62426 5.77975 6.04397 3.48746 8.28966 2.36993ZM14.8536 3.62766C12.9772 2.76057 10.8086 2.7919 8.95794 3.71284C7.22182 4.57679 6.12426 6.34893 6.12426 8.28813L6.12426 9.60942C6.12426 11.0332 5.76949 12.4345 5.09201 13.6867L4.86561 14.1052C3.95675 15.785 4.95039 17.863 6.82857 18.2101C10.1635 18.8265 13.5832 18.8265 16.9181 18.2101L17.0783 18.1805C18.9561 17.8334 20.0024 15.8084 19.199 14.076L18.9343 13.5053C18.3994 12.3518 18.1223 11.0956 18.1223 9.82416L18.1223 8.51353C18.1223 6.45566 16.9263 4.58543 15.0582 3.72221L14.8536 3.62766Z"></path>
  </svg>
);



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
          <Button variant="ghost" className="rounded-lg border border-gray-500 p-2">
            <MenuIcon /> {/* ✅ SVG-Hamburger-Icon ersetzt den Text */}
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <p className="font-bold">📌 Seiten</p>
          <Button variant="ghost" onClick={() => router.push("/dashboard")}>Dashboard</Button>
          <Button variant="ghost" onClick={() => router.push("/profile")}>Profil</Button>
        </SheetContent>
      </Sheet>

      {/* 🔹 Logo & Nutzername */}
      <div className="flex items-center gap-4">
        <Image src="/wolf-logo.png" alt="Wolf Logo" width={32} height={32} unoptimized />
        <span className="text-lg font-bold">WolfApp</span>
        {user && <span className="text-white">{user.username}</span>}
      </div>

      {/* 🔹 Rechte Seite: Suchfeld & Navigation-Menü */}
      <div className="flex items-center gap-4 ml-auto">
        <div className="relative flex items-center">
          <Input placeholder="Type / to search" className="bg-gray-800 text-white border border-gray-500 rounded-lg" />
        </div>
        {/* 🔹 Weitere Buttons für Issues, Pulls & Notifications */}
        <Button variant="ghost" onClick={() => router.push("/new")} className="rounded-lg border border-gray-500 p-2"><NewIcon/><div className="w-px h-full bg-gray-500"></div> {/* 🔹 Trennlinie */}<DropDownIcon/></Button>
        <Button variant="ghost" onClick={() => router.push("/issues")} className="rounded-lg border border-gray-500 p-2"><IssuesIcon/></Button>
        <Button variant="ghost" onClick={() => router.push("/pulls")} className="rounded-lg border border-gray-500 p-2"><PullRequestIcon/></Button>
        <Button variant="ghost" onClick={() => router.push("/notifications")} className="rounded-lg border border-gray-500 p-2"><NotificationIcon/></Button>
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
