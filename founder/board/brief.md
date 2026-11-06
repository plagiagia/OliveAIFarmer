# Board brief: OliveIQ

This brief stands on its own. Members cannot see any other conversation.

# OliveIQ (repo name OliveAIFarmer; README still calls it OliveLog / ΕλαιοLog)

- What it is: a Greek-language field logbook web app (installable PWA) for olive growers: groves on a map, activities and costs, harvests and mill deliveries, a "my year" profit view, olive-fly (δάκος) risk alerts by push notification, a PDF field logbook (Ημερολόγιο Αγρού) for ΟΣΔΕ/OPEKEPE paperwork and accountants, weather, and an OpenAI-powered "AI Γεωπόνος" (agronomist) assistant.
- Who it is for: Greek olive grove owners, starting with small family groves (the brand doc's reference customer has about 200 trees); Mediterranean growers (Italy, Spain, Cyprus, Portugal) later. The brand doc also mentions mills (ελαιουργεία) managing dozens of growers, but the current pricing has no mill tier.
- What it sells, at what price: freemium. Free: 1 grove, logbook, harvests, weather. Pro: €49 a year (promoted) or €6 a month, adding δάκος alerts, AI Γεωπόνος, unlimited groves, cost-per-litre reporting and the PDF logbook export. Billing through Stripe.
- Where and how: online, Greece first. Web app/PWA at oliveiq.gr (planned domain), Greek-only UI. Acquisition channels not decided yet.
- Budget and constraints: not stated. Built and run by the founder (solo developer as far as the repo shows). Already built: the app, Stripe billing, the push-alert cron, a /demo page and analytics events for the signup-to-upgrade funnel. No live user, revenue or retention numbers have been shared.

## More context from the founder's repository

- Paid tier rationale (from the code): "olive income is seasonal and lumpy, so the paid tier is framed as a per-season price with a monthly option."
- Earlier plan tiers PRODUCER and MILL existed and were collapsed into one paid tier, so the founder has already narrowed the offer once.
- The δάκος alert uses a degree-day pest model and sends a web push notification from a daily scheduled job. Weather comes from OpenWeatherMap. The AI assistant falls back to rules when the AI is off.
- The PDF export is described as "OPEKEPE-ready" / ΟΣΔΕ-style: the field logbook farmers or their accountants hand over for subsidy paperwork.
- Brand positioning (draft): tagline «Ο ελαιώνας σας, πάντα υπό έλεγχο». Mission: give Greek growers the precision tools large California farms have, at a price a 200-tree family grove can afford. The draft pitch also mentions Sentinel-2 satellite data and irrigation timing.
- Five-year vision: every olive grove in Greece has a digital record (harvest history, weather, oil traceability from tree to shelf).
- Latest work: making the first steps easier (a grove needs only a name and a location), a weekly to-do dashboard, a downloadable task calendar, a public /demo page and an upgrade banner. The founder notes there is no evidence yet that retention has improved.
- Not known: how many users, paid conversion, cost to win a customer, the market size, the founder's budget and runway, or which competitors exist. Do not invent these. Name them as open questions.
