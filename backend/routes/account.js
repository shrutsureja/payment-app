const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { Account } = require('../db/db');

const router = express.Router();

router.get('/balance', authMiddleware, async(req, res) => {
  const account = await Account.findOne({
    userId: req.userId
  })
  res.json({
    balance : account.balance
  })
})

router.post('/transfer', authMiddleware ,async (req, res) => {
  const { amount , to } = req.body;

  const account = await Account.findOne({
    userId : req.userId
  })

  if( account.balance < amount) {
    res.status(400).json({
      message: "Insufficient balance"
    })
  }

  const toAccount = await Account.findOne({
    userId : to
  })

  if(!toAccount){
    res.status(400).json({
      message: "Invalid account"
    });
  }

  // reduce the amount 
  await Account.updateOne({
    userId : req.userId
  }, {
    $inc : {
      balance: -amount
    }
  })

  // increase the amount in the toAccount
  await Account.updateOne({
    userId : to
  }, {
    $inc : {
      balance : amount
    }
  })

  res.json({
    message : "Transfer Successful"
  })

})

module.exports = router;