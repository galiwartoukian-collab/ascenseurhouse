import React from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { CalendarDays, Music2 } from "lucide-react";
import "./index.css";

type View = "lobby" | "profile" | "booking";
type TravelState = "idle" | "closing" | "traveling" | "opening";
type BookingSubmitStatus = "idle" | "sending" | "success" | "error";
type Stop = "lobby" | "about" | "ara" | "anais" | "talar" | "bliss" | "booking";
type ProfileStop = Extract<Stop, "ara" | "anais" | "talar" | "bliss">;
type FloorCode = "00" | "A" | "01" | "02" | "03" | "04" | "B";

type ProfileSocials = {
  instagram?: string;
  tiktok?: string;
  soundcloud?: string;
};

type Profile = {
  id: "ara" | "anais" | "talar" | "bliss";
  name: string;
  floorNumber: "01" | "02" | "03" | "04";
  role: string;
  genre: string;
  image: string;
  bio: string;
  socials?: ProfileSocials;
};

type FloorTarget = {
  stop: Stop;
  view: View;
  floor: FloorCode;
  profile?: Profile | null;
};

type NavigationHandler = () => boolean;

type ElevatorSceneProps = {
  view: View;
  selectedProfile: Profile | null;
  displayFloor: FloorCode;
  travelState: TravelState;
  lobbyDoorProgress: number;
  onExitBookingUp: NavigationHandler;
  onReturnToLobby: NavigationHandler;
  onGoToAra: NavigationHandler;
  onGoToAnais: NavigationHandler;
  onGoToTalar: NavigationHandler;
  onGoToBliss: NavigationHandler;
};

type ElevatorPanelProps = {
  activeFloor: FloorCode;
  targetFloor: FloorCode;
  disabled: boolean;
  onGoToAbout: NavigationHandler;
  onGoToAra: NavigationHandler;
  onGoToAnais: NavigationHandler;
  onGoToBliss: NavigationHandler;
  onGoToBooking: NavigationHandler;
};

type ScrollControllerProps = {
  currentStop: Stop;
  isTransitioning: boolean;
  isAutoScrollingRef: React.RefObject<boolean>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onEnterLobby: NavigationHandler;
  onEnterAbout: NavigationHandler;
  onEnterProfile: (profile: Profile) => boolean;
  onEnterBooking: NavigationHandler;
  onLobbyProgress: (progress: number) => void;
};

const DOOR_EASE: [number, number, number, number] = [0.77, 0, 0.175, 1];
const LOBBY_DOOR_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const CABIN_GLOW_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const CABIN_SHAKE_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
// Talar is preserved in the profile data and routing helpers, but intentionally
// left out of the active stop order while that floor is temporarily hidden.
const HIDDEN_PROFILE_STOPS: readonly ProfileStop[] = ["talar"] as const;
const STOP_ORDER: readonly Stop[] = ["lobby", "about", "ara", "anais", "bliss", "booking"] as const;
const ACTIVE_PROFILE_STOPS: readonly ProfileStop[] = ["ara", "anais", "bliss"] as const;

const TRANSITION_TO_TRAVEL_MS = 190;
const TRANSITION_TO_CONTENT_MS = 500;
const TRANSITION_TO_OPEN_MS = 860;
const TRANSITION_TO_IDLE_MS = 1180;
const AUTO_SCROLL_UNLOCK_MS = TRANSITION_TO_IDLE_MS + 120;

const LOBBY_OPEN_PROGRESS = 0.06;
const LOBBY_TO_FIRST_LOCK_PROGRESS = 0.12;
const SCROLL_TRACK_HEIGHT_VH = 360;
const MOBILE_SCROLL_TRACK_HEIGHT_VH = 720;
const MOBILE_BREAKPOINT_PX = 768;
const MOBILE_LOBBY_OPEN_PROGRESS = 0.1;
const MOBILE_LOBBY_TO_FIRST_LOCK_PROGRESS = 0.16;
const MOBILE_PROGRESS_EPSILON = 0.003;
const MOBILE_LOBBY_PROGRESS_LERP_FACTOR = 0.35;
const MOBILE_STOP_STABILITY_MS = 110;
const MOBILE_STOP_HYSTERESIS = 0.018;
const MOBILE_MIN_PROGRESS_DELTA_TO_NAVIGATE = 0.0015;
const SCROLL_NAVIGATION_COOLDOWN_MS = 360;
const BOOKING_EXIT_TOUCH_THRESHOLD_PX = 42;

const LOBBY_DOOR_DURATION = 0.62;
const FLOOR_DOOR_DURATION = 0.58;
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mvzvlkkq";

import logo from "./assets/logo.png";
import aboutHeaderImage from "./assets/header.png";
import araButtonImage from "./assets/eb.jpg";
import araImage from "./assets/ara.jpeg";
import anaisImage from "./assets/anais.png";
import blissImage from "./assets/blisseliss.jpg";
import instaIcon from "./assets/insta.png";
import tiktokIcon from "./assets/tiktok.png";
import soundcloudIcon from "./assets/soundcloud.png";
import placeholderProfileImage from "./assets/react.svg";

const socialIcons = {
  instagram: instaIcon,
  tiktok: tiktokIcon,
  soundcloud: soundcloudIcon,
} satisfies Record<keyof ProfileSocials, string>;

const profiles: Profile[] = [
  {
    id: "ara",
    name: "Ara",
    floorNumber: "01",
    role: "Resident DJ",
    genre: "House / Open Format",
    image: araImage,
    bio: "Ara is a bi-coastal DJ blending house music and Middle Eastern remixes with the energy of late nights in LA and NYC. Inspired by the Ascenseur House aesthetic, his sets move through different levels of bass, tempo, and tension, building from dark late-night sounds into high-energy moments that keep the room moving.",
    socials: {
      instagram: "https://www.instagram.com/arahartounian?igsh=NTc4MTIwNjQ2YQ==",
      tiktok: "https://www.tiktok.com/@aleppoara?_r=1&_t=ZT-96GNZLZe5tN",
      soundcloud: "https://on.soundcloud.com/1j3fyk9eTVGEHrPnKG",
    },
  },
  {
    id: "anais",
    name: "Anaïs",
    floorNumber: "02",
    role: "Resident DJ",
    genre: "MINIMAL BASS / TECH HOUSE",
    image: anaisImage,
    bio: "Anaïs brings a stripped-back blend of minimal bass and tech house shaped by late nights, travel, and underground dance culture. Based in Los Angeles but constantly between cities, her sets are built on deep grooves, rolling basslines, and clean transitions that keep the room locked in from start to finish. Whether it’s a rooftop party, warehouse set, or intimate after-hours crowd, Anaïs focuses on rhythm, tension, and creating an atmosphere that feels effortless but impossible to ignore.",
  },
  {
    id: "talar",
    name: "Talar",
    floorNumber: "03",
    role: "Aesthetic Setter / Social Direction",
    genre: "Visual Identity / Atmosphere / Digital Presence",
    image: placeholderProfileImage,
    bio: "Talar shapes the visual language of Ascenseur House.\n\nFrom lighting cues to digital presence, every detail is considered—how the room feels, how it moves, and how it lives beyond the night. The atmosphere doesn’t happen by chance. It is directed, refined, and continuously evolving.\n\nHer work defines the tone before the first track plays and carries it long after.\n\nSet the tone. Define the moment.",
  },
  {
    id: "bliss",
    name: "Bliss Eliss",
    floorNumber: "04",
    role: "Manager",
    genre: "Bookings / Talent Curation / Event Direction",
    image: blissImage,
    bio: "Bliss Eliss oversees the experience behind the scenes, handling bookings, artist coordination, and the overall shape of each night with precision and style.",
  },
];

