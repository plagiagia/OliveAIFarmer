import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

// Every request Next.js can turn into a React render must pass through this
// middleware. The root layout renders <SignedIn>/<SignedOut>, and pages call
// auth() directly; auth() throws when clerkMiddleware() did not run for the
// request. That includes /_not-found, which Next renders for any URL that
// matches no route — so "the file does not exist" is not a reason to skip.
//
// Only Next's own build output is excluded. Do NOT reintroduce an
// extension-based "skip static files" pattern: the previous matcher spelled
// the dot as "\." inside an ordinary string literal, so the escape was eaten
// before the regex ever saw it and the dot matched *any* character. Any path
// containing a substring like "js", "png", "css" or "ico" then bypassed the
// middleware and returned 500 instead of rendering — including farm ids such
// as cmtie911e000110g8y9e8ajs3. src/middleware.test.ts locks this down.
export const config = {
  matcher: ["/((?!_next).*)", "/(api|trpc)(.*)"],
};
