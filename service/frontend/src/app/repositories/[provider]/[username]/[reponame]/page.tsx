import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@radix-ui/react-select";
import { FileText, GitBranch, Info, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge"

export default function RepositoryPage() {
  return (
    <div className="max-w-[1080px] mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <img src="/user-icon.png" className="h-10 w-10 rounded-full" alt="User" />
          <h1 className="text-2xl font-bold">mein-repository</h1>
          <Badge variant="outline" className="text-xs rounded-full">public</Badge>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" size="sm">Pin</Button>
          <Button variant="secondary" size="sm">Unwatch</Button>
          <Button variant="secondary" size="sm">Star</Button>
        </div>
      </div>

      <Separator />

      {/* Main Content */}
      <div className="flex space-x-6">
        {/* Left Column (80%) */}
        <div className="w-[80%] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="default" size="sm">main</Button>
              <div className="flex items-center text-sm">
                <GitBranch className="w-4 h-4 mr-1" />
                <span className="font-semibold mr-1">4</span>Branches
              </div>
              <div className="flex items-center text-sm">
                <Tag className="w-4 h-4 mr-1" />
                <span className="font-semibold mr-1">2</span>Tags
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Input placeholder="Search…" className="h-8" />
              <Button size="sm">Add File</Button>
              <Button size="sm">Code</Button>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-md overflow-hidden">
            <div className="grid grid-cols-3 bg-muted p-2 text-sm font-medium">
              <div>Dateiname</div>
              <div>Letzter Commit</div>
              <div>Letzte Änderung</div>
            </div>
            <div className="grid grid-cols-3 p-2 text-sm hover:bg-accent cursor-pointer">
              <div><FileText className="inline w-4 h-4 mr-2" />README.md</div>
              <div>Init commit</div>
              <div>vor 2 Tagen</div>
            </div>
            {/* …weitere Dateien */}
          </div>
        </div>

        {/* Right Column (20%) */}
        <div className="w-[20%] space-y-2">
          <div className="flex justify-between items-center text-sm font-medium">
            <span>About</span>
            <Info className="w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground leading-snug">
            Das ist ein sehr cooles Repository mit einem vollständigen OAuth2-Flow,
            Docker, Postgres – und einer Menge Tech-Zauber.
          </p>
        </div>
      </div>
    </div>
  );
}
