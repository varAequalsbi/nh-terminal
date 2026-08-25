# Frontend Publish-Readiness TODO

This checklist covers the remaining client-side work required to turn the current
high-fidelity NH Terminal prototype into a complete, accessible, responsive, and
production-ready application.

## 1. Application foundation

- [ ] Replace page-level mock arrays with a typed frontend data layer connected to the real API.
- [ ] Add shared constants and TypeScript types for users, tiers, signals, prices, events, posts, sessions, announcements, and courses.
- [ ] Consider migrating JSX files to TypeScript (`.tsx`) before implementing complex API flows.
- [ ] Add a global query/cache library such as TanStack Query for loading, caching, refetching, retrying, and mutation state.
- [ ] Add global error boundaries with a friendly recovery screen.
- [ ] Add route-level loading skeletons matching each page layout.
- [ ] Add standard empty, loading, error, offline, forbidden, and maintenance states.
- [x] Restore authenticated sessions on refresh instead of resetting authentication to `false`.
- [ ] Add protected-route guards based on authentication and user role.
- [ ] Preserve relevant tab/filter state in URL search parameters so views can be bookmarked and shared.
- [ ] Add a production environment configuration layer for API, WebSocket, CDN, analytics, and feature-flag URLs.

## 2. Global navigation and layout

- [x] Make the logo return to the dashboard and verify keyboard activation.
- [ ] Implement the Settings destination or settings modal.
- [ ] Implement logout confirmation, API logout, session clearing, and redirect.
- [ ] Finish the mobile navigation drawer, focus trap, body-scroll lock, and outside-click/Escape behavior.
- [x] Connect footer links to real internal pages or approved external destinations.
- [x] Add Terms, Privacy Policy, Risk Disclosure, Help Center, FAQ, and Contact pages.
- [ ] Verify header/footer alignment at 320, 360, 390, 768, 1024, 1280, 1440, and 1920 px widths.
- [ ] Ensure long translated labels and user-generated text cannot break navigation or cards.
- [ ] Self-host the US flag instead of relying on the current external CDN URL.
- [ ] Optimize the supplied logo export; it currently contains embedded raster data inside an SVG wrapper.

## 3. Authentication flows

- [ ] Connect login to the authentication API and securely persist the returned session.
- [ ] Add sign-up with email verification and acceptance of legal documents.
- [ ] Build forgot-password, reset-password, and expired-link screens.
- [ ] Add show/hide password, Caps Lock feedback, password rules, and accessible validation summaries.
- [ ] Disable duplicate submissions and show actionable server error messages.
- [ ] Add optional remember-me behavior if supported by the backend.
- [ ] Add session-expired handling that preserves the intended destination after login.
- [ ] Add optional MFA enrollment and verification UI for administrators.
- [ ] Add rate-limit feedback without revealing whether an account exists.

## 4. Dashboard

- [ ] Replace the static XAU/USD graph with live time-series data and responsive chart interactions.
- [ ] Add chart loading, stale-data, disconnected, market-closed, and reconnecting indicators.
- [ ] Show accurate price, change, high, low, open, and last-update timestamp formatting.
- [ ] Connect Active Signals, Win Rate, and Net Pips statistics to the current user or selected period.
- [x] Make Economic Calendar “View All” navigate to Market → Kalender.
- [ ] Make calendar rows open event details.
- [ ] Make Latest Signal “View All” navigate to Signals and open a selected signal detail view.
- [ ] Add a signal detail modal/page with chart, status history, notes, and timestamps.
- [x] Make Announcement “View All” navigate to Community → Info.
- [ ] Make Market Sentiment refresh from live data and expose its calculation timestamp/source.
- [ ] Animate changing figures carefully without causing layout shifts.

## 5. Signals

- [ ] Connect Tim Expert and AI Real-Time tabs to separate server queries.
- [ ] Implement search with debounce and a clear-search action.
- [ ] Implement Session, Status, Result, and Sort filters.
- [ ] Persist filters in the URL and add a reset-filters action.
- [ ] Add pagination or cursor-based infinite scrolling.
- [ ] Make “View History” show completed, cancelled, and expired signals.
- [ ] Add signal detail views and accessible chart/image previews.
- [ ] Connect “Tambah Signal” and “Publish Signal” to role-restricted create flows.
- [ ] Validate entry, stop loss, TP1, TP2, symbol, direction, session, and analysis fields.
- [ ] Add proper symbol selection instead of duplicate Entry fields in the current form.
- [x] Implement BUY/SELL segmented selection and clear selected-state feedback.
- [ ] Implement chart upload with drag/drop, file picker, preview, replacement, validation, progress, and cancellation.
- [ ] Confirm before publishing; prevent duplicate signal publication.
- [ ] Add edit, close, cancel, and delete controls for authorized experts/admins.
- [ ] Update running signals in real time, including pip result and status transitions.
- [ ] Add success/error notifications and optimistic updates where safe.
- [ ] Handle missing TP2, long analysis text, unusual prices, and negative/zero pip results.

