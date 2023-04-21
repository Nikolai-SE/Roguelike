import { World } from "./GameRules";
import { CELL_SIZE, Vector, add, mul, div } from "./Commons";

export class Camera {
        constructor(
                public center: Vector,
                public world: World,
        ) { }

        update(absTime: number, dt: number) {
                const k = Math.exp(-2e-3 * dt);
                this.center = add(
                        mul(k, this.center),
                        mul(1 - k, this.world.player.pos)
                );
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
                                const ct = this.world.getCellAt({ x, y });
                                ct.render(ctx, { x, y });
                        }
                }

                for (const u of this.world.units) {
                        u.render(ctx);
                }
                ctx.restore();
        }
}

export class HUD {
        constructor(
                public world: World,
        ) { }

        onUpdate(absTime: number, dt: number) {
        }

        render(ctx: CanvasRenderingContext2D, bounds: Vector) {
        }
}
