import { lazy } from "react";
import type { Stop } from "../types";
import { createRouteLoader } from "./routeLoader";

const warmingImages = new Map<string, HTMLImageElement>();
function warmImage(src: string) {
  if (warmingImages.has(src)) return;
  const image = new Image();
  warmingImages.set(src, image);
  image.src = src;
}

export { paths, floors, routeFromPath, isProfile, nextMainFloor, previousMainFloor } from "./routeConfig";

const loaders = {
  about: createRouteLoader(() => import("../pages/About"), warmImage),
  booking: createRouteLoader(() => import("../pages/Booking"), warmImage),
  ara: createRouteLoader(() => import("../pages/ara"), warmImage),
  bendi: createRouteLoader(() => import("../pages/bendi"), warmImage),
  anais: createRouteLoader(() => import("../pages/anais"), warmImage),
  bliss: createRouteLoader(() => import("../pages/bliss"), warmImage),
};
export const pages = {
  about: lazy(loaders.about), booking: lazy(loaders.booking),
  ara: lazy(loaders.ara), bendi: lazy(loaders.bendi),
  anais: lazy(loaders.anais), bliss: lazy(loaders.bliss),
};
export function prepareRoute(route: Stop): Promise<void> {
  return loaders[route]().then(() => {});
}
