import { detectStandardFilesFromEntries, FileDetectionWithKey } from "@/lib/detectStandardFiles";
import { RepositoryEntry } from "@/types/typesRepository";
import { ReadonlyURLSearchParams } from "next/navigation";
import { useMemo, useEffect } from "react";

type DetectedFilesConfig = {
    branch: string | undefined;
    initialEntries: RepositoryEntry[];
    currentPath: string;
    searchParams: ReadonlyURLSearchParams;
};

export function useDetectedFiles({ branch, initialEntries, currentPath, searchParams }: DetectedFilesConfig) {
    const activeTab = searchParams.get("tab") ?? "readme-ov-file";

    const detectedFiles = useMemo(() => {
        if (!initialEntries || initialEntries.length === 0) return [];
        return detectStandardFilesFromEntries(initialEntries);
    }, [initialEntries]);

    const tabList: FileDetectionWithKey[] =
        detectedFiles.length > 0
            ? detectedFiles.map(({ category, filename }) => ({
                key: `${category}-ov-file`,
                label: filename,
                category,
                filename,
            }))
            : [
                {
                    key: "readme-ov-file",
                    label: "README.md",
                    category: "readme",
                    filename: "README.md",
                },
            ];

    const activeFile =
        tabList.find((f) => f.key === activeTab) ?? tabList[0];

    const fileHref = `${currentPath}/edit/${branch}/${encodeURIComponent(
        activeFile.filename
    )}`;

    useEffect(() => {
        const el = document.getElementById(activeTab);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;

        const threshold = 0.8;
        const elementHeight = rect.height;
        const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
        const visibilityRatio = visibleHeight / elementHeight;

        if (visibilityRatio < threshold) {
            el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, [activeTab]);

    return {
        activeTab,
        tabList,
        activeFile,
        fileHref,
        detectedFiles,
    };
}
