// A tiny in-browser fake backend so the UI runs without Spring Boot.
// Data is stored in localStorage under "ct_mock_db".
import { calcCo2 } from '../data/categories';

const DB_KEY = 'ct_mock_db';
const MOCK_OTP = '123456';

const load = () =>
  JSON.parse(localStorage.getItem(DB_KEY) || '{"users":[],"activities":[],"nextId":1}');
const save = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db));

const publicUser = (u) => ({
  id: u.id,
  username: u.username,
  email: u.email,
  preferredUnits: u.preferredUnits,
  goalVisibility: u.goalVisibility,
  leaderboardOptIn: u.leaderboardOptIn,
});

const ok = (config, data, status = 200) =>
  Promise.resolve({ data, status, statusText: 'OK', headers: {}, config });

const fail = (config, status, message) =>
  Promise.reject({ response: { status, data: { message } }, config, message });

export default function mockAdapter(config) {
  const db = load();
  const method = (config.method || 'get').toLowerCase();
  const url = config.url.replace(config.baseURL || '', '');
  const body = config.data ? JSON.parse(config.data) : {};
  const params = config.params || {};

  const authHeader = config.headers?.Authorization || config.headers?.get?.('Authorization');
  const username = authHeader?.startsWith('Bearer mock-token-')
    ? authHeader.replace('Bearer mock-token-', '')
    : null;
  const me = username ? db.users.find((u) => u.username === username) : null;
  const needAuth = () => (me ? null : fail(config, 401, 'Unauthorized'));

  // ---- AUTH ----
  if (method === 'post' && url === '/api/auth/register') {
    if (db.users.some((u) => u.username === body.username))
      return fail(config, 409, 'Username already taken');
    if (db.users.some((u) => u.email === body.email))
      return fail(config, 409, 'Email already registered');
    const user = {
      id: db.nextId++,
      username: body.username,
      email: body.email,
      password: body.password,
      preferredUnits: 'metric',
      goalVisibility: true,
      leaderboardOptIn: true,
    };
    db.users.push(user);
    save(db);
    return ok(config, { token: `mock-token-${user.username}`, user: publicUser(user) }, 201);
  }

  if (method === 'post' && url === '/api/auth/login') {
    const u = db.users.find((x) => x.username === body.username && x.password === body.password);
    if (!u) return fail(config, 400, 'Invalid username or password');
    return ok(config, { token: `mock-token-${u.username}`, user: publicUser(u) });
  }

  if (method === 'post' && url === '/api/auth/forgot-password') {
    const u = db.users.find((x) => x.email === body.email);
    if (!u) return fail(config, 404, 'No account with that email');
    return ok(config, { message: `Mock mode: your OTP is ${MOCK_OTP}` });
  }

  if (method === 'post' && url === '/api/auth/verify-otp') {
    if (body.otp !== MOCK_OTP) return fail(config, 400, 'Invalid OTP');
    return ok(config, { resetToken: `reset::${body.email}` });
  }

  if (method === 'post' && url === '/api/auth/reset-password') {
    const email = (body.resetToken || '').split('::')[1];
    const u = db.users.find((x) => x.email === email);
    if (!u) return fail(config, 400, 'Invalid reset token');
    u.password = body.newPassword;
    save(db);
    return ok(config, { message: 'Password reset successful' });
  }

  // ---- USERS ----
  if (url === '/api/users/me') {
    const denied = needAuth();
    if (denied) return denied;
    if (method === 'get') return ok(config, publicUser(me));
    if (method === 'put') {
      Object.assign(me, {
        username: body.username ?? me.username,
        email: body.email ?? me.email,
        preferredUnits: body.preferredUnits ?? me.preferredUnits,
        goalVisibility: body.goalVisibility ?? me.goalVisibility,
        leaderboardOptIn: body.leaderboardOptIn ?? me.leaderboardOptIn,
      });
      save(db);
      return ok(config, publicUser(me));
    }
  }

  if (method === 'patch' && url === '/api/users/me/visibility') {
    const denied = needAuth();
    if (denied) return denied;
    if (params.goalVisibility !== undefined) me.goalVisibility = params.goalVisibility === true || params.goalVisibility === 'true';
    if (params.leaderboardOptIn !== undefined) me.leaderboardOptIn = params.leaderboardOptIn === true || params.leaderboardOptIn === 'true';
    save(db);
    return ok(config, publicUser(me));
  }

  // ---- ACTIVITIES ----
  if (method === 'post' && url === '/api/activities') {
    const denied = needAuth();
    if (denied) return denied;
    const a = {
      id: db.nextId++,
      userId: me.id,
      category: body.category,
      activityType: body.activityType,
      quantity: body.quantity,
      unit: body.unit,
      logDate: body.logDate,
      notes: body.notes,
      co2eKg: +calcCo2(body.category, body.activityType, body.quantity, body.unit).toFixed(3),
    };
    db.activities.push(a);
    save(db);
    return ok(config, a, 201);
  }

  if (method === 'get' && url === '/api/activities') {
    const denied = needAuth();
    if (denied) return denied;
    let list = db.activities.filter((a) => a.userId === me.id);
    if (params.category) list = list.filter((a) => a.category === params.category);
    if (params.from) list = list.filter((a) => a.logDate >= params.from);
    if (params.to) list = list.filter((a) => a.logDate <= params.to);
    list.sort((a, b) => b.logDate.localeCompare(a.logDate) || b.id - a.id);
    const size = Number(params.size) || 20;
    const page = Number(params.page) || 0;
    const totalPages = Math.max(1, Math.ceil(list.length / size));
    return ok(config, {
      content: list.slice(page * size, page * size + size),
      number: page,
      size,
      totalElements: list.length,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1,
    });
  }

  const m = url.match(/^\/api\/activities\/(\d+)$/);
  if (method === 'get' && m) {
    const denied = needAuth();
    if (denied) return denied;
    const a = db.activities.find((x) => x.id === Number(m[1]) && x.userId === me.id);
    return a ? ok(config, a) : fail(config, 404, 'Activity not found');
  }

  return fail(config, 404, `Mock: no route for ${method.toUpperCase()} ${url}`);
}
