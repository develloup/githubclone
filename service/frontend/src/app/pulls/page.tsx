"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { PullRequestIcon, CheckIcon } from "@/components/Icons";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

const pullRequests = [
  { id: "#123", name: "Fix login bug", date: "2025-05-23", openedBy: "Wolfgang" },
  { id: "#124", name: "Update dependencies", date: "2025-05-21", openedBy: "Anna" },
  { id: "#125", name: "Improve performance", date: "2025-05-20", openedBy: "Markus" },
];

const MyPage = () => {
  const [search, setSearch] = useState("");

  return (
    <div className="mx-auto w-[800px] p-6">
      {/* Tab-Leiste & Suchfeld */}
      <div className="flex justify-between items-center mb-4">
        <Tabs defaultValue="created">
          <TabsList>
            <TabsTrigger value="created">Created</TabsTrigger>
            <TabsTrigger value="assigned">Assigned</TabsTrigger>
            <TabsTrigger value="mentioned">Mentioned</TabsTrigger>
            <TabsTrigger value="review">Review Requests</TabsTrigger>
          </TabsList>
        </Tabs>
        <Input placeholder="Search pull requests..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Tabelle */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="flex items-center">
              <PullRequestIcon className="mr-2" />
              <span>3 Open</span>
            </TableHead>
            <TableHead className="flex items-center">
              <CheckIcon className="mr-2" />
              <span>5 Closed</span>
            </TableHead>
            <TableHead>
              {/* Sortier-Buttons & Dropdown */}
              <div className="flex space-x-2">
                <Button variant="outline">Sort ↑</Button>
                <Button variant="outline">Sort ↓</Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">Filters</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Visibility: Private</DropdownMenuItem>
                    <DropdownMenuItem>Visibility: Public</DropdownMenuItem>
                    <DropdownMenuItem>Sort: Newest</DropdownMenuItem>
                    <DropdownMenuItem>Sort: Oldest</DropdownMenuItem>
                    <DropdownMenuItem>Sort: Most Commented</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pullRequests.map((pr) => (
            <TableRow key={pr.id}>
              <TableCell className="flex items-center">
                <PullRequestIcon className="mr-2" />
                <span>{pr.name}</span>
              </TableCell>
              <TableCell className="text-gray-500">{pr.id}</TableCell>
              <TableCell className="text-gray-500">{pr.date} by {pr.openedBy}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Protip */}
      <div className="mt-6 text-sm text-gray-500 italic">
        🔥 Protip: Use filters to quickly find the most relevant pull requests!
      </div>
    </div>
  );
};

export default MyPage;
