import { db } from '../firebase/config';
import { doc, collection, getDocs, query, where, updateDoc, getDoc, setDoc, onSnapshot, deleteField } from 'firebase/firestore';
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
  
  // If there's only one player, mark the game as ended
  if (game.players.length === 1) {
    await updateDoc(gameRef, { status: GameStatus.ENDED });
    return;
  }
  
  // Remove the player from the game
  let updatedPlayers = game.players.filter(p => p.id !== playerId);
  
  // If the leaving player was the host, assign a new host
  if (player.isHost && updatedPlayers.length > 0) {
    console.log('Host is leaving, assigning new host');
    // Assign the first remaining player as the new host
    updatedPlayers = updatedPlayers.map((p, index) => ({
      ...p,
      isHost: index === 0 // Make the first player the new host
    }));
  }
  
  await updateDoc(gameRef, {
    players: updatedPlayers,
    updatedAt: Date.now()
  });
};

// Kick a player (host only)
export const kickPlayer = async (gameId: string, playerIdToKick: string): Promise<void> => {
  const gameRef = doc(db, 'games', gameId);
  const gameDoc = await getDoc(gameRef);
  
  if (!gameDoc.exists()) {
    throw new Error('Game not found');
  }
  
  const game = gameDoc.data() as Game;
  
  // Make sure the player to kick exists and is not the host
  const playerToKick = game.players.find(p => p.id === playerIdToKick);
  if (!playerToKick) {
    throw new Error('Player not found');
  }
  
  if (playerToKick.isHost) {
    throw new Error('Cannot kick the host');
  }
  
  // Remove the player from the game
  const updatedPlayers = game.players.filter(p => p.id !== playerIdToKick);
  
  await updateDoc(gameRef, {
    players: updatedPlayers,
    updatedAt: Date.now()
  });
};

// Handle page unload events (back button, refresh, tab close)
// We need to store pending leave info to process on next app load
export const handlePageUnload = (gameId: string, playerId: string): void => {
  try {
    // Store info about the player leaving in localStorage
    // This will be processed on next app load
    localStorage.setItem('pendingLeave', JSON.stringify({
      gameId,
      playerId,
      timestamp: Date.now()
    }));
    
    // Clear game session data
    localStorage.removeItem('gameId');
    localStorage.removeItem('playerId');
  } catch (error) {
    console.error('Error during page unload:', error);
  }
};

// Process any pending leave operations from previous sessions
// This should be called when the app initializes
export const processPendingLeave = async (): Promise<void> => {
  try {
    const pendingLeaveData = localStorage.getItem('pendingLeave');
    if (pendingLeaveData) {
      const { gameId, playerId, timestamp } = JSON.parse(pendingLeaveData);
      
      // Only process if it's less than 1 hour old
      if (Date.now() - timestamp < 60 * 60 * 1000) {
        console.log('Processing pending leave operation for player', playerId);
        await leaveGame(gameId, playerId);
      }
      
      // Clear the pending leave data
      localStorage.removeItem('pendingLeave');
    }
  } catch (error) {
    console.error('Error processing pending leave:', error);
    localStorage.removeItem('pendingLeave'); // Clear it to avoid repeated errors
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
