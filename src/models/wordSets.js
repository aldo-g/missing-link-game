const fs = require('fs');
const path = require('path');

// In a production app, this would be a database
let wordSets = [];

// Load word sets from JSON file
try {
  const dataPath = path.join(__dirname, '../data/wordSets.json');
  const data = fs.readFileSync(dataPath, 'utf8');
  wordSets = JSON.parse(data);
} catch (error) {
  console.error('Error loading word sets:', error);
  // Initialize with some sample data if file doesn't exist
  wordSets = [
    {
      words: ['Crane', 'Bodybuilder', 'Elevator', 'Updraft', 'Forklift', 'Jack'],
      link: 'things that lift'
    },
    {
      words: ['Apple', 'Earth', 'Newton', 'Gravity', 'Fall', 'Orbit'],
      link: 'things related to gravity'
    },
    {
      words: ['Book', 'Tree', 'Website', 'Newspaper', 'Brochure', 'Manual'],
      link: 'things made from paper or contain pages'
    }
  ];
  
  // Save the sample data
  try {
    if (!fs.existsSync(path.join(__dirname, '../data'))) {
      fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
    }
    fs.writeFileSync(
      path.join(__dirname, '../data/wordSets.json'),
      JSON.stringify(wordSets, null, 2),
      'utf8'
    );
  } catch (saveError) {
    console.error('Error saving sample word sets:', saveError);
  }
}

// Get a random word set
exports.getRandomWordSet = () => {
  const randomIndex = Math.floor(Math.random() * wordSets.length);
  return wordSets[randomIndex];
};

// Get word set by index
exports.getWordSetByIndex = (index) => {
  return wordSets[index % wordSets.length];
};

// Get total number of word sets
exports.getTotalWordSets = () => {
  return wordSets.length;
};

// Add a new word set
exports.addWordSet = (newWordSet) => {
  wordSets.push(newWordSet);
  
  // Save to file
  try {
    fs.writeFileSync(
      path.join(__dirname, '../data/wordSets.json'),
      JSON.stringify(wordSets, null, 2),
      'utf8'
    );
    return true;
  } catch (error) {
    console.error('Error saving word sets:', error);
    return false;
  }
};