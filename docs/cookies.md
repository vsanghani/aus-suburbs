# Cookies

This is an engineering contract for the banner, not legal advice. The public privacy page (`/privacy`) still only describes the theme and the shortlist in local storage. It needs a proper update before visitors are asked for consent. That update has to satisfy the Australian Privacy Act 1988 (including a clear collection notice) and, if people in the EU or UK are in scope, the GDPR and the ePrivacy rule for storage on a device. Whether `kf_vid` is personal information is a legal question this repo does not decide.

The banner reads state from `GET /api/consent`. If that GET fails or returns 404, it falls back to the `kf_consent` cookie. A POST stores the choice the response returns, not the button that was pressed. When `privacySignal` is `"gpc"` or `"dnt"`, the banner shows a note that analytics stayed off because the browser sent a privacy signal. The page never creates or clears `kf_vid`. If the POST fails or 404s, the page writes `kf_consent` for the pressed choice and still does not touch `kf_vid`.

## Cookie table

| Name         | Purpose                                                                                                                                                 | Category  | Duration  |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------- |
| `kf_consent` | Remembers the choice (`accept_all`, `essential_only`, or `reject_all`), the policy version, and the time of it. Set for every choice, including reject. | Essential | 12 months |
| `kf_vid`     | Random anonymous visitor id (UUID v4). No name, email, or other account data. The page never writes this cookie. Set only for a recorded `accept_all`.  | Optional  | 12 months |

Both cookies are first-party and host-only (no `Domain` attribute).

`kf_consent` is not `HttpOnly`, because the page reads it. On the wire it matches the page's fallback writer:

```text
kf_consent=<urlencoded-json>; Max-Age=31536000; Path=/; SameSite=Lax
```

`Secure` is appended only when the request is https (`https:` URL, or `X-Forwarded-Proto: https`). It is omitted on http so a local banner can read the cookie.

Both durations are `Max-Age=31536000` (365 days). `kf_vid` is optional: it is absent unless the recorded choice is `accept_all`.

`kf_vid` is `HttpOnly`, `Secure`, `SameSite=Lax`, and `Path=/`. It is set only when the recorded choice is `accept_all`, and not when `Sec-GPC: 1` or `DNT: 1` downgrades that choice. Any other recorded choice expires it (`Max-Age=0`). A later POST of `accept_all` reuses a valid existing id and sets the 12-month lifetime again, because the visitor posted again. A GET with no privacy signal writes no cookie, so that read cannot slide either lifetime forward and cannot reveal `kf_vid`. A GET with `Sec-GPC: 1` or `DNT: 1` expires an existing `kf_vid` and, when `kf_consent` says `accept_all`, rewrites it to `essential_only` with the same version and a fresh timestamp. That rewrite starts a new 12-month `Max-Age`. If there is nothing to change, that GET writes nothing.

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

The banner reads this JSON. GET and POST return the same shape, with the canonical choice names. The body is `{ choice, essential, analytics, version, timestamp, privacySignal }`. It never includes `kf_vid`. That cookie is `HttpOnly`, so page JavaScript cannot read it, and the JSON does not hand the value back.

`essential` is always `true`: it means essential storage is allowed, not that the visitor pressed “Essential only”. `choice` is the recorded choice. `analytics` is `true` only when `choice` is `"accept_all"`. A privacy signal never leaves `choice` as `"accept_all"`, so analytics is off whenever `privacySignal` is set.

`privacySignal` tells the banner the browser signal was honoured. It is `"gpc"` when the request has `Sec-GPC: 1`, `"dnt"` when that header is not `1` and `DNT` is `1`, and `null` when neither signal is set. If both headers are `1`, the value is `"gpc"`. Other values (`0`, or the header absent) are not a signal.

GET and POST apply that signal the same way. `accept_all` (and the alias `all`) becomes `essential_only` in the JSON. `analytics` is `false`. The body does not contain `kf_vid`. POST stores that downgrade in `kf_consent`, does not set `kf_vid`, and expires one that is already there. An explicit `essential_only` or `reject_all` stays that choice, and `privacySignal` is still set. A GET with no usable cookie stays `choice: null` so the banner can show, with `privacySignal` set when the browser sent one.