const PROFILE_STOPS: readonly ProfileStop[] = ["ara", "anais", "talar", "bliss"] as const;

const profilesByStop = PROFILE_STOPS.reduce(
  (byStop, stop) => {
    const profile = profiles.find((candidate) => candidate.id === stop);

    if (!profile) {
      throw new Error(`Missing profile for ${stop}`);
    }

    byStop[stop] = profile;
    return byStop;
  },
  {} as Record<ProfileStop, Profile>
);

function getDesiredStopFromProgress(progress: number): Stop {
  for (let index = 0; index < STOP_ORDER.length - 1; index += 1) {
    const current = STOP_ORDER[index];
    const next = STOP_ORDER[index + 1];
    const midpoint = (getStopProgress(current) + getStopProgress(next)) / 2;
    if (progress < midpoint) return current;
  }

  return STOP_ORDER[STOP_ORDER.length - 1];
}

function getStopProgress(stop: Stop): number {
  switch (stop) {
    case "lobby":
      return 0;
    case "about":
      return 0.12;
    case "ara":
      return 0.27;
    case "anais":
      return 0.42;
    case "talar":
      return 0.57;
    case "bliss":
      return 0.72;
    case "booking":
      return 0.9;
  }
}

function getStopFromFloor(floor: FloorCode): Stop {
  switch (floor) {
    case "00":
      return "lobby";
    case "A":
      return "about";
    case "01":
      return "ara";
    case "02":
      return "anais";
    case "03":
      return "talar";
    case "04":
      return "bliss";
    case "B":
      return "booking";
  }
}

function getStopFromProfile(profile: Profile): ProfileStop {
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
      className="group relative h-6 w-6 rounded-full border text-[11px] font-semibold text-[var(--text)] transition duration-300 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9 sm:w-9 md:h-12 md:w-12"
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

type ProfileCircleLink = {
  name: string;
  label: string;
  image: string;
  onClick: () => void;
};

function ProfileCircleGrid({ profiles, maxWidthClass }: { profiles: ProfileCircleLink[]; maxWidthClass: string }) {
  return (
    <div
      className={`grid w-full ${maxWidthClass} ${
        profiles.length === 1 ? "grid-cols-1" : "grid-cols-2"
      } justify-items-center gap-x-5 gap-y-5 sm:gap-x-6 md:gap-x-7 lg:gap-x-8`}
    >
      {profiles.map((profile) => (
        <button
          key={profile.name}
          type="button"
          onClick={profile.onClick}
          aria-label={`Go to ${profile.name}`}
          className="group flex flex-col items-center gap-2 text-center outline-none"
        >
          <span className="relative block h-[clamp(5.8rem,12.4vw,9.4rem)] w-[clamp(5.8rem,12.4vw,9.4rem)] overflow-hidden rounded-full bg-black shadow-[0_0_22px_rgba(122,12,12,0.2)] ring-1 ring-white/8 transition duration-300 group-hover:scale-[1.035] group-hover:shadow-[0_0_28px_rgba(164,32,32,0.45),0_0_70px_rgba(122,12,12,0.24)] group-focus-visible:ring-2 group-focus-visible:ring-red-700/80">
            <img src={profile.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
            <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_35%,transparent_42%,rgba(0,0,0,0.38)_100%)]" />
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/58 transition group-hover:text-white/80">
            {profile.label}
          </span>
          <span className="sr-only">{profile.name}</span>
        </button>
      ))}
    </div>
  );
}

function AboutInsideCabin({
  visible,
  onGoToAra,
  onGoToAnais,
  onGoToBliss,
}: {
  visible: boolean;
  onGoToAra: () => void;
  onGoToAnais: () => void;
  onGoToBliss: () => void;
}) {
  const djButtons = [
    { name: "Ara", label: "Ara", image: araButtonImage, onClick: onGoToAra },
    { name: "Anaïs", label: "Anaïs", image: profilesByStop.anais.image, onClick: onGoToAnais },
  ];
  const staffButtons = [
    { name: "Bliss Eliss", label: "Bliss Eliss", image: profilesByStop.bliss.image, onClick: onGoToBliss },
  ];

  return (
    <motion.div
      key="about"
      initial={{ opacity: 0, scale: 0.975, y: 28 }}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.992, y: visible ? 0 : 10 }}
      exit={{ opacity: 0, scale: 0.985, y: -12 }}
      transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 z-[100] overflow-y-auto overflow-x-hidden"
    >
      <section className="relative min-h-full w-full overflow-hidden bg-black text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(122,12,12,0.28),transparent_31%),radial-gradient(circle_at_50%_88%,rgba(122,12,12,0.5),transparent_46%),linear-gradient(180deg,#020202_0%,#070000_52%,#000_100%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[5%] top-[38%] h-[58vh] rounded-full bg-[rgba(122,12,12,0.2)] blur-[100px]"
        />

        <div className="relative z-10 flex min-h-full flex-col items-center text-center">
          <div className="relative h-[36vh] min-h-[210px] w-full sm:h-[38vh] md:h-[40vh] lg:h-[41vh]">
            <img
              src={aboutHeaderImage}
              alt="Ascenseur House atmosphere"
              className="h-full w-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.1)_42%,rgba(0,0,0,0.88)_100%)]"
            />
            <h2 className="absolute inset-x-0 bottom-[-0.14em] mx-auto origin-center scale-x-[0.9] whitespace-normal px-4 text-center text-[clamp(2.85rem,12.2vw,13.4rem)] font-black uppercase leading-[0.78] tracking-[-0.045em] text-white sm:scale-x-[0.92] sm:text-[clamp(4.15rem,12.1vw,13.7rem)] md:scale-x-[0.94] md:whitespace-nowrap md:text-[clamp(5.9rem,10.45vw,13.4rem)]">
              ASCENSEUR HOUSE
            </h2>
          </div>

          <div className="relative mx-auto flex w-full max-w-[94rem] flex-1 flex-col items-center gap-[clamp(0.9rem,1.45vw,1.55rem)] px-5 pb-8 pt-[clamp(1.55rem,3.1vw,3.45rem)] text-center sm:px-8 sm:pb-10 md:px-12 md:pb-12">
            <p className="text-center text-[clamp(1.08rem,1.75vw,2.05rem)] font-medium uppercase leading-none tracking-[0.38em] text-white sm:tracking-[0.5em] md:tracking-[0.58em]">
              CURATED TO ELEVATE
            </p>

            <div className="flex max-w-[74rem] flex-col items-center gap-2 text-center sm:gap-2.5">
              <p className="text-center text-[clamp(1rem,1.32vw,1.54rem)] font-light leading-[1.22] tracking-[0.005em] text-white/85">
                Ascenseur House is a multi-level experience where sound, atmosphere, and presence are intentionally shaped.
              </p>

              <p className="max-w-[58rem] text-center text-[clamp(0.98rem,1.24vw,1.42rem)] font-light leading-[1.22] text-white/80">
                This isn’t just a lineup, theres levels to this shit
              </p>
            </div>

            <div className="grid w-full max-w-[68rem] grid-cols-1 items-start gap-y-[clamp(1.15rem,2.2vw,2rem)] text-center md:grid-cols-[minmax(0,1.1fr)_minmax(14rem,0.9fr)] md:gap-x-[clamp(2rem,5vw,5.5rem)]">
              <div className="flex min-w-0 flex-col items-center gap-[clamp(0.85rem,1.2vw,1.25rem)]">
                <h3 className="text-center text-[clamp(0.72rem,0.82vw,0.92rem)] font-normal uppercase leading-none tracking-[0.34em] text-white/52">
                  DJs
                </h3>

                <ProfileCircleGrid profiles={djButtons} maxWidthClass="max-w-[34rem]" />
              </div>

              <div className="flex min-w-0 flex-col items-center gap-[clamp(0.85rem,1.2vw,1.25rem)] md:pt-0">
                <h3 className="text-center text-[clamp(0.72rem,0.82vw,0.92rem)] font-normal uppercase leading-none tracking-[0.34em] text-white/52">
                  Staff
                </h3>

                <ProfileCircleGrid profiles={staffButtons} maxWidthClass="max-w-[18rem]" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}

