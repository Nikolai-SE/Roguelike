import { ok } from "assert";
import { World, CellType, Unit, bedrock, wall, white, } from "./game_rules";
import { Vector, eq } from "./common_constants";


 class WorldMock extends World{
        private widthMock = 15;
        private heightMock = 15;

        constructor(
        ) {
                super(0, 0, 0);
        }

        getUnitAt(pos: Vector): Unit | null {
                // Считаем, что юнитов в принципе очень мало в сравнении с клетками
                for (const u of this.units) {
                        if (eq(pos, u.pos)) {
                                return u;
                        }
                }
                return null;
        }

        getCellAt(pos: Vector): CellType {
                if (pos.x < 0 || pos.y < 0 || pos.x >= this.widthMock || pos.y >= this.heightMock) {
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
