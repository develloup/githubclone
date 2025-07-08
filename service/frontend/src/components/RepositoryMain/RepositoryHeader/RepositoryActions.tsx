import { EyeIcon, ForkIcon, StarIcon } from "../../Icons"
import { RepositoryAction } from "./RepositoryAction"


const statBadge = (count: number) => (
    <span className="ml-1 px-2 rounded-full bg-muted text-xs font-mono text-muted-foreground">
        {count.toLocaleString()}
    </span>
)

export type RepositoryActionsProps = {
    watchers: number
    forkCount: number
    stargazers: number
}

export function RepositoryActions({
    watchers,
    forkCount,
    stargazers
}: RepositoryActionsProps) {
    return (
        <div className="flex space-x-2">
            <RepositoryAction
                icon={<EyeIcon className="w-4 h-4 mr-1" />}
                label="Watch"
                count={statBadge(watchers)}
                options={["Not Watching", "Watching", "Custom Notification…"]}
            />
            <RepositoryAction
                icon={<ForkIcon className="w-4 h-4 mr-1" />}
                label="Fork"
                count={statBadge(forkCount)}
                options={["Fork this repo", "Compare with fork", "Open forks"]}
            />
            <RepositoryAction
                icon={<StarIcon className="w-4 h-4 mr-1 fill-current text-yellow-500" />}
                label="Star"
                count={statBadge(stargazers)}
                options={["Starred", "Unstar", "Add to list…"]}
            />
        </div>
    )
}