function ProfileSocialButton({
  platform,
  href,
}: {
  platform: keyof ProfileSocials;
  href?: string;
}) {
  const iconSrc = socialIcons[platform];
  const label = platform === "soundcloud" ? "SoundCloud" : platform === "tiktok" ? "TikTok" : "Instagram";
  const content = (
    <>
      <img src={iconSrc} alt={label} className="h-6 w-6 object-contain sm:h-7 sm:w-7" loading="lazy" decoding="async" />
      <span className="sr-only">{href ? `Open ${label}` : `${label} link coming soon`}</span>
    </>
  );
  const className =
    "group pointer-events-auto relative flex h-12 w-12 items-center justify-center rounded-full bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_14px_28px_rgba(0,0,0,0.35)] transition duration-300 hover:scale-110 hover:shadow-[0_0_18px_rgba(255,255,255,0.2),0_0_34px_rgba(122,12,12,0.36)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70 sm:h-14 sm:w-14";

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-label={`Open ${label}`}>
        {content}
      </a>
    );
  }

  return (
    <button type="button" className={`${className} cursor-default opacity-55`} aria-label={`${label} link coming soon`} disabled>
      {content}
    </button>
  );
}

function ProfileInsideCabin({ profile, visible }: { profile: Profile; visible: boolean }) {
  const [currentImageSrc, setCurrentImageSrc] = React.useState(profile.image);

  React.useEffect(() => {
    setCurrentImageSrc(profile.image);
  }, [profile.image]);

  const bioParagraphs = React.useMemo(
    () => profile.bio.split("\n\n").filter((paragraph) => paragraph.trim().length > 0),
    [profile.bio]
  );

  const socialPlatforms: Array<keyof ProfileSocials> = ["instagram", "tiktok", "soundcloud"];
  const profileImageFrameClass =
    profile.id === "anais"
      ? "h-[48vh] min-h-[20rem] md:h-full md:min-h-0"
      : "h-[44vh] min-h-[18rem] md:h-full md:min-h-0";
  const profileImagePositionClass = profile.id === "anais" ? "object-[center_top] md:object-center" : "object-center";

  return (
    <motion.div
      key={profile.id}
      initial={{ opacity: 0, scale: 0.975, y: 28 }}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.992, y: visible ? 0 : 10 }}
      exit={{ opacity: 0, scale: 0.985, y: -12 }}
      transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto absolute inset-0 z-[100] overflow-hidden"
    >
      <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#050101] md:grid md:grid-cols-[0.47fr_0.53fr]">
        <motion.div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,0,0,0.46)_0%,rgba(70,0,0,0.52)_42%,rgba(0,0,0,0.92)_76%,rgba(42,0,0,0.6)_100%)]" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 70% 48%, rgba(122,12,12,0.34) 0%, rgba(122,12,12,0.14) 33%, transparent 68%)",
            }}
          />
          <motion.div
            className="absolute top-0 h-full w-[30%] opacity-20 blur-xl md:w-[36%] md:opacity-30 md:blur-3xl"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(122,12,12,0.12) 16%, rgba(122,12,12,0.5) 50%, rgba(122,12,12,0.12) 84%, transparent 100%)",
            }}
            animate={{ x: ["-25%", "140%", "-25%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        <div className={`pointer-events-none relative overflow-hidden ${profileImageFrameClass}`}>
          <img
            src={currentImageSrc}
            alt={profile.name}
            loading="lazy"
            decoding="async"
            onError={() => setCurrentImageSrc(placeholderProfileImage)}
            className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${profileImagePositionClass}`}
          />
          <div className="pointer-events-none absolute inset-0 bg-black/28 md:bg-black/12" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0)_54%,rgba(0,0,0,0.82)_100%)] md:bg-[linear-gradient(90deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.05)_58%,rgba(0,0,0,0.9)_100%)]" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 24% 58%, rgba(122,12,12,0.16) 0%, rgba(122,12,12,0.08) 30%, transparent 62%)",
            }}
          />
        </div>

        <div className="pointer-events-auto relative z-40 flex min-h-0 flex-1 flex-col justify-start overflow-y-visible px-6 pb-24 pt-8 text-left sm:px-8 md:justify-center md:overflow-y-auto md:py-16 md:pl-8 md:pr-[12rem] lg:pl-10 lg:pr-[13rem] xl:pl-12 xl:pr-[14rem]">
          <div className="mb-3.5 inline-flex w-fit items-center gap-2.5 bg-black/28 px-3 py-2 text-white/86 shadow-[0_0_28px_rgba(0,0,0,0.18)]">
            <Music2 className="h-3.5 w-3.5 text-white/78" />
            <span className="text-[0.58rem] font-semibold uppercase tracking-[0.36em] sm:text-[0.62rem]">{profile.role}</span>
          </div>

          <h2 className="text-[3.1rem] font-black uppercase leading-[0.82] tracking-[-0.055em] text-[var(--text)] sm:text-[4rem] md:text-[4.5rem] lg:text-[5.2rem] xl:text-[5.8rem]">
            {profile.name}
          </h2>

          <div className="mt-3.5 inline-block w-fit self-start border border-white/12 bg-black/38 px-3 py-1 text-[0.64rem] font-bold uppercase tracking-[0.22em] text-white/94 shadow-[0_0_0_1px_rgba(122,12,12,0.18)] sm:text-[0.7rem] md:text-xs">
            {profile.genre}
          </div>

          <div className="mt-4 max-w-[38rem] space-y-3 text-[0.95rem] leading-[1.14] tracking-[-0.02em] text-white/86 sm:text-base md:mt-5 md:text-[1.05rem] lg:text-[1.12rem] xl:text-[1.18rem]">
            {bioParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <div className="pointer-events-auto relative mt-8 flex items-center gap-4 sm:gap-5">
            {socialPlatforms.map((platform) => (
              <ProfileSocialButton key={platform} platform={platform} href={profile.socials?.[platform]} />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BookingInsideCabin({
  visible,
  onExitUp,
  onReturnToLobby,
}: {
  visible: boolean;
  onExitUp: NavigationHandler;
  onReturnToLobby: NavigationHandler;
}) {
  const bookingRootRef = React.useRef<HTMLDivElement | null>(null);
  const mobileScrollRef = React.useRef<HTMLDivElement | null>(null);
  const desktopFormScrollRef = React.useRef<HTMLDivElement | null>(null);
  const touchStartYRef = React.useRef<number | null>(null);
  const touchStartedOnInteractiveRef = React.useRef(false);
  const exitRequestPendingRef = React.useRef(false);
  const exitResetTimerRef = React.useRef<number | null>(null);
  const [submitStatus, setSubmitStatus] = React.useState<BookingSubmitStatus>("idle");

  const handleBookingSubmit = React.useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    setSubmitStatus("sending");

    try {
      const minimumLoadingTime = new Promise((resolve) => window.setTimeout(resolve, 900));
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      await minimumLoadingTime;

      if (!response.ok) {
        throw new Error("Formspree submission failed");
      }

      setSubmitStatus("success");
      form.reset();
    } catch {
      setSubmitStatus("error");
    }
  }, []);

  const resetBookingFlow = React.useCallback(() => {
    setSubmitStatus("idle");
  }, []);

  React.useEffect(() => {
    if (visible) {
      exitRequestPendingRef.current = false;
    }
  }, [visible]);

  React.useEffect(() => {
    if (submitStatus === "idle") return;

    mobileScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    desktopFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [submitStatus]);

  React.useEffect(() => {
    const interactiveSelector = "input, textarea, select, button, a, label";

    const targetIsInsideBooking = (target: EventTarget | null) =>
      target instanceof Node && Boolean(bookingRootRef.current?.contains(target));

    const targetIsInteractive = (target: EventTarget | null) =>
      target instanceof Element && Boolean(target.closest(interactiveSelector));

    const getActiveScrollElement = () => {
      if (window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT_PX}px)`).matches) {
        return desktopFormScrollRef.current;
      }

      return mobileScrollRef.current;
    };

    const requestBookingExit = () => {
      if (exitRequestPendingRef.current) return;
      exitRequestPendingRef.current = onExitUp();

      if (!exitRequestPendingRef.current) {
        exitResetTimerRef.current = window.setTimeout(() => {
          exitRequestPendingRef.current = false;
          exitResetTimerRef.current = null;
        }, SCROLL_NAVIGATION_COOLDOWN_MS);
      }
    };

    const handleWheel = (event: WheelEvent) => {
      if (!targetIsInsideBooking(event.target) || targetIsInteractive(event.target)) return;

      const el = getActiveScrollElement();
      if (!el) return;

      if (el.scrollTop <= 0 && event.deltaY < -18) {
        event.preventDefault();
        requestBookingExit();
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (!targetIsInsideBooking(event.target)) return;

      touchStartedOnInteractiveRef.current = targetIsInteractive(event.target);
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!targetIsInsideBooking(event.target) || touchStartedOnInteractiveRef.current) return;

      const el = getActiveScrollElement();
      if (!el || touchStartYRef.current == null) return;

      const currentY = event.touches[0]?.clientY ?? touchStartYRef.current;
      const deltaY = currentY - touchStartYRef.current;

      if (el.scrollTop <= 0 && deltaY > BOOKING_EXIT_TOUCH_THRESHOLD_PX) {
        requestBookingExit();
        touchStartYRef.current = null;
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      if (exitResetTimerRef.current !== null) {
        window.clearTimeout(exitResetTimerRef.current);
        exitResetTimerRef.current = null;
      }
    };
  }, [onExitUp]);

  return (
    <motion.div
      key="booking"
      initial={{ opacity: 0, scale: 0.985, y: 18 }}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.99, y: visible ? 0 : 8 }}
      exit={{ opacity: 0, scale: 0.985, y: -10 }}
      transition={{ duration: 0.54, ease: [0.22, 1, 0.36, 1] }}
      ref={bookingRootRef}
      className="pointer-events-auto absolute inset-0 isolate z-50 overflow-hidden"
    >
      <div
        ref={mobileScrollRef}
        className="pointer-events-auto relative h-full w-full overflow-y-auto overscroll-y-auto bg-[#060607] md:overflow-hidden"
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,#050505_0%,#0d0d10_46%,#050505_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.7)_40%,rgba(0,0,0,0.82)_100%)]" />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 32% 58%, rgba(122,12,12,0.14) 0%, rgba(122,12,12,0.06) 26%, transparent 62%)",
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/75 to-transparent" />
          <motion.div
            className="pointer-events-none absolute top-0 h-full w-[26%] opacity-12 blur-xl md:w-[34%] md:opacity-22 md:blur-3xl"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(122,12,12,0.18) 18%, rgba(122,12,12,0.55) 50%, rgba(122,12,12,0.18) 82%, transparent 100%)",
            }}
            animate={{ x: ["-25%", "140%", "-25%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>


        <div className="pointer-events-auto relative z-30 flex min-h-full flex-col pt-20 md:h-full md:min-h-0 md:pt-0">
          <div
            ref={desktopFormScrollRef}
            className="min-h-0 w-full overflow-visible px-6 py-7 pb-14 sm:px-10 md:flex md:h-full md:items-center md:overflow-y-auto md:px-10 md:py-16 lg:px-14"
          >
            <div className="pointer-events-auto relative mx-auto flex w-full max-w-[58rem] flex-col items-center px-0 text-center md:max-w-[min(58rem,calc(100vw-21.5rem))] xl:max-w-[58rem]">
              <AnimatePresence mode="wait">
                {submitStatus === "idle" && (
                  <motion.div
                    key="booking-form"
                    initial={{ opacity: 0, y: 18, scale: 0.985 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -28, scale: 0.94, filter: "blur(10px)" }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="pointer-events-auto flex w-full flex-col items-center"
                  >
                    <div className="mb-4 inline-flex items-center gap-3 border border-white/8 bg-black/36 px-4 py-2.5 text-white/78 shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-md">
                      <CalendarDays className="h-4 w-4 shrink-0 text-white/70" />
                      <span className="text-[10px] uppercase tracking-[0.34em]">Private Inquiry</span>
                    </div>

                    <h2 className="max-w-full text-center text-[clamp(2.35rem,4.7vw,5.2rem)] font-semibold leading-[0.95] tracking-[0.06em] text-[var(--text)] drop-shadow-[0_18px_42px_rgba(0,0,0,0.52)] sm:whitespace-nowrap sm:tracking-[0.09em]">
                      Book Ascenseur House
                    </h2>

                    <p className="mt-4 max-w-[58ch] text-center text-sm leading-6 text-white/70 sm:text-base sm:leading-7 md:text-base md:leading-7">
                      Private events, artist bookings, venue partnerships, and curated experiences shaped with the atmosphere of Ascenseur House.
                    </p>

                    <form
                      action={FORMSPREE_ENDPOINT}
                      method="POST"
                      onSubmit={handleBookingSubmit}
                      className="pointer-events-auto relative z-40 mt-6 w-full max-w-[58rem]"
                    >
                      <input type="hidden" name="_subject" value="New Ascenseur House Booking Inquiry" />

                      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4 md:gap-5">
                        <input
                          type="text"
                          name="name"
                          required
                          className="w-full appearance-none rounded-[20px] border px-5 py-3.5 text-base text-[var(--text)] outline-none transition placeholder:text-white/32 focus:border-white/24 focus:bg-white/[0.06] sm:px-6 sm:py-3.5 sm:text-lg"
                          style={{
                            borderColor: "rgba(255,255,255,0.1)",
                            background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.032))",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 42px rgba(0,0,0,0.2)",
                          }}
                          placeholder="Name"
                        />

                        <input
                          type="text"
                          name="company"
                          className="w-full appearance-none rounded-[20px] border px-5 py-3.5 text-base text-[var(--text)] outline-none transition placeholder:text-white/32 focus:border-white/24 focus:bg-white/[0.06] sm:px-6 sm:py-3.5 sm:text-lg"
                          style={{
                            borderColor: "rgba(255,255,255,0.1)",
                            background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.032))",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 42px rgba(0,0,0,0.2)",
                          }}
                          placeholder="Company / Venue"
                        />

                        <input
                          type="email"
                          name="email"
                          required
                          className="w-full appearance-none rounded-[20px] border px-5 py-3.5 text-base text-[var(--text)] outline-none transition placeholder:text-white/32 focus:border-white/24 focus:bg-white/[0.06] sm:px-6 sm:py-3.5 sm:text-lg"
                          style={{
                            borderColor: "rgba(255,255,255,0.1)",
                            background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.032))",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 42px rgba(0,0,0,0.2)",
                          }}
                          placeholder="Email"
                        />

                        <input
                          type="tel"
                          name="phone"
                          className="w-full appearance-none rounded-[20px] border px-5 py-3.5 text-base text-[var(--text)] outline-none transition placeholder:text-white/32 focus:border-white/24 focus:bg-white/[0.06] sm:px-6 sm:py-3.5 sm:text-lg"
                          style={{
                            borderColor: "rgba(255,255,255,0.1)",
                            background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.032))",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 42px rgba(0,0,0,0.2)",
                          }}
                          placeholder="Phone Number"
                        />

                        <textarea
                          name="message"
                          required
                          className="min-h-[130px] w-full appearance-none rounded-[20px] border px-5 py-3.5 text-base text-[var(--text)] outline-none transition placeholder:text-white/32 focus:border-white/24 focus:bg-white/[0.06] sm:col-span-2 sm:px-6 sm:py-3.5 sm:text-lg md:min-h-[136px]"
                          style={{
                            borderColor: "rgba(255,255,255,0.1)",
                            background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.032))",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 22px 48px rgba(0,0,0,0.22)",
                          }}
                          placeholder="Tell us about your event, who you’d like to book, and whether you are in New York or Los Angeles."
                        />

                        <div className="flex flex-col items-center gap-4 pt-1 sm:col-span-2">
                          <UIButton
                            type="submit"
                            className="cursor-pointer border px-7 py-3.5 text-white sm:px-9"
                            style={{
                              borderColor: "rgba(255,255,255,0.14)",
                              background: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(122,12,12,0.22))",
                            }}
                          >
                            Send Inquiry
                          </UIButton>

                          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center text-sm text-white/62 sm:text-base">
                            <span className="uppercase tracking-[0.22em] text-white/38">Direct Contact</span>
                            <a href="tel:+16262406905" className="text-white/62">
                              (626) 240-6905
                            </a>
                            <a href="mailto:bookings@ascenseurhouse.com" className="break-all text-white/62">
                              bookings@ascenseurhouse.com
                            </a>
                          </div>
                        </div>
                      </div>
                    </form>
                  </motion.div>
                )}

                {submitStatus === "sending" && (
                  <motion.div
                    key="booking-sending"
                    role="status"
                    aria-live="polite"
                    initial={{ opacity: 0, scale: 1.04, filter: "blur(14px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.98, filter: "blur(10px)" }}
                    transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
                    className="relative flex min-h-[calc(100vh-8rem)] w-full flex-col items-center justify-center overflow-hidden rounded-[30px] border border-white/8 bg-black/28 px-5 py-16 text-center shadow-[0_30px_90px_rgba(0,0,0,0.44)] backdrop-blur-sm md:min-h-[calc(100vh-10rem)]"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(122,12,12,0.36),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.2))]" />
                    <motion.div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/12"
                      animate={{ opacity: [0.2, 0.72, 0.2] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      aria-hidden="true"
                      className="pointer-events-none absolute top-0 h-full w-[34%] bg-[linear-gradient(90deg,transparent,rgba(122,12,12,0.48),transparent)] blur-2xl"
                      animate={{ x: ["-170%", "170%"] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    />

                    <div className="relative z-10 mb-8 flex h-36 w-24 items-center justify-center rounded-[22px] border border-white/10 bg-[#09090b] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_0_70px_rgba(122,12,12,0.3)] sm:h-44 sm:w-28">
                      <motion.div
                        className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-white/18"
                        animate={{ scaleY: [0.32, 1, 0.32], opacity: [0.24, 0.9, 0.24] }}
                        transition={{ duration: 1.15, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <motion.div
                        className="h-12 w-12 rounded-full border border-[rgba(122,12,12,0.55)] bg-[radial-gradient(circle,rgba(122,12,12,0.95),rgba(25,2,2,0.9))] shadow-[0_0_34px_rgba(122,12,12,0.62)]"
                        animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.78, 1, 0.78] }}
                        transition={{ duration: 1.05, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>

                    <div className="relative z-10 text-[10px] font-semibold uppercase tracking-[0.54em] text-white/42 sm:text-xs">
                      Submitting Inquiry
                    </div>
                    <h2 className="relative z-10 mt-4 text-[clamp(2.4rem,7vw,6.4rem)] font-black uppercase leading-[0.86] tracking-[-0.04em] text-white">
                      Routing Request
                    </h2>
                    <motion.p
                      className="relative z-10 mt-5 text-sm uppercase tracking-[0.34em] text-white/66 sm:text-base"
                      animate={{ opacity: [0.46, 1, 0.46] }}
                      transition={{ duration: 1.7, repeat: Infinity, ease: "easeInOut" }}
                    >
                      Preparing Your Ascent
                    </motion.p>
                  </motion.div>
                )}

                {submitStatus === "success" && (
                  <motion.div
                    key="booking-success"
                    role="status"
                    aria-live="polite"
                    initial={{ opacity: 0, y: 26, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -18, scale: 0.98 }}
                    transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
                    className="relative flex min-h-[calc(100vh-8rem)] w-full flex-col items-center justify-center overflow-hidden rounded-[30px] border border-white/10 bg-black/30 px-5 py-16 text-center shadow-[0_34px_100px_rgba(0,0,0,0.48)] backdrop-blur-sm md:min-h-[calc(100vh-10rem)]"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(122,12,12,0.32),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.18))]" />
                    <div className="pointer-events-none absolute inset-x-[12%] top-1/2 h-px bg-white/12" />
                    <div className="relative z-10 mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-[10px] uppercase tracking-[0.34em] text-white/54">
                      Floor B · Request Logged
                    </div>
                    <h2 className="relative z-10 text-[clamp(2.7rem,8vw,7rem)] font-black uppercase leading-[0.82] tracking-[-0.05em] text-white drop-shadow-[0_18px_54px_rgba(122,12,12,0.26)]">
                      Inquiry Received
                    </h2>
                    <p className="relative z-10 mt-6 max-w-[38rem] text-base leading-7 text-white/72 sm:text-lg">
                      Your request has entered the queue. Ascenseur House will be in touch.
                    </p>
                    <div className="relative z-10 mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                      <UIButton
                        type="button"
                        onClick={onReturnToLobby}
                        className="cursor-pointer border px-7 py-3.5 text-white sm:px-9"
                        style={{
                          borderColor: "rgba(255,255,255,0.16)",
                          background: "linear-gradient(180deg, rgba(255,255,255,0.1), rgba(122,12,12,0.24))",
                        }}
                      >
                        Return to Lobby
                      </UIButton>
                      <UIButton
                        type="button"
                        onClick={resetBookingFlow}
                        className="cursor-pointer border px-7 py-3.5 text-white/82 sm:px-9"
                        style={{
                          borderColor: "rgba(255,255,255,0.1)",
                          background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))",
                        }}
                      >
                        Send Another Inquiry
                      </UIButton>
                    </div>
                  </motion.div>
                )}

                {submitStatus === "error" && (
                  <motion.div
                    key="booking-error"
                    role="alert"
                    initial={{ opacity: 0, y: 24, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -18, scale: 0.98 }}
                    transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1] }}
                    className="relative flex min-h-[calc(100vh-8rem)] w-full flex-col items-center justify-center overflow-hidden rounded-[30px] border border-red-900/35 bg-black/30 px-5 py-16 text-center shadow-[0_34px_100px_rgba(0,0,0,0.48)] backdrop-blur-sm md:min-h-[calc(100vh-10rem)]"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(122,12,12,0.26),transparent_40%)]" />
                    <div className="relative z-10 mb-5 text-[10px] font-semibold uppercase tracking-[0.5em] text-red-100/46">
                      Route Interrupted
                    </div>
                    <h2 className="relative z-10 text-[clamp(2.25rem,6vw,5.4rem)] font-black uppercase leading-[0.88] tracking-[-0.04em] text-white">
                      Inquiry Not Sent
                    </h2>
                    <p className="relative z-10 mt-5 max-w-[35rem] text-base leading-7 text-white/72 sm:text-lg">
                      Something went wrong. Please try again or contact us directly.
                    </p>
                    <div className="relative z-10 mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                      <UIButton
                        type="button"
                        onClick={resetBookingFlow}
                        className="cursor-pointer border px-7 py-3.5 text-white sm:px-9"
                        style={{
                          borderColor: "rgba(255,255,255,0.16)",
                          background: "linear-gradient(180deg, rgba(255,255,255,0.1), rgba(122,12,12,0.24))",
                        }}
                      >
                        Try Again
                      </UIButton>
                      <UIButton
                        type="button"
                        onClick={onReturnToLobby}
                        className="cursor-pointer border px-7 py-3.5 text-white/82 sm:px-9"
                        style={{
                          borderColor: "rgba(255,255,255,0.1)",
                          background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))",
                        }}
                      >
                        Return to Lobby
                      </UIButton>
                    </div>
                    <div className="relative z-10 mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center text-sm text-white/62 sm:text-base">
                      <span className="uppercase tracking-[0.22em] text-white/38">Direct Contact</span>
                      <a href="tel:+16262406905" className="text-white/62">
                        (626) 240-6905
                      </a>
                      <a href="mailto:bookings@ascenseurhouse.com" className="break-all text-white/62">
                        bookings@ascenseurhouse.com
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
  onExitBookingUp,
  onReturnToLobby,
  onGoToAra,
  onGoToAnais,
  onGoToBliss,
}: ElevatorSceneProps) {
  const isLobby = view === "lobby";
  const doorsOpen = !isLobby && (travelState === "opening" || travelState === "idle");
  const contentVisible = !isLobby && travelState === "idle";
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
                    <img
                      src={logo}
                      alt="Ascenseur House"
                      className="mb-[clamp(0.85rem,1.4vw,1.35rem)] h-[clamp(5.4rem,9.1vw,9.25rem)] w-auto object-contain opacity-95 drop-shadow-[0_0_22px_rgba(255,255,255,0.12)]"
                    />
                    <h1
                      className="origin-center scale-x-[0.96] whitespace-nowrap text-center text-[clamp(1.9rem,9.75vw,4rem)] font-black uppercase leading-[0.82] tracking-[0.015em] text-white drop-shadow-[0_10px_28px_rgba(0,0,0,0.32)] sm:scale-x-100 sm:text-[clamp(3.85rem,8.65vw,8rem)] md:scale-x-[1.04] md:text-[clamp(5.35rem,8.4vw,8.65rem)]"
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
                      className="mt-[clamp(0.66rem,0.9vw,0.95rem)] text-[clamp(0.72rem,1.12vw,1.22rem)] font-semibold uppercase leading-none tracking-[0.44em] text-white/92 sm:tracking-[0.54em] md:tracking-[0.62em]"
                      style={{
                        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                      }}
                    >
                      CURATED TO ELEVATE
                    </p>
                  </motion.div>
                </motion.div>
              ) : (
                <>
                  {view === "profile" && selectedProfile && (
                    <ProfileInsideCabin profile={selectedProfile} visible={contentVisible} />
                  )}
                  {view === "profile" && !selectedProfile && (
                    <AboutInsideCabin
                      visible={contentVisible}
                      onGoToAra={onGoToAra}
                      onGoToAnais={onGoToAnais}
                      onGoToBliss={onGoToBliss}
                    />
                  )}
                  {view === "booking" && (
                    <BookingInsideCabin
                      visible={contentVisible}
                      onExitUp={onExitBookingUp}
                      onReturnToLobby={onReturnToLobby}
                    />
                  )}
                </>
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

function ScrollController({
  currentStop,
  isTransitioning,
  isAutoScrollingRef,
  containerRef,
  onEnterLobby,
  onEnterAbout,
  onEnterProfile,
  onEnterBooking,
  onLobbyProgress,
}: ScrollControllerProps) {
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 0.02}px)`).matches;
  });
  const lastAutoScrollProgressRef = React.useRef<number | null>(null);
  const lastRawProgressRef = React.useRef(scrollYProgress.get());
  const lastLobbyProgressRef = React.useRef<number | null>(null);
  const pendingStopRef = React.useRef<Stop | null>(null);
  const stableStopRef = React.useRef<{ stop: Stop; since: number } | null>(null);
  const scrollNavigationCooldownUntilRef = React.useRef(0);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 0.02}px)`);

    const handleViewportChange = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches);
    };

    setIsMobile(query.matches);
    query.addEventListener("change", handleViewportChange);
    return () => query.removeEventListener("change", handleViewportChange);
  }, []);

  React.useEffect(() => {
    if (isTransitioning) return;
    pendingStopRef.current = null;
    stableStopRef.current = null;
    scrollNavigationCooldownUntilRef.current = performance.now() + SCROLL_NAVIGATION_COOLDOWN_MS;
  }, [currentStop, isTransitioning]);

  const getMobileGuardedStop = React.useCallback(
    (latest: number, desiredStop: Stop) => {
      if (!isMobile || desiredStop === currentStop) return desiredStop;

      const currentIndex = STOP_ORDER.indexOf(currentStop);
      const desiredIndex = STOP_ORDER.indexOf(desiredStop);
      if (currentIndex < 0 || desiredIndex < 0) return desiredStop;

      const progressDelta = latest - lastRawProgressRef.current;
      if (Math.abs(progressDelta) < MOBILE_MIN_PROGRESS_DELTA_TO_NAVIGATE) return currentStop;

      const direction = Math.sign(progressDelta) || Math.sign(desiredIndex - currentIndex);
      const nextIndex = currentIndex + Math.sign(desiredIndex - currentIndex);
      const guardedStop = STOP_ORDER[Math.max(0, Math.min(STOP_ORDER.length - 1, nextIndex))];
      const midpoint = (getStopProgress(currentStop) + getStopProgress(guardedStop)) / 2;
      const clearlyPastMidpoint =
        direction >= 0 ? latest >= midpoint + MOBILE_STOP_HYSTERESIS : latest <= midpoint - MOBILE_STOP_HYSTERESIS;
      const now = performance.now();

      if (stableStopRef.current?.stop !== guardedStop) {
        stableStopRef.current = { stop: guardedStop, since: now };
      }

      const stableLongEnough = now - stableStopRef.current.since >= MOBILE_STOP_STABILITY_MS;
      return clearlyPastMidpoint || stableLongEnough ? guardedStop : currentStop;
    },
    [currentStop, isMobile]
  );

  const processScrollProgress = React.useCallback(
    (latest: number) => {
      const openProgress = isMobile ? MOBILE_LOBBY_OPEN_PROGRESS : LOBBY_OPEN_PROGRESS;
      const lockProgress = isMobile ? MOBILE_LOBBY_TO_FIRST_LOCK_PROGRESS : LOBBY_TO_FIRST_LOCK_PROGRESS;
      const rawProgress = Math.max(0, Math.min(latest / openProgress, 1));
      const easedProgress = isMobile
        ? rawProgress * rawProgress * (3 - 2 * rawProgress)
        : 1 - Math.pow(1 - rawProgress, 3);
      const targetLobbyProgress = latest >= lockProgress ? 1 : easedProgress;
      const lobbyProgress =
        isMobile && lastLobbyProgressRef.current !== null
          ? lastLobbyProgressRef.current +
            (targetLobbyProgress - lastLobbyProgressRef.current) * MOBILE_LOBBY_PROGRESS_LERP_FACTOR
          : targetLobbyProgress;

      if (
        !isMobile ||
        lastLobbyProgressRef.current === null ||
        Math.abs(lobbyProgress - lastLobbyProgressRef.current) >= MOBILE_PROGRESS_EPSILON
      ) {
        lastLobbyProgressRef.current = lobbyProgress;
        onLobbyProgress(lobbyProgress);
      }

      if (isTransitioning || pendingStopRef.current !== null) return;
      if (performance.now() < scrollNavigationCooldownUntilRef.current) return;

      const rawDesiredStop = currentStop === "lobby" && latest < lockProgress ? "lobby" : getDesiredStopFromProgress(latest);
      const desiredStop = getMobileGuardedStop(latest, rawDesiredStop);
      if (desiredStop === currentStop) return;

      let transitionStarted = false;

      if (desiredStop === "lobby") {
        transitionStarted = onEnterLobby();
      } else if (desiredStop === "booking") {
        transitionStarted = onEnterBooking();
      } else if (desiredStop === "about") {
        transitionStarted = onEnterAbout();
      } else {
        transitionStarted = onEnterProfile(profilesByStop[desiredStop]);
      }

      if (transitionStarted) {
        pendingStopRef.current = desiredStop;
        scrollNavigationCooldownUntilRef.current = performance.now() + SCROLL_NAVIGATION_COOLDOWN_MS;
      }
    },
    [
      currentStop,
      getMobileGuardedStop,
      isMobile,
      isTransitioning,
      onEnterAbout,
      onEnterBooking,
      onEnterLobby,
      onEnterProfile,
      onLobbyProgress,
    ]
  );

  useMotionValueEvent(scrollYProgress, "change", (latest: number) => {
    if (isAutoScrollingRef.current) {
      lastAutoScrollProgressRef.current = latest;
      lastRawProgressRef.current = latest;
      return;
    }

    if (lastAutoScrollProgressRef.current !== null) {
      const deltaFromAuto = Math.abs(latest - lastAutoScrollProgressRef.current);
      if (deltaFromAuto < 0.012) {
        lastRawProgressRef.current = latest;
        return;
      }
      lastAutoScrollProgressRef.current = null;
    }

    processScrollProgress(latest);
    lastRawProgressRef.current = latest;
  });

  React.useEffect(() => {
    lastRawProgressRef.current = scrollYProgress.get();
    lastLobbyProgressRef.current = null;
    stableStopRef.current = null;
    scrollNavigationCooldownUntilRef.current = performance.now() + SCROLL_NAVIGATION_COOLDOWN_MS;
  }, [isMobile, scrollYProgress]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none relative w-full"
      style={{ height: `${isMobile ? MOBILE_SCROLL_TRACK_HEIGHT_VH : SCROLL_TRACK_HEIGHT_VH}vh` }}
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
  const transitionLockedRef = React.useRef(false);

  const clearTimers = React.useCallback(() => {
    timeoutsRef.current.forEach((id) => window.clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  React.useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    clearTimers();
    isAutoScrollingRef.current = false;
    transitionLockedRef.current = false;
    setView("lobby");
    setActiveFloor("00");
    setDisplayFloor("00");
    setTargetFloor("00");
    setSelectedProfile(null);
    setTravelState("idle");
    setLobbyDoorProgress(0);
    setHasLeftLobby(false);
    setForceClosedLobby(false);
    window.scrollTo(0, 0);

    const resetScrollTimer = window.setTimeout(() => {
      window.scrollTo(0, 0);
    }, 0);

    return () => window.clearTimeout(resetScrollTimer);
  }, [clearTimers]);

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
      if (transitionLockedRef.current || travelState !== "idle") return false;
      if (activeFloor === target.floor && displayFloor === target.floor && view === target.view) return false;

      transitionLockedRef.current = true;
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
          transitionLockedRef.current = false;
        }, TRANSITION_TO_IDLE_MS)
      );

      return true;
    },
    [activeFloor, clearTimers, displayFloor, scrollToStop, travelState, view]
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
    (profile: Profile) =>
      goToStop({
        stop: getStopFromProfile(profile),
        view: "profile",
        floor: profile.floorNumber,
        profile,
      }),
    [goToStop]
  );

  const openBooking = React.useCallback(() =>
    goToStop({
      stop: "booking",
      view: "booking",
      floor: "B",
      profile: null,
    }), [goToStop]);

  const goLobby = React.useCallback(() =>
    goToStop({
      stop: "lobby",
      view: "lobby",
      floor: "00",
      profile: null,
    }), [goToStop]);

  const goToAra = React.useCallback(() =>
    goToStop({
      stop: "ara",
      view: "profile",
      floor: "01",
      profile: profilesByStop.ara,
    }), [goToStop]);

  const goToAnais = React.useCallback(() =>
    goToStop({
      stop: "anais",
      view: "profile",
      floor: "02",
      profile: profilesByStop.anais,
    }), [goToStop]);

  const goToTalar = React.useCallback(() =>
    goToStop({
      stop: "talar",
      view: "profile",
      floor: "03",
      profile: profilesByStop.talar,
    }), [goToStop]);

  const goToBliss = React.useCallback(() =>
    goToStop({
      stop: "bliss",
      view: "profile",
      floor: "04",
      profile: profilesByStop.bliss,
    }), [goToStop]);

  const goToBooking = React.useCallback(() =>
    goToStop({
      stop: "booking",
      view: "booking",
      floor: "B",
      profile: null,
    }), [goToStop]);

  const currentStop = getStopFromFloor(activeFloor);
  const isTransitioning = travelState !== "idle";

  const goToAbout = React.useCallback(() =>
    goToStop({
      stop: "about",
      view: "profile",
      floor: "A",
      profile: null,
    }), [goToStop]);

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
    >
      {activeFloor !== "00" && (
        <div className="fixed left-1/2 top-2 z-[10001] -translate-x-1/2">
          <div className="relative">
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-40 -translate-x-1/2 -translate-y-1/2 opacity-60 blur-2xl"
              style={{
                background:
                  "radial-gradient(circle, rgba(122,12,12,0.45) 0%, rgba(122,12,12,0.25) 35%, rgba(122,12,12,0.08) 65%, transparent 100%)",
                boxShadow: "0 0 30px rgba(122,12,12,0.35), 0 0 60px rgba(122,12,12,0.2)",
              }}
            />
            <button type="button" onClick={goLobby} className="relative z-[10002] cursor-pointer">
              <img src={logo} alt="Ascenseur House" className="h-10 w-auto object-contain opacity-90 md:h-12" />
            </button>
          </div>
        </div>
      )}

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
              onGoToAbout={goToAbout}
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
          onExitBookingUp={goToBliss}
          onReturnToLobby={goLobby}
          onGoToAra={goToAra}
          onGoToAnais={goToAnais}
          onGoToTalar={goToTalar}
          onGoToBliss={goToBliss}
        />
      </div>

      <ScrollController
        currentStop={currentStop}
        isTransitioning={isTransitioning}
        isAutoScrollingRef={isAutoScrollingRef}
        containerRef={scrollAreaRef}
        onEnterLobby={goLobby}
        onEnterAbout={goToAbout}
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

