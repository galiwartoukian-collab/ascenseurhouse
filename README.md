# Ascenseur House

React/Vite elevator experience. The elevator shell stays mounted while content changes using client-side History API navigation.

## Development

- `npm run dev` — local preview
- `npm run build` — type-check, split production bundles, and generate GitHub Pages route entries
- `npm run lint` — ESLint
- `npm test` — scroll gesture regression tests (Node 22.6+; development uses Node 24)

## Routes

`/` Lobby, `/about` About, `/booking` Booking, and `/ara`, `/bendi`, `/anais`, `/bliss` profile cabins. Trailing slashes are accepted. The existing numbered elevator controls remain available; A returns to About. The logo in a profile cabin also returns to About. The unchanged Lobby logo is now an accessible button to enter About without scrolling.

`src/App.tsx` owns client-side history, transition locking, floor loading, and scroll restoration. `src/ElevatorShell.tsx` retains the original control panel, lobby and door animation markup. `src/pages/` contains extracted page components and unchanged profile records. `src/navigation/` contains route metadata, lazy imports, and input guards.

## Scroll navigation

The automatic sequence is Lobby → About → Ara → Bendi → Anaïs → Bliss Eliss → Booking. Upward scrolling follows the exact reverse sequence. Profiles also remain directly accessible, and their logo/Exit action still returns to About. Lobby has a short scroll runway; other floors use their own existing scroll containers. Reaching the bottom while scrolling forward, or deliberately scrolling farther at the bottom, starts one transition. At the top, backward wheel/touch intent follows the reverse sequence; merely arriving at the top does not navigate.

Navigation locks immediately and stays locked through loading and door opening. After arrival there is a 900ms cooldown, and a 260ms input-free interval is required before a new gesture. Small edge motions accumulate to a 90px threshold; direction changes reset it. Form controls are excluded. About's scroll position is restored when leaving a cabin; browser history entries also retain in-session positions. Direct loads and refreshes start at the top. Reduced-motion preferences shorten route transitions and disable large motion through Framer Motion's configuration.

## Loading

About, Booking and all four profiles are separate dynamic imports. Profile pages share one lazy cabin component. Route-specific image imports live with the lazy page; Lobby initially imports only the logo. Once the current floor is 55% scrolled, the module and images for the next floor in the sequence are prefetched. Floors whose content already fits the viewport prepare their next floor on arrival. Requested destinations are prepared behind closed doors before revealing them. Slow/offline chunk failures retain the current floor with a retry message. Original full-resolution images are preserved, so the first uncached About visit may still wait on large imagery.

## GitHub Pages

The existing GitHub Actions Pages deployment is retained. `scripts/route-entries.mjs` runs after Vite and writes `dist/<route>/index.html` for all six non-root routes, plus a same-app `404.html` fallback. This provides real static entries for direct URLs rather than relying on unsupported GitHub Pages rewrite rules. Vite uses root-relative assets, consistent with the existing custom-domain configuration. GitHub Pages may normalize a direct directory URL to a trailing slash; the router accepts either form. No push/deployment is needed to build or preview locally.

## Verification

Run build, lint and gesture regression tests before publishing. For browser checks, verify the main scroll sequence, profile entry/exit, Back/Forward, direct route loads/refreshes, About restoration, and touch momentum at narrow widths. Use the real scrollable content area rather than the fixed control panel when testing gestures. Booking submission remains the existing Formspree flow; do not send live test bookings without authorization.
