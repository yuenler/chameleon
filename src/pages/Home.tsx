import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import ChameleonIcon from '../components/ChameleonIcon';

const Home: React.FC = () => {
  const { createNewGame, joinExistingGame, isLoading, error } = useGame();
  const navigate = useNavigate();
  
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showHostForm, setShowHostForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  
  const handleHostGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() === '') return;
    
    await createNewGame(playerName);
    navigate('/game');
  };
  
  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() === '' || joinCode.trim() === '') return;
    
    await joinExistingGame(joinCode, playerName);
    navigate('/game');
  };
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <ChameleonIcon className="text-8xl text-primary-600 mx-auto mb-4 h-24 w-24" />
        <h1 className="text-5xl font-bold text-primary-800 mb-2">Chameleon</h1>
        <p className="text-xl text-gray-600">Blend in or stand out?</p>
      </motion.div>
      
      {!showHostForm && !showJoinForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-4 w-full max-w-md"
        >
          <button
            onClick={() => setShowHostForm(true)}
            className="btn-primary w-full"
          >
            Host a Game
          </button>
          <button
            onClick={() => setShowJoinForm(true)}
            className="btn-secondary w-full"
          >
            Join a Game
          </button>
        </motion.div>
      )}
      
      {showHostForm && (
        <motion.form
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleHostGame}
          className="space-y-4 w-full max-w-md"
        >
          <div>
            <input
              type="text"
              placeholder="Your Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="input"
              required
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setShowHostForm(false)}
              className="btn-secondary flex-1"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1"
            >
              {isLoading ? 'Creating...' : 'Host Game'}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </motion.form>
      )}
      
      {showJoinForm && (
        <motion.form
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onSubmit={handleJoinGame}
          className="space-y-4 w-full max-w-md"
        >
          <div>
            <input
              type="text"
              placeholder="Your Name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="input"
              required
            />
          </div>
          <div>
            <input
              type="text"
              placeholder="Join Code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="input"
              required
              maxLength={6}
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setShowJoinForm(false)}
              className="btn-secondary flex-1"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex-1"
            >
              {isLoading ? 'Joining...' : 'Join Game'}
            </button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </motion.form>
      )}
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-16 text-gray-500 text-sm"
      >
        <p>Created with ❤️ • {new Date().getFullYear()}</p>
      </motion.div>
    </div>
  );
};

export default Home;
