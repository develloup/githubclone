"use client";

import { useParams } from "next/navigation";

export default function RepositoryBranchesActivePage() {
    const { provider, username, reponame } = useParams() as {
        provider: string;
        username: string;
        reponame: string;
    };

    return (
        <div className="p-6 space-y-4 bg-muted rounded border">
            <h2 className="text-xl font-bold">Branches Active Page</h2>

            <ul className="text-sm list-disc pl-5">
                <li><strong>Provider:</strong> {provider}</li>
                <li><strong>Username:</strong> {username}</li>
                <li><strong>Repository:</strong> {reponame}</li>
            </ul>
        </div>
    );
}
