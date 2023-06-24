import { Vector, sub, div } from "./vector";
import { Camera, HUD } from "./display";
import { WorldBuilder, RandomWorldBuilder } from "./world_builder";
import { LoadWorldFromFile, GenerateNewRandomWorld, Command, EscapeCommand, WalkForward, TakeEquipmentCommand, TakeOffEquipmentCommand, WalkLeft, WalkRight, WalkBackWard, PutEquipmentCommand } from "./ui_commands";

export abstract class Page {
        abstract update(absTime: number, dt: number): Page;
        abstract render(ctx: CanvasRenderingContext2D, bounds: Vector): void;

        protected abstract commandMap: Map<string, Command>;

        /**
         * Reacts to keyboard event.
         * @param ev keyboard event to react to
         * @returns Page - this MainMenu
         */
        onKeyDown(ev: KeyboardEvent): Page {
                let command = this.commandMap.get(ev.key.toLowerCase());
                if (command == undefined)
                        return this;
                return command.execute();
        }
}

export class MainMenuPage extends Page {
        update(absTime: number, dt: number): Page {
                return this;
        }

        /**
         *  if the event is key 'n' being pressed, returns a Game Page, starting a new game.
         *  Otherwise, returns MainMenu page, pending for 'n' key to be pressed.
         */
        commandMap = new Map<string, Command>([
                ["n", new GenerateNewRandomWorld(this)],
                ["f", new LoadWorldFromFile(this)],
        ]);


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
}

export class GamePage extends Page {


        constructor(private worldBuilder: WorldBuilder = new RandomWorldBuilder()) { 
                super();
        }

        readonly world = this.worldBuilder.build();
        readonly camera = new Camera({ x: 0, y: 0 }, this);
        readonly hud = new HUD(this);


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
         * 1 If Escape key is pressed once and player confirms exit from game, game will finished, returning this MainPage
         * 2. If 'w', 'a', 's' or 'd' being pressed, it is passed to the GameWorld that player is trying to make a move in a corresponding direction.
         * 3. If 't' being pressed player takes an equipment from cell where player is.
         * 4. If 'e' being pressed player puts on an equipment with index which player enters after pressing.
         * 5. If 'r' being pressed player takes off an equipment with index which player enters after pressing.
         */
        commandMap = new Map<string, Command>([
                ["escape", new EscapeCommand(this)],
                ["w", new WalkForward(this)],
                ["a", new WalkLeft(this)],
                ["s", new WalkBackWard(this)],
                ["d", new WalkRight(this)],
                ["t", new TakeEquipmentCommand(this)],
                ["e", new PutEquipmentCommand(this)],
                ["r", new TakeOffEquipmentCommand(this)],
        ]);
}
