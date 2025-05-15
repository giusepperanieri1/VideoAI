import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from "date-fns";
import { it as itLocale } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format seconds to MM:SS or HH:MM:SS format
 * @param time Time in seconds
 * @returns Formatted time string
 */
export function formatTime(time: number) {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

/**
 * Format creation time to a readable format
 * @param date The date to format
 * @returns Formatted date string (e.g. "2 giorni fa")
 */
export function formatCreationTime(date: Date | string | null) {
  if (!date) return "Data sconosciuta";
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { 
      addSuffix: true,
      locale: itLocale
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Data non valida";
  }
}
