"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectTrigger,
    SelectContent,
    SelectItem,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const userTypes = ["admin", "user"]
const permissionsList = ["CreateUser", "DeleteUser", "EditUser"]

type UserType = typeof userTypes[number]
type Permission = typeof permissionsList[number]

interface FormData {
    name: string
    email: string
    description: string
    type: UserType | ""
    deactivated: boolean
    passwordset: boolean
    permissions: Permission[]
}

export default function CreateUserForm() {

    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        description: "",
        type: "",
        deactivated: false,
        passwordset: true,
        permissions: [],
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSwitch = (name: keyof Pick<FormData, "deactivated" | "passwordset">, value: boolean) => {
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handlePermissionToggle = (perm: Permission) => {
        setFormData(prev => {
            const exists = prev.permissions.includes(perm)
            return {
                ...prev,
                permissions: exists
                    ? prev.permissions.filter(p => p !== perm)
                    : [...prev.permissions, perm],
            }
        })
    }

    const getVariant = (active: boolean): NonNullable<React.ComponentProps<typeof Button>["variant"]> =>
        active ? "default" : "outline"

    const router = useRouter()

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault()

        // Transform permissions into array of objects
        const payload = {
            ...formData,
            permissions: formData.permissions.map(p => ({ Name: p })),
        }

        try {
            const response = await fetch("/api/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const result = await response.json()
                toast.error(result.error ?? "Unknown error occurred.", {duration: 3000})
                return
            }

            toast.success("User created successfully!", {duration: 2000, })
            router.push("/")
        } catch (err) {
            console.error("Error creating user:", err)
            toast.error("Failed to create user. See console for details.", {duration: 3000})
        }
    }, [formData])

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto p-6 mt-12">
            <div>
                <Label htmlFor="name">User name</Label>
                <Input name="name" value={formData.name} onChange={handleChange} required />
            </div>

            <div>
                <Label htmlFor="email">E-Mail</Label>
                <Input name="email" type="email" value={formData.email} onChange={handleChange} required />
            </div>

            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea name="description" value={formData.description} onChange={handleChange} />
            </div>

            <div className="flex items-center justify-between">
                <Label>Deactivated</Label>
                <Switch checked={formData.deactivated} onCheckedChange={val => handleSwitch("deactivated", val)} />
            </div>

            <div className="flex items-center justify-between">
                <Label>Password set</Label>
                <Switch checked={formData.passwordset} onCheckedChange={val => handleSwitch("passwordset", val)} />
            </div>

            <div>
                <Label htmlFor="type">User type</Label>
                <Select
                    value={formData.type}
                    onValueChange={val => setFormData(prev => ({ ...prev, type: val as UserType }))}
                >
                    <SelectTrigger className="w-full" />
                    <SelectContent>
                        {userTypes.map(type => (
                            <SelectItem key={type} value={type}>
                                {type}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label>Permissions</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                    {permissionsList.map(perm => (
                        <Button
                            key={perm}
                            type="button"
                            variant={getVariant(formData.permissions.includes(perm))}
                            onClick={() => handlePermissionToggle(perm)}
                        >
                            {perm}
                        </Button>
                    ))}
                </div>
            </div>

            <Button type="submit" className="w-full">
                Create user
            </Button>
        </form>
    )
}
