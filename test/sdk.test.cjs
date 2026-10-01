const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { KambaSMS, KambaValidationError, KambaAPIError } = require('../dist');
const originalFetch = global.fetch;
afterEach(() => { global.fetch = originalFetch; });
const client = (options = {}) => new KambaSMS({ apiKey: 'test-key', ...options });
function mock(body = {}, status = 200, headers = {}) {
  const calls = [];
  global.fetch = async (url, init) => {
    calls.push({ url, ...init, body: init.body ? JSON.parse(init.body) : undefined });
    return new Response(JSON.stringify(body), { status, headers });
  };
  return calls;
}

test('SMS maps Telegram fields and per-request headers', async () => {
  const response = { success: true, message_id: 'sms-1', channel: 'telegram' };
  const calls = mock(response);
  assert.deepEqual(await client({ baseUrl: 'http://localhost:3001///' }).sms.send({
    to: '+244923456789', text: 'Ola', senderId: 'KAMBA', telegramChatId: '123', telegramFallback: true,
  }, { idempotencyKey: 'order:123', requestId: 'request-123' }), response);
  assert.equal(calls[0].url, 'http://localhost:3001/messages/send');
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].headers.get('x-api-key'), 'test-key');
  assert.equal(calls[0].headers.get('Idempotency-Key'), 'order:123');
  assert.equal(calls[0].headers.get('X-Request-Id'), 'request-123');
  assert.deepEqual(calls[0].body, { to: '+244923456789', text: 'Ola', sender_id: 'KAMBA', telegram_chat_id: '123', telegram_fallback: true });
});

test('invalid SMS, bulk, dates, OTP and idempotency never reach the API', async () => {
  const calls = mock();
  const sdk = client();
  const valid = { to: '+244923456789', text: 'Ola' };
  for (const params of [{ ...valid, to: '923456789' }, { ...valid, text: '' },
    { ...valid, text: 'https://example.com' }, { ...valid, text: '😀' },
    { ...valid, text: 'a'.repeat(161) }, { ...valid, telegramFallback: true }]) {
    await assert.rejects(sdk.sms.send(params), KambaValidationError);
  }
  await assert.rejects(sdk.sms.send(valid, { idempotencyKey: 'short' }), KambaValidationError);
  await assert.rejects(sdk.sms.sendBulk({ name: 'Job', senderId: 'KAMBA', text: 'Ola', recipients: [] }), KambaValidationError);
  for (const scheduledAt of ['bad', new Date(NaN), '2020-01-01']) {
    await assert.rejects(sdk.sms.schedule({ ...valid, senderId: 'KAMBA', scheduledAt }), KambaValidationError);
  }
  await assert.rejects(sdk.otp.verify({ phone: valid.to, code: '123' }), KambaValidationError);
  assert.equal(calls.length, 0);
});

test('bulk limit is decided by the account on the backend', async () => {
  const calls = mock({ success: true, job_id: 'job', total: 1001 });
  await client().sms.sendBulk({ name: 'Job', senderId: 'KAMBA', text: 'Ola',
    recipients: Array.from({ length: 1001 }, (_, i) => `+2449${String(i).padStart(8, '0')}`) });
  assert.equal(calls[0].body.recipients.length, 1001);
});

test('scheduling serializes ISO dates and exposes list, detail and cancellation', async () => {
  const calls = mock();
  const sdk = client();
  const scheduledAt = new Date(Date.now() + 3600000);
  await sdk.sms.schedule({ to: '+244923456789', text: 'Ola', senderId: 'KAMBA', scheduledAt });
  assert.equal(calls[0].body.scheduled_at, scheduledAt.toISOString());
  await sdk.sms.listScheduled();
  await sdk.sms.cancelScheduled('id/with slash');
  await sdk.sms.listBulk();
  await sdk.sms.getBulk('job-id');
  assert.deepEqual(calls.map(c => new URL(c.url).pathname), [
    '/messages/schedule', '/messages/scheduled', '/messages/scheduled/id%2Fwith%20slash', '/messages/bulk', '/messages/bulk/job-id',
  ]);
  assert.equal(calls[2].method, 'DELETE');
});

test('history paginates locally over the returned records', async () => {
  const calls = mock(Array.from({ length: 25 }, (_, id) => ({ id })));
  const result = await client().account.getHistory({ limit: 10, page: 2 });
  assert.deepEqual(result.map(m => m.id), [10,11,12,13,14,15,16,17,18,19]);
  assert.equal(new URL(calls[0].url).search, '');
  await assert.rejects(client().account.getHistory({ limit: 0 }), KambaValidationError);
});

