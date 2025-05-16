"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DiscussionIcon, DropDownIcon, HomeIcon, IssuesIcon, MagnifierIcon, MenuIcon, NewIcon, NotificationIcon, ProjectIcon, PullRequestIcon, SignInIcon, UserIcon } from "./Icons";
import { Sheet, SheetTitle, SheetTrigger, SheetContent, SheetDescription, SheetHeader } from "@/components/ui/sheet";
import Image from "next/image";
import { SearchField } from "./SearchField";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import Link from "next/link";
import { Input } from "./ui/input";

const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
  const [oauthStatus, setOauthStatus] = useState<{ [key: string]: boolean }>({});
  const [oauthUrls, setOauthUrls] = useState<{ [key: string]: string } | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [leftOpen, setLeftOpen] = useState(false);


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
    setLeftOpen(false); /* close the left sheet on every page change */
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
        <Sheet open={leftOpen} onOpenChange={(isOpen) => setLeftOpen(isOpen)}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="rounded-lg border border-gray-500 p-2">
              <MenuIcon />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <VisuallyHidden>
              <SheetTitle><h2>Main Menu</h2></SheetTitle>
              <SheetDescription>The main menu to reach normal functionality.</SheetDescription>
            </VisuallyHidden>
            <div className="flex flex-col space-y-1 mt-1">
              {/* 🔹 Wolf-Logo, linksbündig mit einer Leerzeile danach */}
              <div className="flex justify-start mb-3" pl-6> {/* `mb-3` für Abstand zum ersten Item */}
                <Image src="/wolf-logo.png" alt="Wolf Logo" width={40} height={40} unoptimized />
              </div>
              <Link href="/dashboard" passHref onClick={() => setLeftOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-left pl-3"><HomeIcon/>Home</Button>
              </Link>
              <Link href="/issues" passHref onClick={() => setLeftOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-left pl-3"><IssuesIcon/>Issues</Button>
              </Link>
              <Link href="/pulls" passHref onClick={() => setLeftOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-left pl-3"><PullRequestIcon/>Pull requests</Button>
              </Link>
              <Link href="/projects" passHref onClick={() => setLeftOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-left pl-3"><ProjectIcon/>Projects</Button>
              </Link>
              <Link href="/discussions" passHref onClick={() => setLeftOpen(false)}>
                <Button variant="ghost" className="w-full justify-start text-left pl-3"><DiscussionIcon/>Discussions</Button>
              </Link>
            </div>
            <div className="h-px bg-gray-400 mt-0 my-1 mx-2" />
            <SheetHeader>
              {/* 🔹 Titel + Filter-Icon */}
              <div className="flex justify-between items-center">
                <SheetTitle className="text-sm font-semibold">Repositories</SheetTitle>
                <Button variant="ghost" onClick={() => setShowFilter(!showFilter)}>
                  <MagnifierIcon className="w-4 h-4 text-gray-500" />
                </Button>
              </div>
            </SheetHeader>
            {/* Dynamic filter line */}
            {showFilter && (
              <div className="flex items-center gap-2 mt-2 border p-2 rounded-md">
                <MagnifierIcon className="text-gray-500 w-5 h-5" />
                <Input placeholder="Filter repositories" className="flex-grow" />
                <Button variant="ghost" onClick={() => setShowFilter(false)}>
                  <MagnifierIcon className="text-gray-500 w-5 h-5" />
                </Button>
              </div>
            )}
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
              <VisuallyHidden>
                <SheetTitle><h2>Main Menu</h2></SheetTitle>
                <SheetDescription>The main user menu with user related functionality.</SheetDescription>
              </VisuallyHidden>
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
