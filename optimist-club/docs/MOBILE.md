# Mobile Strategy

The Optimist Club is mobile-ready today as an **installable PWA**, with a clear path to native store apps and push notifications when the club wants them.

## Today: installable PWA

The app ships a web manifest (`public/manifest.webmanifest`), app icons (`public/icons/`), and a conservative service worker (`public/sw.js`). Installed, it launches standalone (no browser chrome) straight into `/dashboard`, with the navy rising-sun icon on the home screen.

What the service worker does — and deliberately does not do:

- Handles **GET requests only**; `/api/*` and cross-origin requests are never intercepted.
- Cache-first for icons and the manifest; network-first with cache fallback for page navigations, so a briefly offline member still sees the last-loaded page.
- No background sync, no push (yet) — nothing that could serve stale member data.

### Install on iOS (Safari)

1. Open `https://optimists-club.com` in **Safari** (other iOS browsers cannot install PWAs).
2. Tap the **Share** button (square with an upward arrow).
3. Scroll and tap **Add to Home Screen**.
4. Confirm the name ("Optimist Club") and tap **Add**.

The app opens full-screen with the club icon. Sessions persist for 30 days.

### Install on Android (Chrome)

1. Open `https://optimists-club.com` in **Chrome**.
2. Chrome may show an **Install app** banner — tap it. Otherwise open the **⋮** menu and choose **Add to Home screen** (or **Install app**).
3. Confirm. Android places the app in the launcher; the maskable icon adapts to the device's icon shape.

## Next: store apps via Capacitor

If presence in the App Store / Play Store becomes worthwhile (discoverability, native push), wrap the existing web app with [Capacitor](https://capacitorjs.com) rather than rebuilding:

1. Add Capacitor to the project: `npm i @capacitor/core @capacitor/ios @capacitor/android` and `npx cap init "The Optimist Club" com.optimistsclub.app`.
2. Configure the wrapper to load the production URL (`server.url = "https://optimists-club.com"` in `capacitor.config.ts`) so the store apps always run the live app — no dual codebase, releases stay server-side.
3. `npx cap add ios && npx cap add android`, then supply native icons/splash screens (reuse `public/icons/icon.svg` as the source).
4. Add native niceties incrementally: `@capacitor/push-notifications`, deep links for `/events/*`, biometric unlock if desired.
5. Ship through the usual channels: Xcode + App Store Connect (Apple Developer Program, $99/yr) and Android Studio + Play Console ($25 one-time). Budget time for Apple's review of the remote-URL setup — apps must feel native, so the standalone PWA styling matters.

The important property: the Next.js app remains the single product. Capacitor is packaging, not a fork.

## Later: push notifications

An in-app notification center already exists (bell icon, unread badge, `/notifications`) — members see RSVP confirmations, approvals, announcements, and payment updates whenever they open the app. Delivering those to the lock screen is a roadmap item:

1. **Web Push (VAPID)** — works for the installed PWA on Android, desktop, and iOS 16.4+ (installed PWAs only). Requires: a subscription flow in the client, storing `PushSubscription`s per user, sending from the existing `notifyUser`/`notifyMembers` fan-out, and extending `sw.js` with `push` and `notificationclick` handlers.
2. **FCM/APNs via Capacitor** — once store apps exist, native push through Firebase Cloud Messaging and APNs gives the most reliable delivery on iOS.
3. Either way, the server-side hook point is already centralized in `src/lib/notifications.ts`: every notification passes through it, so adding a push dispatch there covers the whole app at once.

Recommended order: ship the PWA (done), add Web Push when members ask for it, and reach for Capacitor only when store presence or native push on older iOS becomes a real requirement.
