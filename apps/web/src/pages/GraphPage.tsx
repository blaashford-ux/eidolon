import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  useEdgesState,
  useNodesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { ErrorBlock, LoadingBlock } from '../components/StateBlocks';
import { apiGet } from '../lib/api';

type GraphNodeRole = 'topic' | 'chunk' | 'authority' | 'related-topic';

type GraphRelationshipType = 'RELATED' | 'DERIVED_FROM' | 'REFERENCES' | 'SUPPORTS' | 'CONTRADICTS';

interface GraphNodeData {
  role: GraphNodeRole;
  title: string;
  summary: string;
  subtitle?: string;
  expandable: boolean;
  parentId?: string;
  chunkCount?: number;
  authorityLevel?: string;
  claimed?: boolean;
  sourceType?: string;
  attributedAuthority?: string;
}

interface GraphApiNode {
  id: string;
  role: GraphNodeRole;
  title: string;
  summary: string;
  subtitle?: string;
  expandable: boolean;
  parentId?: string;
  chunkCount?: number;
  authorityLevel?: string;
  claimed?: boolean;
  sourceType?: string;
  attributedAuthority?: string;
}

interface GraphApiEdge {
  id: string;
  source: string;
  target: string;
  relationshipType: GraphRelationshipType;
}

interface GraphTopicsResponse {
  nodes: GraphApiNode[];
  edges: GraphApiEdge[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
}

interface GraphExpansionResponse {
  nodes: GraphApiNode[];
  edges: GraphApiEdge[];
  centerId: string;
}

const nodeStyles: Record<GraphNodeRole, { label: string; accent: string; surface: string }> = {
  topic: {
    label: 'Topic',
    accent: 'border-cyan-300/60 text-cyan-100',
    surface: 'bg-cyan-400/10'
  },
  'related-topic': {
    label: 'Related topic',
    accent: 'border-sky-300/60 text-sky-100',
    surface: 'bg-sky-400/10'
  },
  chunk: {
    label: 'Knowledge chunk',
    accent: 'border-amber-300/60 text-amber-100',
    surface: 'bg-amber-400/10'
  },
  authority: {
    label: 'Authority profile',
    accent: 'border-emerald-300/60 text-emerald-100',
    surface: 'bg-emerald-400/10'
  }
};

function GraphCardNode({ data, selected }: NodeProps<GraphNodeData>) {
  const style = nodeStyles[data.role] ?? nodeStyles.topic;

  return (
    <div
      className={`min-w-[220px] rounded-2xl border bg-slate-950/95 px-4 py-3 shadow-xl transition ${style.accent} ${
        selected ? 'ring-2 ring-white/70' : ''
      }`}
    >
      <Handle className="!h-2 !w-2 !border-none !bg-white/70" position={Position.Left} type="target" />
      <div className={`inline-flex rounded-full px-2 py-1 text-[11px] uppercase tracking-[0.2em] ${style.surface} ${style.accent}`}>
        {style.label}
      </div>
      <h3 className="mt-2 text-sm font-semibold text-white">{data.title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-300">{data.summary}</p>
      {data.subtitle ? <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-muted">{data.subtitle}</p> : null}
      <div className="mt-3 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-muted">
        <span>{data.expandable ? 'Click to expand' : 'Terminal node'}</span>
        {data.role === 'authority' ? <span>{data.claimed ? 'Claimed' : 'Unclaimed'}</span> : null}
      </div>
      <Handle className="!h-2 !w-2 !border-none !bg-white/70" position={Position.Right} type="source" />
    </div>
  );
}

function connectionColor(type: GraphRelationshipType) {
  switch (type) {
    case 'DERIVED_FROM':
      return '#fbbf24';
    case 'SUPPORTS':
      return '#34d399';
    case 'CONTRADICTS':
      return '#fb7185';
    case 'REFERENCES':
      return '#38bdf8';
    case 'RELATED':
    default:
      return '#94a3b8';
  }
}

function positionForNode(node: GraphApiNode, currentNodes: Node<GraphNodeData>[]) {
  const parent = node.parentId ? currentNodes.find((item) => item.id === node.parentId) : null;

  if (!parent) {
    const topLevelIndex = currentNodes.filter((item) => item.data.role === 'topic' && !item.data.parentId).length;
    return { x: 40, y: 40 + topLevelIndex * 170 };
  }

  const siblingIndex = currentNodes.filter((item) => item.data.parentId === node.parentId && item.data.role === node.role).length;
  const baseX = parent.position.x;
  const baseY = parent.position.y;

  if (node.role === 'chunk') {
    return {
      x: baseX + 320,
      y: baseY + siblingIndex * 120
    };
  }

  if (node.role === 'authority') {
    return {
      x: baseX + 320,
      y: baseY + siblingIndex * 110
    };
  }

  return {
    x: baseX + 620,
    y: baseY + siblingIndex * 110
  };
}

function edgeStyle(edge: GraphApiEdge) {
  return {
    stroke: connectionColor(edge.relationshipType),
    strokeWidth: 2
  };
}

function GraphCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState<GraphNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<GraphRelationshipType>([]);
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingMoreTopics, setLoadingMoreTopics] = useState(false);
  const [loadingNodeId, setLoadingNodeId] = useState('');
  const [error, setError] = useState('');
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [topicPage, setTopicPage] = useState(1);
  const [topicPageSize] = useState(6);
  const [topicTotal, setTopicTotal] = useState(0);

  const nodesRef = useRef<Node<GraphNodeData>[]>([]);
  const edgesRef = useRef<Edge<GraphRelationshipType>[]>([]);
  const expandedNodesRef = useRef(new Set<string>());

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);

