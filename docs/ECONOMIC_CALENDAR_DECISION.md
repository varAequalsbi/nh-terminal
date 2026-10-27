# Economic calendar: client decision

**Status:** Awaiting client choice. No event creation workflow has been approved or implemented.

## Current state

The Market calendar displays and filters economic events. Its entries currently come from local demo seed data. There is no Add Event form or event creation API, so admins, experts, and members cannot add events through the app today.

This decision concerns economic events such as data releases. Team activities, webinars, or streams would need a separate event type and workflow.

## Options

| Choice       | How events arrive                                                                            | Main tradeoff                                                                              |
| ------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1. Manual    | An authorized staff member enters and updates each event in the app.                         | Simple to start, but staff must keep schedules, results, and revisions accurate.           |
| 2. Automatic | The server imports and updates events from an approved economic-calendar provider.           | Less routine entry, but requires a provider, permitted usage, integration, and monitoring. |
| 3. Hybrid    | The server imports events; authorized staff can add missing events or correct imported ones. | Best coverage and oversight, with both integration and management work.                    |

**Suggested direction:** Option 3 if the client wants a maintained economic calendar and accepts the provider and operating costs. Option 1 is a smaller first phase if the calendar is intentionally curated by staff. This is a proposal, not an approved requirement.

## Access proposal

- Members: view and filter events.
- Experts: view and filter events. An event suggestion workflow can be added if the client needs it.
- Admin and super-admin: add, edit, or correct events under options 1 or 3. Record who changed what and when.
- Automatic imports under options 2 or 3: server-owned updates, with source and last-updated time shown to users.

## Questions for the client

1. Which option should we build: manual, automatic, or hybrid?
2. Should experts be able to suggest an event for admin approval, or only admins manage events?
3. Which markets/countries and impact levels should the calendar cover?
4. If choosing automatic or hybrid, is there an approved provider and budget for its data and display rights?
5. Should members receive event reminders, or is viewing the calendar enough for the first phase?

Until these are answered, the current calendar remains a demo display. Do not present its data as a live economic feed.
