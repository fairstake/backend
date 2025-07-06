const mongoose = require('mongoose');
const PlinkoGame = require('../../../models/games/plinko/plinko_gameV2');
const PlinkoHistory = require('../../../models/games/plinko/plinko_game_history');
const PlinkoEncrypt = require('../../../models/games/plinko/plinko_encryped_seeds');
const Profile = require('../../../models/user.model');
const utils = require('./plinkoGameUtils');

async function handleUpdateWallet(data, emitter) {
  let balance = 0, prev_bal = 0;
  let bet_amount = parseFloat(data.betAmount);
  let getBalance = await Profile.findById(data._id);
  prev_bal = parseFloat(getBalance.balance);
  if (!data.won && prev_bal < bet_amount) {
    throw new Error('Not enough balance!');
  }
  balance = prev_bal + (data.won ? parseFloat(data.profit) : -bet_amount);
  emitter('plinko-wallet', [{ ...data, balance }]);
  await Profile.findByIdAndUpdate(data._id, { balance });
  return balance;
}

function getPayout(betValue, path, PAYOUTS) {
  const { risk, rows } = betValue;
  const payouts = PAYOUTS[risk][rows];
  return payouts[path.map(p => Math.round(p)).reduce((t, e) => t + e, 0)];
}

async function handleBet(data, emitter, PAYOUTS, calculateProbabilities) {
  const { _id, betValue } = data;
  
  // Find or create seeds
  let seeds = await PlinkoEncrypt.findOne({ is_open: false, user_id: _id }).sort({ _id: -1 });
  if (!seeds) {
    const serverSeed = utils.generateServerSeed();
    const hash_seed = utils.hashServerSeed(serverSeed);
    const n_serverSeed = utils.generateServerSeed();
    const n_hash_seed = utils.hashServerSeed(n_serverSeed);
    [seeds] = await PlinkoEncrypt.create([
      {
        server_seed: serverSeed,
        hash_seed,
        user_id: _id,
        client_seed: utils.generateRandomString(10),
        next_hash_seed: n_hash_seed,
        next_server_seed: n_serverSeed,
      },
    ]);
  }
  
  // Generate path and calculate odds
  const path = utils.generatePlinkoBallPath(seeds.client_seed, seeds.nonce, seeds.server_seed, betValue.rows);
  const odds = getPayout(betValue, path, PAYOUTS);
  const isWon = odds >= 1;
  const profit = isWon ? parseFloat(data.betAmount) * odds - parseFloat(data.betAmount) : -parseFloat(data.betAmount);
  
  // Create game record - adjusted to match the model
  const game = await PlinkoGame.create({
    user_id: _id,
    seed_id: seeds.seed_id || 1, // Fallback if seed_id is not available
    bet_amount: parseFloat(data.betAmount),
    token: data.currencyName,
    token_img: data.currencyImage,
    payout: odds,
    risk: parseInt(betValue.risk), // Ensure risk is a number
    rows: betValue.rows,
    chance: calculateProbabilities(8, 16)[betValue.rows][PAYOUTS[betValue.risk][betValue.rows].indexOf(odds)],
    won: isWon,
    profit: profit,
    path: path,
    nonce: seeds.nonce + 1,
    time: new Date()
  });
  
  // Update wallet
  const balance = await handleUpdateWallet(
    {
      ...data,
      token: data.currencyName,
      betAmount: parseFloat(data.betAmount),
      won: isWon,
      profit: profit,
    },
    emitter
  );
  
  // Update seed nonce and create history record
  await PlinkoEncrypt.updateOne({ seed_id: seeds.seed_id }, { $inc: { nonce: 1 } });
  
  // Create history record if PlinkoHistory model exists
  try {
    await PlinkoHistory.create({
      bet_id: game.bet_id,
      bet_amount: parseFloat(data.betAmount),
      token: data.currencyName,
      token_img: data.currencyImage,
      user_id: _id,
      payout: odds,
      won: isWon,
      time: new Date()
    });
  } catch (error) {
    console.error("Error creating PlinkoHistory:", error);
    // Continue execution even if history creation fails
  }
  
  return {
    betId: game.bet_id,
    userId: _id,
    name: data.name,
    hidden: data.hidden,
    avatar: data.avatar,
    chance: game.chance,
    currencyName: data.currencyName,
    currencyImage: data.currencyImage,
    betAmount: data.betAmount,
    winAmount: isWon ? parseFloat(data.betAmount) * odds : 0,
    odds,
    betTime: game.time,
    gameValue: {
      path: path.map(p => Math.round(p)).join(''),
      risk: betValue.risk,
      row: betValue.rows,
    },
  };
}

async function getRecentBets(data = {}) {
  try {
    const bets = await PlinkoHistory.find(data)
      .sort({ _id: -1 })
      .limit(15)
      .lean();
      
    return Promise.all(
      bets.map(async (bet) => {
        return utils.populateUser({
          ...bet,
          betId: bet.bet_id,
          betAmount: bet.bet_amount,
          currencyImage: bet.token_img,
          currencyName: bet.token,
          odds: bet.payout,
          betTime: bet.time,
        });
      })
    );
  } catch (error) {
    console.error("Error getting recent bets:", error);
    return [];
  }
}

module.exports = {
  handleBet,
  getRecentBets,
  handleUpdateWallet,
  getPayout,
};