  const nodeTypes = useMemo(
    () => ({
      graphNode: GraphCardNode
    }),
    []
  );

  function integrateNodes(payload: GraphApiNode[], payloadEdges: GraphApiEdge[]) {
    const currentNodes = nodesRef.current;
    const nextNodes = [...currentNodes];
    const nextEdges = [...edgesRef.current];
    const existingNodeIds = new Set(currentNodes.map((item) => item.id));
    const existingEdgeIds = new Set(nextEdges.map((item) => item.id));

    payload.forEach((item) => {
      if (existingNodeIds.has(item.id)) {
        return;
      }

      const position = positionForNode(item, nextNodes);
      nextNodes.push({
        id: item.id,
        type: 'graphNode',
        position,
        data: {
          role: item.role,
          title: item.title,
          summary: item.summary,
          subtitle: item.subtitle,
          expandable: item.expandable,
          parentId: item.parentId,
          chunkCount: item.chunkCount,
          authorityLevel: item.authorityLevel,
          claimed: item.claimed,
          sourceType: item.sourceType,
          attributedAuthority: item.attributedAuthority
        }
      });
      existingNodeIds.add(item.id);
    });

    payloadEdges.forEach((item) => {
      if (existingEdgeIds.has(item.id)) {
        return;
      }

      nextEdges.push({
        id: item.id,
        source: item.source,
        target: item.target,
        label: item.relationshipType,
        style: edgeStyle(item),
        animated: item.relationshipType === 'RELATED'
      });
      existingEdgeIds.add(item.id);
    });

    setNodes(nextNodes);
    setEdges(nextEdges);
  }

  async function loadTopicPage(page: number, append = false) {
    try {
      if (append) {
        setLoadingMoreTopics(true);
      } else {
        setLoadingTopics(true);
      }

      setError('');
      const response = await apiGet<GraphTopicsResponse>(`/api/graph/topics?page=${page}&pageSize=${topicPageSize}`);
      setTopicTotal(response.pagination.total);
      setTopicPage(page);
      integrateNodes(response.nodes, response.edges);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load graph topics.');
    } finally {
      setLoadingTopics(false);
      setLoadingMoreTopics(false);
    }
  }

  useEffect(() => {
    void loadTopicPage(1, false);
  }, []);

