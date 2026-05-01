import React, { useEffect, useMemo, useState } from "react";

const SAVE = "machi_quest_v4";

const HEROES = [
  ["yu", "ユウ", "タンク", 3, 150, 25, 14, "🛡️", "blue", "守りはまかせて！"],
  ["mio", "ミオ", "ヒーラー", 3, 110, 18, 9, "💖", "pink", "みんな、げんき出して！"],
  ["sora", "ソラ", "アタッカー", 4, 120, 36, 7, "⚡", "yellow", "いっきに行くぜ！"],
  ["hina", "ヒナ", "星魔法", 5, 170, 50, 14, "🌟", "purple", "未来を照らすよ！"],
].map(([id, name, role, rare, hp, atk, def, emoji, color, line]) => ({ id, name, role, rare, hp, atk, def, emoji, color, line }));

const STAGES = [
  [1, "公園", "くもモク", "☁️", 120, 14, 45, "くもふわコットン"],
  [2, "商店街", "ピコ丸", "🤖", 165, 18, 55, "ピカピカねじ"],
  [3, "図書館", "スヤドラ", "🐉", 215, 22, 70, "ねむりのしおり"],
  [4, "川辺", "ギョギョン", "🐟", 265, 26, 85, "きらきらウロコ"],
  [5, "山", "ゴンロック", "🗿", 330, 31, 105, "山のほし石"],
  [6, "星の塔", "ナイトスター", "🌌", 420, 38, 150, "まちの星バッジ"],
].map(([id, place, boss, emoji, hp, atk, reward, item]) => ({ id, place, name: `${place}のぼうけん`, boss, emoji, hp, atk, reward, item }));

function newGame() {
  return { coins: 160, gems: 1, heroes: ["yu", "mio", "sora"], clear: 0, stage: 1, screen: "title", msg: "まちを守る冒険に出発しよう！", battle: null, result: null, gacha: null };
}
function hero(id) { return HEROES.find(h => h.id === id) || HEROES[0]; }
function stage(id) { return STAGES.find(s => s.id === id) || STAGES[0]; }
function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function stars(n, max = 5) { return "★".repeat(n) + "☆".repeat(Math.max(0, max - n)); }
function save(g) { try { localStorage.setItem(SAVE, JSON.stringify({ ...g, screen: "title", battle: null, result: null, gacha: null })); } catch {} }
function load() { try { return { ...newGame(), ...JSON.parse(localStorage.getItem(SAVE) || "{}"), screen: "title", battle: null, result: null, gacha: null }; } catch { return newGame(); } }

