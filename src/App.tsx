// In your real Vite/React project, replace the two fallback consts below with:
// import logo from "./assets/logo.png";
// import araImage from "./assets/ara.jpeg";
// This canvas preview keeps inline fallbacks so it still builds here.
import React from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { CalendarDays, Mail, Music2, Phone } from "lucide-react";
import './index.css'

type View = "lobby" | "profile" | "booking";
type TravelState = "idle" | "closing" | "traveling" | "opening";
type Stop = "lobby" | "ara" | "anais" | "bliss" | "booking";
type FloorCode = "00" | "01" | "02" | "03" | "B";

type Profile = {
  id: "ara" | "anais" | "bliss";
  name: string;
  floorNumber: "01" | "02" | "03";
  floorLabel: string;
  role: string;
  genre: string;
  image: string;
  bio: string;
};

type FloorTarget = {
  stop: Stop;
  view: View;
  floor: FloorCode;
  profile?: Profile | null;
};

type ElevatorSceneProps = {
  view: View;
  selectedProfile: Profile | null;
  displayFloor: FloorCode;
  travelState: TravelState;
  lobbyDoorProgress: number;
};

type ElevatorPanelProps = {
  activeFloor: FloorCode;
  targetFloor: FloorCode;
  disabled: boolean;
  onGoToAra: () => void;
  onGoToAnais: () => void;
  onGoToBliss: () => void;
  onGoToBooking: () => void;
};

type ScrollControllerProps = {
  currentStop: Stop;
  isTransitioning: boolean;
  isAutoScrollingRef: React.RefObject<boolean>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onEnterLobby: () => void;
  onEnterProfile: (profile: Profile) => void;
  onEnterBooking: () => void;
  onLobbyProgress: (progress: number) => void;
};

const DOOR_EASE: [number, number, number, number] = [0.77, 0, 0.175, 1];
const LOBBY_DOOR_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const CABIN_GLOW_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const CABIN_SHAKE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const STOP_ORDER: readonly Stop[] = ["lobby", "ara", "anais", "bliss", "booking"] as const;

const AUTO_SCROLL_UNLOCK_MS = 820;
const TRANSITION_TO_TRAVEL_MS = 190;
const TRANSITION_TO_CONTENT_MS = 500;
const TRANSITION_TO_OPEN_MS = 860;
const TRANSITION_TO_IDLE_MS = 1180;

const LOBBY_OPEN_PROGRESS = 0.06;
const LOBBY_TO_FIRST_LOCK_PROGRESS = 0.12;
const FLOOR_1_THRESHOLD = 0.22;
const FLOOR_2_THRESHOLD = 0.48;
const FLOOR_3_THRESHOLD = 0.74;
const SCROLL_TRACK_HEIGHT_VH = 360;

const LOBBY_DOOR_DURATION = 0.62;
const FLOOR_DOOR_DURATION = 0.58;


import logo from "./assets/logo.png";
import araImage from "./assets/ara.jpeg";

const profiles: Profile[] = [
  {
    id: "ara",
    name: "Ara",
    floorNumber: "01",
    floorLabel: "Floor 01",
    role: "Resident DJ",
    genre: "House / Open Format",
    image: araImage,
    bio: "Ara brings a polished late-night energy with smooth transitions, confident pacing, and sets that keep the room moving from the first pour to the last light.",
  },
  {
    id: "anais",
    name: "Anais",
    floorNumber: "02",
    floorLabel: "Floor 02",
    role: "Resident DJ",
    genre: "Afro House / Melodic House",
    image:
      "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=1200&q=80",
    bio: "Anais leans into rhythm and atmosphere, building elegant sets with soulful percussion, melodic lift, and a pulse that feels cinematic without losing the dancefloor.",
  },
  {
    id: "bliss",
    name: "Bliss Eliss",
    floorNumber: "03",
    floorLabel: "Floor 03",
    role: "Manager",
    genre: "Bookings / Talent Curation / Event Direction",
    image:
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=1200&q=80",
    bio: "Bliss Eliss oversees the experience behind the scenes, handling bookings, artist coordination, and the overall shape of each night with precision and style.",
  },
];

