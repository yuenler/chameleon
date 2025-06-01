import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import { GameStatus } from '../types';
import ChameleonIcon from '../components/ChameleonIcon';
import { ArrowBackIcon, CopyIcon, RefreshIcon, UserCheckIcon, UserClockIcon } from '../components/Icons';

const Game: React.FC = () => {
  const { game, currentPlayer, isLoading, error, leaveCurrentGame, startCurrentGame, restartCurrentGame, setReady } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    if (!game && !isLoading) {
      navigate('/');
    }
  }, [game, isLoading, navigate]);

  const handleCopyJoinCode = () => {
    if (game) {
      navigator.clipboard.writeText(game.joinCode);
    }
  };

  const handleLeaveGame = async () => {
    await leaveCurrentGame();
    navigate('/');
  };

  const handleStartGame = async () => {
    if (currentPlayer?.isHost) {
      await startCurrentGame();
    }
  };

  const handleRestartGame = async () => {
    if (currentPlayer?.isHost) {
      await restartCurrentGame();
    }
  };

  const handleToggleReady = async () => {
    if (currentPlayer) {
      await setReady(!currentPlayer.isReady);
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

  const allPlayersReady = game.players.every(player => player.isReady);
  const canStartGame = currentPlayer.isHost && allPlayersReady && game.players.length >= 2 && game.status === GameStatus.WAITING;

  return (
    <div className="min-h-screen p-4 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <button 
          onClick={handleLeaveGame}
          className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
        >
          <ArrowBackIcon className="text-xl" />
        </button>
        <h1 className="text-2xl font-bold text-primary-800 flex items-center">
          <ChameleonIcon className="mr-2 h-6 w-6" /> Chameleon
        </h1>
        {currentPlayer.isHost && game.status === GameStatus.PLAYING && (
          <button 
            onClick={handleRestartGame}
            className="p-2 text-gray-600 hover:text-primary-600 transition-colors"
            title="Restart Game"
          >
            <RefreshIcon className="text-xl" />
          </button>
        )}
        {!currentPlayer.isHost && (
          <div className="w-8"></div>
        )}
      </header>

      <main>
        <AnimatePresence mode="wait">
          {/* Game Info Card */}
          <motion.div
            key="game-info"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="card mb-6"
          >
            <div className="flex flex-col sm:flex-row justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">Game Code</h2>
                <div className="flex items-center mt-2">
                  <span className="text-3xl font-bold tracking-wider text-primary-600">{game.joinCode}</span>
                  <button 
                    onClick={handleCopyJoinCode}
                    className="ml-2 p-2 text-gray-500 hover:text-primary-600 transition-colors"
                    title="Copy Join Code"
                  >
                    <CopyIcon />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 sm:mt-0">
                <span className="block text-sm text-gray-500 mb-1">Your Status</span>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium 
                  ${currentPlayer.isHost ? 'bg-purple-100 text-purple-800' : ''} 
                  ${currentPlayer.isReady ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                >
                  {currentPlayer.isHost ? 'Host' : 'Player'} • {currentPlayer.isReady ? 'Ready' : 'Not Ready'}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Game Status */}
          {game.status === GameStatus.WAITING && (
            <motion.div
              key="waiting-room"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="card mb-6"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Waiting Room</h2>
              
              <div className="flex justify-between items-center mb-6">
                <span className="text-sm text-gray-500">{game.players.length} {game.players.length === 1 ? 'Player' : 'Players'}</span>
                
                <div className="flex space-x-3">
                  {/* All players including host can mark themselves as ready */}
                  <button 
                    onClick={handleToggleReady}
                    className={`btn ${currentPlayer.isReady ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'btn-primary'}`}
                  >
                    {currentPlayer.isReady ? 'Ready ✓' : 'Ready Up'}
                  </button>
                  
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
                    className={`flex items-center justify-between p-3 rounded-lg ${player.id === currentPlayer.id ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center">
                      <span className="font-medium">
                        {player.name} {player.id === currentPlayer.id && <span className="text-gray-400 text-sm">(You)</span>}
                      </span>
                      {player.isHost && <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">Host</span>}
                    </div>
                    <div>
                      {player.isReady ? 
                        <UserCheckIcon className="text-green-500" /> : 
                        <UserClockIcon className="text-yellow-500" />
                      }
                    </div>
                  </div>
                ))}
              </div>
              
              {currentPlayer.isHost && !canStartGame && game.players.length < 2 && (
                <p className="text-sm text-gray-500 mt-4">Need at least 2 players to start the game.</p>
              )}
              
              {currentPlayer.isHost && !canStartGame && game.players.length >= 2 && (
                <p className="text-sm text-gray-500 mt-4">Waiting for all players to be ready.</p>
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
              {/* Category Card */}
              <div className="card text-center">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Category</h2>
                <p className="text-3xl font-bold text-primary-700">{game.currentCategory}</p>
              </div>
              
              {/* Word Card - Only shown if player is not the chameleon */}
              {!currentPlayer.isChameleon && (
                <div className="card text-center">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Secret Word</h2>
                  <p className="text-3xl font-bold text-primary-700">{game.currentWord}</p>
                  <p className="text-sm text-gray-500 mt-4">Don't reveal the word! The chameleon is trying to figure it out.</p>
                </div>
              )}
              
              {/* Chameleon Card - Only shown if player is the chameleon */}
              {currentPlayer.isChameleon && (
                <div className="card text-center bg-gradient-to-r from-teal-500 to-primary-500 text-white">
                  <div className="flex justify-center mb-2">
                    <ChameleonIcon className="text-4xl h-12 w-12" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">You are the Chameleon!</h2>
                  <p className="text-lg">
                    Blend in! Try to figure out the secret word from the category <strong>{game.currentCategory}</strong> without getting caught.
                  </p>
                </div>
              )}
              
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
