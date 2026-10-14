import React from 'react';
import { DungeonNode, RoomType } from '../types/game';

interface MapModalProps {
  floorNumber: number;
  floorName: string;
  floorDescription: string;
  nodes: DungeonNode[];
  currentNodeId: string;
  onSelectNode: (node: DungeonNode) => void;
  onClose: () => void;
  canClose: boolean;
}

export const MapModal: React.FC<MapModalProps> = ({
  floorNumber,
  floorName,
  floorDescription,
  nodes,
  currentNodeId,
  onSelectNode,
  onClose,
  canClose,
}) => {
  // Group nodes by column (progression stage)
  const columns: DungeonNode[][] = [];
  nodes.forEach(node => {
    if (!columns[node.row]) {
      columns[node.row] = [];
    }
    columns[node.row].push(node);
  });

  const currentNode = nodes.find(n => n.id === currentNodeId);
  const availableTargetIds = currentNode ? currentNode.connections : [];

  const getRoomIcon = (type: RoomType) => {
    switch (type) {
      case 'COMBAT': return '⚔';
      case 'ELITE': return '💀';
      case 'SHOP': return '🍳';
      case 'REST': return '🛏';
      case 'CHEST': return '📦';
      case 'BOSS': return '👑';
    }
  };

  const getRoomColor = (type: RoomType) => {
    switch (type) {
      case 'COMBAT': return 'border-sky-500/50 text-sky-400 bg-sky-950/20';
      case 'ELITE': return 'border-amber-500/50 text-amber-400 bg-amber-950/20';
      case 'SHOP': return 'border-emerald-500/50 text-emerald-400 bg-emerald-950/20';
      case 'REST': return 'border-teal-500/50 text-teal-400 bg-teal-950/20';
      case 'CHEST': return 'border-purple-500/50 text-purple-400 bg-purple-950/20';
      case 'BOSS': return 'border-rose-500/60 text-rose-400 bg-rose-950/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Floor {floorNumber} Navigation</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-300">{floorName}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 font-display mt-0.5">
              Choose Your Next Route
            </h2>
          </div>
          {canClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-slate-100 bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
            >
              Back to Arena
            </button>
          )}
        </div>

        {/* Floor Context Kicker */}
        <div className="px-6 py-3 bg-slate-950/30 text-xs text-slate-400 border-b border-slate-800/50">
          {floorDescription}
        </div>

        {/* Map Tree Canvas / Grid */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6 md:p-8 flex items-center justify-between min-w-[700px] gap-8">
          {columns.map((colNodes, colIdx) => (
            <div key={colIdx} className="flex flex-col gap-6 items-center flex-1">
              <div className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                Stage {colIdx + 1}
              </div>

              <div className="flex flex-col gap-5 w-full items-center">
                {colNodes.map(node => {
                  const isCurrent = node.id === currentNodeId;
                  const isSelectable = availableTargetIds.includes(node.id) && !node.cleared;
                  const isCleared = node.cleared;

                  return (
                    <button
                      key={node.id}
                      disabled={!isSelectable}
                      onClick={() => onSelectNode(node)}
                      className={`relative w-full max-w-[170px] p-4 rounded-xl border transition-all text-left flex flex-col gap-2 ${
                        isCurrent
                          ? 'border-sky-400 ring-2 ring-sky-400/30 bg-sky-950/40'
                          : isSelectable
                          ? `${getRoomColor(node.type)} hover:scale-105 cursor-pointer shadow-lg hover:shadow-sky-500/10`
                          : isCleared
                          ? 'border-slate-800 bg-slate-950/40 opacity-50 cursor-not-allowed'
                          : 'border-slate-800/50 bg-slate-950/20 opacity-30 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xl">{getRoomIcon(node.type)}</span>
                        <span className="text-[10px] font-mono font-medium text-slate-400 uppercase">
                          {isCurrent ? 'HERE' : isCleared ? 'CLEARED' : isSelectable ? 'SELECT' : node.type}
                        </span>
                      </div>

                      <div className="font-semibold text-xs text-slate-200 truncate">
                        {node.title}
                      </div>

                      <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {node.description}
                      </div>

                      {isSelectable && (
                        <div className="mt-1 text-[11px] font-semibold text-sky-400 flex items-center gap-1">
                          Enter Room →
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="text-slate-500">Legend:</span>
            <span>⚔ Combat</span>
            <span>💀 Elite (+Rare Perk)</span>
            <span>🍳 Chimp Kitchen</span>
            <span>🛏 Rest Crib</span>
            <span>📦 Treasure</span>
            <span>👑 Boss</span>
          </div>
          <div className="text-slate-500">
            Current Node: <span className="text-slate-300 font-medium">{currentNode?.title || 'Unknown'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
