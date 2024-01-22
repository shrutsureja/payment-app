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
  const session = await mongoose.startSession();

  session.startTransaction();
  const { amount , to } = req.body;

  const account = await Account.findOne({
    userId : req.userId
  }).session(session)

  if( account.balance < amount) {
    await session.abortTransaction();
    res.status(400).json({
      message: "Insufficient balance"
    })
  }

  const toAccount = await Account.findOne({
    userId : to
  }).session(session);

  if(!toAccount){
    await session.abortTransaction();
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
  }).session(session)

  // increase the amount in the toAccount
  await Account.updateOne({
    userId : to
  }, {
    $inc : {
      balance : amount
    }
  }).session(session)

  // commiting the transaction
  await session.commitTransaction();
  res.json({
    message : "Transfer Successful"
  })
})

module.exports = router;