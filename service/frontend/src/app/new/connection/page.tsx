"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Select,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectContent,
} from "@/components/ui/select"

export default function CreateConnectionForm() {
    const router = useRouter()

    const [formData, setFormData] = useState({
        name: "",
        type: "github",
        url: "",
        clientid: "",
        clientsecret: "",
        deactivated: false,
        description: "",
    })

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const target = e.target

        const value =
            target instanceof HTMLInputElement && target.type === "checkbox"
                ? target.checked
                : target.value

        setFormData(prev => ({
            ...prev,
            [target.name]: value,
        }))
    }

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
        name: formData.name,
        type: formData.type,
        url: formData.type === "ghes" ? formData.url : null,
        clientid: formData.clientid,
        clientsecret: formData.clientsecret,
        deactivated: formData.deactivated,
        description: formData.description,
    }

    try {
        const response = await fetch("/api/connections", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })

        let result: { error?: string } = {}
        try {
            result = await response.json()
        } catch {
            // If there is no JSON available
        }

        if (!response.ok) {
            toast.error(result?.error ?? `Error ${response.status}: ${response.statusText}`, {
                duration: 3000,
            })
            return
        }

        toast.success("Connection successfully created", {
            duration: 2000,
        })

        router.push("/")
    } catch (err) {
        toast.error("Could not create connection.", {
            duration: 3000,
        })
    }
}

    return (
        <form onSubmit={handleSubmit} className="space-y-6 max-w-xl mx-auto p-6 mt-12">
            <div className="space-y-2">
                <Label htmlFor="name">Connection Name</Label>
                <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                    value={formData.type}
                    onValueChange={(value) =>
                        setFormData(prev => ({ ...prev, type: value }))
                    }
                >
                    <SelectTrigger id="type">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="github">GitHub</SelectItem>
                        <SelectItem value="ghes">GitHub Enterprise</SelectItem>
                        <SelectItem value="gitlab">GitLab</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {formData.type === "ghes" && (
                <div className="space-y-2">
                    <Label htmlFor="url">URL</Label>
                    <Input
                        id="url"
                        name="url"
                        value={formData.url}
                        onChange={handleChange}
                        required
                    />
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="clientid">Client ID</Label>
                <Input
                    id="clientid"
                    name="clientid"
                    value={formData.clientid}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="clientsecret">Client Secret</Label>
                <Input
                    id="clientsecret"
                    name="clientsecret"
                    value={formData.clientsecret}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="flex items-center space-x-2">
                <Checkbox
                    id="deactivated"
                    checked={formData.deactivated}
                    onCheckedChange={(checked) =>
                        setFormData(prev => ({
                            ...prev,
                            deactivated: !!checked,
                        }))
                    }
                />
                <Label htmlFor="deactivated">Deactivated</Label>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                />
            </div>

            <Button type="submit">Create Connection</Button>
        </form>
    )
}
