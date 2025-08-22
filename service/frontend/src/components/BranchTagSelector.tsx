import {
    Command,
    CommandInput,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import Link from "next/link";

type BranchTagSelectorProps = {
    selected: string;
    onSelect: (type: "branch" | "tag", value: string) => void;
    defaultBranch: string;
    branches: string[];
    tags: string[];
    totalBranches?: number; // optional für Show-all-Check
    totalTags?: number;
    curPath: string;
};

export function BranchTagSelector({
    selected,
    onSelect,
    defaultBranch,
    branches,
    tags,
    totalBranches,
    totalTags,
    curPath
}: BranchTagSelectorProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("branches");

    const hasMoreBranches = totalBranches && totalBranches > branches.length;
    const hasTags = tags.length > 0;

    const renderList = (items: string[], type: "branch" | "tag" | "tree") => (
        <CommandList>
            {items.map((item) => (
                <Link
                    key={`${type}:${item}`}
                    href={`${curPath}/${type}/${encodeURIComponent(item)}`}
                    className="block px-2 py-1.5 hover:bg-accent rounded-sm text-sm"
                    onClick={() => setOpen(false)}
                >
                    <div className="flex items-center justify-between">
                        <span>{item}</span>
                        {selected === item && <Check className="w-4 h-4 text-primary" />}
                    </div>
                </Link>
            ))}
        </CommandList>
    );
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="default" size="sm">
                    {selected ?? defaultBranch}
                    <ChevronDown className="ml-1 w-4 h-4" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-[240px]">
                <div className="border-b px-3 py-2 text-xs text-muted-foreground font-semibold">
                    Select branch/tags
                </div>
                <Command className="px-2 py-1">
                    <CommandInput placeholder="Search…" />
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="pt-2">
                        <TabsList className="grid grid-cols-2 mb-2">
                            <TabsTrigger value="branches">Branches</TabsTrigger>
                            <TabsTrigger value="tags">Tags</TabsTrigger>
                        </TabsList>

                        <TabsContent value="branches">
                            {renderList(
                                [defaultBranch, ...branches.filter((b) => b !== defaultBranch)],
                                "tree"
                            )}
                            {hasMoreBranches && (
                                <div className="px-3 py-2 text-xs text-muted-foreground">
                                    <a href="/branches" className="hover:underline">
                                        Show all branches
                                    </a>
                                </div>
                            )}
                            <div className="px-3 py-2 text-xs text-muted-foreground">
                                <Link href={`${curPath}/branches`} className="hover:underline">
                                    Show all branches
                                </Link>
                            </div>
                        </TabsContent>

                        <TabsContent value="tags">
                            {!hasTags && (
                                <div className="px-3 py-2 text-xs text-muted-foreground">
                                    No tags available
                                </div>
                            )}
                            {hasTags && renderList(tags, "tree")}
                            <div className="px-3 py-2 text-xs text-muted-foreground">
                                <Link href={`${curPath}/tags`} className="hover:underline">
                                    Show all tags
                                </Link>
                            </div>
                        </TabsContent>
                    </Tabs>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
