import test from 'node:test';
import assert from 'node:assert';
import { cleanAndParse, buildPrompt } from '../src/services/geminiService.js';

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

test('cleanAndParse should handle missing or broken braces (simulated parsing errors will throw)', () => {
  const raw = '{ "status": "ok"';
  assert.throws(() => cleanAndParse(raw), SyntaxError);
});

test('buildPrompt returns correct string for crowd_density', () => {
  const sensorData = { gates: { gate1: 50 } };
  const prompt = buildPrompt('crowd_density', sensorData, 'check gate 1');
  assert.ok(prompt.includes('expert stadium crowd management analyst'));
  assert.ok(prompt.includes('"gate1": 50'));
  assert.ok(prompt.includes('check gate 1'));
});

test('buildPrompt returns correct string for incident_response', () => {
  const sensorData = { temp: 25 };
  const prompt = buildPrompt('incident_response', sensorData, 'fight in section 3');
  assert.ok(prompt.includes('expert stadium incident response coordinator'));
  assert.ok(prompt.includes('"temp": 25'));
  assert.ok(prompt.includes('fight in section 3'));
});

test('buildPrompt returns correct string for resource_optimizer', () => {
  const sensorData = null; // Should handle null
  const prompt = buildPrompt('resource_optimizer', sensorData, 'optimise now');
  assert.ok(prompt.includes('expert stadium operations resource optimiser'));
  assert.ok(prompt.includes('{}')); // stringified null/undefined defaults to {}
  // Note: resource_optimizer does not actively inject userInput into its prompt block
});

test('buildPrompt returns correct string for what_if', () => {
  const sensorData = { status: 'ok' };
  const prompt = buildPrompt('what_if', sensorData, 'what if it rains?');
  assert.ok(prompt.includes('expert stadium crowd simulation analyst'));
  assert.ok(prompt.includes('what if it rains?'));
});

test('buildPrompt returns correct string for communicator', () => {
  const sensorData = { status: 'ok' };
  const prompt = buildPrompt('communicator', sensorData, 'broadcast delay');
  assert.ok(prompt.includes('expert stadium communications officer'));
  assert.ok(prompt.includes('broadcast delay'));
});

test('buildPrompt returns correct string for debrief', () => {
  const sensorData = { status: 'ok' };
  const prompt = buildPrompt('debrief', sensorData, 'match end report');
  assert.ok(prompt.includes('expert stadium operations debrief analyst'));
  assert.ok(prompt.includes('match end report'));
});

test('buildPrompt returns fallback string for unknown mode', () => {
  const prompt = buildPrompt('unknown_mode', {a:1}, 'hello');
  assert.ok(prompt.includes('You are a stadium operations AI assistant.'));
  assert.ok(prompt.includes('hello'));
});
