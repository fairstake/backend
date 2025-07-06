const mongoose = require('mongoose');
const USDTWALLET = require('../models/user.model');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const Bills = require('../models/bill');

/**
 * Update user wallet balance
 * @param {Object} data - Wallet update data
 * @param {string} data.userId - User ID
 * @param {string} data.currency - Currency code
 * @param {number} data.amount - Amount to update
 * @param {string} data.operation - Operation type ('add' or 'subtract')
 * @param {string} data.transactionType - Transaction type for bill record
 * @returns {Promise<Object>} - Updated wallet
 */
const updateWalletBalance = async (data) => {
  const { userId, currency, amount,amountUSD,  operation, transactionType } = data;
  console.log("It has reached wallet service")
  console.log(data)
  // Start a transaction to ensure data consistency
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    let wallet;
    let tokenImg;
    let tokenName;
    let convertAmount;
    // Determine which wallet to update based on currency

    wallet = await USDTWALLET.findById(userId).session(session);
    
    if (!wallet) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Wallet not found');
    }
    
    tokenImg = wallet.coin_image;
    tokenName = currency;
    
    // Handle currency conversion
    if (currency === "TETH") {
      convertAmount = ( 2425.64 * parseFloat(amount)).toFixed(7)
      console.log("convertAmount " + (2425.64 * parseFloat(amount)).toFixed(6) )
      console.log("convertAmount " + (convertAmount) )
    } else {
      // Use the conversion service for other currencies
      convertAmount = parseFloat(amountUSD)
    }
    
    console.log("Converted amount:", convertAmount);
    
    if (convertAmount === null || convertAmount === undefined) {
      console.log('Invalid currency conversion')
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid currency conversion');
    }
    
    // Calculate new balance
    let newBalance;
    if (operation === 'add') {
      newBalance = parseFloat(wallet.balance) + parseFloat(convertAmount);
    } else if (operation === 'subtract') {
      if (parseFloat(wallet.balance) < parseFloat(convertAmount)) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Insufficient balance');
      }
      newBalance = parseFloat(wallet.balance) - convertAmount;
    } else {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid operation');
    }
    
    console.log("New balance:", newBalance);
    
    // Update wallet balance - adding new:true to return the updated document
    const result = await USDTWALLET.findByIdAndUpdate(
      userId,
      { balance: newBalance },
      { new: true, session }
    );

    console.log("Update result:", result);
    
    if (!result) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to update wallet');
    }
  
    // Create bill record
    const billId = Math.floor(Math.random() * 1000000000);
    const billData = {
      user_id: userId,
      transaction_type: transactionType,
      token_img: tokenImg || "",
      token_name: tokenName,
      balance: newBalance,
      trx_amount: convertAmount,
      bill_id: billId,
      datetime: new Date(),
      status: true
    };

    const newBill = await Bills.create([billData], { session });
    console.log("Created bill:", newBill);
    
    // Commit the transaction
    await session.commitTransaction();
    session.endSession();
    
    // Return the updated wallet
    return result;

  } catch (error) {
    // Abort the transaction on error
    await session.abortTransaction();
    session.endSession();
    console.error("Error in updateWalletBalance:", error);
    throw error;
  }
};

module.exports = {
  updateWalletBalance
};
