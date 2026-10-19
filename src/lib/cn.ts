import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...input: ClassValue[]) => twMerge(clsx(input));
