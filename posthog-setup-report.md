<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Recurrly React Native (Expo) app. The integration covers user identification on sign-in and sign-up via Clerk, manual screen tracking with Expo Router, and business-critical event capture for authentication and subscription engagement.

**Files created:**
- `app.config.js` — Expo config with PostHog token/host injected via `process.env` and exposed as `extra` fields
- `lib/posthog.ts` — PostHog client singleton, reads config from `Constants.expoConfig.extra`, disables itself if unconfigured

**Files modified:**
- `app/_layout.tsx` — Added `PostHogProvider` wrapping the app, manual screen tracking with `posthog.screen()` using `usePathname` + `useGlobalSearchParams`
- `app/(auth)/sign-in.tsx` — Added `posthog.identify()` and `posthog.capture('user_signed_in')` in `finalizeSignIn`
- `app/(auth)/sign-up.tsx` — Added `posthog.identify()` (with `$set_once: { first_signup_date }`) and `posthog.capture('user_signed_up')` in `finalizeSignUp`
- `app/(tabs)/settings.tsx` — Added `posthog.capture('user_signed_out')` and `posthog.reset()` before sign-out
- `app/(tabs)/index.tsx` — Added `posthog.capture('subscription_expanded')` when a subscription card is expanded
- `app/subscriptions/[id].tsx` — Added `posthog.capture('subscription_detail_viewed')` in a `useEffect` on mount

**Packages installed:** `posthog-react-native`, `expo-file-system`, `expo-application`, `expo-device`, `expo-localization`, `react-native-svg`

| Event | Description | File |
|---|---|---|
| `user_signed_up` | User successfully completed sign-up and email verification | `app/(auth)/sign-up.tsx` |
| `user_signed_in` | User successfully signed in with email and password | `app/(auth)/sign-in.tsx` |
| `user_signed_out` | User signed out from the settings screen | `app/(tabs)/settings.tsx` |
| `subscription_expanded` | User expanded a subscription card on the home screen | `app/(tabs)/index.tsx` |
| `subscription_detail_viewed` | User navigated to a subscription detail page (conversion funnel top) | `app/subscriptions/[id].tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- **Dashboard — Analytics basics:** https://eu.posthog.com/project/154382/dashboard/606549
- **Sign-up to Subscription Engagement Funnel:** https://eu.posthog.com/project/154382/insights/24djftTs
- **Daily Sign-ups and Sign-ins:** https://eu.posthog.com/project/154382/insights/Y0hKmiTw
- **Subscription Engagement Trends:** https://eu.posthog.com/project/154382/insights/axDe68zB
- **Weekly Churn Signal (Sign-outs):** https://eu.posthog.com/project/154382/insights/kXbyIRVB
- **Total Sign-ups (Last 30 Days):** https://eu.posthog.com/project/154382/insights/9UyDXLOD

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
