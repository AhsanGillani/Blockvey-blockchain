const express = require('express');
const router = express.Router();
const { getContract } = require('../connect');

// Query property by ID
router.get('/property/:id', async (req, res) => {
    try {
        const contract = await getContract(); // <-- must be a Contract
        const propertyId = req.params.id;
        const result = await contract.evaluateTransaction('queryProperty', propertyId); // <-- evaluateTransaction for reads
        res.json(JSON.parse(result.toString()));
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});





router.post('/property', async (req, res) => {
  try {
    const { propertyId, owner, location, price, status } = req.body;

    const contract = await getContract();
    
    // Submit transaction
    const result = await contract.submitTransaction(
      'addProperty',
      propertyId,
      owner,
      location,
      price,
      status
    );

    // If chaincode does not return anything, result will be undefined
    if (result) {
      res.json({ success: true, data: result.toString() });
    } else {
      res.json({ success: true, message: 'Property added successfully' });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


// GET all properties
router.get('/properties', async (req, res) => {
    try {
        const contract = await getContract(); // get contract object
        const resultBytes = await contract.evaluateTransaction('queryAllProperties');
        const result = JSON.parse(resultBytes.toString());
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});





module.exports = router;

