import test from "node:test";
import assert from "node:assert/strict";
import { sessionCookieOptions, isCurrentSessionUnauthorized } from "../../storefront/utils/auth-session";

test("customer session cookie supports browser persistence and payment redirects", () => {
  const local = sessionCookieOptions("http:");
  assert.equal(local.httpOnly, false, "Client Bearer-token login must be able to write the cookie");
  assert.equal(local.secure, false, "Local HTTP cannot persist a Secure cookie");
  assert.equal(local.path, "/");
  assert.equal(local.sameSite, "lax", "Return navigation from payment gateway keeps the session");
  assert.equal(local.maxAge, 2592000);
  assert.equal(sessionCookieOptions("https:").secure, true);
});

test("profile refresh preserves sessions on outages and stale authentication responses", () => {
  for (const error of [new Error("Network error"), { statusCode: 500 }, { response: { status: 502 } }, { status: 429 }, { status: 403 }, null]) {
    assert.equal(isCurrentSessionUnauthorized(error, "current", "current"), false);
  }
  assert.equal(isCurrentSessionUnauthorized({ response: { status: 401 } }, "old", "new"), false);
  assert.equal(isCurrentSessionUnauthorized({ status: 401 }, "", ""), false);
  assert.equal(isCurrentSessionUnauthorized({ response: { status: 401 } }, "current", "current"), true);
  assert.equal(isCurrentSessionUnauthorized({ statusCode: 401 }, "current", "current"), true);
});
