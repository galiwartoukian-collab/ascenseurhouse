import { lazy } from "react";
import type { Stop } from "../types";

export { paths, floors, routeFromPath, isProfile, nextMainFloor, previousMainFloor } from "./routeConfig";

const loaders = {
  about: () => import("../pages/About"),
  booking: () => import("../pages/Booking"),
  ara: () => import("../pages/ara"),
  bendi: () => import("../pages/bendi"),
  anais: () => import("../pages/anais"),
  bliss: () => import("../pages/bliss"),
};
export const pages = {
  about: lazy(loaders.about), booking: lazy(loaders.booking),
  ara: lazy(loaders.ara), bendi: lazy(loaders.bendi),
  anais: lazy(loaders.anais), bliss: lazy(loaders.bliss),
};
const pending = new Map<Stop, Promise<void>>();
export function prepareRoute(route: Stop): Promise<void> {
  if (route === "lobby") return Promise.resolve();
  const cached = pending.get(route);
  if (cached) return cached;
  const promise = loaders[route]().then(async module => {
    if (!("assets" in module)) return;
    // Decode only the requested floor's imagery, behind the elevator doors.
    await Promise.all(module.assets.map(src => new Promise<void>(resolve => {
      const image = new Image();
      image.onload = image.onerror = () => resolve();
      image.src = src;
      if (image.complete) resolve();
    })));
  }).catch(error => { pending.delete(route); throw error; });
  pending.set(route, promise);
  return promise;
}
