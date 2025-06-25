"use client";

// import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { SmileyIcon, LocationIcon, LetterIcon, BalanceIcon } from "@/components/Icons";

const repositories = Array(20).fill({
  name: "githubclone",
  description: "The GitHub clone is implemented in Go as a backend, the frontend is implemented in Next.js, the database is Postgres.",
  language: "TypeScript",
  license: "MIT License",
  updated: "Updated yesterday",
});

const StarsPage = () => {
//   const [search, setSearch] = useState("");

  return (
    <div className="mx-auto w-[800px] p-6 flex">
      {/* Linke Spalte (25%) */}
      <div className="w-[25%] pr-4">
        <div className="flex flex-col items-center">
          <img src="/avatar.jpg" alt="Avatar" className="w-[260px] h-[260px] rounded-full" />
          <Button variant="outline" className="mt-2 flex items-center">
            <SmileyIcon className="mr-2" /> Set status
          </Button>
        </div>

        <div className="mt-4">
          <h2 className="font-bold">Wolfgang</h2>
          <p className="text-gray-600">develloup · he/hom</p>
        </div>

        <p className="mt-4">I&apos;m a computer scientist</p>
        <Button asChild className="mt-2">
          <Link href="/edit-profile">Edit profile</Link>
        </Button>

        <div className="mt-4 flex items-center">
          <LocationIcon className="mr-2" />
          <span>Germany - Lower Saxony</span>
        </div>

        <div className="mt-2 flex items-center">
          <LetterIcon className="mr-2" />
          <span>develloup@web.de</span>
        </div>
      </div>

      {/* Rechte Spalte (75%) */}
      <div className="w-[75%] space-y-6">
        {/* "Lists (0)" & Sortier-Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Lists (0)</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Sort</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem><input type="checkbox" /> Name ascending (A-Z)</DropdownMenuItem>
              <DropdownMenuItem><input type="checkbox" /> Name descending (Z-A)</DropdownMenuItem>
              <DropdownMenuItem><input type="checkbox" /> Newest</DropdownMenuItem>
              <DropdownMenuItem><input type="checkbox" /> Oldest</DropdownMenuItem>
              <DropdownMenuItem><input type="checkbox" /> Last updated</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Button> Create list </Button>

        {/* Repository-Liste */}
        {repositories.map((repo, index) => (
          <div key={index}>
            <Card className="p-4">
              <h3 className="text-lg font-bold">{repo.name}</h3>
              <Button>Star</Button>
              <p>{repo.description}</p>
              <p>• {repo.language} <BalanceIcon /> {repo.license} • {repo.updated}</p>
            </Card>
            <hr className="my-4" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default StarsPage;
