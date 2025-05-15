"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

const UserProfile = () => {
  const router = useRouter();

  // Beispiel-Daten
  const user = {
    name: "Wolfgang",
    email: "wolfgang@example.com",
    location: "Giesen, Niedersachsen, Deutschland",
    avatar: "/avatar.png",
  };

  const repositories = ["Repository A", "Repository B"];
  const activities = [
    { repo: "RepoX", action: "Commit", count: 25 },
    { repo: "RepoY", action: "Pull Request", count: 10 },
    { repo: "RepoZ", action: "Code Review", count: 5 },
  ];
  const contributions = [
    { date: "2025-05-01", repo: "Repo1" },
    { date: "2025-05-10", repo: "Repo2" },
  ];
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="grid grid-cols-2 gap-6 p-6">
      {/* 🔹 Linke Spalte: Benutzerprofil */}
      <div className="bg-white p-6 shadow rounded-lg">
        <Avatar>
            <AvatarImage src={user.avatar} alt="User Avatar" />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback> {/* Fallback, falls kein Bild vorhanden ist */}
        </Avatar>
        <h2 className="text-xl font-bold text-center mt-2">{user.name}</h2>
        <p className="text-center text-gray-600">{user.email}</p>
        <p className="text-center text-gray-600">{user.location}</p>
        <Button className="w-full mt-4" onClick={() => router.push("/settings")}>
          Edit Profile
        </Button>
      </div>

      {/* 🔹 Rechte Spalte: Repositories, Contributions, Aktivitäten */}
      <div className="flex flex-col gap-6">
        {/* 🔹 Popular Repositories */}
        <Card>
          <CardHeader>
            <CardTitle>Popular repositories</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {repositories.map((repo, index) => (
              <div key={index} className="border p-4 rounded-lg text-center">
                {repo}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 🔹 Contribution Heatmap + Jahrgangsauswahl */}
        <Card>
          <CardHeader>
            <CardTitle>Contributions</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-between items-center">
            <div className="w-3/4 bg-gray-200 p-4 rounded-lg text-center">Heatmap</div>
            <select className="border p-2 rounded">
              <option>2025</option>
              <option>2024</option>
            </select>
          </CardContent>
        </Card>

        {/* 🔹 Activity Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              {activities.map((activity, index) => (
                <p key={index}>{activity.repo}: {activity.action} ({activity.count})</p>
              ))}
            </div>
            <div className="border p-4 rounded-lg text-center">Diagram</div>
          </CardContent>
        </Card>

        {/* 🔹 Contribution Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Contribution Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {contributions.map((contribution, index) => (
              <p key={index}>{contribution.date}: {contribution.repo} erstellt</p>
            ))}
            {showMore && (
              <>
                <p>2025-05-15: Repo3 erstellt</p>
                <p>2025-05-20: Repo4 erstellt</p>
              </>
            )}
          </CardContent>
          <Button className="w-full mt-4" onClick={() => setShowMore(!showMore)}>
            {showMore ? "Hide activity" : "Show more activity"}
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
