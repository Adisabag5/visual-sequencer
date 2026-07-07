import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  viewChild,
} from '@angular/core';
import { AudioEngine, StepTrigger } from '../../../audio/audio-engine';
import { TransportStore } from '../../../state/transport.store';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
}

/** The 5 candy palette colors that cycle through the visualizer (v2 adds pink). */
const PALETTE = ['#9e86e8', '#3fa9e8', '#2fcb97', '#f2c84b', '#e86fa6'];
const BAR_COUNT = 44;
const INSET_X = 26;
const BAR_TOP = 34;
const BAR_BOTTOM = 20;
const BAR_GAP = 5;

/** Canvas 2D visualizer: spectrum bars (FFT), particles (step triggers), energy glow. */
@Component({
  selector: 'app-visualizer',
  imports: [],
  templateUrl: './visualizer.html',
  styleUrl: './visualizer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'relative block h-[196px] overflow-hidden border-t',
  },
})
export class Visualizer implements AfterViewInit {
  private readonly engine = inject(AudioEngine);
  private readonly transport = inject(TransportStore);
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  readonly isPlaying = this.transport.isPlaying;

  private ctx: CanvasRenderingContext2D | null = null;
  private rafId?: number;
  private particles: Particle[] = [];
  private energy = 0;

  constructor() {
    // Run the animation loop only while playing (idle otherwise).
    effect(() => {
      if (this.isPlaying()) this.start();
      else this.stop();
    });
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  ngAfterViewInit(): void {
    try {
      this.ctx = this.canvasRef().nativeElement.getContext('2d');
    } catch {
      this.ctx = null; // no 2D canvas (e.g. jsdom in tests)
    }
    this.engine.onStepTrigger((e) => this.spawn(e));
    this.resize();
    if (this.isPlaying()) this.start();
    else this.drawIdle();
  }

  // ---- loop lifecycle ----

  private start(): void {
    if (this.rafId != null || !this.ctx) return;
    const loop = (): void => {
      this.draw();
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private stop(): void {
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = undefined;
    }
    this.particles = [];
    this.energy = 0;
    this.drawIdle();
  }

  // ---- step triggers → particles ----

  private spawn(e: StepTrigger): void {
    this.energy = Math.max(this.energy, e.energy);
    if (!this.ctx) return;
    const w = this.canvasRef().nativeElement.clientWidth;
    const colors = e.colors.length ? e.colors : PALETTE;
    const count = 2 + Math.round(e.energy * 6);
    for (let k = 0; k < count; k++) {
      this.particles.push({
        x: w / 2 + (Math.random() - 0.5) * w * 0.5,
        y: 196 - BAR_BOTTOM,
        vx: (Math.random() - 0.2) * 0.6,
        vy: -(0.4 + Math.random() * 0.9),
        size: 5 + Math.random() * 6,
        color: colors[k % colors.length],
        life: 1,
      });
    }
  }

  // ---- drawing ----

  private resize(): void {
    const canvas = this.canvasRef().nativeElement;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private barGeometry(w: number): { barW: number; area: number } {
    const area = w - INSET_X * 2;
    const barW = (area - BAR_GAP * (BAR_COUNT - 1)) / BAR_COUNT;
    return { barW, area };
  }

  private draw(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const canvas = this.canvasRef().nativeElement;
    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== Math.round(canvas.clientWidth * dpr)) this.resize();
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    // Energy glow (swells yellow bottom-center on loud beats).
    const alpha = 0.05 + this.energy * 0.4;
    const glow = ctx.createRadialGradient(w / 2, h * 1.35, 0, w / 2, h * 1.35, h * 1.3);
    glow.addColorStop(0, `rgba(242, 200, 75, ${alpha})`);
    glow.addColorStop(0.7, 'rgba(242, 200, 75, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // Spectrum bars from the FFT.
    const spec = this.engine.getSpectrum();
    const { barW } = this.barGeometry(w);
    const maxH = h - BAR_TOP - BAR_BOTTOM;
    for (let i = 0; i < BAR_COUNT; i++) {
      const raw = spec.length ? spec[Math.floor((i / BAR_COUNT) * spec.length)] : -100;
      const v = Math.max(0, Math.min(1, (raw + 100) / 100));
      const barH = Math.max(2, v * maxH);
      const x = INSET_X + i * (barW + BAR_GAP);
      const y = h - BAR_BOTTOM - barH;
      const color = PALETTE[i % PALETTE.length];
      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, color);
      grad.addColorStop(1, `${color}99`);
      ctx.fillStyle = grad;
      ctx.shadowColor = `${color}66`;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, [4, 4, 2, 2]);
      ctx.fill();
    }
    ctx.shadowBlur = 0;

    // Particles.
    this.particles = this.particles.filter((p) => p.life > 0);
    for (const p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.012;
      ctx.globalAlpha = Math.max(0, p.life) * 0.7;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    this.energy *= 0.92; // decay
  }

  private drawIdle(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const canvas = this.canvasRef().nativeElement;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);
    const { barW } = this.barGeometry(w);
    for (let i = 0; i < BAR_COUNT; i++) {
      const barH = 3;
      const x = INSET_X + i * (barW + BAR_GAP);
      const y = h - BAR_BOTTOM - barH;
      ctx.fillStyle = `${PALETTE[i % PALETTE.length]}55`;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 2);
      ctx.fill();
    }
  }
}