## 6. Market

- [ ] Replace the Chart placeholder with a real chart provider or first-party chart implementation.
- [x] Make XAUUSD, EURUSD, GBPUSD, USDJPY, and BTCUSD tabs load their own demo data.
- [ ] Add time-frame controls, crosshair, OHLC tooltip, zoom, pan, and reset view.
- [ ] Add provider attribution where required by the chart/data license.
- [ ] Connect Daily Outlook to published analyst content.
- [ ] Connect sentiment bars to live values and update timestamps.
- [ ] Make Research session cards reflect actual market hours and the user’s timezone.
- [ ] Update Current Session, Next Session, countdown, and activity automatically.
- [x] Implement Today, Tomorrow, and This Week calendar date filters using demo data.
- [x] Implement All, High, Medium, and Low impact filters using demo data.
- [ ] Implement Country and Impact dropdown menus with keyboard navigation.
- [ ] Connect calendar search with debounce and highlighting.
- [ ] Add event detail expansion with previous, forecast, actual, source, and revision values.
- [ ] Add timezone selection and clearly display the active timezone.
- [ ] Handle market holidays, daylight-saving changes, delayed data, and missing values.

## 7. Community Forum

- [x] Connect the post composer to local demo mutations.
- [ ] Add real multiline input, character limits, draft preservation, and validation.
- [ ] Implement image/video attachments with preview, progress, cancellation, and removal.
- [ ] Add post detail pages or expandable threads.
- [x] Implement local optimistic reaction toggling for the demo.
- [ ] Implement comments, replies, mentions, and comment counts.
- [ ] Load profiles, avatars, and membership badges from account data.
- [ ] Connect Trending topics and view counts.
- [ ] Add pagination/infinite scrolling and scroll restoration.
- [ ] Add edit/delete/report/block actions based on ownership and role.
- [ ] Add moderation and removed-content states.

## 8. Community Live Trade

- [ ] Integrate a supported live-stream player and poster/loading/error states.
- [ ] Add play/pause, mute, volume, quality, fullscreen, picture-in-picture, and captions where available.
- [ ] Update LIVE state and viewer count in real time.
- [ ] Restrict “Tambah Live” to authorized admins/experts.
- [ ] Add create/schedule/start/end/cancel live-session flows.
- [ ] Connect live comments through WebSocket or Server-Sent Events.
- [ ] Add reconnect behavior, message ordering, deduplication, and timestamps.
- [ ] Add pinned admin messages and user role badges.
- [ ] Implement slow mode, mute, remove, report, and block controls.
- [ ] Auto-scroll only when the user is already near the newest message.

## 9. Community Chat

- [ ] Load conversation list and unread counts from the messaging API.
- [x] Implement conversation selection and active state.
- [ ] Send, receive, retry, and delete messages.
- [ ] Add sending, sent, delivered, read, and failed states.
- [ ] Add WebSocket reconnect, deduplication, ordering, and missed-message recovery.
- [ ] Implement unread badges, typing indicators, presence, and last-seen state.
- [ ] Group messages by date and sender; format timestamps in the user’s locale.
- [ ] Add attachments if required, with the same validated upload workflow.
- [ ] Preserve drafts per conversation.
- [ ] Add responsive mobile flow between conversation list and chat room.

## 10. Community Info and announcements

- [ ] Restrict announcement creation to authorized roles.
- [x] Implement announcement title/body input, basic validation, and local demo publishing.
- [ ] Implement optional image upload and preview.
- [ ] Add scheduled publishing, expiry, pinning, editing, and deletion.
- [ ] Load announcement cards from the API with pagination.
- [ ] Add announcement detail views and mark-as-read tracking if needed.
- [ ] Correctly order pinned, scheduled, active, and archived announcements.

## 11. Profile, rewards, and education

