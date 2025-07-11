"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import { EllipsisIcon } from "@/components/Icons";

type TreeNode = {
    name: string;
    children?: TreeNode[];
};

const mockTree: TreeNode[] = [
    { name: "src", children: [{ name: "components" }, { name: "pages" }] },
    { name: "public" },
    { name: "README.md" }
];

export default function DirectoryPage() {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});
    const [centered, setCentered] = useState(false);

    // 🔐 Tree-State persistieren
    useEffect(() => {
        const saved = localStorage.getItem("expandedTree");
        if (saved) setExpanded(JSON.parse(saved));
    }, []);

    useEffect(() => {
        localStorage.setItem("expandedTree", JSON.stringify(expanded));
    }, [expanded]);

    const toggleNode = (key: string) => {
        setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const files = e.dataTransfer.files;
        console.log("📦 Dropped files:", files);
        // Hier könntest du z. B. eine Upload-Logik starten
    };

    return (
        <div className="flex w-full h-screen">
            {/* 📁 Sidebar */}
            {sidebarOpen && (
                <aside className="w-[300px] border-r bg-muted/30 p-4 flex flex-col gap-4 mt-12">
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setSidebarOpen(false)}>
                            ⬅︎
                        </Button>
                        <span className="text-sm font-medium">Files</span>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm">main</Button>
                        <Button variant="outline" size="icon">+</Button>
                        <Button variant="outline" size="icon">🔍</Button>
                    </div>
                    <Input placeholder="Go to file" />
                    <div className="text-sm space-y-2">
                        {mockTree.map((node) => (
                            <div key={node.name}>
                                <div
                                    className="cursor-pointer flex gap-1 items-center"
                                    onClick={() => node.children && toggleNode(node.name)}
                                >
                                    {node.children && (
                                        <span>{expanded[node.name] ? "▼" : "▶"}</span>
                                    )}
                                    <span>{node.name}</span>
                                </div>
                                {node.children && expanded[node.name] && (
                                    <div className="ml-4 space-y-1">
                                        {node.children.map((child) => (
                                            <div key={child.name}>{child.name}</div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </aside>
            )}

            {/* 📂 Content */}
            <main
                className={`mt-12 flex-1 p-6 space-y-6 ${centered ? "max-w-[1340px] mx-auto" : ""}`}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
            >
                {/* Headerzeile */}
                <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => setSidebarOpen(true)}>
                            📂
                        </Button>
                        <span className="text-muted-foreground">src/components</span>
                        <Button variant="ghost" size="sm">Copy path</Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">Add file</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem>Create new file</DropdownMenuItem>
                                <DropdownMenuItem>Upload files</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <EllipsisIcon className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem>Copy path</DropdownMenuItem>
                                <DropdownMenuItem>Copy permalink</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600">Delete directory</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuLabel className="text-xs text-muted-foreground">View options</DropdownMenuLabel>
                                <DropdownMenuCheckboxItem checked={centered} onCheckedChange={setCentered}>
                                    Center content
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Commit Info */}
                <div className="flex justify-between items-center bg-muted text-sm px-3 py-2 rounded-md">
                    <span>feat: add loading</span>
                    <div className="flex gap-3 items-center">
                        <span className="text-muted-foreground">abc1234</span>
                        <span>2 days ago</span>
                        <Button variant="ghost" size="sm">History</Button>
                    </div>
                </div>

                {/* Tabelle */}
                <div className="border rounded-md text-sm overflow-hidden">
                    <div className="grid grid-cols-3 px-3 py-2 bg-muted font-semibold text-muted-foreground">
                        <div>Name</div>
                        <div>Last commit message</div>
                        <div>Last commit date</div>
                    </div>
                    {[
                        { name: "index.tsx", msg: "fix: layout bug", date: "2 days ago" },
                        { name: "README.md", msg: "docs: update intro", date: "1 week ago" },
                        { name: "Sidebar.tsx", msg: "feat: toggle tree", date: "3 hours ago" }
                    ].map((f, i) => (
                        <div key={i} className="grid grid-cols-3 px-3 py-2 border-t items-center">
                            <div>{f.name}</div>
                            <div>{f.msg}</div>
                            <div>{f.date}</div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
