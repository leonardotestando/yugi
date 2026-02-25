import { GameState, Action, Phase, GameCard } from '../types';
import { CARD_DATABASE } from '../data/cards';

const cloneState = (state: GameState): GameState => JSON.parse(JSON.stringify(state));

export function createDeck(): GameCard[] {
  const deck: GameCard[] = [];
  for (let i = 0; i < 40; i++) {
    const template = CARD_DATABASE[Math.floor(Math.random() * CARD_DATABASE.length)];
    deck.push({ ...template, id: `c_${Math.random().toString(36).substr(2, 9)}` });
  }
  return deck;
}

export function createInitialState(): GameState {
  const p1Deck = createDeck();
  const p2Deck = createDeck();
  
  const p1Hand = p1Deck.splice(0, 5);
  const p2Hand = p2Deck.splice(0, 5);

  return {
    player1: {
      lp: 8000,
      deck: p1Deck,
      hand: p1Hand,
      monsterZone: [null, null, null, null, null],
      spellZone: [null, null, null, null, null],
      graveyard: [],
      hasNormalSummoned: false,
    },
    player2: {
      lp: 8000,
      deck: p2Deck,
      hand: p2Hand,
      monsterZone: [null, null, null, null, null],
      spellZone: [null, null, null, null, null],
      graveyard: [],
      hasNormalSummoned: false,
    },
    turn: 'player1',
    phase: 'DRAW',
    turnCount: 1,
    log: ['Duelo começou! Turno do Jogador 1.', 'Jogador 1 entrou na fase DRAW.'],
    winner: null,
  };
}

