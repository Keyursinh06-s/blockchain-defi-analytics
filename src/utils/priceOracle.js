/**
 * Price Oracle Service
 * Aggregates price data from multiple sources
 */

const axios = require('axios');

class PriceOracle {
    constructor() {
        this.cache = new Map();
        this.cacheTTL = 60000; // 1 minute
        this.sources = {
            coingecko: 'https://api.coingecko.com/api/v3',
            chainlink: 'chainlink-feeds',
            uniswap: 'uniswap-pools'
        };
    }

    /**
     * Get token price from multiple sources
     */
    async getPrice(tokenSymbol) {
        const cacheKey = `price_${tokenSymbol.toLowerCase()}`;
        
        // Check cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTTL) {
                return cached.price;
            }
        }

        try {
            const price = await this.fetchPriceFromCoinGecko(tokenSymbol);
            
            // Cache the result
            this.cache.set(cacheKey, {
                price,
                timestamp: Date.now()
            });
            
            return price;
        } catch (error) {
            console.error(`Error fetching price for ${tokenSymbol}:`, error);
            throw error;
        }
    }

    /**
     * Fetch price from CoinGecko
     */
    async fetchPriceFromCoinGecko(tokenSymbol) {
        const coinId = this.getCoinGeckoId(tokenSymbol);
        const url = `${this.sources.coingecko}/simple/price`;
        
        const response = await axios.get(url, {
            params: {
                ids: coinId,
                vs_currencies: 'usd',
                include_24hr_change: true,
                include_market_cap: true,
                include_24hr_vol: true
            }
        });

        const data = response.data[coinId];
        return {
            usd: data.usd,
            change24h: data.usd_24h_change,
            marketCap: data.usd_market_cap,
            volume24h: data.usd_24h_vol
        };
    }

    /**
     * Get historical prices
     */
    async getHistoricalPrices(tokenSymbol, days = 7) {
        const coinId = this.getCoinGeckoId(tokenSymbol);
        const url = `${this.sources.coingecko}/coins/${coinId}/market_chart`;
        
        const response = await axios.get(url, {
            params: {
                vs_currency: 'usd',
                days: days
            }
        });

        return response.data.prices.map(([timestamp, price]) => ({
            timestamp: new Date(timestamp),
            price
        }));
    }

    /**
     * Get multiple token prices in batch
     */
    async getBatchPrices(tokenSymbols) {
        const coinIds = tokenSymbols.map(symbol => this.getCoinGeckoId(symbol));
        const url = `${this.sources.coingecko}/simple/price`;
        
        const response = await axios.get(url, {
            params: {
                ids: coinIds.join(','),
                vs_currencies: 'usd',
                include_24hr_change: true
            }
        });

        const prices = {};
        tokenSymbols.forEach((symbol, index) => {
            const coinId = coinIds[index];
            prices[symbol] = response.data[coinId];
        });

        return prices;
    }

    /**
     * Calculate price impact for a swap
     */
    calculatePriceImpact(inputAmount, outputAmount, inputPrice, outputPrice) {
        const expectedOutput = (inputAmount * inputPrice) / outputPrice;
        const priceImpact = ((expectedOutput - outputAmount) / expectedOutput) * 100;
        return priceImpact;
    }

    /**
     * Get token price from Uniswap pool
     */
    async getPriceFromUniswap(token0, token1, poolAddress) {
        // This would query Uniswap pool directly
        // Implementation depends on specific pool version
        return 0;
    }

    /**
     * Map token symbol to CoinGecko ID
     */
    getCoinGeckoId(symbol) {
        const mapping = {
            'ETH': 'ethereum',
            'BTC': 'bitcoin',
            'USDC': 'usd-coin',
            'USDT': 'tether',
            'DAI': 'dai',
            'WETH': 'weth',
            'WBTC': 'wrapped-bitcoin',
            'UNI': 'uniswap',
            'AAVE': 'aave',
            'LINK': 'chainlink',
            'MATIC': 'matic-network',
            'ARB': 'arbitrum'
        };

        return mapping[symbol.toUpperCase()] || symbol.toLowerCase();
    }

    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}

module.exports = PriceOracle;