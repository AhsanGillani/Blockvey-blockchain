// connect.js
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function getContract() {
    // Load connection profile
    const ccpPath = path.resolve(__dirname, 'ccp.json'); // make sure ccp.json exists
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Setup wallet
    const walletPath = path.join(__dirname, 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Use admin identity
    const identity = await wallet.get('admin');
    if (!identity) {
        throw new Error('Admin identity not found in wallet');
    }

    // Connect to gateway
    const gateway = new Gateway();
    await gateway.connect(ccp, {
        wallet,
        identity: 'admin',
        discovery: { enabled: true, asLocalhost: true }
    });

    // Get network and contract
    const network = await gateway.getNetwork('mychannel'); // your channel
    const contract = network.getContract('realestate');   // your chaincode

    return contract; // <--- MUST return contract
}

module.exports = { getContract };
