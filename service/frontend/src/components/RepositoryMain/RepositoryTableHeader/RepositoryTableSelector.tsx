import { GitBranch, Tag } from "lucide-react"
import { BranchTagSelector } from "@/components/BranchTagSelector"
import Link from "next/link"

export type RepositoryTableSelectorProps = {
    selected: string
    defaultBranch: string
    branches: string[]
    tags: string[]
    branchCount: number
    tagCount: number
    currentPath: string
    onSelect: (type: "branch" | "tag", name: string) => void
}

export function RepositoryTableSelector({
    selected,
    defaultBranch,
    branches,
    tags,
    branchCount,
    tagCount,
    currentPath,
    onSelect
}: RepositoryTableSelectorProps) {
    return (
        <div className="flex items-center space-x-4">
            <BranchTagSelector
                selected={selected}
                onSelect={onSelect}
                defaultBranch={defaultBranch}
                branches={branches}
                tags={tags}
                curPath={currentPath}
            />
            <Link
                href={`${currentPath}/branches`}
                className="flex items-center hover:text-foreground hover:underline"
            >
                <GitBranch className="w-4 h-4 mr-1" />
                <span className="font-semibold mr-1">{branchCount}</span>
                {branchCount === 1 ? "Branch" : "Branches"}
            </Link>
            <Link
                href={`${currentPath}/tags`}
                className="flex items-center hover:text-foreground hover:underline"
            >
                <Tag className="w-4 h-4 mr-1" />
                <span className="font-semibold mr-1">{tagCount}</span>
                {tagCount === 1 ? "Tag" : "Tags"}
            </Link>
        </div>
    )
}
