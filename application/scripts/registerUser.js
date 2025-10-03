'use strict';

const fs = require('fs');
const path = require('path');
const { Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');

async function main() {
    try {
        const walletPath = path.join(__dirname, '..', 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`👉 Wallet path: ${walletPath}`);

        const userIdentity = await wallet.get('appUser');
        if (userIdentity) {
            console.log('✅ An identity for the user "appUser" already exists in the wallet');
            return;
        }

        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            console.log('❌ Admin identity not found in the wallet. Run importAdmin.js first.');
            return;
        }

        // ✅ Load connection profile
        const ccpPath = '/home/ubuntu/active/Blockvey-blockchain/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json';
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // ✅ Force correct CA URL (replace localhost!)
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        caInfo.url = 'https://16.16.126.35:7054';

        const ca = new FabricCAServices(
            caInfo.url,
            { trustedRoots: caInfo.tlsCACerts.pem, verify: false },
            caInfo.caName
        );

        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        // ✅ Force a static enrollmentSecret instead of dynamic
        const secret = await ca.register({
            affiliation: 'org1.department1',
            enrollmentID: 'appUser',
            enrollmentSecret: 'appUserpw',  // ✅ Ensures stable credentials
            role: 'client'
        }, adminUser);

        const enrollment = await ca.enroll({
            enrollmentID: 'appUser',
            enrollmentSecret: 'appUserpw'
        });

        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        await wallet.put('appUser', x509Identity);
        console.log('🎉 Successfully registered and enrolled appUser and imported it into the wallet');

    } catch (error) {
        console.error(`❌ Failed to register user: ${error}`);
        process.exit(1);
    }
}

main();
