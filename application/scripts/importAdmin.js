'use strict';

const fs = require('fs');
const path = require('path');
const { Wallets } = require('fabric-network');

async function main() {
    try {
        const walletPath = path.join(__dirname, '..', 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`👉 Wallet path: ${walletPath}`);

        const identity = await wallet.get('admin');
        if (identity) {
            console.log('✅ An identity for the admin user "admin" already exists in the wallet');
            return;
        }

        const mspId = 'Org1MSP';

        // 🔥 FIXED absolute paths
        const certPath = '/home/test/active/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/signcerts/Admin@org1.example.com-cert.pem';
        const certificate = fs.readFileSync(certPath).toString();

        const keyDirPath = '/home/test/active/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore';
        const keyFiles = fs.readdirSync(keyDirPath);
        if (keyFiles.length === 0) {
            throw new Error(`❌ No key files found in ${keyDirPath}`);
        }
        const keyPath = path.join(keyDirPath, keyFiles[0]);
        const privateKey = fs.readFileSync(keyPath).toString();

        const identityData = {
            credentials: {
                certificate,
                privateKey,
            },
            mspId,
            type: 'X.509',
        };

        await wallet.put('admin', identityData);
        console.log('🎉 Successfully imported admin identity into the wallet');

    } catch (error) {
        console.error(`❌ Failed to import identity: ${error}`);
        process.exit(1);
    }
}

main();
