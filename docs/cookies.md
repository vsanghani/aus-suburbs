# Cookies

This is an engineering contract for the banner, not legal advice. The public privacy page (`/privacy`) still only describes the theme and the shortlist in local storage. It needs a proper update before visitors are asked for consent. That update has to satisfy the Australian Privacy Act 1988 (including a clear collection notice) and, if people in the EU or UK are in scope, the GDPR and the ePrivacy rule for storage on a device. Whether `kf_vid` is personal information is a legal question this repo does not decide.

The banner POSTs the choice and then reads `kf_consent`. It ignores the response body: any 2xx is success, as long as the browser received `Set-Cookie` and the cookie is readable. The page never creates or clears `kf_vid`. If the POST fails, 404s, or does not leave a current readable `kf_consent`, the page writes `kf_consent` itself and still does not touch `kf_vid`.

## Cookie table

| Name         | Purpose                                                                                                          | Category  | Duration                                                                          |
| ------------ | ---------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------------------------------------------- |
| `kf_consent` | Remembers the choice (`accept_all`, `essential_only`, or `reject_all`), the policy version, and the time of it.  | Essential | 12 months (`Max-Age=31536000`, 365 days). Set for every choice, including reject. |
| `kf_vid`     | Random anonymous visitor id (UUID v4). No name, email, or other account data. The page never writes this cookie. | Analytics | 12 months, and only while the recorded choice is `accept_all`.                    |

Both cookies are first-party and host-only (no `Domain` attribute).

`kf_consent` is not `HttpOnly`, because the page reads it. On the wire it matches the page's fallback writer:

```text
kf_consent=<urlencoded-json>; Max-Age=31536000; Path=/; SameSite=Lax
```

`Secure` is appended only when the request is https (`https:` URL, or `X-Forwarded-Proto: https`). It is omitted on http so a local banner can read the cookie.

`kf_vid` is `HttpOnly`, `Secure`, `SameSite=Lax`, and `Path=/`. It is set only when the recorded choice is `accept_all`, and not when `Sec-GPC: 1` or `DNT: 1` downgrades that choice. Any other recorded choice expires it (`Max-Age=0`). A later POST of `accept_all` reuses a valid existing id and sets the 12-month lifetime again, because the visitor posted again. `GET /api/consent` never writes a cookie, so a read cannot slide either lifetime forward.

`kf_consent` is allowed under every choice, including reject and before the visitor has chosen. Reject means “no analytics cookie”, not “no cookies at all”.

The value is `encodeURIComponent` of this JSON, with these keys only and no extra space:

```text
{"choice":"essential_only","version":1,"timestamp":"2026-10-27T10:45:00.000Z"}
```

`choice` in the cookie is always one of `accept_all`, `essential_only`, `reject_all`. `version` is the integer policy version in `server/consent.mjs` (`POLICY_VERSION`, currently `1`). `timestamp` is `Date.toISOString()`. A cookie with another version, a bad timestamp, or extra fields is not a current decision. Bump the constant when the meaning of a choice changes.

Older cookies and POST bodies may still say `all`, `essential`, or `reject`. Those are aliases. The server normalises them to `accept_all`, `essential_only`, and `reject_all` before it stores the cookie or returns JSON.

## Where it runs

`POST /api/consent` and `GET /api/consent` run in the Vercel function `api/consent.js`. Vercel matches a filesystem function before the catch-all rewrite, so this path is not rewritten onto `api/ssr.js` and is not proxied to FastAPI. No database and no new credentials.

`server/index.mjs` (`npm run dev`, `npm run start`, Docker, Playwright) and `server/emulate-vercel.mjs` call that same function before the document handler. If a consent request still reaches the document renderer, that renderer returns 404 JSON and does not set a cookie.

Document HTML, sitemap, and robots never set `Set-Cookie` and do not send `Vary: Cookie`. Successful HTML stays `public, max-age=60, s-maxage=300, stale-while-revalidate=86400`.

The consent responses send `Cache-Control: private, no-store`, plus `CDN-Cache-Control: no-store` and `Vercel-CDN-Cache-Control: no-store`. `vercel.json` repeats those three headers for `/api/consent`. The response also sends `Vary: Cookie, Sec-GPC, DNT` so a cache that ignored `no-store` still would not reuse one visitor’s answer for another. That `Vary` is only on this endpoint.

There is no CORS header. Call it same-origin (`credentials: "same-origin"`). A browser `POST` with `Content-Type: application/json` cannot be forged by a cross-site form. A request that already carries `Sec-Fetch-Site: cross-site` is refused with 403 and no cookies.

## Endpoint contract

The banner posts and then reads the cookie. It does not read this JSON. GET and any other caller still get the same shape, with the canonical choice names. The body is `{ choice, essential, analytics, version, timestamp }`. It never includes `kf_vid`. That cookie is `HttpOnly`, so page JavaScript cannot read it, and the JSON does not hand the value back.

`essential` is always `true`: it means essential storage is allowed, not that the visitor pressed “Essential only”. The button is `choice`. `analytics` is `true` only when `choice` is `"accept_all"` and the request did not send `Sec-GPC: 1` or `DNT: 1`.

| Situation                               | `choice`           | `essential` | `analytics` |
| --------------------------------------- | ------------------ | ----------- | ----------- |
| No decision yet                         | `null`             | `true`      | `false`     |
| Essential only                          | `"essential_only"` | `true`      | `false`     |
| Reject all                              | `"reject_all"`     | `true`      | `false`     |
| Accept all, no GPC/DNT                  | `"accept_all"`     | `true`      | `true`      |
| `POST` accept all with GPC or DNT       | `"essential_only"` | `true`      | `false`     |
| `GET` stored accept-all with GPC or DNT | `"accept_all"`     | `true`      | `false`     |

