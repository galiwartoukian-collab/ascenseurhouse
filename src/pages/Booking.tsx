import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { sendInquiry } from "../booking/sendInquiry";
import { CalendarDays } from "lucide-react";
import type { BookingSubmitStatus, NavigationHandler } from "../types";
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mvzvlkkq";
function UIButton({
  children,
  className = "",
  style,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      {...props}
      className={`inline-flex items-start justify-center rounded-full px-5 py-3 text-sm font-title tracking-[0.08em] transition duration-300 ${className}`}
      style={{
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 10px 24px rgba(0,0,0,0.28)",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export default function BookingInsideCabin({
  visible,
  onReturnToAbout,
}: {
  visible: boolean;
  onReturnToAbout: NavigationHandler;
}) {
  const mobileScrollRef = React.useRef<HTMLDivElement | null>(null);
  const desktopFormScrollRef = React.useRef<HTMLDivElement | null>(null);
  const [submitStatus, setSubmitStatus] = React.useState<BookingSubmitStatus>("idle");

  const submission = React.useRef<AbortController | null>(null);
  React.useEffect(() => () => { submission.current?.abort(); }, []);

  const handleBookingSubmit = React.useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // The outgoing form remains mounted briefly during AnimatePresence exit.
    if (submission.current) return;
    const controller = new AbortController();
    submission.current = controller;

    const form = event.currentTarget;
    const formData = new FormData(form);

    setSubmitStatus("sending");

    try {
      await sendInquiry(FORMSPREE_ENDPOINT, formData, controller.signal);
      if (controller.signal.aborted) return;

      setSubmitStatus("success");
      form.reset();
    } catch {
      if (!controller.signal.aborted) setSubmitStatus("error");
    } finally {
      if (submission.current === controller) submission.current = null;
    }
  }, []);

  const resetBookingFlow = React.useCallback(() => {
    setSubmitStatus("idle");
  }, []);

  React.useEffect(() => {
    if (submitStatus === "idle") return;

    mobileScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    desktopFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [submitStatus]);


  return (
    <motion.div
      key="booking"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.99, y: visible ? 0 : 8 }}
      exit={{ opacity: 0, scale: 0.985, y: -10 }}
      transition={{ duration: 0.54, ease: [0.22, 1, 0.36, 1] }}
      className="pointer-events-auto absolute inset-0 isolate z-50 overflow-hidden"
    >
      <div
        data-floor-scroll="booking" ref={mobileScrollRef}
        className="pointer-events-auto relative h-full w-full overflow-y-auto overscroll-y-auto bg-[#060607] md:overflow-hidden"
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(130deg,#050505_0%,#0d0d10_46%,#050505_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.9)_0%,rgba(0,0,0,0.7)_40%,rgba(0,0,0,0.82)_100%)]" />
          <div
            className="pointer-events-none absolute inset-0 atmosphere"
            style={{
              background:
                "var(--atmosphere-full)",
            }}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/75 to-transparent" />
          <motion.div
            className="pointer-events-none absolute top-0 h-full w-[26%] opacity-12 blur-xl md:w-[34%] md:opacity-22 md:blur-3xl"
            style={{
              background:
                "var(--light-sweep)",
            }}
            animate={{ x: ["-25%", "140%", "-25%"] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>


        <div className="pointer-events-auto relative z-30 flex min-h-full flex-col pt-20 md:h-full md:min-h-0 md:pt-0">
          <div
            data-floor-scroll="booking" ref={desktopFormScrollRef}
            className="min-h-0 w-full overflow-visible px-6 py-7 pb-14 sm:px-10 md:flex md:h-full md:items-center md:overflow-y-auto md:px-10 md:py-16 lg:px-14"
          >
            <div className="pointer-events-auto relative mx-auto flex w-full max-w-[58rem] flex-col items-center px-0 text-center md:max-w-[min(58rem,calc(100vw-21.5rem))] xl:max-w-[58rem]">
              <AnimatePresence initial={false} mode="wait">
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
                      <span className="text-[10px] font-subheading uppercase tracking-[0.26em]">Private Inquiry</span>
                    </div>

                    <h2 className="max-w-full text-center text-[clamp(2.35rem,4.7vw,5.2rem)] font-subheading leading-[0.98] tracking-[0.035em] text-[var(--text)] drop-shadow-[0_18px_42px_rgba(0,0,0,0.52)] sm:whitespace-nowrap sm:tracking-[0.09em]">
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
                          className="w-full appearance-none rounded-[20px] border px-5 py-3.5 text-base text-[var(--text)] outline-none transition font-body placeholder:font-body placeholder:text-white/32 focus:border-white/24 focus:bg-white/[0.06] sm:px-6 sm:py-3.5 sm:text-lg"
                          style={{
                            borderColor: "rgba(255,255,255,0.1)",
                            background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.032))",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 42px rgba(0,0,0,0.2)",
                          }}
                          aria-label="Name"
                          placeholder="Name"
                        />

                        <input
                          type="text"
                          name="company"
                          className="w-full appearance-none rounded-[20px] border px-5 py-3.5 text-base text-[var(--text)] outline-none transition font-body placeholder:font-body placeholder:text-white/32 focus:border-white/24 focus:bg-white/[0.06] sm:px-6 sm:py-3.5 sm:text-lg"
                          style={{
                            borderColor: "rgba(255,255,255,0.1)",
                            background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.032))",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 42px rgba(0,0,0,0.2)",
                          }}
                          aria-label="Company / Venue"
                          placeholder="Company / Venue"
                        />

                        <input
                          type="email"
                          name="email"
                          required
                          className="w-full appearance-none rounded-[20px] border px-5 py-3.5 text-base text-[var(--text)] outline-none transition font-body placeholder:font-body placeholder:text-white/32 focus:border-white/24 focus:bg-white/[0.06] sm:px-6 sm:py-3.5 sm:text-lg"
                          style={{
                            borderColor: "rgba(255,255,255,0.1)",
                            background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.032))",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 42px rgba(0,0,0,0.2)",
                          }}
                          aria-label="Email"
                          placeholder="Email"
                        />

                        <input
                          type="tel"
                          name="phone"
                          className="w-full appearance-none rounded-[20px] border px-5 py-3.5 text-base text-[var(--text)] outline-none transition font-body placeholder:font-body placeholder:text-white/32 focus:border-white/24 focus:bg-white/[0.06] sm:px-6 sm:py-3.5 sm:text-lg"
                          style={{
                            borderColor: "rgba(255,255,255,0.1)",
                            background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.032))",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 42px rgba(0,0,0,0.2)",
                          }}
                          aria-label="Phone Number"
                          placeholder="Phone Number"
                        />

                        <textarea
                          name="message"
                          required
                          className="min-h-[130px] w-full appearance-none rounded-[20px] border px-5 py-3.5 text-base text-[var(--text)] outline-none transition font-body placeholder:font-body placeholder:text-white/32 focus:border-white/24 focus:bg-white/[0.06] sm:col-span-2 sm:px-6 sm:py-3.5 sm:text-lg md:min-h-[136px]"
                          style={{
                            borderColor: "rgba(255,255,255,0.1)",
                            background: "linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.032))",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 22px 48px rgba(0,0,0,0.22)",
                          }}
                          aria-label="Tell us about your event, who you’d like to book, and whether you are in New York or Los Angeles."
                          placeholder="Tell us about your event, who you’d like to book, and whether you are in New York or Los Angeles."
                        />

                        <div className="flex flex-col items-center gap-4 pt-1 sm:col-span-2">
                          <UIButton
                            type="submit"
                            className="cursor-pointer border px-7 py-3.5 text-white sm:px-9"
                            style={{
                              borderColor: "rgba(255,255,255,0.14)",
                              background: "linear-gradient(180deg, rgba(255,255,255,0.09), rgba(var(--accent-rgb),0.22))",
                            }}
                          >
                            Send Inquiry
                          </UIButton>

                          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center text-sm text-white/62 sm:text-base">
                            <span className="font-title uppercase tracking-[0.16em] text-white/38">Direct Contact</span>
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
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(var(--accent-rgb),0.36),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.2))]" />
                    <motion.div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/12"
                      animate={{ opacity: [0.2, 0.72, 0.2] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <motion.div
                      aria-hidden="true"
                      className="pointer-events-none absolute top-0 h-full w-[34%] bg-[linear-gradient(90deg,transparent,rgba(var(--accent-rgb),0.48),transparent)] blur-2xl"
                      animate={{ x: ["-170%", "170%"] }}
                      transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                    />

                    <div className="relative z-10 mb-8 flex h-36 w-24 items-center justify-center rounded-[22px] border border-white/10 bg-[#09090b] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_0_70px_rgba(var(--accent-rgb),0.3)] sm:h-44 sm:w-28">
                      <motion.div
                        className="absolute inset-y-3 left-1/2 w-px -translate-x-1/2 bg-white/18"
                        animate={{ scaleY: [0.32, 1, 0.32], opacity: [0.24, 0.9, 0.24] }}
                        transition={{ duration: 1.15, repeat: Infinity, ease: "easeInOut" }}
                      />
                      <motion.div
                        className="h-12 w-12 rounded-full border border-[rgba(var(--accent-rgb),0.55)] bg-[radial-gradient(circle,rgba(var(--accent-rgb),0.95),rgba(var(--wine-rgb),0.9))] shadow-[0_0_34px_rgba(var(--accent-rgb),0.62)]"
                        animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.78, 1, 0.78] }}
                        transition={{ duration: 1.05, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>

                    <div className="relative z-10 text-[10px] font-title uppercase tracking-[0.32em] text-white/42 sm:text-xs">
                      Submitting Inquiry
                    </div>
                    <h2 className="relative z-10 mt-4 text-[clamp(2.4rem,7vw,6.4rem)] font-display uppercase leading-[0.9] tracking-[-0.02em] text-white">
                      Routing Request
                    </h2>
                    <motion.p
                      className="relative z-10 mt-5 text-sm font-subheading uppercase tracking-[0.22em] text-white/66 sm:text-base"
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
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_44%,rgba(var(--accent-rgb),0.32),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(0,0,0,0.18))]" />
                    <div className="pointer-events-none absolute inset-x-[12%] top-1/2 h-px bg-white/12" />
                    <div className="relative z-10 mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-[10px] font-subheading uppercase tracking-[0.26em] text-white/54">
                      Floor B · Request Logged
                    </div>
                    <h2 className="relative z-10 text-[clamp(2.7rem,8vw,7rem)] font-display uppercase leading-[0.86] tracking-[-0.03em] text-white drop-shadow-[0_18px_54px_rgba(var(--accent-rgb),0.26)]">
                      Inquiry Received
                    </h2>
                    <p className="relative z-10 mt-6 max-w-[38rem] text-base leading-7 text-white/72 sm:text-lg">
                      Your request has entered the queue. Ascenseur House will be in touch.
                    </p>
                    <div className="relative z-10 mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                      <UIButton
                        type="button"
                        onClick={onReturnToAbout}
                        className="cursor-pointer border px-7 py-3.5 text-white sm:px-9"
                        style={{
                          borderColor: "rgba(255,255,255,0.16)",
                          background: "linear-gradient(180deg, rgba(255,255,255,0.1), rgba(var(--accent-rgb),0.24))",
                        }}
                      >
                        Return to About
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
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(var(--accent-rgb),0.26),transparent_40%)]" />
                    <div className="relative z-10 mb-5 text-[10px] font-title uppercase tracking-[0.32em] text-red-100/46">
                      Route Interrupted
                    </div>
                    <h2 className="relative z-10 text-[clamp(2.25rem,6vw,5.4rem)] font-display uppercase leading-[0.9] tracking-[-0.02em] text-white">
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
                          background: "linear-gradient(180deg, rgba(255,255,255,0.1), rgba(var(--accent-rgb),0.24))",
                        }}
                      >
                        Try Again
                      </UIButton>
                      <UIButton
                        type="button"
                        onClick={onReturnToAbout}
                        className="cursor-pointer border px-7 py-3.5 text-white/82 sm:px-9"
                        style={{
                          borderColor: "rgba(255,255,255,0.1)",
                          background: "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.018))",
                        }}
                      >
                        Return to About
                      </UIButton>
                    </div>
                    <div className="relative z-10 mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-center text-sm text-white/62 sm:text-base">
                      <span className="font-title uppercase tracking-[0.16em] text-white/38">Direct Contact</span>
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

