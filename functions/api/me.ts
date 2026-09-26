import { getSecret, getSessionUser } from "../lib/auth";

// 返回当前登录用户信息（供前端展示用户名 / 判断是否管理员）
export async function onRequestGet(context: any) {
  const { request, env } = context;
  const secret = getSecret(env);

  if (!secret) {
    // 开放模式：无鉴权
    return new Response(JSON.stringify({ authenticated: false, open: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const user = await getSessionUser(request, secret);
  if (!user) {
    return new Response(JSON.stringify({ authenticated: false }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ authenticated: true, username: user.name, role: user.role, uid: user.uid }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
}
