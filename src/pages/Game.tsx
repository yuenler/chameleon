import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { GameStatus } from '../types';
import ChameleonIcon from '../components/ChameleonIcon';
import { ArrowBackIcon, CopyIcon, UserMinusIcon } from '../components/Icons';
import CategorySelectionModal from '../components/CategorySelectionModal';

const Game: React.FC = () => {
  const { 
    game, 
    currentPlayer, 
    isLoading, 
    error, 
    leaveCurrentGame, 
    startCurrentGame, 
    restartCurrentGame, 
    // setReady no longer used since players are auto-ready
    
    kickPlayer 
  } = useGame();
  const navigate = useNavigate();

  // Store the current player ID to detect if the player is kicked
  const [currentPlayerIdRef] = useState(currentPlayer?.id);
  
  // State for category selection modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Track if initial loading has completed
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  
  useEffect(() => {
    // Mark initial load as complete after first render with game data
    if (!initialLoadComplete && !isLoading) {
      setInitialLoadComplete(true);
    }
    
    // Only redirect if game doesn't exist after initial loading is complete
    // and we're not currently loading (prevents premature redirect on reload)
    if (initialLoadComplete && !game && !isLoading) {
      console.log('No game found after initial load, redirecting to home');
      navigate('/');
      return;
    }

    // Case 2: Player has been kicked (player exists but not in the game's player list)
    if (game && currentPlayerIdRef && !game.players.some(p => p.id === currentPlayerIdRef)) {
      console.log('You have been kicked from the game');
      localStorage.removeItem('gameId'); // Clear game data
      localStorage.removeItem('playerId');
      navigate('/');
      return;
    }

    // We're no longer removing players on page reload or new tabs
    // Instead, we'll rely on localStorage to maintain the game session

    // Handle navigation away using the History API (back button)
    const handlePopState = () => {
      if (game && currentPlayer) {
        console.log('User clicked back button, removing from game...');
        leaveCurrentGame();
        // No need to call handlePageUnload here because leaveCurrentGame handles it
      }
    };

    // No longer listening for beforeunload events
    window.addEventListener('popstate', handlePopState);

    return () => {
      // No longer need to remove beforeunload listener
      window.removeEventListener('popstate', handlePopState);
    };
  }, [game, isLoading, navigate, currentPlayerIdRef, currentPlayer, leaveCurrentGame, initialLoadComplete]);

  const handleCopyJoinCode = () => {
    if (game?.joinCode) {
      navigator.clipboard.writeText(game.joinCode);
    }
  };
  
  const handleKickPlayer = async (playerId: string, playerName: string) => {
    if (window.confirm(`Are you sure you want to kick ${playerName}?`)) {
      try {
        await kickPlayer(playerId);
      } catch (error) {
        console.error('Error kicking player:', error);
        alert('Failed to kick player');
      }
    }
  };

  const handleLeaveGame = async () => {
    await leaveCurrentGame();
    navigate('/');
  };

  const handleStartGame = () => {
    if (isLoading || !currentPlayer?.isHost) return;
    
    // Open the category selection modal
    setIsCategoryModalOpen(true);
  };

  const handleCategorySelected = async (category: string, words: string[], showWordBank: boolean) => {
    if (isLoading) return;
    
    try {
      await startCurrentGame({ category, words, showWordBank });
    } catch (error) {
      console.error('Error starting game:', error);
    }
  };

  const handleRestartGame = async () => {
    if (currentPlayer?.isHost) {
      await restartCurrentGame();
    }
  };

  if (isLoading || !game || !currentPlayer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin text-primary-600">
          <ChameleonIcon className="text-4xl h-10 w-10" />
        </div>
      </div>
    );
  }

  // Players are now automatically ready, so no need to check this
  const allPlayersReady = true;
  const canStartGame = currentPlayer.isHost && allPlayersReady && game.players.length >= 2 && game.status === GameStatus.WAITING;

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto">
      {/* Category Selection Modal */}
      <CategorySelectionModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSelectCategory={handleCategorySelected}
      />
      <header className="flex justify-between items-center mb-4">
        {/* Leave Button - Left */}
        <button
          onClick={handleLeaveGame}
          className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-md flex items-center gap-1 text-xs font-medium transition-colors"
          title="Leave game permanently"
        >
          <ArrowBackIcon className="text-xs" /> Leave
        </button>
        
        {/* Chameleon Icon and Title - Center */}
        <div className="flex items-center">
          <ChameleonIcon className="h-5 w-5 text-primary-600 mr-1.5" />
          <span className="font-semibold text-primary-700">Chameleon</span>
        </div>
        
        {/* Game Code - Right */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-semibold">#{game.joinCode}</span>
          <button
            onClick={handleCopyJoinCode}
            className="text-primary-500 hover:text-primary-700 p-1"
            title="Copy join code"
          >
            <CopyIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <main>
        <AnimatePresence mode="wait">

          {/* Game Status */}
          {game.status === GameStatus.WAITING && (
            <motion.div
              key="waiting-room"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Waiting Room</h2>
              
              {/* Game Code Card for Waiting Room */}
              <div className="card mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Game Code</h2>
                <div className="flex items-center">
                  <span className="text-3xl font-bold tracking-wider text-primary-600">{game.joinCode}</span>
                  <button 
                    onClick={handleCopyJoinCode}
                    className="ml-2 p-2 text-gray-500 hover:text-primary-600 transition-colors"
                    title="Copy Join Code"
                  >
                    <CopyIcon />
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-2">Share this code with friends to join the game</p>
              </div>
              
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm text-gray-500">{game.players.length} {game.players.length === 1 ? 'Player' : 'Players'}</span>
                
                <div className="flex space-x-3">
                  {/* Only host can start the game */}
                  {currentPlayer.isHost && (
                    <button 
                      onClick={handleStartGame}
                      disabled={!canStartGame}
                      className={`btn ${canStartGame ? 'btn-primary' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    >
                      Start Game
                    </button>
                  )}
                </div>
              </div>
              
              <div className="space-y-3 max-h-72 overflow-y-auto px-1">
                {game.players.map(player => (
                  <div 
                    key={player.id} 
                    className={`flex items-center justify-between p-3 rounded-lg ${player.id === currentPlayer.id ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'} group`}
                  >
                    <div className="flex items-center">
                      <span className="font-medium">
                        {player.name} {player.id === currentPlayer.id && <span className="text-gray-400 text-sm">(You)</span>}
                      </span>
                      {player.isHost && <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">Host</span>}
                    </div>
                    <div className="flex items-center space-x-3">
                      {/* Kick button - only visible to host and only for non-host players */}
                      {currentPlayer.isHost && !player.isHost && player.id !== currentPlayer.id && (
                        <button 
                          onClick={() => handleKickPlayer(player.id, player.name)}
                          className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-700 p-1"
                          title="Kick player"
                        >
                          <UserMinusIcon />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Display message when not enough players */}
              {currentPlayer.isHost && !canStartGame && game.players.length < 2 && (
                <p className="text-sm text-gray-500 mt-4">Need at least 2 players to start the game.</p>
              )}
            </motion.div>
          )}

          {/* Active Game */}
          {game.status === GameStatus.PLAYING && (
            <motion.div
              key="active-game"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Combined Category and Words Card */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-800 mb-3 text-center">{game.currentCategory}</h2>
                
                {/* For non-chameleons - combined word bank and secret word */}
                {!currentPlayer.isChameleon && game.showWordBank && (
                  <div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {game.categoryWords?.map((word: string) => (
                        <span 
                          key={word} 
                          className={`px-3 py-1.5 rounded-full text-sm transition-colors ${word === game.currentWord 
                            ? 'bg-primary-100 border border-primary-300 font-bold text-primary-700 shadow-sm' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                          {word}
                        </span>
                      )) || <p className="text-gray-500">No words available</p>}
                    </div>
                    <div className="mt-4 text-center">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-primary-50 text-sm font-medium text-primary-700">
                        <span className="h-3 w-3 mr-1.5 rounded-full bg-primary-500"></span>
                        The secret word is highlighted. Don't reveal it!
                      </span>
                    </div>
                  </div>
                )}
                
                {/* For chameleons - just the word bank */}
                {currentPlayer.isChameleon && game.showWordBank && (
                  <div>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {game.categoryWords?.map((word: string) => (
                        <span key={word} className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full text-sm text-gray-700 transition-colors">
                          {word}
                        </span>
                      )) || <p className="text-gray-500">No words available</p>}
                    </div>
                    <div className="mt-4 text-center">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full bg-teal-100 text-sm font-medium text-teal-800">
                        <ChameleonIcon className="h-4 w-4 mr-1.5 text-teal-700" />
                        You are the chameleon! Try to guess the secret word.
                      </span>
                    </div>
                  </div>
                )}
                
                {/* When word bank is disabled but player is not chameleon */}
                {!currentPlayer.isChameleon && !game.showWordBank && (
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary-700">{game.currentWord}</p>
                    <p className="text-sm text-gray-500 mt-4">Don't reveal the word! The chameleon is trying to figure it out.</p>
                  </div>
                )}
                
                {/* For chameleons when word bank is disabled */}
                {currentPlayer.isChameleon && !game.showWordBank && (
                  <div className="text-center py-2 bg-gradient-to-r from-teal-500 to-primary-500 text-white rounded-lg">
                    <div className="flex justify-center mb-2">
                      <ChameleonIcon className="text-4xl h-10 w-10" />
                    </div>
                    <h2 className="text-lg font-semibold mb-2">You are the Chameleon!</h2>
                    <p className="text-base px-4">
                      Blend in! Try to figure out the secret word for the category <strong>{game.currentCategory}</strong> without getting caught.
                    </p>
                  </div>
                )}
              </div>
              
              {/* Players List */}
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Players</h2>
                <div className="space-y-3 max-h-64 overflow-y-auto px-1">
                  {game.players.map(player => (
                    <div 
                      key={player.id} 
                      className={`flex items-center justify-between p-3 rounded-lg ${player.id === currentPlayer.id ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'}`}
                    >
                      <div className="flex items-center">
                        <span className="font-medium">
                          {player.name} {player.id === currentPlayer.id && <span className="text-gray-400 text-sm">(You)</span>}
                        </span>
                        {player.isHost && <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">Host</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Game Controls - Only shown to host */}
              {currentPlayer.isHost && (
                <div className="card">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">Game Controls</h2>
                  <button 
                    onClick={handleRestartGame}
                    className="btn-primary w-full"
                  >
                    New Round
                  </button>
                  <p className="text-sm text-gray-500 mt-2">
                    This will start a new round with a new word and a new chameleon.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
};

export default Game;
