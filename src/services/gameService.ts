import { db } from '../firebase/config';
import { doc, collection, getDocs, query, where, updateDoc, getDoc, setDoc, onSnapshot, arrayRemove, deleteField } from 'firebase/firestore';
import { Game, GameStatus, Player } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Word categories and words for the game
export const categories = {
  'Animals': ['Elephant', 'Tiger', 'Penguin', 'Dolphin', 'Koala', 'Giraffe', 'Kangaroo', 'Octopus'],
  'Countries': ['Japan', 'Brazil', 'Australia', 'France', 'Egypt', 'Canada', 'Mexico', 'India'],
  'Foods': ['Pizza', 'Sushi', 'Pasta', 'Burger', 'Taco', 'Curry', 'Pancake', 'Chocolate'],
  'Sports': ['Soccer', 'Basketball', 'Tennis', 'Swimming', 'Volleyball', 'Golf', 'Cricket', 'Surfing'],
  'Movies': ['Avatar', 'Titanic', 'Star Wars', 'Inception', 'Frozen', 'Avengers', 'Matrix', 'Jurassic Park'],
  'Professions': ['Doctor', 'Teacher', 'Chef', 'Pilot', 'Artist', 'Engineer', 'Firefighter', 'Scientist'],
};

// Generate a random 6-character join code
const generateJoinCode = (): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Get a random category and word
const getRandomCategoryAndWord = (): { category: string, word: string } => {
  const categoryNames = Object.keys(categories);
  const randomCategory = categoryNames[Math.floor(Math.random() * categoryNames.length)];
  const words = categories[randomCategory as keyof typeof categories];
  const randomWord = words[Math.floor(Math.random() * words.length)];
  return { category: randomCategory, word: randomWord };
};

// Create a new game
export const createGame = async (hostName: string): Promise<Game> => {
  try {
    console.log('Creating new game for host:', hostName);
    const gameId = uuidv4();
    const playerId = uuidv4();
    const joinCode = generateJoinCode();
    
    const newGame: Game = {
      id: gameId,
      joinCode,
      players: [{
        id: playerId,
        name: hostName,
        isChameleon: false,
        isReady: false,
        isHost: true
      }],
      status: GameStatus.WAITING,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    console.log('Game object created:', newGame);
    console.log('Attempting to write to Firestore...');
    
    const gameRef = doc(db, 'games', gameId);
    await setDoc(gameRef, newGame);
    
    console.log('Game successfully written to Firestore');
    
    return {
      ...newGame,
      players: [{
        id: playerId,
        name: hostName,
        isChameleon: false,
        isReady: false,
        isHost: true
      }]
    };
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
};

// Join an existing game
export const joinGame = async (joinCode: string, playerName: string): Promise<{game: Game, playerId: string}> => {
  try {
    console.log('Joining game with code:', joinCode, 'and player name:', playerName);
    const gamesRef = collection(db, 'games');
    const q = query(gamesRef, where('joinCode', '==', joinCode.toUpperCase()));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('Game not found with join code:', joinCode);
      throw new Error('Game not found');
    }
    
    const gameDoc = querySnapshot.docs[0];
    const game = gameDoc.data() as Game;
    console.log('Found game:', game);
    
    // Get the current state of players
    const currentGameRef = doc(db, 'games', game.id);
    const currentGameDoc = await getDoc(currentGameRef);
    const currentGame = currentGameDoc.data() as Game;
    const currentPlayers = currentGame.players || [];
    console.log('Current players in game:', currentPlayers);
    
    const playerId = uuidv4();
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      isChameleon: false,
      isReady: false,
      isHost: false
    };
    
    // Add player to the updated array instead of using arrayUnion
    const updatedPlayers = [...currentPlayers, newPlayer];
    console.log('Updated players array:', updatedPlayers);
    
    await updateDoc(currentGameRef, {
      players: updatedPlayers,
      updatedAt: Date.now()
    });
    console.log('Game document updated with new player');
    
    // Get the updated game to return
    const updatedGameDoc = await getDoc(currentGameRef);
    const updatedGame = updatedGameDoc.data() as Game;
    
    return { game: updatedGame, playerId };
  } catch (error) {
    console.error('Error joining game:', error);
    throw error;
  }
};

