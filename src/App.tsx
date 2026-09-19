import React, { Suspense } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { ElevatorPanel, ElevatorScene } from "./ElevatorShell";
import { floors, isProfile, pages, paths, prepareRoute, routeFromPath } from "./navigation/routes";
import { useFloorScroll } from "./navigation/useFloorScroll";
import type { Stop, TravelState } from "./types";
import logo from "./assets/logo.png";

type Position = { window: number; panels: number[] };
const zero: Position = { window: 0, panels: [] };
function capturePosition(): Position {
  return { window: window.scrollY, panels: Array.from(document.querySelectorAll<HTMLElement>("[data-floor-scroll]")).map(el => el.scrollTop) };
}
function restorePosition(position: Position) {
  window.scrollTo({ top: position.window, behavior: "instant" });
  document.querySelectorAll<HTMLElement>("[data-floor-scroll]").forEach((el, index) => { el.scrollTop = position.panels[index] ?? 0; });
}
function Mounted({ onReady, children }: { onReady: () => void; children: React.ReactNode }) {
  React.useLayoutEffect(onReady, [onReady]);
  return children;
}
class PageErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <div role="alert" className="absolute inset-0 flex items-center justify-center bg-black text-white">Unable to load this floor. Please refresh to try again.</div> : this.props.children;
  }
}

