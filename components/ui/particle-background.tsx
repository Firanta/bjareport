"use client";

import React from "react";
import { motion } from "framer-motion";

const ParticleBackground = () => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const mouse = { x: null as number | null, y: null as number | null, radius: 180 };

    class Particle {
      x: number; y: number;
      directionX: number; directionY: number;
      size: number; color: string;

      constructor(x: number, y: number, dX: number, dY: number, size: number, color: string) {
        this.x = x; this.y = y;
        this.directionX = dX; this.directionY = dY;
        this.size = size; this.color = color;
      }

      draw() {
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx!.fillStyle = this.color;
        ctx!.fill();
      }

      update() {
        if (this.x > canvas!.width || this.x < 0) this.directionX = -this.directionX;
        if (this.y > canvas!.height || this.y < 0) this.directionY = -this.directionY;

        if (mouse.x !== null && mouse.y !== null) {
          const dx = mouse.x - this.x;
          const dy = mouse.y - this.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.radius + this.size) {
            const fX = dx / distance;
            const fY = dy / distance;
            const force = (mouse.radius - distance) / mouse.radius;
            this.x -= fX * force * 5;
            this.y -= fY * force * 5;
          }
        }
        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
      }
    }

    function init() {
      particles = [];
      const count = (canvas!.height * canvas!.width) / 9000;
      for (let i = 0; i < count; i++) {
        const size = Math.random() * 2 + 1;
        const x = Math.random() * (canvas!.width - size * 4) + size * 2;
        const y = Math.random() * (canvas!.height - size * 4) + size * 2;
        const dX = (Math.random() * 0.4) - 0.2;
        const dY = (Math.random() * 0.4) - 0.2;
        // Purple particles
        const alpha = Math.random() * 0.5 + 0.3;
        const color = `rgba(168, 85, 247, ${alpha})`;
        particles.push(new Particle(x, y, dX, dY, size, color));
      }
    }

    function connect() {
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const dist =
            (particles[a].x - particles[b].x) ** 2 +
            (particles[a].y - particles[b].y) ** 2;
          const threshold = (canvas!.width / 7) * (canvas!.height / 7);

          if (dist < threshold) {
            const opacity = 1 - dist / 20000;
            const dxM = particles[a].x - (mouse.x ?? 0);
            const dyM = particles[a].y - (mouse.y ?? 0);
            const distM = Math.sqrt(dxM * dxM + dyM * dyM);

            if (mouse.x && distM < mouse.radius) {
              ctx!.strokeStyle = `rgba(255, 255, 255, ${opacity * 0.8})`;
            } else {
              ctx!.strokeStyle = `rgba(167, 139, 250, ${opacity * 0.4})`;
            }
            ctx!.lineWidth = 0.8;
            ctx!.beginPath();
            ctx!.moveTo(particles[a].x, particles[a].y);
            ctx!.lineTo(particles[b].x, particles[b].y);
            ctx!.stroke();
          }
        }
      }
    }

    function animate() {
      animationFrameId = requestAnimationFrame(animate);
      ctx!.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
      particles.forEach((p) => p.update());
      connect();
    }

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      ctx!.fillStyle = "#000000";
      ctx!.fillRect(0, 0, canvas!.width, canvas!.height);
      init();
    }

    const onMouseMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    const onMouseOut = () => { mouse.x = null; mouse.y = null; };

    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseout", onMouseOut);

    resize();
    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseout", onMouseOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: "#000" }}
    />
  );
};

export default ParticleBackground;
