import type { GameState } from '../types/game';
import { unlockAudio } from '../utils/audio';

interface Props {
  goToScreen: (screen: GameState['screen']) => void;
  loadGame: () => boolean;
}

export const TitleScreen = ({ goToScreen, loadGame }: Props) => {
  const hasSave = localStorage.getItem('hamano_save') !== null;

  const handleStart = async () => {
    await unlockAudio();
    goToScreen('character-create');
  };

  const handleContinue = async () => {
    await unlockAudio();
    loadGame();
    goToScreen('field');
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100dvh', background:'#1a1a2e', gap:24 }}>
      <h1 style={{ fontSize:'clamp(28px,8vw,48px)', color:'#f0d080', letterSpacing:'0.15em', textShadow:'0 0 20px rgba(240,208,128,0.5)', textAlign:'center' }}>ハマの冒険隊</h1>
      <button onClick={handleStart} style={{ padding:'14px 40px', fontSize:18, background:'transparent', border:'2px solid #f0d080', color:'#f0d080', borderRadius:4, cursor:'pointer', letterSpacing:'0.1em', fontFamily:'inherit' }}>はじめから</button>
      {hasSave && (
        <button onClick={handleContinue} style={{ padding:'14px 40px', fontSize:18, background:'transparent', border:'2px solid #80c0ff', color:'#80c0ff', borderRadius:4, cursor:'pointer', letterSpacing:'0.1em', fontFamily:'inherit' }}>つづきから</button>
      )}
    </div>
  );
};
