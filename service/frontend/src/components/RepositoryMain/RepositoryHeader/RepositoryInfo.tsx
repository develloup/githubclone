import { Badge } from "@/components/ui/badge"

export type RepositoryInfoProps = {
  owner: {
    avatarUrl: string
  }
  name: string
  isPrivate: boolean
  isArchived: boolean
}


export function RepositoryInfo({ owner, name, isPrivate, isArchived }: RepositoryInfoProps) {
  return (
    <div className="flex items-center space-x-4">
      <img src={owner.avatarUrl} className="h-10 w-10 rounded-full" alt="Owner Avatar" />
      <h1 className="text-2xl font-bold">{name}</h1>
      <Badge variant="outline" className="text-xs rounded-full">
        {isArchived ? (isPrivate ? "Private archive" : "Public archive") : isPrivate ? "Private" : "Public"}
      </Badge>
    </div>
  )
}