function startBattle(party, s) {
  return { id: s.id, turn: 0, bossHp: s.hp, bossMax: s.hp, party: party.map(h => ({ id: h.id, hp: h.hp, max: h.hp })), log: [`${s.boss} が あらわれた！`], done: false, win: false, coins: 0, item: null, stars: 0, action: "start", active: null, hit: null, fx: "バトル開始！" };
}
function nextTurn(b, party, s) {
  if (!b || b.done) return b;
  const n = { ...b, party: b.party.map(x => ({ ...x })), log: [...b.log], active: null, hit: null, fx: "", action: "attack" };
  n.turn++;
  const alive = () => n.party.filter(x => x.hp > 0);
  const win = () => { const drop = Math.random() < .58; n.done = true; n.win = true; n.bossHp = 0; n.coins = s.reward + (drop ? 35 : 0); n.item = drop ? s.item : null; n.stars = n.turn <= 4 ? 3 : n.turn <= 7 ? 2 : 1; n.action = "victory"; n.fx = "クリア！"; if (drop) n.log.push(`宝箱！${s.item}をゲット！`); n.log.push(`${s.boss}をたおした！`); return n; };
  const lose = () => { n.done = true; n.win = false; n.coins = 15; n.action = "defeat"; n.fx = "ざんねん！"; n.log.push("みんなは力尽きた……。もう一度挑戦しよう！"); return n; };

  const mio = n.party.find(x => x.id === "mio" && x.hp > 0);
  const hurt = n.party.filter(x => x.hp > 0 && x.hp < x.max).sort((a, b) => a.hp / a.max - b.hp / b.max)[0];
  if (mio && hurt && Math.random() < .8) { const heal = rnd(14, 24); hurt.hp = Math.min(hurt.max, hurt.hp + heal); n.action = "heal"; n.active = "mio"; n.hit = hurt.id; n.fx = `+${heal}`; n.log.push(`ミオの回復！${hero(hurt.id).name}が${heal}回復`); return n; }

  const attackers = alive();
  if (!attackers.length) return lose();
  const a = attackers[(n.turn - 1) % attackers.length];
  const h = hero(a.id);
  n.active = h.id;
  let dmg = rnd(Math.max(8, h.atk - 5), h.atk + 9);
  if (h.id === "sora" && Math.random() < .35) { dmg *= 2; n.action = "critical"; n.log.push("ソラの会心の一撃！"); }
  else if (h.id === "hina") { const plus = rnd(12, 22); dmg += plus; n.action = "magic"; n.log.push(`ヒナの星魔法！追加${plus}ダメージ！`); }
  n.bossHp = Math.max(0, n.bossHp - dmg); n.fx = `-${dmg}`; n.log.push(`${h.name}の攻撃！${s.boss}に${dmg}ダメージ`);
  if (n.bossHp <= 0) return win();

  if (n.turn % 2 === 0) {
    let targets = alive(); if (!targets.length) return lose();
    let t = targets[Math.floor(Math.random() * targets.length)];
    const yu = n.party.find(x => x.id === "yu" && x.hp > 0);
    if (yu && t.id !== "yu" && Math.random() < .55) { t = yu; n.log.push("ユウが仲間をかばった！"); }
    let bd = rnd(Math.max(6, s.atk - 3), s.atk + 8); if (t.id === "yu") bd = Math.max(5, Math.round(bd * .65));
    t.hp = Math.max(0, t.hp - bd); n.action = "boss"; n.hit = t.id; n.fx = `-${bd}`; n.log.push(`${s.boss}の攻撃！${hero(t.id).name}に${bd}ダメージ`);
    if (t.hp <= 0) n.log.push(`${hero(t.id).name}はたおれた！`);
    if (!alive().length) return lose();
  }
  if (n.turn >= 14) return n.party.reduce((sum, x) => sum + x.hp, 0) >= n.bossHp ? win() : lose();
  return n;
}

function Logo() { return <div className="logo"><b>まちの</b><strong>冒険隊🛡️</strong></div>; }
function Button({ children, onClick, type = "orange", disabled = false }) { return <button disabled={disabled} onClick={onClick} className={`btn ${type}`}>{children}</button>; }
function Bar({ coins, gems }) { return <div className="bar"><span>🪙{coins}</span><span>💎{gems}</span></div>; }
function Sprite({ h, active }) { return <div className={`sprite ${h.color} ${active ? "active" : ""}`}><i>{h.emoji}</i><b>{h.name}</b><small>{h.role}</small></div>; }
function Boss({ s, dead }) { return <div className={`boss b${s.id} ${dead ? "dead" : ""}`}><i>{s.emoji}</i><b>{s.boss}</b></div>; }
function Page({ children, game }) { return <main className="page"><Style /><div className="top"><Logo /><Bar coins={game.coins} gems={game.gems} /></div>{children}</main>; }

