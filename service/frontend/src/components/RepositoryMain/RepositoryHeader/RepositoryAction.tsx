import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReactNode } from "react";

export type RepositoryActionProps = {
  icon: ReactNode
  label: string
  count: ReactNode // akzeptiert JSX wie <span>123</span>
  options: string[]
  onSelect?: (option: string) => void
}

export function RepositoryAction({
  icon,
  label,
  count,
  options,
  onSelect
}: RepositoryActionProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm">
          {icon}
          {label} {count}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {options.map(option => (
          <DropdownMenuItem key={option} onClick={() => onSelect?.(option)}>
            {option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}