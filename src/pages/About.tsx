import { motion } from "framer-motion";
import aboutHeaderImage from "../assets/header.webp";
import araButtonImage from "../assets/eb.jpg";
import anaisImage from "../assets/anais.png";
import blissImage from "../assets/blisseliss.jpg";
import bendiProfileImage from "../assets/bendiprofile2.jpeg";
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
        profiles.length === 1 ? "grid-cols-1" : profiles.length === 3 ? "grid-cols-3" : "grid-cols-2"
      } justify-items-center gap-x-5 gap-y-5 sm:gap-x-6 md:gap-x-7 lg:gap-x-8`}
    >
      {profiles.map((profile) => (
        <button
          key={profile.name}
          type="button"
          onClick={profile.onClick}
          aria-label={`Go to ${profile.name}`}
          className="group flex w-full min-w-0 max-w-[clamp(5.8rem,12.4vw,9.4rem)] flex-col items-center gap-2 text-center outline-none"
        >
          <span className="relative block aspect-square w-full overflow-hidden rounded-full bg-black shadow-[0_0_22px_rgba(var(--accent-rgb),0.2)] ring-1 ring-white/8 transition duration-300 group-hover:scale-[1.035] group-hover:shadow-[0_0_28px_rgba(var(--peach-rgb),0.45),0_0_70px_rgba(var(--accent-rgb),0.24)] group-focus-visible:ring-2 group-focus-visible:ring-[rgba(var(--peach-rgb),0.8)]">
            <img src={profile.image} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
            <span className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_35%,transparent_42%,rgba(0,0,0,0.38)_100%)]" />
          </span>
          <span className="font-bebas text-[10px] uppercase tracking-[0.22em] text-white/58 transition group-hover:text-white/80">
            {profile.label}
          </span>
          <span className="sr-only">{profile.name}</span>
        </button>
      ))}
    </div>
  );
}

export default function AboutInsideCabin({
  visible,
  onGoToAra,
  onGoToAnais,
  onGoToBendi,
  onGoToBliss,
}: {
  visible: boolean;
  onGoToAra: () => void;
  onGoToAnais: () => void;
  onGoToBendi: () => void;
  onGoToBliss: () => void;
}) {
  const djButtons = [
    { name: "ARA32", label: "ARA32", image: araButtonImage, onClick: onGoToAra },
    { name: "Bendi", label: "Bendi", image: bendiProfileImage, onClick: onGoToBendi },
    { name: "Anaïs", label: "Anaïs", image: anaisImage, onClick: onGoToAnais },
  ];
  const managerButtons = [
    { name: "Bliss Eliss", label: "Bliss Eliss", image: blissImage, onClick: onGoToBliss },
  ];

  return (
    <motion.div
      key="about"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.992, y: visible ? 0 : 10 }}
      exit={{ opacity: 0, scale: 0.985, y: -12 }}
      transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
      data-floor-scroll="about" className="absolute inset-0 z-[100] overflow-y-auto overflow-x-hidden overscroll-y-contain"
    >
      <section className="relative min-h-full w-full overflow-hidden bg-black text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 atmosphere"
        />

        <div className="relative z-10 flex min-h-full flex-col items-center text-center">
          <div className="relative h-[36vh] min-h-[210px] w-full sm:h-[38vh] md:h-[40vh] lg:h-[41vh]">
            <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_35%,rgba(0,0,0,0.85)_55%,rgba(0,0,0,0.4)_78%,transparent_100%)]">
              <img
                src={aboutHeaderImage}
                alt="Ascenseur House atmosphere"
                className="h-full w-full object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.1)_42%,rgba(0,0,0,0.88)_100%)]"
              />
            </div>
            <h2 className="about-title font-display absolute inset-x-0 bottom-[-0.36em] mx-auto origin-bottom scale-y-[0.75] whitespace-nowrap px-[2vw] text-center text-[17.5vw] font-bold uppercase leading-[0.84] tracking-[-0.03em] text-white [-webkit-text-stroke:0.012em_currentColor]">
              ASCENSEUR HOUSE
            </h2>
          </div>

          <div className="about-content relative mx-auto flex w-full max-w-[94rem] flex-1 flex-col items-center gap-[clamp(0.9rem,1.45vw,1.55rem)] px-5 pb-8 pt-[calc(clamp(1.55rem,3.1vw,3.45rem)+3.85vw)] text-center sm:px-8 sm:pb-10 md:px-12 md:pb-12">
            <p className="about-tagline text-center text-[clamp(1.08rem,1.75vw,2.05rem)] font-subheading uppercase leading-none tracking-[0.38em] text-white sm:tracking-[0.5em] md:tracking-[0.58em]">
              CURATED TO ELEVATE
            </p>

            <div className="flex max-w-[74rem] flex-col items-center gap-2 text-center sm:gap-2.5">
              <p className="text-center text-[clamp(1rem,1.32vw,1.54rem)] font-body leading-[1.35] tracking-[0.01em] text-white/85">
                Ascenseur House is a multi-level experience where sound, atmosphere, and presence are intentionally shaped.
              </p>

              <p className="about-going-up max-w-[58rem] text-center text-[clamp(0.98rem,1.24vw,1.42rem)] font-body leading-[1.34] text-white/80">
                Going up?
              </p>
            </div>

            <div className="about-house hidden">
              <h3 className="about-house-heading">MEET THE HOUSE</h3>
              <div className="about-house-profiles">
                {[...djButtons, ...managerButtons].map((profile, index) => (
                  <button
                    key={profile.name}
                    type="button"
                    onClick={profile.onClick}
                    aria-label={`Go to ${profile.name}`}
                    className="about-house-profile group"
                  >
                    <span className="about-house-role">{index < 3 ? "DJ" : "MANAGER"}</span>
                    <span className="about-house-portrait">
                      <img src={profile.image} alt="" />
                      <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_35%,transparent_42%,rgba(0,0,0,0.38)_100%)]" />
                    </span>
                    <span className="about-house-name">{profile.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="about-mobile-profiles grid w-full max-w-[68rem] grid-cols-1 items-start gap-y-[clamp(1.15rem,2.2vw,2rem)] text-center md:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] md:gap-x-[clamp(2rem,5vw,5.5rem)]">
              <div className="flex min-w-0 flex-col items-center gap-[clamp(0.85rem,1.2vw,1.25rem)] md:order-2 md:pt-0">
                <h3 className="text-center text-[clamp(0.72rem,0.82vw,0.92rem)] font-title uppercase leading-none tracking-[0.34em] text-white/52">
                  Manager
                </h3>

                <ProfileCircleGrid profiles={managerButtons} maxWidthClass="max-w-[18rem]" />
              </div>

              <div className="flex min-w-0 flex-col items-center gap-[clamp(0.85rem,1.2vw,1.25rem)]">
                <h3 className="text-center text-[clamp(0.72rem,0.82vw,0.92rem)] font-title uppercase leading-none tracking-[0.34em] text-white/52">
                  DJs
                </h3>

                <ProfileCircleGrid profiles={djButtons} maxWidthClass="max-w-[34rem]" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </motion.div>
  );
}


// Route prefetch metadata stays in its lazy chunk.
// eslint-disable-next-line react-refresh/only-export-components
export const assets = [aboutHeaderImage, araButtonImage, bendiProfileImage, anaisImage, blissImage];
