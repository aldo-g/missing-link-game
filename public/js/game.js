document.addEventListener('DOMContentLoaded', () => {
  // DOM elements
  const wordContainer = document.getElementById('word-container');
  const guessInput = document.getElementById('guess-input');
  const submitGuessBtn = document.getElementById('submit-guess');
  const messageContainer = document.getElementById('message-container');
  const nextGameInfo = document.getElementById('next-game-info');
  const lifeElements = document.querySelectorAll('.life');
  
  // Game state
  let gameState = {
    gameId: null,
    words: [],
    lives: 3
  };
  
  // Start a new game
  async function startNewGame() {
    try {
      // Reset UI
      messageContainer.textContent = '';
      messageContainer.className = '';
      guessInput.value = '';
      guessInput.disabled = false;
      submitGuessBtn.disabled = false;
      
      // Get new game from server
      const response = await fetch('/api/game/new-game');
      const data = await response.json();
      
      if (data.success) {
        // Update game state
        gameState.gameId = data.gameId;
        gameState.words = data.words;
        gameState.lives = data.lives;
        
        // Update UI
        updateWordsDisplay();
        updateLivesDisplay();
      } else {
        showMessage(data.message, 'message-error');
      }
    } catch (error) {
      console.error('Error starting new game:', error);
      showMessage('Failed to start new game. Please try again.', 'message-error');
    }
  }
  
  // Update the words display
  function updateWordsDisplay() {
    wordContainer.innerHTML = '';
    gameState.words.forEach((word, index) => {
      const wordCard = document.createElement('div');
      wordCard.className = 'word-card';
      
      // Add custom angle for more than 3 words
      if (gameState.words.length > 3) {
        if (index === 0) wordCard.classList.add('left-slant');
        if (index === gameState.words.length - 1) wordCard.classList.add('right-slant');
      }
      
      // Apply curved positioning
      const totalWords = gameState.words.length;
      const isMiddleCard = index === Math.floor(totalWords / 2) && totalWords % 2 !== 0;
      
      // Calculate vertical position based on curve - flipped to arc upward at the edges
      if (totalWords === 3) {
        if (index === 1) { // Middle card goes lower
          wordCard.style.transform = 'translateY(20px)';
        }
      } else if (totalWords > 3) {
        // Calculate a parabolic curve with the middle lowest
        const position = index / (totalWords - 1); // 0 to 1
        const yOffset = Math.round(20 * (4 * position * (1 - position))); // Parabolic function
        wordCard.style.transform = `translateY(${yOffset}px)`;
      }
      
      wordCard.textContent = word;
      wordContainer.appendChild(wordCard);
      
      // Add a small delay before showing each card for a nice animation effect
      setTimeout(() => {
        wordCard.style.opacity = '1';
      }, 100 * (wordContainer.children.length));
    });
    
    // Update the connections after adding words
    updateConnections();
  }
  
  // Create visual connections between the circle and the words
  function updateConnections() {
    // This function adjusts connection angles based on word count
    const cards = wordContainer.querySelectorAll('.word-card');
    
    // For exactly 3 cards, set specific angles
    if (cards.length === 3) {
      cards[0].style.setProperty('--connection-angle', '28deg');
      cards[1].style.setProperty('--connection-angle', '0deg');
      cards[2].style.setProperty('--connection-angle', '-28deg');
    }
    // For more than 3 cards, distribute angles
    else if (cards.length > 3) {
      const maxAngle = 38;
      cards.forEach((card, i) => {
        const angle = maxAngle - (i * (2 * maxAngle / (cards.length - 1)));
        card.style.setProperty('--connection-angle', `${angle}deg`);
      });
    }
  }
  
  // Update the lives display
  function updateLivesDisplay() {
    lifeElements.forEach((life, index) => {
      if (index < gameState.lives) {
        life.classList.remove('lost');
      } else {
        life.classList.add('lost');
      }
    });
  }
  
  // Submit a guess
  async function submitGuess() {
    const guess = guessInput.value.trim();
    
    if (!guess) {
      showMessage('Please enter a guess', 'message-error');
      return;
    }
    
    try {
      const response = await fetch('/api/game/submit-guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gameId: gameState.gameId,
          guess: guess
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Mark that the user has played today
        setLastPlayed();
        
        // Handle different results
        switch(data.result) {
          case 'correct':
            showMessage(data.message, 'message-correct');
            disableGameplay();
            showNextGameTime();
            break;
            
          case 'reasonable':
            showMessage(data.message, 'message-reasonable');
            gameState.words = data.words;
            updateWordsDisplay();
            break;
            
          case 'irrelevant':
            showMessage(data.message, 'message-irrelevant');
            gameState.lives = data.lives;
            updateLivesDisplay();
            break;
            
          case 'game_over':
            showMessage(data.message, 'message-gameover');
            disableGameplay();
            showNextGameTime();
            break;
            
          default:
            showMessage(data.message);
        }
        
        // Clear input
        guessInput.value = '';
      } else {
        showMessage(data.message, 'message-error');
      }
    } catch (error) {
      console.error('Error submitting guess:', error);
      showMessage('Failed to submit guess. Please try again.', 'message-error');
    }
  }
  
  // Hint functionality removed
  
  // Show a message
  function showMessage(message, className = '') {
    messageContainer.textContent = message;
    messageContainer.className = 'message-container';
    if (className) {
      messageContainer.classList.add(className);
    }
  }
  
  // Disable gameplay after win or loss
  function disableGameplay() {
    guessInput.disabled = true;
    submitGuessBtn.disabled = true;
  }
  
  // Event listeners
  submitGuessBtn.addEventListener('click', submitGuess);
  
  // Allow submitting with Enter key
  guessInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      submitGuess();
    }
  });
  
  // Start a game when the page loads
  startNewGame();
});