  async function expandNode(nodeId: string) {
    if (expandedNodesRef.current.has(nodeId) || loadingNodeId === nodeId) {
      return;
    }

    const node = nodesRef.current.find((item) => item.id === nodeId);
    if (!node || !node.data.expandable) {
      return;
    }

    try {
      setLoadingNodeId(nodeId);
      setError('');
      const query = node.data.parentId && node.data.role === 'chunk' ? `?limit=6&excludeTopicNodeId=${node.data.parentId.replace(/^topic-/, '')}` : '?limit=6';
      const response = await apiGet<GraphExpansionResponse>(`/api/graph/nodes/${encodeURIComponent(nodeId)}/expand${query}`);
      integrateNodes(response.nodes, response.edges);
      expandedNodesRef.current.add(nodeId);
      setSelectedNodeId(nodeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not expand graph node.');
    } finally {
      setLoadingNodeId('');
    }
  }

  const selectedNode = nodes.find((item) => item.id === selectedNodeId);
  const topLevelTopics = nodes.filter((item) => item.data.role === 'topic' && !item.data.parentId).length;
  const topicHasMore = topLevelTopics < topicTotal;

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <article className="panel xl:col-span-2">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="panel-title">Incremental graph explorer</h2>
            <p className="panel-copy">
              Start from topics, expand one hop at a time, and avoid full-graph loads. Click a topic to reveal chunks,
              then click a chunk to reveal its attributed authority and related topics.
            </p>
          </div>
          <div className="rounded-2xl border border-line/70 bg-black/20 px-4 py-3 text-xs uppercase tracking-[0.2em] text-muted">
            <p>Loaded topics: {topLevelTopics}</p>
            <p className="mt-1">Expanded nodes: {expandedNodesRef.current.size}</p>
          </div>
        </div>
      </article>

      <article className="panel min-h-[720px] overflow-hidden xl:col-span-1 xl:row-span-2">
        {loadingTopics && nodes.length === 0 ? (
          <LoadingBlock detail="Loading the topic entry points for incremental graph exploration." title="Loading graph" />
        ) : error && nodes.length === 0 ? (
          <ErrorBlock detail={error} title="Graph unavailable" />
        ) : (
          <div className="h-[680px] overflow-hidden rounded-2xl border border-line/50 bg-slate-950/70">
            <ReactFlow
              edges={edges}
              fitView
              minZoom={0.35}
              nodeTypes={nodeTypes}
              nodes={nodes}
              onEdgesChange={onEdgesChange}
              onNodeClick={(_, node) => {
                setSelectedNodeId(node.id);
                void expandNode(node.id);
              }}
              onNodesChange={onNodesChange}
              onPaneClick={() => setSelectedNodeId('')}
              panOnDrag
              selectionOnDrag={false}
              nodesDraggable
              nodesConnectable={false}
              elementsSelectable
            >
              <Background gap={28} size={1} color="rgba(148,163,184,0.15)" />
              <Controls showFitView={false} className="!bg-slate-950/90 !text-white" />
              <MiniMap
                className="!bg-slate-950/90"
                maskColor="rgba(7, 17, 31, 0.75)"
                nodeColor={(node) => {
                  switch (node.data.role) {
                    case 'chunk':
                      return '#f59e0b';
                    case 'authority':
                      return '#10b981';
                    case 'related-topic':
                      return '#38bdf8';
                    case 'topic':
                    default:
                      return '#22d3ee';
                  }
                }}
              />
            </ReactFlow>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-muted">
            <span className="status-chip">Topics</span>
            <span className="status-chip">Chunks</span>
            <span className="status-chip">Authority profiles</span>
            <span className="status-chip">Related topics</span>
          </div>
          <button
            className="btn-secondary"
            disabled={!topicHasMore || loadingMoreTopics}
            onClick={() => void loadTopicPage(topicPage + 1, true)}
            type="button"
          >
            {loadingMoreTopics ? 'Loading more...' : topicHasMore ? 'Load more topics' : 'All topics loaded'}
          </button>
        </div>

        {loadingNodeId ? <p className="mt-3 text-sm text-muted">Expanding {loadingNodeId}...</p> : null}
        {error && nodes.length > 0 ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </article>

      <aside className="panel">
        <h3 className="text-lg font-semibold text-white">Selection details</h3>
        {selectedNode ? (
          <div className="mt-4 grid gap-3 text-sm text-muted">
            <p className="text-white">{selectedNode.data.title}</p>
            <p>{selectedNode.data.summary}</p>
            <p>Role: {selectedNode.data.role}</p>
            {selectedNode.data.subtitle ? <p>{selectedNode.data.subtitle}</p> : null}
            {selectedNode.data.chunkCount !== undefined ? <p>Linked chunks: {selectedNode.data.chunkCount}</p> : null}
            {selectedNode.data.authorityLevel ? <p>Authority level: {selectedNode.data.authorityLevel}</p> : null}
            {selectedNode.data.sourceType ? <p>Source type: {selectedNode.data.sourceType}</p> : null}
            {selectedNode.data.attributedAuthority ? <p>Attributed authority: {selectedNode.data.attributedAuthority}</p> : null}
            <p>{selectedNode.data.expandable ? 'Click again to expand further.' : 'This node is a terminal graph endpoint.'}</p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted">Select a topic, chunk, or authority node to inspect its graph metadata.</p>
        )}

        <div className="mt-6 grid gap-2 text-sm text-muted">
          <Link className="btn-secondary" to="/search">
            Back to search
          </Link>
          <Link className="btn-secondary" to="/submissions">
            Open submissions
          </Link>
        </div>
      </aside>
    </div>
  );
}

export function GraphPage() {
  return <GraphCanvas />;
}
