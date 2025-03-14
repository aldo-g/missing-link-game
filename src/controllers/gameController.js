const wordSets = require('../models/wordSets');
const aiJudge = require('../utils/aiJudge');

// Store active games in memory (in a real app, use a database)
const activeGames = new Map();

exports.startNewGame = (req, res) => {
  try {
    // Get a random word set based on the date
    // This ensures all users get the same puzzle on the same day
    const today = new Date().toDateString();
    const seed = today.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const wordSetIndex = seed % wordSets.getTotalWordSets();
    const wordSet = wordSets.getWordSetByIndex(wordSetIndex);
    
    // Create a game ID
    const gameId = Date.now().toString();
    
    // Store the game state
    activeGames.set(gameId, {
      words: wordSet.words.slice(0, 3), // Start with 3 words
      hiddenLink: wordSet.link,
      remainingWords: wordSet.words.slice(3), // Keep remaining words for hints
      lives: 3,
      guesses: []
    });
    
    // Return the game data
    return res.status(200).json({
      success: true,
      gameId,
      words: activeGames.get(gameId).words,
      lives: activeGames.get(gameId).lives
    });
  } catch (error) {
    console.error('Error starting new game:', error);
    return res.status(500).json({ success: false, message: 'Failed to start new game' });
  }
};

exports.submitGuess = async (req, res) => {
  try {
    const { gameId, guess } = req.body;
    
    // Validate inputs
    if (!gameId || !guess) {
      return res.status(400).json({ success: false, message: 'Game ID and guess are required' });
    }
    
    // Get the game state
    const game = activeGames.get(gameId);
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }
    
    // Add to guesses history
    game.guesses.push(guess);
    
    // Use AI to judge the guess
    const judgement = await aiJudge.evaluateGuess(game.words, game.hiddenLink, guess);
    
    // Update the game state based on the judgement
    if (judgement.isCorrect) {
      // Correct guess
      return res.status(200).json({
        success: true,
        result: 'correct',
        message: 'Congratulations! You found the hidden link!'
      });
    } else if (judgement.isReasonable) {
      // Reasonable but incorrect guess
      // Add a new word as a hint
      if (game.remainingWords.length > 0) {
        const nextWord = judgement.suggestedWord || game.remainingWords.shift();
        game.words.push(nextWord);
      }
      
      return res.status(200).json({
        success: true,
        result: 'reasonable',
        message: 'That\'s a reasonable connection, but not what we\'re looking for.',
        words: game.words
      });
    } else {
      // Irrelevant guess
      game.lives -= 1;
      
      if (game.lives <= 0) {
        return res.status(200).json({
          success: true,
          result: 'game_over',
          message: 'Game over! The hidden link was: ' + game.hiddenLink,
          hiddenLink: game.hiddenLink
        });
      }
      
      return res.status(200).json({
        success: true,
        result: 'irrelevant',
        message: 'That doesn\'t seem to connect these words. You lost a life!',
        lives: game.lives
      });
    }
  } catch (error) {
    console.error('Error submitting guess:', error);
    return res.status(500).json({ success: false, message: 'Failed to process guess' });
  }
};

exports.getHint = (req, res) => {
  try {
    const { gameId } = req.params;
    
    // Get the game state
    const game = activeGames.get(gameId);
    if (!game) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }
    
    // Check if there are any remaining words
    if (game.remainingWords.length === 0) {
      return res.status(200).json({
        success: false,
        message: 'No more hints available'
      });
    }
    
    // Add a new word as a hint
    const nextWord = game.remainingWords.shift();
    game.words.push(nextWord);
    
    return res.status(200).json({
      success: true,
      words: game.words
    });
  } catch (error) {
    console.error('Error getting hint:', error);
    return res.status(500).json({ success: false, message: 'Failed to get hint' });
  }
};