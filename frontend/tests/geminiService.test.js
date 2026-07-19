import test from 'node:test';
import assert from 'node:assert';
import { cleanAndParse } from '../src/services/geminiService.js';

test('cleanAndParse should parse valid JSON without markdown fences', () => {
  const raw = '{"status": "ok"}';
  const parsed = cleanAndParse(raw);
  assert.deepStrictEqual(parsed, { status: 'ok' });
});

test('cleanAndParse should remove ```json and ``` fences and parse successfully', () => {
  const raw = '```json\n{"status": "ok"}\n```';
  const parsed = cleanAndParse(raw);
  assert.deepStrictEqual(parsed, { status: 'ok' });
});

test('cleanAndParse should remove generic ``` fences', () => {
  const raw = '```\n{"status": "ok", "message": "hello"}\n```';
  const parsed = cleanAndParse(raw);
  assert.deepStrictEqual(parsed, { status: 'ok', message: 'hello' });
});

test('cleanAndParse should handle trailing commas in arrays', () => {
  const raw = '{ "items": [1, 2, 3,] }';
  const parsed = cleanAndParse(raw);
  assert.deepStrictEqual(parsed.items, [1, 2, 3]);
});

test('cleanAndParse should handle trailing commas in objects', () => {
  const raw = '{ "status": "ok", "foo": "bar", }';
  const parsed = cleanAndParse(raw);
  assert.deepStrictEqual(parsed, { status: 'ok', foo: 'bar' });
});
