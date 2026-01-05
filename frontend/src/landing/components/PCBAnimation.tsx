import { useEffect, useRef } from 'react';

export default function PCBAnimation() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const nodes: { x: number; y: number; vx: number; vy: number }[] = [];
        const numNodes = 50;
        for (let i = 0; i < numNodes; i++) nodes.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5 });

        const particles: { x: number; y: number; targetX: number; targetY: number; speed: number }[] = [];
        const numParticles = 30;
        for (let i = 0; i < numParticles; i++) {
            const startNode = nodes[Math.floor(Math.random() * nodes.length)];
            const endNode = nodes[Math.floor(Math.random() * nodes.length)];
            particles.push({ x: startNode.x, y: startNode.y, targetX: endNode.x, targetY: endNode.y, speed: 0.02 + Math.random() * 0.03 });
        }

        const animate = () => {
            ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            nodes.forEach((node, i) => {
                node.x += node.vx; node.y += node.vy;
                if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
                if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

                ctx.beginPath(); ctx.arc(node.x, node.y, 3, 0, Math.PI * 2); ctx.fillStyle = '#2E8B57'; ctx.fill();

                nodes.forEach((otherNode, j) => {
                    if (i === j) return;
                    const dx = otherNode.x - node.x; const dy = otherNode.y - node.y; const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < 150) {
                        const opacity = 1 - distance / 150;
                        ctx.beginPath(); ctx.moveTo(node.x, node.y); ctx.lineTo(otherNode.x, otherNode.y);
                        ctx.strokeStyle = `rgba(46, 139, 87, ${opacity * 0.3})`; ctx.lineWidth = 1; ctx.stroke();
                        if (Math.random() > 0.95) {
                            const midX = (node.x + otherNode.x) / 2; const midY = (node.y + otherNode.y) / 2;
                            ctx.beginPath(); ctx.moveTo(midX - 5, midY); ctx.lineTo(midX + 5, midY);
                            ctx.strokeStyle = `rgba(46, 139, 87, ${opacity * 0.5})`; ctx.lineWidth = 2; ctx.stroke();
                        }
                    }
                });
            });

            particles.forEach((particle) => {
                const dx = particle.targetX - particle.x; const dy = particle.targetY - particle.y; const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance < 5) {
                    const newTarget = nodes[Math.floor(Math.random() * nodes.length)];
                    particle.targetX = newTarget.x; particle.targetY = newTarget.y;
                } else {
                    particle.x += (dx / distance) * particle.speed * 10; particle.y += (dy / distance) * particle.speed * 10;
                }

                const gradient = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, 15);
                gradient.addColorStop(0, 'rgba(60, 179, 113, 0.8)'); gradient.addColorStop(0.5, 'rgba(60, 179, 113, 0.4)'); gradient.addColorStop(1, 'rgba(60, 179, 113, 0)');
                ctx.beginPath(); ctx.arc(particle.x, particle.y, 15, 0, Math.PI * 2); ctx.fillStyle = gradient; ctx.fill();
                ctx.beginPath(); ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2); ctx.fillStyle = '#3CB371'; ctx.fill();
            });

            requestAnimationFrame(animate);
        };

        animate();

        return () => { window.removeEventListener('resize', resizeCanvas); };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ background: 'linear-gradient(to bottom, #0f172a, #1e293b)' }} />;
}
