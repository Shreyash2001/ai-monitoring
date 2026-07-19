import test from 'node:test';
import assert from 'node:assert';
import {
  sensorDataSubject,
  cctvFrameSubject,
  selectedModuleSubject,
  aiResponseSubject,
  loadingSubject,
  errorSubject,
  registerCaptureFrame,
  captureCurrentFrame,
  selectModule
} from '../src/store/streams.js';

test('selectModule updates selectedModuleSubject and resets aiResponse and error', () => {
  // Set initial state
  aiResponseSubject.next({ data: 'old response' });
  errorSubject.next('old error');
  
  selectModule('incident_response');

  assert.strictEqual(selectedModuleSubject.getValue(), 'incident_response');
  assert.strictEqual(aiResponseSubject.getValue(), null);
  assert.strictEqual(errorSubject.getValue(), null);
});

test('registerCaptureFrame and captureCurrentFrame lifecycle', () => {
  // Clean start
  cctvFrameSubject.next(null);
  
  // Register a mock capture function
  const mockFrame = 'base64_encoded_string';
  const mockCaptureFn = () => mockFrame;
  registerCaptureFrame(mockCaptureFn);

  // Capture frame should return the string and push to subject
  const result = captureCurrentFrame();
  assert.strictEqual(result, mockFrame);
  assert.strictEqual(cctvFrameSubject.getValue(), mockFrame);

  // Unregister function
  registerCaptureFrame(null);
  
  // Calling capture without function should just return last subject value
  const nextResult = captureCurrentFrame();
  assert.strictEqual(nextResult, mockFrame);
});

test('subjects have correct initial values', () => {
  assert.strictEqual(sensorDataSubject.getValue(), null);
  assert.strictEqual(loadingSubject.getValue(), false);
});
