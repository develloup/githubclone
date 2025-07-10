import Link from "next/link"
import { formatNumber } from "@/lib/format"
import { ActivityIcon, EyeIcon, ForkIcon, StarIcon } from "@/components/Icons"

export type RepositoryFactsProps = {
    currentPath: string
    stargazers: number
    watchers: number
    forks: number
}

export function RepositoryFacts({
    currentPath,
    stargazers,
    watchers,
    forks
}: RepositoryFactsProps) {
    return (
        <>
            <Link
                href={`${currentPath}/activity`}
                className="flex items-center gap-2 hover:underline text-primary"
            >
                <ActivityIcon className="w-4 h-4" />
                Activity
            </Link>

            <Link
                href={`${currentPath}/stargazer`}
                className="flex items-center gap-2 hover:underline"
            >
                <StarIcon className="w-4 h-4 text-yellow-500" />
                {formatNumber(stargazers)} {stargazers === 1 ? "Star" : "Stars"}
            </Link>

            <Link
                href={`${currentPath}/watchers`}
                className="flex items-center gap-2 hover:underline"
            >
                <EyeIcon className="w-4 h-4" />
                {formatNumber(watchers)} {watchers === 1 ? "Watcher" : "Watchers"}
            </Link>

            <Link
                href={`${currentPath}/forks`}
                className="flex items-center gap-2 hover:underline"
            >
                <ForkIcon className="w-4 h-4" />
                {formatNumber(forks)} {forks === 1 ? "Fork" : "Forks"}
            </Link>
        </>
    )
}
