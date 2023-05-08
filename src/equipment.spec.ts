import { ok } from "assert";
import { Equipment, Helmet, Sword } from "./equipment";


describe('Equipment', () => {
    it('should be constant by default ', () => {
            const equipment = new Equipment();
            ok(equipment.attackDecorator(42) == 42);
            ok(equipment.getDamageDecorator(42) == 42);
    });
    it('Sword should change attack', () => {
            const sword = new Sword;
            ok(sword.attackDecorator(42) != 42);
    });
    it('Helmet should make gamage less', () => {
            const helmet = new Helmet;
            ok(helmet.getDamageDecorator(42) < 42);
    });
});
