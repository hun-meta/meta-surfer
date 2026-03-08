import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// cn() is UI-specific (tailwind), keep it here
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export core utils
export { truncate, extractDomain } from "../src/core/utils";
