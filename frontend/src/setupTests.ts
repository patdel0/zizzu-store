import '@testing-library/jest-dom/vitest';

import { server } from '../tests/msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

vi.stubGlobal('cookieStore', { get: vi.fn().mockResolvedValue({ value: 'test-token' }) });
