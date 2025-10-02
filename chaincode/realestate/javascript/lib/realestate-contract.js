'use strict';
const { Contract } = require('fabric-contract-api');

class RealEstateContract extends Contract {
  async initLedger(ctx) {
    console.log('Ledger initialized');
  }

  async addProperty(ctx, propertyId, ownerId, location, price, status) {
    const property = { propertyId, ownerId, location, price, status, docType: 'property' };
    await ctx.stub.putState(propertyId, Buffer.from(JSON.stringify(property)));
    return JSON.stringify(property);
  }

  async queryProperty(ctx, propertyId) {
    const propertyJSON = await ctx.stub.getState(propertyId);
    if (!propertyJSON || propertyJSON.length === 0) {
      throw new Error(`Property ${propertyId} does not exist`);
    }
    return propertyJSON.toString();
  }

  async queryAllProperties(ctx) {
    const iterator = await ctx.stub.getStateByRange('', '');
    const allResults = [];

    while (true) {
      const res = await iterator.next();

      if (res.value && res.value.value.toString()) {
        const strValue = res.value.value.toString('utf8');
        let record;
        try {
          record = JSON.parse(strValue);
        } catch (err) {
          record = strValue;
        }
        allResults.push({ Key: res.value.key, Record: record });
      }

      if (res.done) {
        await iterator.close();
        break;
      }
    }

    return JSON.stringify(allResults);
  }

  async transferProperty(ctx, propertyId, newOwnerId) {
    const propertyJSON = await ctx.stub.getState(propertyId);
    if (!propertyJSON || propertyJSON.length === 0) throw new Error(`Property ${propertyId} does not exist`);
    const property = JSON.parse(propertyJSON.toString());
    property.ownerId = newOwnerId;
    property.status = 'Sold';
    await ctx.stub.putState(propertyId, Buffer.from(JSON.stringify(property)));
    return JSON.stringify(property);
  }
}

module.exports = RealEstateContract;