function Title({ game, setGame, has }) {
  return <main className="title"><Style /><div className="sky"><span>☀️</span><span>☁️</span><span>🏰</span><span>🏘️</span></div><Bar coins={game.coins} gems={game.gems} /><section className="panel center"><Logo /><p className="pill">みんなでつくる、わくわく冒険！</p><div className="party">{HEROES.slice(0,3).map(h => <Sprite key={h.id} h={h}/>)}</div></section><section className="panel"><Button onClick={() => setGame(g => ({ ...g, screen: "map" }))}>⚔️ はじめる</Button><div className="grid2"><Button type="green" disabled={!has} onClick={() => setGame(g => ({ ...g, screen: "map" }))}>📜 つづき</Button><Button type="blue" onClick={() => setGame(g => ({ ...g, screen: "help" }))}>📘 あそび方</Button></div></section></main>;
}
function Help({ setGame }) {
  return <Page game={newGame()}><section className="panel"><h1>あそび方</h1><p>1. マップでステージを選ぶ。</p><p>2. バトル開始後、「つぎのターン」で戦闘が進む。</p><p>3. ユウはかばう、ミオは回復、ソラは会心、ヒナは星魔法。</p><p>4. 6ステージをクリアしたら完全クリア！</p><Button type="blue" onClick={() => setGame(g => ({ ...g, screen: "title" }))}>⬅️ もどる</Button></section></Page>;
}
function Map({ game, setGame, party }) {
  return <Page game={game}><section className="panel"><div className="row"><div><h1>ワールドマップ</h1><p>進行度 {Math.round(game.clear / STAGES.length * 100)}%</p></div><button className="mini" onClick={() => setGame(g => ({ ...g, screen: "gacha" }))}>🌈 ガチャ</button></div><div className="mapbg">{STAGES.map(s => { const open = s.id <= game.clear + 1, clear = s.id <= game.clear, sel = s.id === game.stage; return <button key={s.id} onClick={() => setGame(g => ({ ...g, stage: s.id, msg: open ? `${s.place}へ行こう！` : "まだロック中です。" }))} className={`node ${sel ? "sel" : ""} ${!open ? "lock" : ""}`}><b>{s.id}</b><Boss s={s} dead={false}/><small>{s.place}</small><em>{clear ? "★★★" : open ? "OPEN" : "🔒"}</em></button>; })}</div><p className="msg">{game.msg}</p><div className="party small">{party.slice(0,3).map(h => <Sprite key={h.id} h={h}/>)}</div><div className="grid2"><Button onClick={() => setGame(g => ({ ...g, screen: "battle", battle: null, result: null }))}>⚔️ しゅっぱつ！</Button><Button type="dark" onClick={() => setGame(g => ({ ...g, screen: "title" }))}>🏠 タイトル</Button></div></section></Page>;
}
function Battle({ game, setGame, party }) {
  const s = stage(game.stage), b = game.battle && game.battle.id === s.id ? game.battle : null, open = s.id <= game.clear + 1;
  const ratio = b ? Math.max(0, b.bossHp / b.bossMax) : 1;
  const begin = () => open ? setGame(g => ({ ...g, battle: startBattle(party, s), msg: `${s.boss}があらわれた！` })) : setGame(g => ({ ...g, msg: "まだ挑戦できません。" }));
  const turn = () => { if (!b || b.done) return; const n = nextTurn(b, party, s), done = !b.done && n.done; setGame(g => ({ ...g, battle: n, coins: g.coins + (done ? n.coins : 0), clear: done && n.win ? Math.max(g.clear, s.id) : g.clear, gems: done && n.win && s.id === 6 ? g.gems + 1 : g.gems, msg: n.done ? (n.win ? "クリア！" : "ざんねん！") : `ターン${n.turn}` })); };
  const result = () => b && b.done && setGame(g => ({ ...g, screen: "result", result: { s, win: b.win, coins: b.coins, item: b.item, stars: b.stars, log: b.log } }));
  return <Page game={game}><section className="panel"><h1>STAGE {s.id} / {s.place}</h1><h2>{s.name}</h2><div className={`arena ${b?.action || ""}`}><Boss s={s} dead={b?.action === "victory"}/><div className="hp"><span style={{width:`${ratio*100}%`}} /></div><p>HP {b ? b.bossHp : s.hp} / {s.hp}</p>{b?.fx && ["attack","critical","magic"].includes(b.action) && <div className="fx bossfx">{b.fx}</div>}</div><div className="team">{party.slice(0,3).map(h => { const st = b?.party.find(x => x.id === h.id); const hp = st ? st.hp : h.hp, max = st ? st.max : h.hp; const hit = b?.hit === h.id, act = b?.active === h.id; return <div key={h.id} className={`card ${hit ? "hit" : ""} ${act ? "act" : ""} ${hp <= 0 ? "down" : ""}`}><Sprite h={h} active={act}/><div className="hp mini"><span style={{width:`${Math.max(0,hp/max)*100}%`}} /></div><small>{hp}/{max}</small>{hit && <div className="fx smallfx">{b.fx}</div>}</div>; })}</div><div className="log">{(b?.log?.slice(-8) || ["バトル開始でスタート！"]).map((x,i) => <p key={i}>{x}</p>)}</div><div className="grid2">{!b && <><Button onClick={begin}>⚔️ バトル開始</Button><Button type="blue" onClick={() => setGame(g => ({ ...g, screen: "map" }))}>⬅️ もどる</Button></>}{b && !b.done && <><Button onClick={turn}>👉 つぎのターン</Button><Button type="blue" onClick={() => setGame(g => ({ ...g, screen: "map", battle: null }))}>🏃 にげる</Button></>}{b?.done && <><Button type="green" onClick={result}>🎉 結果へ</Button><Button type="blue" onClick={() => setGame(g => ({ ...g, screen: "map", battle: null }))}>🏠 まちへ</Button></>}</div></section></Page>;
}
function Result({ game, setGame }) {
  const r = game.result; if (!r) return null;
  return <Page game={game}><section className="panel center"><h1 className={r.win ? "win" : "lose"}>{r.win ? "クリア！" : "ざんねん！"}</h1>{r.win ? <div className="trophy">🏆</div> : <Boss s={r.s} dead/>}<h2>{r.s.name}</h2><h2 className="star">{"★".repeat(r.stars)}{"☆".repeat(3-r.stars)}</h2><div className="grid2"><div className="reward">🪙<b>+{r.coins}</b></div><div className="reward">🎁<b>{r.item || "なし"}</b></div></div><div className="log">{r.log.map((x,i)=><p key={i}>{x}</p>)}</div><div className="grid2"><Button onClick={() => setGame(g => ({ ...g, stage: Math.min(g.clear+1, 6), screen: "map", battle: null, result: null }))}>➡️ つぎへ</Button><Button type="blue" onClick={() => setGame(g => ({ ...g, screen: "battle", battle: null, result: null }))}>🔁 もう一度</Button></div></section></Page>;
}
function Gacha({ game, setGame }) {
  const roll = () => { if (game.gems <= 0 && game.coins < 80) return setGame(g => ({ ...g, screen: "map", msg: "宝石か80コインが必要です。" })); const h = Math.random() < .08 ? hero("hina") : Math.random() < .4 ? hero("sora") : Math.random() < .65 ? hero("mio") : hero("yu"); setGame(g => { const old = g.heroes.includes(h.id), useGem = g.gems > 0; return { ...g, gems: useGem ? g.gems-1 : g.gems, coins: g.coins - (useGem ? 0 : 80) + (old ? 30 : 0), heroes: old ? g.heroes : [...g.heroes, h.id], gacha: { h, old } }; }); };
  return <Page game={game}><section className="panel center gacha"><h1>スターガチャ</h1><div className="portal">{game.gacha ? <Sprite h={game.gacha.h} active/> : "🎁"}</div>{game.gacha ? <><h2>{game.gacha.old ? "もう仲間です" : "NEW!"}</h2><h1>★{game.gacha.h.rare} {game.gacha.h.name}</h1><p className="msg">{game.gacha.h.line}</p></> : <p>宝石1個、または80コインで1回！</p>}<div className="grid2"><Button type="pink" onClick={roll}>💎 まわす</Button><Button onClick={() => setGame(g => ({ ...g, screen: "map", gacha: null }))}>OK</Button></div></section></Page>;
}

