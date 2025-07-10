import { findFirstIncompleteEntryName, mergeCommitMetaIntoEntriesMutating } from "@/lib/utils"
import { RepositoryEntry } from "@/types/typesRepository"
import { useEffect, useState } from "react"
import { useRepositoryContentsPartial } from "./useRepositoryContent"

export function useRepositoryCommitLoader(
    provider: string,
    username: string,
    reponame: string,
    branch: string,
    initialEntries: RepositoryEntry[],
    chunkSize: number = 40
) {
    const [entries, setEntries] = useState(initialEntries)
    const [startname, setStartname] = useState<string | undefined | null>()

    // console.log("startname: ", startname);

    useEffect(() => {
        if (!initialEntries || initialEntries.length === 0) return

        setEntries(initialEntries)

        const startname = findFirstIncompleteEntryName(initialEntries)
        console.log("Initial startname set to:", startname)
        setStartname(startname)
    }, [initialEntries])

    const { data, isFetching } = useRepositoryContentsPartial(
        provider,
        username,
        reponame,
        branch,
        startname,
        chunkSize
    )

    // console.log("data: ", data);

    useEffect(() => {
        console.log("1data:  ", data);
        console.log("1start: ", startname);
        if (!data || !startname) return

        const enriched = data.data.repository?.object?.entries ?? []

        // Patch commit info into current entries
        mergeCommitMetaIntoEntriesMutating(entries, enriched)

        // Trigger re-render
        setEntries([...entries])

        // Recalculate missing commit info
        const nextStart = findFirstIncompleteEntryName(entries)
        console.log("next incomplete entry: ", nextStart);
        setStartname(nextStart)
    }, [data, entries, startname])

    return {
        entries,
        isLoading: isFetching,
        hasIncomplete: !!startname
    }
}