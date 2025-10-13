const express = require("express");
const router = express.Router();
const { getContract } = require("../connect");

// ----------------------------
// CREATE PROPERTY
// ----------------------------
router.post("/property", async (req, res) => {
  try {
    const { id, title, description, owner, createdAt } = req.body;
    const contract = await getContract();
    const result = await contract.submitTransaction(
      "PropertyContract:createProperty",
      id,
      title,
      description || "",
      owner,
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
// UPDATE PROPERTY by ahmed
// ----------------------------
router.put("/property/:id", async (req, res) => {
  try {
    const { title, description, owner } = req.body;
    const contract = await getContract();
    const result = await contract.submitTransaction(
      "PropertyContract:updateProperty",
      req.params.id,
      title || "",
      description || "",
      owner || ""
    );
    res.json({ success: true, data: JSON.parse(result.toString()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------
// TRANSFER OWNERSHIP
// ----------------------------
router.post("/property/:id/transfer", async (req, res) => {
  try {
    const { newOwner } = req.body;
    const contract = await getContract();
    const result = await contract.submitTransaction(
      "PropertyContract:transferOwnership",
      req.params.id,
      newOwner
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
// CREATE & SIGN CONTRACT
// ----------------------------
router.post("/contract", async (req, res) => {
  try {
    const { contractId, propertyId, buyer, seller, terms, signedDate } = req.body;
    const contract = await getContract();
    const result = await contract.submitTransaction(
      "PropertyContract:createContract",
      contractId,
      propertyId,
      buyer,
      seller,
      terms,
      signedDate || new Date().toISOString()
    );
    res.json({ success: true, data: JSON.parse(result.toString()) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------
// RECORD TRANSACTION
// ----------------------------
router.post("/transaction", async (req, res) => {
  try {
    const { transactionId, propertyId, amount, currency, buyer, seller, date, description } = req.body;
    const contract = await getContract();
    const result = await contract.submitTransaction(
      "PropertyContract:recordTransaction",
      transactionId,
      propertyId,
      amount.toString(),
      currency,
      buyer,
      seller,
      date || new Date().toISOString(),
      description || ""
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

module.exports = router;
