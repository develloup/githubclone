"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { SmileyIcon, LocationIcon, LetterIcon, StarIcon, BalanceIcon } from "@/components/Icons";

const repositories = Array(8).fill({
  name: "githubclone",
  description: "The GitHub clone is implemented in Go as a backend, the frontend is implemented in Next.js, the database is Postgres.",
  language: "TypeScript",
  license: "MIT License",
  updated: "Updated yesterday",
});

const RepositoriesPage = () => {
  const [search, setSearch] = useState("");

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
        {/* Suchbox & Filter-Buttons */}
        <div className="flex items-center space-x-4">
          <Input placeholder="Search repositories..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline">Type</Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>All</DropdownMenuItem>
              <DropdownMenuItem>Public</DropdownMenuItem>
              <DropdownMenuItem>Private</DropdownMenuItem>
              <DropdownMenuItem>Sources</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline">Language</Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>All</DropdownMenuItem>
              <DropdownMenuItem>TypeScript</DropdownMenuItem>
              <DropdownMenuItem>Python</DropdownMenuItem>
              <DropdownMenuItem>RobotFramework</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline">Sort</Button></DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Last updated</DropdownMenuItem>
              <DropdownMenuItem>Name</DropdownMenuItem>
              <DropdownMenuItem>Stars</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button asChild><Link href="/new">New</Link></Button>
        </div>

        {/* Repository Cards */}
        {repositories.map((repo, index) => (
          <div key={index}>
            <Card className="p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">{repo.name}</h3>
                <span className="text-sm bg-gray-300 px-2 py-1 rounded">Public</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center">
                    <StarIcon className="mr-2" /> Star
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem>Future ideas</DropdownMenuItem>
                  <DropdownMenuItem>My stack</DropdownMenuItem>
                  <DropdownMenuItem>Inspiration</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <p className="text-gray-600">{repo.description}</p>
              <p className="text-sm mt-2">• {repo.language} <BalanceIcon className="mx-2" /> {repo.license} • {repo.updated}</p>
            </Card>
            <hr className="my-4" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default RepositoriesPage;