const profilesByStop: Record<Extract<Stop, "ara" | "anais" | "bliss">, Profile> = {
  ara: profiles[0],
  anais: profiles[1],
  bliss: profiles[2],
};

function getStopProgress(stop: Stop): number {
  switch (stop) {
    case "lobby":
      return 0;
    case "ara":
      return 0.12;
    case "anais":
      return 0.38;
    case "bliss":
      return 0.64;
    case "booking":
      return 0.88;
  }
}

function getStopFromFloor(floor: FloorCode): Stop {
  switch (floor) {
    case "00":
      return "lobby";
    case "01":
      return "ara";
    case "02":
      return "anais";
    case "03":
      return "bliss";
    case "B":
      return "booking";
  }
}

function getStopFromProfile(profile: Profile): Extract<Stop, "ara" | "anais" | "bliss"> {
  return profile.id;
}

function UIButton({
  children,
  className = "",
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      {...props}
      className={`inline-flex items-start justify-center rounded-full px-5 py-3 text-sm font-medium tracking-[0.08em] transition duration-300 ${className}`}
      style={{
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 24px rgba(0,0,0,0.28)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

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
      className="group relative h-12 w-12 rounded-full border text-sm font-semibold text-[var(--text)] transition duration-300 disabled:cursor-not-allowed disabled:opacity-50"
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
  onGoToAra,
  onGoToAnais,
  onGoToBliss,
  onGoToBooking,
}: ElevatorPanelProps) {
  return (
    <div className="pointer-events-auto fixed right-5 top-1/2 z-[9999] origin-right -translate-y-1/2 scale-[0.94]">
      <div
        className="relative w-[126px] rounded-[26px] border p-[2px]"
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

          <div className="grid grid-cols-2 gap-3">
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
  const tickerValues = React.useMemo(() => ["00", "01", "02", "03", "B"], []);

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
    <div className="pointer-events-none absolute left-1/2 top-17 z-40 -translate-x-1/2">
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
        style={{ background: "rgba(10,10,10,0.92)", minWidth: 124 }}
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

function ProfileInsideCabin({ profile, visible }: { profile: Profile; visible: boolean }) {
  return (
    <motion.div
      key={profile.id}
      initial={{ opacity: 0, scale: 0.975, y: 28 }}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.992, y: visible ? 0 : 10 }}
      exit={{ opacity: 0, scale: 0.985, y: -12 }}
      transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 z-10 flex justify-center pt-6"
    >
      <div
        className="relative h-[74vh] w-[min(84vw,1120px)] overflow-visible rounded-[30px] border shadow-2xl backdrop-blur-sm md:grid md:grid-cols-[1.02fr_0.98fr]"
        style={{
          borderColor: "rgba(255,255,255,0.1)",
          background: "rgba(8,8,8,0.84)",
          boxShadow:
            "0 28px 80px rgba(0,0,0,0.56), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(122,12,12,0.08)",
        }}
      ><motion.div
  aria-hidden="true"
  className="pointer-events-none absolute inset-0 overflow-hidden rounded-[30px]"
>
  <motion.div
    className="absolute top-0 h-full w-[38%] blur-3xl opacity-35"
    style={{
      background:
        "linear-gradient(90deg, transparent 0%, rgba(122,12,12,0.18) 18%, rgba(122,12,12,0.55) 50%, rgba(122,12,12,0.18) 82%, transparent 100%)",
    }}
    animate={{ x: ["-25%", "140%", "-25%"] }}
    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
  />
</motion.div>
        <div className="relative min-h-[240px] overflow-hidden rounded-l-[30px] md:min-h-full">
          <img
            src={profile.image}
            alt={profile.name}
            loading="lazy"
            decoding="async"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-black/22" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.1),transparent_22%,transparent_78%,rgba(0,0,0,0.16))]" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 22% 55%, rgba(122,12,12,0.18) 0%, rgba(122,12,12,0.08) 26%, transparent 58%)",
            }}
          />
          <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/58 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-white/88 backdrop-blur-md">
            {profile.floorLabel}
          </div>
        </div>

        <div className="relative flex h-full flex-col justify-center px-6 py-7 sm:px-7 sm:py-8 md:px-10 md:py-10 text-left">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-white/8" />

          <div className="mb-3 flex items-start gap-2 text-white/76">
            <Music2 className="h-4 w-4 text-white/70" />
            <span className="text-[10px] uppercase tracking-[0.22em]">{profile.role}</span>
          </div>

          <h2 className="text-3xl font-semibold leading-none text-[var(--text)] sm:text-4xl md:text-[3.35rem]">
            {profile.name}
          </h2>

          <div className="mt-4 self-start inline-block w-fit rounded-full border border-white/12 bg-black/45 px-3 py-1.5 text-xs text-white/92 sm:text-sm">
            {profile.genre}
          </div>

          <p className="mt-6 max-w-[38ch] text-sm leading-7 text-white/68 sm:text-[15px]">
            {profile.bio}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

function BookingInsideCabin({ visible }: { visible: boolean }) {
  return (
    <motion.div
      key="booking"
      initial={{ opacity: 0, scale: 0.985, y: 18 }}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.99, y: visible ? 0 : 8 }}
      exit={{ opacity: 0, scale: 0.985, y: -10 }}
      transition={{ duration: 0.54, ease: [0.22, 1, 0.36, 1] }}
className="absolute inset-0 z-10 flex justify-center pt-6" >
      <div
        className="relative h-[74vh] w-[min(84vw,1120px)] overflow-visible rounded-[30px] border shadow-2xl backdrop-blur-sm"
        style={{
          borderColor: "rgba(255,255,255,0.1)",
          background: "rgba(8,8,8,0.86)",
          boxShadow:
            "0 28px 80px rgba(0,0,0,0.56), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 0 1px rgba(122,12,12,0.08)",
        }}
      ><motion.div
  aria-hidden="true"
  className="pointer-events-none absolute inset-0 overflow-hidden rounded-[30px]"
>
  <motion.div
    className="absolute top-0 h-full w-[38%] blur-3xl opacity-35"
    style={{
      background:
        "linear-gradient(90deg, transparent 0%, rgba(122,12,12,0.18) 18%, rgba(122,12,12,0.55) 50%, rgba(122,12,12,0.18) 82%, transparent 100%)",
    }}
    animate={{ x: ["-25%", "140%", "-25%"] }}
    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
  />
</motion.div>
        <div className="grid h-full md:grid-cols-[1.06fr_0.94fr]">
          <div className="overflow-y-auto px-6 py-7 sm:px-7 sm:py-8 md:px-10 md:py-10">
            <div className="mb-3 flex items-start gap-2 text-white/78">
              <CalendarDays className="h-4 w-4 text-white/70" />
              <span className="text-[10px] uppercase tracking-[0.22em]">Private Inquiry</span>
            </div>

            <h2 className="text-3xl font-semibold text-[var(--text)] sm:text-4xl md:text-[3.15rem]">
              Book Ascenseur House
            </h2>

            <p className="mt-4 max-w-[42ch] text-sm leading-7 text-white/68 sm:text-[15px]">
              Private events, artist bookings, venue partnerships, and curated experiences.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <input
                className="rounded-[18px] border px-4 py-3 text-sm text-[var(--text)] placeholder:text-white/24 outline-none transition"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                }}
                placeholder="Your Name"
              />
              <input
                className="rounded-[18px] border px-4 py-3 text-sm text-[var(--text)] placeholder:text-white/24 outline-none transition"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                }}
                placeholder="Company / Venue"
              />
              <input
                className="rounded-[18px] border px-4 py-3 text-sm text-[var(--text)] placeholder:text-white/24 outline-none transition"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                }}
                placeholder="Email"
              />
              <input
                className="rounded-[18px] border px-4 py-3 text-sm text-[var(--text)] placeholder:text-white/24 outline-none transition"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                }}
                placeholder="Phone"
              />
              <textarea
                className="min-h-[140px] rounded-[18px] border px-4 py-3 text-sm text-[var(--text)] placeholder:text-white/24 outline-none transition sm:col-span-2"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                }}
                placeholder="Tell us what you are planning, who you want to book, and the feeling you want the night to hold."
              />
            </div>

            <UIButton
              type="button"
              className="mt-6 border text-white"
              style={{
                borderColor: "rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.06)",
              }}
            >
              Send Inquiry
            </UIButton>
          </div>

          <div
            className="flex h-full flex-col justify-between border-l px-6 py-7 sm:px-7 sm:py-8 md:px-8 md:py-10"
            style={{
              borderColor: "rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div>
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/42">Direct Contact</p>

              <div className="mt-5 space-y-4 text-sm text-white/78">
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 text-white/70" />
                  <span>bookings@ascenseurhouse.com</span>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 text-white/70" />
                  <span>(000) 000-0000</span>
                </div>
              </div>
            </div>

            <div
              className="mt-6 rounded-[22px] border p-4 text-sm leading-7 text-white/62"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                background: "rgba(0,0,0,0.34)",
              }}
            >
              A quieter, more concierge-style side panel lives here. The goal is less booking form, more private arrangements desk.
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ElevatorScene({
  view,
  selectedProfile,
  displayFloor,
  travelState,
  lobbyDoorProgress,
}: ElevatorSceneProps) {
  const isLobby = view === "lobby";
  const doorsOpen = !isLobby && (travelState === "opening" || travelState === "idle");
  const contentVisible = !isLobby && travelState === "idle";
  const cinematicGlow = !isLobby && (travelState === "opening" || travelState === "traveling");
  const cabinShake = travelState === "traveling" ? -1.5 : travelState === "opening" ? 0.4 : 0;
  const lobbyDoorOffset = `${Math.min(lobbyDoorProgress * 104, 104)}%`;
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

{!isLobby && (
  <TravelIndicator displayFloor={displayFloor} travelState={travelState} />
)}
        <div className="relative h-full w-full overflow-hidden bg-[var(--black)]">
          <motion.div
  aria-hidden="true"
  className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
>
  <motion.div
    className="absolute top-0 h-full w-[45%] blur-3xl opacity-40"
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
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.08),rgba(255,255,255,0.01)_34%,transparent_64%)] blur-3xl"
          />

          <motion.div
            aria-hidden="true"
            initial={false}
            animate={{ opacity: showTravelSweep ? 1 : 0, y: showTravelSweep ? ["-110%", "110%"] : "-110%" }}
            transition={{ duration: 0.8, repeat: showTravelSweep ? Infinity : 0, ease: "linear" }}
            className="pointer-events-none absolute left-1/2 top-0 z-20 h-[46%] w-[52%] -translate-x-1/2 blur-2xl"
            style={{ background: "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.14) 48%, transparent 100%)" }}
          />

          <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/10 opacity-25" />

          <div className="absolute inset-x-0 inset-y-[10%] z-30 flex items-center justify-center px-6 text-center pointer-events-none">
            <AnimatePresence mode="wait">
              {isLobby ? (
                <motion.div
                  key="lobby"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.24 }}
                  className="pointer-events-auto mx-auto max-w-3xl text-center"
                >
                  <p className="mb-4 text-xs uppercase tracking-[0.24em] text-white/45">Curated to Elevate</p>
                  <h1 className="text-5xl font-bold leading-tight text-[var(--text)] sm:text-6xl md:text-7xl">
                    ASCENSEUR HOUSE
                  </h1>
                  <p className="ml-0 mt-5 max-w-2xl text-sm leading-7 text-white/70 sm:text-base">
                    Step into an ascenseur, an experience on every level
                  </p>
                </motion.div>
              ) : (
                <>
                  {view === "profile" && selectedProfile && (
                    <ProfileInsideCabin profile={selectedProfile} visible={contentVisible} />
                  )}
                  {view === "booking" && <BookingInsideCabin visible={contentVisible} />}
                </>
              )}
            </AnimatePresence>
          </div>

          <motion.div
            className="pointer-events-none absolute inset-y-[9%] left-0 z-20 w-1/2 border-r border-white/8"
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
            className="pointer-events-none absolute inset-y-[9%] right-0 z-20 w-1/2 border-l border-white/8"
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

