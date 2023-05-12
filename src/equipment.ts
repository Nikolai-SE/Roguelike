import { Vector } from "./vector";

export class Equipment {
        attackDecorator(points: number): number {
                return points;
        }

        getDamageDecorator(points: number): number {
                return points;
        }

        render(ctx: CanvasRenderingContext2D, bounds: Vector) {
        }
}

export class Sword extends Equipment {
        attackDecorator(points: number): number {
                return points * 2;
        }

        render(ctx: CanvasRenderingContext2D, bounds: Vector) {
                ctx.fillStyle = '#A5A192';
                ctx.strokeStyle = '#A5A192';
                ctx.lineWidth = 0.07;
                ctx.beginPath();
                ctx.moveTo(bounds.x + 0.05, bounds.y + 0.95);
                ctx.lineTo(bounds.x + 0.95, bounds.y + 0.05);
                ctx.moveTo(bounds.x + 0.35, bounds.y + 0.90);
                ctx.lineTo(bounds.x + 0.1, bounds.y + 0.65);
                ctx.closePath();
                ctx.stroke();
        }
}

export class Helmet extends Equipment {
        getDamageDecorator(points: number): number {
                return Math.max(points - 2, 1);
        }

        render(ctx: CanvasRenderingContext2D, bounds: Vector) {
                ctx.fillStyle = '#A5A192';
                ctx.strokeStyle = '#A5A192';
                ctx.beginPath();
                ctx.moveTo(bounds.x + 0.15, bounds.y + 0.4);
                ctx.lineTo(bounds.x + 0.85, bounds.y + 0.4);
                ctx.lineTo(bounds.x + 0.5, bounds.y + 0.05);
                ctx.lineTo(bounds.x + 0.15, bounds.y + 0.4);
                ctx.fill();
                ctx.closePath();
        }
}
