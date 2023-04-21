import { World } from "./GameRules";
import { Vector } from "./Commons";

export class HUD {
        constructor(
                public world: World,
        ) {}

        animate(absTime: number, dt: number) {
        }

        render(ctx: CanvasRenderingContext2D, bounds: Vector) {
        }
}
