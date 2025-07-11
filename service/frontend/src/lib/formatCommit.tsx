import Link from "next/link";
import { JSX } from "react/jsx-runtime";


export function formatCommitMessageWithLinks(
    message: string,
    basePath: string,
    oid: string
): JSX.Element {
    const parts = message.split(/(#\d+)/g);

    for (let i = 0; i < parts.length; i++) {
        const match = parts[i].match(/^#(\d+)$/);
        if (match) {
            const prNumber = match[1];

            // Text vor dem PR-Link
            const beforeText = parts.slice(0, i).join("");

            return (
                <>
                    <Link
                        href={`${basePath}/commit/${oid}`}
                        className="hover:underline text-foreground"
                    >
                        {beforeText}
                    </Link>{" "}
                    <Link
                        href={`${basePath}/pull/${prNumber}`}
                        className="text-primary underline hover:no-underline"
                    >
                        #{prNumber}
                    </Link>
                </>
            );
        }
    }

    // 🔹 Falls kein #123 gefunden → ganze Nachricht verlinken
    return (
        <Link
            href={`${basePath}/commit/${oid}`}
            className="hover:underline text-foreground"
        >
            {message}
        </Link>
    );
}
