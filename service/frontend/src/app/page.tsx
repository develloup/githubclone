"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { RepositoryIcon } from "@/components/Icons";
import { MoreHorizontal } from "lucide-react";

const username = "develloup";
const repositories = [
  { name: "Repo 1", href: "/repo1" },
  { name: "Repo 2", href: "/repo2" },
  { name: "Repo 3", href: "/repo3" },
];

const StartPage = () => {
  return (
<div className="flex min-h-screen justify-center">
  {/* Sidebar mit Hintergrund + Trennlinie */}
  <div className="w-72 bg-gray-100 p-4 shrink-0 h-full flex flex-col border-r border-gray-400">
    <aside className="flex flex-col w-64 bg-muted h-[calc(100vh-4rem)] pt-4 sticky">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-bold">Top repositories</h2>
        <Link href="/new">
          <Button variant="outline">New</Button>
        </Link>
      </div>
      <Input placeholder="Find a repository..." className="mt-4" />
      <ul className="mt-4 space-y-2">
        {repositories.map(({ name, href }) => (
          <li key={href} className="flex items-center space-x-2">
            <RepositoryIcon />
            <Link href={href} className="text-blue-600 hover:underline">{name}</Link>
          </li>
        ))}
      </ul>
      <p className="text-sm text-gray-500 mt-4 cursor-pointer hover:underline">Show more</p>
    </aside>
  </div>

  {/* Hauptinhalt mit festgelegten Abständen */}
<main className="flex-1 p-6 max-w-[960px] mx-auto grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-[auto_300px] gap-x-4 gap-y-6">
  <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-6 min-h-[420px] items-start">
    <Card className="w-[300px] h-[200px] flex">
      <CardHeader>Card 1</CardHeader>
      <CardContent>Inhalt für Card 1</CardContent>
    </Card>
    <Card className="w-[300px] h-[200px] flex">
      <CardHeader>Card 2</CardHeader>
      <CardContent>Inhalt für Card 2</CardContent>
    </Card>
    <Card className="w-[300px] h-[400px] flex">
      <div className="flex justify-between items-center">
        <CardHeader>Start a new repository</CardHeader>
        <Button variant="ghost">
          <MoreHorizontal />
        </Button>
      </div>
      <CardContent>
        Kickstart your coding journey with a fresh repository.
        <Link href="/new" className="text-blue-600 hover:underline">Create Repository</Link>
      </CardContent>
    </Card>
    <Card className="w-[300px] h-[400px] flex">
      <div className="flex justify-between items-center">
        <CardHeader>Introduce yourself with a profile README</CardHeader>
        <Button variant="ghost">
          <MoreHorizontal />
        </Button>
      </div>
      <CardContent>
        Share your skills and projects in your GitHub profile!
        <Link href={`https://github.com/${username}`} className="text-blue-600 hover:underline">Edit Profile README</Link>
      </CardContent>
    </Card>
  </div>

  {/* Rechte Spalte mit fixierter Größe */}
  <div className="w-[300px] h-[400px] space-y-6 flex flex-col">
    <Card className="w-[300px] h-[400px] flex">
      <CardHeader>Latest changes</CardHeader>
      <CardContent>Details zum letzten Update...</CardContent>
    </Card>
    <Card className="w-[300px] h-[400px] flex">
      <CardHeader>Explore repositories</CardHeader>
      <CardContent>Entdecke spannende Open-Source-Projekte!</CardContent>
    </Card>
  </div>
</main>
</div>
  );
};

export default StartPage;
