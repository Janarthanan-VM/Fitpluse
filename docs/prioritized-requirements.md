# FitPulse: prioritized requirements

Source: the FitPulse PRD v1.0 (14 Oct 2026). The order follows the PRD's own priorities: **P0** means launch blocker, **P1** means a high-value follow-up, and **P2** means later. Within each tier, items are ordered by risk and by what other features depend on them. The PRD's risk register names watch lifecycle and phone/watch sync as the biggest risks, so they come first.

## Step 0: decide before building (from the PRD's decision register)

| # | Decision | PRD default |
|---|---|---|
| 1 | Platforms: iOS and Android, plus watchOS and/or Wear OS | Phone apps on both; each watch app built natively if confirmed |
| 2 | Workout types and the metrics shown | Walk, run, cycle and general workout; time plus supported metrics only |
| 3 | Account model: guest mode or account required | Not decided |
| 4 | Mobile framework (Flutter or React Native) | Short spike first |
| 5 | Backend stack | The team's existing stack, otherwise a typed API with a relational database |
| 6 | Data retention and deletion rules | Must be defined before launch |

**Technical spike:** prove three things before committing: watch workout capture, background behaviour, and phone/watch sync.

## Tier 1: must-have core loop (P0, build first)

These features are the product. Every other feature depends on them, and they carry the most risk.

| Priority | ID | Requirement | Why first |
|---|---|---|---|
| 1 | FR-005 | Pick an activity and start tracking; the timer starts only after tracking is confirmed | The main action of the app |
| 2 | FR-006 | Session states: active, paused, completed, discarded | Pausing must never create a second session |
| 3 | FR-007 | Pause, resume and finish, with protection against accidental data loss | No data loss is a release gate |
| 4 | FR-008 | Record duration and only the metrics the device supports; mark missing values as unavailable | Users trust the numbers |
| 5 | FR-009 | Workout summary with save status | Closes the loop |
| 6 | FR-011 | Phone, watch and server reconcile sessions with no duplicates | Top risk in the PRD |
| 7 | FR-012 | Watch live view showing time and core metrics | Supports watch-first users |
| 8 | FR-013 | Watch session survives screen dimming, interruptions and connection loss | Top risk; must be tested on real hardware |

## Tier 2: must-have around the core (P0)

| Priority | ID | Requirement |
|---|---|---|
| 9 | FR-001 | Account: sign up, sign in, sign out, recover access |
| 10 | FR-015 | Explain each permission before asking; provide a fallback if it's denied |
| 11 | FR-017 | Offline, error and stale-data handling with retry; never an endless spinner |
| 12 | FR-002 | Profile basics, collecting only fields the app needs |
| 13 | FR-003 | Choose and change a weekly goal |
| 14 | FR-004 | Home: today's summary, goal progress, quick start |
| 15 | FR-010 | History list with loading, empty and error states |
| 16 | FR-014 | Units and basic preferences |
| 17 | FR-016 | Privacy policy and account/data deletion |

## Tier 3: should-have after launch blockers (P1)

| Priority | ID | Requirement |
|---|---|---|
| 18 | FR-022 | Devices screen: paired, disconnected and syncing states; reconnect |
| 19 | FR-020 | Weekly trends with consistent date ranges and units |
| 20 | FR-018 | Reminders with quiet hours |
| 21 | FR-021 | Data export |
| 22 | FR-019 | Health app integration (Apple Health, Health Connect) with separate consent for each type of data |

## Tier 4: later (P2, out of the first release)

- FR-023: structured workout plans
- FR-024: coaching and social features
- Also out of scope: nutrition, subscriptions, medical claims, route navigation

## Rules that apply across every tier

- Never show made-up numbers. Missing data is labelled as unavailable.
- Always show the true data state: live, saved, syncing, delayed or unavailable.
- Meet WCAG 2.2 AA, and never rely on colour alone to show status.
- No shaming language: no punitive streaks.
- Never put raw health data or location in analytics events or logs.

## Suggested build order

1. Step 0 decisions and the technical spike
2. Tier 1, phone first, then the watch, then sync
3. Tier 2
4. Beta and release gates
5. Tier 3
