import { Vector, sub, div } from "./Commons";
import { Camera, HUD } from "./Display";
import { World } from "./GameRules";

export interface Page {
        update(absTime: number, dt: number): Page
        onKeyDown(ev: KeyboardEvent): Page
        render(ctx: CanvasRenderingContext2D, bounds: Vector): void
}

export class MainMenuPage {
        update(absTime: number, dt: number): Page {
                return this;
        }

        render(ctx: CanvasRenderingContext2D, bounds: Vector) {
                ctx.fillStyle = '#ffbf7f';
                ctx.fillRect(0, 0, bounds.x, bounds.y);
                const text = 'Press N to start a new game';
                ctx.font = '36px sans-serif';
                const textBounds = ctx.measureText(text);
                const pos = div(sub(bounds, {
                        x: textBounds.actualBoundingBoxRight - textBounds.actualBoundingBoxLeft,
                        y: 36
                }), 2);
                ctx.fillStyle = '#ffffff';
                ctx.fillText(text, pos.x, pos.y);
        }

        onKeyDown(ev: KeyboardEvent): Page {
                if (ev.key === 'n' || ev.key == 'N') {
                        return new GamePage();
                }
                return this;
        }
}

export class GamePage {
        readonly world = new World();
        readonly camera = new Camera({ x: 0, y: 0 }, this);
        readonly hud = new HUD(this);
        public _confirmExit = false;

        get confirmExit() { return this._confirmExit; }

        update(absTime: number, dt: number): Page {
                this.camera.update(absTime, dt);
                this.hud.onUpdate(absTime, dt);
                return this;
        }

        render(ctx: CanvasRenderingContext2D, bounds: Vector) {
                this.camera.render(ctx, bounds);
                this.hud.render(ctx, bounds);
        }

        onKeyDown(ev: KeyboardEvent): Page {
                if (this.confirmExit) {
                        if (ev.key === 'Escape') {
                                return new MainMenuPage();
                        } else {
                                this._confirmExit = false;
                        }
                }
                switch (ev.key) {
                        case 'Escape':
                                this._confirmExit = true;
                                break;

                        case 'w':
                        case 'W':
                                this.world.player.tryWalk({ x: 0, y: -1 });
                                break;

                        case 'a':
                        case 'A':
                                this.world.player.tryWalk({ x: -1, y: 0 });
                                break;

                        case 's':
                        case 'S':
                                this.world.player.tryWalk({ x: 0, y: 1 });
                                break;

                        case 'd':
                        case 'D':
                                this.world.player.tryWalk({ x: 1, y: 0 });
                                break;
                }
                return this;
        }
}
