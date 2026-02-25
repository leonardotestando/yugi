import { CardTemplate } from '../types';

export const CARD_DATABASE: CardTemplate[] = [
  { cardId: 'm1', name: 'Mago Negro', type: 'MONSTER', atk: 2500, def: 2100, level: 7, description: 'O mago supremo em termos de ataque e defesa.' },
  { cardId: 'm2', name: 'Dragão Branco de Olhos Azuis', type: 'MONSTER', atk: 3000, def: 2500, level: 8, description: 'Este dragão lendário é um poderoso motor de destruição.' },
  { cardId: 'm3', name: 'Guardião Celta', type: 'MONSTER', atk: 1400, def: 1200, level: 4, description: 'Um elfo que aprendeu a empunhar uma espada, ele confunde os inimigos com ataques rápidos como um raio.' },
  { cardId: 'm4', name: 'Elfa Mística', type: 'MONSTER', atk: 800, def: 2000, level: 4, description: 'Uma elfa delicada que não tem muito ataque, mas tem uma defesa incrível apoiada por poder místico.' },
  { cardId: 'm5', name: 'Caveira Invocada', type: 'MONSTER', atk: 2500, def: 1200, level: 6, description: 'Um demônio com poderes das trevas para confundir o inimigo.' },
  { cardId: 'm6', name: 'Kuriboh', type: 'MONSTER', atk: 300, def: 200, level: 1, description: 'Esta carta é fraca, mas pode ser útil.' },
  { cardId: 'm7', name: 'Soldado Gigante de Pedra', type: 'MONSTER', atk: 1300, def: 2000, level: 3, description: 'Um guerreiro gigante feito de pedra.' },
  { cardId: 'm8', name: 'Elfos Gêmeos', type: 'MONSTER', atk: 1900, def: 900, level: 4, description: 'Gêmeos elfos que alternam seus ataques.' },
  { cardId: 'm9', name: 'La Jinn', type: 'MONSTER', atk: 1800, def: 1000, level: 4, description: 'Um gênio da lâmpada que está à disposição de seu mestre.' },
  { cardId: 's1', name: 'Buraco Negro', type: 'SPELL', description: 'Destrua todos os monstros no campo.' },
  { cardId: 's3', name: 'Faíscas', type: 'SPELL', description: 'Cause 200 de dano ao seu oponente.' },
  { cardId: 's4', name: 'Dian Keto', type: 'SPELL', description: 'Aumente seus PV em 1000.' },
];
