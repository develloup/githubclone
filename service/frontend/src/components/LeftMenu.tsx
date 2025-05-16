import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { MenuIcon, HomeIcon, IssuesIcon, PullRequestIcon, ProjectIcon, DiscussionIcon, MagnifierIcon, ArrowUpThinIcon } from "./Icons";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export default function LeftMenu() {
  const [leftOpen, setLeftOpen] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const pathname = usePathname(); // Gets the current route

  useEffect(() => {
    setLeftOpen(false); // Closes the sheet if the path changes
  }, [pathname]);

  return (
    <Sheet open={leftOpen} onOpenChange={(isOpen) => setLeftOpen(isOpen)}>
        <SheetTrigger asChild>
        <Button variant="ghost" className="rounded-lg border border-gray-500 p-2">
            <MenuIcon />
        </Button>
        </SheetTrigger>
        <SheetContent side="left" className="rounded-lg">
        <VisuallyHidden>
            <SheetTitle><h2>Main Menu</h2></SheetTitle>
            <SheetDescription>The main menu to reach normal functionality.</SheetDescription>
        </VisuallyHidden>
        <div className="flex flex-col space-y-1 mt-1">
            {/* 🔹 Wolf-Logo, linksbündig mit einer Leerzeile danach */}
            <div className="flex justify-start my-3 pl-3">
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
        {/* 🔹 Repositories-Überschrift mit Icon rechts */}
        <div className="flex items-center">
            <span className="text-xs font-semibold pl-3">Repositories</span> {/* Smaller font size */}
            {!showFilter && (
                <Button
                    variant="ghost"
                    onClick={() => setShowFilter(!showFilter)}
                    className={`w-4 h-4 text-gray-500 transition-opacity duration-300 ml-auto mr-3 ${showFilter ? "opacity-0" : "opacity-100"}`}
                >
                    <MagnifierIcon className="w-4 h-4 text-gray-500" />
                </Button>
            )}
        </div>

        {/* Dynamic filter line */}
        {showFilter && (
        <div className="flex items-center gap-2 mt-1 mr-3 pl-3">
            <Input placeholder="🔍 Filter repositories" className="flex-grow text-sm" />
            <Button
                variant="ghost"
                onClick={() => setShowFilter(false)}
                className={`transition-opacity duration-300 ${showFilter ? "opacity-100" : "opacity-0"}`}
            >
                <ArrowUpThinIcon className="text-gray-500 w-5 h-5" />
            </Button>
        </div>
        )}
        </SheetContent>
    </Sheet>
  );
}
