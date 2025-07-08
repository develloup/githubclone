import { RepositoryContents, RepositoryEntry } from "@/types/typesRepository";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"


/**
 * Combines multiple class name values into a single, Tailwind-compatible string.
 *
 * This utility wraps `clsx()` and `twMerge()` to provide intelligent merging of
 * conditional classes and resolution of conflicting Tailwind CSS utilities.
 *
 * It's especially useful when working with dynamic `className` values in React components,
 * helping to keep styles clean, concise, and conflict-free.
 *
 * @param inputs - A variadic list of class name values including strings, arrays, or conditional object literals.
 * @returns A single string containing the merged and deduplicated class names.
 *
 * @example
 * ```ts
 * cn("bg-red-500", { "text-white": isActive, "text-gray-500": !isActive });
 * // → "bg-red-500 text-white" (if isActive is true)
 * ```
 *
 * @see {@link https://github.com/lukeed/clsx | clsx documentation}
 * @see {@link https://github.com/dcastil/twmerge | tailwind-merge documentation}
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}


/**
 * Transforms an external repository URL into an internal application route.
 *
 * This function rewrites links from external providers into your local app's
 * internal route format, e.g. `/repositories/:provider/:path`. The base route segment
 * (like "repositories", "mirror", etc.) can be customized through the `internalSegment` parameter.
 *
 * @param externalUrl - The full external URL of the repository (e.g., from GitHub or GitLab).
 * @param provider - The source provider ID (e.g. "github", "gitlab" or "ghes").
 * @param prefix - The internal route segment (default: "repositories").
 * @returns A rewritten internal URL using the app’s origin and routing schema.
 *
 * @example
 * ```ts
 * getInternalURLfromExternalURL("https://github.com/org/repo", "github");          //  → "https://your-app/repositories/github/org/repo"
 *
 * getInternalURLfromExternalURL("https://gitlab.com/foo/bar", "gitlab", "mirror"); //  → "https://your-app/mirror/gitlab/foo/bar"
 * ```
 */
export function getInternalURLfromExternalURL(
  externalUrl: string,
  provider: string,
  prefix = "repositories"
): string {
  const url = new URL(externalUrl);
  const pathname = url.pathname.replace(/^\/+/, "");
  return `${window.location.origin}/${prefix}/${provider}/${pathname}`;
}


/**
 * Constructs an internal repository path from an external URL.
 *
 * Unlike `getInternalURLfromExternalURL`, this function only returns the internal path string
 * (without the `origin`), using a customizable prefix and provider name.
 *
 * @param externalUrl - A full external repository URL (e.g. from GitHub, GitLab, GHES).
 * @param provider - The source provider identifier (e.g. "github", "gitlab", "ghes").
 * @param prefix - The first segment of the internal route (e.g. "repositories", "mirror").
 * @returns A relative internal path in the format `/${prefix}/${provider}/${path}`.
 *
 * @example
 * ```ts
 * getInternalPathFromExternalURL("https://github.com/org/project", "github", "repositories"); // → "/repositories/github/org/project"
 * ```
 *
 * @throws {TypeError} If the input is not a valid URL.
 */
export function getInternalPathFromExternalURL(
  externalUrl: string,
  provider: string,
  prefix = "repositories",
): string {
  const url = new URL(externalUrl);
  const pathname = url.pathname.replace(/^\/+/, "");
  return `/${prefix}/${provider}/${pathname}`;
}


/**
 * Parses the contents of a `.gitmodules` file and extracts a mapping of submodule paths to their URLs.
 *
 * The function scans for Git submodule entries using a regular expression that matches blocks like:
 *
 * ```
 * [submodule "name"]
 *   path = some/path
 *   url = https://some/repo.git
 * ```
 *
 * It returns an object where each key is a submodule path and the value is the corresponding URL.
 *
 * @param text - The full content of a `.gitmodules` file as a UTF-8 string.
 * @returns An object mapping submodule paths to their URLs.
 *
 * @example
 * ```ts
 * const data = `
 *   [submodule "my-lib"]
 *     path = libs/my-lib
 *     url = https://github.com/user/my-lib.git
 * `;
 *
 * parseGitmodules(data); // → { "libs/my-lib": "https://github.com/user/my-lib.git" }
 * ```
 */