test('sandbox balance and HTTP 202 pending responses are preserved', async () => {
  const balance = { balance: null, environment: 'test', unlimited: true };
  mock(balance);
  assert.deepEqual(await client().account.getBalance(), balance);
  const pending = { error: 'Pendente', message_id: 'sms-1', reservation_id: 'reservation-1' };
  const calls = mock(pending, 202);
  assert.deepEqual(await client().sms.send({ to: '+244923456789', text: 'Ola' }), pending);
  assert.equal(calls.length, 1);
});

test('API errors preserve status, code, request ID, retry delay and body without retries', async () => {
  const body = { error: 'Limite', code: 'SANDBOX_DAILY_LIMIT', usage: { used: 100 } };
  const calls = mock(body, 429, { 'X-Request-Id': 'request-123', 'Retry-After': '60' });
  await assert.rejects(client().account.getBalance(), error => {
    assert.ok(error instanceof KambaAPIError);
    assert.equal(error.statusCode, 429);
    assert.equal(error.code, body.code);
    assert.equal(error.requestId, 'request-123');
    assert.equal(error.retryAfter, '60');
    assert.deepEqual(error.details, body);
    return true;
  });
  assert.equal(calls.length, 1);
});

test('non-JSON HTTP failure keeps HTTP status; empty 204 is accepted', async () => {
  global.fetch = async () => new Response('<html>Unavailable</html>', { status: 503 });
  await assert.rejects(client().account.getBalance(), error => error.statusCode === 503 && error.details.includes('Unavailable'));
  global.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await client().request('/empty'), undefined);
});

test('network failures, timeout and cancellation use status 0', async () => {
  global.fetch = async () => { throw new TypeError('Network down'); };
  await assert.rejects(client().account.getBalance(), error => error.statusCode === 0);
  global.fetch = async (_url, { signal }) => new Promise((_resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });
  await assert.rejects(client({ timeoutMs: 10 }).account.getBalance(), error => error.statusCode === 0);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(client().account.getBalance({ signal: controller.signal }), error => error.statusCode === 0);
});

test('OTP and Verify use their distinct backend contracts', async () => {
  const calls = mock();
  const sdk = client();
  await sdk.otp.send({ phone: '+244923456789', senderId: 'KAMBA', telegramFallback: true, telegramChatId: '123' });
  await sdk.otp.verify({ phone: '+244923456789', code: '123456' });
  await sdk.verify.start({ phone: '+244923456789', senderId: 'KAMBA', metadata: { order: 1 } });
  await sdk.verify.check({ verificationId: 'verify-1', code: '123456' });
  await sdk.verify.resend('verify-1', { idempotencyKey: 'resend-123' });
  await sdk.verify.get('verify-1');
  await sdk.verify.list();
  await sdk.verify.events('verify-1');
  await sdk.verify.stats({ days: 7, environment: 'test' });
  assert.equal(calls[0].body.telegram_fallback, true);
  assert.deepEqual(calls[2].body, { phone: '+244923456789', sender_id: 'KAMBA', metadata: { order: 1 } });
  assert.deepEqual(calls[3].body, { verification_id: 'verify-1', code: '123456' });
  assert.deepEqual(calls[4].body, { verification_id: 'verify-1' });
  assert.deepEqual(calls.map(c => new URL(c.url).pathname), [
    '/otp/send', '/otp/verify', '/verify/start', '/verify/check', '/verify/resend', '/verify/verify-1', '/verify', '/verify/events', '/verify/stats',
  ]);
  assert.equal(new URL(calls[8].url).searchParams.get('environment'), 'test');
});

test('Lookup accepts local numbers and enforces its own 500-number limit', async () => {
  const calls = mock();
  await client().lookup.lookup('923 456 789');
  await client().lookup.bulk(['923456789', '+244923456789']);
  assert.deepEqual(calls[0].body, { phone: '923 456 789' });
  assert.equal(new URL(calls[1].url).pathname, '/lookup/bulk');
  await assert.rejects(client().lookup.bulk([]), KambaValidationError);
  await assert.rejects(client().lookup.bulk(Array(501).fill('923456789')), KambaValidationError);
});

test('account stats and usage endpoints', async () => {
  const calls = mock();
  await client().account.getStats();
  await client().account.getUsage();
  assert.deepEqual(calls.map(c => new URL(c.url).pathname), ['/messages/stats', '/usage/overview']);
});

