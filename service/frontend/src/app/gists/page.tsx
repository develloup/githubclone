"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SmileyIcon, LocationIcon, LetterIcon, GistIcon } from "@/components/Icons";

const GistsPage = () => {
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
        {/* Gists Header */}
        <div className="flex items-center">
          <GistIcon className="mr-2" />
          <h2 className="text-xl font-bold">All gists</h2>
          <span className="ml-2 bg-gray-300 px-2 py-1 rounded">0</span>
        </div>
        <hr className="my-4" />

        {/* Zentrierte Gist-Erstellung-Card */}
        <Card className="flex flex-col items-center text-center p-6">
          <GistIcon className="mb-4" />
          <h2 className="text-2xl font-bold">You don&apos;t have any gist yet.</h2>
          <p className="text-gray-600 mt-2">
            Your public gist will show up here on your profile.
          </p>
          <Button asChild className="mt-4">
            <Link href="/create-gist">Create a gist</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default GistsPage;
