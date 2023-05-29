import { Vector, sub, div } from "./vector";
import { Camera, HUD } from "./display";
import { WorldBuilder, RandomWorldBuilder } from "./world_builder";
import { LoadWorldFromFile, GenerateNewRandomWorld, Command, EscapeCommand, WalkForward, TakeEquipmentCommand, TakeOffEquipmentCommand, WalkLeft, WalkRight, WalkBackWard, PutEquipmentCommand } from "./ui_commands";

export interface Page {
        update(absTime: number, dt: number): Page;
        onKeyDown(ev: KeyboardEvent): Page;
        render(ctx: CanvasRenderingContext2D, bounds: Vector): void;
}

export class MainMenuPage {
        update(absTime: number, dt: number): Page {
                return this;
        }

        /**
         * Renders Main Menu page on a given canvas in a given borders - specifically, renders the prompt to start a new game.
         * @param ctx - canvas to render on
         * @param bounds - bounds of rendering
         */
        render(ctx: CanvasRenderingContext2D, bounds: Vector) {
                ctx.fillStyle = '#ffbf7f';
                ctx.fillRect(0, 0, bounds.x, bounds.y);
                const text = 'Press N to start a new game in a random world.';
                const text2 = 'Press F to start a new game on a pre-determined level.';
                ctx.font = '36px sans-serif';
                const textBounds = ctx.measureText(text);
                const pos = div(sub(bounds, {
                        x: textBounds.actualBoundingBoxRight - textBounds.actualBoundingBoxLeft,
                        y: 36,
                }), 2);
                ctx.fillStyle = '#ffffff';
                ctx.fillText(text, pos.x, pos.y);
                ctx.fillText(text2, pos.x, pos.y + 36);
        }

        /**
         * Reacts to keyboard event. Specifically, if the event is key 'n' being pressed, returns a Game Page, starting a new game. Otherwise, returns MainMenu page, pending for 'n' key to be pressed.
         * @param ev keyboard event to react to
         * @returns Page - this MainMenu
         */
        onKeyDown(ev: KeyboardEvent): Page {
                let command: Command;
                switch (ev.key.toLowerCase()) {
                        case 'n':
                                command = new GenerateNewRandomWorld(this);
                                break;
                        case 'f':
                                command = new LoadWorldFromFile(this);
                                break;
                        default:
                                return this;
                }
                return command.execute();
        }
}

export class GamePage {
        constructor(private worldBuilder: WorldBuilder = new RandomWorldBuilder()) { }

        readonly world = this.worldBuilder.build();
        readonly camera = new Camera({ x: 0, y: 0 }, this);
        readonly hud = new HUD(this);
        public _confirmExit = false;

        get confirmExit() { return this._confirmExit; }

        /**
         * Updates the camera and the HUD
         * @param absTime - absolute time from the start of the game session
         * @param dt - difference from the previous update
         * @returns this GamePage
         */
        update(absTime: number, dt: number): Page {
                if (this.world.gameOver) {
                        return new MainMenuPage();
                }
                this.camera.update(absTime, dt);
                this.world.update(absTime, dt);
                this.hud.onUpdate(absTime, dt);
                return this;
        }

        /**
         * Renders the GamePage - i.e. renders the camera and HUD
         * @param ctx - canvas to render on
         * @param bounds - bounds of canvas
         */
        render(ctx: CanvasRenderingContext2D, bounds: Vector): void {
                this.camera.render(ctx, bounds);
                this.hud.render(ctx, bounds);
        }

        /**
         * Reacts to keyboard events.
         * 1 If Escape key is pressed once, player is warned that pressing it once again will result in finishing current game session.
         * 1.1 If after that Escape is pressed once again, current game is over and MainMenu is returned
         * 1.2 If after that any other key is pressed, prompt disappears and game session is continued, returning this GamePage
         *
         * 2. If 'w', 'a', 's' or 'd' being pressed, it is passed to the GameWorld that player is trying to make a move in a corresponding direction.
         * 3. If 't' being pressed player takes an equipment from cell where player is.
         * 4. If 'e' being pressed player puts on an equipment with index which player enters after pressing.
         * 5. If 'r' being pressed player takes off an equipment with index which player enters after pressing.
         * @param ev - keyboard event to react to
         * @returns - Page (this GamePage or MainMenu page)
         */
        onKeyDown(ev: KeyboardEvent): Page {
                let command: Command;
                switch (ev.key.toLowerCase()) {
                        case 'escape':
                                command = new EscapeCommand(this);
                                break;
                        case 'w':
                                command = new WalkForward(this);
                                break;
                        case 'a':
                                command = new WalkLeft(this)
                                break;
                        case 's':
                                command = new WalkBackWard(this)
                                break;
                        case 'd':
                                command = new WalkRight(this)
                                break;

                        case 't':
                                command = new TakeEquipmentCommand(this);
                                break;
                        case 'e':
                                command = new PutEquipmentCommand(this);
                                break;
                        case 'r':
                                command = new TakeOffEquipmentCommand(this);
                                break;
                        default:
                                return this;
                }
                return command.execute();
        }
}