test('Notify maps templates, rendering, sending and deliveries', async () => {
  const calls = mock({ success: true }); const sdk = client();
  await sdk.notify.createTemplate({ key: 'payment_due', name: 'Pagamento', body: 'Olá {{name}}' });
  await sdk.notify.listTemplates();
  await sdk.notify.render({ templateKey: 'payment_due', variables: { name: 'Ana' } });
  await sdk.notify.send({ to: '+244923456789', templateKey: 'payment_due', variables: { name: 'Ana' }, senderId: 'KAMBA' }, { idempotencyKey: 'notify:123' });
  await sdk.notify.listDeliveries(); await sdk.notify.disableTemplate('template/1');
  assert.deepEqual(calls.map(c => new URL(c.url).pathname), ['/notify/templates', '/notify/templates', '/notify/render', '/notify/send', '/notify/deliveries', '/notify/templates/template%2F1']);
  assert.deepEqual(calls[3].body, { to: '+244923456789', template_key: 'payment_due', variables: { name: 'Ana' }, sender_id: 'KAMBA' });
  assert.equal(calls[3].headers.get('Idempotency-Key'), 'notify:123');
});

test('Email maps domains, unit sending, templates and bulk', async () => {
  const calls = mock({ success: true }); const sdk = client();
  await sdk.email.overview(); await sdk.email.createDomain('Example.AO'); await sdk.email.verifyDomain('domain-1');
  await sdk.email.send({ to: 'ana@example.com', domainId: 'domain-1', fromLocal: 'alertas', subject: 'Confirmação', text: 'Pedido recebido.' }, { idempotencyKey: 'email:123' });
  await sdk.email.createTemplate({ key: 'receipt', name: 'Recibo', subject: 'Recibo {{id}}', html: '<p>{{id}}</p>' });
  await sdk.email.renderTemplate('template-1', { id: 123 });
  await sdk.email.sendBulk({ domainId: 'domain-1', fromLocal: 'alertas', templateId: 'template-1', recipients: [{ email: 'ana@example.com', variables: { id: 123 } }] }, { idempotencyKey: 'bulkmail:123' });
  await sdk.email.getBulk('job-1'); await sdk.email.cancelBulk('job-1');
  assert.deepEqual(calls.map(c => new URL(c.url).pathname), ['/email/overview', '/email/domains', '/email/domains/domain-1/verify', '/email/send', '/email/templates', '/email/templates/template-1/render', '/email/bulk', '/email/bulk/job-1', '/email/bulk/job-1/cancel']);
  assert.equal(calls[1].body.domain, 'example.ao'); assert.equal(calls[3].body.from_local, 'alertas');
  assert.equal(calls[6].body.template_id, 'template-1');
});

test('Transactions maps templates and idempotent events', async () => {
  const calls = mock({ status: 'completed' }); const sdk = client();
  await sdk.transactions.overview();
  await sdk.transactions.createTemplate({ key: 'meeting_notice', eventType: 'meeting.scheduled', name: 'Reunião', channels: ['sms', 'email'], smsBody: 'Reunião {{date}}', emailSubject: 'Reunião', emailHtml: '<p>{{date}}</p>', domainId: 'domain-1', fromLocal: 'alertas' });
  await sdk.transactions.setTemplateActive('template-1', false);
  await sdk.transactions.sendEvent({ event: 'meeting.scheduled', templateKey: 'meeting_notice', externalReference: 'meeting-123', customer: { phone: '+244923456789', email: 'ana@example.com' }, data: { date: '10/10' }, channels: ['sms', 'email'] }, { idempotencyKey: 'transaction:123' });
  assert.deepEqual(calls.map(c => new URL(c.url).pathname), ['/transactions/overview', '/transactions/templates', '/transactions/templates/template-1', '/transactions/events']);
  assert.equal(calls[1].body.event_type, 'meeting.scheduled'); assert.equal(calls[3].body.external_reference, 'meeting-123');
});

test('new resources reject invalid input before HTTP', async () => {
  const calls = mock(); const sdk = client();
  await assert.rejects(sdk.notify.send({ to: '923456789', templateKey: 'notice', variables: {} }), KambaValidationError);
  await assert.rejects(sdk.email.send({ to: 'invalid', domainId: 'd', fromLocal: 'alerts', subject: 'Hello', text: 'Hi' }), KambaValidationError);
  await assert.rejects(sdk.email.sendBulk({ domainId: 'd', fromLocal: 'alerts', subject: 'Hello', text: 'Hi', recipients: [] }), KambaValidationError);
  await assert.rejects(sdk.transactions.createTemplate({ key: 'x', eventType: 'order.paid', name: 'Order', channels: ['sms'], smsBody: 'Paid' }), KambaValidationError);
  assert.equal(calls.length, 0);
});
