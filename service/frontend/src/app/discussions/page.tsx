"use client";

import Link from "next/link";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { DiscussionIcon } from "@/components/Icons";

const DiscussionsPage = () => {
  const [search, setSearch] = useState("");

  return (
    <div className="mx-auto w-[600px] p-6">
      {/* Tab-Leiste & Suchfeld */}
      <div className="flex items-center mb-4">
        <Tabs defaultValue="created">
          <TabsList className="flex space-x-4">
            <Link href="/discussions">
              <TabsTrigger value="created">Created</TabsTrigger>
            </Link>
            <Link href="/discussions/commented">
              <TabsTrigger value="commented">Commented</TabsTrigger>
            </Link>
          </TabsList>
        </Tabs>
        <Input
          placeholder="Search discussions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 ml-4"
        />
      </div>

      {/* Zentrierte Card für leere Diskussionen */}
      <Card className="flex flex-col items-center text-center p-6">
        <DiscussionIcon className="mb-4" />
        <h2 className="text-2xl font-bold">No discussions match the selected filters.</h2>
        <p className="text-gray-600 mt-2">
          Discussions are used to ask questions and have open-ended conversations.
        </p>
      </Card>
    </div>
  );
};

export default DiscussionsPage;
