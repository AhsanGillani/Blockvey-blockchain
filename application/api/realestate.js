const express = require("express");
const router = express.Router();
const { getContract } = require("../connect"); // Your Fabric connect method

//---------------------------------------------------
// CREATE PROPERTY  -->  createProperty(ctx, id, title, description, owner, createdAt)
//---------------------------------------------------
router.post("/property", async (req, res) => {
  try {
    const { id, title, description, owner, createdAt } = req.body;
    if (!id || !title || !owner) {
      return res.status(400).json({ error: "Missing required fields: id, title, owner" });
    }

    const contract = await getContract();
    const result = await contract.submitTransaction(
      "PropertyContract:createProperty",  // <-- If namespaced
      id,
      title,
      description || "",
      owner,
      createdAt || new Date().toISOString()
    );

    res.json({ success: true, data: result.toString() });
  } catch (error) {
    console.error("Error creating property:", error);
    res.status(500).json({ error: error.message });
  }
});

//---------------------------------------------------
// READ PROPERTY --> readProperty(ctx, id)
//---------------------------------------------------
router.get("/property/:id", async (req, res) => {
  try {
    const contract = await getContract();
    const result = await contract.evaluateTransaction(
      "PropertyContract:readProperty",  // <-- If namespaced
      req.params.id
    );
    res.json(JSON.parse(result.toString()));
  } catch (error) {
    console.error("Error reading property:", error);
    res.status(500).json({ error: error.message });
  }
});

//---------------------------------------------------
// PROPERTY HISTORY --> getPropertyHistory(ctx, propertyId)
//---------------------------------------------------
router.get("/property/:id/history", async (req, res) => {
  try {
    const contract = await getContract();
    const result = await contract.evaluateTransaction(
      "PropertyContract:getPropertyHistory",
      req.params.id
    );
    res.json(JSON.parse(result.toString()));
  } catch (error) {
    console.error("Error fetching history:", error);
    res.status(500).json({ error: error.message });
  }
});

//---------------------------------------------------
// CREATE CONTRACT --> createContract(ctx, contractId, propertyId, buyer, seller, terms, signedDate)
//---------------------------------------------------
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
    res.json({ success: true, data: result.toString() });
  } catch (error) {
    console.error("Error creating contract:", error);
    res.status(500).json({ error: error.message });
  }
});

//---------------------------------------------------
// RECORD TRANSACTION --> recordTransaction(ctx, transactionId, propertyId, amount, currency, buyer, seller, date, description)
//---------------------------------------------------
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
    res.json({ success: true, data: result.toString() });
  } catch (error) {
    console.error("Error recording transaction:", error);
    res.status(500).json({ error: error.message });
  }
});

router.get("/transaction/:id", async (req, res) => {
  try {
    const contract = await getContract();
    const result = await contract.evaluateTransaction(
      "PropertyContract:getTransactionDetails",
      req.params.id
    );
    res.json(JSON.parse(result.toString()));
  } catch (error) {
    console.error("Error reading transaction:", error);
    res.status(500).json({ error: error.message });
  }
});






module.exports = router;
