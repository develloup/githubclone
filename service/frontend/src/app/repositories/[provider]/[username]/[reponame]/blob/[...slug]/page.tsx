"use client";

import { useParams } from "next/navigation";

export default function RepositoryBlobPage() {
    const { provider, username, reponame, slug } = useParams() as {
        provider: string;
        username: string;
        reponame: string;
        slug: string[];
    };

    return (
        <div className="p-6 space-y-4 bg-muted rounded border">
            <h2 className="text-xl font-bold">Blob-Page</h2>

            <ul className="text-sm list-disc pl-5">
                <li><strong>Provider:</strong> {provider}</li>
                <li><strong>Username:</strong> {username}</li>
                <li><strong>Repository:</strong> {reponame}</li>
                <li><strong>Slug length:</strong> {slug?.length ?? 0}</li>
            </ul>

            <div className="mt-4">
                <h3 className="text-sm font-semibold mb-1">Slug segments:</h3>
                <ol className="list-decimal pl-5 text-sm space-y-1">
                    {slug?.map((segment, index) => (
                        <li key={index}><code>{segment}</code></li>
                    ))}
                </ol>
            </div>
        </div>
    );
}
