import React from "react";
import { motion } from "framer-motion";
import { Music2 } from "lucide-react";
import type { Profile, ProfileSocials } from "../types";
import instaIcon from "../assets/insta.png";
import tiktokIcon from "../assets/tiktok.png";
import soundcloudIcon from "../assets/soundcloud.png";
import "./ProfileInsideCabin.css";

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
      <img src={iconSrc} alt="" className="h-6 w-6 object-contain sm:h-7 sm:w-7" loading="lazy" decoding="async" />
      <span className="sr-only">{href ? `Open ${label}` : `${label} link coming soon`}</span>
    </>
  );
  const className =
    "group pointer-events-auto relative flex h-12 w-12 items-center justify-center rounded-full bg-black shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_14px_28px_rgba(0,0,0,0.35)] transition duration-300 hover:scale-110 hover:shadow-[0_0_18px_rgba(255,255,255,0.2),0_0_34px_rgba(var(--accent-rgb),0.36)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white/70 sm:h-14 sm:w-14";

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
  const bioParagraphs = React.useMemo(
    () => profile.bio.split("\n\n").filter((paragraph) => paragraph.trim().length > 0),
    [profile.bio]
  );

  const socialPlatforms: Array<keyof ProfileSocials> = ["instagram", "tiktok", "soundcloud"];

  return (
    <motion.div
      key={profile.id}
      initial={false}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.992, y: visible ? 0 : 10 }}
      exit={{ opacity: 0, scale: 0.985, y: -12 }}
      transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
      data-floor-scroll={profile.id}
      className="pointer-events-auto absolute inset-0 z-[100] overflow-y-auto overscroll-y-contain md:overflow-hidden"
    >
      <div data-atmosphere={profile.id} className="profile-cabin">
        <div className="profile-cabin-photo">
          <picture className="contents">
            {profile.desktopImage && <source media="(min-width: 768px)" srcSet={profile.desktopImage} />}
          <img
            src={profile.image}
            alt={profile.name}
            loading="lazy"
            decoding="async"
            onError={event => { event.currentTarget.style.opacity = "0"; }}
            onLoad={event => { event.currentTarget.style.opacity = "1"; }}
          />
          </picture>
        </div>
        <div aria-hidden="true" className="profile-cabin-shade" />
        <div aria-hidden="true" className="profile-cabin-atmosphere atmosphere" />
        <div data-floor-scroll={profile.id} className="profile-cabin-scroll">
        <div className="profile-cabin-content">
          <div className="mb-3.5 inline-flex w-fit items-center gap-2.5 bg-black/28 px-3 py-2 text-white/86 shadow-[0_0_28px_rgba(0,0,0,0.18)]">
            <Music2 className="h-3.5 w-3.5 text-white/78" />
            <span className="font-subheading text-[0.58rem] uppercase tracking-[0.36em] sm:text-[0.62rem]">{profile.role}</span>
          </div>

          <h2 className="font-display text-[2.9rem] uppercase leading-[0.88] tracking-[-0.025em] text-[var(--text)] sm:text-[3.8rem] md:text-[4.3rem] lg:text-[4.9rem] xl:text-[5.4rem]">
            {profile.name}
          </h2>

          <div className="profile-cabin-genre font-title">
            {profile.genre}
          </div>

          <div className="profile-cabin-bio font-body">
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
      </div>
    </motion.div>
  );
}

