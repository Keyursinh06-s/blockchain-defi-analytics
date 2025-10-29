# Contributing to Blockchain DeFi Analytics

We appreciate your interest in contributing! This guide will help you get started.

## Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- Git
- Basic understanding of Ethereum and DeFi protocols

### Development Setup

```bash
# Clone the repository
git clone https://github.com/Keyursinh06-s/blockchain-defi-analytics.git
cd blockchain-defi-analytics

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Edit .env with your API keys

# Run development server
npm run dev

# Run tests
npm test
```

## Contribution Workflow

### 1. Find or Create an Issue

- Check existing issues
- Create new issue for bugs or features
- Discuss approach before major changes

### 2. Fork and Branch

```bash
# Fork the repository on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/blockchain-defi-analytics.git

# Create feature branch
git checkout -b feature/your-feature-name
```

### 3. Make Changes

- Write clean, documented code
- Follow project conventions
- Add tests for new features
- Update documentation

### 4. Commit Guidelines

Use conventional commit messages:

```
feat: Add Aave V3 integration
fix: Correct price calculation in Uniswap
docs: Update API documentation
test: Add portfolio analytics tests
refactor: Improve contract utilities
```

### 5. Submit Pull Request

- Push to your fork
- Create PR with clear description
- Link related issues
- Wait for review

## Code Standards

### JavaScript/Node.js

- Use ES6+ features
- Follow Airbnb style guide
- Use async/await over callbacks
- Handle errors properly

Example:
```javascript
/**
 * Fetch pool data from Uniswap
 * @param {string} poolAddress - Pool contract address
 * @returns {Promise<Object>} Pool information
 */
async function getPoolData(poolAddress) {
    try {
        const pool = await contract.getPool(poolAddress);
        return pool;
    } catch (error) {
        logger.error('Failed to fetch pool data:', error);
        throw error;
    }
}
```

### Smart Contract Interactions

- Always validate addresses
- Handle transaction failures
- Use proper gas estimation
- Implement retry logic

### Testing

```bash
# Run all tests
npm test

# Run specific test file
npm test -- protocols/uniswap.test.js

# Run with coverage
npm run test:coverage
```

Test structure:
```javascript
describe('UniswapAnalytics', () => {
    let analytics;
    
    beforeEach(() => {
        analytics = new UniswapAnalytics(provider);
    });
    
    it('should fetch pool information', async () => {
        const poolInfo = await analytics.getPoolInfo(token0, token1, fee);
        expect(poolInfo).toHaveProperty('liquidity');
    });
});
```

## Project Architecture

```
src/
├── protocols/      # Protocol integrations (Uniswap, Aave, etc.)
├── analytics/      # Analytics engines
├── utils/          # Utility functions
├── api/           # API routes
└── index.js       # Main server file

contracts/         # Smart contract ABIs
frontend/          # React dashboard
tests/            # Test files
docs/             # Documentation
```

## Protocol Integration Guidelines

When adding new protocol support:

1. Create protocol file in `src/protocols/`
2. Implement standard interface
3. Add comprehensive tests
4. Update documentation
5. Add to supported protocols list

Example protocol structure:
```javascript
class NewProtocol {
    constructor(provider) {
        this.provider = provider;
    }
    
    async getPoolInfo(address) { }
    async calculateAPY(poolAddress) { }
    async getUserPositions(userAddress) { }
}
```

## API Development

- RESTful design principles
- Proper error handling
- Input validation
- Rate limiting consideration
- Clear documentation

## Documentation

- Update README for major features
- Add JSDoc comments
- Include usage examples
- Document API endpoints
- Update changelog

## Security

- Never commit API keys or secrets
- Validate all user inputs
- Use environment variables
- Follow security best practices
- Report vulnerabilities privately

## Performance

- Implement caching where appropriate
- Optimize database queries
- Use batch requests
- Monitor API rate limits
- Profile performance bottlenecks

## Questions and Support

- GitHub Issues for bugs
- Discussions for questions
- Discord community (coming soon)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to DeFi Analytics!