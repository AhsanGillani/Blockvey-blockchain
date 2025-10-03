const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function connectToNetwork() {
    try {
        // Load connection profile
        const ccpPath = '/home/ubuntu/active/Blockvey-blockchain/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json';
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Load wallet
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check identity
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('❌ Identity for "appUser" not found in wallet.');
            return null;
        }

        // Connect to gateway
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: 'appUser',
            discovery: { enabled: true, asLocalhost: true }
        });

        const network = await gateway.getNetwork('realestatechannel');
        const contract = network.getContract('realestate');
        return contract;

    } catch (error) {
        console.error(`⚠️ Failed to connect: ${error}`);
        return null;
    }
}

module.exports = connectToNetwork;