export default function App() {
  const [initial] = React.useState(() => routeFromPath(window.location.pathname));
  const [route, setRoute] = React.useState<Stop>(initial);
  const [target, setTarget] = React.useState<Stop>(initial);
  const [travelState, setTravelState] = React.useState<TravelState>("idle");
  const [lobbyDoorProgress, setLobbyDoorProgress] = React.useState(0);
  const [arrivalKey, setArrivalKey] = React.useState(0);
  const [error, setError] = React.useState("");
  const reducedMotion = useReducedMotion();
  const current = React.useRef(route);
  const locked = React.useRef(false);
  const serial = React.useRef(0);
  const entry = React.useRef(window.history.state?.floorEntry ?? crypto.randomUUID());
  const positions = React.useRef(new Map<string, Position>());
  const aboutPosition = React.useRef<Position>(zero);
  const restore = React.useRef<Position>(zero);
  const pendingArrival = React.useRef(false);
  const timers = React.useRef<ReturnType<typeof setTimeout>[]>([]);

  const savePosition = React.useCallback(() => {
    const position = capturePosition();
    positions.current.set(entry.current, position);
    if (current.current === "about") aboutPosition.current = position;
  }, []);

  const navigate = React.useCallback((destination: Stop, historyEntry?: string) => {
    const popping = historyEntry !== undefined;
    if (!popping && (locked.current || destination === current.current)) return false;
    savePosition();
    const previous = current.current;
    const request = ++serial.current;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    locked.current = true;
    pendingArrival.current = false;
    setError("");
    setTarget(destination);
    setTravelState(reducedMotion ? "traveling" : "closing");
    if (!reducedMotion) timers.current.push(setTimeout(() => setTravelState("traveling"), 190));
    const delay = new Promise<void>(resolve => setTimeout(resolve, reducedMotion ? 0 : 500));
    void Promise.all([prepareRoute(destination), delay]).then(() => {
      if (serial.current !== request) return;
      restore.current = popping ? positions.current.get(historyEntry) ?? zero
        : destination === "about" && isProfile(previous) ? aboutPosition.current : zero;
      if (popping) entry.current = historyEntry;
      else {
        entry.current = crypto.randomUUID();
        window.history.pushState({ floorEntry: entry.current }, "", paths[destination]);
      }
      current.current = destination;
      pendingArrival.current = true;
      setLobbyDoorProgress(0);
      setRoute(destination);
      // Also remount when a pop navigates between two entries for the same floor.
      setArrivalKey(request);
    }).catch(() => {
      if (serial.current !== request) return;
      locked.current = false;
      setTarget(current.current);
      setTravelState("idle");
      if (popping) window.history.replaceState({ floorEntry: entry.current }, "", paths[current.current]);
      setError("This floor could not load. Please try again.");
    });
    return true;
  }, [reducedMotion, savePosition]);
  const onReady = React.useCallback(() => {
    restorePosition(restore.current);
    window.dispatchEvent(new Event("ascenseur:floor-ready"));
    if (!pendingArrival.current) return;
    pendingArrival.current = false;
    const request = serial.current;
    timers.current.push(setTimeout(() => {
      if (serial.current === request) setTravelState("opening");
    }, reducedMotion ? 0 : 360));
    timers.current.push(setTimeout(() => {
      if (serial.current !== request) return;
      locked.current = false;
      setTravelState("idle");
    }, reducedMotion ? 0 : 680));
  }, [reducedMotion]);

  React.useEffect(() => {
    const oldRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    history.replaceState({ ...history.state, floorEntry: entry.current }, "", paths[current.current] + location.search + location.hash);
    const pop = (event: PopStateEvent) => {
      const key = event.state?.floorEntry ?? crypto.randomUUID();
      if (!event.state?.floorEntry) history.replaceState({ floorEntry: key }, "");
      navigate(routeFromPath(location.pathname), key);
    };
    window.addEventListener("popstate", pop);
    return () => {
      window.removeEventListener("popstate", pop);
      history.scrollRestoration = oldRestoration;
    };
  }, [navigate]);
  React.useEffect(() => () => {
    serial.current++;
    timers.current.forEach(clearTimeout);
  }, []);
  React.useEffect(() => {
    const name = route === "bliss" ? "Bliss Eliss" : route === "anais" ? "Anaïs" : route[0].toUpperCase() + route.slice(1);
    document.title = `${name} | Ascenseur House`;
  }, [route]);

  const go = React.useCallback((destination: Stop) => navigate(destination), [navigate]);
  useFloorScroll(route, travelState !== "idle", go, setLobbyDoorProgress);
  const goToAbout = () => navigate("about");
  const goLobby = () => navigate("lobby");
  const goToAra = () => navigate("ara");
  const goToBendi = () => navigate("bendi");
  const goToAnais = () => navigate("anais");
  const goToBliss = () => navigate("bliss");
  const goToBooking = () => navigate("booking");
  const visible = travelState === "idle";
  const About = pages.about;
  const Booking = pages.booking;
  const ProfilePage = isProfile(route) ? pages[route as "ara" | "bendi" | "anais" | "bliss"] : null;
  const content = route === "about" ? <About visible={visible} onGoToAra={goToAra} onGoToBendi={goToBendi} onGoToAnais={goToAnais} onGoToBliss={goToBliss} />
    : route === "booking" ? <Booking visible={visible} onReturnToLobby={goLobby} />
    : ProfilePage ? <ProfilePage visible={visible} /> : null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative bg-[var(--black)]" style={{
        "--black": "#070707", "--panel-black": "#101010", "--panel-soft": "#161616",
        "--text": "#f4efe8", "--muted": "rgba(244,239,232,0.62)", "--line": "rgba(255,255,255,0.08)",
        "--deep-red": "#6f0f17", "--deep-red-2": "#8a1821", "--burnt-orange": "#9f4a24",
        "--hot-pink": "#b43a67", "--metal": "#3c342d", "--glass": "rgba(255,255,255,0.04)",
      } as React.CSSProperties}>
        {route !== "lobby" && (
          <div className="fixed left-1/2 top-2 z-[10001] -translate-x-1/2">
            <div className="relative">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-40 -translate-x-1/2 -translate-y-1/2 opacity-60 blur-2xl" style={{ background: "radial-gradient(circle, rgba(122,12,12,0.45) 0%, rgba(122,12,12,0.25) 35%, rgba(122,12,12,0.08) 65%, transparent 100%)", boxShadow: "0 0 30px rgba(122,12,12,0.35), 0 0 60px rgba(122,12,12,0.2)" }} />
              <button type="button" onClick={isProfile(route) ? goToAbout : goLobby} aria-label={isProfile(route) ? "Return to About" : "Return to Lobby"} className="relative z-[10002] cursor-pointer">
                <img src={logo} alt="Ascenseur House" className="h-10 w-auto object-contain opacity-90 md:h-12" />
              </button>
            </div>
          </div>
        )}
        <AnimatePresence>
          {route !== "lobby" && visible && <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            <ElevatorPanel activeFloor={floors[route]} targetFloor={floors[target]} disabled={!visible} onGoToAbout={goToAbout} onGoToAra={goToAra} onGoToBendi={goToBendi} onGoToAnais={goToAnais} onGoToBliss={goToBliss} onGoToBooking={goToBooking} />
          </motion.div>}
        </AnimatePresence>
        <div className="fixed inset-0 h-dvh overflow-hidden">
          <ElevatorScene onEnterAbout={goToAbout} view={route === "lobby" ? "lobby" : route === "booking" ? "booking" : "profile"} displayFloor={floors[route]} travelState={travelState} lobbyDoorProgress={lobbyDoorProgress}>
            <PageErrorBoundary key={`${route}-${arrivalKey}`}>
              <Suspense fallback={<div role="status" className="absolute inset-0 flex items-center justify-center bg-black text-white/60">Preparing floor…</div>}>
                <Mounted onReady={onReady}>{content}</Mounted>
              </Suspense>
            </PageErrorBoundary>
          </ElevatorScene>
          {route === "lobby" && <Mounted key={arrivalKey} onReady={onReady}>{null}</Mounted>}
        </div>
        {route === "lobby" && <div className="pointer-events-none h-[180svh]" aria-hidden="true" />}
        {error && <div role="alert" className="fixed bottom-4 left-4 z-[10002] rounded bg-black p-4 text-white">{error}</div>}
      </div>
    </MotionConfig>
  );
}
