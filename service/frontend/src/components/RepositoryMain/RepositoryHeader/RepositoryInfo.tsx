import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export type RepositoryInfoProps = {
  owner: {
    avatarUrl: string
  }
  name: string
  currentPath: string
  isPrivate: boolean
  isArchived: boolean

}


export function RepositoryInfo({ owner, name, currentPath, isPrivate, isArchived }: RepositoryInfoProps) {
  return (
    <div className="flex items-center space-x-4">
      <img src={owner.avatarUrl} className="h-10 w-10 rounded-full" alt="Owner Avatar" />
      <h1 className="text-2xl font-bold">
        <Link href={currentPath} className="hover:underline text-foreground">
          {name}
        </Link>
      </h1>
      <Badge variant="outline" className="text-xs rounded-full">
        {isArchived ? (isPrivate ? "Private archive" : "Public archive") : isPrivate ? "Private" : "Public"}
      </Badge>
    </div>
  )
}
