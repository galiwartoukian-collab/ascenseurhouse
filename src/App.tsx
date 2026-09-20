import React, { Suspense } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "framer-motion";
import { ElevatorPanel, ElevatorScene } from "./ElevatorShell";
import { floors, isProfile, pages, paths, prepareRoute, routeFromPath } from "./navigation/routes";
import { DoorTransition } from "./navigation/routeLoader";
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
class PageErrorBoundary extends React.Component<{ children: React.ReactNode; onReady: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onReady(); }
  render() {
    return this.state.failed ? <div role="alert" className="absolute inset-0 flex items-center justify-center bg-black text-white">Unable to load this floor. Please refresh to try again.</div> : this.props.children;
  }
}

export default function App() {
  const [initial] = React.useState(() => routeFromPath(window.location.pathname));
  const [route, setRoute] = React.useState<Stop>(initial);
  const [target, setTarget] = React.useState<Stop>(initial);
  const [travelState, setTravelState] = React.useState<TravelState>(initial === "about" ? "idle" : "traveling");
  const [arrivalKey, setArrivalKey] = React.useState(0);
  const [error, setError] = React.useState("");
  const reducedMotion = useReducedMotion();
  const current = React.useRef(route);
  const locked = React.useRef(initial !== "about");
  const serial = React.useRef(0);
  const entry = React.useRef(window.history.state?.floorEntry ?? crypto.randomUUID());
  const positions = React.useRef(new Map<string, Position>());
  const aboutPosition = React.useRef<Position>(zero);
  const restore = React.useRef<Position>(zero);
  const pendingArrival = React.useRef(initial !== "about");
  const transition = React.useRef<DoorTransition | null>(null);

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
    transition.current?.cancel();
    const journey = new DoorTransition();
    transition.current = journey;
    locked.current = true;
    pendingArrival.current = false;
    setError("");
    setTarget(destination);
    setTravelState("closing");
    void prepareRoute(destination).then(() => journey.prepared(() => {
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
      setRoute(destination);
      // Also remount when a pop navigates between two entries for the same floor.
      setArrivalKey(request);
    })).catch(() => {
      if (serial.current !== request) return;
      journey.cancel();
      locked.current = false;
      setTarget(current.current);
      setTravelState("idle");
      if (popping) window.history.replaceState({ floorEntry: entry.current }, "", paths[current.current]);
      setError("This floor could not load. Please try again.");
    });
    return true;
  }, [savePosition]);
  const onReady = React.useCallback(() => {
    restorePosition(restore.current);
    window.dispatchEvent(new Event("ascenseur:floor-ready"));
    if (!pendingArrival.current) return;
    pendingArrival.current = false;
    if (reducedMotion) {
      locked.current = false;
      setTravelState("idle");
    } else {
      // The layout is mounted. Open now; image downloads are independent.
      setTravelState("opening");
    }
  }, [reducedMotion]);
  const onDoorsClosed = React.useCallback(() => {
    setTravelState("traveling");
    transition.current?.doorsClosed();
  }, []);
  const onDoorsOpened = React.useCallback(() => {
    locked.current = false;
    setTravelState("idle");
  }, []);

  React.useEffect(() => {
    const oldRestoration = history.scrollRestoration;
    history.scrollRestoration = "manual";
    history.replaceState({ ...history.state, floorEntry: entry.current }, "", paths[current.current] + location.search + location.hash);
    const pop = (event: PopStateEvent) => {
      const key = event.state?.floorEntry ?? crypto.randomUUID();
      const destination = routeFromPath(location.pathname);
      history.replaceState({ ...event.state, floorEntry: key }, "", paths[destination] + location.search + location.hash);
      navigate(destination, key);
    };
    window.addEventListener("popstate", pop);
    return () => {
      window.removeEventListener("popstate", pop);
      history.scrollRestoration = oldRestoration;
    };
  }, [navigate]);
  React.useEffect(() => () => {
    serial.current++;
    transition.current?.cancel();
  }, []);
  React.useEffect(() => {
    const name = route === "ara" ? "ARA32" : route === "bliss" ? "Bliss Eliss" : route === "anais" ? "Anaïs" : route[0].toUpperCase() + route.slice(1);
    document.title = `${name} | Ascenseur House`;
  }, [route]);

  const go = React.useCallback((destination: Stop) => navigate(destination), [navigate]);
  useFloorScroll(route, travelState !== "idle", go);
  const goToAbout = () => navigate("about");
  const goToAra = () => navigate("ara");
  const goToBendi = () => navigate("bendi");
  const goToAnais = () => navigate("anais");
  const goToBliss = () => navigate("bliss");
  const goToBooking = () => navigate("booking");
  const visible = travelState === "idle";
  const About = pages.about;
  const Booking = pages.booking;
  const ProfilePage = isProfile(route) ? pages[route] : null;
  const content = route === "about" ? <About visible={true} onGoToAra={goToAra} onGoToBendi={goToBendi} onGoToAnais={goToAnais} onGoToBliss={goToBliss} />
    : route === "booking" ? <Booking visible={true} onReturnToAbout={goToAbout} />
    : ProfilePage ? <ProfilePage visible={true} /> : null;

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative bg-[var(--black)]">
          <div className="fixed left-1/2 top-2 z-[10001] -translate-x-1/2">
            <div className="relative">
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-40 -translate-x-1/2 -translate-y-1/2 opacity-60 blur-2xl" style={{ background: "radial-gradient(circle, rgba(var(--accent-rgb),0.45) 0%, rgba(var(--accent-rgb),0.25) 35%, rgba(var(--accent-rgb),0.08) 65%, transparent 100%)", boxShadow: "0 0 30px rgba(var(--accent-rgb),0.35), 0 0 60px rgba(var(--accent-rgb),0.2)" }} />
              <button type="button" onClick={goToAbout} aria-label="Return to About" className="relative z-[10002] cursor-pointer">
                <img src={logo} alt="Ascenseur House" className="h-10 w-auto object-contain opacity-90 md:h-12" />
              </button>
            </div>
          </div>
        <AnimatePresence>
          {visible && <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
            <ElevatorPanel activeFloor={floors[route]} targetFloor={floors[target]} disabled={!visible} onGoToAbout={goToAbout} onGoToAra={goToAra} onGoToBendi={goToBendi} onGoToAnais={goToAnais} onGoToBliss={goToBliss} onGoToBooking={goToBooking} />
          </motion.div>}
        </AnimatePresence>
        <div className="fixed inset-0 h-dvh overflow-hidden">
          <ElevatorScene onDoorsClosed={onDoorsClosed} onDoorsOpened={onDoorsOpened} displayFloor={floors[route]} travelState={travelState}>
            <PageErrorBoundary onReady={onReady} key={`${route}-${arrivalKey}`}>
              <Suspense fallback={null}>
                <Mounted onReady={onReady}>{content}</Mounted>
              </Suspense>
            </PageErrorBoundary>
          </ElevatorScene>
        </div>
        {error && <div role="alert" className="fixed bottom-4 left-4 z-[10002] rounded bg-black p-4 text-white">{error}</div>}
      </div>
    </MotionConfig>
  );
}
