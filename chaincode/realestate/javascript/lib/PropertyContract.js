'use strict';

const { Contract } = require('fabric-contract-api');
const crypto = require('crypto');

function genId(prefix) {
    // prefix-<timestamp>-<randomhex>
    return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

class PropertyContract extends Contract {

    // ----------------------------
    // Create Property (caller supplies id)
    // ----------------------------
    async createProperty(ctx, id, title, description,sellerkycId,buyerkycId,sellerId,sellerName,sellerEmail, createdAt) {
        const exists = await this.propertyExists(ctx, id);
        if (exists) {
            throw new Error(`Property ${id} already exists`);
        }

        const now = createdAt || new Date().toISOString();
        const property = {
            id,
            title,
            description,
            owner:sellerName,
            status: 'Created',
            propertyprogressbar: 0,
            contractId: '',
            kycId: { seller: null, sellerapproved: false, buyer: null, buyerapproved: false },
            transactions: [],         // will hold TXN IDs
            kyc: { seller: null, sellerapproved: false, buyer: null, buyerapproved: false },
            participants: {
                seller: { id: sellerId,sellerName: sellerName, sellerEmail: sellerEmail, sellerSolicitorId: null ,sellerSolicitorName: '', sellerSolicitorEmail: ''},
                buyer: { id: '', buyerName: '', buyerEmail: '', buyerSolicitorId: null ,buyerSolicitorName: '', buyerSolicitorEmail: '' }
            },
            createdAt: now,
            updatedAt: now
        };

        //check if kyc already exists and approved by seller and buyer you have to add one more record during create property you have to attach the kyc id to the property and approved by seller and buyer mark as true
        const sellerkycKey = `KYC::${sellerkycId}`;
        const sellerkycData = await ctx.stub.getState(sellerkycKey);
        if (sellerkycData && sellerkycData.length > 0) {
            try {
                const sellerkyc = JSON.parse(sellerkycData.toString());
                if (sellerkyc && sellerkyc.status === 'Approved') {
                    property.kycId.seller = sellerkycId;
                    property.kycId.sellerapproved = true;
                    property.kyc.seller = sellerkycId;
                    property.kyc.sellerapproved = true;
                }
                if (sellerkyc && sellerkyc.status === 'Pending') {
                    property.kycId.seller = sellerkycId;
                    property.kycId.sellerapproved = false;
                    property.kyc.seller = sellerkycId;
                    property.kyc.sellerapproved = false;
                }
                if (sellerkyc && sellerkyc.status === 'Rejected') {
                    property.kycId.seller = sellerkycId;
                    property.kycId.sellerapproved = false;
                    property.kyc.seller = sellerkycId;
                    property.kyc.sellerapproved = false;
                }
            } catch (e) {
                // ignore malformed KYC payload
            }
        }
        const buyerkycKey = `KYC::${buyerkycId}`;
        const buyerkycData = await ctx.stub.getState(buyerkycKey);
        if (buyerkycData && buyerkycData.length > 0) {
            try {
                const buyerkyc = JSON.parse(buyerkycData.toString());
                if (buyerkyc && buyerkyc.status === 'Approved') {
                    property.kycId.buyer = buyerkycId;
                    property.kycId.buyerapproved = true;
                    property.kyc.buyer = buyerkycId;
                    property.kyc.buyerapproved = true;
                }
                if (buyerkyc && buyerkyc.status === 'Pending') {
                    property.kycId.buyer = buyerkycId;
                    property.kycId.buyerapproved = false;
                    property.kyc.buyer = buyerkycId;
                    property.kyc.buyerapproved = false;
                }
                if (buyerkyc && buyerkyc.status === 'Rejected') {
                    property.kycId.buyer = buyerkycId;
                    property.kycId.buyerapproved = false;
                    property.kyc.buyer = buyerkycId;
                    property.kyc.buyerapproved = false;
                }
            } catch (e) {
                // ignore malformed KYC payload
            }
        }

        // Set initial progress
        property.propertyprogressbar = await this._calculateProgress(ctx, property);
        
        await ctx.stub.putState(`PROPERTY::${id}`, Buffer.from(JSON.stringify(property)));
        return JSON.stringify(property);
    }

    // ----------------------------
    // Update Property (metadata and/or owner)  sellerName, sellerEmail, sellerSolicitorId, sellerSolicitorName, sellerSolicitorEmail, buyerName, buyerEmail, buyerSolicitorId, buyerSolicitorName, buyerSolicitorEmail
    // ----------------------------
    async updateProperty(ctx, id, title, description, owner,sellerName, sellerEmail, sellerSolicitorId, sellerSolicitorName, sellerSolicitorEmail, buyerName, buyerEmail, buyerSolicitorId, buyerSolicitorName, buyerSolicitorEmail,sellerkycId,buyerkycId,updatedAt) {
        const property = await this._getProperty(ctx, id);

        if (title) property.title = title;
        if (description) property.description = description;
        if (owner) property.owner = owner;
        if (sellerName) property.participants.seller.sellerName = sellerName;
        if (sellerEmail) property.participants.seller.sellerEmail = sellerEmail;
        if (sellerSolicitorId) property.participants.seller.sellerSolicitorId = sellerSolicitorId;
        if (sellerSolicitorName) property.participants.seller.sellerSolicitorName = sellerSolicitorName;
        if (sellerSolicitorEmail) property.participants.seller.sellerSolicitorEmail = sellerSolicitorEmail;
        if (buyerName) property.participants.buyer.buyerName = buyerName;
        if (buyerEmail) property.participants.buyer.buyerEmail = buyerEmail;
        if (buyerSolicitorId) property.participants.buyer.buyerSolicitorId = buyerSolicitorId;
        if (buyerSolicitorName) property.participants.buyer.buyerSolicitorName = buyerSolicitorName;
        if (buyerSolicitorEmail) property.participants.buyer.buyerSolicitorEmail = buyerSolicitorEmail;
        property.status = 'Updated';

        //check if kyc already exists and approved by seller and buyer you have to add one more record during update property you have to attach the kyc id to the property and approved by seller and buyer mark as true
        const sellerkycKey = `KYC::${sellerkycId}`;
        const sellerkycData = await ctx.stub.getState(sellerkycKey);
        if (sellerkycData && sellerkycData.length > 0) {
            try {
                const sellerkyc = JSON.parse(sellerkycData.toString());
                if (sellerkyc && sellerkyc.status === 'Approved') {
                    property.kycId.seller = sellerkycId;
                    property.kycId.sellerapproved = true;
                    property.kyc.seller = sellerkycId;
                    property.kyc.sellerapproved = true;
                }
                if (sellerkyc && sellerkyc.status === 'Pending') {
                    property.kycId.seller = sellerkycId;
                    property.kycId.sellerapproved = false;
                    property.kyc.seller = sellerkycId;
                    property.kyc.sellerapproved = false;
                }
                if (sellerkyc && sellerkyc.status === 'Rejected') {
                    property.kycId.seller = sellerkycId;
                    property.kycId.sellerapproved = false;
                    property.kyc.seller = sellerkycId;
                    property.kyc.sellerapproved = false;
                }
            } catch (e) {
                // ignore malformed KYC payload
            }
        }
        const buyerkycKey = `KYC::${buyerkycId}`;
        const buyerkycData = await ctx.stub.getState(buyerkycKey);
        if (buyerkycData && buyerkycData.length > 0) {
            try {
                const buyerkyc = JSON.parse(buyerkycData.toString());
                if (buyerkyc && buyerkyc.status === 'Approved') {
                    property.kycId.buyer = buyerkycId;
                    property.kycId.buyerapproved = true;
                    property.kyc.buyer = buyerkycId;
                    property.kyc.buyerapproved = true;
                }
                if (buyerkyc && buyerkyc.status === 'Pending') {
                    property.kycId.buyer = buyerkycId;
                    property.kycId.buyerapproved = false;
                    property.kyc.buyer = buyerkycId;
                    property.kyc.buyerapproved = false;
                }
                if (buyerkyc && buyerkyc.status === 'Rejected') {
                    property.kycId.buyer = buyerkycId;
                    property.kycId.buyerapproved = false;
                    property.kyc.buyer = buyerkycId;
                    property.kyc.buyerapproved = false;
                }
            } catch (e) {
                // ignore malformed KYC payload
            }
        }




        property.updatedAt = updatedAt || new Date().toISOString();
        
        // Update progress
        property.propertyprogressbar = await this._calculateProgress(ctx, property);

        await ctx.stub.putState(`PROPERTY::${id}`, Buffer.from(JSON.stringify(property)));
        return JSON.stringify(property);
    }

    // ----------------------------
    // Submit KYC (auto-generate KYC id)
    // ----------------------------
    // kycJson must be a string (JSON string) or will be stringified
    async submitKyc(ctx, partyId,kycId, type, kycJson, propertyId,createdAt) {
        // type: 'seller' or 'buyer'
        if (!partyId || !type) throw new Error('partyId and type required');
        // kyc already exists, throw error 
        const kycKey = `KYC::${kycId}`;
        const data = await ctx.stub.getState(kycKey);   
        if (data && data.length > 0) {
            throw new Error(`KYC ${kycId} already exists for party ${partyId} and type ${type}`);
        }

        const payload = (typeof kycJson === 'string') ? JSON.parse(kycJson) : kycJson;

        const kyc = {
            id: kycId,
            partyId,
            type,
            data: payload,
            status: 'Submitted',
            submittedBy: ctx.clientIdentity.getID(),
            createdAt,
        }

        await ctx.stub.putState(`KYC::${kycId}`, Buffer.from(JSON.stringify(kyc)));

        // link to property
        const property = await this._getProperty(ctx, propertyId);
        property.kyc = property.kyc || {};
        property.kyc[type] = kycId;
        property.status = 'KYCSubmitted';
        property.kycId[type] = kycId;
        property.updatedAt = createdAt;
        await ctx.stub.putState(`PROPERTY::${propertyId}`, Buffer.from(JSON.stringify(property)));

        return JSON.stringify({ kycId, kyc });
    }

    // ----------------------------
    // Attach solicitor for seller
    // ----------------------------
    async attachSolicitorToSeller(ctx, propertyId, solicitorId,solicitorName,solicitorEmail,createdAt) {
        const property = await this._getProperty(ctx, propertyId);
        property.participants = property.participants || {};
        property.participants.seller = property.participants.seller || {};
        property.participants.seller.sellerSolicitorId = solicitorId;
        property.participants.seller.sellerSolicitorName = solicitorName;
        property.participants.seller.sellerSolicitorEmail = solicitorEmail;
        property.status = 'SellerSolicitorAttached';
        property.updatedAt = createdAt;
        
        // Update progress
        property.propertyprogressbar = await this._calculateProgress(ctx, property);
        
        await ctx.stub.putState(`PROPERTY::${propertyId}`, Buffer.from(JSON.stringify(property)));
        return JSON.stringify(property);
    }

    // ----------------------------
    // Attach solicitor for buyer
    // ----------------------------
    async attachSolicitorToBuyer(ctx, propertyId, solicitorId,solicitorName,solicitorEmail,createdAt) {
        const property = await this._getProperty(ctx, propertyId);
        property.participants = property.participants || {};
        property.participants.buyer = property.participants.buyer || {};
        property.participants.buyer.buyerSolicitorId = solicitorId;
        property.participants.buyer.buyerSolicitorName = solicitorName;
        property.participants.buyer.buyerSolicitorEmail = solicitorEmail;
        property.status = 'BuyerSolicitorAttached';
        property.updatedAt = createdAt;
        await ctx.stub.putState(`PROPERTY::${propertyId}`, Buffer.from(JSON.stringify(property)));
        return JSON.stringify(property);
    }

    // ----------------------------
    // Solicitor approves KYC
    // ----------------------------
    async solicitorApproveKyc(ctx, kycId, approverId, decision, comment,approvedAt) {
        // decision: 'approve' or 'reject'
        const kycKey = `KYC::${kycId}`;
        const data = await ctx.stub.getState(kycKey);
        if (!data || data.length === 0) throw new Error(`KYC ${kycId} does not exist`);

        const kyc = JSON.parse(data.toString());
        kyc.status = (decision === 'approve') ? 'Approved' : 'Rejected';
        kyc.approvedBy = approverId || ctx.clientIdentity.getID();
        kyc.approvalComment = comment || '';
        kyc.timestamps = kyc.timestamps || {};
        kyc.timestamps.approvedAt = approvedAt;

        await ctx.stub.putState(kycKey, Buffer.from(JSON.stringify(kyc)));

        // Find all properties where this KYC ID is attached as seller or buyer
        const iterator = await ctx.stub.getStateByRange('PROPERTY::', 'PROPERTY::z');
        const propertiesToUpdate = [];

        while (true) {
            const res = await iterator.next();
            if (!res.value || res.done) break;
            
            try {
                const property = JSON.parse(res.value.value.toString('utf8'));
                
                // Check if this KYC ID is attached to this property
                const isSellerKYC = property.kycId && property.kycId.seller === kycId;
                const isBuyerKYC = property.kycId && property.kycId.buyer === kycId;
                
                if (isSellerKYC || isBuyerKYC) {
                    // Update the property based on KYC type
                    if (kyc.type === 'seller' && isSellerKYC) {
                        property.kycId.sellerapproved = (decision === 'approve');
                        property.kyc.sellerapproved = (decision === 'approve');
                    }
                    if (kyc.type === 'buyer' && isBuyerKYC) {
                        property.kycId.buyerapproved = (decision === 'approve');
                        property.kyc.buyerapproved = (decision === 'approve');
                    }
                    
                    property.updatedAt = approvedAt;
                    
                    // Update status if approved
                    if (decision === 'approve') {
                        // Check if both seller and buyer KYC are approved
                        const bothApproved = property.kycId.sellerapproved && property.kycId.buyerapproved;
                        if (bothApproved) {
                            property.status = 'KYCApproved';
                        }
                    }
                    
                    propertiesToUpdate.push({
                        key: res.value.key,
                        property: property
                    });
                }
            } catch (e) {
                // Ignore malformed properties
            }
        }
        await iterator.close();

        // Update all affected properties
        for (const item of propertiesToUpdate) {
            await ctx.stub.putState(item.key, Buffer.from(JSON.stringify(item.property)));
        }

        // Return the updated KYC and list of affected properties
        return JSON.stringify({
            kycId: kyc.id,
            partyId: kyc.partyId,
            type: kyc.type,
            data: kyc.data,
            status: kyc.status,
            approvedby: kyc.approvedBy,
            approvalcomment: kyc.approvalComment,
            approvedat: kyc.approvedAt,
            affectedProperties: propertiesToUpdate.length,
            properties: propertiesToUpdate.map(item => item.property.id)
        });
    }

    // ----------------------------
    // Attach buyer to property (pre-contract)
    // ----------------------------
    async attachBuyerToProperty(ctx, propertyId, buyerId,buyerName,buyerEmail,updatedAt) {
        const property = await this._getProperty(ctx, propertyId);
        property.participants = property.participants || {};
        property.participants.buyer = property.participants.buyer || {};
        property.participants.buyer.id = buyerId;
        property.participants.buyer.buyerName = buyerName;
        property.participants.buyer.buyerEmail = buyerEmail;
        property.status = 'BuyerAttached';
        property.updatedAt = updatedAt;
        
        // Update progress
        property.propertyprogressbar = await this._calculateProgress(ctx, property);
        
        await ctx.stub.putState(`PROPERTY::${propertyId}`, Buffer.from(JSON.stringify(property)));
        return JSON.stringify(property);
    }

    // ----------------------------
    // Solicitor generates contract (auto contract id)
    // ----------------------------
    async solicitorGenerateContract(ctx, propertyId,contractId, terms,createdAt) {
        const contractKey = `CONTRACT::${contractId}`;
        const property = await this._getProperty(ctx, propertyId);
        const buyer = property.participants.buyer;
        const seller = property.participants.seller;

        const exists = await ctx.stub.getState(contractKey);
        if (exists && exists.length) throw new Error(`Contract ${contractId} already exists`);

        const contract = {
            id: contractId,
            propertyId,
            buyer: buyer.id,
            buyerEmail: buyer.buyerEmail,
            buyerName: buyer.buyerName,
            buyerSolicitorId: buyer.buyerSolicitorId,
            buyerSolicitorName: buyer.buyerSolicitorName,
            buyerSolicitorEmail: buyer.buyerSolicitorEmail,
            seller: seller.id,
            sellerEmail: seller.sellerEmail,
            sellerName: seller.sellerName,
            sellerSolicitorId: seller.sellerSolicitorId,
            sellerSolicitorName: seller.sellerSolicitorName,
            sellerSolicitorEmail: seller.sellerSolicitorEmail,
            terms,
            signatures: { buyer: false, seller: false, buyerSolicitor: false, sellerSolicitor: false },
            status: 'Draft',
            createdAt: createdAt || new Date().toISOString(),
            signedAt: null
        };

        await ctx.stub.putState(contractKey, Buffer.from(JSON.stringify(contract)));

        // link to property
        property.contractId = contractId;
        property.status = 'UnderContract';
        property.updatedAt = createdAt;
        
        // Update progress
        property.propertyprogressbar = await this._calculateProgress(ctx, property);
        
        await ctx.stub.putState(`PROPERTY::${propertyId}`, Buffer.from(JSON.stringify(property)));

        return JSON.stringify(contract);
    }

    // ----------------------------
    // Sign Contract
    // signerId must be one of the contract participant ids or solicitor ids
    // ----------------------------
    async signContract(ctx, contractId, signerEmail,signedAt) {
        const contractKey = `CONTRACT::${contractId}`;
        const data = await ctx.stub.getState(contractKey);
        if (!data || data.length === 0) throw new Error(`Contract ${contractId} not found`);
        const contract = JSON.parse(data.toString());

        // Map signer to signature role. In production you must check ctx.clientIdentity
        if (signerEmail === contract.buyerEmail) contract.signatures.buyer = true;
        else if (signerEmail === contract.sellerEmail) contract.signatures.seller = true;
        else if (signerEmail === contract.buyerSolicitorEmail) contract.signatures.buyerSolicitor = true;
        else if (signerEmail === contract.sellerSolicitorEmail) contract.signatures.sellerSolicitor = true;
        else {
            // Accept generic signer mapping if they pass exact role key
            // For safety you might accept param 'role' instead of signerId
            throw new Error(`Signer ${signerEmail} not recognized as participant for contract ${contractId}`);
        }
        const propertyId = contract.propertyId;
        const property = await this._getProperty(ctx, propertyId);
        //property.status = slller signed or buyer signed or solicitor signed or seller solicitor signed;
        if (contract.signatures.seller) property.status = 'SellerSigned';
        if (contract.signatures.buyer) property.status = 'BuyerSigned';
        if (contract.signatures.buyerSolicitor) property.status = 'BuyerSolicitorSigned';
        if (contract.signatures.sellerSolicitor) property.status = 'SellerSolicitorSigned';
        property.updatedAt = signedAt;
        
        // Update progress
        property.propertyprogressbar = await this._calculateProgress(ctx, property);
        
        await ctx.stub.putState(`PROPERTY::${propertyId}`, Buffer.from(JSON.stringify(property)));

        // check if all signatures done
        const allSigned = Object.values(contract.signatures).every(v => v === true);
        if (allSigned) {
            contract.status = 'Signed';
            contract.signedAt = signedAt;
            // emit event
            await ctx.stub.setEvent('ContractSigned', Buffer.from(JSON.stringify({ contractId })));
        }

        await ctx.stub.putState(contractKey, Buffer.from(JSON.stringify(contract)));
        return JSON.stringify(contract);
    }

    // ----------------------------
    // Record Escrow / Payment transaction (auto txn id)
    // ----------------------------
    async recordEscrowTransaction(ctx,txnId,propertyId, fromemail,fromname, toemail,toname, amount, currency, step,createdAt) {
        const key = `TXN::${txnId}`;
        const property = await this._getProperty(ctx, propertyId);
     
        // Check if transaction already exists
        const exists = await ctx.stub.getState(key);
        if (exists && exists.length > 0) {
            throw new Error(`Transaction ${txnId} already exists`);
        }
        
        const txn = {
            id: txnId,
            propertyId,
            fromemail,
            fromname,
            toemail,
            toname,
            amount: parseFloat(amount),
            currency,
            step, // e.g., "buyer_to_buyerSol"
            status: 'Pending',
            approvals: {},
            createdAt: createdAt,
            completedAt: null
        };

        await ctx.stub.putState(key, Buffer.from(JSON.stringify(txn)));

        // Optionally link to property by searching (caller can pass propertyId elsewhere). For convenience we do NOT link here.
        property.transactions.push(txnId);
        property.updatedAt = createdAt;
        
        // Update progress
        property.propertyprogressbar = await this._calculateProgress(ctx, property);
        
        await ctx.stub.putState(`PROPERTY::${propertyId}`, Buffer.from(JSON.stringify(property)));  
        // emit event
        await ctx.stub.setEvent('TransactionRecorded', Buffer.from(JSON.stringify({ txnId })));

        return JSON.stringify(txn);
    }

    // ----------------------------
    // Approve Transaction by approverId
    // ----------------------------
    async approveTransaction(ctx, txnId, approverEmail,completedAt) {
        const key = `TXN::${txnId}`;
        const data = await ctx.stub.getState(key);
        if (!data || data.length === 0) throw new Error(`Transaction ${txnId} not found`);
        // if trasction already completed, throw error
        const txn = JSON.parse(data.toString());
        if (txn.status === 'Completed') {
            throw new Error(`Transaction ${txnId} already completed`);
        }
        
        // approverEmail is match with txn.toemail or txn.fromemail
        if (approverEmail !== txn.toemail && approverEmail !== txn.fromemail) {
            throw new Error(`Approver ${approverEmail} is not the receiver or sender for transaction ${txnId}`);
        }

        txn.approvals = txn.approvals || {};
        txn.approvals[approverEmail] = true;

        // Business rule: mark Completed when approvals by receiver are present.
        // This is customizable. For demonstration, mark Completed when at least one approval exists.
        const approvalsCount = Object.keys(txn.approvals).length;
        if (approvalsCount >= 1) {
            txn.status = 'Completed';
            txn.completedAt = completedAt;
        }

        await ctx.stub.putState(key, Buffer.from(JSON.stringify(txn)));
        
        // Update progress on the property
        const property = await this._getProperty(ctx, txn.propertyId);
        property.propertyprogressbar = await this._calculateProgress(ctx, property);
        await ctx.stub.putState(`PROPERTY::${txn.propertyId}`, Buffer.from(JSON.stringify(property)));
        
        return JSON.stringify(txn);
    }

    // ----------------------------
    // Finalize Transfer (checks contract signed & transactions completed)
    // ----------------------------
    async finalizeTransfer(ctx, propertyId, contractId,updatedAt) {
        const property = await this._getProperty(ctx, propertyId);
        if (!property) throw new Error(`Property ${propertyId} not found`);

        // check contract
        const contractKey = `CONTRACT::${contractId}`;
        const cdata = await ctx.stub.getState(contractKey);
        if (!cdata || cdata.length === 0) throw new Error(`Contract ${contractId} not found`);
        const contract = JSON.parse(cdata.toString());
        if (contract.status !== 'Signed') throw new Error('Contract not fully signed');

        // check all transactions referenced in property.transactions
        for (const txnId of property.transactions || []) {
            const tdata = await ctx.stub.getState(`TXN::${txnId}`);
            if (!tdata || tdata.length === 0) throw new Error(`TXN ${txnId} missing`);
            const txn = JSON.parse(tdata.toString());
            if (txn.status !== 'Completed') throw new Error(`TXN ${txnId} not completed`);
        }

        // transfer ownership
        property.owner = contract.buyerName;
        property.status = 'Completed';
        property.updatedAt = updatedAt;
        property.propertyprogressbar = 100; // Final completion

        await ctx.stub.putState(`PROPERTY::${propertyId}`, Buffer.from(JSON.stringify(property)));

        // emit event
        await ctx.stub.setEvent('OwnershipTransferred', Buffer.from(JSON.stringify({ propertyId, newOwner: contract.buyer })));

        return JSON.stringify(property);
    }

    // ----------------------------
    // Get Transaction Details
    // ----------------------------
    async getTransactionDetails(ctx, txnId) {
        const data = await ctx.stub.getState(`TXN::${txnId}`);
        if (!data || data.length === 0) throw new Error(`Transaction ${txnId} does not exist`);
        return data.toString();
    }

    // ----------------------------
    // Read Property (helper)
    // ----------------------------
    async readProperty(ctx, id) {
        return await this._getProperty(ctx, id);
    }

    // ----------------------------
    // Get Complete Ledger for Property
    // ----------------------------
    async getPropertyHistory(ctx, propertyId) {
        const iterator = await ctx.stub.getHistoryForKey(`PROPERTY::${propertyId}`);
        const history = [];

        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                let record;
                try {
                    record = JSON.parse(res.value.value.toString('utf8'));
                } catch (e) {
                    record = res.value.value.toString('utf8');
                }
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
    // Query helpers
    // ----------------------------
    async queryContract(ctx, contractId) {
        const data = await ctx.stub.getState(`CONTRACT::${contractId}`);
        if (!data || data.length === 0) throw new Error(`Contract ${contractId} not found`);
        return data.toString();
    }

    async queryKyc(ctx, kycId) {
        const data = await ctx.stub.getState(`KYC::${kycId}`);
        if (!data || data.length === 0) throw new Error(`KYC ${kycId} not found`);
        return data.toString();
    }

    async queryTransaction(ctx, txnId) {
        return await this.getTransactionDetails(ctx, txnId);
    }



    // ----------------------------
    // Utility / internal functions
    // ----------------------------
    async propertyExists(ctx, id) {
        const data = await ctx.stub.getState(`PROPERTY::${id}`);
        return data && data.length > 0;
    }

    async contractExists(ctx, id) {
        const data = await ctx.stub.getState(`CONTRACT::${id}`);
        return data && data.length > 0;
    }

    // internal helper to read property with key namespace
    async _getProperty(ctx, id) {
        const data = await ctx.stub.getState(`PROPERTY::${id}`);
        if (!data || data.length === 0) throw new Error(`Property ${id} does not exist`);
        return JSON.parse(data.toString());
    }

    // Helper function to calculate progress based on property state and contract signatures
    async _calculateProgress(ctx, property) {
        let progress = 0;
        
        // Property created: 10%
        if (property.status === 'Created') {
            progress = 10;
        }
        // Seller solicitor attached: 20%
        else if (property.status === 'SellerSolicitorAttached') {
            progress = 20;
        }
        // Buyer attached: 30%
        else if (property.status === 'BuyerAttached') {
            progress = 30;
        }
        // Contract generated: 40%
        else if (property.status === 'UnderContract') {
            progress = 40;
        }
        // Contract signatures: 45%, 50%, 55%, 60%
        else if (property.status === 'SellerSigned' || property.status === 'BuyerSigned' || 
                 property.status === 'BuyerSolicitorSigned' || property.status === 'SellerSolicitorSigned') {
            progress = 40; // Base contract progress
            
            // Check contract signatures if contract exists
            if (property.contractId) {
                try {
                    const contractData = await ctx.stub.getState(`CONTRACT::${property.contractId}`);
                    if (contractData && contractData.length > 0) {
                        const contract = JSON.parse(contractData.toString());
                        if (contract.signatures) {
                            if (contract.signatures.seller) progress += 5; // 45%
                            if (contract.signatures.buyer) progress += 5; // 50%
                            if (contract.signatures.sellerSolicitor) progress += 5; // 55%
                            if (contract.signatures.buyerSolicitor) progress += 5; // 60%
                        }
                    }
                } catch (e) {
                    // Ignore contract parsing errors
                }
            }
        }
        // Final transfer: 100%
        else if (property.status === 'Completed') {
            progress = 100;
        }
        
        // Check for transaction stages: 65%, 70%, 80% (check regardless of status)
        if (property.transactions && Array.isArray(property.transactions) && property.transactions.length > 0) {
            // Check transaction statuses
            let completedTxns = 0;
            for (const txnId of property.transactions) {
                try {
                    const txnData = await ctx.stub.getState(`TXN::${txnId}`);
                    if (txnData && txnData.length > 0) {
                        const txn = JSON.parse(txnData.toString());
                        // Check if transaction is completed (case-insensitive check)
                        if (txn.status && txn.status.trim().toLowerCase() === 'completed') {
                            completedTxns++;
                        }
                    }
                } catch (e) {
                    // Ignore transaction parsing errors
                }
            }
            
            // Progress based on completed transactions (override previous progress if transactions exist)
            // Use if-else to ensure only one value is set
            if (completedTxns >= 3) {
                progress = 80; // Seller solicitor to buyer
            } else if (completedTxns >= 2) {
                progress = 70; // Buyer solicitor to seller solicitor
            } else if (completedTxns >= 1) {
                progress = 65; // Buyer to buyer solicitor
            }
        }
        
        return progress;
    }
}

module.exports = PropertyContract;
