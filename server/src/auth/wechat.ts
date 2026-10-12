import crypto from 'crypto';

const APPID = process.env.WECHAT_APPID || '';
const SECRET = process.env.WECHAT_SECRET || '';
const JWT_SECRET = process.env.JWT_SECRET || 'change_me';

export interface WechatSession {
  openid: string;
  session_key: string;
}

/** 微信 jscode2session：用小程序 login 拿到的 code 换取 openid */
export async function code2Session(code: string): Promise<WechatSession> {
  const url =
    `https://api.weixin.qq.com/sns/jscode2session` +
    `?appid=${APPID}&secret=${SECRET}&js_code=${code}&grant_type=authorization_code`;
  const res = await fetch(url);
  const data = (await res.json()) as any;
  if (data.errcode) {
    throw new Error(`wechat login failed: ${data.errcode} ${data.errmsg}`);
  }
  return { openid: data.openid, session_key: data.session_key };
}

/** 用 openid 签发一个带过期时间的 HMAC token（轻量登录态，非标准 JWT） */
export function signToken(openid: string): string {
  const payload = Buffer.from(
    JSON.stringify({ openid, exp: Date.now() + 7 * 24 * 3600 * 1000 })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyToken(token: string): { openid: string } | null {
  try {
    const [payload, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('base64url');
    if (sig !== expected) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.exp < Date.now()) return null;
    return { openid: data.openid };
  } catch {
    return null;
  }
}

/** 从请求 Authorization 头解析 openid */
export function getOpenidFromReq(req: any): string | null {
  const auth = req?.headers?.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  const v = verifyToken(token);
  return v ? v.openid : null;
}