Under GPC or DNT, GET reports `essential_only` and updates the browser to match. If `kf_consent` says `accept_all`, GET rewrites it to `essential_only`, keeps the stored version, and sets a fresh timestamp. If `kf_vid` is present, GET expires it (`Max-Age=0`, with the same `Path`, `SameSite`, `Secure`, and `HttpOnly` attributes). GET emits those `Set-Cookie` headers only when there is something to change. Otherwise it writes nothing. A GET with no privacy signal writes no cookies. The visit hook is not called while a signal is present, so an existing `kf_vid` is not recorded. The banner reads the GET body. It never writes `kf_vid`. If the GET fails or 404s, it falls back to `kf_consent`.

| Situation                               | `choice`           | `essential` | `analytics` | `privacySignal` |
| --------------------------------------- | ------------------ | ----------- | ----------- | --------------- |
| No decision, no signal                  | `null`             | `true`      | `false`     | `null`          |
| No decision, `Sec-GPC: 1`               | `null`             | `true`      | `false`     | `"gpc"`         |
| No decision, `DNT: 1`                   | `null`             | `true`      | `false`     | `"dnt"`         |
| Essential only                          | `"essential_only"` | `true`      | `false`     | `null`          |
| Reject all                              | `"reject_all"`     | `true`      | `false`     | `null`          |
| Accept all, no signal                   | `"accept_all"`     | `true`      | `true`      | `null`          |
| Accept all on GET or POST, `Sec-GPC: 1` | `"essential_only"` | `true`      | `false`     | `"gpc"`         |
| Accept all on GET or POST, `DNT: 1`     | `"essential_only"` | `true`      | `false`     | `"dnt"`         |
| Accept all on GET or POST, both signals | `"essential_only"` | `true`      | `false`     | `"gpc"`         |

`version` is a number. On a decision it is the version stored in the cookie. When `choice` is `null` it is the current policy version a new POST would store. `timestamp` is an ISO-8601 UTC string (`Date.toISOString()`) when a decision is stored, and `null` when `choice` is `null`. Show the banner when `choice` is `null`.

### `POST /api/consent`

This is the body the banner sends:

```http
POST /api/consent HTTP/1.1
Content-Type: application/json

{"choice":"accept_all","version":1}
```

`choice` is `accept_all`, `essential_only`, or `reject_all`. The old names `all`, `essential`, and `reject` are accepted and stored as the canonical names. `version` is optional. Clients should send `1` or omit it. A missing version is stored as `1`. POST rejects a `version` other than `1` with `400` and no `Set-Cookie`. No other properties. `Content-Type` must be `application/json` (a `charset` parameter is fine).

Accept all, no privacy signal. `kf_consent` and `kf_vid` are both set. On http, `kf_consent` has no `Secure` flag. `kf_vid` is always `Secure` and `HttpOnly`.

```json
{
  "choice": "accept_all",
  "essential": true,
  "analytics": true,
  "version": 1,
  "timestamp": "2026-10-27T10:45:00.000Z",
  "privacySignal": null
}
```

The visitor id is only in the `kf_vid` `Set-Cookie` header. Essential only, and reject all, use the same shape with `analytics: false` and `privacySignal: null`. Reject:

```json
{
  "choice": "reject_all",
  "essential": true,
  "analytics": false,
  "version": 1,
  "timestamp": "2026-10-27T10:45:00.000Z",
  "privacySignal": null
}
```

Those responses set `kf_consent` and expire `kf_vid`.

**GPC / DNT.** `Sec-GPC: 1` or `DNT: 1` on a POST of `accept_all` (or the alias `all`) is stored as `essential_only`, even though the visitor pressed Accept all. The banner stores that returned choice, not the button. GET of a stored `accept_all` reports the same `choice`, `analytics: false`, and the same `privacySignal`, and rewrites `kf_consent` to `essential_only` with the same version and a fresh timestamp. An existing `kf_vid` is expired on that GET. GET sends a `Set-Cookie` only for a stored `accept_all` or an existing `kf_vid`. `kf_vid` is not set on the POST, an existing one is expired, and neither response body contains it. The visit hook is not called on either request while the signal is present. A later request without the signal does not turn analytics back on after the choice has been stored as `essential_only`; the visitor has to POST `accept_all` again.

