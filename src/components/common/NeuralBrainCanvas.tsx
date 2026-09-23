import React, { useEffect, useRef } from 'react';

export const NeuralBrainCanvas: React.FC<{ className?: string }> = ({ className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 550);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 550);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || 550;
      height = canvas.height = canvas.parentElement?.clientHeight || 550;
    };
    window.addEventListener('resize', handleResize);

    // Generate 3D brain structure nodes
    const nodeCount = 140;
    const nodes: {
      x: number;
      y: number;
      z: number;
      ox: number;
      oy: number;
      oz: number;
      radius: number;
      pulse: number;
      pulseSpeed: number;
    }[] = [];

    // Algorithmic brain mesh shape (two lobes + cerebellum)
    for (let i = 0; i < nodeCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 160 + (Math.random() - 0.5) * 40;

      // Brain elongation along X and Z, indentation along center Y (longitudinal fissure)
      let x = r * Math.sin(phi) * Math.cos(theta) * 1.15;
      let y = r * Math.cos(phi) * 0.9;
      let z = r * Math.sin(phi) * Math.sin(theta) * 1.05;

      // Left vs Right hemisphere split indent
      const hemisphereSign = x >= 0 ? 1 : -1;
      x = x + hemisphereSign * 18;

      nodes.push({
        x,
        y,
        z,
        ox: x,
        oy: y,
        oz: z,
        radius: Math.random() * 2.5 + 1.2,
        pulse: Math.random() * Math.PI,
        pulseSpeed: 0.02 + Math.random() * 0.03,
      });
    }

    let angleY = 0;
    let angleX = 0.2;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Radial ambient warm orange background glow
      const cx = width / 2;
      const cy = height / 2;
      const bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 260);
      bgGrad.addColorStop(0, 'rgba(255, 90, 0, 0.16)');
      bgGrad.addColorStop(0.5, 'rgba(255, 140, 0, 0.06)');
      bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      angleY += 0.007;

      // Projected nodes
      const projected: { x: number; y: number; z: number; radius: number; alpha: number; pulse: number }[] = [];

      const cosY = Math.cos(angleY);
      const sinY = Math.sin(angleY);
      const cosX = Math.cos(angleX);
      const sinX = Math.sin(angleX);

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        node.pulse += node.pulseSpeed;

        // 3D rotation around Y and X
        const x1 = node.ox * cosY - node.oz * sinY;
        const z1 = node.oz * cosY + node.ox * sinY;

        const y2 = node.oy * cosX - z1 * sinX;
        const z2 = z1 * cosX + node.oy * sinX;

        // Perspective projection
        const fov = 420;
        const scale = fov / (fov + z2 + 250);
        const px = cx + x1 * scale;
        const py = cy + y2 * scale;
        const alpha = Math.max(0.15, Math.min(1.0, (z2 + 200) / 400));

        projected.push({
          x: px,
          y: py,
          z: z2,
          radius: node.radius * scale,
          alpha,
          pulse: Math.sin(node.pulse),
        });
      }

      // Draw neural synaptic connections
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 65) {
            const lineAlpha = (1 - dist / 65) * 0.45 * Math.min(p1.alpha, p2.alpha);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, ${100 + Math.floor(Math.random() * 40)}, 0, ${lineAlpha})`;
            ctx.lineWidth = 0.85;
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      // Draw glowing neural nodes
      for (let i = 0; i < projected.length; i++) {
        const p = projected[i];
        const glowRad = Math.max(1, p.radius * (1.2 + p.pulse * 0.4));

        // Outer glow
        const nodeGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRad * 3.5);
        nodeGrad.addColorStop(0, `rgba(255, 200, 100, ${p.alpha * 0.95})`);
        nodeGrad.addColorStop(0.3, `rgba(255, 90, 0, ${p.alpha * 0.75})`);
        nodeGrad.addColorStop(1, 'rgba(255, 90, 0, 0)');

        ctx.fillStyle = nodeGrad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, glowRad * 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Core bright center
        ctx.fillStyle = `rgba(255, 255, 230, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.8, p.radius * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className={`relative flex items-center justify-center pointer-events-none select-none ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full max-w-[550px] max-h-[550px]" />
    </div>
  );
};
