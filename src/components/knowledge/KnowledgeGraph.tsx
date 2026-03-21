"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";

interface GraphNode {
  id: string;
  name: string;
  subject: string;
  mastery: number;
  errorCount: number;
  size: number;
  // Runtime position
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: "parent" | "related";
}

interface KnowledgeGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (nodeId: string) => void;
  className?: string;
}

const MASTERY_COLORS = {
  high: { fill: "#10b981", stroke: "#059669" },     // correct/green
  medium: { fill: "#f59e0b", stroke: "#d97706" },   // partial/amber
  low: { fill: "#ef4444", stroke: "#dc2626" },      // wrong/red
  none: { fill: "#94a3b8", stroke: "#64748b" },      // gray
};

function getMasteryColor(mastery: number) {
  if (mastery >= 70) return MASTERY_COLORS.high;
  if (mastery >= 40) return MASTERY_COLORS.medium;
  if (mastery > 0) return MASTERY_COLORS.low;
  return MASTERY_COLORS.none;
}

export default function KnowledgeGraph({ nodes: initialNodes, edges, onNodeClick, className }: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const nodesRef = useRef<GraphNode[]>([]);
  const draggingRef = useRef<string | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });

  // Initialize node positions
  useEffect(() => {
    const w = dimensions.width;
    const h = dimensions.height;
    nodesRef.current = initialNodes.map((n, i) => ({
      ...n,
      x: w / 2 + (Math.cos((i / initialNodes.length) * Math.PI * 2) * w * 0.3),
      y: h / 2 + (Math.sin((i / initialNodes.length) * Math.PI * 2) * h * 0.3),
      vx: 0,
      vy: 0,
    }));
  }, [initialNodes, dimensions]);

  // Resize handler
  useEffect(() => {
    const container = canvasRef.current?.parentElement;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height: Math.max(height, 350) });
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Force simulation + rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    let running = true;

    function simulate() {
      const nodes = nodesRef.current;
      const w = dimensions.width;
      const h = dimensions.height;

      // Apply forces
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (!node.x || !node.y) continue;

        // Center gravity
        node.vx! += (w / 2 - node.x) * 0.001;
        node.vy! += (h / 2 - node.y) * 0.001;

        // Repulsion between all nodes
        for (let j = i + 1; j < nodes.length; j++) {
          const other = nodes[j];
          if (!other.x || !other.y) continue;
          const dx = node.x - other.x;
          const dy = node.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = 800 / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          node.vx! += fx;
          node.vy! += fy;
          other.vx! -= fx;
          other.vy! -= fy;
        }
      }

      // Edge attraction
      for (const edge of edges) {
        const source = nodes.find((n) => n.id === edge.source);
        const target = nodes.find((n) => n.id === edge.target);
        if (!source?.x || !target?.x || !source?.y || !target?.y) continue;
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 120) * 0.005;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        source.vx! += fx;
        source.vy! += fy;
        target.vx! -= fx;
        target.vy! -= fy;
      }

      // Update positions
      for (const node of nodes) {
        if (draggingRef.current === node.id) continue;
        node.vx! *= 0.85; // damping
        node.vy! *= 0.85;
        node.x! += node.vx!;
        node.y! += node.vy!;
        // Boundary
        node.x = Math.max(30, Math.min(w - 30, node.x!));
        node.y = Math.max(30, Math.min(h - 30, node.y!));
      }
    }

    function draw() {
      if (!ctx || !running) return;
      const nodes = nodesRef.current;

      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw edges
      for (const edge of edges) {
        const source = nodes.find((n) => n.id === edge.source);
        const target = nodes.find((n) => n.id === edge.target);
        if (!source?.x || !target?.x) continue;

        ctx.beginPath();
        ctx.moveTo(source.x, source.y!);
        ctx.lineTo(target.x, target.y!);
        ctx.strokeStyle = edge.type === "parent" ? "rgba(76,110,245,0.25)" : "rgba(148,163,184,0.2)";
        ctx.lineWidth = edge.type === "parent" ? 2 : 1;
        if (edge.type === "related") ctx.setLineDash([4, 4]);
        else ctx.setLineDash([]);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Draw nodes
      for (const node of nodes) {
        if (!node.x || !node.y) continue;
        const color = getMasteryColor(node.mastery);
        const r = node.size / 2;
        const isHovered = hoveredRef.current === node.id;

        // Glow on hover
        if (isHovered) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r + 6, 0, Math.PI * 2);
          ctx.fillStyle = color.fill + "30";
          ctx.fill();
        }

        // Circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = color.fill + (isHovered ? "ff" : "cc");
        ctx.fill();
        ctx.strokeStyle = color.stroke;
        ctx.lineWidth = isHovered ? 3 : 2;
        ctx.stroke();

        // Mastery % inside
        ctx.fillStyle = "#fff";
        ctx.font = `bold ${Math.max(9, r * 0.6)}px system-ui`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`${node.mastery}%`, node.x, node.y);

        // Label below
        ctx.fillStyle = isHovered ? "#1a1d2e" : "#6b7194";
        ctx.font = `${isHovered ? "600" : "500"} 11px system-ui`;
        ctx.fillText(node.name, node.x, node.y + r + 14);
      }

      simulate();
      animFrameRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      running = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [dimensions, edges]);

  // Mouse interaction
  const getNodeAt = useCallback((x: number, y: number): GraphNode | null => {
    for (const node of nodesRef.current) {
      if (!node.x || !node.y) continue;
      const dx = x - node.x;
      const dy = y - node.y;
      if (dx * dx + dy * dy < (node.size / 2 + 5) ** 2) return node;
    }
    return null;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const node = getNodeAt(x, y);
    hoveredRef.current = node?.id || null;
    canvasRef.current!.style.cursor = node ? "pointer" : "default";

    if (draggingRef.current) {
      const dragNode = nodesRef.current.find((n) => n.id === draggingRef.current);
      if (dragNode) {
        dragNode.x = x;
        dragNode.y = y;
        dragNode.vx = 0;
        dragNode.vy = 0;
      }
    }
  }, [getNodeAt]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const node = getNodeAt(e.clientX - rect.left, e.clientY - rect.top);
    if (node) draggingRef.current = node.id;
  }, [getNodeAt]);

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggingRef.current) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const node = getNodeAt(e.clientX - rect.left, e.clientY - rect.top);
        if (node && node.id === draggingRef.current) {
          onNodeClick?.(node.id);
        }
      }
      draggingRef.current = null;
    }
  }, [getNodeAt, onNodeClick]);

  return (
    <div className={cn("w-full h-[400px] rounded-2xl overflow-hidden bg-white border border-[var(--color-border-light)]", className)}>
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        style={{ width: "100%", height: "100%" }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { draggingRef.current = null; hoveredRef.current = null; }}
      />
    </div>
  );
}
