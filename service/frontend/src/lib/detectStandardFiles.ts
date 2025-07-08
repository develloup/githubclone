import { RepositoryEntry } from "@/types/typesRepository";


type FileCategory =
  | "readme"
  | "license"
  | "security"
  | "code_of_conduct"
  | "contributing";

export type FileDetection = {
  category: FileCategory;
  filename: string;
};

export type FileDetectionWithKey = {
  key: string;
  label: string;
  category: FileCategory;
  filename: string;
};

const knownFiles: Record<FileCategory, string[]> = {
  readme: ["readme", "readme.md", "readme.txt", "readme.rst"],
  license: ["license", "license.md", "license.txt"],
  security: ["security.md", ".github/security.md"],
  code_of_conduct: ["code_of_conduct.md", ".github/code_of_conduct.md"],
  contributing: ["contributing.md", ".github/contributing.md"],
};

export function detectStandardFilesFromEntries(
  entries: RepositoryEntry[] | null
): FileDetection[] {
  if (!entries) return [];

  const lower = (s: string) => s.toLowerCase();
  const result: FileDetection[] = [];

  for (const [category, names] of Object.entries(knownFiles)) {
    const match = entries.find((e) =>
      names.includes(lower(e.name))
    );
    if (match) {
      result.push({
        category: category as FileCategory,
        filename: match.name,
      });
    }
  }

  return result;
}