// Start a game
export const startGame = async (gameId: string): Promise<Game> => {
  const gameRef = doc(db, 'games', gameId);
  const gameDoc = await getDoc(gameRef);
  
  if (!gameDoc.exists()) {
    throw new Error('Game not found');
  }
  
  const game = gameDoc.data() as Game;
  
  if (game.players.length < 2) {
    throw new Error('Not enough players to start the game');
  }
  
  // Randomly select a chameleon
  const randomPlayerIndex = Math.floor(Math.random() * game.players.length);
  const chameleonId = game.players[randomPlayerIndex].id;
  
  // Select a random category and word
  const { category, word } = getRandomCategoryAndWord();
  
  // Update player statuses and set chameleon
  const updatedPlayers = game.players.map(player => ({
    ...player,
    isChameleon: player.id === chameleonId,
    isReady: true
  }));
  
  const updatedGame: Partial<Game> = {
    status: GameStatus.PLAYING,
    players: updatedPlayers,
    currentCategory: category,
    currentWord: word,
    chameleonId,
    updatedAt: Date.now()
  };
  
  await updateDoc(gameRef, updatedGame);
  
  return { ...game, ...updatedGame };
};

// End the current game and reset for a new round
export const restartGame = async (gameId: string): Promise<Game> => {
  const gameRef = doc(db, 'games', gameId);
  const gameDoc = await getDoc(gameRef);
  
  if (!gameDoc.exists()) {
    throw new Error('Game not found');
  }
  
  const game = gameDoc.data() as Game;
  
  // Reset player statuses
  const updatedPlayers = game.players.map(player => ({
    ...player,
    isChameleon: false,
    isReady: false
  }));
  
  // Use deleteField() to remove fields from Firestore
  const updatedGame: any = {
    status: GameStatus.WAITING,
    players: updatedPlayers,
    currentCategory: deleteField(),
    currentWord: deleteField(),
    chameleonId: deleteField(),
    updatedAt: Date.now()
  };
  
  await updateDoc(gameRef, updatedGame);
  
  return { ...game, ...updatedGame };
};

// Leave a game
export const leaveGame = async (gameId: string, playerId: string): Promise<void> => {
  const gameRef = doc(db, 'games', gameId);
  const gameDoc = await getDoc(gameRef);
  
  if (!gameDoc.exists()) {
    return; // Game doesn't exist, nothing to do
  }
  
  const game = gameDoc.data() as Game;
  const player = game.players.find(p => p.id === playerId);
  
  if (!player) {
    return; // Player not in game, nothing to do
  }
  
  if (player.isHost && game.players.length > 1) {
    // If the host is leaving, assign a new host
    const remainingPlayers = game.players.filter(p => p.id !== playerId);
    
    const updatedPlayers = remainingPlayers.map((p, index) => 
      index === 0 ? { ...p, isHost: true } : p
    );
    
    await updateDoc(gameRef, {
      players: updatedPlayers,
      updatedAt: Date.now()
    });
  } else if (player.isHost && game.players.length === 1) {
    // If the host is the only player, delete the game
    // This could be implemented if needed
  } else {
    // Remove the player from the game
    await updateDoc(gameRef, {
      players: arrayRemove(player),
      updatedAt: Date.now()
    });
  }
};

// Subscribe to game updates
export const subscribeToGame = (gameId: string, callback: (game: Game) => void): (() => void) => {
  const gameRef = doc(db, 'games', gameId);
  
  return onSnapshot(gameRef, (doc) => {
    if (doc.exists()) {
      callback(doc.data() as Game);
    }
  });
};

// Mark a player as ready
export const setPlayerReady = async (gameId: string, playerId: string, isReady: boolean): Promise<void> => {
  const gameRef = doc(db, 'games', gameId);
  const gameDoc = await getDoc(gameRef);
  
  if (!gameDoc.exists()) {
    throw new Error('Game not found');
  }
  
  const game = gameDoc.data() as Game;
  const updatedPlayers = game.players.map(player => 
    player.id === playerId ? { ...player, isReady } : player
  );
  
  await updateDoc(gameRef, {
    players: updatedPlayers,
    updatedAt: Date.now()
  });
};
