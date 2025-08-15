import { ConnectionType, UserConnection, UserType } from "@/types/typesUser";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { useState } from "react";
import { toast } from "sonner";

interface SettingsContentProps {
    section: string;
    className?: string;
    user?: UserType;
    userConnections?: UserConnection[];
    unassignedConnections?: ConnectionType[];
    refetchAll?: () => void;
}

export default function SettingsContent({
    section,
    className,
    user,
    userConnections,
    unassignedConnections,
    refetchAll
}: SettingsContentProps) {
    console.log("section:  ", section);
    console.log("className:", className);
    console.log("user:     ", user);
    console.log("useConnections: ", userConnections);
    console.log("unassignedConnections: ", unassignedConnections);

    const [selectedAssigned, setSelectedAssigned] = useState<number[]>([]);
    const [selectedUnassigned, setSelectedUnassigned] = useState<number[]>([]);

    const toggleSelection = (
        id: number,
        list: number[],
        setList: (v: number[]) => void
    ) => {
        setList(list.includes(id) ? list.filter((i) => i !== id) : [...list, id]);
    };

    const handleDelete = async () => {
        for (const id of selectedAssigned) {
            const res = await fetch(`/api/user-connections/${id}/${user?.userid}`, {
                method: "DELETE",
            });
            if (!res.ok) {
                toast.error("Failed to delete connection", { duration: 3000 })
            }
        }
        toast.success("Connections removed", { duration: 2000 })
        setSelectedAssigned([]);
        refetchAll?.();
    };

    const handleAdd = async () => {
        for (const id of selectedUnassigned) {
            const connection = unassignedConnections?.find(c => c.connectionid === id)
            if (!connection) continue

            const payload = {
                userid: user?.userid,
                connectionid: connection.connectionid,
            }
            const res = await fetch(`/api/user-connections`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                toast.error("Failed to add connection ${id}", { duration: 3000 })
            }
        }
        toast.success("Connection added", { duration: 2000 })
        setSelectedUnassigned([]);
        refetchAll?.();
    };

    return (
        <main className={`flex-1 p-6 ${className ?? ""}`}>
            <h1 className="text-2xl font-bold mb-4">{section}</h1>

            {section === "Account" && (
                <div>
                    <p> Username: {user?.name}</p>
                    <p> Email: {user?.email}</p>
                    <p> Description: {user?.description}</p>
                </div>
            )}

            {section === "Permissions" && (
                <div>
                    <p> Role: Admin</p>
                    <p> Access: Full</p>
                </div>
            )}

            {section === "Applications" && (
                <div className="grid grid-cols-2 gap-6">
                    {/* Box 1: Current connections */}
                    <div className="bg-muted p-4 rounded-md">
                        <h3 className="text-lg font-semibold mb-2">
                            Assigned connections
                        </h3>
                        <ul className="space-y-2">
                            {userConnections?.map((conn) => (
                                <li
                                    key={conn.connection_id}
                                    className="flex items-center gap-2"
                                >
                                    <Checkbox
                                        checked={selectedAssigned.includes(conn.connection_id)}
                                        onCheckedChange={(checked) => {
                                            if (checked != "indeterminate") {
                                                toggleSelection(conn.connection_id, selectedAssigned, setSelectedAssigned)
                                            }
                                        }}
                                    />
                                    <Label > {conn.connection_name}</Label>
                                </li>
                            ))}
                        </ul>
                        <Button
                            className="mt-4"
                            onClick={handleDelete}
                            disabled={selectedAssigned.length === 0}
                        >
                            Delete Connection
                        </Button>
                    </div>

                    {/* Box 2: Available connections */}
                    <div className="bg-muted p-4 rounded-md">
                        <h3 className="text-lg font-semibold mb-2">
                            Available connections
                        </h3>
                        <ul className="space-y-2">
                            {unassignedConnections?.map((conn) => (
                                <li key={conn.connectionid} className="flex items-center gap-2">
                                    <Checkbox
                                        checked={selectedUnassigned.includes(conn.connectionid)}
                                        onCheckedChange={(checked) => {
                                            if (checked != "indeterminate") {
                                                toggleSelection(conn.connectionid, selectedUnassigned, setSelectedUnassigned)
                                            }
                                        }}
                                    />
                                    <Label>{conn.name}</Label>
                                </li>
                            ))}
                        </ul>
                        <Button
                            className="mt-4"
                            onClick={handleAdd}
                            disabled={selectedUnassigned.length === 0}
                        >
                            Add Connection
                        </Button>
                    </div>
                </div>
            )
            }

            {
                section === "Connections" && (
                    <div>
                        <p>Active Connections: PostgreSQL, Redis</p>
                    </div>
                )
            }
        </main >
    );
}
