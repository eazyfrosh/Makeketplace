/** Keep post-login navigation on this site, including links with a query or hash. */
export function authDestination(search: string) {
  const next = new URLSearchParams(search).get("next");
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/dashboard";
  if (next.startsWith("/auth/login") || next.startsWith("/auth/signup")) return "/dashboard";
  return next;
}
