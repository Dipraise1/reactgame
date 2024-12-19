import React, { useState, useEffect, useCallback } from 'react';
import { StarIcon, HeartIcon } from '@heroicons/react/24/solid';

const Game = () => {
  // Game state
  const [playerPos, setPlayerPos] = useState({ x: 50, y: 50 });
  const [coins, setCoins] = useState([]);
  const [powerUps, setPowerUps] = useState([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isJumping, setIsJumping] = useState(false);
  const [facing, setFacing] = useState('right');
  const [isPowered, setIsPowered] = useState(false);
  const [obstacles, setObstacles] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [gameState, setGameState] = useState('playing'); // 'playing', 'paused', 'over'

  // Check for mobile device
  useEffect(() => {
    setIsMobile(window.innerWidth <= 768);
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize game elements
  useEffect(() => {
    generateGameElements();
  }, []);

  const generateGameElements = () => {
    // Generate coins
    const newCoins = Array.from({ length: 8 }, () => ({
      x: Math.random() * (isMobile ? 300 : 600),
      y: Math.random() * (isMobile ? 300 : 400),
      id: Math.random(),
      type: Math.random() > 0.8 ? 'special' : 'normal'
    }));

    // Generate power-ups
    const newPowerUps = Array.from({ length: 2 }, () => ({
      x: Math.random() * (isMobile ? 300 : 600),
      y: Math.random() * (isMobile ? 300 : 400),
      id: Math.random(),
      type: Math.random() > 0.5 ? 'invincibility' : 'extraLife'
    }));

    // Generate obstacles
    const newObstacles = Array.from({ length: 4 }, () => ({
      x: Math.random() * (isMobile ? 300 : 600),
      y: Math.random() * (isMobile ? 300 : 400),
      width: 40 + Math.random() * 40,
      height: 40 + Math.random() * 40,
      id: Math.random()
    }));

    setCoins(newCoins);
    setPowerUps(newPowerUps);
    setObstacles(newObstacles);
  };

  // Handle keyboard and touch controls
  const handleMovement = useCallback((direction) => {
    if (gameState !== 'playing') return;
    
    const speed = isPowered ? 30 : 20;
    setPlayerPos(prev => {
      let newPos = { ...prev };
      
      switch(direction) {
        case 'left':
          setFacing('left');
          newPos.x = Math.max(0, prev.x - speed);
          break;
        case 'right':
          setFacing('right');
          newPos.x = Math.min(isMobile ? 300 : 600, prev.x + speed);
          break;
        case 'up':
          newPos.y = Math.max(0, prev.y - speed);
          break;
        case 'down':
          newPos.y = Math.min(isMobile ? 300 : 400, prev.y + speed);
          break;
        default:
          break;
      }

      // Collision detection with obstacles
      const collision = obstacles.some(obstacle => {
        return (newPos.x < obstacle.x + obstacle.width &&
                newPos.x + 40 > obstacle.x &&
                newPos.y < obstacle.y + obstacle.height &&
                newPos.y + 40 > obstacle.y);
      });

      if (collision && !isPowered) {
        setLives(prev => prev - 1);
        if (lives <= 1) setGameState('over');
        return prev;
      }

      // Collect items
      coins.forEach(coin => {
        const distance = Math.sqrt(
          Math.pow(coin.x - newPos.x, 2) + 
          Math.pow(coin.y - newPos.y, 2)
        );
        
        if (distance < 30) {
          setCoins(prev => prev.filter(c => c.id !== coin.id));
          setScore(prev => prev + (coin.type === 'special' ? 20 : 10));
        }
      });

      powerUps.forEach(powerUp => {
        const distance = Math.sqrt(
          Math.pow(powerUp.x - newPos.x, 2) + 
          Math.pow(powerUp.y - newPos.y, 2)
        );
        
        if (distance < 30) {
          setPowerUps(prev => prev.filter(p => p.id !== powerUp.id));
          if (powerUp.type === 'invincibility') {
            setIsPowered(true);
            setTimeout(() => setIsPowered(false), 5000);
          } else {
            setLives(prev => Math.min(prev + 1, 5));
          }
        }
      });
      
      return newPos;
    });
  }, [coins, powerUps, obstacles, isPowered, lives, gameState, isMobile]);

  // Mobile controls
  const renderMobileControls = () => (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
      <button 
        className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center"
        onTouchStart={() => handleMovement('left')}
      >
        ←
      </button>
      <button 
        className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center"
        onTouchStart={() => handleMovement('right')}
      >
        →
      </button>
      <button 
        className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center"
        onTouchStart={() => handleMovement('up')}
      >
        ↑
      </button>
      <button 
        className="w-12 h-12 bg-white/50 rounded-full flex items-center justify-center"
        onTouchStart={() => handleMovement('down')}
      >
        ↓
      </button>
    </div>
  );

  // Keyboard controls
  useEffect(() => {
    const handleKeyPress = (e) => {
      switch(e.key) {
        case 'ArrowLeft': handleMovement('left'); break;
        case 'ArrowRight': handleMovement('right'); break;
        case 'ArrowUp': handleMovement('up'); break;
        case 'ArrowDown': handleMovement('down'); break;
        case ' ': 
          if (!isJumping) {
            setIsJumping(true);
            setTimeout(() => setIsJumping(false), 500);
          }
          break;
        case 'p': setGameState(prev => prev === 'playing' ? 'paused' : 'playing'); break;
        default: break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleMovement, isJumping]);

  // Game over or pause overlay
  const renderOverlay = () => {
    if (gameState === 'over' || gameState === 'paused') {
      return (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg text-center">
            <h2 className="text-2xl font-bold mb-4">
              {gameState === 'over' ? 'Game Over!' : 'Paused'}
            </h2>
            <p className="mb-4">Score: {score}</p>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => {
                if (gameState === 'over') {
                  setLives(3);
                  setScore(0);
                  setPlayerPos({ x: 50, y: 50 });
                  generateGameElements();
                }
                setGameState('playing');
              }}
            >
              {gameState === 'over' ? 'Play Again' : 'Resume'}
            </button>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`relative ${isMobile ? 'w-[350px] h-[400px]' : 'w-[700px] h-[500px]'} bg-gradient-to-b from-blue-200 to-blue-400 rounded-lg overflow-hidden border-4 border-blue-500`}>
      {/* Score and lives */}
      <div className="absolute top-4 left-4 flex gap-4">
        <div className="bg-white px-4 py-2 rounded-full font-bold text-blue-600">
          Score: {score}
        </div>
        <div className="flex gap-1">
          {Array.from({ length: lives }).map((_, i) => (
            <HeartIcon key={i} className="w-6 h-6 text-red-500" />
          ))}
        </div>
      </div>

      {/* Game character */}
      <div 
        className={`absolute transition-all duration-200 ${isJumping ? 'animate-bounce' : ''} ${isPowered ? 'animate-pulse' : ''}`}
        style={{ 
          left: `${playerPos.x}px`, 
          top: `${playerPos.y}px`,
          transform: `scaleX(${facing === 'left' ? -1 : 1})`
        }}
      >
        <div className={`relative w-10 h-10 ${isPowered ? 'bg-yellow-400' : 'bg-pink-400'} rounded-full shadow-lg`}>
          <div className="absolute left-2 top-2 w-2 h-2 bg-white rounded-full">
            <div className="absolute left-[2px] top-[2px] w-1 h-1 bg-black rounded-full" />
          </div>
          <div className="absolute right-2 top-2 w-2 h-2 bg-white rounded-full">
            <div className="absolute left-[2px] top-[2px] w-1 h-1 bg-black rounded-full" />
          </div>
          <div className="absolute bottom-2 left-2 w-6 h-2 border-b-2 border-black rounded-full" />
        </div>
      </div>

      {/* Coins */}
      {coins.map(coin => (
        <div
          key={coin.id}
          className={`absolute w-6 h-6 ${coin.type === 'special' ? 'bg-yellow-300' : 'bg-yellow-400'} rounded-full animate-float shadow-lg`}
          style={{ left: `${coin.x}px`, top: `${coin.y}px` }}
        >
          <StarIcon className="w-4 h-4 absolute top-1 left-1 text-yellow-600" />
        </div>
      ))}

      {/* Power-ups */}
      {powerUps.map(powerUp => (
        <div
          key={powerUp.id}
          className={`absolute w-8 h-8 ${powerUp.type === 'invincibility' ? 'bg-purple-400' : 'bg-red-400'} rounded-full animate-pulse shadow-lg`}
          style={{ left: `${powerUp.x}px`, top: `${powerUp.y}px` }}
        >
          {powerUp.type === 'invincibility' ? '⚡' : '❤️'}
        </div>
      ))}

      {/* Obstacles */}
      {obstacles.map(obstacle => (
        <div
          key={obstacle.id}
          className="absolute bg-gray-700 rounded shadow-lg"
          style={{
            left: `${obstacle.x}px`,
            top: `${obstacle.y}px`,
            width: `${obstacle.width}px`,
            height: `${obstacle.height}px`
          }}
        />
      ))}

      {/* Mobile controls */}
      {isMobile && renderMobileControls()}

      {/* Overlay */}
      {renderOverlay()}
    </div>
  );
};

export default Game;