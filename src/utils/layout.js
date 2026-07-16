import dagre from '@dagrejs/dagre';

export const NODE_WIDTH = 220;
export const NODE_HEIGHT = 120;

/**
 * Menata ulang posisi node menggunakan algoritma graph Dagre agar setiap
 * generasi (paman, bibi, sepupu, dst) tidak saling bertumpuk secara vertikal
 * maupun horizontal.
 *
 * @param {Array} nodes - node React Flow mentah (posisi awal diabaikan)
 * @param {Array} edges - edge React Flow (relasi parent -> child)
 * @param {'TB'|'LR'} direction - arah layout, default Top-to-Bottom
 */
export function getLayoutedElements(nodes, edges, direction = 'TB') {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 120,
    ranksep: 160,
  });

  nodes.forEach((node) => {
    const isPair = node.type === 'familyPairNode';
    dagreGraph.setNode(node.id, {
      width: isPair ? 448 : NODE_WIDTH,
      height: isPair ? 160 : NODE_HEIGHT,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const pos = dagreGraph.node(node.id);
    const isPair = node.type === 'familyPairNode';
    const width = isPair ? 448 : NODE_WIDTH;
    const height = isPair ? 160 : NODE_HEIGHT;
    return {
      ...node,
      targetPosition: 'top',
      sourcePosition: 'bottom',
      position: {
        x: pos.x - width / 2,
        y: pos.y - height / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
