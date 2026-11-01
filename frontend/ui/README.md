# Meridiani UI

The Next.js app uses the shared `@meridiani/components` library for the map and
game interface. Questions, answer checks, map data, and leaderboard entries are
loaded through the services in `api/`. The MapLibre worker is copied from its
package into `public/` automatically before development, build, and start.

## Run locally

From the `frontend` workspace:

```sh
npm install
npm run build --workspace @meridiani/components
npm run dev --workspace @meridiani/ui
```

Set `NEXT_PUBLIC_API_URL` in `frontend/ui/.env.local` to the API base URL when it
is not available at `/api`. The app uses the bundled Europe map if the map-data
service is unavailable; API errors for gameplay and leaderboard data are shown
in the app.

Use `setGlobalApiHeaders` from `api/api.ts` to configure headers at runtime.
They are merged into every API request; request-specific headers override
matching global headers. For example, configure a runtime client identifier
before making requests:

```ts
import { setGlobalApiHeaders } from './api/api';

setGlobalApiHeaders({ 'X-Client-Id': runtimeConfig.clientId });
```

Calling it again replaces the configured global headers. Do not put secrets in
browser-side configuration; use a server-side API proxy for credentials that
must remain private.

For bearer-token authentication, call `addAuthorization` with the access token.
It adds an `Authorization: Bearer ...` header to every API request:

```ts
import { addAuthorization } from './api/api';

addAuthorization(runtimeConfig.accessToken);
```

To use built-in sample questions, answer checking, and leaderboard instead of
the live gameplay API, set `NEXT_PUBLIC_USE_MOCK_QUESTIONS=true` in
`frontend/ui/.env.local`. To use the bundled Europe map instead of the map API,
set `NEXT_PUBLIC_USE_MOCK_GEO=true`. Restart the development server after
changing either variable. Unset a variable or set it to `false` to use its live
API service.

## Validate

```sh
npm run lint --workspace @meridiani/ui
npm run build --workspace @meridiani/ui
```
