import React from "react";
import { motion } from "framer-motion";
import { Music2 } from "lucide-react";
import type { Profile, ProfileSocials } from "../types";
import instaIcon from "../assets/insta.png";
import tiktokIcon from "../assets/tiktok.png";
import soundcloudIcon from "../assets/soundcloud.png";
import placeholderProfileImage from "../assets/react.svg";
const socialIcons = {
  instagram: instaIcon,
  tiktok: tiktokIcon,
  soundcloud: soundcloudIcon,
} satisfies Record<keyof ProfileSocials, string>;

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

export default function ProfileInsideCabin({ profile, visible }: { profile: Profile; visible: boolean }) {
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
      data-floor-scroll={profile.id}
      className="pointer-events-auto absolute inset-0 z-[100] overflow-y-auto overscroll-y-contain md:overflow-hidden"
    >
      <div className="relative flex min-h-full w-full flex-col overflow-hidden bg-[#050101] md:h-full md:grid md:grid-cols-[0.47fr_0.53fr]">
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

        <div data-floor-scroll={profile.id} className="pointer-events-auto relative z-40 flex min-h-0 flex-1 flex-col justify-start overflow-y-visible px-6 pb-24 pt-8 text-left sm:px-8 md:justify-center md:overflow-y-auto md:py-16 md:pl-8 md:pr-[12rem] lg:pl-10 lg:pr-[13rem] xl:pl-12 xl:pr-[14rem]">
          <div className="mb-3.5 inline-flex w-fit items-center gap-2.5 bg-black/28 px-3 py-2 text-white/86 shadow-[0_0_28px_rgba(0,0,0,0.18)]">
            <Music2 className="h-3.5 w-3.5 text-white/78" />
            <span className="font-subheading text-[0.58rem] uppercase tracking-[0.36em] sm:text-[0.62rem]">{profile.role}</span>
          </div>

          <h2 className="font-display text-[2.9rem] uppercase leading-[0.88] tracking-[-0.025em] text-[var(--text)] sm:text-[3.8rem] md:text-[4.3rem] lg:text-[4.9rem] xl:text-[5.4rem]">
            {profile.name}
          </h2>

          <div className="font-title mt-3.5 inline-block w-fit self-start border border-white/12 bg-black/38 px-3 py-1 text-[0.64rem] uppercase tracking-[0.22em] text-white/94 shadow-[0_0_0_1px_rgba(122,12,12,0.18)] sm:text-[0.7rem] md:text-xs">
            {profile.genre}
          </div>

          <div className="font-body mt-4 max-w-[38rem] space-y-3 text-[0.95rem] leading-[1.14] tracking-[0.002em] text-white/86 sm:text-base md:mt-5 md:text-[1.05rem] lg:text-[1.12rem] xl:text-[1.18rem]">
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

