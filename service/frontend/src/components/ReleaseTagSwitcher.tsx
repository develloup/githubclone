"use client";

import Link from "next/link";

import { Button } from "./ui/button";

type Props = {
    basePath: string;
    active: "releases" | "tags";
};

/**
 * Generic switcher for "Releases" and "Tags".
 * Active state is controlled via props.
 */
export function ReleaseTagSwitcher({ basePath, active }: Props) {
    return (
        <div className="inline-flex items-center rounded-md border">
            <Link href={`${basePath}/releases`}>
                <Button
                    variant={active === "releases" ? "default" : "ghost"}
                    className="rounded-none rounded-l-md"
                >
                    Releases
                </Button>
            </Link>
            <div className="h-5 w-[1px] bg-muted" />
            <Link href={`${basePath}/tags`}>
                <Button
                    variant={active === "tags" ? "default" : "ghost"}
                    className="rounded-none rounded-r-md"
                >
                    Tags
                </Button>
            </Link>
        </div>
    );
}
