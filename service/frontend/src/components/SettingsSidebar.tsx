import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils" // Falls du eine Utility für className-Merging nutzt
import { LetterIcon, ProjectIcon, SettingIcon, SignInIcon } from "./Icons"

const sections = [
    { name: "Account", icon: <SettingIcon /> },
    { name: "Permissions", icon: <SignInIcon /> },
    { name: "Applications", icon: <ProjectIcon /> },
    { name: "Connections", icon: <LetterIcon /> },
]

type Props = {
    active: string
    onSelect: (section: string) => void
    className?: string
}

export default function SettingsSidebar({ active, onSelect, className }: Props) {
    return (
        <aside className={cn("w-64 border-r p-4 bg-background", className)}>
            <h2 className="text-lg font-semibold mb-4">Settings</h2>
            <div className="flex flex-col space-y-1 mt-1">
                {sections.map(({ name, icon }) => (
                    <Button
                        key={name}
                        variant={active === name ? "default" : "ghost"}
                        className={cn(
                            "w-full justify-start text-left pl-3",
                            active === name ? "font-bold" : "text-muted-foreground"
                        )}
                        onClick={() => onSelect(name)}
                    >
                        <span className="mr-2">{icon}</span>
                        {name}
                    </Button>
                ))}
            </div>
        </aside>
    )
}
