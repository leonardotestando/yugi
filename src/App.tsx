import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Sword, Shield, Sparkles } from 'lucide-react';
import { Card } from './components/Card';
import { GameCard, Action, GameState } from './types';
import { playDrawSound, playSummonSound, playSpellSound, playAttackSound, playDamageSound, playHealSound } from './utils/audio';

type InteractionState = 
  | { type: 'IDLE' }
  | { type: 'SELECTED_HAND'; card: GameCard }
  | { type: 'SELECTED_ATTACKER'; monsterIndex: number }
  | { type: 'SELECTED_MONSTER'; monsterIndex: number };

export default function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [role, setRole] = useState<'player1' | 'player2' | 'spectator' | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  
  const [interaction, setInteraction] = useState<InteractionState>({ type: 'IDLE' });
  const [dragOverZone, setDragOverZone] = useState<{ type: 'MONSTER' | 'SPELL', index: number } | null>(null);

  const [p1Effect, setP1Effect] = useState<'damage' | 'heal' | null>(null);
  const [p2Effect, setP2Effect] = useState<'damage' | 'heal' | null>(null);
  const [prevP1Lp, setPrevP1Lp] = useState(8000);
  const [prevP2Lp, setPrevP2Lp] = useState(8000);

  useEffect(() => {
    let hash = window.location.hash.slice(1);
    if (!hash) {
      hash = Math.random().toString(36).substring(2, 9);
      window.location.hash = hash;
    }
    setRoomId(hash);
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    setHasJoined(true);
    const newSocket = io();
    setSocket(newSocket);

    newSocket.emit('join', { roomId, playerName: playerName.trim() });

    newSocket.on('role', (assignedRole) => {
      setRole(assignedRole);
    });

    newSocket.on('gameState', (newState: GameState) => {
      setState(newState);
    });
  };

  useEffect(() => {
    return () => {
      if (socket) socket.close();
    };
  }, [socket]);

  useEffect(() => {
    if (!state) return;
    if (state.player1.lp < prevP1Lp) {
      setP1Effect('damage');
      playDamageSound();
      const timer = setTimeout(() => setP1Effect(null), 600);
      return () => clearTimeout(timer);
    } else if (state.player1.lp > prevP1Lp) {
      setP1Effect('heal');
      playHealSound();
      const timer = setTimeout(() => setP1Effect(null), 600);
      return () => clearTimeout(timer);
    }
    setPrevP1Lp(state.player1.lp);
  }, [state?.player1.lp, prevP1Lp]);

  useEffect(() => {
    if (!state) return;
    if (state.player2.lp < prevP2Lp) {
      setP2Effect('damage');
      playDamageSound();
      const timer = setTimeout(() => setP2Effect(null), 600);
      return () => clearTimeout(timer);
    } else if (state.player2.lp > prevP2Lp) {
      setP2Effect('heal');
      playHealSound();
      const timer = setTimeout(() => setP2Effect(null), 600);
      return () => clearTimeout(timer);
    }
    setPrevP2Lp(state.player2.lp);
  }, [state?.player2.lp, prevP2Lp]);

  const dispatch = (action: Action) => {
    if (socket && state && state.turn === role && state.status === 'playing') {
      switch (action.type) {
        case 'DRAW_CARD': playDrawSound(); break;
        case 'SUMMON_MONSTER': playSummonSound(); break;
        case 'ACTIVATE_SPELL': playSpellSound(); break;
        case 'ATTACK': playAttackSound(); break;
      }
      socket.emit('action', action);
    }
  };

  if (!hasJoined) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-black text-white font-mono bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
        <div className="bg-zinc-900/80 p-8 border-4 border-blue-900 rounded-lg shadow-[0_0_30px_rgba(59,130,246,0.5)] flex flex-col items-center max-w-md w-full mx-4">
          <h1 className="text-4xl font-bold text-yellow-500 mb-8 text-center tracking-widest drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">DUEL MONSTERS</h1>
          
          <form onSubmit={handleJoin} className="w-full flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-blue-400 font-bold uppercase tracking-wider text-sm">Seu Nome</label>
              <input 
                type="text" 
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Digite seu nome..."
                className="bg-black border-2 border-zinc-700 p-3 text-white font-bold focus:outline-none focus:border-yellow-500 transition-colors"
                maxLength={15}
                required
              />
            </div>

            <button 
              type="submit"
              className="mt-4 bg-blue-700 hover:bg-blue-600 border-2 border-blue-400 text-white font-bold py-4 text-xl uppercase tracking-widest transition-transform hover:scale-105 active:scale-95"
            >
              Entrar no Duelo
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!state || !role) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-black text-white font-mono bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
        <div className="text-2xl mb-4 animate-pulse text-yellow-500">Conectando ao servidor multiplayer...</div>
      </div>
    );
  }

  if (state.status === 'waiting') {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-black text-white font-mono bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
        <div className="text-2xl sm:text-3xl mb-6 animate-pulse text-yellow-500 font-bold tracking-widest text-center px-4">Aguardando segundo jogador...</div>
        <div className="bg-zinc-900/80 p-6 border-2 border-blue-900 rounded-lg flex flex-col items-center gap-4 max-w-lg w-full mx-4 text-center">
          <span className="text-zinc-400">Compartilhe este link com seu amigo para ele entrar na partida:</span>
          <div className="bg-black border border-zinc-700 p-3 rounded text-blue-400 font-bold select-all w-full overflow-x-auto whitespace-nowrap">
            {window.location.href}
          </div>
        </div>
      </div>
    );
  }

  const isMyTurn = state.turn === role;
  const me = role === 'player2' ? state.player2 : state.player1;
  const opponent = role === 'player2' ? state.player1 : state.player2;
  const myEffect = role === 'player2' ? p2Effect : p1Effect;
  const oppEffect = role === 'player2' ? p1Effect : p2Effect;

  const handleNextPhase = () => {
    if (isMyTurn) {
      dispatch({ type: 'NEXT_PHASE' });
      setInteraction({ type: 'IDLE' });
    }
  };

  const handleDeckClick = () => {
    if (isMyTurn && state.phase === 'DRAW') {
      dispatch({ type: 'DRAW_CARD' });
    }
  };

  const handleHandCardClick = (card: GameCard) => {
    if (!isMyTurn) return;
    if (state.phase !== 'MAIN_1' && state.phase !== 'MAIN_2') return;
    setInteraction({ type: 'SELECTED_HAND', card });
  };

  const handleSummon = (position: 'ATTACK' | 'SET') => {
    if (interaction.type !== 'SELECTED_HAND' || interaction.card.type !== 'MONSTER') return;
    const emptyZoneIdx = me.monsterZone.findIndex(z => z === null);
    if (emptyZoneIdx !== -1) {
      dispatch({ type: 'SUMMON_MONSTER', cardId: interaction.card.id, zoneIndex: emptyZoneIdx, position });
      setInteraction({ type: 'IDLE' });
    }
  };

  const handleActivate = () => {
    if (interaction.type !== 'SELECTED_HAND' || interaction.card.type !== 'SPELL') return;
    const emptyZoneIdx = me.spellZone.findIndex(z => z === null);
    if (emptyZoneIdx !== -1) {
      dispatch({ type: 'ACTIVATE_SPELL', cardId: interaction.card.id, zoneIndex: emptyZoneIdx });
      setInteraction({ type: 'IDLE' });
    }
  };

  const handlePlayerMonsterClick = (index: number) => {
    if (!isMyTurn) return;
    const monster = me.monsterZone[index];
    if (!monster) return;
    
    if (state.phase === 'MAIN_1' || state.phase === 'MAIN_2') {
      setInteraction({ type: 'SELECTED_MONSTER', monsterIndex: index });
    } else if (state.phase === 'BATTLE' && monster.position === 'ATTACK' && monster.canAttack && !monster.hasAttacked) {
      setInteraction({ type: 'SELECTED_ATTACKER', monsterIndex: index });
    }
  };

  const handleChangePosition = (position: 'ATTACK' | 'DEFENSE') => {
    if (interaction.type !== 'SELECTED_MONSTER') return;
    dispatch({ type: 'CHANGE_POSITION', zoneIndex: interaction.monsterIndex, position });
    setInteraction({ type: 'IDLE' });
  };

  const handleOpponentMonsterClick = (index: number) => {
    if (interaction.type === 'SELECTED_ATTACKER') {
      dispatch({ type: 'ATTACK', attackerIndex: interaction.monsterIndex, targetIndex: index });
      setInteraction({ type: 'IDLE' });
    }
  };

  const handleDirectAttack = () => {
    if (interaction.type === 'SELECTED_ATTACKER' && !opponent.monsterZone.some(m => m !== null)) {
      dispatch({ type: 'ATTACK', attackerIndex: interaction.monsterIndex, targetIndex: null });
      setInteraction({ type: 'IDLE' });
    }
  };

  const handleDragStart = (e: React.DragEvent, card: GameCard) => {
    if (!isMyTurn) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('cardId', card.id);
    e.dataTransfer.setData('cardType', card.type);
    setInteraction({ type: 'SELECTED_HAND', card });
  };

  const handleDragOver = (e: React.DragEvent, type: 'MONSTER' | 'SPELL', index: number) => {
    e.preventDefault();
    if (dragOverZone?.type !== type || dragOverZone?.index !== index) {
      setDragOverZone({ type, index });
    }
  };

  const handleDragLeave = () => {
    setDragOverZone(null);
  };

  const handleDrop = (e: React.DragEvent, type: 'MONSTER' | 'SPELL', index: number) => {
    e.preventDefault();
    setDragOverZone(null);
    
    if (interaction.type !== 'SELECTED_HAND') return;
    
    const cardType = e.dataTransfer.getData('cardType');
    if (cardType !== type) return;

    if (type === 'MONSTER' && me.monsterZone[index] === null) {
      dispatch({ type: 'SUMMON_MONSTER', cardId: interaction.card.id, zoneIndex: index, position: 'ATTACK' });
    } else if (type === 'SPELL' && me.spellZone[index] === null) {
      dispatch({ type: 'ACTIVATE_SPELL', cardId: interaction.card.id, zoneIndex: index });
    }
    setInteraction({ type: 'IDLE' });
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-white select-none overflow-hidden font-sans relative bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
      
      {role === 'spectator' && (
        <div className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold z-50">
          MODO ESPECTADOR
        </div>
      )}

      {/* Hand Card Modal */}
      {interaction.type === 'SELECTED_HAND' && isMyTurn && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
          <div className="relative animate-in zoom-in duration-200">
            <Card card={interaction.card} size="large" />
            <button 
              onClick={() => setInteraction({ type: 'IDLE' })}
              className="absolute -top-4 -right-4 bg-red-600 hover:bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold border-2 border-white shadow-lg transition-transform hover:scale-110"
            >
              X
            </button>
          </div>
          <div className="mt-8 flex gap-4 animate-in slide-in-from-bottom-8 duration-300">
            {interaction.card.type === 'MONSTER' ? (
              <>
                <button onClick={() => handleSummon('ATTACK')} className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-lg text-lg font-bold shadow-lg shadow-blue-500/20 transition-transform hover:scale-105 border-2 border-blue-400">Invocar (Ataque)</button>
                <button onClick={() => handleSummon('SET')} className="bg-amber-600 hover:bg-amber-500 px-6 py-3 rounded-lg text-lg font-bold shadow-lg shadow-amber-500/20 transition-transform hover:scale-105 border-2 border-amber-400">Baixar (Defesa)</button>
              </>
            ) : (
              <button onClick={() => handleActivate()} className="bg-emerald-600 hover:bg-emerald-500 px-6 py-3 rounded-lg text-lg font-bold shadow-lg shadow-emerald-500/20 transition-transform hover:scale-105 border-2 border-emerald-400">Ativar</button>
            )}
          </div>
        </div>
      )}

      {/* Opponent Area */}
      <div className="h-1/2 flex flex-col justify-start p-2 sm:p-4 bg-black/40 relative overflow-hidden" onClick={handleDirectAttack}>
        {/* Damage Flash Effect */}
        <div className={`absolute inset-0 bg-red-600/40 z-40 pointer-events-none transition-opacity duration-300 ${oppEffect === 'damage' ? 'opacity-100' : 'opacity-0'}`} />
        
        {interaction.type === 'SELECTED_ATTACKER' && !opponent.monsterZone.some(m => m !== null) && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/10 cursor-crosshair z-0">
            <span className="text-red-500 font-bold text-2xl animate-pulse">Clique para Ataque Direto!</span>
          </div>
        )}
        
        <div className="flex justify-between items-start w-full max-w-4xl mx-auto z-10">
          {/* Opponent Deck & Graveyard (Left side from our perspective) */}
          <div className="flex flex-col gap-1">
            <div className="w-14 h-20 sm:w-16 sm:h-24 border-2 border-zinc-700 bg-black/50 flex items-center justify-center text-zinc-500 text-[10px] font-bold">
              {opponent.graveyard.length > 0 ? (
                <Card card={opponent.graveyard[opponent.graveyard.length - 1]} />
              ) : (
                'CEM'
              )}
            </div>
            <div className="w-14 h-20 sm:w-16 sm:h-24 border-2 border-zinc-700 bg-black/50 flex items-center justify-center text-zinc-500 text-[10px] font-bold relative">
              {opponent.deck.length > 0 ? (
                <div className="absolute inset-0 bg-[#4a3b2c] border-[3px] border-[#2a1b0c] shadow-md bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] flex items-center justify-center text-white font-bold text-lg">
                  {opponent.deck.length}
                </div>
              ) : (
                'DECK'
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center">
            {/* Hand */}
            <div className="flex justify-center gap-1 sm:gap-2 h-20 sm:h-24 z-10 mb-2">
              {opponent.hand.map((c, i) => (
                <div key={i} className="w-14 h-20 sm:w-16 sm:h-24">
                  <Card card={c} isHidden />
                </div>
              ))}
            </div>
            
            {/* Spells */}
            <div className="flex justify-center gap-1 sm:gap-2 z-10 mb-1">
              {opponent.spellZone.map((c, i) => (
                <div key={`p2s${i}`} className="relative w-14 h-20 sm:w-16 sm:h-24 border-2 border-emerald-900/50 bg-emerald-950/30 flex items-center justify-center">
                  {c && (
                    <div className="absolute -bottom-2 -left-2 z-30 bg-black/80 rounded-full p-0.5 border border-zinc-600">
                      <Sparkles size={12} className="text-emerald-400 animate-pulse" />
                    </div>
                  )}
                  <Card card={c} />
                </div>
              ))}
            </div>
            
            {/* Monsters */}
            <div className="flex justify-center gap-1 sm:gap-2 z-10">
              {opponent.monsterZone.map((c, i) => {
                const isAttack = c?.position === 'ATTACK';
                return (
                  <div key={`p2m${i}`} className="relative w-14 h-20 sm:w-16 sm:h-24 border-2 border-blue-900/50 bg-blue-950/30 flex items-center justify-center">
                    {c && c.position !== 'SET' && (
                      <div className="absolute -bottom-2 -left-2 z-30 bg-black/80 rounded-full p-0.5 border border-zinc-600">
                        {isAttack ? <Sword size={12} className="text-red-400" /> : <Shield size={12} className="text-blue-400" />}
                      </div>
                    )}
                    <Card 
                      card={c} 
                      isTargetable={interaction.type === 'SELECTED_ATTACKER' && c !== null}
                      onClick={() => c && handleOpponentMonsterClick(i)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Spacer for right side to keep center aligned */}
          <div className="w-14 sm:w-16"></div>
        </div>
      </div>
      
      {/* Center Dividing Line */}
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.5)] -translate-y-1/2 z-0 pointer-events-none" />

      {/* Center UI Overlay */}
      <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 flex justify-between items-center px-2 sm:px-8 pointer-events-none z-30">
        {/* Opponent LP */}
        <div className="flex flex-col bg-black/80 border-2 border-zinc-700 p-1 sm:p-2 rounded pointer-events-auto shadow-lg">
          <span className="text-[8px] sm:text-xs text-yellow-500 font-bold tracking-widest uppercase truncate max-w-[100px] sm:max-w-[150px]">{opponent.name} LP</span>
          <span className={`inline-block text-lg sm:text-3xl font-bold font-mono transition-all duration-300 ${oppEffect === 'heal' ? 'text-green-400 scale-125 animate-pulse' : oppEffect === 'damage' ? 'text-red-500 scale-110' : 'text-white'}`}>
            {opponent.lp.toString().padStart(4, '0')}
          </span>
        </div>
        
        {/* Phase / Actions */}
        <div className="flex flex-col items-center gap-1 sm:gap-2 bg-black/80 border-2 border-zinc-700 p-1 sm:p-2 rounded pointer-events-auto shadow-lg">
          <div className="flex gap-1 sm:gap-2 text-[8px] sm:text-[10px] font-bold uppercase tracking-wider">
            {['DRAW', 'MAIN_1', 'BATTLE', 'MAIN_2', 'END'].map(p => (
              <div key={p} className={`px-1 sm:px-2 py-0.5 sm:py-1 border ${state.phase === p ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-transparent border-zinc-700 text-zinc-500'}`}>
                {p === 'DRAW' ? 'COMPRA' : p === 'MAIN_1' ? 'PRINCIPAL 1' : p === 'BATTLE' ? 'BATALHA' : p === 'MAIN_2' ? 'PRINCIPAL 2' : 'FIM'}
              </div>
            ))}
          </div>
          
          <div className="flex items-center justify-center">
            {interaction.type === 'SELECTED_MONSTER' && (
              <div className="flex gap-1 sm:gap-2">
                <button onClick={() => handleChangePosition('ATTACK')} className="bg-blue-900 hover:bg-blue-800 border border-blue-500 px-2 py-0.5 sm:py-1 text-[8px] sm:text-xs font-bold uppercase tracking-wider">Ataque</button>
                <button onClick={() => handleChangePosition('DEFENSE')} className="bg-blue-900 hover:bg-blue-800 border border-blue-500 px-2 py-0.5 sm:py-1 text-[8px] sm:text-xs font-bold uppercase tracking-wider">Defesa</button>
                <button onClick={() => setInteraction({ type: 'IDLE' })} className="bg-red-900 hover:bg-red-800 border border-red-500 px-2 py-0.5 sm:py-1 text-[8px] sm:text-xs font-bold uppercase tracking-wider">Cancelar</button>
              </div>
            )}
            
            {interaction.type === 'SELECTED_ATTACKER' && (
              <div className="flex gap-2 items-center">
                <span className="text-red-400 text-[10px] sm:text-xs font-bold animate-pulse uppercase tracking-wider">Selecione o alvo</span>
                <button onClick={() => setInteraction({ type: 'IDLE' })} className="bg-red-900 hover:bg-red-800 border border-red-500 px-2 py-0.5 sm:py-1 text-[8px] sm:text-xs font-bold uppercase tracking-wider">Cancelar</button>
              </div>
            )}
            
            {interaction.type === 'IDLE' && isMyTurn && state.phase !== 'DRAW' && (
              <button onClick={handleNextPhase} className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-500 text-white px-3 sm:px-4 py-0.5 sm:py-1 text-[8px] sm:text-xs font-bold uppercase tracking-wider">
                Próxima Fase
              </button>
            )}
            {interaction.type === 'IDLE' && isMyTurn && state.phase === 'DRAW' && (
              <span className="text-yellow-400 text-[10px] sm:text-xs font-bold animate-pulse uppercase tracking-wider">Compre uma carta!</span>
            )}
            {interaction.type === 'IDLE' && !isMyTurn && (
              <span className="text-zinc-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">Turno de {opponent.name}</span>
            )}
          </div>
        </div>
        
        {/* My LP */}
        <div className="flex flex-col items-end bg-black/80 border-2 border-zinc-700 p-1 sm:p-2 rounded pointer-events-auto shadow-lg">
          <span className="text-[8px] sm:text-xs text-yellow-500 font-bold tracking-widest uppercase truncate max-w-[100px] sm:max-w-[150px]">{me.name} LP</span>
          <span className={`inline-block text-lg sm:text-3xl font-bold font-mono transition-all duration-300 ${myEffect === 'heal' ? 'text-green-400 scale-125 animate-pulse' : myEffect === 'damage' ? 'text-red-500 scale-110' : 'text-white'}`}>
            {me.lp.toString().padStart(4, '0')}
          </span>
        </div>
      </div>

      {/* Player Area */}
      <div className="h-1/2 flex flex-col justify-end p-2 sm:p-4 bg-black/40 relative overflow-hidden">
        {/* Damage Flash Effect */}
        <div className={`absolute inset-0 bg-red-600/40 z-40 pointer-events-none transition-opacity duration-300 ${myEffect === 'damage' ? 'opacity-100' : 'opacity-0'}`} />

        <div className="flex justify-between items-end w-full max-w-4xl mx-auto h-full z-10">
          {/* Spacer for left side to keep center aligned */}
          <div className="w-14 sm:w-16"></div>

          <div className="flex-1 flex flex-col items-center justify-end h-full">
            {/* Monsters */}
            <div className="flex justify-center gap-1 sm:gap-2 z-10 mb-1">
              {me.monsterZone.map((c, i) => {
                const isAttack = c?.position === 'ATTACK';
                return (
                  <div 
                    key={`p1m${i}`} 
                    className={`relative w-14 h-20 sm:w-16 sm:h-24 border-2 flex items-center justify-center transition-colors ${dragOverZone?.type === 'MONSTER' && dragOverZone?.index === i ? 'border-yellow-400 bg-yellow-400/20' : 'border-blue-900/50 bg-blue-950/30'}`}
                    onDragOver={(e) => handleDragOver(e, 'MONSTER', i)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 'MONSTER', i)}
                  >
                    {c && (
                      <div className="absolute -top-2 -right-2 z-30 bg-black/80 rounded-full p-0.5 border border-zinc-600">
                        {isAttack ? <Sword size={12} className="text-red-400" /> : <Shield size={12} className="text-blue-400" />}
                      </div>
                    )}
                    <Card 
                      card={c} 
                      isSelected={interaction.type === 'SELECTED_MONSTER' && interaction.monsterIndex === i || interaction.type === 'SELECTED_ATTACKER' && interaction.monsterIndex === i}
                      onClick={() => handlePlayerMonsterClick(i)}
                    />
                  </div>
                );
              })}
            </div>
            
            {/* Spells */}
            <div className="flex justify-center gap-1 sm:gap-2 z-10 mb-2">
              {me.spellZone.map((c, i) => (
                <div 
                  key={`p1s${i}`} 
                  className={`relative w-14 h-20 sm:w-16 sm:h-24 border-2 flex items-center justify-center transition-colors ${dragOverZone?.type === 'SPELL' && dragOverZone?.index === i ? 'border-yellow-400 bg-yellow-400/20' : 'border-emerald-900/50 bg-emerald-950/30'}`}
                  onDragOver={(e) => handleDragOver(e, 'SPELL', i)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, 'SPELL', i)}
                >
                  {c && (
                    <div className="absolute -top-2 -right-2 z-30 bg-black/80 rounded-full p-0.5 border border-zinc-600">
                      <Sparkles size={12} className="text-emerald-400 animate-pulse" />
                    </div>
                  )}
                  <Card card={c} />
                </div>
              ))}
            </div>
            
            {/* Hand */}
            <div className="flex justify-center gap-1 sm:gap-2 h-20 sm:h-24 z-10">
              {me.hand.map((c, i) => (
                <div key={i} className="w-14 h-20 sm:w-16 sm:h-24">
                  <Card 
                    card={c} 
                    isSelected={interaction.type === 'SELECTED_HAND' && interaction.card.id === c.id}
                    onClick={() => handleHandCardClick(c)}
                    draggable={isMyTurn && (state.phase === 'MAIN_1' || state.phase === 'MAIN_2')}
                    onDragStart={(e) => handleDragStart(e, c)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Player Deck & Graveyard (Right side) */}
          <div className="flex flex-col gap-1">
            <div className="w-14 h-20 sm:w-16 sm:h-24 border-2 border-zinc-700 bg-black/50 flex items-center justify-center text-zinc-500 text-[10px] font-bold">
              {me.graveyard.length > 0 ? (
                <Card card={me.graveyard[me.graveyard.length - 1]} />
              ) : (
                'CEM'
              )}
            </div>
            <div 
              className={`w-14 h-20 sm:w-16 sm:h-24 border-2 border-zinc-700 bg-black/50 flex items-center justify-center text-zinc-500 text-[10px] font-bold relative ${isMyTurn && state.phase === 'DRAW' ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
              onClick={handleDeckClick}
            >
              {me.deck.length > 0 ? (
                <div className={`absolute inset-0 bg-[#4a3b2c] border-[3px] border-[#2a1b0c] shadow-md bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] flex items-center justify-center text-white font-bold text-lg ${isMyTurn && state.phase === 'DRAW' ? 'ring-4 ring-yellow-400 animate-pulse' : ''}`}>
                  {me.deck.length}
                </div>
              ) : (
                'DECK'
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
