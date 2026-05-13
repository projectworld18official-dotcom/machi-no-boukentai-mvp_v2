import { useGameState } from './hooks/useGameState';
import { TitleScreen } from './components/TitleScreen';
import { CharacterCreateScreen } from './components/CharacterCreateScreen';
import { FieldScreen } from './components/FieldScreen';
import { DungeonScreen } from './components/DungeonScreen';
import { BattleScreen } from './components/BattleScreen';

export const App = () => {
  const gameState = useGameState();
  const { state } = gameState;

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
      return <FieldScreen state={state} goToScreen={gameState.goToScreen} />;
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
        />
      );
    case 'battle':
      return (
        <BattleScreen
          state={state}
          isBoss={state.isBossFlag ?? false}
          goToScreen={gameState.goToScreen}
          onVictory={gameState.addRewards}
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
