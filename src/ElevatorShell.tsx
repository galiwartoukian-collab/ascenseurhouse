import React from "react";
import { floors, SCROLL_SEQUENCE, previousMainFloor, nextMainFloor } from "./navigation/routeConfig";
import { AnimatePresence, motion } from "framer-motion";
import type { TravelState, FloorCode, NavigationHandler } from "./types";
import { DoorMotion, DOOR_CLOSE_SECONDS, DOOR_OPEN_SECONDS } from "./navigation/doorMotion";
type ElevatorPanelProps = {
  activeFloor: FloorCode;
  targetFloor: FloorCode;
  disabled: boolean;
  onGoToAbout: NavigationHandler;
  onGoToAra: NavigationHandler;
  onGoToAnais: NavigationHandler;
  onGoToBendi: NavigationHandler;
  onGoToBliss: NavigationHandler;
  onGoToBooking: NavigationHandler;
};

type ElevatorSceneProps = {
 displayFloor: FloorCode;
 travelState: TravelState;
 children: React.ReactNode;
 onDoorsClosed: () => void;
 onDoorsOpened: () => void;
};
const DOOR_EASE: [number, number, number, number] = [0.45, 0, 0.55, 1];
const CABIN_GLOW_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
function MetalButton({
  label,
  destination,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  destination: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileTap={disabled ? undefined : { scale: 0.96 }}
      whileHover={
        disabled
          ? undefined
          : {
              y: -1,
              boxShadow: active
                ? "inset 0 1px 2px rgba(255,255,255,0.16), inset 0 -6px 12px rgba(0,0,0,0.28), 0 0 28px rgba(var(--accent-rgb),0.35)"
                : "inset 0 1px 2px rgba(255,255,255,0.12), inset 0 -6px 12px rgba(0,0,0,0.5), 0 0 22px rgba(var(--reflection-rgb),0.32)",
            }
      }
      onClick={onClick}
      disabled={disabled}
      aria-label={`Go to ${destination}`}
      aria-current={active ? "page" : undefined}
      className="group relative h-6 w-6 rounded-full border text-[11px] font-title text-[var(--text)] transition duration-300 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9 md:h-12 md:w-12"
      style={{
        borderColor: active ? "rgba(var(--accent-rgb),0.42)" : "rgba(255,255,255,0.08)",
        background: active
          ? "var(--active-button)"
          : "linear-gradient(180deg, #2e3237 0%, #17191c 100%)",
        boxShadow: active
          ? "inset 0 1px 2px rgba(255,255,255,0.16), inset 0 -6px 12px rgba(0,0,0,0.28), 0 0 0 1px rgba(var(--accent-rgb),0.12), 0 0 24px rgba(var(--accent-rgb),0.22), 0 8px 18px rgba(0,0,0,0.3)"
          : "inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -6px 12px rgba(0,0,0,0.5), 0 8px 18px rgba(0,0,0,0.3)",
      }}
    >
      <span className="pointer-events-none absolute inset-[4px] rounded-full border border-white/10" />
      <span
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          boxShadow: "0 0 18px rgba(var(--accent-rgb),0.35), 0 0 36px rgba(var(--accent-rgb),0.18)",
        }}
      />
      <span
        className={`pointer-events-none absolute right-[6px] top-[6px] h-1.5 w-1.5 rounded-full transition ${
          active ? "bg-white/85" : "bg-white/12"
        }`}
      />
      <span className={`relative z-10 tracking-[0.08em] ${active ? "text-white" : "text-white/88"}`}>
        {label}
      </span>
    </motion.button>
  );
}

