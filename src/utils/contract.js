/**
 * Smart Contract Utilities
 * Helper functions for interacting with Ethereum smart contracts
 */

const { ethers } = require('ethers');

class ContractUtils {
    constructor(provider) {
        this.provider = provider;
    }

    /**
     * Get contract instance
     */
    getContract(address, abi) {
        return new ethers.Contract(address, abi, this.provider);
    }

    /**
     * Decode transaction input data
     */
    decodeTransactionInput(abi, data) {
        const iface = new ethers.utils.Interface(abi);
        try {
            const decoded = iface.parseTransaction({ data });
            return {
                name: decoded.name,
                signature: decoded.signature,
                args: decoded.args,
                value: decoded.value
            };
        } catch (error) {
            console.error('Error decoding transaction:', error);
            return null;
        }
    }

    /**
     * Decode event logs
     */
    decodeEventLogs(abi, logs) {
        const iface = new ethers.utils.Interface(abi);
        const decodedLogs = [];

        for (const log of logs) {
            try {
                const decoded = iface.parseLog(log);
                decodedLogs.push({
                    name: decoded.name,
                    signature: decoded.signature,
                    args: decoded.args,
                    address: log.address,
                    blockNumber: log.blockNumber,
                    transactionHash: log.transactionHash
                });
            } catch (error) {
                // Log might not be from this contract
                continue;
            }
        }

        return decodedLogs;
    }

    /**
     * Estimate gas for transaction
     */
    async estimateGas(contract, method, args, overrides = {}) {
        try {
            const gasEstimate = await contract.estimateGas[method](...args, overrides);
            return gasEstimate;
        } catch (error) {
            console.error('Gas estimation failed:', error);
            throw error;
        }
    }

    /**
     * Get current gas price
     */
    async getGasPrice() {
        const gasPrice = await this.provider.getGasPrice();
        return {
            wei: gasPrice.toString(),
            gwei: ethers.utils.formatUnits(gasPrice, 'gwei'),
            eth: ethers.utils.formatEther(gasPrice)
        };
    }

    /**
     * Wait for transaction confirmation
     */
    async waitForTransaction(txHash, confirmations = 1) {
        const receipt = await this.provider.waitForTransaction(txHash, confirmations);
        return {
            success: receipt.status === 1,
            blockNumber: receipt.blockNumber,
            gasUsed: receipt.gasUsed.toString(),
            effectiveGasPrice: receipt.effectiveGasPrice.toString(),
            logs: receipt.logs
        };
    }

    /**
     * Batch call multiple contract methods
     */
    async batchCall(calls) {
        const promises = calls.map(call => {
            const { contract, method, args } = call;
            return contract[method](...args);
        });

        return await Promise.all(promises);
    }

    /**
     * Get contract creation block
     */
    async getContractCreationBlock(address) {
        let low = 0;
        let high = await this.provider.getBlockNumber();

        while (low <= high) {
            const mid = Math.floor((low + high) / 2);
            const code = await this.provider.getCode(address, mid);

            if (code === '0x') {
                low = mid + 1;
            } else {
                const prevCode = await this.provider.getCode(address, mid - 1);
                if (prevCode === '0x') {
                    return mid;
                }
                high = mid - 1;
            }
        }

        return null;
    }

    /**
     * Parse token amount with decimals
     */
    parseTokenAmount(amount, decimals) {
        return ethers.utils.parseUnits(amount.toString(), decimals);
    }

    /**
     * Format token amount from wei
     */
    formatTokenAmount(amount, decimals) {
        return ethers.utils.formatUnits(amount, decimals);
    }

    /**
     * Check if address is contract
     */
    async isContract(address) {
        const code = await this.provider.getCode(address);
        return code !== '0x';
    }

    /**
     * Get ERC20 token info
     */
    async getTokenInfo(tokenAddress) {
        const tokenABI = [
            'function name() view returns (string)',
            'function symbol() view returns (string)',
            'function decimals() view returns (uint8)',
            'function totalSupply() view returns (uint256)'
        ];

        const contract = this.getContract(tokenAddress, tokenABI);

        try {
            const [name, symbol, decimals, totalSupply] = await Promise.all([
                contract.name(),
                contract.symbol(),
                contract.decimals(),
                contract.totalSupply()
            ]);

            return {
                address: tokenAddress,
                name,
                symbol,
                decimals,
                totalSupply: totalSupply.toString()
            };
        } catch (error) {
            console.error('Error fetching token info:', error);
            throw error;
        }
    }

    /**
     * Calculate transaction cost
     */
    calculateTransactionCost(gasUsed, gasPrice) {
        const cost = ethers.BigNumber.from(gasUsed).mul(ethers.BigNumber.from(gasPrice));
        return {
            wei: cost.toString(),
            gwei: ethers.utils.formatUnits(cost, 'gwei'),
            eth: ethers.utils.formatEther(cost)
        };
    }
}

module.exports = ContractUtils;