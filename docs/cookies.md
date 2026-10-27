# Cookies

This is an engineering contract for the banner, not legal advice. The public privacy page (`/privacy`) still only describes the theme and the shortlist in local storage. It needs a proper update before visitors are asked for consent. That update has to satisfy the Australian Privacy Act 1988 (including a clear collection notice) and, if people in the EU or UK are in scope, the GDPR and the ePrivacy rule for storage on a device. Whether `kf_vid` is personal information is a legal question this repo does not decide.

The page must not write `kf_consent` or `kf_vid`. `document.cookie` cannot see them (`HttpOnly`). The banner POSTs the button and reads the state back.

## Cookie table

| Name         | Purpose                                                                                         | Category  | Duration                                                                          |
| ------------ | ----------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------- |
| `kf_consent` | Remembers the choice (`all`, `essential`, or `reject`), the policy version, and the time of it. | Essential | 12 months (`Max-Age=31536000`, 365 days). Set for every choice, including reject. |
| `kf_vid`     | Random anonymous visitor id (UUID v4). No name, email, or other account data.                   | Analytics | 12 months, and only while the recorded choice is `all`.                           |

Both cookies are first-party and host-only (no `Domain` attribute). Attributes on every write: `Secure`, `HttpOnly`, `SameSite=Lax`, `Path=/`.

`kf_consent` is allowed under every choice, including reject and before the visitor has chosen. Reject means “no analytics cookie”, not “no cookies at all”. The server has to store the refusal or it cannot tell a returning visitor from a new one.

`kf_vid` is set only when the recorded choice is `all`. A POST of `essential` or `reject` expires it (`Max-Age=0`), including when the previous choice was `all`. A POST of `all` reuses a valid existing id and sets the 12-month lifetime again. That refresh happens only because the visitor posted again. `GET /api/consent` never writes a cookie, so a read cannot slide either lifetime forward.

`kf_consent` value is `encodeURIComponent` of this JSON, with these keys only and no extra space:

```text
{"choice":"essential","version":1,"timestamp":"2026-10-27T10:45:00.000Z"}
```

`version` is the integer policy version in `server/consent.mjs` (`POLICY_VERSION`, currently `1`). A cookie with any other version, a bad timestamp, or extra fields is treated as no decision, so the banner can ask again. Bump the constant when the meaning of a choice changes.

## Where it runs

`POST /api/consent` and `GET /api/consent` run in the Vercel function `api/consent.js`. Vercel matches a filesystem function before the catch-all rewrite, so this path is not rewritten onto `api/ssr.js` and is not proxied to FastAPI. No database and no new credentials.

`server/index.mjs` (`npm run dev`, `npm run start`, Docker, Playwright) and `server/emulate-vercel.mjs` call that same function before the document handler. If a consent request still reaches the document renderer, that renderer returns 404 JSON and does not set a cookie.

Document HTML, sitemap, and robots never set `Set-Cookie` and do not send `Vary: Cookie`. Successful HTML stays `public, max-age=60, s-maxage=300, stale-while-revalidate=86400`.

The consent responses send `Cache-Control: private, no-store`, plus `CDN-Cache-Control: no-store` and `Vercel-CDN-Cache-Control: no-store`. `vercel.json` repeats those three headers for `/api/consent`. The response also sends `Vary: Cookie, Sec-GPC, DNT` so a cache that ignored `no-store` still would not reuse one visitor’s answer for another. That `Vary` is only on this endpoint.

There is no CORS header. Call it same-origin. A browser `POST` with `Content-Type: application/json` cannot be forged by a cross-site form. A request that already carries `Sec-Fetch-Site: cross-site` is refused with 403 and no cookies.

## Endpoint contract

Both methods return this JSON shape. `essential` is always `true`: it means essential storage is allowed, not that the visitor pressed “Essential only”. The button is `choice`. `analytics` is `true` only when `choice` is `"all"` and the request did not send `Sec-GPC: 1` or `DNT: 1`. `visitorId` is the `kf_vid` string when analytics is on and an id is stored, otherwise `null`. The raw id is in the JSON on purpose so the banner can read it without `document.cookie`. It is `null` whenever analytics is off, including a `GET` of a stored `all` choice while GPC or DNT is set.

| Situation                         | `choice`      | `essential` | `analytics` | `visitorId`    |
| --------------------------------- | ------------- | ----------- | ----------- | -------------- |
| No decision yet                   | `null`        | `true`      | `false`     | `null`         |
| Essential only                    | `"essential"` | `true`      | `false`     | `null`         |
| Reject all                        | `"reject"`    | `true`      | `false`     | `null`         |
| Accept all, no GPC/DNT            | `"all"`       | `true`      | `true`      | UUID or `null` |
| `POST` accept all with GPC or DNT | `"essential"` | `true`      | `false`     | `null`         |
| `GET` stored all with GPC or DNT  | `"all"`       | `true`      | `false`     | `null`         |

