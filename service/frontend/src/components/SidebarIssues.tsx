import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const SidebarItem = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <Button
    variant="ghost"
    className={cn("w-full text-left px-4 py-2 rounded-md", active ? "bg-gray-100 text-black" : "text-gray-600")}
    onClick={onClick}
  >
    {label}
  </Button>
);

export default function IssuesSidebar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (tab: string) => void }) {
  return (
    <div className="col-span-3 p-4 bg-gray-900 text-white rounded-lg">
      <SidebarItem label="Assigned to me" active={activeTab === "Assigned to me"} onClick={() => setActiveTab("Assigned to me")} />
      <SidebarItem label="Created by me" active={activeTab === "Created by me"} onClick={() => setActiveTab("Created by me")} />
      <SidebarItem label="Mentioned" active={activeTab === "Mentioned"} onClick={() => setActiveTab("Mentioned")} />
      <SidebarItem label="Recent activity" active={activeTab === "Recent activity"} onClick={() => setActiveTab("Recent activity")} />
    </div>
  );
}