function ElevatorPanel({
  activeFloor,
  targetFloor,
  disabled,
  onGoToAbout,
  onGoToAra,
  onGoToAnais,
  onGoToBendi,
  onGoToBliss,
  onGoToBooking,
}: ElevatorPanelProps) {
  const destinations = [
    { floor: "A", label: "A", name: "About", onClick: onGoToAbout },
    { floor: "01", label: "1", name: "ARA32", onClick: onGoToAra },
    { floor: "02", label: "2", name: "Bendi", onClick: onGoToBendi },
    { floor: "03", label: "3", name: "Anaïs", onClick: onGoToAnais },
    { floor: "04", label: "4", name: "Bliss Eliss", onClick: onGoToBliss },
    { floor: "B", label: "B", name: "Booking", onClick: onGoToBooking },
  ];
  const floorColors: Record<string, string> = {
    A: "var(--peach-rgb)", "01": "var(--coral-rgb)",
    "02": "var(--magenta-rgb)", "03": "var(--violet-rgb)",
    "04": "var(--blue-rgb)", B: "var(--wine-rgb)",
  };
  const currentRoute = SCROLL_SEQUENCE.find(route => floors[route] === targetFloor)!;
  const previous = previousMainFloor(currentRoute);
  const next = nextMainFloor(currentRoute);
  const previousDestination = destinations.find(item => previous && item.floor === floors[previous]);
  const nextDestination = destinations.find(item => next && item.floor === floors[next]);
  return (
    <div className="pointer-events-none fixed right-0 z-[9999] origin-right md:bottom-auto md:right-[0.5vw] md:top-1/2 md:-translate-y-1/2">
      {/* MOBILE - OPTION B / MIDDLE RIGHT */}
      <div className="pointer-events-auto fixed right-0 top-1/2 -translate-y-1/2 md:hidden">
        <div
          className="rounded-l-[18px] border border-r-0 border-white/10 bg-[#0f1114]/96 px-1.5 py-2 shadow-[0_16px_30px_rgba(0,0,0,0.38)]"
        >
          <div className="grid grid-cols-1 gap-2">
            {destinations.map(({ floor, label, name, onClick }) => (
              <MetalButton key={floor} label={label} destination={name}
                active={activeFloor === floor || targetFloor === floor}
                disabled={disabled} onClick={onClick} />
            ))}
          </div>
        </div>
      </div>

      {/* Desktop/tablet floor strip; mobile retains its original housing. */}
      <nav aria-label="Floor navigation"
        className="pointer-events-auto hidden w-[52px] flex-col items-center gap-1 rounded-[8px] border border-white/10 bg-[#090a0b]/95 px-1 py-3 shadow-[0_8px_24px_rgba(0,0,0,0.3)] md:flex">
        <button type="button" aria-label="Previous floor" title={previousDestination?.name ?? "First floor"}
          disabled={disabled || !previousDestination} onClick={previousDestination?.onClick}
          className="mb-2 flex h-4 w-10 items-center justify-center rounded-full text-white/40 hover:text-white/80 disabled:opacity-20 disabled:cursor-default">
          <svg aria-hidden="true" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M2 6L6 2L10 6" stroke="currentColor" strokeWidth="1" /></svg>
        </button>
        {destinations.map(({ floor, name, onClick }) => {
          const active = targetFloor === floor;
          return <button key={floor} type="button" onClick={onClick} disabled={disabled}
            aria-label={`Go to ${name}`} aria-current={active ? "page" : undefined}
            title={`${floor} — ${name}`}
            className="desktop-floor-button relative h-10 w-10 rounded-full font-title text-[11px] tracking-[0.08em] text-white/60 transition-colors disabled:cursor-not-allowed"
            style={{ "--floor-color": floorColors[floor] } as React.CSSProperties}>
            {floor}
          </button>;
        })}
        <button type="button" aria-label="Next floor" title={nextDestination?.name ?? "Final floor"}
          disabled={disabled || !nextDestination} onClick={nextDestination?.onClick}
          className="mt-2 flex h-4 w-10 items-center justify-center rounded-full text-white/40 hover:text-white/80 disabled:opacity-20 disabled:cursor-default">
          <svg aria-hidden="true" width="12" height="8" viewBox="0 0 12 8" fill="none"><path d="M2 2L6 6L10 2" stroke="currentColor" strokeWidth="1" /></svg>
        </button>
      </nav>
    </div>
  );
}

