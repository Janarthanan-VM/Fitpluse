# FitPulse first cut (MVP) checklist

This covers only the P0 launch blockers from the PRD. P1 and P2 items are left out. Each line includes the PRD's acceptance criterion so it can be checked off.

## 0. Decide before building
- [ ] Platforms confirmed: iOS and Android, plus watchOS and/or Wear OS
- [ ] Workout types confirmed (default: walk, run, cycle, general workout)
- [ ] Metric list confirmed: duration plus only the metrics the device supports
- [ ] Account model decided: account required, or guest mode allowed
- [ ] Mobile framework chosen after a spike (Flutter or React Native)
- [ ] Backend stack and hosting chosen
- [ ] Technical spike done: watch capture, background behaviour, phone/watch sync

## 1. Core workout loop
- [ ] **FR-005 Start:** pick an activity and start; the timer starts only after the session is confirmed
- [ ] **FR-006 States:** active, paused, completed, discarded; invalid transitions are blocked; pause and resume keep the same session
- [ ] **FR-007 Controls:** pause, resume and finish; finishing or discarding needs clear intent; one accidental tap can't destroy data
- [ ] **FR-008 Metrics:** duration plus supported metrics only; missing values are labelled unavailable; units are consistent
- [ ] **FR-009 Summary:** shows saved status; numbers match the stored session

## 2. Watch companion
- [ ] **FR-012 Live view:** elapsed time plus 1 to 3 metrics, readable outdoors, controls reachable
- [ ] **FR-013 Lifecycle:** the session survives screen dimming, app interruptions and connection loss, tested on real hardware

## 3. Sync
- [ ] **FR-011 Reconcile phone, watch and server:** retries are safe; no duplicate workouts
- [ ] Stable session ID created on the device that started the workout
- [ ] Offline capture, then sync when the connection returns
- [ ] Sync state shown honestly: syncing, synced, delayed, retry needed

## 4. Account and onboarding
- [ ] **FR-001 Account:** sign up, sign in, sign out, recover access; clear error messages
- [ ] **FR-002 Profile:** only fields the app needs are required
- [ ] **FR-003 Goals:** choose and change a goal; progress uses the goal in effect for that date range
- [ ] **FR-015 Permissions:** explain why before asking; usable fallback and a path to settings if denied

## 5. Main screens
- [ ] **FR-004 Home:** today's summary, goal progress, quick start; no made-up numbers on first use
- [ ] **FR-010 History:** workouts ordered by date; loading, empty, error and populated states designed
- [ ] Workout detail screen
- [ ] Simple weekly trend
- [ ] Navigation with four tabs: Home, Activity, Progress, Profile

## 6. Settings and privacy
- [ ] **FR-014 Settings:** units and preferences apply everywhere
- [ ] **FR-016 Privacy:** privacy policy available; account and data deletion with confirmation and a defined backend process
- [ ] Notification preferences, permissions help, sign out

## 7. Resilience
- [ ] **FR-017:** offline, server errors, stale data and permission changes handled; never an endless spinner; always a retry or next step

## 8. Cross-cutting
- [ ] WCAG 2.2 AA contrast, screen reader labels, large text, status never shown by colour alone
- [ ] Data encrypted in transit; tokens kept in secure storage; server-side authorization on every record
- [ ] No raw health data or location in analytics events or logs
- [ ] Core analytics events wired up: onboarding_completed, workout_started/completed/discarded, sync_completed/failed
- [ ] Crash and sync monitoring live

## 9. Release gates
- [ ] No open P0 bug, privacy issue or data-loss defect
- [ ] Core journeys pass on every supported device: first run, watch start to finish, lost connection
- [ ] Watch recording and sync recovery verified on real hardware
- [ ] Store privacy disclosures and a support route ready
- [ ] Staged rollout and rollback plan in place

## Not in the first cut
Reminders, health app integration, data export, the full devices screen, advanced trends, workout plans, coaching, social features, nutrition, subscriptions.
