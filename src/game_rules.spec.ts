import { ok } from "assert";
import { World, CellType, bedrock, wall, white, } from "./game_rules";
import { Vector, eq } from "./vector";
import { Player, Unit } from "./units";


export class WorldMock extends World {
        readonly units: Unit[];

        constructor() {
                super();
                this.player = new Player(this, { x: 4, y: 4 }, 100, 100, 3);
                this.units = [this.player];
        }

        getCellAt(pos: Vector): CellType {
                if (pos.x < 0 || pos.y < 0 || pos.x >= 15 || pos.y >= 15) {
                        return bedrock;
                } else if ((pos.x + pos.y) % 4 === 2) {
                        return wall;
                } else {
                        return white;
                }
        }
}


describe('Player', () => {
        it('should walk to walkable cells', () => {
                const world = new WorldMock();
                const player = world.player;
                ok(player.tryMoveTo({ x: 0, y: 0 }));
                ok(player.tryWalk({ x: 1, y: 0 }));
        });
        it('should only walk to adjacent cells', () => {
                const world = new WorldMock();
                const player = world.player;
                ok(player.tryMoveTo({ x: 0, y: 0 }));
                ok(!player.tryWalk({ x: 1, y: 1 }));
        });
        it('should only walk to walkable cells', () => {
                const world = new WorldMock();
                const player = world.player;
                ok(player.tryMoveTo({ x: 0, y: 0 }));
                ok(!player.tryWalk({ x: -1, y: 0 }));
        });
});
