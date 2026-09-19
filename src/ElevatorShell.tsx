import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { View, TravelState, FloorCode, NavigationHandler } from "./types";
import logo from "./assets/logo.png";
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
 view: View;
 displayFloor: FloorCode;
 travelState: TravelState;
 lobbyDoorProgress: number;
 children: React.ReactNode;
 onEnterAbout: NavigationHandler;
};
const DOOR_EASE: [number, number, number, number] = [0.77, 0, 0.175, 1];
const LOBBY_DOOR_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const CABIN_GLOW_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const CABIN_SHAKE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const LOBBY_DOOR_DURATION = 0.62;
const FLOOR_DOOR_DURATION = 0.58;
function MetalButton({
  label,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
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
                ? "inset 0 1px 2px rgba(255,255,255,0.16), inset 0 -6px 12px rgba(0,0,0,0.28), 0 0 28px rgba(122,12,12,0.35)"
                : "inset 0 1px 2px rgba(255,255,255,0.12), inset 0 -6px 12px rgba(0,0,0,0.5), 0 0 22px rgba(122,12,12,0.32)",
            }
      }
      onClick={onClick}
      disabled={disabled}
      aria-label={`Go to ${label}`}
      className="group relative h-6 w-6 rounded-full border text-[11px] font-title text-[var(--text)] transition duration-300 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9 md:h-12 md:w-12"
      style={{
        borderColor: active ? "rgba(122,12,12,0.42)" : "rgba(255,255,255,0.08)",
        background: active
          ? "linear-gradient(180deg, rgba(122,12,12,0.95) 0%, rgba(74,8,8,0.98) 100%)"
          : "linear-gradient(180deg, #2e3237 0%, #17191c 100%)",
        boxShadow: active
          ? "inset 0 1px 2px rgba(255,255,255,0.16), inset 0 -6px 12px rgba(0,0,0,0.28), 0 0 0 1px rgba(122,12,12,0.12), 0 0 24px rgba(122,12,12,0.22), 0 8px 18px rgba(0,0,0,0.3)"
          : "inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -6px 12px rgba(0,0,0,0.5), 0 8px 18px rgba(0,0,0,0.3)",
      }}
    >
      <span className="pointer-events-none absolute inset-[4px] rounded-full border border-white/10" />
      <span
        className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          boxShadow: "0 0 18px rgba(122,12,12,0.35), 0 0 36px rgba(122,12,12,0.18)",
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
  return (
    <div className="pointer-events-none fixed right-0 z-[9999] origin-right md:bottom-auto md:right-4 md:top-[calc(50%+9rem)] md:-translate-y-1/2 lg:right-6">
      {/* MOBILE - OPTION B / MIDDLE RIGHT */}
      <div className="pointer-events-auto fixed right-0 top-1/2 -translate-y-1/2 md:hidden">
        <div
          className="rounded-l-[18px] border border-r-0 border-white/10 bg-[#0f1114]/96 px-1.5 py-2 shadow-[0_16px_30px_rgba(0,0,0,0.38)]"
        >
          <div className="grid grid-cols-1 gap-2">
            <MetalButton
              label="A"
              active={activeFloor === "A" || targetFloor === "A"}
              disabled={disabled}
              onClick={onGoToAbout}
            />
            <MetalButton
              label="1"
              active={activeFloor === "01" || targetFloor === "01"}
              disabled={disabled}
              onClick={onGoToAra}
            />
            <MetalButton
              label="2"
              active={activeFloor === "02" || targetFloor === "02"}
              disabled={disabled}
              onClick={onGoToAnais}
            />
            <MetalButton
              label="3"
              active={activeFloor === "03" || targetFloor === "03"}
              disabled={disabled}
              onClick={onGoToBendi}
            />
            <MetalButton
              label="4"
              active={activeFloor === "04" || targetFloor === "04"}
              disabled={disabled}
              onClick={onGoToBliss}
            />
            <MetalButton
              label="B"
              active={activeFloor === "B" || targetFloor === "B"}
              disabled={disabled}
              onClick={onGoToBooking}
            />
          </div>
        </div>
      </div>

      {/* DESKTOP - KEEP CURRENT PANEL */}
      <div
        className="pointer-events-auto relative hidden w-[132px] rounded-[26px] border p-[2px] md:block"
        style={{
          borderColor: "rgba(255,255,255,0.08)",
          background: "#111214",
          boxShadow: "0 18px 42px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div className="pointer-events-none absolute left-2 top-2 h-2.5 w-2.5 rounded-full border border-white/10 bg-[#1b1c1f]" />
        <div className="pointer-events-none absolute right-2 top-2 h-2.5 w-2.5 rounded-full border border-white/10 bg-[#1b1c1f]" />
        <div className="pointer-events-none absolute bottom-2 left-2 h-2.5 w-2.5 rounded-full border border-white/10 bg-[#1b1c1f]" />
        <div className="pointer-events-none absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full border border-white/10 bg-[#1b1c1f]" />

        <div
          className="relative overflow-hidden rounded-[22px] border px-4 pb-4 pt-5"
          style={{
            borderColor: "rgba(255,255,255,0.07)",
            background: "#0a0b0d",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)",
          }}
        >
          <div className="mb-4 text-center">
            <div className="text-[9px] uppercase tracking-[0.32em] text-white/32">Ascenseur</div>
            <div
              className="mt-2 rounded-md border px-3 py-2"
              style={{
                borderColor: "rgba(255,255,255,0.06)",
                background: "#060708",
              }}
            >
              <div className="text-[10px] uppercase tracking-[0.24em] text-white/26">Control Panel</div>
            </div>
          </div>

          <div className="mx-auto grid w-fit grid-cols-2 justify-items-center gap-3">
            <MetalButton
              label="A"
              active={activeFloor === "A" || targetFloor === "A"}
              disabled={disabled}
              onClick={onGoToAbout}
            />
            <MetalButton
              label="1"
              active={activeFloor === "01" || targetFloor === "01"}
              disabled={disabled}
              onClick={onGoToAra}
            />
            <MetalButton
              label="2"
              active={activeFloor === "02" || targetFloor === "02"}
              disabled={disabled}
              onClick={onGoToAnais}
            />
            <MetalButton
              label="3"
              active={activeFloor === "03" || targetFloor === "03"}
              disabled={disabled}
              onClick={onGoToBendi}
            />
            <MetalButton
              label="4"
              active={activeFloor === "04" || targetFloor === "04"}
              disabled={disabled}
              onClick={onGoToBliss}
            />
            <MetalButton
              label="B"
              active={activeFloor === "B" || targetFloor === "B"}
              disabled={disabled}
              onClick={onGoToBooking}
            />
          </div>
        </div>
      </div>
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
  const tickerValues = React.useMemo(() => ["00", "A", "01", "02", "04", "B"], []);

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
          borderColor: isTraveling ? "rgba(164,32,32,0.42)" : "rgba(255,255,255,0.1)",
          boxShadow: isTraveling
            ? "0 10px 30px rgba(0,0,0,0.45), 0 0 26px rgba(122,12,12,0.24), inset 0 1px 0 rgba(255,255,255,0.06)"
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
  view,
  displayFloor,
  travelState,
  lobbyDoorProgress,
  children,
  onEnterAbout,
}: ElevatorSceneProps) {
  const isLobby = view === "lobby";
  const doorsOpen = !isLobby && (travelState === "opening" || travelState === "idle");
  const cinematicGlow = !isLobby && (travelState === "opening" || travelState === "traveling");
  const cabinShake = travelState === "traveling" ? -1.5 : travelState === "opening" ? 0.4 : 0;
  const clampedLobbyDoorProgress = Math.max(0, Math.min(lobbyDoorProgress, 1));
  const lobbyDoorOffset = `${Math.min(clampedLobbyDoorProgress * 104, 104)}%`;
  const lobbyContentOpacity =
    clampedLobbyDoorProgress <= 0.35
      ? 1 - (clampedLobbyDoorProgress / 0.35) * 0.25
      : clampedLobbyDoorProgress <= 0.7
        ? 0.75 - ((clampedLobbyDoorProgress - 0.35) / 0.35) * 0.5
        : Math.max(0, 0.25 - ((clampedLobbyDoorProgress - 0.7) / 0.3) * 0.25);
  const lobbyContentY = -24 * clampedLobbyDoorProgress;
  const lobbyContentScale = 1 - 0.02 * clampedLobbyDoorProgress;
  const showTravelSweep = travelState === "traveling" || travelState === "opening";

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[var(--black)] text-[var(--text)]">
      <div className="pointer-events-none absolute inset-0 bg-black/95" />

      <motion.div
        animate={{ y: cabinShake }}
        transition={{ duration: 0.18, ease: CABIN_SHAKE_EASE }}
        className="relative h-screen w-screen overflow-hidden bg-[#080808] shadow-[0_35px_80px_rgba(0,0,0,0.68)]"
      >
        <div className="pointer-events-none absolute inset-0 border border-white/6" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-16 border-b border-white/8 bg-[#0d0d0d]" />
        <div className="pointer-events-none absolute bottom-0 left-0 z-20 h-7 w-full border-t border-white/8 bg-[#060606]" />

        {!isLobby && <TravelIndicator displayFloor={displayFloor} travelState={travelState} />}

        <div className="relative isolate h-full w-full overflow-hidden bg-[var(--black)]">
          <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <motion.div
              className="absolute top-0 h-full w-[26%] opacity-16 blur-xl sm:w-[32%] sm:opacity-22 md:w-[45%] md:opacity-40 md:blur-3xl"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(122,12,12,0.2) 20%, rgba(122,12,12,0.65) 50%, rgba(122,12,12,0.2) 80%, transparent 100%)",
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

          <div
            className={`absolute inset-x-0 z-30 flex justify-center px-3 sm:px-6 ${
              view === "lobby"
                ? "inset-y-[10%] pointer-events-none items-center text-center"
                : "inset-y-0 pointer-events-auto items-start px-0 sm:px-0 text-left"
            }`}
          >
            <AnimatePresence mode="wait">
              {isLobby ? (
                <motion.div
                  key="lobby"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                  className="pointer-events-auto mx-auto w-full max-w-[92rem] px-4 text-center sm:px-6"
                >
                  <motion.div
                    className="flex flex-col items-center"
                    style={{
                      opacity: lobbyContentOpacity,
                      y: lobbyContentY,
                      scale: lobbyContentScale,
                    }}
                  >
                    <button type="button" onClick={onEnterAbout} aria-label="Enter About floor" className="cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/70">
                    <img
                      src={logo}
                      alt="Ascenseur House"
                      className="mb-[clamp(0.85rem,1.4vw,1.35rem)] h-[clamp(5.4rem,9.1vw,9.25rem)] w-auto object-contain opacity-95 drop-shadow-[0_0_22px_rgba(255,255,255,0.12)]"
                    />
                    </button>
                    <h1
                      className="origin-center scale-x-[0.96] whitespace-nowrap text-center text-[clamp(1.9rem,9.75vw,4rem)] font-display uppercase leading-[0.88] tracking-[0.01em] text-white drop-shadow-[0_10px_28px_rgba(0,0,0,0.32)] sm:scale-x-100 sm:text-[clamp(3.85rem,8.65vw,8rem)] md:scale-x-[1.04] md:text-[clamp(5.35rem,8.4vw,8.65rem)]"
                      style={{
                        fontFamily:
                          '"Arial Black", "Helvetica Neue", Helvetica, Arial, sans-serif',
                        fontStretch: "expanded",
                        fontWeight: 900,
                      }}
                    >
                      ASCENSEUR HOUSE
                    </h1>
                    <p
                      className="mt-[clamp(0.66rem,0.9vw,0.95rem)] text-[clamp(0.72rem,1.12vw,1.22rem)] font-subheading uppercase leading-none tracking-[0.3em] text-white/92 sm:tracking-[0.54em] md:tracking-[0.62em]"
                      style={{
                        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                      }}
                    >
                      CURATED TO ELEVATE
                    </p>
                  </motion.div>
                </motion.div>
              ) : (
                children
              )}
            </AnimatePresence>
          </div>

          <motion.div
            className="pointer-events-none absolute inset-y-0 left-0 z-20 w-1/2 border-r border-white/8"
            animate={{ x: isLobby ? `-${lobbyDoorOffset}` : doorsOpen ? "-102%" : "0%" }}
            transition={{
              duration: isLobby ? LOBBY_DOOR_DURATION : FLOOR_DOOR_DURATION,
              ease: isLobby ? LOBBY_DOOR_EASE : DOOR_EASE,
            }}
            style={{
              background:
                "linear-gradient(90deg, #1a1d21 0%, #23262b 25%, #32363c 45%, #2a2d31 65%, #1c1f23 100%)",
              boxShadow: "inset 20px 0 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <div className="absolute inset-0 bg-white/[0.03]" />
            <div className="absolute inset-y-0 right-0 w-px bg-white/25" />
            <div className="absolute inset-y-0 right-[18%] w-px bg-white/12" />
            <div className="absolute inset-y-[8%] right-[26%] w-px bg-white/10" />
          </motion.div>

          <motion.div
            className="pointer-events-none absolute inset-y-0 right-0 z-20 w-1/2 border-l border-white/8"
            animate={{ x: isLobby ? lobbyDoorOffset : doorsOpen ? "102%" : "0%" }}
            transition={{
              duration: isLobby ? LOBBY_DOOR_DURATION : FLOOR_DOOR_DURATION,
              ease: isLobby ? LOBBY_DOOR_EASE : DOOR_EASE,
            }}
            style={{
              background:
                "linear-gradient(90deg, #1c1f23 0%, #2a2d31 35%, #32363c 55%, #23262b 75%, #1a1d21 100%)",
              boxShadow: "inset -20px 0 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <div className="absolute inset-0 bg-white/5" />
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
