import { useGameState } from './hooks/useGameState';
import { TitleScreen } from './components/TitleScreen';
import { CharacterCreateScreen } from './components/CharacterCreateScreen';
import { FieldScreen } from './components/FieldScreen';
import { BattleScreen } from './components/BattleScreen';
export const App = () => {
  const gameState = useGameState();
  const { state } = gameState;
  switch (state.screen) {
    case 'title': return <TitleScreen goToScreen={gameState.goToScreen} />;
    case 'character-create': return <CharacterCreateScreen startNewGame={gameState.startNewGame} />;
    case 'field': return <FieldScreen state={state} goToScreen={gameState.goToScreen} />;
    case 'battle': return <BattleScreen state={state} goToScreen={gameState.goToScreen} />;
    default: return <TitleScreen goToScreen={gameState.goToScreen} />;
  }
};
