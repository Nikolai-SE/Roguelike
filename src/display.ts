import { CELL_SIZE } from "./common_constants";
import { Vector, add, mul, div } from "./vector";
import { Rectangle } from "./rectangle";
import { GamePage } from "./pages";

export class Camera {
        constructor(
                public center: Vector,
                readonly game: GamePage,
        ) { }

        private world = this.game.world;
        private player = this.world.player;
        private units = this.world.units;

        /**
         * Updates the camera position to the center depending on the time difference from the previous update, previous camera center and player position.
         * @param absTime - absolute time from the start of this game
         * @param dt - time difference from the previous update
         */
        update(absTime: number, dt: number) {
                const k = Math.exp(-2e-3 * dt);
                this.center = add(
                        mul(k, this.center),
                        mul(1 - k, this.player.pos)
                );
        }

        calcWorldBounds(screenBounds: Vector): Rectangle {
                const bScaled = div(screenBounds, CELL_SIZE);
                return {
                        xMin: Math.floor(this.center.x + 0.5 * (1 - bScaled.x)),
                        xMax: Math.floor(this.center.x + 0.5 * (1 + bScaled.x)),
                        yMin: Math.floor(this.center.y + 0.5 * (1 - bScaled.y)),
                        yMax: Math.floor(this.center.y + 0.5 * (1 + bScaled.y)),
                };
        }

        /**
         * Renders each cell and each unit of the game World and sets the origin of the canvas to the World center
         * @param ctx - canvas
         * @param bounds - world bounds vector
         */
        render(ctx: CanvasRenderingContext2D, bounds: Vector) {
                ctx.save();
                ctx.translate(bounds.x / 2, bounds.y / 2);
                ctx.scale(CELL_SIZE, CELL_SIZE);
                ctx.translate(-0.5 - this.center.x, -0.5 - this.center.y);
                ctx.lineWidth = 2 / CELL_SIZE;

                const { xMin, xMax, yMin, yMax } = this.calcWorldBounds(bounds);
                for (let x = xMin; x <= xMax; ++x) {
                        for (let y = yMin; y <= yMax; ++y) {
                                const ct = this.world.getCellAt({ x, y });
                                ct.render(ctx, { x, y });
                                const equip = this.world.getEquipmentAt({ x, y });
                                if (equip != null)
                                        equip.render(ctx, { x, y });
                        }
                }

                for (const u of this.units) {
                        u.render(ctx);
                }
                ctx.restore();
        }
}

export class HUD {
        constructor(
                readonly game: GamePage,
        ) { }

        private world = this.game.world;
        private player = this.world.player;

        onUpdate(absTime: number, dt: number) {
        }

        /**
         * Renders HUD data: player's HP, max HP, damage. Renders prompts to exit
         * @param ctx 
         * @param bounds 
         */
        render(ctx: CanvasRenderingContext2D, bounds: Vector) {
                ctx.fillStyle = '#ff0000';
                ctx.strokeStyle = '#ff0000';
                ctx.beginPath();
                ctx.arc(0.5 * bounds.x, 0.5 * bounds.y, 5, 0, 2 * Math.PI);
                ctx.fill();
                ctx.closePath();

                let text;
                if (this.game.confirmExit) {
                        text = 'Press ESC once more to exit';
                } else {
                        text = 'Press ESC twice to exit';
                }
                ctx.font = '36px sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(text, 36, 72);

                ctx.fillStyle = '#ff3f3f';
                text = `Player HP: ${this.player.hp} / ${this.player.maxHp}`;
                ctx.fillText(text, 36, bounds.y - 72);
                text = `Player damage: ${this.player.damage}`;
                ctx.fillText(text, 36, bounds.y - 36);
        }
}
