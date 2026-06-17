/**
 * API Step Definitions
 * Implements BDD steps for REST API testing scenarios
 */

import { Given, When, Then, DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '@hooks/world';
import { ApiHelper } from '@utils/api.helper';
import { Logger } from '@utils/logger';
import { AllureHelper } from '@utils/allure.helper';

const logger = new Logger('APISteps');
const allure = new AllureHelper();

// ============ BACKGROUND STEPS ============

Given('the API base URL is configured', async function (this: CustomWorld) {
  const baseUrl = this.config.apiBaseUrl;
  expect(baseUrl).toBeTruthy();
  logger.info(`API Base URL: ${baseUrl}`);
  this.setTestData('apiBaseUrl', baseUrl);
});

Given('I have a valid authentication token', async function (this: CustomWorld) {
  const api = new ApiHelper(this.config.apiBaseUrl);
  try {
    const response = await api.post('/auth/login', {
      username: this.config.username,
      password: this.config.password
    });
    const token = ((response.data as any)?.access_token) || 'mock-token-for-demo';
    this.setTestData('authToken', token);
    logger.info('Authentication token obtained');
    await allure.addStep('Obtained auth token', 'passed');
  } catch {
    // Use mock token for demo purposes when backend is not available
    this.setTestData('authToken', 'mock-bearer-token');
    logger.warn('Using mock token - backend not available');
  }
});

Given('I am authenticated as {string}', async function (this: CustomWorld, email: string) {
  const api = new ApiHelper(this.config.apiBaseUrl);
  try {
    const response = await api.post('/auth/login', {
      username: email,
      password: this.config.password
    });
    const token = ((response.data as any)?.access_token) || 'mock-token';
    this.setTestData('authToken', token);
    this.setTestData('currentUser', email);
    api.setAuthToken(token);
    this.setTestData('apiClient', api);
    logger.info(`Authenticated as: ${email}`);
  } catch {
    this.setTestData('authToken', 'mock-bearer-token');
    this.setTestData('currentUser', email);
    logger.warn(`Mock auth for: ${email}`);
  }
});

Given('I have an invalid authentication token', function (this: CustomWorld) {
  this.setTestData('authToken', 'invalid-token-xyz');
  logger.info('Set invalid auth token');
});

Given('I have a new user payload', function (this: CustomWorld) {
  const payload = {
    email: `testuser_${Date.now()}@example.com`,
    firstName: 'Test',
    lastName: 'User',
    role: 'viewer',
    password: 'TestPass@123'
  };
  this.setTestData('requestPayload', payload);
  logger.info('Created new user payload');
});

Given('an existing user with id {string}', function (this: CustomWorld, userId: string) {
  this.setTestData('userId', userId);
  logger.info(`Target user ID: ${userId}`);
});

// ============ WHEN STEPS ============

When(
  'I send a GET request to {string}',
  async function (this: CustomWorld, endpoint: string) {
    const api = new ApiHelper(this.config.apiBaseUrl);
    const token = this.getTestData('authToken') as string;
    if (token) api.setAuthToken(token);

    const startTime = Date.now();
    try {
      const response = await api.get(endpoint);
      const elapsed = Date.now() - startTime;

      this.setTestData('apiResponse', response);
      this.setTestData('responseTime', elapsed);
      this.setTestData('statusCode', response.status);

      logger.info(`GET ${endpoint} → ${response.status} (${elapsed}ms)`);
      await allure.addStep(`GET ${endpoint}`, 'passed');
    } catch (error: unknown) {
      const elapsed = Date.now() - startTime;
      const axiosError = error as { response?: { status: number; data: unknown } };
      const response = axiosError.response;

      this.setTestData('apiResponse', response);
      this.setTestData('responseTime', elapsed);
      this.setTestData('statusCode', response?.status);

      logger.warn(`GET ${endpoint} failed with ${response?.status}`);
    }
  }
);

When(
  'I send a POST request to {string} with:',
  async function (this: CustomWorld, endpoint: string, dataTable: DataTable) {
    const api = new ApiHelper(this.config.apiBaseUrl);
    const token = this.getTestData('authToken') as string;
    if (token) api.setAuthToken(token);

    const rowsHash = dataTable.rowsHash();
    const payload = Object.fromEntries(Object.entries(rowsHash));

    const startTime = Date.now();
    try {
      const response = await api.post(endpoint, payload);
      const elapsed = Date.now() - startTime;

      this.setTestData('apiResponse', response);
      this.setTestData('responseTime', elapsed);
      this.setTestData('statusCode', response.status);

      logger.info(`POST ${endpoint} → ${response.status} (${elapsed}ms)`);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data: unknown } };
      const response = axiosError.response;
      this.setTestData('apiResponse', response);
      this.setTestData('statusCode', response?.status);
    }
  }
);

When(
  'I send a POST request to {string} with the payload',
  async function (this: CustomWorld, endpoint: string) {
    const api = new ApiHelper(this.config.apiBaseUrl);
    const token = this.getTestData('authToken') as string;
    if (token) api.setAuthToken(token);

    const payload = this.getTestData('requestPayload') as Record<string, unknown>;

    try {
      const response = await api.post(endpoint, payload);
      this.setTestData('apiResponse', response);
      this.setTestData('statusCode', response.status);
      logger.info(`POST ${endpoint} → ${response.status}`);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data: unknown } };
      const response = axiosError.response;
      this.setTestData('apiResponse', response);
      this.setTestData('statusCode', response?.status);
    }
  }
);