export function parseGitmodules(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  const regex = /\[submodule "(.*?)"]\s+path = (.*?)\s+url = (.*?)(\s|$)/gs;

  let match;
  while ((match = regex.exec(text))) {
    const [, , path, url] = match;
    result[path.trim()] = url.trim();
  }
  console.log("parseGitmodules: ", result);
  console.log("text: ", text);
  return result;
}


/**
 * Decodes a Base64-encoded string with full Unicode character support.
 *
 * This function first decodes the input using `atob()` to obtain the raw binary string,
 * then converts that string to a `Uint8Array` using character codes, and finally
 * decodes the byte array into a UTF-8 Unicode string via `TextDecoder`.
 *
 * This ensures proper handling of multi-byte characters, such as emojis or accented symbols,
 * which are not correctly supported by `atob()` alone.
 *
 * If decoding fails (e.g., due to invalid input), a fallback error message is returned.
 *
 * @param input - The Base64-encoded input string.
 * @returns The decoded Unicode string, or `"(Error during decoding)"` if decoding fails.
 *
 * @example
 * ```ts
 * decodeBase64("8J+agPCfmoDwn5iE");  → "🚀✨🔥"
 * ```
 */
export function decodeBase64(input: string): string {
  try {
    const binary = atob(input);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return "(Error during decoding)";
  }
}


/**
 * Removes the `refs/heads/` prefix from a Git reference, if present.
 *
 * This function is useful for converting a fully qualified Git branch ref
 * (like `"refs/heads/main"`) into its short form (`"main"`). If the input
 * does not start with `"refs/heads/"`, it is returned unchanged.
 *
 * @param ref - A Git reference string, possibly starting with `"refs/heads/"`.
 * @returns The unqualified Git branch name.
 *
 * @example
 * ```ts
 * toUnqualifiedRef("refs/heads/dev"); // → "dev"
 * toUnualifiedRef("main");            // → "main"
 * ```
 */
export function toUnqualifiedRef(ref: string): string {
  const prefix = "refs/heads/";
  return ref.startsWith(prefix) ? ref.slice(prefix.length) : ref;
}

/**
 * Finds the name of the first entry missing commit metadata.
 *
 * Checks for missing `oid`, `message`, or `committedDate`,
 * and returns the `name` of the first incomplete entry.
 *
 * @param entries - Flat array of RepositoryEntry items to scan
 * @returns The name of the first incomplete entry, or `null` if all entries are complete
 */
export function findFirstIncompleteEntryName(entries: RepositoryEntry[]): string | null {
  // console.log("findFirstIncompleteEntryName:", entries);
  for (const entry of entries) {
    if (!entry.oid || !entry.message || !entry.committedDate) {
      // console.log("findFirstIncompleteEntryName:");
      // console.log("name:    ", entry.name);
      // console.log("oid:     ", entry.oid);
      // console.log("message: ", entry.message);
      // console.log("date:    ", entry.committedDate);
      return entry.name
    }
  }
  return null
}

/**
 * Mutates base entries by inserting commit metadata from enriched entries.
 *
 * For each entry in `base`, it checks whether commit info is missing and
 * replaces it with matching data from `enriched`, based on the `name` field.
 *
 * @param base - RepositoryEntry array to be modified in-place
 * @param enriched - Array of RepositoryEntry items containing commit info
 */
export function mergeCommitMetaIntoEntriesMutating(
  base: RepositoryEntry[],
  enriched: RepositoryEntry[]
): void {
  const enrichedMap = new Map(enriched.map(entry => [entry.name, entry]))

  for (const entry of base) {
    if (
      (!entry.oid || !entry.message || !entry.committedDate) &&
      enrichedMap.has(entry.name)
    ) {
      const patch = enrichedMap.get(entry.name)!
      entry.oid = patch.oid
      entry.message = patch.message
      entry.committedDate = patch.committedDate
    }
  }
}
