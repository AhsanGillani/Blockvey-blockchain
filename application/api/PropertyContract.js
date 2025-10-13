'use strict';

const { Contract } = require('fabric-contract-api');

class PropertyContract extends Contract {

    // ----------------------------
    // Create Property
    // ----------------------------
    async createProperty(ctx, id, title, description, owner,createdAt) {
        const exists = await this.propertyExists(ctx, id);
        if (exists) {
            throw new Error(`Property ${id} already exists`);
        }

        const property = {
            id,
            title,
            description,
            owner,
            status: 'Created',
            contractId: '',
            transactions: [],
            createdAt,
        };

        await ctx.stub.putState(id, Buffer.from(JSON.stringify(property)));
        return JSON.stringify(property);
    }

    // ----------------------------
    // Create and Sign Contract
    // ----------------------------
    async createContract(ctx, contractId, propertyId, buyer, seller, terms,signedDate) {
        const exists = await this.contractExists(ctx, contractId);
        if (exists) {
            throw new Error(`Contract ${contractId} already exists`);
        }

        const propertyData = await this.readProperty(ctx, propertyId);
        if (!propertyData) {
            throw new Error(`Property ${propertyId} not found`);
        }

        const contract = {
            id: contractId,
            propertyId,
            buyer,
            seller,
            terms,
            signed: true,
            signedDate,
        };

        await ctx.stub.putState(contractId, Buffer.from(JSON.stringify(contract)));

        propertyData.status = 'UnderContract';
        propertyData.contractId = contractId;

        await ctx.stub.putState(propertyId, Buffer.from(JSON.stringify(propertyData)));
        return JSON.stringify(contract);
    }

    // ----------------------------
    // Record Transaction
    // ----------------------------
    async recordTransaction(ctx, transactionId, propertyId, amount, currency, buyer, seller,date, description) {
        const propertyData = await this.readProperty(ctx, propertyId);
        if (!propertyData) {
            throw new Error(`Property ${propertyId} not found`);
        }

        const transaction = {
            id: transactionId,
            propertyId,
            amount: parseFloat(amount),
            currency,
            buyer,
            seller,
            date, // Use client-provided timestamp,
            description,
        };

        await ctx.stub.putState(transactionId, Buffer.from(JSON.stringify(transaction)));

        propertyData.transactions.push(transactionId);
        propertyData.status = 'Completed';

        await ctx.stub.putState(propertyId, Buffer.from(JSON.stringify(propertyData)));
        return JSON.stringify(transaction);
    }

    async getTransactionDetails(ctx, transactionId) {
    const data = await ctx.stub.getState(transactionId);
    if (!data || data.length === 0) {
        throw new Error(`Transaction ${transactionId} does not exist`);
    }
    return data.toString();  // Already stored as JSON string
}




    




    // ----------------------------
    // Read Property
    // ----------------------------
    async readProperty(ctx, id) {
        const data = await ctx.stub.getState(id);
        if (!data || data.length === 0) {
            throw new Error(`Property ${id} does not exist`);
        }
        return JSON.parse(data.toString());
    }

    // ----------------------------
    // Get Complete Ledger for Property
    // ----------------------------
    async getPropertyHistory(ctx, propertyId) {
        const iterator = await ctx.stub.getHistoryForKey(propertyId);
        const history = [];

        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                const record = JSON.parse(res.value.value.toString('utf8'));
                history.push({
                    txId: res.value.tx_id,
                    timestamp: res.value.timestamp,
                    isDeleted: res.value.is_delete,
                    record
                });
            }
            if (res.done) {
                await iterator.close();
                break;
            }
        }
        return JSON.stringify(history);
    }

    // ----------------------------
    // Utility Functions
    // ----------------------------
    async propertyExists(ctx, id) {
        const data = await ctx.stub.getState(id);
        return data && data.length > 0;
    }

    async contractExists(ctx, id) {
        const data = await ctx.stub.getState(id);
        return data && data.length > 0;
    }
}

module.exports = PropertyContract;
