const test = require('node:test'), assert = require('node:assert'), app = require('../server');
test('GET /health returns ok', async () => {
  const s = app.listen(0); const r = await fetch(`http://localhost:${s.address().port}/health`);
  assert.strictEqual((await r.json()).status, 'ok'); s.close();
});
