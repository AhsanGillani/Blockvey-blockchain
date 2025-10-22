const express = require("express");
const router = express.Router();
const { getContract } = require("../connect");

// API Key middleware
const API_KEY = "patronecs001";

const authenticateApiKey = (req, res, next) => {
  const apiKey = req.headers['api-key'] || req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ 
      error: "API key is required. Please provide 'api-key' header." 
    });
  }
  
  if (apiKey !== API_KEY) {
    return res.status(403).json({ 
      error: "Invalid API key. Access denied." 
    });
  }
  
  next();
};

// Apply API key authentication to all routes
router.use(authenticateApiKey);

// ----------------------------
// CREATE PROPERTY
// ----------------------------
router.post("/property", async (req, res) => {
  try {
    const { id, title, description, sellerId, sellerName, sellerEmail,sellerkycId,buyerkycId, createdAt } = req.body;
    const contract = await getContract();
    const result = await contract.submitTransaction(
      "PropertyContract:createProperty",
      id,
      title,
      description || "",
      sellerkycId || "",
      buyerkycId || "",
      sellerId,
      sellerName,
      sellerEmail,
      createdAt || new Date().toISOString()
    );
    res.json({ success: true, data: JSON.parse(result.toString()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------
// READ PROPERTY
// ----------------------------
router.get("/property/:id", async (req, res) => {
  try {
    const contract = await getContract();
    const result = await contract.evaluateTransaction(
      "PropertyContract:readProperty",
      req.params.id
    );
    res.json(JSON.parse(result.toString()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------
// UPDATE PROPERTY
// ----------------------------
router.put("/property/:id", async (req, res) => {
  try {
    const { 
      title, 
      description, 
      owner, 
      sellerName, 
      sellerEmail, 
      sellerSolicitorId, 
      sellerSolicitorName, 
      sellerSolicitorEmail, 
      buyerName, 
      buyerEmail, 
      buyerSolicitorId, 
      buyerSolicitorName, 
      buyerSolicitorEmail, 
      sellerkycId,
      buyerkycId,
      updatedAt 
    } = req.body;
    const contract = await getContract();
    const result = await contract.submitTransaction(
      "PropertyContract:updateProperty",
      req.params.id,
      title || "",
      description || "",
      owner || "",
      sellerName || "",
      sellerEmail || "",
      sellerSolicitorId || "",
      sellerSolicitorName || "",
      sellerSolicitorEmail || "",
      buyerName || "",
      buyerEmail || "",
      buyerSolicitorId || "",
      buyerSolicitorName || "",
      buyerSolicitorEmail || "",
      sellerkycId || "",
      buyerkycId || "",
      updatedAt || new Date().toISOString()
    );
    res.json({ success: true, data: JSON.parse(result.toString()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------
// FINALIZE TRANSFER (contract must be signed, txns completed)
// ----------------------------
router.post("/property/:id/finalize", async (req, res) => {
  try {
    const { contractId, updatedAt } = req.body;
    const contract = await getContract();
    const result = await contract.submitTransaction(
      "PropertyContract:finalizeTransfer",
      req.params.id,
      contractId,
      updatedAt || new Date().toISOString()
    );
    res.json({ success: true, data: JSON.parse(result.toString()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------
// PROPERTY HISTORY
// ----------------------------
router.get("/property/:id/history", async (req, res) => {
  try {
    const contract = await getContract();
    const result = await contract.evaluateTransaction(
      "PropertyContract:getPropertyHistory",
      req.params.id
    );
    res.json(JSON.parse(result.toString()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------
// GENERATE CONTRACT (by solicitor)
// ----------------------------
router.post("/contract", async (req, res) => {
  try {
    const { contractId, propertyId, terms, createdAt } = req.body;
    const contract = await getContract();
    const result = await contract.submitTransaction(
      "PropertyContract:solicitorGenerateContract",
      propertyId,
      contractId,
      typeof terms === "string" ? terms : JSON.stringify(terms || {}),
      createdAt || new Date().toISOString()
    );
    res.json({ success: true, data: JSON.parse(result.toString()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------
// SIGN CONTRACT
// ----------------------------
router.post("/contract/:id/sign", async (req, res) => {
  try {
    const { signerEmail, signedAt } = req.body;
    const contract = await getContract();
    const result = await contract.submitTransaction(
      "PropertyContract:signContract",
      req.params.id,
      signerEmail,
      signedAt || new Date().toISOString()
    );
    res.json({ success: true, data: JSON.parse(result.toString()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------
// RECORD ESCROW/PAYMENT TRANSACTION
// ----------------------------
router.post("/transaction", async (req, res) => {
  try {
    const { transactionId, propertyId, fromEmail, fromName, toEmail, toName, amount, currency, step, createdAt } = req.body;
    const contract = await getContract();
    const result = await contract.submitTransaction(
      "PropertyContract:recordEscrowTransaction",
      transactionId,
      propertyId,
      fromEmail,
      fromName,
      toEmail,
      toName,
      amount.toString(),
      currency,
      step,
      createdAt || new Date().toISOString()
    );
    res.json({ success: true, data: JSON.parse(result.toString()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------
// GET TRANSACTION DETAILS
// ----------------------------
router.get("/transaction/:id", async (req, res) => {
  try {
    const contract = await getContract();
    const result = await contract.evaluateTransaction(
      "PropertyContract:getTransactionDetails",
      req.params.id
    );
    res.json(JSON.parse(result.toString()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------
// APPROVE TRANSACTION
// ----------------------------
router.post("/transaction/:id/approve", async (req, res) => {
  try {
    const { approverEmail, completedAt } = req.body;
    const contract = await getContract();
    const result = await contract.submitTransaction(
      "PropertyContract:approveTransaction",
      req.params.id,
      approverEmail,
      completedAt || new Date().toISOString()
    );
    res.json({ success: true, data: JSON.parse(result.toString()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------
// KYC: SUBMIT
// ----------------------------
router.post("/kyc", async (req, res) => {
  try {
    const { partyId, kycId, type, kycData, propertyId, createdAt } = req.body;
    const contract = await getContract();
    const result = await contract.submitTransaction(
      "PropertyContract:submitKyc",
      partyId,
      kycId,
      type,
      typeof kycData === "string" ? kycData : JSON.stringify(kycData || {}),
      propertyId,
      createdAt || new Date().toISOString()
    );
    res.json({ success: true, data: JSON.parse(result.toString()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------
// KYC: SOLICITOR APPROVE/REJECT
// ----------------------------
router.post("/kyc/:id/decision", async (req, res) => {
  try {
    const { approverId, decision, comment, approvedAt } = req.body;
    const contract = await getContract();
    const result = await contract.submitTransaction(
      "PropertyContract:solicitorApproveKyc",
      req.params.id,
      approverId || "",
      decision,
      comment || "",
      approvedAt || new Date().toISOString()
    );
    res.json({ success: true, data: JSON.parse(result.toString()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------
// ATTACH PARTICIPANTS
// ----------------------------
router.post("/property/:id/attach-seller-solicitor", async (req, res) => {
  try {
    const { solicitorId, solicitorName, solicitorEmail, createdAt } = req.body;
    const contract = await getContract();
    const result = await contract.submitTransaction(
      "PropertyContract:attachSolicitorToSeller",
      req.params.id,
      solicitorId,
      solicitorName,
      solicitorEmail,
      createdAt || new Date().toISOString()
    );
    res.json({ success: true, data: JSON.parse(result.toString()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/property/:id/attach-buyer-solicitor", async (req, res) => {
  try {
    const { solicitorId, solicitorName, solicitorEmail, createdAt } = req.body;
    const contract = await getContract();
    const result = await contract.submitTransaction(
      "PropertyContract:attachSolicitorToBuyer",
      req.params.id,
      solicitorId,
      solicitorName,
      solicitorEmail,
      createdAt || new Date().toISOString()
    );
    res.json({ success: true, data: JSON.parse(result.toString()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/property/:id/attach-buyer", async (req, res) => {
  try {
    const { buyerId, buyerName, buyerEmail, updatedAt } = req.body;
    const contract = await getContract();
    const result = await contract.submitTransaction(
      "PropertyContract:attachBuyerToProperty",
      req.params.id,
      buyerId,
      buyerName,
      buyerEmail,
      updatedAt || new Date().toISOString()
    );
    res.json({ success: true, data: JSON.parse(result.toString()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------
// QUERY HELPERS
// ----------------------------
router.get("/contract/:id", async (req, res) => {
  try {
    const contract = await getContract();
    const result = await contract.evaluateTransaction(
      "PropertyContract:queryContract",
      req.params.id
    );
    res.json(JSON.parse(result.toString()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/kyc/:id", async (req, res) => {
  try {
    const contract = await getContract();
    const result = await contract.evaluateTransaction(
      "PropertyContract:queryKyc",
      req.params.id
    );
    res.json(JSON.parse(result.toString()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/txn/:id", async (req, res) => {
  try {
    const contract = await getContract();
    const result = await contract.evaluateTransaction(
      "PropertyContract:queryTransaction",
      req.params.id
    );
    res.json(JSON.parse(result.toString()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/property/:id/progress", async (req, res) => {
  try {
    const contract = await getContract();
    const result = await contract.evaluateTransaction(
      "PropertyContract:_calculateProgress",
      req.params.id
    );
    res.json(JSON.parse(result.toString()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


module.exports = router;
