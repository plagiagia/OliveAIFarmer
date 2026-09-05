# Grower activation and retention release

Branch: `feature/grower-activation-retention`.

## What is implemented

- Grove creation requires only a name and location. Tree counts remain nullable in the existing schema; details can be entered later. Selecting a geocoding result enables local weather.
- Creation opens the new grove with a weather summary and a first-task action. The task form supports choosing a date and preselects a sole grove.
- The dashboard leads with pending work for today and the next six calendar days, older overdue tasks, and recently completed work. Failed loads display an error rather than an empty success state. Only active groves contribute to this schedule.
- Users with multiple active groves can choose which grove's weather to inspect.
- Calendar links open the activities tab. Pro users get a direct link to notification settings.
- Free and paid users can download upcoming tasks as an RFC 5545 calendar file. It includes up to 1,000 pending tasks in active, owned groves within the next 90 days, plus the recent day boundary. Tasks are all-day entries in Europe/Athens with a one-day advance alarm. Calendar software controls whether alarms are supported. This is a snapshot, not a subscribed or automatically synchronized feed.
- `/demo` provides clearly labelled illustrative content without creating records. Pricing includes interactive examples, outcomes, annual/monthly comparison, and setup requirements. These are examples, not live personalized AI assessments.
- The dashboard upgrade banner appears after there is activity data. Dismissal lasts seven days on the current browser, scoped to the account. Storage failures do not block the app.
- Multi-grove costs split equally if any selected grove is missing tree counts; both the form and API use the same condition. Previously, a grove without a count could receive zero allocated cost.

## Measurement

`src/lib/product-events.ts` uses the existing Vercel Analytics SDK for these custom events:

| Event | Trigger |
| --- | --- |
| GroveSetupStarted | Onboarding's create-grove action |
| GroveCreated | Successful creation, with `first` flag |
| WeeklyWorkViewed | Successful task load, with `hasTasks` flag |
| WeatherViewed | Successful weather-summary load |
| TaskSaved | Successful task creation through dashboard or welcome flow |
| CalendarDownloaded | Successful file download, not confirmation of calendar import |
| ProPreviewViewed | User selects a pricing example |
| UpgradeStarted | User starts checkout from pricing, not successful payment |

Events respect the existing marketing-consent choice and do not send account IDs, coordinates, farm names, or free text. They are best-effort: blocked storage or telemetry must not prevent product use. Confirm custom-event support on the Vercel project before treating these as production measurements. Where the existing consent banner is disabled, these consent-gated events are not collected.

These counts identify funnel friction but do not constitute a complete user-level retention cohort system. Validate acquisition-source cohorts and days 7–14 / 28–35 returns using an appropriately configured analytics pipeline. Keep Stripe successful payments separate from checkout starts. Do not interpret reminder-file downloads as delivered reminders.

## Manual acceptance checks

1. Open `/demo` at mobile and desktop widths; switch all three Pro examples. No demo interaction should create records.
2. Sign in with a test account and no groves. Create a grove using name and an autocomplete location only. Confirm optional values remain unknown and the welcome page appears.
3. Create an inspection on a future date. Confirm it appears on the dashboard and opens the correct grove's activities tab. Complete the activity there and return to confirm it leaves pending work.
4. Test an overdue task, no tasks, and a failed activities request. The error case must not imply there are no tasks.
5. Download the calendar and import it into a supported calendar application. Confirm the date, title, link, and reminder. Edit the task in OliveIQ and verify the UI explains that a previous import will not update automatically.
6. On a Pro account with multiple groves, switch weather groves; visit notification settings. Confirm real push delivery separately using configured VAPID keys and a supported device.
7. Dismiss the Free upgrade banner, reload, and confirm it stays dismissed. Check annual/monthly pricing and the existing Stripe test checkout flow.

## Deliberately separate follow-up work

- A one-time personalized AI preview needs durable server-side trial accounting and an explicit budget. This release does not bypass paid AI authorization.
- Email digests and automatic task push reminders need channel preferences, delivery configuration, unsubscribe handling, and delivery verification. This release sends no new messages.
- Live retention uplift requires observation after rollout. There is no claim that the changes have already reduced churn.

No database migration, price change, production deployment, or additional external service is required for this release. Existing weather, auth, database, Stripe, and Pro push integrations retain their current configuration requirements.
