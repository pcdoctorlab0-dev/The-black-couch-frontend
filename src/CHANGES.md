# What changed and why

## The core fix
`App.jsx` had two unconnected store implementations: a polished but
client-side-only Store/Cart (no login, no real order, "Submit order
enquiry" did nothing), and a backend-wired one (`Products.jsx`,
`MyOrders.jsx`, `AdminOrders.jsx`, `Login.jsx`) that wasn't routed to at
all. `/store` and `/cart` now point at the real, backend-connected flow
(`pages/Store.jsx`), and the local demo catalogue + `siteData` products
are gone from `App.jsx` — episodes, shows, guests, about, contact still
use `siteData.js` as before, since those don't need a backend.

## New: `lib/CartContext.jsx`
Cart state moved out of `App.jsx` local state into context, same pattern
as the existing `AuthContext`. This is what lets the header's bag icon
show a live count without every page needing it passed as a prop.

## New pages
- **`pages/NotFound.jsx`** — the wildcard route silently redirected lost
  visitors home before; now it says so and gives them a way back.
- **`pages/ForgotPassword.jsx`** — Login had no recovery path. **Needs a
  matching `api.requestPasswordReset(email)` method and backend endpoint**
  — noted in a comment in the file. Have it always return success
  regardless of whether the email exists, same reasoning as login's
  generic error message.
- **`pages/HowToOrder.jsx`** — proof-of-payment is not how people expect
  checkout to work, so a plain-language walkthrough (linked from the
  footer) is worth having before someone abandons an order confused.
- **`pages/admin/AdminDashboard.jsx`** — `/admin` used to drop straight
  into the raw order list. Now it's a small stats overview (pending /
  approved / rejected / approved revenue, computed client-side from the
  existing `adminOrders('')` call) with a link through to the order list
  at `/admin/orders`.

## Enhanced existing pages
- `Login.jsx` / `Register.jsx` — restyled to match the site (PageIntro,
  same `input`/`button`/`form` classes), added the login↔register cross-
  link and a forgot-password link. Login also now respects a
  `redirectTo` passed via router state, so checking out while logged out
  sends you back to `/store` after logging in instead of to the homepage.
- `MyOrders.jsx` — restyled, added a colored status badge instead of
  plain text.
- `AdminOrders.jsx` — restyled, added a running count + total for the
  current filter.

## Not touched
`lib/api.js`, `lib/AuthContext.jsx`, `siteData.js`, `styles.css` weren't
included in what was shared, so nothing here invents their contents —
everything above calls the same `api.*` methods already used by the
original files, with the one addition (`requestPasswordReset`) flagged
above.
