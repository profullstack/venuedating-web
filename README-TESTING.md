# BarCrush Web - Testing Guide

This document provides comprehensive information about the testing infrastructure for the BarCrush web application.

## 📋 Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Types](#test-types)
- [Writing Tests](#writing-tests)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

The BarCrush web application has a comprehensive testing suite that covers:

- **API Backend Tests**: Testing all REST API endpoints, services, and business logic
- **UI Frontend Tests**: Testing user interface components and interactions
- **Integration Tests**: End-to-end testing of complete user workflows
- **Unit Tests**: Testing individual functions and components in isolation

### Testing Stack

- **Test Framework**: [Mocha](https://mochajs.org/) - JavaScript test framework
- **Assertion Library**: [Chai](https://www.chaijs.com/) - BDD/TDD assertion library
- **Mocking**: [Sinon](https://sinonjs.org/) - Standalone test spies, stubs and mocks
- **DOM Testing**: [JSDOM](https://github.com/jsdom/jsdom) - DOM implementation for testing
- **Browser Testing**: [Puppeteer](https://pptr.dev/) - Headless Chrome automation

## 🏗️ Test Structure

```
barcrush-web/
├── test/                          # Backend API tests
│   ├── auth-routes.test.js        # Authentication endpoints
│   ├── venues-routes.test.js      # Venue management endpoints
│   ├── matching-routes.test.js    # Matching system endpoints
│   ├── stripe-payments.test.js    # Payment processing tests
│   ├── integration-tests.js       # End-to-end integration tests
│   └── test-config.js            # Test configuration and utilities
├── ui-tests/                      # Frontend UI tests
│   ├── auth-ui.test.js           # Authentication UI components
│   ├── discover-ui.test.js       # Discovery page components
│   └── location-button-test.js   # Location functionality tests
└── test-runner-comprehensive.js   # Main test runner script
```

## 🚀 Running Tests

### Quick Start

```bash
# Install test dependencies
npm install

# Run all tests
npm test

# Run specific test suites
npm run test:api        # API backend tests only
npm run test:ui         # UI frontend tests only
npm run test:integration # Integration tests only

# Watch mode (re-run tests on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Advanced Usage

```bash
# Run tests matching a pattern
node test-runner-comprehensive.js auth    # Run all auth-related tests
node test-runner-comprehensive.js venues  # Run venue-related tests
node test-runner-comprehensive.js stripe  # Run payment tests

# Run specific test file
npx mocha test/auth-routes.test.js

# Run with detailed output
npx mocha test/auth-routes.test.js --reporter spec

# Run with JSON output
npx mocha test/auth-routes.test.js --reporter json
```

## 🧪 Test Types

### 1. API Backend Tests

Test all REST API endpoints and backend services:

**Authentication Tests** (`test/auth-routes.test.js`)
- User registration and login
- Phone verification
- Password reset
- JWT token validation

**Venue Tests** (`test/venues-routes.test.js`)
- CRUD operations for venues
- Geolocation-based search
- Filtering and pagination
- Access control

**Matching Tests** (`test/matching-routes.test.js`)
- User discovery algorithm
- Swipe actions (like/pass)
- Match creation
- Statistics and analytics

**Payment Tests** (`test/stripe-payments.test.js`)
- Stripe integration
- Subscription management
- Webhook handling
- Error scenarios

### 2. UI Frontend Tests

Test user interface components and interactions:

**Authentication UI** (`ui-tests/auth-ui.test.js`)
- Login/register forms
- Form validation
- Error handling
- Loading states

**Discovery UI** (`ui-tests/discover-ui.test.js`)
- Profile card display
- Swipe gestures
- Filter modal functionality
- Match notifications

### 3. Integration Tests

End-to-end testing of complete workflows:

**User Journey Tests** (`test/integration-tests.js`)
- Complete registration flow
- Matching and messaging workflow
- Payment and subscription flow
- Real-time features

## ✍️ Writing Tests

### Test Structure Template

```javascript
import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import { createMockHonoContext, createTestUser } from './test-config.js';

describe('Feature Name', () => {
  let mockContext;
  let mockUser;

  beforeEach(() => {
    mockContext = createMockHonoContext();
    mockUser = createTestUser();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Specific Functionality', () => {
    it('should handle success case', async () => {
      // Arrange
      const testData = { /* test data */ };
      
      // Act
      const result = await functionUnderTest(testData);
      
      // Assert
      expect(result).to.have.property('success', true);
    });

    it('should handle error case', async () => {
      // Test error scenarios
    });
  });
});
```

### API Test Example

```javascript
describe('POST /api/auth/login', () => {
  it('should successfully login with valid credentials', async () => {
    // Mock Supabase response
    mockSupabase.auth.signInWithPassword.resolves({
      data: { user: mockUser, session: { access_token: 'token-123' } },
      error: null
    });

    // Mock request data
    mockContext.req.json.resolves({
      email: 'test@example.com',
      password: 'password123'
    });

    // Call the handler
    await loginHandler(mockContext);

    // Verify the response
    expect(mockContext.json.calledOnce).to.be.true;
    expect(mockSupabase.auth.signInWithPassword.calledOnce).to.be.true;
  });
});
```

### UI Test Example

```javascript
describe('Login Form', () => {
  it('should validate email format', () => {
    const emailInput = document.getElementById('login-email');
    const form = document.getElementById('login-form');

    emailInput.value = 'invalid-email';
    
    const isValid = form.checkValidity();
    expect(isValid).to.be.false;
  });
});
```

### Best Practices

1. **Test Naming**: Use descriptive test names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification
3. **Mock External Dependencies**: Use Sinon to mock APIs, databases, and external services
4. **Test Edge Cases**: Include tests for error conditions and boundary cases
5. **Keep Tests Independent**: Each test should be able to run in isolation
6. **Use Test Data Factories**: Create reusable test data generators

## 🔧 Test Configuration

### Environment Variables

Create a `.env.test` file for test-specific configuration:

```env
NODE_ENV=test
SUPABASE_URL=https://test.supabase.co
SUPABASE_ANON_KEY=test-anon-key
STRIPE_SECRET_KEY=sk_test_123
TWILIO_ACCOUNT_SID=test-twilio-sid
TWILIO_AUTH_TOKEN=test-twilio-token
```

### Mock Configuration

The `test/test-config.js` file provides utilities for:

- Mock Supabase client
- Mock Stripe client
- Mock Twilio client
- Test data factories
- Assertion helpers

## 🔄 CI/CD Integration

### GitHub Actions

Create `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Run tests
      run: npm test
      
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

### Pre-commit Hooks

Add to `package.json`:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:api"
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues

**1. Tests fail with "Module not found"**
```bash
# Solution: Install missing dependencies
npm install --save-dev jsdom sinon chai mocha
```

**2. DOM tests fail in Node.js environment**
```bash
# Solution: Ensure JSDOM is properly configured
# Check that global.window and global.document are set in test setup
```

**3. Async tests timeout**
```bash
# Solution: Increase timeout or fix async handling
npx mocha test/file.test.js --timeout 5000
```

**4. Mocks not working as expected**
```bash
# Solution: Ensure sinon.restore() is called in afterEach
# Check that mocks are set up before the code under test runs
```

### Debug Mode

Run tests with debug output:

```bash
# Enable debug logging
DEBUG=* npm test

# Run specific test with detailed output
npx mocha test/auth-routes.test.js --reporter spec --bail
```

### Test Coverage

Generate coverage reports:

```bash
# Install nyc for coverage
npm install --save-dev nyc

# Run tests with coverage
npx nyc npm test

# Generate HTML coverage report
npx nyc --reporter=html npm test
```

## 📊 Test Metrics

### Coverage Goals

- **API Routes**: 90%+ coverage
- **UI Components**: 80%+ coverage
- **Business Logic**: 95%+ coverage
- **Integration Flows**: 70%+ coverage

### Performance Benchmarks

- Unit tests should run in < 50ms each
- Integration tests should run in < 5s each
- Full test suite should complete in < 2 minutes

## 🤝 Contributing

When adding new features:

1. Write tests first (TDD approach)
2. Ensure all existing tests pass
3. Add tests for new functionality
4. Update this documentation if needed
5. Run the full test suite before submitting PR

## 📚 Additional Resources

- [Mocha Documentation](https://mochajs.org/)
- [Chai Assertion Library](https://www.chaijs.com/)
- [Sinon Mocking Library](https://sinonjs.org/)
- [JSDOM Documentation](https://github.com/jsdom/jsdom)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
