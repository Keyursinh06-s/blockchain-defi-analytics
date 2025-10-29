const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { ethers } = require('ethers');

// Load environment variables
dotenv.config();

// Import services
const UniswapAnalytics = require('./protocols/uniswap');
const PortfolioAnalytics = require('./analytics/portfolio');
const PriceOracle = require('./utils/priceOracle');
const ContractUtils = require('./utils/contract');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize provider
const provider = new ethers.providers.JsonRpcProvider(
    process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID'
);

// Initialize services
const priceOracle = new PriceOracle();
const contractUtils = new ContractUtils(provider);
const uniswapAnalytics = new UniswapAnalytics(provider);
const portfolioAnalytics = new PortfolioAnalytics(provider, priceOracle);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// API Routes

/**
 * Get token price
 */
app.get('/api/price/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const price = await priceOracle.getPrice(symbol);
        res.json({ symbol, ...price });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get historical prices
 */
app.get('/api/price/:symbol/history', async (req, res) => {
    try {
        const { symbol } = req.params;
        const { days = 7 } = req.query;
        const history = await priceOracle.getHistoricalPrices(symbol, parseInt(days));
        res.json({ symbol, history });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get Uniswap pool information
 */
app.get('/api/uniswap/pool/:token0/:token1/:fee', async (req, res) => {
    try {
        const { token0, token1, fee } = req.params;
        const poolInfo = await uniswapAnalytics.getPoolInfo(token0, token1, parseInt(fee));
        res.json(poolInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get portfolio overview
 */
app.get('/api/portfolio/:address', async (req, res) => {
    try {
        const { address } = req.params;
        
        if (!ethers.utils.isAddress(address)) {
            return res.status(400).json({ error: 'Invalid Ethereum address' });
        }
        
        const portfolio = await portfolioAnalytics.getPortfolioOverview(address);
        res.json(portfolio);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get token information
 */
app.get('/api/token/:address', async (req, res) => {
    try {
        const { address } = req.params;
        
        if (!ethers.utils.isAddress(address)) {
            return res.status(400).json({ error: 'Invalid token address' });
        }
        
        const tokenInfo = await contractUtils.getTokenInfo(address);
        res.json(tokenInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get current gas prices
 */
app.get('/api/gas', async (req, res) => {
    try {
        const gasPrice = await contractUtils.getGasPrice();
        res.json(gasPrice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get batch token prices
 */
app.post('/api/prices/batch', async (req, res) => {
    try {
        const { symbols } = req.body;
        
        if (!Array.isArray(symbols)) {
            return res.status(400).json({ error: 'Symbols must be an array' });
        }
        
        const prices = await priceOracle.getBatchPrices(symbols);
        res.json(prices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get top Uniswap pools
 */
app.get('/api/uniswap/pools/top', async (req, res) => {
    try {
        const { limit = 10 } = req.query;
        const pools = await uniswapAnalytics.getTopPools(parseInt(limit));
        res.json(pools);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Calculate liquidity APY
 */
app.get('/api/uniswap/apy/:poolAddress', async (req, res) => {
    try {
        const { poolAddress } = req.params;
        const { tickLower, tickUpper } = req.query;
        
        const apy = await uniswapAnalytics.calculateLiquidityAPY(
            poolAddress,
            parseInt(tickLower),
            parseInt(tickUpper)
        );
        
        res.json(apy);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get supported protocols
 */
app.get('/api/protocols', (req, res) => {
    res.json({
        protocols: [
            { name: 'Uniswap V2', version: '2.0', supported: true },
            { name: 'Uniswap V3', version: '3.0', supported: true },
            { name: 'Aave', version: '3.0', supported: true },
            { name: 'Compound', version: '2.0', supported: true },
            { name: 'Curve', version: '1.0', supported: true },
            { name: 'Balancer', version: '2.0', supported: true }
        ]
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: 'Internal server error',
        message: err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 DeFi Analytics API running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📖 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;