When(
  'I send a POST request to {string} with invalid payload',
  async function (this: CustomWorld, endpoint: string) {
    const api = new ApiHelper(this.config.apiBaseUrl);
    const token = this.getTestData('authToken') as string;
    if (token) api.setAuthToken(token);

    const invalidPayload = { email: 'not-an-email', firstName: '' };

    try {
      const response = await api.post(endpoint, invalidPayload);
      this.setTestData('apiResponse', response);
      this.setTestData('statusCode', response.status);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data: unknown } };
      const response = axiosError.response;
      this.setTestData('apiResponse', response);
      this.setTestData('statusCode', response?.status);
    }
  }
);

When(
  'I send a PUT request to {string} with:',
  async function (this: CustomWorld, endpoint: string, dataTable: DataTable) {
    const api = new ApiHelper(this.config.apiBaseUrl);
    const token = this.getTestData('authToken') as string;
    if (token) api.setAuthToken(token);

    const rowsHash = dataTable.rowsHash();
    const payload = Object.fromEntries(Object.entries(rowsHash));

    try {
      const response = await api.put(endpoint, payload);
      this.setTestData('apiResponse', response);
      this.setTestData('statusCode', response.status);
      logger.info(`PUT ${endpoint} → ${response.status}`);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data: unknown } };
      const response = axiosError.response;
      this.setTestData('apiResponse', response);
      this.setTestData('statusCode', response?.status);
    }
  }
);

When(
  'I send a DELETE request to {string}',
  async function (this: CustomWorld, endpoint: string) {
    const api = new ApiHelper(this.config.apiBaseUrl);
    const token = this.getTestData('authToken') as string;
    if (token) api.setAuthToken(token);

    try {
      const response = await api.delete(endpoint);
      this.setTestData('apiResponse', response);
      this.setTestData('statusCode', response.status);
      logger.info(`DELETE ${endpoint} → ${response.status}`);
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number; data: unknown } };
      const response = axiosError.response;
      this.setTestData('apiResponse', response);
      this.setTestData('statusCode', response?.status);
    }
  }
);

// ============ THEN STEPS ============

Then(
  'the response status code should be {int}',
  function (this: CustomWorld, expectedStatus: number) {
    const actualStatus = this.getTestData('statusCode') as number;
    logger.info(`Asserting status: expected=${expectedStatus}, actual=${actualStatus}`);
    expect(actualStatus).toBe(expectedStatus);
  }
);

Then(
  'the response should contain {string}',
  function (this: CustomWorld, expectedText: string) {
    const response = this.getTestData('apiResponse') as { data: unknown };
    const responseStr = JSON.stringify(response?.data || '');
    expect(responseStr).toContain(expectedText);
    logger.info(`Response contains: "${expectedText}"`);
  }
);

Then(
  'the response body should match schema {string}',
  function (this: CustomWorld, schemaName: string) {
    const response = this.getTestData('apiResponse') as { data: Record<string, unknown> };
    const data = response?.data;

    // Schema validation per schema name
    const schemas: Record<string, string[]> = {
      'user-profile': ['id', 'email', 'firstName', 'lastName', 'role', 'createdAt'],
      'auth-response': ['access_token', 'token_type', 'expires_in'],
      'pagination': ['data', 'total', 'page', 'limit', 'totalPages']
    };

    const requiredFields = schemas[schemaName] || [];
    for (const field of requiredFields) {
      expect(data).toHaveProperty(field);
    }
    logger.info(`Schema "${schemaName}" validated`);
  }
);

Then(
  'the response field {string} should equal {string}',
  function (this: CustomWorld, fieldPath: string, expectedValue: string) {
    const response = this.getTestData('apiResponse') as { data: Record<string, unknown> };
    const data = response?.data;

    // Support dot notation for nested fields: "user.email"
    const fields = fieldPath.split('.');
    let value: unknown = data;
    for (const field of fields) {
      value = (value as Record<string, unknown>)?.[field];
    }

    expect(String(value)).toBe(expectedValue);
    logger.info(`Field "${fieldPath}" = "${expectedValue}" ✓`);
  }
);

Then(
  'the response should contain {string} items',
  function (this: CustomWorld, expectedCount: string) {
    const response = this.getTestData('apiResponse') as { data: { data?: unknown[] } | unknown[] };
    const data = response?.data;
    const items = Array.isArray(data) ? data : (data as { data?: unknown[] })?.data || [];
    expect(items.length).toBe(parseInt(expectedCount));
    logger.info(`Response contains ${items.length} items`);
  }
);

Then(
  'the response time should be less than {int} milliseconds',
  function (this: CustomWorld, maxMs: number) {
    const responseTime = this.getTestData('responseTime') as number;
    logger.info(`Response time: ${responseTime}ms (threshold: ${maxMs}ms)`);
    expect(responseTime).toBeLessThan(maxMs);
  }
);
