import { clearSessionCookie } from "../lib/auth";

export async function onRequestPost(context: any) {
  const { request } = context;
  const url = new URL(request.url);
  const cookie = clearSessionCookie(url.protocol === "https:");
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", "Set-Cookie": cookie },
  });
}