function ScrollController({
  currentStop,
  isTransitioning,
  isAutoScrollingRef,
  containerRef,
  onEnterLobby,
  onEnterProfile,
  onEnterBooking,
  onLobbyProgress,
}: ScrollControllerProps) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const lastAutoScrollProgressRef = React.useRef<number | null>(null);

  useMotionValueEvent(scrollYProgress, "change", (latest: number) => {
    if (isAutoScrollingRef.current) {
      lastAutoScrollProgressRef.current = latest;
      return;
    }

    if (lastAutoScrollProgressRef.current !== null) {
      const deltaFromAuto = Math.abs(latest - lastAutoScrollProgressRef.current);
      if (deltaFromAuto < 0.012) return;
      lastAutoScrollProgressRef.current = null;
    }

    const rawProgress = Math.max(0, Math.min(latest / LOBBY_OPEN_PROGRESS, 1));
    const easedProgress = 1 - Math.pow(1 - rawProgress, 3);
    const lobbyProgress = latest >= LOBBY_TO_FIRST_LOCK_PROGRESS ? 1 : easedProgress;
    onLobbyProgress(lobbyProgress);

    if (isTransitioning) return;

    let desiredStop: Stop = "lobby";
    if (latest < LOBBY_TO_FIRST_LOCK_PROGRESS) desiredStop = "lobby";
    else if (latest < FLOOR_1_THRESHOLD) desiredStop = "ara";
    else if (latest < FLOOR_2_THRESHOLD) desiredStop = "anais";
    else if (latest < FLOOR_3_THRESHOLD) desiredStop = "bliss";
    else desiredStop = "booking";

    const currentIndex = STOP_ORDER.indexOf(currentStop);
    const desiredIndex = STOP_ORDER.indexOf(desiredStop);
    if (currentIndex === desiredIndex) return;

    const nextIndex = desiredIndex > currentIndex ? currentIndex + 1 : currentIndex - 1;
    const nextStop = STOP_ORDER[nextIndex];

    if (nextStop === "lobby") {
      onEnterLobby();
      return;
    }

    if (nextStop === "booking") {
      onEnterBooking();
      return;
    }

    onEnterProfile(profilesByStop[nextStop]);
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: `${SCROLL_TRACK_HEIGHT_VH}vh` }}
      aria-hidden="true"
    />
  );
}

