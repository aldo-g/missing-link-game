const express = require('express');
const gameController = require('../controllers/gameController');

const router = express.Router();

// Get a new word set
router.get('/new-game', gameController.startNewGame);

// Submit a guess
router.post('/submit-guess', gameController.submitGuess);

// Get a hint (add fourth word)
router.get('/hint/:gameId', gameController.getHint);

module.exports = router;