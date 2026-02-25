import { GameState, Action } from '../types';

export function getAIAction(state: GameState): Action | null {
  if (state.turn !== 'player2' || state.winner) return null;
  
  const ai = state.player2;
  const opponent = state.player1;
  
  if (state.phase === 'DRAW') {
    return { type: 'DRAW_CARD' };
  }
  
  if (state.phase === 'MAIN_1') {
    const spell = ai.hand.find(c => c.type === 'SPELL');
    if (spell) {
      return { type: 'ACTIVATE_SPELL', cardId: spell.id, zoneIndex: 0 };
    }
    
    if (!ai.hasNormalSummoned) {
      const monsters = ai.hand.filter(c => c.type === 'MONSTER').sort((a, b) => (b.atk || 0) - (a.atk || 0));
      if (monsters.length > 0) {
        const emptyZoneIdx = ai.monsterZone.findIndex(z => z === null);
        if (emptyZoneIdx !== -1) {
          return { type: 'SUMMON_MONSTER', cardId: monsters[0].id, zoneIndex: emptyZoneIdx, position: 'ATTACK' };
        }
      }
    }
    
    return { type: 'NEXT_PHASE' };
  }
  
  if (state.phase === 'BATTLE') {
    const attackers = ai.monsterZone
      .map((m, idx) => ({ m, idx }))
      .filter(x => x.m && x.m.position === 'ATTACK' && x.m.canAttack && !x.m.hasAttacked);
      
    for (const { m: attacker, idx: attackerIdx } of attackers) {
      const opponentMonsters = opponent.monsterZone
        .map((m, idx) => ({ m, idx }))
        .filter(x => x.m !== null);
        
      if (opponentMonsters.length === 0) {
        return { type: 'ATTACK', attackerIndex: attackerIdx, targetIndex: null };
      }
      
      opponentMonsters.sort((a, b) => {
        const aStat = a.m!.position === 'ATTACK' ? a.m!.atk! : a.m!.def!;
        const bStat = b.m!.position === 'ATTACK' ? b.m!.atk! : b.m!.def!;
        return aStat - bStat;
      });
      
      const target = opponentMonsters[0];
      const targetStat = target.m!.position === 'ATTACK' ? target.m!.atk! : target.m!.def!;
      
      if (attacker!.atk! >= targetStat) {
        return { type: 'ATTACK', attackerIndex: attackerIdx, targetIndex: target.idx };
      }
    }
    
    return { type: 'NEXT_PHASE' };
  }
  
  if (state.phase === 'MAIN_2') {
    return { type: 'NEXT_PHASE' };
  }
  
  if (state.phase === 'END') {
    return { type: 'NEXT_PHASE' };
  }
  
  return null;
}
