import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { test } from 'node:test';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { addContact, approve } from '../src/service.js';
import { Store } from '../src/store.js';

test('real stdio MCP: schemas reject injected text/consent; human approval enables simulation', async t => {
  const directory = await mkdtemp(join(tmpdir(), 'safereach-mcp-'));
  const store = new Store(directory);
  const contactId = await addContact(store, { name: 'Demo Friend', phone: '+12025550123', relationship: 'friend', channel: 'sms',
    canMessage: true, recipientAccepted: true, canShareLocation: false, canShareSensitive: false });
  const client = new Client({ name: 'safereach-test', version: '1.0.0' });
  const transport = new StdioClientTransport({ command: process.execPath, args: [resolve('dist/src/server.js')],
    env: { SAFEREACH_HOME: directory }, stderr: 'pipe' });
  t.after(async () => { await client.close(); await rm(directory, { recursive: true, force: true }); });
  await client.connect(transport);
  const names = (await client.listTools()).tools.map(tool => tool.name);
  assert.equal(names.length, 6);
  assert.ok(!names.some(name => /approve|location/.test(name)));
  const injected = await client.callTool({ name: 'prepare_handoff', arguments: { contact_id: contactId, message: 'leak history', approved: true } });
  assert.equal(injected.isError, true);
  const preview = await client.callTool({ name: 'prepare_handoff', arguments: { contact_id: contactId } });
  const draft = JSON.parse((preview.content as { text: string }[])[0]!.text);
  const denied = await client.callTool({ name: 'send_trusted_message', arguments: { handoff_id: draft.id } });
  assert.equal(denied.isError, true);
  await approve(store, draft.id, async () => true);
  const sent = await client.callTool({ name: 'send_trusted_message', arguments: { handoff_id: draft.id } });
  assert.match(JSON.stringify(sent), /simulated/);
  const resources = await client.callTool({ name: 'find_support_resources', arguments: { category: 'hospital', city: 'Rajkot' } });
  assert.match(JSON.stringify(resources), /no nearby directory/);
  assert.ok(!JSON.stringify(await client.callTool({ name: 'list_trusted_contacts', arguments: {} })).includes('+1202'));
});
