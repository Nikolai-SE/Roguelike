import { World } from "./GameRules";
import { CELL_SIZE, Vector, div } from "./Commons";

export class Camera {
        constructor(
                public center: Vector,
                public world: World,
        ) {}

        animate(absTime: number, dt: number) {
                this.center.x = 4.5 + 4.5 * Math.cos(1e-4 * absTime);
                this.center.y = 4.5 - 4.5 * Math.sin(1e-4 * absTime);
        }

        render(ctx: CanvasRenderingContext2D, bounds: Vector) {
                ctx.save();
                ctx.translate(bounds.x / 2, bounds.y / 2);
                ctx.scale(CELL_SIZE, CELL_SIZE);
                ctx.translate(-0.5 - this.center.x, -0.5 - this.center.y);
                ctx.lineWidth = 2 / CELL_SIZE;
                const bScaled = div(bounds, CELL_SIZE);
                const xMin = Math.floor(this.center.x + 0.5 * (1 - bScaled.x));
                const xMax = Math.floor(this.center.x + 0.5 * (1 + bScaled.x));
                const yMin = Math.floor(this.center.y + 0.5 * (1 - bScaled.y));
                const yMax = Math.floor(this.center.y + 0.5 * (1 + bScaled.y));
                for (let x = xMin; x <= xMax; ++x) {
                        for (let y = yMin; y <= yMax; ++y) {
                                const ct = this.world.getCellAt({x, y});
                                ct.render(ctx, {x, y});
                        }
                }
                ctx.restore();
        }
}

export class HUD {
        constructor(
                public world: World,
        ) {}

        animate(absTime: number, dt: number) {
        }

        render(ctx: CanvasRenderingContext2D, bounds: Vector) {
        }
}
