import assert from "node:assert/strict";
import {test} from "node:test";
import {authHref, safeNextPath} from "@/app/_lib/publicPaths";

// Where Prijava and Registracija go after logging in (?next=): only a page of this app, never another site, read the way
// the browser will read the address. The browser drops tabs and line breaks from an address and reads "\" as "/", so
// "/<tab>/evil.example" is "//evil.example", another site.

const BASE = "https://bela-liga.vercel.app";

// where the browser goes for `next` from a page of the app
const lands = (next: string) => new URL(next, BASE).origin;

test("a page of this app comes back as it is: its path, query and hash", () => {
  for (const next of ["/", "/ratings", "/burza/novi/dostupan", "/turniri/6?prijava=1", "/burza/12#broj", "/players?q=Ivi%C4%87"]) {
    assert.equal(safeNextPath(next), next);
  }
});

test("nothing, an empty value or an address that isn't a path gives no page", () => {
  for (const next of [null, undefined, "", "ratings", " /ratings", "https://evil.example/", "javascript:alert(1)", "?next=/"]) {
    assert.equal(safeNextPath(next), null, JSON.stringify(next));
  }
});

test("a path the browser reads as another site gives no page: //, \\, and a tab or line break among the slashes", () => {
  for (const next of [
    "//evil.example",
    "/\\evil.example",
    "/\t/evil.example",
    "/\n/evil.example",
    "/\r/evil.example",
    "/\t\\evil.example",
    "\t//evil.example",
    "//user@evil.example/x",
    // whatever host the guard reads a path against is no exception
    "//app.invalid/x",
    "/\\app.invalid",
    "/\t/a.invalid",
    "//user@b.invalid",
  ]) {
    assert.notEqual(lands(next), BASE, `${JSON.stringify(next)} is another site in the browser`);
    assert.equal(safeNextPath(next), null, JSON.stringify(next));
  }
});

test("whatever comes back stays on this app in the browser", () => {
  for (const next of ["/", "/turniri/6?prijava=1", "/\t/evil.example", "/%09/evil.example", "/a/../..//evil.example", "/.//evil.example", "//app.invalid/x", "/\\a.invalid", "//bela-liga.vercel.app/x"]) {
    const back = safeNextPath(next);
    if (back != null) assert.equal(lands(back), BASE, `${JSON.stringify(next)} → ${JSON.stringify(back)}`);
  }
});

test("Prijava and Registracija carry only such a page in ?next=, and none for Početna", () => {
  assert.equal(authHref("/login", "/burza/novi/dostupan"), "/login?next=%2Fburza%2Fnovi%2Fdostupan");
  assert.equal(authHref("/signup", "/turniri/6?prijava=1"), "/signup?next=%2Fturniri%2F6%3Fprijava%3D1");
  assert.equal(authHref("/login", "/"), "/login");
  assert.equal(authHref("/login", "/\t/evil.example"), "/login");
  assert.equal(authHref("/login", null), "/login");
});