```json
{
  "choice": "essential_only",
  "essential": true,
  "analytics": false,
  "version": 1,
  "timestamp": "2026-10-27T10:45:00.000Z",
  "privacySignal": "gpc"
}
```

`privacySignal` is `"dnt"` when `DNT: 1` is the only signal. The banner shows a note when `privacySignal` is `"gpc"` or `"dnt"`.

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

Invalid input is `400` with `{ "detail": "..." }` and no `Set-Cookie`. That includes a missing or non-JSON content type, a non-object body, any property other than `choice` and `version`, and a choice outside the six accepted strings. POST rejects a `version` other than `1` with `400`. Clients should send `1` or omit it. Anything other than `GET` or `POST` is `405` with `Allow: GET, POST`. `Sec-Fetch-Site: cross-site` is `403`. A failed handler is `500` with `{ "detail": "Consent could not be saved." }` and no cookies. Every one of those responses is `Cache-Control: private, no-store`.

### `GET /api/consent`

No request body. Does not call the visit hook. A GET with no privacy signal sends no `Set-Cookie` and does not renew `Max-Age`. Under `Sec-GPC: 1` or `DNT: 1`, GET expires an existing `kf_vid` and, when the stored choice is `accept_all`, rewrites `kf_consent` to `essential_only` (same version, fresh timestamp). It emits `Set-Cookie` only for those changes. The response stays `Cache-Control: private, no-store`. The banner calls this endpoint for its state and reads the JSON body. It falls back to the `kf_consent` cookie if the GET fails or returns 404. Alias choice names in an old cookie are returned as the canonical names.

No decision (missing cookie, malformed cookie, or a policy version other than the current one):

```json
{
  "choice": null,
  "essential": true,
  "analytics": false,
  "version": 1,
  "timestamp": null,
  "privacySignal": null
}
```

The same GET with `Sec-GPC: 1` or `DNT: 1` still has `choice: null`. It writes nothing when `kf_vid` is absent. If `kf_vid` is present, that GET expires it and still does not record a visit. `privacySignal` is `"gpc"` or `"dnt"`.

Stored essential choice:

```json
{
  "choice": "essential_only",
  "essential": true,
  "analytics": false,
  "version": 1,
  "timestamp": "2026-10-27T10:45:00.000Z",
  "privacySignal": null
}
```

Stored accept-all, and the request has no GPC or DNT. GET does not return the visitor id and will not mint one.

```json
{
  "choice": "accept_all",
  "essential": true,
  "analytics": true,
  "version": 1,
  "timestamp": "2026-10-27T10:45:00.000Z",
  "privacySignal": null
}
```

Stored accept-all while `Sec-GPC: 1` or `DNT: 1` is set. GET reports `essential_only`, not the stored `accept_all`. Analytics is off. `privacySignal` is `"gpc"` or `"dnt"`. GET rewrites `kf_consent` to `essential_only` with the same version and a fresh timestamp, and expires `kf_vid` when that cookie is present. The JSON does not contain the id. The `timestamp` below is that fresh value.

```json
{
  "choice": "essential_only",
  "essential": true,
  "analytics": false,
  "version": 1,
  "timestamp": "2026-10-27T10:45:00.000Z",
  "privacySignal": "gpc"
}
```

```javascript
const state = await fetch("/api/consent", { credentials: "same-origin" }).then((response) =>
  response.json(),
);
if (state.choice === null) {
  // show the banner
}
if (state.privacySignal === "gpc" || state.privacySignal === "dnt") {
  // the banner shows a note that the browser signal was honoured
}
```

The banner calls this GET on load. A returned choice is what it stores. `choice: null` means there is no decision yet when no current cookie exists. If the GET fails or returns 404, the banner keeps using `kf_consent`.

## Visit recording

`server/visit-record.mjs` exports `recordConsentedVisit`. It is a no-op. `handleConsent` calls it only after a POST has recorded `accept_all`, with `{ visitorId, timestamp, version }` on the server and nothing else. That id is not copied into the HTTP body. The hook is not called for `essential_only`, `reject_all`, a GPC or DNT downgrade, a GET, or a rejected body. If the hook throws, the consent response is still returned and the cookies are still set.

A later change can write a visit from that function. The write needs its own limited database role. The API role on Vercel is read-only. This change adds no database credentials, tables, or connection strings. Do not point the hook at the read-only API role.