if (typeof window !== "undefined" && import.meta.env.DEV) {
  console.assert(getStopFromFloor("00") === "lobby", "00 should map to lobby");
  console.assert(getStopFromFloor("A") === "about", "A should map to about");
  console.assert(getStopFromFloor("01") === "ara", "01 should map to ara");
  console.assert(getStopFromFloor("02") === "anais", "02 should map to anais");
  console.assert(getStopFromFloor("03") === "talar", "03 should map to talar");
  console.assert(getStopFromFloor("04") === "bliss", "04 should map to bliss");
  console.assert(getStopFromFloor("B") === "booking", "B should map to booking");

  console.assert(getStopProgress("lobby") === 0, "lobby progress should be 0");
  console.assert(getStopProgress("about") < getStopProgress("ara"), "about should come before ara");
  console.assert(getStopProgress("ara") < getStopProgress("anais"), "ara should come before anais");
  console.assert(HIDDEN_PROFILE_STOPS.includes("talar"), "Talar should remain preserved as a temporarily hidden profile stop");
  console.assert(!STOP_ORDER.includes("talar"), "Talar should be hidden from the active scroll order");
  console.assert(!ACTIVE_PROFILE_STOPS.includes("talar"), "Talar should be hidden from active profile navigation");
  console.assert(getStopProgress("anais") < getStopProgress("bliss"), "anais should come before bliss");
  console.assert(getStopProgress("bliss") < getStopProgress("booking"), "bliss should come before booking");
  console.assert(getStopProgress("booking") <= 1, "booking progress should stay within scroll range");
  console.assert(getStopProgress("about") < 0.2, "about should be close to the top");

  console.assert(getStopFromProfile(profilesByStop.ara) === "ara", "Ara profile should resolve to ara stop");
  console.assert(getStopFromProfile(profilesByStop.anais) === "anais", "Anais profile should resolve to anais stop");
  console.assert(getStopFromProfile(profilesByStop.talar) === "talar", "Talar profile should remain restorable as talar stop");
  console.assert(getStopFromProfile(profilesByStop.bliss) === "bliss", "Bliss profile should resolve to bliss stop");

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
  console.assert(
    MOBILE_SCROLL_TRACK_HEIGHT_VH > SCROLL_TRACK_HEIGHT_VH,
    "mobile scroll track should give floor stops extra breathing room"
  );
}