export function gameReducer(state: GameState, action: Action): GameState {
  if (state.winner) return state;
  let newState = cloneState(state);

  switch (action.type) {
    case 'NEXT_PHASE': {
      const phases: Phase[] = ['DRAW', 'MAIN_1', 'BATTLE', 'MAIN_2', 'END'];
      const currentIdx = phases.indexOf(newState.phase);
      
      if (newState.phase === 'END') {
        newState.turn = newState.turn === 'player1' ? 'player2' : 'player1';
        newState.turnCount++;
        newState.phase = 'DRAW';
        newState[newState.turn].hasNormalSummoned = false;
        
        newState[newState.turn].monsterZone.forEach(m => {
          if (m) {
            m.canAttack = true;
            m.hasAttacked = false;
          }
        });
        
        const playerName = newState.turn === 'player1' ? 'Jogador 1' : 'Jogador 2';
        newState.log.unshift(`--- Turno ${newState.turnCount}: ${playerName} ---`);
        newState.log.unshift(`${playerName} entrou na fase DRAW.`);
        
      } else {
        let nextPhase = phases[currentIdx + 1];
        if (newState.turnCount === 1 && nextPhase === 'BATTLE') {
          nextPhase = 'END'; // Skip battle and main 2 on first turn
        }
        newState.phase = nextPhase;
        const playerName = newState.turn === 'player1' ? 'Jogador 1' : 'Jogador 2';
        newState.log.unshift(`${playerName} entrou na fase ${newState.phase}.`);
      }
      break;
    }
    
    case 'DRAW_CARD': {
      if (newState.phase !== 'DRAW') break;
      
      const currentPlayer = newState[newState.turn];
      const playerName = newState.turn === 'player1' ? 'Jogador 1' : 'Jogador 2';
      
      if (currentPlayer.deck.length > 0) {
        const card = currentPlayer.deck.pop()!;
        currentPlayer.hand.push(card);
        newState.log.unshift(`${playerName} comprou uma carta.`);
      } else {
        newState.log.unshift(`${playerName} não tem mais cartas no deck para comprar!`);
      }
      
      newState.phase = 'MAIN_1';
      newState.log.unshift(`${playerName} entrou na fase MAIN_1.`);
      break;
    }
    
    case 'SUMMON_MONSTER': {
      const player = newState[newState.turn];
      if (newState.phase !== 'MAIN_1' && newState.phase !== 'MAIN_2') break;
      if (player.hasNormalSummoned) break;
      if (player.monsterZone[action.zoneIndex] !== null) break;
      
      const handIndex = player.hand.findIndex(c => c.id === action.cardId);
      if (handIndex === -1) break;
      
      const card = player.hand[handIndex];
      if (card.type !== 'MONSTER') break;
      
      player.hand.splice(handIndex, 1);
      card.position = action.position;
      card.canAttack = true;
      card.hasAttacked = false;
      player.monsterZone[action.zoneIndex] = card;
      player.hasNormalSummoned = true;
      
      const playerName = newState.turn === 'player1' ? 'Jogador 1' : 'Jogador 2';
      const posName = action.position === 'ATTACK' ? 'Ataque' : 'Defesa';
      newState.log.unshift(`${playerName} invocou ${card.name} em modo de ${posName}.`);
      break;
    }
    
    case 'CHANGE_POSITION': {
      const player = newState[newState.turn];
      if (newState.phase !== 'MAIN_1' && newState.phase !== 'MAIN_2') break;
      const monster = player.monsterZone[action.zoneIndex];
      if (monster) {
        monster.position = action.position;
        const playerName = newState.turn === 'player1' ? 'Jogador 1' : 'Jogador 2';
        const posName = action.position === 'ATTACK' ? 'Ataque' : 'Defesa';
        newState.log.unshift(`${playerName} mudou ${monster.name} para modo de ${posName}.`);
      }
      break;
    }
    
    case 'ACTIVATE_SPELL': {
      const player = newState[newState.turn];
      const opponent = newState.turn === 'player1' ? 'player2' : 'player1';
      
      if (newState.phase !== 'MAIN_1' && newState.phase !== 'MAIN_2') break;
      
      const handIndex = player.hand.findIndex(c => c.id === action.cardId);
      if (handIndex === -1) break;
      
      const card = player.hand[handIndex];
      if (card.type !== 'SPELL') break;
      
      const playerName = newState.turn === 'player1' ? 'Jogador 1' : 'Jogador 2';
      newState.log.unshift(`${playerName} ativou ${card.name}!`);
      
      if (card.name === 'Buraco Negro') {
        ['player1', 'player2'].forEach(p => {
          newState[p as 'player1' | 'player2'].monsterZone.forEach((m, i) => {
            if (m) {
              newState[p as 'player1' | 'player2'].graveyard.push(m);
              newState[p as 'player1' | 'player2'].monsterZone[i] = null;
            }
          });
        });
      } else if (card.name === 'Faíscas') {
        newState[opponent].lp -= 200;
      } else if (card.name === 'Dian Keto') {
        newState[newState.turn].lp += 1000;
      }
      
      player.hand.splice(handIndex, 1);
      player.graveyard.push(card);
      
      break;
    }
    
    case 'ATTACK': {
      if (newState.phase !== 'BATTLE') break;
      
      const attackerPlayer = newState.turn;
      const defenderPlayer = attackerPlayer === 'player1' ? 'player2' : 'player1';
      const attackerName = attackerPlayer === 'player1' ? 'Jogador 1' : 'Jogador 2';
      const defenderName = defenderPlayer === 'player1' ? 'Jogador 1' : 'Jogador 2';
      
      const attacker = newState[attackerPlayer].monsterZone[action.attackerIndex];
      if (!attacker || !attacker.canAttack || attacker.hasAttacked || attacker.position !== 'ATTACK') break;
      
      if (action.targetIndex === null) {
        const defenderMonsters = newState[defenderPlayer].monsterZone.filter(m => m !== null);
        if (defenderMonsters.length > 0) break;
        
        newState[defenderPlayer].lp -= (attacker.atk || 0);
        attacker.hasAttacked = true;
        newState.log.unshift(`${attacker.name} ataca diretamente causando ${attacker.atk} de dano!`);
      } else {
        const defender = newState[defenderPlayer].monsterZone[action.targetIndex];
        if (!defender) break;
        
        attacker.hasAttacked = true;
        
        if (defender.position === 'ATTACK') {
          const atkDiff = (attacker.atk || 0) - (defender.atk || 0);
          if (atkDiff > 0) {
            newState[defenderPlayer].lp -= atkDiff;
            newState[defenderPlayer].graveyard.push(defender);
            newState[defenderPlayer].monsterZone[action.targetIndex] = null;
            newState.log.unshift(`${attacker.name} destruiu ${defender.name}. ${defenderName} recebe ${atkDiff} de dano.`);
          } else if (atkDiff < 0) {
            newState[attackerPlayer].lp -= Math.abs(atkDiff);
            newState[attackerPlayer].graveyard.push(attacker);
            newState[attackerPlayer].monsterZone[action.attackerIndex] = null;
            newState.log.unshift(`${attacker.name} foi destruído por ${defender.name}. ${attackerName} recebe ${Math.abs(atkDiff)} de dano.`);
          } else {
            newState[attackerPlayer].graveyard.push(attacker);
            newState[attackerPlayer].monsterZone[action.attackerIndex] = null;
            newState[defenderPlayer].graveyard.push(defender);
            newState[defenderPlayer].monsterZone[action.targetIndex] = null;
            newState.log.unshift(`${attacker.name} e ${defender.name} destruíram um ao outro.`);
          }
        } else {
          const atkDiff = (attacker.atk || 0) - (defender.def || 0);
          if (atkDiff > 0) {
            newState[defenderPlayer].graveyard.push(defender);
            newState[defenderPlayer].monsterZone[action.targetIndex] = null;
            newState.log.unshift(`${attacker.name} destruiu ${defender.name}.`);
          } else if (atkDiff < 0) {
            newState[attackerPlayer].lp -= Math.abs(atkDiff);
            newState.log.unshift(`${attacker.name} falhou em destruir ${defender.name}. ${attackerName} recebe ${Math.abs(atkDiff)} de dano.`);
          } else {
            newState.log.unshift(`${attacker.name} atacou ${defender.name} mas nenhum foi destruído.`);
          }
        }
      }
      break;
    }
  }

  // Prevent LP from going below 0
  if (newState.player1.lp < 0) newState.player1.lp = 0;
  if (newState.player2.lp < 0) newState.player2.lp = 0;

  if (newState.player1.lp <= 0) newState.winner = 'player2';
  if (newState.player2.lp <= 0) newState.winner = 'player1';

  return newState;
}
