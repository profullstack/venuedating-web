/**
 * Test Configuration and Setup
 * Configures test environment, mocks, and utilities
 */

import { config } from 'dotenv';
import sinon from 'sinon';

// Load test environment variables
config({ path: '.env.test' });

// Global test setup
export const setupTestEnvironment = () => {
  // Mock environment variables
  process.env.NODE_ENV = 'test';
  process.env.SUPABASE_URL = 'https://test.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'test-anon-key';
  process.env.STRIPE_SECRET_KEY = 'sk_test_123';
  process.env.TWILIO_ACCOUNT_SID = 'test-twilio-sid';
  process.env.TWILIO_AUTH_TOKEN = 'test-twilio-token';
  process.env.TWILIO_VERIFY_SERVICE_SID = 'test-verify-sid';

  // Global mocks
  global.fetch = sinon.stub();
  global.console.log = sinon.stub();
  global.console.error = sinon.stub();
  global.console.warn = sinon.stub();
};

// Cleanup after tests
export const cleanupTestEnvironment = () => {
  sinon.restore();
  delete global.fetch;
};

// Mock Supabase client factory
export const createMockSupabaseClient = () => {
  return {
    auth: {
      signInWithPassword: sinon.stub(),
      signUp: sinon.stub(),
      signOut: sinon.stub(),
      getUser: sinon.stub(),
      resetPasswordForEmail: sinon.stub(),
      onAuthStateChange: sinon.stub()
    },
    from: sinon.stub().returnsThis(),
    select: sinon.stub().returnsThis(),
    insert: sinon.stub().returnsThis(),
    update: sinon.stub().returnsThis(),
    delete: sinon.stub().returnsThis(),
    eq: sinon.stub().returnsThis(),
    neq: sinon.stub().returnsThis(),
    gt: sinon.stub().returnsThis(),
    gte: sinon.stub().returnsThis(),
    lt: sinon.stub().returnsThis(),
    lte: sinon.stub().returnsThis(),
    like: sinon.stub().returnsThis(),
    ilike: sinon.stub().returnsThis(),
    in: sinon.stub().returnsThis(),
    order: sinon.stub().returnsThis(),
    limit: sinon.stub().returnsThis(),
    range: sinon.stub().returnsThis(),
    single: sinon.stub(),
    rpc: sinon.stub(),
    storage: {
      from: sinon.stub().returnsThis(),
      upload: sinon.stub(),
      download: sinon.stub(),
      remove: sinon.stub(),
      list: sinon.stub(),
      getPublicUrl: sinon.stub()
    }
  };
};

// Mock Stripe client factory
export const createMockStripeClient = () => {
  return {
    customers: {
      create: sinon.stub(),
      retrieve: sinon.stub(),
      update: sinon.stub(),
      list: sinon.stub()
    },
    paymentIntents: {
      create: sinon.stub(),
      confirm: sinon.stub(),
      retrieve: sinon.stub(),
      update: sinon.stub(),
      cancel: sinon.stub()
    },
    subscriptions: {
      create: sinon.stub(),
      retrieve: sinon.stub(),
      update: sinon.stub(),
      cancel: sinon.stub(),
      list: sinon.stub()
    },
    prices: {
      list: sinon.stub(),
      retrieve: sinon.stub()
    },
    products: {
      list: sinon.stub(),
      retrieve: sinon.stub()
    },
    webhooks: {
      constructEvent: sinon.stub()
    },
    paymentMethods: {
      attach: sinon.stub(),
      detach: sinon.stub(),
      list: sinon.stub()
    }
  };
};

// Mock Twilio client factory
export const createMockTwilioClient = () => {
  return {
    verify: {
      v2: {
        services: sinon.stub().returns({
          verifications: {
            create: sinon.stub(),
            fetch: sinon.stub()
          },
          verificationChecks: {
            create: sinon.stub()
          }
        })
      }
    },
    messages: {
      create: sinon.stub()
    }
  };
};

// Mock Hono context factory
export const createMockHonoContext = (overrides = {}) => {
  return {
    req: {
      param: sinon.stub(),
      query: sinon.stub(),
      json: sinon.stub(),
      text: sinon.stub(),
      header: sinon.stub(),
      method: 'GET',
      url: 'http://localhost:3000/test',
      ...overrides.req
    },
    json: sinon.stub(),
    text: sinon.stub(),
    html: sinon.stub(),
    status: sinon.stub().returnsThis(),
    header: sinon.stub().returnsThis(),
    get: sinon.stub(),
    set: sinon.stub(),
    ...overrides
  };
};

