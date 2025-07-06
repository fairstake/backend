const express = require('express');
const router = express.Router();
const SportController = require('../../controllers/sport/controller');
const sportController = new SportController();

/**
 * @route   GET /api/sport/all
 * @desc    Get all sports
 * @access  Public
 */
router.get('/all', sportController.getAllSports.bind(sportController));

/**
 * @route   GET /api/sport/:sportId
 * @desc    Get specific sport by ID
 * @access  Public
 */
router.get('/:sportID', sportController.getSportById.bind(sportController));

/**
 * @route   GET /api/sport/:sportId/leagues
 * @desc    Get leagues for a specific sport
 * @access  Public
 */
router.get('/:sportID/leagues', sportController.getLeaguesBySport.bind(sportController));

/**
 * @route   GET /api/sport/:sportId/games
 * @desc    Get games for a specific sport
 * @access  Public
 */
router.get('/:sportId/games', sportController.getGamesBySport.bind(sportController));

/**
 * @route   GET /api/sport/:sportId/games
 * @desc    Get games for a specific sport
 * @access  Public
 */
router.get('/event/:leagueID', sportController.getEventGame.bind(sportController));

/**
 * @route   GET /api/sport/league/:leagueId/games
 * @desc    Get games for a specific league
 * @access  Public
 */
router.get('/league/:leagueId/games', sportController.getGamesByLeague.bind(sportController));

/**
 * @route   GET /api/sport/game/:gameId/odds
 * @desc    Get odds for a specific game
 * @access  Public
 */
router.get('/game/:gameId/odds', sportController.getGameOdds.bind(sportController));

/**
 * @route   GET /api/sport/games/live
 * @desc    Get live games
 * @access  Public
 */
router.get('/games/live', sportController.getLiveGames.bind(sportController));

/**
 * @route   GET /api/sport/games/upcoming
 * @desc    Get upcoming games (with optional query parameters)
 * @access  Public
 */
router.get('/games/upcoming', sportController.getUpcomingGames.bind(sportController));

module.exports = router;