import { useId } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Stable field id for label[htmlFor]. Strips React useId punctuation Chrome cannot match. */
export function useFieldId(id?: string) {
  const generated = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return id || `field-${generated}`;
}
