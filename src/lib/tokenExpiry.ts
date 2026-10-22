/** JWT exp 仅用于提前结束本地会话；凭证真实性仍由服务端校验。 */
export function getTokenExpiresAt(token: string): number | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const payload: unknown = JSON.parse(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')));
    const exp = (payload as { exp?: unknown } | null)?.exp;
    return typeof exp === 'number' && Number.isFinite(exp) ? exp * 1000 : null;
  } catch {
    // 不透明 token 沿用服务端 401 判定。
    return null;
  }
}
