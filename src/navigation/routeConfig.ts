import type { FloorCode, ProfileStop, Stop } from "../types";

export const paths: Record<Stop, string> = {
  about: "/", booking: "/booking",
  ara: "/ara", bendi: "/bendi", anais: "/anais", bliss: "/bliss",
};
export const floors: Record<Stop, FloorCode> = {
  about: "A", booking: "B", ara: "01", bendi: "02", anais: "03", bliss: "04",
};
export function routeFromPath(path: string): Stop {
  const normalized = path.replace(/\/+$/, "") || "/";
  if (normalized === "/about") return "about";
  return (Object.keys(paths) as Stop[]).find(route => paths[route] === normalized) ?? "about";
}
export function isProfile(route: Stop): route is ProfileStop {
  return route !== "about" && route !== "booking";
}
export const SCROLL_SEQUENCE: readonly Stop[] = ["about", "ara", "bendi", "anais", "bliss", "booking"];

export function nextMainFloor(route: Stop): Stop | null {
  return SCROLL_SEQUENCE[SCROLL_SEQUENCE.indexOf(route) + 1] ?? null;
}
export function previousMainFloor(route: Stop): Stop | null {
  return SCROLL_SEQUENCE[SCROLL_SEQUENCE.indexOf(route) - 1] ?? null;
}