`version` is a number. On a decision it is the version stored in the cookie. When `choice` is `null` it is the current policy version a new POST would store. `timestamp` is an ISO-8601 UTC string (`Date.toISOString()`) when a decision is stored, and `null` when `choice` is `null`. Show the banner when `choice` is `null`.

### `POST /api/consent`

This is the body the banner sends:

```http
POST /api/consent HTTP/1.1
Content-Type: application/json

{"choice":"accept_all","version":1}
```

`choice` is `accept_all`, `essential_only`, or `reject_all`. The old names `all`, `essential`, and `reject` are accepted and stored as the canonical names. `version` is optional. When it is present it must be the integer `1`. A missing version is stored as `1`. No other properties. `Content-Type` must be `application/json` (a `charset` parameter is fine).

Accept all, no privacy signal. `kf_consent` and `kf_vid` are both set. On http, `kf_consent` has no `Secure` flag. `kf_vid` is always `Secure` and `HttpOnly`.

```json
{
  "choice": "accept_all",
  "essential": true,
  "analytics": true,
  "version": 1,
  "timestamp": "2026-10-27T10:45:00.000Z"
}
```

The visitor id is only in the `kf_vid` `Set-Cookie` header. Essential only, and reject all, use the same shape with `analytics: false`. Reject:

```json
{
  "choice": "reject_all",
  "essential": true,
  "analytics": false,
  "version": 1,
  "timestamp": "2026-10-27T10:45:00.000Z"
}
```

Those responses set `kf_consent` and expire `kf_vid`.

**GPC / DNT deviation.** `Sec-GPC: 1` or `DNT: 1` on a POST of `accept_all` (or the alias `all`) is stored as `essential_only`, even though the visitor pressed Accept all. The cookie the page reads therefore says `essential_only`, so analytics stays off. The JSON says the same thing (`choice: "essential_only"`, `analytics: false`), but the banner ignores the body and uses the cookie. `kf_vid` is not set, and an existing one is expired. A later request without the signal does not turn analytics back on; the visitor has to POST `accept_all` again. Other header values (`0`, or the header absent) are not an opt-out.

Buttons:

| Button         | JSON `choice`      |
| -------------- | ------------------ |
| Accept all     | `"accept_all"`     |
| Essential only | `"essential_only"` |
| Reject all     | `"reject_all"`     |

```javascript
await fetch("/api/consent", {
  method: "POST",
  credentials: "same-origin",
  headers: { accept: "application/json", "content-type": "application/json" },
  body: JSON.stringify({ choice: "essential_only", version: 1 }),
});
```

Invalid input is `400` with `{ "detail": "..." }` and no `Set-Cookie`. That includes a missing or non-JSON content type, a non-object body, any property other than `choice` and `version`, a choice outside the six accepted strings, and a `version` other than `1`. Anything other than `GET` or `POST` is `405` with `Allow: GET, POST`. `Sec-Fetch-Site: cross-site` is `403`. A failed handler is `500` with `{ "detail": "Consent could not be saved." }` and no cookies. Every one of those responses is `Cache-Control: private, no-store`.

### `GET /api/consent`

No body. No `Set-Cookie`. Does not call the visit hook and does not renew `Max-Age`. Reads the same `kf_consent` JSON the page reads. Alias choice names in an old cookie are returned as the canonical names.

No decision (missing cookie, malformed cookie, or a policy version other than the current one):

```json
{
  "choice": null,
  "essential": true,
  "analytics": false,
  "version": 1,
  "timestamp": null
}
```

Stored essential choice:

```json
{
  "choice": "essential_only",
  "essential": true,
  "analytics": false,
  "version": 1,
  "timestamp": "2026-10-27T10:45:00.000Z"
}
```

Stored accept-all, and the request has no GPC or DNT. GET does not return the visitor id and will not mint one.

```json
{
  "choice": "accept_all",
  "essential": true,
  "analytics": true,
  "version": 1,
  "timestamp": "2026-10-27T10:45:00.000Z"
}
```

Stored accept-all while `Sec-GPC: 1` or `DNT: 1` is set. The stored choice stays `"accept_all"` because GET does not write. Analytics is off for this request. The cookies, including `kf_vid`, stay until a POST changes them. The JSON still does not contain the id.

```json
{
  "choice": "accept_all",
  "essential": true,
  "analytics": false,
  "version": 1,
  "timestamp": "2026-10-27T10:45:00.000Z"
}
```

```javascript
const state = await fetch("/api/consent", { credentials: "same-origin" }).then((response) =>
  response.json(),
);
if (state.choice === null) {
  // show the banner
}
```

The banner itself does not call GET. It reads `kf_consent`.

## Visit recording

`server/visit-record.mjs` exports `recordConsentedVisit`. It is a no-op. `handleConsent` calls it only after a POST has recorded `accept_all`, with `{ visitorId, timestamp, version }` on the server and nothing else. That id is not copied into the HTTP body. The hook is not called for `essential_only`, `reject_all`, a GPC or DNT downgrade, a GET, or a rejected body. If the hook throws, the consent response is still returned and the cookies are still set.

A later change can write a visit from that function. The write needs its own limited database role. The API role on Vercel is read-only. This change adds no database credentials, tables, or connection strings. Do not point the hook at the read-only API role.