function Style(){return <style>{CSS}</style>}
const CSS = `
*{box-sizing:border-box}button{touch-action:manipulation}.page,.title{min-height:100vh;padding:16px;background:linear-gradient(#8ed8ff,#fff,#b8f7d0);color:#0f172a;overflow:hidden}.title{display:flex;flex-direction:column;justify-content:space-between;position:relative}.sky{position:absolute;inset:0;pointer-events:none}.sky span{position:absolute;font-size:58px;filter:drop-shadow(0 4px 3px #0003)}.sky span:nth-child(1){right:10%;top:8%;animation:spin 18s linear infinite}.sky span:nth-child(2){left:8%;top:14%}.sky span:nth-child(3){left:6%;bottom:18%}.sky span:nth-child(4){right:6%;bottom:16%}.top{display:flex;justify-content:space-between;gap:10px;align-items:flex-start}.logo{line-height:.85;filter:drop-shadow(0 4px 0 #0003)}.logo b{display:block;font-size:30px;color:#65a30d}.logo strong{font-size:44px;color:#f59e0b}.bar{display:flex;gap:7px}.bar span{display:block;background:#fff7ed;border:4px solid #fbbf24;border-radius:18px;padding:7px;font-weight:900;box-shadow:0 6px 12px #0002}.panel{position:relative;z-index:1;background:#ffffffdd;border-radius:30px;padding:16px;box-shadow:0 20px 45px #0002;backdrop-filter:blur(8px);margin:0 auto 14px;max-width:430px}.center{text-align:center}.pill,.msg{display:inline-block;background:#eff6ff;color:#1d4ed8;border-radius:999px;padding:8px 14px;font-weight:900}.row{display:flex;justify-content:space-between;gap:8px;align-items:center}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:10px}.btn{width:100%;border:4px solid #9a3412;border-radius:22px;padding:14px 10px;font-size:18px;font-weight:1000;color:white;background:linear-gradient(#fcd34d,#f97316);box-shadow:0 8px 0 #0002;transition:.1s}.btn:active{transform:scale(.96)}.btn.blue{background:linear-gradient(#7dd3fc,#2563eb);border-color:#1e3a8a}.btn.green{background:linear-gradient(#bef264,#10b981);border-color:#047857}.btn.pink{background:linear-gradient(#f9a8d4,#e11d48);border-color:#9f1239}.btn.dark{background:linear-gradient(#475569,#020617);border-color:#020617}.btn:disabled{opacity:.45}.mini{background:#fae8ff;color:#a21caf;border:0;border-radius:18px;padding:10px;font-weight:1000}.party,.team{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}.party.small .sprite{min-height:88px}.sprite{position:relative;min-height:118px;border-radius:25px;background:#fff8;border:4px solid #fff;display:grid;place-items:center;padding:5px;box-shadow:0 9px 18px #0002;animation:bob 2.4s ease-in-out infinite;overflow:hidden}.sprite:before{content:"";position:absolute;inset:8px;border-radius:999px;filter:blur(8px);opacity:.22}.sprite i{font-size:40px;z-index:2;filter:drop-shadow(0 4px 2px #0003)}.sprite b,.sprite small{z-index:2;font-weight:1000}.sprite small{font-size:11px}.sprite.blue:before{background:#2563eb}.sprite.pink:before{background:#e11d48}.sprite.yellow:before{background:#f59e0b}.sprite.purple:before{background:#9333ea}.active{animation:jump .55s ease-out both}.mapbg{position:relative;display:grid;grid-template-columns:1fr 1fr;gap:10px;background:linear-gradient(135deg,#d9f99d,#bae6fd,#ddd6fe);border-radius:26px;padding:12px;overflow:hidden}.mapbg:before{content:"";position:absolute;left:45%;top:-20%;width:42px;height:140%;background:#fcd34d88;transform:rotate(28deg);border-radius:999px}.node{position:relative;border:4px solid #fff;background:#fffd;border-radius:24px;padding:8px;font-weight:1000;box-shadow:0 8px 14px #0002}.node.sel{border-color:#2563eb}.node.lock{filter:grayscale(1);opacity:.6}.node>b{display:grid;place-items:center;background:#3b82f6;color:white;width:34px;height:34px;border-radius:999px}.boss{position:relative;display:grid;place-items:center;min-height:85px;animation:boss 2.2s ease-in-out infinite}.boss i{font-size:54px;filter:drop-shadow(0 7px 4px #0003)}.boss b{font-weight:1000}.dead{animation:dead .7s ease-out both}.arena{position:relative;text-align:center;background:#fff8;border-radius:28px;padding:13px;box-shadow:inset 0 0 25px #0001;overflow:hidden}.arena.boss{box-shadow:inset 0 0 35px #ef444455}.hp{height:15px;background:#cbd5e1;border:2px solid #0f172a;border-radius:999px;overflow:hidden}.hp span{display:block;height:100%;background:linear-gradient(90deg,#22c55e,#facc15,#ef4444);transition:.45s}.hp.mini{height:10px}.card{position:relative;text-align:center;background:#f8fafc;border:4px solid #fff;border-radius:24px;padding:7px;box-shadow:0 8px 14px #0002}.card.act{animation:attack .45s ease-out both}.card.hit{animation:hit .4s ease-out both}.card.down{filter:grayscale(1);opacity:.55}.fx{position:absolute;left:50%;top:30%;transform:translateX(-50%);font-size:35px;font-weight:1000;color:#ef4444;-webkit-text-stroke:2px #fff;animation:float .8s ease-out both;pointer-events:none}.smallfx{top:5px;font-size:22px}.log{max-height:145px;overflow:auto;background:#020617;color:white;border-radius:18px;padding:10px;font-size:12px;font-weight:800;text-align:left}.log p{margin:0 0 4px}.win{color:#f97316}.lose{color:#2563eb}.star{color:#f59e0b}.trophy{font-size:72px}.reward{background:#fef3c7;border-radius:22px;padding:14px;font-size:32px;font-weight:1000}.gacha{background:linear-gradient(#312e81dd,#a21cafcc);color:#fff}.portal{height:190px;width:190px;margin:15px auto;border-radius:999px;background:radial-gradient(#fff,#fde68a,#f0abfc,#7dd3fc);display:grid;place-items:center;font-size:70px;box-shadow:0 0 55px #fff;animation:pulse 1.8s infinite}
@keyframes bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes jump{0%{transform:translateY(0) scale(1)}45%{transform:translateY(-16px) scale(1.08)}100%{transform:translateY(0) scale(1)}}@keyframes boss{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-8px) rotate(2deg)}}@keyframes attack{0%{transform:translateX(0)}40%{transform:translateX(16px) translateY(-10px) scale(1.08)}100%{transform:translateX(0)}}@keyframes hit{0%,100%{transform:translateX(0)}25%{transform:translateX(-7px)}50%{transform:translateX(7px)}75%{transform:translateX(-4px)}}@keyframes float{0%{opacity:0;transform:translate(-50%,8px) scale(.8)}20%{opacity:1}100%{opacity:0;transform:translate(-50%,-45px) scale(1.25)}}@keyframes dead{to{transform:rotate(18deg) scale(.7);opacity:.45}}@keyframes pulse{50%{transform:scale(1.06)}}@keyframes spin{to{transform:rotate(360deg)}}
`;

