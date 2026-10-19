# FitPulse

A personal fitness tracker: set a weekly goal, track workouts with minimal friction, and see your progress build week by week. This is the **first cut** built from the FitPulse PRD v1.0. It covers the core phone experience; the watch app, server sync and reminders come in later updates.

## Download (Android)

**[Download the latest FitPulse.apk](https://github.com/Janarthanan-VM/Fitpluse/releases/latest/download/FitPulse.apk)**

Open the file on an Android phone and allow installs from that source when asked. Every push to `main` builds a new APK and publishes it under [Releases](https://github.com/Janarthanan-VM/Fitpluse/releases). The APK is signed with a development key, which is fine for testing but not for the Play Store.

## What's in this first cut

| Area | What works | PRD |
|---|---|---|
| Account | Create account, sign in, sign out, delete account and all data | FR-001, FR-016 |
| Onboarding | Name and units, weekly goal, explanation of what we collect and why | FR-002, FR-003, FR-015 |
| Home | Today's summary, weekly goal ring, one-tap quick start, recent workout, honest empty states | FR-004 |
| Workout | Activity and planned length, ready check, live timer, GPS distance and pace, pause, resume, finish, discard with confirmation | FR-005 to FR-009 |
| Reliability | Timer is stored as timestamps, so a workout survives the app closing; GPS noise is dropped rather than smoothed; missing metrics show "Not recorded" | FR-008, FR-013 |
| History | Grouped by week, filter by activity, detail with timeline, rename, delete | FR-010 |
| Progress | Daily minutes this week, weekly minutes for 4 weeks, goal consistency measured against the goal each week had | FR-020 |
| Settings | Units (km or miles) applied everywhere, permission status, privacy summary | FR-014 |
| Sync | Outbox with client-generated ids and idempotent retries, ready for a backend (see below) | FR-011 |

### Decisions taken (PRD defaults)

- React Native with Expo (one codebase for Android and iOS) and Expo Router.
- Account required. In this cut the account lives on the phone, with a salted SHA-256 password hash; the auth module is the swap point for a real backend.
- Workout types: walk, run, cycle, general workout. Metrics: time always; distance and pace only for outdoor workouts when location is allowed.
- Location is requested just in time at the first outdoor workout, foreground only. Background location is blocked in `app.json`.

### Not yet included

Watch apps (watchOS, Wear OS), the sync backend, password reset, reminders, health-app integration, data export, background GPS when the screen is off.

## Sync backend contract

Set `EXPO_PUBLIC_SYNC_URL` to enable sync. The app then sends each change to `POST {url}/v1/sync/ops` with an `Idempotency-Key` header and a body of `{ opId, kind: "upsert" | "delete", workoutId, version, workout }`. The server must:

1. Treat `opId` as unique: a repeated op is acknowledged without being applied again.
2. Keep only the highest `version` per `workoutId`.

`ReferenceServer` in `src/domain/sync.ts` implements these rules and is covered by tests.

## Development

```bash
npm install
npx expo start          # scan the QR code with Expo Go, or press w for web
npm run typecheck
npm test                # domain tests: session state machine, sync, progress, formatting
```

Project layout:

```
src/app/        screens (Expo Router)
src/domain/     pure logic: session state machine, metrics, progress, sync
src/data/       app state and on-device persistence
src/services/   auth, location, sync client
src/ui/         design tokens and shared components
docs/           prioritized requirements and the first-cut checklist
```
