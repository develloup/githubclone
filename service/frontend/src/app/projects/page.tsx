"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ClockIcon, ProfileIcon, ProjectIcon } from "@/components/Icons";

const ProjectsPage = () => {
  return (
    <div className="mx-auto w-[800px] p-6 flex">
      {/* Linke Navigation (25%) */}
      <div className="w-[25%] pr-4">
        <Tabs defaultValue="projects">
          <TabsList className="flex flex-col space-y-2">
            <TabsTrigger value="projects">
              <ClockIcon className="mr-2" />
              Recently viewed
            </TabsTrigger>
            <TabsTrigger value="created">
              <ProfileIcon className="mr-2" />
              <Link href="/projects?query=is:open+creator:@me">Created by me</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Hauptbereich (75%) */}
      <div className="w-[75%] space-y-6">
        {/* Begrüßungs-Card */}
        <Card className="flex p-6">
          <div className="w-1/2">
            <h2 className="text-2xl font-bold">Welcome to projects</h2>
            <p className="text-gray-600 mt-2">
              Built like a spreadsheet, project tables give you a live canvas to filter, sort, and group issues
              and pull requests. Tailor them to your needs with custom fields and saved views.
            </p>
            <Button asChild className="mt-4">
              <Link href="https://docs.github.com">Learn more</Link>
            </Button>
          </div>
        </Card>

        {/* "Recently viewed" Bereich */}
        <h2 className="text-xl font-bold">Recently viewed</h2>

        {/* Projekt-Erstellung-Card */}
        <Card className="flex flex-col items-center p-6 text-center">
          <ProjectIcon className="mb-4" />
          <h2 className="text-2xl font-bold">Create your first GitHub project</h2>
          <p className="text-gray-600 mt-2">
            Projects are a customizable, flexible tool for planning and tracking your work.
          </p>
          <Button asChild className="mt-4">
            <Link href="/new-project">New project</Link>
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default ProjectsPage;
