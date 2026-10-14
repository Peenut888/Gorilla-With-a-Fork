import { DungeonNode, RoomType } from '../types/game';

export interface FloorData {
  floorNumber: number;
  name: string;
  theme: string;
  description: string;
  nodes: DungeonNode[];
  startNodeId: string;
  bossNodeId: string;
}

const FLOOR_CONFIGS = [
  {
    floorNumber: 1,
    name: 'Soft-Play Nursery',
    theme: 'Cushioned Mats & Primary Colors',
    description: 'A chaotic playpen crawling with fledgling droolers and bouncy soft obstacles.',
    columns: 4,
  },
  {
    floorNumber: 2,
    name: 'The Rattle Factory',
    theme: 'Industrial Cribs & Pacifier Belts',
    description: 'High-stakes factory floor filled with bouncy rubber ducks and volatile rattle grenadiers.',
    columns: 5,
  },
  {
    floorNumber: 3,
    name: 'High-Chair Coliseum',
    theme: 'Towering Booster Seats & Milk Moats',
    description: 'An acoustic amphitheater where crybaby banshees echo sonic shrieks across slick milk slicks.',
    columns: 5,
  },
  {
    floorNumber: 4,
    name: 'The Pediatric Sanctum',
    theme: 'Imperial Diaper Throne Room',
    description: 'The final proving ground. Baby Grumpy awaits in his mechanized high-chair battle platform.',
    columns: 6,
  },
];

export function generateFloorMap(floorNumber: number): FloorData {
  const config = FLOOR_CONFIGS[Math.min(floorNumber - 1, FLOOR_CONFIGS.length - 1)];
  const nodes: DungeonNode[] = [];
  const cols = config.columns; // number of stages/steps
  
  // Column 0: Start Room (always COMBAT or REST)
  const startNode: DungeonNode = {
    id: `f${floorNumber}_0_0`,
    floor: floorNumber,
    row: 0,
    col: 0,
    type: 'COMBAT',
    title: 'Playpen Perimeter',
    description: 'A modest sparring area with wandering diaper crawlers.',
    cleared: true, // Start node is already cleared
    current: true,
    available: false,
    connections: [],
  };
  nodes.push(startNode);

  // Generate intermediate columns
  const columnNodes: DungeonNode[][] = [[startNode]];

  for (let c = 1; c < cols - 1; c++) {
    const isMidway = c === Math.floor(cols / 2);
    const numRows = (c === 1 || c === cols - 2) ? 2 : 3;
    const currentColList: DungeonNode[] = [];

    for (let r = 0; r < numRows; r++) {
      let roomType: RoomType = 'COMBAT';
      let title = 'Nursery Playroom';
      let description = 'Wandering toddlers and bouncy toy obstacles.';

      if (isMidway && r === 0) {
        roomType = 'SHOP';
        title = "Chimp Chef's Kitchen";
        description = 'A friendly culinary ape offering utensils and hot banana snacks.';
      } else if (isMidway && r === 1) {
        roomType = 'REST';
        title = 'Warm Blanket Crib';
        description: 'Take a quick power nap to restore 40 HP or train for maximum vitality.';
      } else if (c === cols - 2 && r === 0) {
        roomType = 'ELITE';
        title = 'Elite Tantrum Brigade';
        description = 'Guarded by armored crybabies. Guaranteed rare perk reward!';
      } else if (Math.random() < 0.25) {
        roomType = 'CHEST';
        title = 'Toy Chest Stash';
        description = 'An unlocked chest gleaming with Rattle Trophies and utensils.';
      } else if (Math.random() < 0.3) {
        roomType = 'REST';
        title = 'Nap Corner';
        description = 'Quiet rest zone away from aerosol clouds.';
      }

      const node: DungeonNode = {
        id: `f${floorNumber}_${c}_${r}`,
        floor: floorNumber,
        row: c,
        col: r,
        type: roomType,
        title,
        description,
        cleared: false,
        current: false,
        available: c === 1, // First stage after start is immediately available
        connections: [],
      };
      nodes.push(node);
      currentColList.push(node);
    }
    columnNodes.push(currentColList);
  }

  // Final Column: BOSS room
  const bossNode: DungeonNode = {
    id: `f${floorNumber}_boss`,
    floor: floorNumber,
    row: cols - 1,
    col: 0,
    type: 'BOSS',
    title: floorNumber === 4 ? 'The Diaper Duke of Discontent' : `Floor ${floorNumber} Champion`,
    description: floorNumber === 4
      ? 'Baby Grumpy in his armored titan high chair. Tantrum imminent.'
      : 'A colossal toddler wielding oversized aerosol sprayers!',
    cleared: false,
    current: false,
    available: false,
    connections: [],
  };
  nodes.push(bossNode);
  columnNodes.push([bossNode]);

  // Connect nodes across columns
  for (let c = 0; c < columnNodes.length - 1; c++) {
    const fromNodes = columnNodes[c];
    const toNodes = columnNodes[c + 1];

    fromNodes.forEach((from, fIdx) => {
      toNodes.forEach((to, tIdx) => {
        // Connect reasonably adjacent rows
        const rowDiff = Math.abs(fIdx - tIdx);
        if (rowDiff <= 1 || fromNodes.length === 1 || toNodes.length === 1) {
          from.connections.push(to.id);
        }
      });
      // Fallback ensure at least one connection
      if (from.connections.length === 0 && toNodes.length > 0) {
        from.connections.push(toNodes[0].id);
      }
    });
  }

  return {
    floorNumber,
    name: config.name,
    theme: config.theme,
    description: config.description,
    nodes,
    startNodeId: startNode.id,
    bossNodeId: bossNode.id,
  };
}
