"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableHead, TableRow, TableHeader, TableCell, TableBody } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MagnifierIcon } from "@/components/Icons";
import IssuesSidebar from "@/components/SidebarIssues";

const IssuesPage = () => {
  const [activeTab, setActiveTab] = useState("Assigned to me");

  return (
    <div className="grid grid-cols-12 gap-6 p-6">
      {/* 🔹 Sidebar */}
      <IssuesSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      {/* 🔹 Hauptbereich */}
      <div className="col-span-9">
        {/* 🔹 Titelzeile */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">{activeTab}</h2>
          <Button>New issue</Button>
        </div>

        {/* 🔹 Suchfeld */}
        <div className="relative w-full mt-4">
          <Input placeholder="Search issues..." className="w-full" />
          <MagnifierIcon className="absolute right-3 top-3 text-gray-500" />
        </div>

        {/* 🔹 Filter-Dropdown */}
        <div className="flex justify-between items-center mt-4">
          <p className="text-sm text-gray-500">0 results</p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Sort by</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Created on</DropdownMenuItem>
              <DropdownMenuItem>Last updated</DropdownMenuItem>
              <DropdownMenuItem>Total comments</DropdownMenuItem>
              <DropdownMenuItem>Best match</DropdownMenuItem>
              <DropdownMenuItem>
                Reactions
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost">Total reactions</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>👍 Thumbs up</DropdownMenuItem>
                    <DropdownMenuItem>👎 Thumbs down</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 🔹 Sortieroptionen */}
        <div className="border-t my-4"></div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">Order</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Order</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Oldest</DropdownMenuItem>
            <DropdownMenuItem>Newest</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 🔹 Tabelle mit Issues */}
        <Table className="mt-4">
          <TableHead>
            <TableRow>
              <TableHeader>Author</TableHeader>
              <TableHeader>Labels</TableHeader>
              <TableHeader>Projects</TableHeader>
              <TableHeader>Milestones</TableHeader>
              <TableHeader>Assignees</TableHeader>
              <TableHeader>Newest</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {/* Falls keine Issues vorhanden sind */}
            <TableRow>
              <TableCell colSpan={6} className="text-center text-gray-500">No issues found</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default IssuesPage;
