import { ok } from "assert";
import { WorldMock } from "./game_rules";

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
