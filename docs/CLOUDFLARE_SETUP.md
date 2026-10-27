# Cloudflare setup for NH Terminal

## Protected Live Trade

1. Subscribe to Cloudflare Stream and create a **Live Input**.
2. In the Live Input's recording settings, choose **Automatic** recording, enable **Require signed URLs**, and add the NH Terminal website hostname to **Allowed Origins**. Do not enable public playback for this input or its recordings.
3. Add `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_STREAM_API_TOKEN`, `CLOUDFLARE_STREAM_CUSTOMER_CODE`, and `CLOUDFLARE_STREAM_LIVE_INPUT_ID` to the server environment. The API token needs permission to read the Live Input and its videos and to create signed playback tokens. Do not put it in a `VITE_` variable.
4. Set `APP_ORIGIN` to the exact website origin. Members receive a signed player URL only while a broadcast is active. The Live Input ID is a one-time server setting; admins do not need to enter it on the website. The existing admin-only API setting remains as a fallback for older installations.
5. Configure the broadcaster's OBS profile once using the Live Input's RTMPS URL and stream key. Keep the stream key in OBS, not in the website. For each broadcast, the host only clicks **Start Streaming** and **Stop Streaming** in OBS. The Live Trade page switches between setup pending, ready, and live automatically.

The older YouTube link remains in the database for recovery but is no longer displayed. Signed playback links expire after two hours and refresh while the page remains open. A member can still record their screen or share account access; web playback cannot prevent either.

## Turnstile

1. Create a Cloudflare Turnstile widget for the NH Terminal domain.
2. Add its **site key** as `VITE_TURNSTILE_SITE_KEY` to the website build environment.
3. Add its **secret key** as `TURNSTILE_SECRET_KEY` to the server environment. Never put the secret in a `VITE_` variable.
4. Set `APP_ORIGIN` to the website origin so server validation can compare the Turnstile hostname.

Turnstile protects sign in, sign up, resend verification, and password reset requests. It is bypassed only for local/test runs with no secret configured. Production requests fail closed if the secret is missing.

Cloudflare setup references: [Stream security](https://developers.cloudflare.com/stream/viewing-videos/securing-your-stream/), [Live Input configuration](https://developers.cloudflare.com/stream/stream-live/start-stream-live/), [Turnstile setup](https://developers.cloudflare.com/turnstile/get-started/), and [server validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
