import crypto from 'crypto';

const ADMIN_SESSION_TTL_MS = 8 * 60 * 60 * 1000;

export function randomCode() {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let value = '';
	for (let index = 0; index < 8; index++) {
		value += chars[crypto.randomInt(chars.length)];
	}
	return `${value.slice(0, 4)}-${value.slice(4)}`;
}

export function hashCode(value: string) {
	return crypto.createHash('sha256').update(value).digest('hex');
}

export function signSession() {
	const payload = Buffer.from(JSON.stringify({ iat: Date.now() })).toString('base64url');
	const signature = crypto
		.createHmac('sha256', process.env.ADMIN_SESSION_SECRET!)
		.update(payload)
		.digest('base64url');
	return `${payload}.${signature}`;
}

export function validSession(value: string | undefined) {
	if (!value || !process.env.ADMIN_SESSION_SECRET) return false;

	const [payload, signature, extra] = value.split('.');
	if (!payload || !signature || extra !== undefined) return false;

	const expected = crypto
		.createHmac('sha256', process.env.ADMIN_SESSION_SECRET)
		.update(payload)
		.digest();
	const actual = Buffer.from(signature, 'base64url');
	if (actual.length !== expected.length || !crypto.timingSafeEqual(actual, expected)) {
		return false;
	}

	try {
		const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
			iat?: unknown;
		};
		const issuedAt = session.iat;
		return (
			typeof issuedAt === 'number' &&
			Number.isSafeInteger(issuedAt) &&
			issuedAt <= Date.now() &&
			Date.now() - issuedAt < ADMIN_SESSION_TTL_MS
		);
	} catch {
		return false;
	}
}
