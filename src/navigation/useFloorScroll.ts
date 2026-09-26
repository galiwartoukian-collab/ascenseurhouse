import { useEffect, useRef } from "react";
import type { Stop } from "../types";
import { GestureGate, ProfileTouchGate, ScrollBoundary } from "./gesture";
import { nextMainFloor, previousMainFloor, prepareRoute } from "./routes";
import { isProfile } from "./routeConfig";

export function useFloorScroll(route: Stop, locked: boolean, navigate: (route: Stop) => boolean) {
  const gate = useRef(new GestureGate());
  useEffect(() => {
    gate.current.block(performance.now());
    let touchY: number | null = null;
    let touchTarget: EventTarget | null = null;
    let touchUsed = false;
    const profileTouch = new ProfileTouchGate();
    const mobileProfile = () => isProfile(route) && window.matchMedia("(max-width: 767px)").matches;
    const interactive = (target: EventTarget | null) => target instanceof Element && !!target.closest(route === "booking" ? "input,textarea,select,button,a,[contenteditable=true]" : "input,textarea,select,[contenteditable=true]");
    const scrollElement = (target: EventTarget | null): HTMLElement | null => {
      const candidates = Array.from(document.querySelectorAll<HTMLElement>(`[data-floor-scroll="${route}"]`))
        .filter(el => el.clientHeight > 0 && /^(auto|scroll)$/.test(getComputedStyle(el).overflowY));
      const containing = candidates.filter(el => target instanceof Node && el.contains(target));
      return containing.reverse().find(el => el.scrollHeight > el.clientHeight + 2) ?? candidates.find(el => el.scrollHeight > el.clientHeight + 2) ?? candidates[0] ?? null;
    };
    const boundaries = new WeakMap<HTMLElement, ScrollBoundary>();
    const boundaryFor = (el: HTMLElement) => {
      let boundary = boundaries.get(el);
      if (!boundary) {
        boundary = new ScrollBoundary(el.scrollTop);
        boundaries.set(el, boundary);
      }
      return boundary;
    };
    const prefetch = (event?: Event) => {
      const el = scrollElement(event?.target ?? null);
      if (!el) return;
      const max = Math.max(0, el.scrollHeight - el.clientHeight);
      const boundary = boundaryFor(el);
      if (event) {
        // Ignore scroll events from form fields or unrelated nested elements.
        if (event.target !== el) return;
        const delta = boundary.observe(el.scrollTop, performance.now(), gate.current);
        const edge = delta > 0 && boundary.atEdge(delta, el.clientHeight, el.scrollHeight);
        const destination = nextMainFloor(route);
        if (!mobileProfile() && delta && gate.current.input(edge ? boundary.distance : delta, performance.now(), locked, edge && destination !== null) && destination) navigate(destination);
      }
      const next = nextMainFloor(route);
      if (next && (max === 0 || el.scrollTop >= max * 0.55)) void prepareRoute(next).catch(() => {});
    };
    const gesture = (delta: number, target: EventTarget | null) => {
      const el = scrollElement(target);
      const now = performance.now();
      if (!el) { gate.current.input(delta, now, locked, false); return false; }
      const boundary = boundaryFor(el);
      // Synchronize before edge testing: a wheel event can precede the browser's
      // scroll event for the movement that just reached zero.
      boundary.observe(el.scrollTop, now, gate.current);
      const destination = delta > 0 ? nextMainFloor(route) : previousMainFloor(route);
      const atEdge = boundary.atEdge(delta, el.clientHeight, el.scrollHeight);
      // Ineligible events still count as activity, especially momentum over inputs.
      if (gate.current.input(delta, now, locked, atEdge && !interactive(target) && destination !== null) && destination) return navigate(destination);
      return false;
    };

    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
      if (gesture(delta, event.target)) event.preventDefault();
    };
    const start = (event: TouchEvent) => {
      touchY = event.touches[0]?.clientY ?? null;
      touchTarget = event.target;
      touchUsed = false;
      const el = scrollElement(touchTarget);
      profileTouch.end();
      if (mobileProfile() && el && event.touches.length === 1) profileTouch.begin(el.scrollTop, el.clientHeight, el.scrollHeight);
      if (el) boundaryFor(el).observe(el.scrollTop, performance.now(), gate.current);
      gate.current.beginTouch(performance.now(), !!el && el.scrollTop <= 0);
    };
    const end = () => {
      touchY = null;
      touchTarget = null;
      profileTouch.end();
      gate.current.endTouch(performance.now());
    };
    const move = (event: TouchEvent) => {
      if (touchY === null || touchUsed) return;
      const y = event.touches[0]?.clientY ?? touchY;
      const delta = touchY - y;
      touchY = y;
      if (mobileProfile()) {
        const el = scrollElement(touchTarget);
        const destination = delta > 0 ? nextMainFloor(route) : previousMainFloor(route);
        const now = performance.now();
        if (el && profileTouch.input(delta, el.scrollTop, el.clientHeight, el.scrollHeight,
          locked || now < gate.current.blockedUntil || interactive(touchTarget) || event.touches.length !== 1 || !destination) && destination) {
          touchUsed = true;
          gate.current.block(now);
          if (navigate(destination) && event.cancelable) event.preventDefault();
        }
        return;
      }
      if (gesture(delta, touchTarget)) { touchUsed = true; event.preventDefault(); }
    };
    const ready = () => prefetch();
    window.addEventListener("ascenseur:floor-ready", ready);
    window.addEventListener("scroll", prefetch, true);
    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("touchstart", start, { passive: true });
    window.addEventListener("touchmove", move, { passive: false });
    window.addEventListener("touchend", end, { passive: true });
    window.addEventListener("touchcancel", end, { passive: true });
    prefetch();
    return () => {
      window.removeEventListener("ascenseur:floor-ready", ready);
      window.removeEventListener("scroll", prefetch, true);
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("touchstart", start);
      window.removeEventListener("touchmove", move);
      window.removeEventListener("touchend", end);
      window.removeEventListener("touchcancel", end);
    };
  }, [route, locked, navigate]);
}
