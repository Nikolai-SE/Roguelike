import { ok } from "assert";
import { Helmet, Sword } from "./equipment";
import { Player } from "./units";
import { WorldMock } from "./game_rules.spec";


describe('Player Inventory', () => {
        it('should be equal to itself', () => {
            let player = new Player(new WorldMock(), {x: 0, y:0}, 0, 0, 0);

            let inv = player.inventory;

            inv.addToUnused(new Sword());
            inv.addToUnused(new Helmet());
            inv.addToUnused(new Helmet());

            let l1 = inv.unused.length;
            let l2 = inv.used.length;
            ok(l1 === 3);
            ok(l2 === 0);

            player.tryToPutOnEquipment(0);

            l1 = inv.unused.length;
            l2 = inv.used.length;
            ok(l1 === 2);
            ok(l2 === 1);

            player.tryToPutOnEquipment(1);
            l1 = inv.unused.length;
            l2 = inv.used.length;
            ok(l1 === 1);
            ok(l2 === 2);

            player.tryToTakeOffEquipment(1);
            l1 = inv.unused.length;
            l2 = inv.used.length;
            ok(l1 === 2);
            ok(l2 === 1);
        });
});
