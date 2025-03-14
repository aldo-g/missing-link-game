const axios = require('axios');
require('dotenv').config();

// This function will call an AI API to evaluate the user's guess
exports.evaluateGuess = async (words, correctLink, userGuess) => {
  try {
    // In a real implementation, you would call your AI service (Claude, DeepSeek, etc.)
    // For now, we'll implement a simple logic-based evaluation
    
    // Option 1: Call external AI API
    if (process.env.USE_AI_API === 'true' && process.env.AI_API_KEY) {
      const response = await callAiService(words, correctLink, userGuess);
      return response;
    }
    
    // Option 2: Simple evaluation logic
    return simpleEvaluation(words, correctLink, userGuess);
  } catch (error) {
    console.error('Error evaluating guess:', error);
    // Fallback to simple evaluation
    return simpleEvaluation(words, correctLink, userGuess);
  }
};

// Simple string-based evaluation (fallback)
function simpleEvaluation(words, correctLink, userGuess) {
  // Clean and normalize strings for comparison
  const normalizedCorrect = correctLink.toLowerCase().trim();
  const normalizedGuess = userGuess.toLowerCase().trim();
  
  // Check if the guess is correct (exact match or very close)
  if (normalizedGuess === normalizedCorrect || 
      normalizedCorrect.includes(normalizedGuess) || 
      normalizedGuess.includes(normalizedCorrect)) {
    return {
      isCorrect: true,
      isReasonable: true,
      reasoning: "The guess correctly identifies the hidden link."
    };
  }
  
  // Check if the guess is reasonable
  // This is a simplified approach - a real AI would do much better
  const wordsLower = words.map(word => word.toLowerCase());
  const guessWords = normalizedGuess.split(/\s+/);
  
  // Check if any word in the guess connects at least 2 of the provided words
  // This is very simplified logic
  let connectionCount = 0;
  for (const word of wordsLower) {
    if (guessWords.some(gw => word.includes(gw) || gw.includes(word))) {
      connectionCount++;
    }
  }
  
  if (connectionCount >= 2) {
    // Suggest a fourth word that reinforces the correct link
    // In a real implementation, this would come from the AI
    return {
      isCorrect: false,
      isReasonable: true,
      reasoning: "The guess connects some of the words, but isn't the intended link.",
      suggestedWord: null // This would come from your word set or AI
    };
  }
  
  // If we get here, the guess is not reasonable
  return {
    isCorrect: false,
    isReasonable: false,
    reasoning: "The guess doesn't seem to connect the words."
  };
}

// Function to call an external AI service
async function callAiService(words, correctLink, userGuess) {
  try {
    // Example using a generic API endpoint
    // Replace with your specific AI provider's API details
    const response = await axios.post(
      process.env.AI_API_ENDPOINT,
      {
        words: words,
        correctLink: correctLink,
        userGuess: userGuess
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.AI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error calling AI service:', error);
    throw error;
  }
}