function TravelIndicator({
  displayFloor,
  travelState,
}: {
  displayFloor: FloorCode;
  travelState: TravelState;
}) {
  const isTraveling = travelState === "traveling";
  const label = displayFloor === "B" ? "BOOK" : displayFloor;
  const [tickerIndex, setTickerIndex] = React.useState(0);
  const tickerValues = React.useMemo(() => ["A", "01", "02", "03", "04", "B"], []);

  React.useEffect(() => {
    if (!isTraveling) {
      setTickerIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setTickerIndex((current) => (current + 1) % tickerValues.length);
    }, 140);

    return () => window.clearInterval(interval);
  }, [isTraveling, tickerValues]);

  return (
    <div className="pointer-events-none absolute left-1/2 top-14 z-40 -translate-x-1/2 scale-[0.88] sm:scale-100 md:top-17">
      <motion.div
        initial={false}
        animate={{
          borderColor: isTraveling ? "rgba(var(--peach-rgb),0.42)" : "rgba(255,255,255,0.1)",
          boxShadow: isTraveling
            ? "0 10px 30px rgba(0,0,0,0.45), 0 0 26px rgba(var(--accent-rgb),0.24), inset 0 1px 0 rgba(255,255,255,0.06)"
            : "0 10px 30px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
        transition={{ duration: 0.24 }}
        className="relative overflow-hidden rounded-[12px] border px-3 py-2 backdrop-blur-md"
        style={{ background: "rgba(10,10,10,0.92)", minWidth: 104 }}
      >
        <motion.div
          aria-hidden="true"
          initial={false}
          animate={{ opacity: isTraveling ? 1 : 0, x: isTraveling ? ["-130%", "130%"] : "-130%" }}
          transition={{ duration: 0.9, repeat: isTraveling ? Infinity : 0, ease: "linear" }}
          className="absolute inset-y-0 w-10"
          style={{
            background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.18) 48%, transparent 100%)",
          }}
        />

        <div className="relative flex items-center justify-center gap-2 text-center">
          <motion.span
            animate={{ opacity: isTraveling ? [0.25, 0.9, 0.25] : 0.2 }}
            transition={{ duration: 1.1, repeat: isTraveling ? Infinity : 0 }}
            className="inline-block h-1.5 w-1.5 rounded-full bg-white"
          />

          <span className="text-[9px] uppercase tracking-[0.36em] text-white/40">Level</span>
          <div className="relative h-5 w-[3.6rem] overflow-hidden text-center font-mono text-[0.95rem] font-semibold tracking-[0.18em] text-white/90">
            <AnimatePresence mode="wait">
              <motion.div
                key={isTraveling ? `travel-${tickerIndex}` : `idle-${label}`}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="absolute inset-0 flex items-start justify-center"
              >
                {isTraveling ? tickerValues[tickerIndex] : label}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ElevatorScene({
  displayFloor,
  travelState,
  children,
  onDoorsClosed,
  onDoorsOpened,
}: ElevatorSceneProps) {
  const doorMotion = React.useRef(new DoorMotion(travelState === "idle"));
  const finishDoors = React.useCallback(() => {
    const phase = doorMotion.current.finish();
    if (phase === "closing") onDoorsClosed();
    if (phase === "opening") onDoorsOpened();
  }, [onDoorsClosed, onDoorsOpened]);
  React.useLayoutEffect(() => {
    doorMotion.current.setPhase(travelState);
    // Complete a phase immediately only if both doors already reached its endpoint.
    finishDoors();
  }, [travelState, finishDoors]);
  const doorsOpen = travelState === "opening" || travelState === "idle";
  const cinematicGlow = travelState === "opening" || travelState === "traveling";
  const showTravelSweep = travelState === "traveling" || travelState === "opening";

  return (
    <div data-elevator-state={travelState} data-elevator-floor={displayFloor} className="relative h-screen w-screen overflow-hidden bg-[var(--black)] text-[var(--text)]">
      <div className="pointer-events-none absolute inset-0 bg-black/95" />

      <motion.div
        className="relative h-screen w-screen overflow-hidden bg-[#080808] shadow-[0_35px_80px_rgba(0,0,0,0.68)]"
      >
        <div className="pointer-events-none absolute inset-0 border border-white/6" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 border-b border-white/8 bg-[#0d0d0d]" />
        <div className="pointer-events-none absolute bottom-0 left-0 z-20 h-7 w-full border-t border-white/8 bg-[#060606]" />

        <TravelIndicator displayFloor={displayFloor} travelState={travelState} />

        <div className="relative isolate h-full w-full overflow-hidden bg-[var(--black)]">
          <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden atmosphere atmosphere-cool">
            <motion.div
              className="absolute top-0 h-full w-[26%] opacity-16 blur-xl sm:w-[32%] sm:opacity-22 md:w-[45%] md:opacity-40 md:blur-3xl"
              style={{
                background:
                  "var(--light-sweep)",
              }}
              animate={{ x: ["-40%", "140%", "-40%"] }}
              transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>

          <motion.div
            aria-hidden="true"
            initial={false}
            animate={{ opacity: cinematicGlow ? 0.04 : 0.01, scale: cinematicGlow ? 1 : 0.995 }}
            transition={{ duration: 0.45, ease: CABIN_GLOW_EASE }}
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),rgba(255,255,255,0.01)_34%,transparent_64%)] blur-xl md:blur-3xl"
          />

          <motion.div
            aria-hidden="true"
            initial={false}
            animate={{ opacity: showTravelSweep ? 1 : 0, y: showTravelSweep ? ["-110%", "110%"] : "-110%" }}
            transition={{ duration: 0.8, repeat: showTravelSweep ? Infinity : 0, ease: "linear" }}
            className="pointer-events-none absolute left-1/2 top-0 z-20 h-[34%] w-[34%] -translate-x-1/2 blur-xl sm:h-[40%] sm:w-[42%] md:h-[46%] md:w-[52%] md:blur-2xl"
            style={{ background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.14) 48%, transparent 100%)" }}
          />

          <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10 opacity-25" />

          <div className="absolute inset-x-0 inset-y-0 z-30 flex justify-center pointer-events-auto items-start px-0 text-left">
            {children}
          </div>

          <motion.div
            data-elevator-door="left"
            className={`pointer-events-none absolute inset-y-0 left-0 z-40 w-1/2 border-r border-white/8`}
            animate={{ x: doorsOpen ? "-102%" : "0%" }}
            initial={false}
            onUpdate={latest => doorMotion.current.update("left", parseFloat(String(latest.x ?? 0)))}
            onAnimationComplete={finishDoors}
            transition={{
              duration: travelState === "closing" ? DOOR_CLOSE_SECONDS : DOOR_OPEN_SECONDS,
              ease: DOOR_EASE,
            }}
            style={{
              background:
                "linear-gradient(90deg, #1a1d21 0%, #23262b 25%, #32363c 45%, #2a2d31 65%, #1c1f23 100%)",
              boxShadow: "inset 20px 0 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <div className="absolute inset-0 bg-white/[0.03] door-reflection" />
            <div className="absolute inset-y-0 right-0 w-px bg-white/25" />
            <div className="absolute inset-y-0 right-[18%] w-px bg-white/12" />
            <div className="absolute inset-y-[8%] right-[26%] w-px bg-white/10" />
          </motion.div>

          <motion.div
            data-elevator-door="right"
            className={`pointer-events-none absolute inset-y-0 right-0 z-40 w-1/2 border-l border-white/8`}
            animate={{ x: doorsOpen ? "102%" : "0%" }}
            initial={false}
            onUpdate={latest => doorMotion.current.update("right", parseFloat(String(latest.x ?? 0)))}
            onAnimationComplete={finishDoors}
            transition={{
              duration: travelState === "closing" ? DOOR_CLOSE_SECONDS : DOOR_OPEN_SECONDS,
              ease: DOOR_EASE,
            }}
            style={{
              background:
                "linear-gradient(90deg, #1c1f23 0%, #2a2d31 35%, #32363c 55%, #23262b 75%, #1a1d21 100%)",
              boxShadow: "inset -20px 0 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <div className="absolute inset-0 bg-white/5 door-reflection" />
            <div className="absolute inset-y-0 left-0 w-px bg-white/25" />
            <div className="absolute inset-y-0 left-[18%] w-px bg-white/12" />
            <div className="absolute inset-y-[8%] left-[26%] w-px bg-white/10" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}


export { ElevatorPanel, ElevatorScene };