- [ ] Load the authenticated member profile, IB identifier, avatar, tier, lot totals, and join date.
- [ ] Add profile editing and avatar upload.
- [ ] Calculate progress from backend tier rules rather than hard-coded percentages.
- [ ] Load reward tiers, thresholds, prizes, and availability from configuration/API.
- [ ] Handle tier upgrades, downgrades, pending verification, and reward claim state.
- [ ] Make Reward Program, Education, Settings, and Help actions functional.
- [x] Connect education cards to an interactive demo playback state.
- [ ] Implement progress tracking, resume position, completion status, and locked-course access.
- [ ] Add accessible captions/transcripts and playback-speed controls.
- [ ] Show a clear upgrade path for premium courses.
- [ ] Add account settings for password, notifications, language, timezone, privacy, and account deletion.

## 12. Responsive design and visual QA

- [ ] Perform screenshot comparison against every supplied Figma export at its original viewport.
- [ ] Fix all overflow, clipping, wrapping, and alignment issues at intermediate widths—not only breakpoints.
- [ ] Test portrait and landscape layouts on real iOS and Android devices.
- [ ] Make data tables/cards readable without accidental horizontal page scrolling.
- [ ] Verify browser zoom at 80%, 100%, 125%, 150%, and 200%.
- [ ] Prevent layout shift from fonts, images, charts, and async content.
- [ ] Add explicit aspect ratios and responsive image sizing.
- [ ] Respect safe-area insets on notched devices.

## 13. Accessibility

- [ ] Target WCAG 2.2 AA.
- [ ] Use semantic landmarks, headings, forms, labels, lists, tables, and buttons.
- [ ] Ensure every control has an accessible name and visible focus state.
- [ ] Make tabs follow the ARIA tabs keyboard interaction pattern.
- [ ] Make dropdowns, dialogs, drawers, uploads, and notifications keyboard accessible.
- [ ] Add focus trapping/restoration for dialogs and menus.
- [ ] Verify color contrast, including gold text and disabled/premium states.
- [ ] Never communicate BUY/SELL, gain/loss, or impact using color alone.
- [ ] Add alt text for meaningful images and empty alt text for decorative images.
- [ ] Support reduced motion and avoid flashing or disruptive animations.
- [ ] Test with screen readers and automated accessibility tooling.

## 14. Performance and reliability

- [ ] Convert the 1.5 MB login PNG to an optimized WebP/AVIF with a PNG fallback if necessary.
- [ ] Replace the raster-embedded logo SVG with a true vector export.
- [ ] Lazy-load page modules, video players, charts, and below-the-fold images.
- [ ] Use responsive images and CDN transformations for uploaded content.
- [ ] Remove unused dependencies, components, services, and duplicate legacy files.
- [ ] Define bundle-size budgets and monitor route chunk sizes.
- [ ] Add graceful offline/network-error behavior and retry controls.
- [ ] Test on throttled mobile connections and lower-powered devices.

## 15. Frontend security and privacy

- [ ] Never store long-lived secrets or sensitive tokens in `localStorage`.
- [ ] Treat role checks in the UI as presentation only; backend authorization remains mandatory.
- [ ] Sanitize or safely render all user-generated rich text.
- [ ] Restrict upload type/size on the client while repeating all validation on the server.
- [ ] Avoid exposing sensitive account, provider, or debugging information in errors.
- [ ] Add a Content Security Policy compatible with required APIs, images, video, and analytics.
- [ ] Add consent controls before non-essential analytics or marketing scripts where legally required.

## 16. Testing and release gates

- [ ] Add unit tests for formatting, validation, tier calculations, filters, and state reducers.
- [ ] Add component tests for forms, tabs, dropdowns, cards, and error/loading states.
- [ ] Add end-to-end tests for login, logout, signals, market filters, posting, chat, announcements, and profile flows.
- [ ] Add responsive visual-regression tests for every supplied design screen.
- [ ] Test authentication expiry, slow APIs, failed uploads, WebSocket reconnects, and duplicate submissions.
- [ ] Run automated accessibility checks in CI.
- [ ] Add linting, formatting, type-checking, tests, and production build as required CI gates.
- [ ] Test supported versions of Chrome, Edge, Firefox, and Safari.
- [ ] Remove console errors, warnings, placeholder links, mock credentials, and dead controls before release.

## Frontend definition of done

- [ ] Every visible button and link has a deliberate working action.
- [ ] Every async area has loading, empty, success, error, offline, and retry behavior.
- [ ] Every role-restricted action is hidden or disabled appropriately and enforced by the backend.
- [ ] Every supplied design has passed desktop and responsive visual comparison.
- [ ] Accessibility, browser support, performance budgets, and automated tests pass in CI.
- [ ] No dummy data remains in the production build unless explicitly labeled as demo content.