function tests(){try{const g=newGame();console.assert(g.coins===160,"coins");console.assert(g.heroes.length===3,"heroes");console.assert(stars(3)==="★★★☆☆","stars");const p=g.heroes.map(hero),s=STAGES[0],b=startBattle(p,s),n=nextTurn(b,p,s);console.assert(n.turn===1,"turn");console.assert(n.log.length>=2,"log")}catch(e){console.error("self test failed",e)}}

export default function App(){const [game,setGame]=useState(newGame),[ready,setReady]=useState(false),[has,setHas]=useState(false);useEffect(()=>{tests();try{setHas(!!localStorage.getItem(SAVE))}catch{}setGame(load());setReady(true)},[]);useEffect(()=>{if(ready){save(game);setHas(true)}},[game,ready]);const party=useMemo(()=>game.heroes.map(hero),[game.heroes]);if(game.screen==="title")return <Title game={game} setGame={setGame} has={has}/>;if(game.screen==="help")return <Help setGame={setGame}/>;if(game.screen==="map")return <Map game={game} setGame={setGame} party={party}/>;if(game.screen==="battle")return <Battle game={game} setGame={setGame} party={party}/>;if(game.screen==="result")return <Result game={game} setGame={setGame}/>;if(game.screen==="gacha")return <Gacha game={game} setGame={setGame}/>;return <Title game={game} setGame={setGame} has={has}/>}
