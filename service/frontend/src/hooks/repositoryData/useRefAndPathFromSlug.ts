import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type RefAndPath = {
    ref: string;
    path: string;
    loading: boolean;
};

export function useRefAndPathFromSlug(fetchKnownRefs: () => Promise<string[]>): RefAndPath {
    const params = useParams();
    const slug = params?.slug as string[]; // z. B. ["feature/main", "src", "utils"]
    const [result, setResult] = useState<RefAndPath>({
        ref: "",
        path: "",
        loading: true,
    });

    useEffect(() => {
        async function resolve() {
            const knownRefs = await fetchKnownRefs();

            // Suche den längsten gültigen Ref von vorne
            for (let i = slug.length; i >= 1; i--) {
                const possibleRef = slug.slice(0, i).join("/");
                if (knownRefs.includes(possibleRef)) {
                    const ref = possibleRef;
                    const path = slug.slice(i).join("/");
                    setResult({ ref, path, loading: false });
                    return;
                }
            }

            // Fallback: Wenn kein Ref erkannt wurde
            setResult({ ref: "", path: slug.join("/"), loading: false });
        }

        if (slug?.length) {
            resolve();
        }
    }, [slug, fetchKnownRefs]);

    return result;
}


// app/[provider]/[username]/[reponame]/tree/[...slug]/page.tsx

// const slug = useParams().slug as string[];

// // Beispiel: ["feature/ui", "src", "components"]

// // Schritt 1: Finde gültige Ref
// const knownRefs = await fetchBranchesOrTags();
// const refIndex = slug.findIndex((segment, index) => {
//   const joined = slug.slice(0, index + 1).join("/");
//   return knownRefs.includes(joined);
// });

// const ref = slug.slice(0, refIndex + 1).join("/");
// const path = slug.slice(refIndex + 1).join("/");
