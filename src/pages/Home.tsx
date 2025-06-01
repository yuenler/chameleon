import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../contexts/GameContext';
import ChameleonIcon from '../components/ChameleonIcon';

const Home: React.FC = () => {
  const { createNewGame, joinExistingGame, isLoading, error } = useGame();
  const navigate = useNavigate();
  
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [showHostForm, setShowHostForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [showRules, setShowRules] = useState(false);
  
  // Check if user is already in a game and redirect to game page
  useEffect(() => {
    const gameId = localStorage.getItem('gameId');
    const playerId = localStorage.getItem('playerId');
    
    if (gameId && playerId) {
      console.log('User already in game, redirecting to game page');
      navigate('/game');
    }
  }, [navigate]);
  
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
      
      {/* How to Play section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-10 w-full max-w-lg"
      >
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <button
            onClick={() => setShowRules(prev => !prev)}
            className="w-full p-4 cursor-pointer font-semibold text-primary-700 flex items-center justify-center bg-white hover:bg-gray-50 transition-colors"
          >
            How to Play {showRules ? '▲' : '▼'}
          </button>
          
          <AnimatePresence initial={false}>
            {showRules && (
              <motion.div 
                initial="collapsed"
                animate="expanded"
                exit="collapsed"
                variants={{
                  expanded: { opacity: 1, height: 'auto', marginTop: 0 },
                  collapsed: { opacity: 0, height: 0, marginTop: 0 }
                }}
                transition={{ duration: 0.4, ease: [0.04, 0.62, 0.23, 0.98] }}
                className="overflow-hidden"
              >
                <div className="p-4 pt-2 text-left">
                  <div className="space-y-3 text-gray-700">
                    <div>
                      <h3 className="font-bold text-primary-800 mb-1">Setup:</h3>
                      <p>3+ players gather and one player is secretly assigned as the "Chameleon."</p>
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-primary-800 mb-1">Goal:</h3>
                      <p><b>For Regular Players:</b> Identify who the Chameleon is.</p>
                      <p><b>For the Chameleon:</b> Blend in and avoid being detected, while trying to figure out the secret word.</p>
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-primary-800 mb-1">Gameplay:</h3>
                      <ol className="list-decimal pl-5 space-y-2">
                        <li>Everyone except the Chameleon sees a secret word from a given category.</li>
                        <li>Players discuss the topic, with each person contributing to the conversation.</li>
                        <li>The Chameleon must blend in and pretend to know what the secret word is.</li>
                        <li>When a majority agrees, players vote on who they think is the Chameleon.</li>
                      </ol>
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-primary-800 mb-1">Winning:</h3>
                      <p><b>The Chameleon wins if:</b></p>
                      <ul className="list-disc pl-5">
                        <li>They aren't identified in the vote, OR</li>
                        <li>They correctly guess the secret word when revealed</li>
                      </ul>
                      <p><b>The other players win if:</b></p>
                      <ul className="list-disc pl-5">
                        <li>They correctly identify the Chameleon AND the Chameleon can't guess the word</li>
                      </ul>
                    </div>
                    
                    <div className="border-t pt-3 text-gray-500 italic">
                      <p>Remember: If you're a regular player, be specific enough that other players know you know the word, but vague enough that the Chameleon can't figure it out!</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-6 text-gray-500 text-sm"
      >
        <p>Created by Yuen Ler Chow • {new Date().getFullYear()}</p>
      </motion.div>
    </div>
  );
};

export default Home;
