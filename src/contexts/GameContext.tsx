import React, { createContext, useContext, useState, useEffect } from 'react';
import { Game, Player } from '../types';
import { subscribeToGame, createGame, joinGame, startGame, restartGame, leaveGame, setPlayerReady, kickPlayer, processPendingLeave } from '../services/gameService';

interface GameContextType {
  game: Game | null;
  currentPlayer: Player | null;
  isLoading: boolean;
  error: string | null;
  createNewGame: (hostName: string) => Promise<void>;
  joinExistingGame: (joinCode: string, playerName: string) => Promise<void>;
  startCurrentGame: (customCategory?: { category: string; words: string[] }) => Promise<void>;
  restartCurrentGame: () => Promise<void>;
  leaveCurrentGame: () => Promise<void>;
  setReady: (isReady: boolean) => Promise<void>;
  kickPlayer: (playerIdToKick: string) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const useGame = () => {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [game, setGame] = useState<Game | null>(null);
  const [currentPlayer, setCurrentPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Process any pending leave operations first
  useEffect(() => {
    // This handles players who closed the browser or refreshed
    processPendingLeave().catch(err => {
      console.error('Error processing pending leave:', err);
    });
  }, []);

  // Clean up game subscription on unmount
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    // Restore game session from localStorage if exists
    const storedGameId = localStorage.getItem('gameId');
    const storedPlayerId = localStorage.getItem('playerId');

    if (storedGameId && storedPlayerId) {
      setIsLoading(true);
      unsubscribe = subscribeToGame(storedGameId, (updatedGame) => {
        setGame(updatedGame);
        const player = updatedGame.players.find(p => p.id === storedPlayerId);
        if (player) {
          setCurrentPlayer(player);
        } else {
          // Player no longer in game, clear localStorage
          localStorage.removeItem('gameId');
          localStorage.removeItem('playerId');
          setCurrentPlayer(null);
        }
        setIsLoading(false);
      });
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const createNewGame = async (hostName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('GameContext: Creating new game for host:', hostName);
      const newGame = await createGame(hostName);
      console.log('GameContext: Game created successfully:', newGame);
      setGame(newGame);
      
      const hostPlayer = newGame.players[0];
      setCurrentPlayer(hostPlayer);
      
      // Save game session to localStorage
      localStorage.setItem('gameId', newGame.id);
      localStorage.setItem('playerId', hostPlayer.id);
      
      console.log('GameContext: Setting up subscription for game:', newGame.id);
      // Subscribe to game updates
      subscribeToGame(newGame.id, (updatedGame) => {
        console.log('GameContext: Received game update:', updatedGame);
        setGame(updatedGame);
        const player = updatedGame.players.find(p => p.id === hostPlayer.id);
        if (player) {
          setCurrentPlayer(player);
        }
      });
      
      setIsLoading(false);
    } catch (err) {
      console.error('GameContext: Error creating game:', err);
      setError(err instanceof Error ? err.message : 'Failed to create game');
      setIsLoading(false);
    }
  };

  const joinExistingGame = async (joinCode: string, playerName: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { game: joinedGame, playerId } = await joinGame(joinCode, playerName);
      setGame(joinedGame);
      
      const player = joinedGame.players.find(p => p.id === playerId);
      if (player) {
        setCurrentPlayer(player);
      }
      
      // Save game session to localStorage
      localStorage.setItem('gameId', joinedGame.id);
      localStorage.setItem('playerId', playerId);
      
      // Subscribe to game updates
      subscribeToGame(joinedGame.id, (updatedGame) => {
        setGame(updatedGame);
        const player = updatedGame.players.find(p => p.id === playerId);
        if (player) {
          setCurrentPlayer(player);
        }
      });
      
      setIsLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  const startCurrentGame = async (customCategory?: { category: string; words: string[] }) => {
    if (!game || !currentPlayer || !currentPlayer.isHost) {
      setError('You are not authorized to start the game');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await startGame(game.id, customCategory);
      
      setIsLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  const restartCurrentGame = async () => {
    if (!game || !currentPlayer || !currentPlayer.isHost) {
      setError('You are not authorized to restart the game');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await restartGame(game.id);
      
      setIsLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  const leaveCurrentGame = async () => {
    if (!game || !currentPlayer) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await leaveGame(game.id, currentPlayer.id);
      
      // Clear game session
      localStorage.removeItem('gameId');
      localStorage.removeItem('playerId');
      
      setGame(null);
      setCurrentPlayer(null);
      
      setIsLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  const setReady = async (isReady: boolean): Promise<void> => {
    if (!game || !currentPlayer) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await setPlayerReady(game.id, currentPlayer.id, isReady);
      
      setIsLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };
  
  // Kick a player (host only)
  const kickPlayerFromGame = async (playerIdToKick: string): Promise<void> => {
    if (!game || !currentPlayer || !currentPlayer.isHost) {
      throw new Error('Only the host can kick players');
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await kickPlayer(game.id, playerIdToKick);
      
      setIsLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  };

  return (
    <GameContext.Provider
      value={{
        game,
        currentPlayer,
        isLoading,
        error,
        createNewGame,
        joinExistingGame,
        startCurrentGame,
        restartCurrentGame,
        leaveCurrentGame,
        setReady,
        kickPlayer: kickPlayerFromGame
      }}
    >
      {children}
    </GameContext.Provider>
  );
};
