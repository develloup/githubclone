"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { SmileyIcon, LocationIcon, LetterIcon } from "@/components/Icons";

const repositories = [
  { name: "githubclone", forked: "conan-io/python-patch-ng", description: "Library to parse and apply unified diffs", language: "Python" },
  { name: "githubclone", forked: "conan-io/python-patch-ng", description: "Library to parse and apply unified diffs", language: "Python" },
  { name: "githubclone", forked: "conan-io/python-patch-ng", description: "Library to parse and apply unified diffs", language: "Python" },
  { name: "githubclone", forked: "conan-io/python-patch-ng", description: "Library to parse and apply unified diffs", language: "Python" },
];

const ProfilePage = () => {
  const [year, setYear] = useState(2025);

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
        {/* Repositories Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Popular repositories</h2>
          <Button variant="outline">Customize your pins</Button>
        </div>

        {/* Repository Cards */}
        <div className="grid grid-cols-2 gap-4">
          {repositories.map((repo, index) => (
            <Card key={index} className="p-4">
              <h3 className="text-lg font-bold">{repo.name} <span className="text-sm bg-gray-300 px-2 py-1 rounded">Public</span></h3>
              {repo.forked && <p className="text-gray-500 text-sm">forked from {repo.forked}</p>}
              <p className="text-gray-600">{repo.description}</p>
              <p className="text-sm mt-2">• {repo.language}</p>
            </Card>
          ))}
        </div>

        {/* Contributions */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">10 contributions in the last year</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Contribution settings</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Private contributions</DropdownMenuItem>
              <DropdownMenuItem>Activity overview</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Contribution Heatmap */}
        <div className="flex">
          <Card className="w-[90%] p-6">🔥 Heatmap goes here</Card>
          <div className="flex flex-col ml-4 space-y-2">
            {[2025, 2024, 2023].map((yr) => (
              <Button key={yr} variant={year === yr ? "default" : "outline"} onClick={() => setYear(yr)}>
                {yr}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
