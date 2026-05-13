import { useEffect, useState } from 'react';
import { useGameState } from './hooks/useGameState';
import { TitleScreen } from './components/TitleScreen';
import { CharacterCreateScreen } from './components/CharacterCreateScreen';
import { FieldScreen } from './components/FieldScreen';
import { DungeonScreen } from './components/DungeonScreen';
import { BattleScreen } from './components/BattleScreen';

export const App = () => {
  const gameState = useGameState();
  const { state } = gameState;
  const [fade, setFade] = useState(true);

  useEffect(() => {
    setFade(false);
    const t = setTimeout(() => setFade(true), 30);
    return () => clearTimeout(t);
  }, [state.screen]);

  const renderScreen = () => {
    switch (state.screen) {
      case 'title':
        return (
          <TitleScreen
            goToScreen={gameState.goToScreen}
            loadGame={gameState.loadGame}
          />
        );
      case 'character-create':
        return <CharacterCreateScreen startNewGame={gameState.startNewGame} />;
      case 'field':
        return (
          <FieldScreen
            state={state}
            goToScreen={gameState.goToScreen}
            saveGame={gameState.saveGame}
          />
        );
      case 'dungeon':
        return (
          <DungeonScreen
            state={state}
            goToScreen={gameState.goToScreen}
            onEnterBattle={(isBoss) => {
              gameState.setBossFlag(isBoss);
              gameState.goToScreen('battle');
            }}
            onExitDungeon={() => gameState.goToScreen('field')}
            saveGame={gameState.saveGame}
          />
        );
      case 'battle':
        return (
          <BattleScreen
            state={state}
            isBoss={state.isBossFlag ?? false}
            goToScreen={gameState.goToScreen}
            onVictory={(exp, gold) => {
              gameState.addRewards(exp, gold);
              if (state.isBossFlag) gameState.clearIsland(1);
            }}
            onDefeat={() => gameState.goToScreen('field')}
          />
        );
      default:
        return (
          <TitleScreen
            goToScreen={gameState.goToScreen}
            loadGame={gameState.loadGame}
          />
        );
    }
  };

  return (
    <div style={{ opacity: fade ? 1 : 0, transition: 'opacity 0.2s' }}>
      {renderScreen()}
    </div>
  );
};
