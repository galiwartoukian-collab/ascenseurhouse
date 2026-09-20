# Code cleanup and performance review

Scope: local cleanup of the current About-first site. No commits, dependency upgrades, image compression, design changes, or deployment. Counts below are relative to the working tree at the start of this audit, not to Git HEAD (which already contained prior Phase 2 work).

## FIXED

- Booking's outgoing form stays mounted during its exit animation. Repeated submits could start multiple requests. A synchronous in-flight guard now rejects duplicates.
- Booking had an uncancelled 900ms timer and fetch that could finish after navigating away. The request and timer now cancel on unmount, with abort checks before updating state. The existing 900ms submission presentation minimum and success/error UI are preserved. Aborting a request is not a guarantee that an already-received server submission is undone.
- Profile image failures previously exposed the React logo, including on Bendi. Failed images now leave the existing atmospheric frame visible; successful photos retain the same source, dimensions and crop. No replacement photo was introduced.
- Booking fields now retain accessible names independent of placeholder visibility. Decorative social icons no longer duplicate link labels.

## REMOVED

- Unimported Vite starter stylesheet `src/App.css` (184 lines).
- Duplicate `index.css` import, unused Booking root ref, profile fallback-image state/effect, obsolete JSX grouping and an unsafe profile-route assertion.
- Three unreferenced font utility classes, unused old panel/metal/muted/line variables, an unused atmosphere class, and duplicate body rule grouping. Active gradient values, positions, grain and typography are unchanged.
- Five confirmed unused starter assets: `hero.png`, `vite.svg`, `react.svg`, `public/icons.svg`, `public/favicon.svg`.
- No old Lobby or Talar references remain in active source. Bendi continues to use `bendiprofile.jpeg`.

## OPTIMIZED

- Added a narrowly scoped cancellable submission helper with five mocked regression tests; no live Formspree request was sent.
- `isProfile` is a TypeScript type predicate, eliminating the route assertion without altering runtime behavior.
- Removed unused CSS and the React fallback request. This is modest cleanup, not a claim of a measured frame-rate or loading-time improvement.
- Confirmed separate About, profile and Booking chunks; shared loader promises and nonblocking image warmup remain unchanged.
- All listed production and development dependencies have active uses. None were removed or upgraded.

## ASSETS

Original photos were not edited. Largest candidates for a separate optimization task:

| Asset | Size | Use |
| --- | ---: | --- |
| `header.png` | 11.45MB | Homepage photo strip |
| `blisseliss.jpg` | 4.96MB | Homepage portrait and Bliss |
| `anais.png` | 1.67MB | Homepage portrait and Anaïs |
| `ara.jpeg` | 0.71MB | Ara profile |

The five removed starter assets total approximately 72KB on disk; most were not part of the initial page download. The shared grain remains the existing 128×128, 16.6KB tile at 2.5% opacity.

Unused Bendi black/white logo alternatives and the supplied gradient reference were retained as original creative source material; they are not in the production graph. Their future purpose is uncertain.

## LEFT ALONE

- GestureGate thresholds, quiet periods, touch handling and separate desktop/mobile boundaries. These protections are intentional and regression-tested.
- Door coordination, 325ms close/open durations, easing, loading mask, route/history handling and restoration. No routing or animation rewrite.
- Framer Motion wrappers, blurred light sweeps, submission animations and floor-specific gradient positioning. Altering them could change rendering or timing.
- Existing dual mobile/desktop control-panel markup and numbered floor labels.
- Original photo assets and inactive social links/biography placeholders supplied as profile content.

## REMAINING ISSUES

- Large original photos dominate transfer cost; optimization requires a separate task with visual validation.
- The deployment workflow builds but does not run lint/tests. Its Node 20 setup also cannot run the current strip-types test command; use a supported newer Node version if adding tests to CI. Workflow was left unchanged.
- Keyboard focus handoff/landmarks, small mobile controls and potential fixed-panel overlap on narrow layouts merit a separate accessibility review; layout/focus policy changes were outside this safe cleanup.
- Booking unmounts its form during submission, so retrying after failure currently loses the entered values. Retaining drafts would alter the existing form flow and was left for an explicit follow-up.
- Actual mobile-device inertial scrolling and low-end-device frame-rate profiling were not measured. Browser-sized mobile checks and deterministic momentum tests are the available evidence.

## TEST RESULTS

- Production build and TypeScript: pass.
- ESLint and Git whitespace checks: pass.
- Full suite: 38 tests pass, including five new submission lifecycle tests.
- Generated `/about`, `/ara`, `/bendi`, `/anais`, `/bliss`, `/booking` entries boot the same app; separate lazy route chunks remain present.
- Browser: homepage directly shows About with doors offscreen; `/about` preserves query/hash while canonicalizing to `/`; all direct profile/Booking URLs and refreshes pass; Back/Forward and repeated About ↔ Ara pass.
- Full forward and reverse scroll journeys pass. About has no backward floor. Rapid repeated input stops at the next profile rather than skipping it.
- Mobile Booking scrolls internally, remains on Booking at zero, and requires fresh upward input to return to Bliss. Profile Exit returns home.
- Desktop homepage and mobile homepage/Booking appearance were spot-checked. No intentional appearance changes; no pixel-diff claim.
- No console errors/warnings in the completed browser checks. Earlier browser automation sessions timed out/lost tabs; checks were resumed in a fresh tab.
- Existing tests confirm delayed/unresolved image warmup cannot block route readiness. No loading text was introduced.

## Change size

6 existing files modified, 3 files added (helper, tests, this report), 6 files deleted: 15 files touched. Approximately 220 lines of dead/obsolete source removed. No dependencies removed. No intended navigation, scrolling, transition or appearance changes. No commit, push, merge or deployment.
