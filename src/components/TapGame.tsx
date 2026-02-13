import { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import WebApp from "@twa-dev/sdk";
import useLocalStorage from 'use-local-storage';

const float = keyframes`
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
`;

const GameContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  gap: 20px;
`;

const StatsCard = styled.div`
  background: rgba(255,255,255,0.05);
  border-radius: 16px;
  padding: 20px;
  width: 100%;
  text-align: center;
  border: 1px solid rgba(255,255,255,0.1);
`;

const CoinDisplay = styled.div`
  font-size: 42px;
  font-weight: 800;
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
`;

const CoinLabel = styled.div`
  font-size: 14px;
  color: #888;
  margin-top: 4px;
`;

const LevelBadge = styled.div`
  display: inline-block;
  background: linear-gradient(90deg, #7b2cbf, #00d4ff);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  margin-top: 12px;
`;

const TapButton = styled.button`
  width: 220px;
  height: 220px;
  border-radius: 50%;
  border: none;
  background: radial-gradient(circle at 30% 30%, #00d4ff, #7b2cbf);
  box-shadow: 
    0 0 40px rgba(0, 212, 255, 0.4),
    inset 0 0 60px rgba(255,255,255,0.1);
  cursor: pointer;
  animation: ${float} 3s ease-in-out infinite;
  transition: transform 0.1s;
  position: relative;
  
  &:active {
    transform: scale(0.95);
  }
  
  &::before {
    content: '⚡';
    font-size: 80px;
    filter: drop-shadow(0 0 10px rgba(255,255,255,0.5));
  }
`;

const EnergyBar = styled.div`
  width: 100%;
  max-width: 280px;
  background: rgba(255,255,255,0.1);
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  margin-top: 10px;
`;

const EnergyFill = styled.div<{ $percent: number }>`
  height: 100%;
  width: ${props => props.$percent}%;
  background: linear-gradient(90deg, #00d4ff, #7b2cbf);
  transition: width 0.3s;
`;

const EnergyText = styled.div`
  font-size: 12px;
  color: #888;
  margin-top: 6px;
`;

const BoostButton = styled.button`
  background: linear-gradient(90deg, #ffd700, #ff8c00);
  border: none;
  padding: 12px 24px;
  border-radius: 25px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  color: #000;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
  transition: transform 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const FloatingCoin = styled.div<{ $x: number; $y: number }>`
  position: fixed;
  left: ${props => props.$x}px;
  top: ${props => props.$y}px;
  font-size: 24px;
  font-weight: 800;
  color: #ffd700;
  pointer-events: none;
  animation: floatUp 1s ease-out forwards;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.8);
  z-index: 1000;
  
  @keyframes floatUp {
    0% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    100% {
      opacity: 0;
      transform: translateY(-80px) scale(1.3);
    }
  }
`;

interface GameState {
  coins: number;
  level: number;
  taps: number;
  energy: number;
  maxEnergy: number;
  coinsPerTap: number;
  boostActive: boolean;
  boostMultiplier: number;
  lastLogin: string;
}

interface LevelInfo {
  level: number;
  name: string;
  tapsNeeded: number;
  reward: number;
}

const LEVELS: LevelInfo[] = [
  { level: 1, name: 'Новичок', tapsNeeded: 0, reward: 0 },
  { level: 2, name: 'Тапер', tapsNeeded: 100, reward: 50 },
  { level: 3, name: 'Про', tapsNeeded: 500, reward: 200 },
  { level: 4, name: 'Мастер', tapsNeeded: 2000, reward: 1000 },
  { level: 5, name: 'Легенда', tapsNeeded: 10000, reward: 5000 },
];

const DEFAULT_GAME_STATE: GameState = {
  coins: 0,
  level: 1,
  taps: 0,
  energy: 1000,
  maxEnergy: 1000,
  coinsPerTap: 1,
  boostActive: false,
  boostMultiplier: 1,
  lastLogin: new Date().toISOString(),
};

export function TapGame() {
  const [gameState, setGameState] = useLocalStorage<GameState>('tapGameState', DEFAULT_GAME_STATE);

  const [floatingCoins, setFloatingCoins] = useState<{ id: number; x: number; y: number; amount: number }[]>([]);
  const [nextId, setNextId] = useState(0);

  // Ensure gameState is never undefined
  const safeGameState = gameState || DEFAULT_GAME_STATE;

  // Restore energy over time
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState((prev: GameState | undefined) => {
        const current = prev || DEFAULT_GAME_STATE;
        return {
          ...current,
          energy: Math.min(current.maxEnergy, current.energy + 1),
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [setGameState]);

  // Daily login bonus
  useEffect(() => {
    const lastLogin = new Date(safeGameState.lastLogin);
    const now = new Date();
    const isNewDay = lastLogin.getDate() !== now.getDate() || 
                     lastLogin.getMonth() !== now.getMonth() ||
                     lastLogin.getFullYear() !== now.getFullYear();
    
    if (isNewDay) {
      setGameState((prev: GameState | undefined) => {
        const current = prev || DEFAULT_GAME_STATE;
        return {
          ...current,
          lastLogin: now.toISOString(),
          coins: current.coins + 100,
          energy: current.maxEnergy,
        };
      });
      WebApp.showPopup({
        title: 'Ежедневный бонус!',
        message: 'Вы получили 100 монет за вход!',
      });
    }
  }, [safeGameState.lastLogin, setGameState]);

  const getCurrentLevel = useCallback((): LevelInfo => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (safeGameState.taps >= LEVELS[i].tapsNeeded) {
        return LEVELS[i];
      }
    }
    return LEVELS[0];
  }, [safeGameState.taps]);

  const getNextLevel = useCallback((): LevelInfo | null => {
    for (const level of LEVELS) {
      if (level.tapsNeeded > safeGameState.taps) {
        return level;
      }
    }
    return null;
  }, [safeGameState.taps]);

  const handleTap = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (safeGameState.energy <= 0) {
      WebApp.showAlert('Энергия закончилась! Подождите восстановления.');
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2 + (Math.random() - 0.5) * 100;
    const y = rect.top + rect.height / 2 + (Math.random() - 0.5) * 100;
    
    const earned = safeGameState.coinsPerTap * safeGameState.boostMultiplier;
    
    setFloatingCoins(prev => [...prev, { id: nextId, x, y, amount: earned }]);
    setNextId(id => id + 1);
    
    setTimeout(() => {
      setFloatingCoins(prev => prev.filter(c => c.id !== nextId));
    }, 1000);

    setGameState((prev: GameState | undefined) => {
      const current = prev || DEFAULT_GAME_STATE;
      const newTaps = current.taps + 1;
      const newCoins = current.coins + earned;
      const newEnergy = Math.max(0, current.energy - 1);
      
      // Find current and new level
      let currentLevel = LEVELS[0];
      let newLevel = LEVELS[0];
      
      for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (current.taps >= LEVELS[i].tapsNeeded) {
          currentLevel = LEVELS[i];
        }
        if (newTaps >= LEVELS[i].tapsNeeded) {
          newLevel = LEVELS[i];
        }
      }
      
      if (newLevel.level > currentLevel.level) {
        WebApp.showPopup({
          title: 'Новый уровень!',
          message: `Поздравляем! Вы достигли уровня "${newLevel.name}" и получили ${newLevel.reward} монет!`,
        });
        return {
          ...current,
          taps: newTaps,
          coins: newCoins + newLevel.reward,
          level: newLevel.level,
          energy: newEnergy,
        };
      }
      
      return {
        ...current,
        taps: newTaps,
        coins: newCoins,
        energy: newEnergy,
      };
    });
  }, [safeGameState.energy, safeGameState.coinsPerTap, safeGameState.boostMultiplier, nextId, setGameState]);

  const activateBoost = useCallback(() => {
    const boostCost = 50 * safeGameState.level;
    if (safeGameState.coins < boostCost) {
      WebApp.showAlert(`Недостаточно монет! Нужно ${boostCost} монет.`);
      return;
    }

    setGameState((prev: GameState | undefined) => {
      const current = prev || DEFAULT_GAME_STATE;
      return {
        ...current,
        coins: current.coins - boostCost,
        boostActive: true,
        boostMultiplier: 5,
      };
    });

    WebApp.showPopup({
      title: 'Бустер активирован!',
      message: 'x5 к тапам на 30 секунд!',
    });

    setTimeout(() => {
      setGameState((prev: GameState | undefined) => {
        const current = prev || DEFAULT_GAME_STATE;
        return {
          ...current,
          boostActive: false,
          boostMultiplier: 1,
        };
      });
      WebApp.showAlert('Бустер закончился!');
    }, 30000);
  }, [safeGameState.coins, safeGameState.level, setGameState]);

  const currentLevel = getCurrentLevel();
  const nextLevel = getNextLevel();
  const energyPercent = (safeGameState.energy / safeGameState.maxEnergy) * 100;

  return (
    <GameContainer>
      <StatsCard>
        <CoinDisplay>{Math.floor(safeGameState.coins).toLocaleString()}</CoinDisplay>
        <CoinLabel>монет</CoinLabel>
        <LevelBadge>
          Уровень {currentLevel.level}: {currentLevel.name}
        </LevelBadge>
        {nextLevel && (
          <div style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
            До следующего: {nextLevel.tapsNeeded - safeGameState.taps} тапов
          </div>
        )}
      </StatsCard>

      <div style={{ position: 'relative' }}>
        <TapButton onClick={handleTap} />
        {floatingCoins.map(coin => (
          <FloatingCoin key={coin.id} $x={coin.x} $y={coin.y}>
            +{coin.amount}
          </FloatingCoin>
        ))}
      </div>

      <div style={{ textAlign: 'center' }}>
        <EnergyBar>
          <EnergyFill $percent={energyPercent} />
        </EnergyBar>
        <EnergyText>
          Энергия: {safeGameState.energy}/{safeGameState.maxEnergy}
          {safeGameState.boostActive && (
            <span style={{ color: '#ffd700', marginLeft: '10px' }}>⚡ BOOST x5!</span>
          )}
        </EnergyText>
      </div>

      <BoostButton 
        onClick={activateBoost}
        disabled={safeGameState.boostActive}
      >
        {safeGameState.boostActive 
          ? '🔥 BOOST АКТИВЕН!' 
          : `⚡ Бустер x5 (${50 * safeGameState.level} монет)`
        }
      </BoostButton>

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#666' }}>
        Всего тапов: {safeGameState.taps.toLocaleString()}
      </div>
    </GameContainer>
  );
}
