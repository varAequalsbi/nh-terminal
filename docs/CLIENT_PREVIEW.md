# Client preview

Vercel builds non-main branches as Preview deployments. The Preview environment
sets `VITE_DEMO_PREVIEW=true`, which switches browser API calls to sample data.
Visitors use **Use Demo Account** on the sign-in page. Any changes they make are
kept in that browser tab's session storage and are not shared with other
visitors. This mode does not create accounts or use PostgreSQL, paid market
data, Stream, or the live website's backend.

The banner on every page identifies the sample-data preview. To share a build,
use its **Share** control in Vercel and copy the generated link. A normal
deployment URL may still show Vercel's sign-in screen to visitors without
access. A newer push creates a new Preview deployment; verify its share link
before sending it to the client.

Do not enable `VITE_DEMO_PREVIEW` for the Production environment. A production
launch still requires the gates in `DATABASE_READINESS.md`.
