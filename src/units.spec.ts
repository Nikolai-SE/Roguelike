import { ok, equal } from "assert";
import { Helmet, Sword } from "./equipment";
import { Enemy, MockUnitFactory, PassiveBehaviourState, UnitType, fight } from "./units";
import { WorldMock } from "./game_rules.spec";
import { World } from "./game_rules";
import { Vector, eq } from "./vector";
import { RandomWorldBuilder } from "./world_builder";

describe('Fight System', () => {
        it('Two units should fight when trying to get on the same square', () => {
                const world = new WorldMock();
                const unit1 = world.player;
                const unit2 = new Enemy(world, { x: 4, y: 3 }, new PassiveBehaviourState(), 100, 100, 1);
                unit2.tryWalk({ x: 0, y: 1 });

                equal(unit1.hp, unit1.maxHp - unit2.damage);
                equal(unit2.hp, unit2.maxHp - unit1.damage);
        });

        it('If the attacker kills the defender, the attacker does not receive any damage', () => {
                const world = new WorldMock();
                const unit1 = world.player;
                const unit2 = new Enemy(world, { x: 3, y: 4 }, new PassiveBehaviourState(), 100, 100, 100);

                fight(unit2, unit1);

                equal(unit2.hp, unit2.maxHp);
                equal(unit1.checkDeath(), true);
        })
})

describe('Player Inventory', () => {
        it('should be equal to itself', () => {
                const player = new WorldMock().player;
                const inv = player.inventory;

                inv.addToUnused(new Sword());
                inv.addToUnused(new Helmet());
                inv.addToUnused(new Helmet());

                equal(inv.unused.length, 3);
                equal(inv.used.length, 0);

                player.tryToPutOnEquipment(0);

                equal(inv.unused.length, 2);
                equal(inv.used.length, 1);

                player.tryToPutOnEquipment(1);
                equal(inv.unused.length, 1);
                equal(inv.used.length, 2);

                player.tryToTakeOffEquipment(1);
                equal(inv.unused.length, 2);
                equal(inv.used.length, 1);
        });

        it('should apply damage effects', () => {
                const world = new WorldMock();
                const player = world.player;
                const enemy = new Enemy(world, { x: 3, y: 4 }, new PassiveBehaviourState(), 100, 100, 1);
                const strongEnemy = new Enemy(world, { x: 3, y: 4 }, new PassiveBehaviourState(), 100, 100, 10);

                const inv = player.inventory;
                inv.addToUnused(new Sword());
                inv.addToUnused(new Helmet());

                equal(player.damage, 3);
                equal(player.hp, 100);

                equal(enemy.hp, 100);
                player.attack(enemy);
                equal(enemy.hp, 97);

                inv.fromUnusedToUse(0);
                equal(player.damage, 6);

                player.attack(enemy);
                equal(enemy.hp, 91);

                enemy.attack(player);
                equal(player.hp, 99);
                strongEnemy.attack(player);
                equal(player.hp, 89);

                inv.fromUnusedToUse(0);
                enemy.attack(player);
                equal(player.hp, 88);
                strongEnemy.attack(player);
                equal(player.hp, 80);
        });
});

describe('Create enemy', () => {
        it('must generate as many enemies as requested', () => {
                const builder: RandomWorldBuilder = new RandomWorldBuilder();
                const world: World = builder.build();
                const width: number = world.boundaries.x;
                const height: number = world.boundaries.y;
                const count: number = world.enemies.length;
                let calcCount: number = 0;
                let enemiesPos: boolean[][] = [];
                for (let i = 0; i < height; i++) {
                        enemiesPos[i] = [];
                        for (let j = 0; j < width; j++) {
                                enemiesPos[i][j] = false;
                        }
                }
                for (let enemy of world.enemies) {
                        const pos: Vector = enemy.pos
                        if (!enemiesPos[pos.x][pos.y]) {
                                enemiesPos[pos.x][pos.y] = true;
                                calcCount++;
                        }
                }
                equal(count, calcCount)
        })
});

describe('Slime', () => {
        it('should spread when given a chance', () => {
                const world = new WorldMock();
                ok(eq(world.player.pos, { x: 4, y: 4 }));
                const factory = new MockUnitFactory(world);
                world.units.set(UnitType.Enemy, []);
                const weakSlime = factory.createWeakSlime({ x: 2, y: 4 });
                const strongSlime = factory.createStrongSlime({ x: 6, y: 4 });
                world.enemies.push(weakSlime);
                world.enemies.push(strongSlime);

                const initLen = world.enemies.length;
                weakSlime.move();
                equal(initLen, world.enemies.length);
                equal(weakSlime, world.getUnitAt({ x: 3, y: 4 }));

                strongSlime.move();
                equal(initLen + 1, world.enemies.length);
                // should be exactly the same unit
                equal(strongSlime, world.getUnitAt({ x: 5, y: 4 }));

                const copied = world.getUnitAt({ x: 6, y: 4 });
                // ok(copied);
        });
});
