import type { FloorCode, Stop } from "../types";

export const paths: Record<Stop, string> = {
  lobby: "/", about: "/about", booking: "/booking",
  ara: "/ara", bendi: "/bendi", anais: "/anais", bliss: "/bliss",
};
export const floors: Record<Stop, FloorCode> = {
  lobby: "00", about: "A", booking: "B", ara: "01", bendi: "03", anais: "02", bliss: "04",
};
export function routeFromPath(path: string): Stop {
  const normalized = path.replace(/\/+$/, "") || "/";
  return (Object.keys(paths) as Stop[]).find(route => paths[route] === normalized) ?? "lobby";
}
export function isProfile(route: Stop) {
  return route !== "lobby" && route !== "about" && route !== "booking";
}
export const SCROLL_SEQUENCE: readonly Stop[] = ["lobby", "about", "ara", "bendi", "anais", "bliss", "booking"];

export function nextMainFloor(route: Stop): Stop | null {
  return SCROLL_SEQUENCE[SCROLL_SEQUENCE.indexOf(route) + 1] ?? null;
}
export function previousMainFloor(route: Stop): Stop | null {
  return SCROLL_SEQUENCE[SCROLL_SEQUENCE.indexOf(route) - 1] ?? null;
}