// Test data factories
export const createTestUser = (overrides = {}) => {
  return {
    id: 'user-test-123',
    email: 'test@example.com',
    name: 'Test User',
    age: 25,
    gender: 'male',
    interested_in: 'female',
    location: {
      lat: 37.7749,
      lng: -122.4194,
      city: 'San Francisco',
      state: 'CA'
    },
    photos: ['photo1.jpg'],
    interests: ['coffee', 'hiking'],
    bio: 'Test bio',
    verified: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  };
};

export const createTestVenue = (overrides = {}) => {
  return {
    id: 1,
    name: 'Test Bar',
    address: '123 Test St, San Francisco, CA',
    latitude: 37.7749,
    longitude: -122.4194,
    venue_type: 'bar',
    rating: 4.5,
    price_range: '$$',
    description: 'A great test bar',
    amenities: ['wifi', 'outdoor_seating'],
    hours: {
      monday: '5pm-2am',
      tuesday: '5pm-2am',
      wednesday: '5pm-2am',
      thursday: '5pm-2am',
      friday: '5pm-2am',
      saturday: '2pm-2am',
      sunday: '2pm-12am'
    },
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides
  };
};

export const createTestMatch = (overrides = {}) => {
  return {
    id: 'match-test-123',
    user1_id: 'user-123',
    user2_id: 'user-456',
    created_at: '2024-01-01T00:00:00Z',
    status: 'active',
    last_message_at: '2024-01-01T12:00:00Z',
    ...overrides
  };
};

// Assertion helpers
export const expectValidUser = (user) => {
  expect(user).to.have.property('id');
  expect(user).to.have.property('email');
  expect(user.email).to.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
  expect(user).to.have.property('created_at');
};

export const expectValidVenue = (venue) => {
  expect(venue).to.have.property('id');
  expect(venue).to.have.property('name');
  expect(venue).to.have.property('latitude');
  expect(venue).to.have.property('longitude');
  expect(venue.latitude).to.be.within(-90, 90);
  expect(venue.longitude).to.be.within(-180, 180);
};

export const expectValidMatch = (match) => {
  expect(match).to.have.property('id');
  expect(match).to.have.property('user1_id');
  expect(match).to.have.property('user2_id');
  expect(match).to.have.property('created_at');
  expect(match.user1_id).to.not.equal(match.user2_id);
};

// API response helpers
export const mockSuccessResponse = (data) => ({
  data,
  error: null,
  status: 200
});

export const mockErrorResponse = (message, code = 400) => ({
  data: null,
  error: { message, code },
  status: code
});

// Database helpers for integration tests
export const cleanupTestData = async (supabase) => {
  // Clean up test data in reverse dependency order
  await supabase.from('messages').delete().ilike('content', '%test%');
  await supabase.from('matches').delete().like('id', 'match-test-%');
  await supabase.from('swipes').delete().like('user_id', 'user-test-%');
  await supabase.from('profiles').delete().like('id', 'user-test-%');
  await supabase.from('venues').delete().ilike('name', '%test%');
};

// Time helpers
export const mockCurrentTime = (timestamp = '2024-01-15T12:00:00Z') => {
  const clock = sinon.useFakeTimers(new Date(timestamp));
  return clock;
};

export const restoreTime = (clock) => {
  clock.restore();
};

// File upload helpers for testing
export const createMockFile = (name = 'test.jpg', size = 1024, type = 'image/jpeg') => {
  return {
    name,
    size,
    type,
    lastModified: Date.now(),
    arrayBuffer: sinon.stub().resolves(new ArrayBuffer(size)),
    text: sinon.stub().resolves('mock file content'),
    stream: sinon.stub()
  };
};

// WebSocket helpers for real-time features
export const createMockWebSocket = () => {
  return {
    send: sinon.stub(),
    close: sinon.stub(),
    addEventListener: sinon.stub(),
    removeEventListener: sinon.stub(),
    readyState: 1, // OPEN
    CONNECTING: 0,
    OPEN: 1,
    CLOSING: 2,
    CLOSED: 3
  };
};
