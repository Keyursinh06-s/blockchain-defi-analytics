/**
 * Uniswap V3 Protocol Integration
 * Handles pool data, price calculations, and liquidity analysis
 */

const { ethers } = require('ethers');
const { Pool, Position, nearestUsableTick } = require('@uniswap/v3-sdk');
const { Token, CurrencyAmount, Percent } = require('@uniswap/sdk-core');

class UniswapAnalytics {
    constructor(provider, chainId = 1) {
        this.provider = provider;
        this.chainId = chainId;
        this.factoryAddress = '0x1F98431c8aD98523631AE4a59f267346ea31F984';
        this.quoterAddress = '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6';
    }

    /**
     * Get pool information for a token pair
     */
    async getPoolInfo(token0Address, token1Address, fee) {
        try {
            const poolAddress = await this.computePoolAddress(token0Address, token1Address, fee);
            const poolContract = new ethers.Contract(poolAddress, POOL_ABI, this.provider);
            
            const [slot0, liquidity, token0, token1] = await Promise.all([
                poolContract.slot0(),
                poolContract.liquidity(),
                poolContract.token0(),
                poolContract.token1()
            ]);

            return {
                address: poolAddress,
                token0: token0,
                token1: token1,
                fee: fee,
                sqrtPriceX96: slot0.sqrtPriceX96,
                tick: slot0.tick,
                liquidity: liquidity.toString(),
                observationIndex: slot0.observationIndex,
                observationCardinality: slot0.observationCardinality
            };
        } catch (error) {
            console.error('Error fetching pool info:', error);
            throw error;
        }
    }

    /**
     * Calculate current price from pool data
     */
    calculatePrice(sqrtPriceX96, token0Decimals, token1Decimals) {
        const Q96 = ethers.BigNumber.from(2).pow(96);
        const price = sqrtPriceX96.mul(sqrtPriceX96).div(Q96);
        
        const adjustedPrice = price.mul(ethers.BigNumber.from(10).pow(token0Decimals))
                                  .div(ethers.BigNumber.from(10).pow(token1Decimals));
        
        return ethers.utils.formatUnits(adjustedPrice, token1Decimals);
    }

    /**
     * Get historical price data for a pool
     */
    async getHistoricalPrices(poolAddress, fromTimestamp, toTimestamp) {
        const poolContract = new ethers.Contract(poolAddress, POOL_ABI, this.provider);
        
        // Get swap events
        const filter = poolContract.filters.Swap();
        const events = await poolContract.queryFilter(
            filter,
            await this.getBlockFromTimestamp(fromTimestamp),
            await this.getBlockFromTimestamp(toTimestamp)
        );

        return events.map(event => ({
            timestamp: event.blockNumber,
            price: this.calculatePrice(
                event.args.sqrtPriceX96,
                18, // Assuming 18 decimals, should be dynamic
                18
            ),
            volume: event.args.amount0.toString(),
            txHash: event.transactionHash
        }));
    }

    /**
     * Calculate APY for liquidity provision
     */
    async calculateLiquidityAPY(poolAddress, positionTickLower, positionTickUpper) {
        const poolInfo = await this.getPoolInfo(poolAddress);
        const currentTick = poolInfo.tick;
        
        // Check if position is in range
        const inRange = currentTick >= positionTickLower && currentTick <= positionTickUpper;
        
        if (!inRange) {
            return { apy: 0, inRange: false };
        }

        // Get 24h volume and fees
        const volume24h = await this.get24hVolume(poolAddress);
        const feeRate = poolInfo.fee / 1000000; // Convert to decimal
        const fees24h = volume24h * feeRate;
        
        // Calculate APY (simplified)
        const apy = (fees24h * 365) / poolInfo.liquidity * 100;
        
        return {
            apy: apy,
            inRange: true,
            volume24h: volume24h,
            fees24h: fees24h
        };
    }

    /**
     * Get top pools by TVL
     */
    async getTopPools(limit = 10) {
        // This would typically query The Graph or similar indexing service
        // For now, returning mock data structure
        return [
            {
                address: '0x...',
                token0: 'USDC',
                token1: 'ETH',
                fee: 3000,
                tvl: 1000000,
                volume24h: 50000,
                apy: 12.5
            }
            // ... more pools
        ];
    }

    /**
     * Compute pool address from token addresses and fee
     */
    async computePoolAddress(token0, token1, fee) {
        const POOL_INIT_CODE_HASH = '0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54';
        
        const [tokenA, tokenB] = token0.toLowerCase() < token1.toLowerCase() 
            ? [token0, token1] 
            : [token1, token0];
            
        const salt = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ['address', 'address', 'uint24'],
                [tokenA, tokenB, fee]
            )
        );
        
        return ethers.utils.getCreate2Address(
            this.factoryAddress,
            salt,
            POOL_INIT_CODE_HASH
        );
    }

    async getBlockFromTimestamp(timestamp) {
        // Binary search to find block number from timestamp
        // Implementation would go here
        return 'latest';
    }

    async get24hVolume(poolAddress) {
        // Query volume from last 24 hours
        // Implementation would query events or indexing service
        return 100000; // Mock value
    }
}

// Minimal Pool ABI for essential functions
const POOL_ABI = [
    'function slot0() external view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
    'function liquidity() external view returns (uint128)',
    'function token0() external view returns (address)',
    'function token1() external view returns (address)',
    'event Swap(address indexed sender, address indexed recipient, int256 amount0, int256 amount1, uint160 sqrtPriceX96, uint128 liquidity, int24 tick)'
];

module.exports = UniswapAnalytics;