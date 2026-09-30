import crypto from 'crypto';
export function randomCode(){const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let s='';for(let i=0;i<8;i++)s+=chars[crypto.randomInt(chars.length)];return s.slice(0,4)+'-'+s.slice(4)}
export function hashCode(v:string){return crypto.createHash('sha256').update(v).digest('hex')}
export function signSession(){const payload=Buffer.from(JSON.stringify({iat:Date.now()})).toString('base64url');const sig=crypto.createHmac('sha256',process.env.ADMIN_SESSION_SECRET!).update(payload).digest('base64url');return payload+'.'+sig}
export function validSession(v:string|undefined){if(!v||!process.env.ADMIN_SESSION_SECRET)return false;const [p,s]=v.split('.');if(!p||!s)return false;const expected=crypto.createHmac('sha256',process.env.ADMIN_SESSION_SECRET).update(p).digest('base64url');return crypto.timingSafeEqual(Buffer.from(s),Buffer.from(expected))}
