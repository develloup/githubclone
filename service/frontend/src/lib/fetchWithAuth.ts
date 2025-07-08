let alreadyRedirected = false;

export async function fetchWithAuth(
  input: RequestInfo,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input, {
    credentials: "include",
    ...init,
  });

  const isLoginPage =
    typeof window !== "undefined" && window.location.pathname === "/login";

  if ((res.status === 401 || res.redirected) && !isLoginPage) {
    if (!alreadyRedirected && typeof window !== "undefined") {
      alreadyRedirected = true;
      window.location.href = "/login";
    }
    throw new Error("Not authorized - redirect to /login");
  }

  return res;
}
