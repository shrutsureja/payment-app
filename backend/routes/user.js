const express = require('express');
const zod = require('zod')
const router = express.Router();
const {JWT_SECRET} = require('../config')
const { User } = require('../db/db')
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/authMiddleware');

const signupSchema = zod.object({
  username: zod.string().email(),
  password: zod.string(),
  firstname : String(),
  lastname: String()
});

router.post('/signup', async(req,res) => {
  const body = req.body;
  const { success } = signupSchema.safeParse(body);

  if(!success){
    res.status(411).json({
      message: "Email already taken / Incorrect inputs"
    });
  }

  const existingUser = await User.findOne({
    username: req.body.username
  })

  if(existingUser){
    res.status(411).json({
      message: "Email already taken / Incorrect inputs"
    });
  }

  const user = await UserActivation.create({
    username : req.body.username,
    password: req.body.password,
    firstname: req.body.firstname,
    lastname : req.body.lastname
  })

  const userId = user._id;

  await Account.create({
    userId,
    balance: 1 + Math.random() * 10000
  })

  const token = jwt.sign({
    userId: userId
  }, JWT_SECRET);

  res.json({
    message: "User created successfully",
    token: token
  })

});

const signinSchema = zod.object({
  username: String().email(),
  password: String()
})

router.post('signin', async(req,res) => {
  const { success } = signinSchema.safeParse(req.body);
  if(!success){
    return res.status(411).json({
      message: "Incorrect inputs"
    })
  }

  const user = await User.findOne({
    username: req.body.username,
    password: req.body.password
  })

  if(user){
    const token = jwt.sign({
      userId: user._id
    }, JWT_SECRET);
    res.json({
      token : token
    })
    return;
  }


  res.status(411).json({
    message: "Error while logging in"
  })
})

const updateBody = zod.object({
  password: zod.string().optional(),
  firstname: zod.string().optional(),
  lastname : zod.string().optional(),
})

router.put('/', authMiddleware, async(req,res)=>{
  const { success } = updateBody.safeParse(req.body);
  if(!success){
    res.status(411).json({
      message: "Error while updating information"
    })
  }
  await User.updateOne(req.body, {
    id: req.userId
  })

  res.json({
    message: "Updated successfully"
  })
})



/* For filtering the users form the database and displaying it to the users */
router.get('/bulk', async(req, res) => {
  const filter = req.query.filter || "";
  const users = await User.find({
    $or : [ {
      firstname :{
        "$regex" : filter
      }
    }, {
      lastname : {
        "$regex" : filter
      }
    }]
  });

  res.json({
    user: users.map( user => ({
      username: user.username,
      firstname: user.firstName,
      lastname: user.lastName,
      _id: user._id
    }))
  })
})


module.exports = router;