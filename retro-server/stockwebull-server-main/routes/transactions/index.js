const UsersDatabase = require("../../models/User");
var express = require("express");
var router = express.Router();
const { sendDepositEmail} = require("../../utils");
const { sendUserDepositEmail,sendWithdrawalEmail,sendWithdrawalRequestEmail} = require("../../utils");
const ArtCollection = require("../../models/ArtCollection");

const { v4: uuidv4 } = require("uuid");

router.post("/addArtwork", async (req, res) => {
  try {
    const newArtwork = req.body.artwork;

    if (newArtwork) {
      // Find or create an art collection record in the database
      const artCollection = await ArtCollection.findOne();
      if (!artCollection) {
        const newArtCollection = new ArtCollection({ artworks: [newArtwork] });
        await newArtCollection.save();
      } else {
        artCollection.artworks.push(newArtwork);
        await artCollection.save();
      }

      // Retrieve the updated artwork array from the database
      const updatedArtCollection = await ArtCollection.findOne();
      res.json({ success: true, artworks: updatedArtCollection.artworks });
    } else {
      res.status(400).json({ success: false, message: 'Artwork parameter is missing in the request body.' });
    }
  } catch (error) {
    console.error("Error processing artwork addition:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

router.get('/getArtworks', async (req, res) => {
  try {
    // Find the art collection in the database
    const artCollection = await ArtCollection.findOne();

    if (artCollection) {
      // Send the artworks array as a response
      res.json({ success: true, artworks: artCollection.artworks });
    } else {
      res.status(404).json({ success: false, message: 'Art collection not found.' });
    }
  } catch (error) {
    console.error('Error fetching artworks:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});



router.post("/:_id/deposit", async (req, res) => {
  const { _id } = req.params;
  const {  amount} = req.body;

  const user = await UsersDatabase.findOne({ _id });

  if (!user) {
    res.status(404).json({
      success: false,
      status: 404,
      message: "User not found",
    });

    return;
  }

  try {
    await user.updateOne({
      transactions: [
        ...user.transactions,
        {
          _id: uuidv4(),
          method:"none",
          type: "conversion",
          amount:amount,
          from:"none",
          timestamp
        },
      ],
    });

    res.status(200).json({
      success: true,
      status: 200,
      message: "Deposit was successful",
    });

    sendDepositEmail({
      amount: amount,
      method: method,
      from: from,
      timestamp:timestamp
    });


    sendUserDepositEmail({
      amount: amount,
      method: method,
      from: from,
      to:to,
      timestamp:timestamp
    });

  } catch (error) {
    console.log(error);
  }
});



router.get("/:_id/deposit/history", async (req, res) => {
  const { _id } = req.params;

  const user = await UsersDatabase.findOne({ _id });

  if (!user) {
    res.status(404).json({
      success: false,
      status: 404,
      message: "User not found",
    });

    return;
  }

  try {
    res.status(200).json({
      success: true,
      status: 200,
      data: [...user.transactions],
    });

  
  } catch (error) {
    console.log(error);
  }
});


router.post("/:_id/withdrawal", async (req, res) => {
  const { _id } = req.params;
  const email=_id
  const {  address, amount,convertedToRth} = req.body;

  const user = await UsersDatabase.findOne({ email });

  if (!user) {
    res.status(404).json({
      success: false,
      status: 404,
      message: "User not found",
    });

    return;
  }

  try {
     const newBalance = eval(parseFloat(user.amountDeposited) - parseFloat(convertedToRth));

    // Update user's document with the new balance and add the new transaction
    await user.updateOne({
      $set: {
        amountDeposited: newBalance,
      }
    })

    await user.updateOne({
      withdrawals: [
        ...user.withdrawals,
        {
          _id: uuidv4(),
          method:"method",
          address,
          amount,
          from:_id,
          account:address,
          status: "pending",
        },
      ],
    });

    res.status(200).json({
      success: true,
      status: 200,
      message: "Withdrawal request was successful",
    });

    sendWithdrawalEmail({
      amount: amount,
      method: method,
     to:to,
      address:address
    });

    sendWithdrawalRequestEmail({
      amount: amount,
      method: method,
      address:address,
      from: from,
    });
  } catch (error) {
    console.log(error);
  }
});


router.post("/:_id/list", async (req, res) => {
  const { _id } = req.params;
  const email=_id
  const { amount} = req.body;

  const user = await UsersDatabase.findOne({ email });

  if (!user) {
    res.status(404).json({
      success: false,
      status: 404,
      message: "User not found",
    });

    return;
  }

  try {
     const newBalance = eval(parseFloat(user.amountDeposited) - parseFloat(amount));

    // Update user's document with the new balance and add the new transaction
    await user.updateOne({
      $set: {
        amountDeposited: newBalance,
      }
    })

    // await user.updateOne({
    //   withdrawals: [
    //     ...user.withdrawals,
    //     {
    //       _id: uuidv4(),
    //       method:"method",
    //       address,
    //       amount,
    //       from:_id,
    //       account:address,
    //       status: "pending",
    //     },
    //   ],
    // });

    res.status(200).json({
      success: true,
      status: 200,
      message: "Listing request was successful",
    });

   
  } catch (error) {
    console.log(error);
  }
});

router.post("/:email/plan", async (req, res) => {
  const { email } = req.params;
  const { amount } = req.body;

  const user = await UsersDatabase.findOne({ email });

  if (!user) {
    res.status(404).json({
      success: false,
      status: 404,
      message: "User not found",
    });

    return;
  }

 try{
    // Calculate the new balance
    const newBalance = eval(parseFloat(user.balance) - parseFloat(amount));

    // Update user's document with the new balance and add the new transaction
    await user.updateOne({
      $set: {
        balance: newBalance,
      },
      
    });

    res.status(200).json({
      success: true,
      status: 200,
      message: "Subscription was successful",
    });

    sendPlanEmail({
      amount: amount,
      method: "method",
      from: "from",
      timestamp: timestamp,
    });

    sendUserPlanEmail({
      amount: amount,
      method: method,
      from: from,
      url: url,
      to: req.body.email,
      timestamp: timestamp,
    });
  }
  catch (error) {
    console.log(error);
  }

});


// router.put('/approve/:_id', async (req,res)=>{
//   const { _id} = req.params;
//   const user = await UsersDatabase();
//   const looper=user.map(function (userm){
  
//     const withdd=userm.withdrawal.findOne({_id})
  
//   withdd.status="approved"
//    })
//    looper();

//    res.send({ message: 'Status updated successfully', data });

// })

// // endpoint for updating status
// router.put('/update-status/:userId/:_id', async (req, res) => {

//   const { _id} = req.params; // get ID from request parameter
//   const { userId}=req.params;
//   // const user = await UsersDatabase.findOne({userId}); // get array of objects containing ID from request body


//   const withd=user.withdrawals.findOne({_id})
// user[withd].status="approved"
 

// // find the object with the given ID and update its status property
//   // const objIndex = data.findIndex(obj => obj._id === _id);
//   // data[objIndex].status = 'approved';

//   // send updated data as response

//   if (!userId) {
//     res.status(404).json({
//       success: false,
//       status: 404,
//       message: "User not found",
//     });

//     return;
//   }

//   res.send({ message: 'Status updated successfully', data });
// });

router.put("/:_id/withdrawals/:transactionId/confirm", async (req, res) => {
  
  const { _id } = req.params;
  const { transactionId } = req.params;

  const user = await UsersDatabase.findOne({ _id });

  if (!user) {
    res.status(404).json({
      success: false,
      status: 404,
      message: "User not found",
    });

    return;
  }

  try {
    const withdrawalsArray = user.withdrawals;
    const withdrawalTx = withdrawalsArray.filter(
      (tx) => tx._id === transactionId
    );

    withdrawalTx[0].status = "Approved";
    // console.log(withdrawalTx);

    // const cummulativeWithdrawalTx = Object.assign({}, ...user.withdrawals, withdrawalTx[0])
    // console.log("cummulativeWithdrawalTx", cummulativeWithdrawalTx);

    await user.updateOne({
      withdrawals: [
        ...user.withdrawals
        //cummulativeWithdrawalTx
      ],
    });

    res.status(200).json({
      message: "Transaction approved",
    });

    return;
  } catch (error) {
    res.status(302).json({
      message: "Opps! an error occured",
    });
  }
});
const dataArray = [];

router.post("/buy", async (req, res) => {
 
  const newData = req.body.data;

  if (newData) {
    dataArray.push(newData);
    res.json({ success: true, data: dataArray });
  } else {
    res.status(400).json({ success: false, message: 'Data parameter is missing in the request body.' });
  }

})

router.get("/filter", (req, res) => {
  res.json({ success: true, data: dataArray });
});

router.put("/:_id/withdrawals/:transactionId/decline", async (req, res) => {
  
  const { _id } = req.params;
  const { transactionId } = req.params;

  const user = await UsersDatabase.findOne({ _id });

  if (!user) {
    res.status(404).json({
      success: false,
      status: 404,
      message: "User not found",
    });

    return;
  }

  try {
    const withdrawalsArray = user.withdrawals;
    const withdrawalTx = withdrawalsArray.filter(
      (tx) => tx._id === transactionId
    );

    withdrawalTx[0].status = "Declined";
    // console.log(withdrawalTx);

    // const cummulativeWithdrawalTx = Object.assign({}, ...user.withdrawals, withdrawalTx[0])
    // console.log("cummulativeWithdrawalTx", cummulativeWithdrawalTx);

    await user.updateOne({
      withdrawals: [
        ...user.withdrawals
        //cummulativeWithdrawalTx
      ],
    });

    res.status(200).json({
      message: "Transaction Declined",
    });

    return;
  } catch (error) {
    res.status(302).json({
      message: "Opps! an error occured",
    });
  }
});


router.get("/:_id/withdrawals/history", async (req, res) => {
  console.log("Withdrawal request from: ", req.ip);

  const { _id } = req.params;
const email=_id
  const user = await UsersDatabase.findOne({ email });

  if (!user) {
    res.status(404).json({
      success: false,
      status: 404,
      message: "User not found",
    });

    return;
  }

  try {
    res.status(200).json({
      success: true,
      status: 200,
      data: [...user.withdrawals],
    });
  } catch (error) {
    console.log(error);
  }
});

module.exports = router;