`version` is a number. On a decision it is the version stored in the cookie. When `choice` is `null` it is the current policy version a new POST would store. `timestamp` is an ISO-8601 UTC string (`Date.toISOString()`) when a decision is stored, and `null` when `choice` is `null`. Show the banner when `choice` is `null`.

### `POST /api/consent`

```http
POST /api/consent HTTP/1.1
Content-Type: application/json

{"choice":"all"}
```

`choice` must be exactly `"all"`, `"essential"`, or `"reject"`. The body must be a JSON object with that one property. `Content-Type` must be `application/json` (a `charset` parameter is fine).

Accept all, no privacy signal:

```json
{
  "choice": "all",
  "essential": true,
  "analytics": true,
  "version": 1,
  "timestamp": "2026-10-27T10:45:00.000Z",
  "visitorId": "550e8400-e29b-41d4-a716-446655440000"
}
```

`Set-Cookie` (attributes abbreviated in this paragraph, not on the wire): `kf_consent` for 12 months, and `kf_vid` for 12 months.

Essential only, and reject all, use the same shape with `analytics: false` and `visitorId: null`. Reject:

```json
{
  "choice": "reject",
  "essential": true,
  "analytics": false,
  "version": 1,
  "timestamp": "2026-10-27T10:45:00.000Z",
  "visitorId": null
}
```

Those responses set `kf_consent` and expire `kf_vid`.

`Sec-GPC: 1` or `DNT: 1` on a POST of `"all"` is recorded as essential. The response says so by returning `choice: "essential"`, `analytics: false`, and `visitorId: null`. `kf_vid` is not set, and an existing one is expired. A later request without the signal does not turn analytics back on; the visitor has to POST `"all"` again. Other header values (`0`, or the header absent) are not an opt-out.

Buttons:

| Button         | JSON `choice` |
| -------------- | ------------- |
| Accept all     | `"all"`       |
| Essential only | `"essential"` |
| Reject all     | `"reject"`    |

```javascript
await fetch("/api/consent", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ choice: "essential" }),
});
```

Invalid input is `400` with `{ "detail": "..." }` and no `Set-Cookie`. That includes a missing or non-JSON content type, a non-object body, any extra property, and a choice outside the three strings. Anything other than `GET` or `POST` is `405` with `Allow: GET, POST`. `Sec-Fetch-Site: cross-site` is `403`. A failed handler is `500` with `{ "detail": "Consent could not be saved." }` and no cookies. Every one of those responses is `Cache-Control: private, no-store`.

### `GET /api/consent`

No body. No `Set-Cookie`. Does not call the visit hook and does not renew `Max-Age`.

No decision (missing cookie, malformed cookie, or a policy version other than the current one):

```json
{
  "choice": null,
  "essential": true,
  "analytics": false,
  "version": 1,
  "timestamp": null,
  "visitorId": null
}
```

Stored essential choice:

```json
{
  "choice": "essential",
  "essential": true,
  "analytics": false,
  "version": 1,
  "timestamp": "2026-10-27T10:45:00.000Z",
  "visitorId": null
}
```

Stored accept-all, and the request has no GPC or DNT. `visitorId` is `null` here only when `kf_vid` is missing or not a UUID v4. GET will not mint a replacement.

```json
{
  "choice": "all",
  "essential": true,
  "analytics": true,
  "version": 1,
  "timestamp": "2026-10-27T10:45:00.000Z",
  "visitorId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Stored accept-all while `Sec-GPC: 1` or `DNT: 1` is set. The stored choice stays `"all"` because GET does not write. Analytics is off for this request, and the id is withheld. The cookies stay until a POST changes them.

```json
{
  "choice": "all",
  "essential": true,
  "analytics": false,
  "version": 1,
  "timestamp": "2026-10-27T10:45:00.000Z",
  "visitorId": null
}
```

```javascript
const state = await fetch("/api/consent").then((response) => response.json());
if (state.choice === null) {
  // show the banner
}
```

## Visit recording

`server/visit-record.mjs` exports `recordConsentedVisit`. It is a no-op. `handleConsent` calls it only after a POST has recorded `all`, with `{ visitorId, timestamp, version }` and nothing else. It is not called for essential, reject, a GPC or DNT downgrade, a GET, or a rejected body. If the hook throws, the consent response is still returned and the cookies are still set.

A later change can write a visit from that function. The write needs its own limited database role. The API role on Vercel is read-only. This change adds no database credentials, tables, or connection strings. Do not point the hook at the read-only API role.
