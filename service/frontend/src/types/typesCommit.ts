
type ForkComparison = {
    ahead_by: number
    behind_by: number
    status: "ahead" | "behind" | "identical" | "diverged"
    source: string
    target: string
    merge_base_sha?: string
}

export type { ForkComparison };
