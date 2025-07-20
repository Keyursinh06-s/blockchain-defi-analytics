# Blockchain DeFi Analytics Platform

Advanced DeFi analytics platform with smart contract integration and real-time market data visualization.

## Features

- **Smart Contract Integration**: Direct interaction with DeFi protocols
- **Real-time Analytics**: Live market data and protocol metrics
- **Portfolio Tracking**: Multi-chain portfolio analysis
- **Yield Farming**: APY calculations and farming opportunities
- **Risk Assessment**: Protocol risk analysis and scoring

## Supported Protocols

- Uniswap V2/V3
- Aave
- Compound
- MakerDAO
- Curve Finance
- Balancer

## Quick Start

```bash
git clone https://github.com/Keyursinh06-s/blockchain-defi-analytics.git
cd blockchain-defi-analytics
npm install
npm run dev
```

## Environment Setup

```bash
cp .env.example .env
# Add your API keys:
# - Infura/Alchemy RPC URLs
# - CoinGecko API key
# - The Graph API key
```

## Architecture

```
├── contracts/          # Smart contract interfaces
├── src/
│   ├── analytics/      # Analytics engine
│   ├── protocols/      # Protocol integrations
│   ├── utils/          # Utility functions
│   └── api/           # API endpoints
├── frontend/          # React dashboard
└── docs/             # Documentation
```

## API Endpoints

- `GET /api/protocols` - List supported protocols
- `GET /api/pools` - Get liquidity pools data
- `GET /api/yields` - Current yield farming opportunities
- `GET /api/portfolio/:address` - Portfolio analysis

## Contributing

Please read CONTRIBUTING.md for contribution guidelines.

## License

MIT License