import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function transformUrl(externalUrl: string, provider: string): string {
  const url = new URL(externalUrl);
  const pathname = url.pathname.replace(/^\/+/, "");
  return `${window.location.origin}/repositories/${provider}/${pathname}`;
}


export function getInternalRepositoryPath(externalUrl: string, prefix: string, provider: string): string {
  const url = new URL(externalUrl);
  const pathname = url.pathname.replace(/^\/+/, "");
  return `/${prefix}/${provider}/${pathname}`;
}