export default function App() {
  const [view, setView] = React.useState<View>("lobby");
  const [selectedProfile, setSelectedProfile] = React.useState<Profile | null>(null);
  const [activeFloor, setActiveFloor] = React.useState<FloorCode>("00");
  const [displayFloor, setDisplayFloor] = React.useState<FloorCode>("00");
  const [targetFloor, setTargetFloor] = React.useState<FloorCode>("00");
  const [travelState, setTravelState] = React.useState<TravelState>("idle");
  const [lobbyDoorProgress, setLobbyDoorProgress] = React.useState(0);
  const [hasLeftLobby, setHasLeftLobby] = React.useState(false);
  const [forceClosedLobby, setForceClosedLobby] = React.useState(false);

  const timeoutsRef = React.useRef<number[]>([]);
  const scrollAreaRef = React.useRef<HTMLDivElement | null>(null);
  const isAutoScrollingRef = React.useRef(false);

  const clearTimers = React.useCallback(() => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  const unlockAutoScrollingLater = React.useCallback(() => {
    const timer = window.setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, AUTO_SCROLL_UNLOCK_MS);

    timeoutsRef.current.push(timer);
  }, []);

  const scrollToStop = React.useCallback(
    (stop: Stop) => {
      const el = scrollAreaRef.current;
      if (!el) {
        isAutoScrollingRef.current = false;
        return;
      }

      const rect = el.getBoundingClientRect();
      const absoluteTop = window.scrollY + rect.top;
      const maxOffset = Math.max(el.offsetHeight - window.innerHeight, 0);
      const progress = getStopProgress(stop);

      window.scrollTo({
        top: absoluteTop + maxOffset * progress,
        behavior: "smooth",
      });

      unlockAutoScrollingLater();
    },
    [unlockAutoScrollingLater]
  );

  const goToStop = React.useCallback(
    (target: FloorTarget) => {
      if (travelState !== "idle") return;

      clearTimers();
      isAutoScrollingRef.current = true;
      setTargetFloor(target.floor);
      setForceClosedLobby(target.stop === "lobby");

      if (target.stop !== "lobby") {
        setHasLeftLobby(true);
      }

      setTravelState("closing");

      timeoutsRef.current.push(
        window.setTimeout(() => {
          setTravelState("traveling");
          scrollToStop(target.stop);
        }, TRANSITION_TO_TRAVEL_MS)
      );

      timeoutsRef.current.push(
        window.setTimeout(() => {
          setDisplayFloor(target.floor);
          setSelectedProfile(target.profile ?? null);
          setView(target.view);
        }, TRANSITION_TO_CONTENT_MS)
      );

      timeoutsRef.current.push(
        window.setTimeout(() => {
          setTravelState("opening");
        }, TRANSITION_TO_OPEN_MS)
      );

      timeoutsRef.current.push(
        window.setTimeout(() => {
          setTravelState("idle");
          setActiveFloor(target.floor);
        }, TRANSITION_TO_IDLE_MS)
      );
    },
    [clearTimers, scrollToStop, travelState]
  );

  React.useEffect(() => {
    if (travelState !== "idle") return;
    setTargetFloor(activeFloor);
  }, [activeFloor, travelState]);

  React.useEffect(() => {
    if (activeFloor !== "00") return;
    if (view !== "lobby") return;
    if (travelState !== "idle") return;

    if (window.scrollY <= 0 || forceClosedLobby) {
      setLobbyDoorProgress(0);
      setHasLeftLobby(false);
    }

    if (!forceClosedLobby) return;

    const reopenTimer = window.setTimeout(() => {
      setForceClosedLobby(false);
    }, 180);

    return () => window.clearTimeout(reopenTimer);
  }, [activeFloor, view, travelState, forceClosedLobby]);

  React.useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const openProfile = React.useCallback(
    (profile: Profile) => {
      goToStop({
        stop: getStopFromProfile(profile),
        view: "profile",
        floor: profile.floorNumber,
        profile,
      });
    },
    [goToStop]
  );

  const openBooking = React.useCallback(() => {
    goToStop({
      stop: "booking",
      view: "booking",
      floor: "B",
      profile: null,
    });
  }, [goToStop]);

  const goLobby = React.useCallback(() => {
    goToStop({
      stop: "lobby",
      view: "lobby",
      floor: "00",
      profile: null,
    });
  }, [goToStop]);

  const goToAra = React.useCallback(() => {
    goToStop({
      stop: "ara",
      view: "profile",
      floor: "01",
      profile: profiles[0],
    });
  }, [goToStop]);

  const goToAnais = React.useCallback(() => {
    goToStop({
      stop: "anais",
      view: "profile",
      floor: "02",
      profile: profiles[1],
    });
  }, [goToStop]);

  const goToBliss = React.useCallback(() => {
    goToStop({
      stop: "bliss",
      view: "profile",
      floor: "03",
      profile: profiles[2],
    });
  }, [goToStop]);

  const goToBooking = React.useCallback(() => {
    goToStop({
      stop: "booking",
      view: "booking",
      floor: "B",
      profile: null,
    });
  }, [goToStop]);

  const currentStop = getStopFromFloor(activeFloor);
  const isTransitioning = travelState !== "idle";

  return (
    <div
      className="relative bg-[var(--black)]"
      style={
        {
          "--black": "#070707",
          "--panel-black": "#101010",
          "--panel-soft": "#161616",
          "--text": "#f4efe8",
          "--muted": "rgba(244,239,232,0.62)",
          "--line": "rgba(255,255,255,0.08)",
          "--deep-red": "#6f0f17",
          "--deep-red-2": "#8a1821",
          "--burnt-orange": "#9f4a24",
          "--hot-pink": "#b43a67",
          "--metal": "#3c342d",
          "--glass": "rgba(255,255,255,0.04)",
        } as React.CSSProperties
      }
    ><div className="fixed left-1/2 top-2 z-[10001] -translate-x-1/2">
  <div className="relative">
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-40 -translate-x-1/2 -translate-y-1/2 blur-2xl opacity-60"
      style={{
        background:
          "radial-gradient(circle, rgba(122,12,12,0.45) 0%, rgba(122,12,12,0.25) 35%, rgba(122,12,12,0.08) 65%, transparent 100%)",
        boxShadow: "0 0 30px rgba(122,12,12,0.35), 0 0 60px rgba(122,12,12,0.2)",
      }}
    />
    <button
      type="button"
      onClick={goLobby}
      className="relative z-[10002] cursor-pointer"
    >
      <img
        src={logo}
        alt="Ascenseur House"
        className="h-10 md:h-12 w-auto object-contain opacity-90"
      />
    </button>
  </div>
</div>
      <AnimatePresence>
        {activeFloor !== "00" && travelState === "idle" && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <ElevatorPanel
              activeFloor={activeFloor}
              targetFloor={targetFloor}
              disabled={isTransitioning}
              onGoToAra={goToAra}
              onGoToAnais={goToAnais}
              onGoToBliss={goToBliss}
              onGoToBooking={goToBooking}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="sticky top-0 h-screen overflow-hidden">
     <ElevatorScene
  view={view}
  selectedProfile={selectedProfile}
  displayFloor={displayFloor}
  travelState={travelState}
  lobbyDoorProgress={forceClosedLobby ? 0 : hasLeftLobby ? lobbyDoorProgress : 0}
/>
      </div>

      <ScrollController
        currentStop={currentStop}
        isTransitioning={isTransitioning}
        isAutoScrollingRef={isAutoScrollingRef}
        containerRef={scrollAreaRef}
        onEnterLobby={goLobby}
        onEnterProfile={openProfile}
        onEnterBooking={openBooking}
        onLobbyProgress={(progress) => {
          if (forceClosedLobby) return;
          if (progress > 0) setHasLeftLobby(true);
          setLobbyDoorProgress(progress);
        }}
      />
    </div>
  );
}

if (typeof window !== "undefined") {

  console.assert(getStopFromFloor("00") === "lobby", "00 should map to lobby");
  console.assert(getStopFromFloor("01") === "ara", "01 should map to ara");
  console.assert(getStopFromFloor("02") === "anais", "02 should map to anais");
  console.assert(getStopFromFloor("03") === "bliss", "03 should map to bliss");
  console.assert(getStopFromFloor("B") === "booking", "B should map to booking");

  console.assert(getStopProgress("lobby") === 0, "lobby progress should be 0");
  console.assert(getStopProgress("ara") < getStopProgress("anais"), "ara should come before anais");
  console.assert(getStopProgress("anais") < getStopProgress("bliss"), "anais should come before bliss");
  console.assert(getStopProgress("bliss") < getStopProgress("booking"), "bliss should come before booking");
  console.assert(getStopProgress("booking") <= 1, "booking progress should stay within scroll range");
  console.assert(getStopProgress("ara") < 0.2, "ara should be close to the top");

  console.assert(getStopFromProfile(profiles[0]) === "ara", "Ara profile should resolve to ara stop");
  console.assert(getStopFromProfile(profiles[1]) === "anais", "Anais profile should resolve to anais stop");
  console.assert(getStopFromProfile(profiles[2]) === "bliss", "Bliss profile should resolve to bliss stop");

  console.assert(LOBBY_OPEN_PROGRESS >= 0.05, "lobby doors should have enough runway to open smoothly");
  console.assert(
    LOBBY_TO_FIRST_LOCK_PROGRESS > LOBBY_OPEN_PROGRESS,
    "first-floor lock should happen after initial door opening"
  );
  console.assert(
    LOBBY_TO_FIRST_LOCK_PROGRESS >= 0.1,
    "first-floor handoff should leave the lobby doors open a bit longer"
  );

  console.assert(
    LOBBY_DOOR_DURATION > FLOOR_DOOR_DURATION,
    "lobby intro should be slightly slower than floor transitions"
  );
  console.assert(SCROLL_TRACK_HEIGHT_VH > 300, "scroll track should be tall enough to scroll in preview");
}
