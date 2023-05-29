import { World, white } from "./game_rules";
import { Equipment, Helmet, Sword } from "./equipment";
import SeededRandomUtilities from "seeded-random-utilities";
import { Vector, add, eq, sub } from "./vector";

/**
 * Enumeration of unit types.
 * When adding a new implementation of Unit - it is obligatory to update this Enum with the added type.
 */
export enum UnitType {
        Enemy,
        Player
}

export enum BehaviourType {
        COWARD = "COWARD",
        PASSIVE = "PASSIVE",
        AGGRESSIVE = "AGGRESSIVE"
}

/**
 * Initiates a fight between attacker and defending Unit.
 * The unit1 has the first strike.
 * If he kills the other Unit with this strike, unit1 will not receive a counter attack.
 * @param attacker - a unit who attacked
 * @param defender - a unit who is defending
 * @returns void
 */
export function fight(attacker: Unit, defender: Unit): void {
        attacker.attack(defender);
        if (defender.checkDeath()) {
                attacker.onKill(defender);
                return;
        }
        defender.attack(attacker);
        if (attacker.checkDeath()) {
                defender.onKill(attacker);
        }
}

export abstract class Unit {
        level: number = 1;
        xp: number = 0;
        limitXp: number = 2;

        constructor(
                readonly world: World,
                private _pos: Vector,
                public hp: number,
                public maxHp: number,
                protected baseDamage: number,
        ) { }

        get pos(): Vector {
                return { ...this._pos };
        }

        /**
         * Get the damage that this unit deals to others.
         * Used in `attack` method for default implementation.
         */
        get damage(): number {
                return this.baseDamage;
        }

        /**
         * Tries to move this unit to given position.
         * If it is walkable and not occupied by another unit - moves this unit.
         * If there is another unit at this position - initiates the fight with this unit as an attacker.
         * @param pos - desired position to move to
         * @returns whether this unit actually moved
         */
        tryMoveTo(pos: Vector): boolean {
                const walkable: boolean = this.world.getCellAt(pos).isWalkable;
                if (!walkable) {
                        return false;
                }
                const unitAtCell: Unit | null = this.world.getUnitAt(pos);
                if (unitAtCell != null) {
                        fight(this, unitAtCell);
                        return false;
                }
                this._pos.x = pos.x;
                this._pos.y = pos.y;
                return true;
        }

        /**
         * Tries to walk this unit on a given delta vector.
         * Returns true if this action was successful.
         * @param delta - desired shift
         * @returns true if this action was successful
         */
        tryWalk(delta: Vector): boolean {
                if (delta.x * delta.y != 0 || Math.abs(delta.x) + Math.abs(delta.y) != 1) {
                        return false;
                }
                return this.tryMoveTo(add(this.pos, delta));
        }

        /**
         * Renders the unit
         * @param ctx - rendering context
         */
        render(ctx: CanvasRenderingContext2D): void {
                ctx.fillStyle = '#7fbfff';
        }

        /**
         * Called whenever this unit kills another unit.
         * Serves to register the fact and grant killer with according bonuses in xp that might lead to leveling the killer up.
         * @param killedUnit
         */
        onKill(killedUnit: Unit) {
                this.xp += killedUnit.level;
                if (this.xp > this.limitXp) {
                        this.xp %= this.limitXp;
                        this.level++; //TODO: вынести levelUp в отдельную функцию
                        this.maxHp++;
                        this.baseDamage++;
                        this.hp = this.maxHp;
                        this.limitXp += this.level;
                }
        }

        /**
         * Called when this unit is dead.
         */
        abstract death(): void;

        /**
         * Called when this unit is attacking another.
         * @param unit - attacked unit
         */
        attack(unit: Unit) {
                unit.takeDamage(this.damage);
        }

        /**
         * Take damage with appropriate modifiers.
         * @param dmg — damage taken
         */
        takeDamage(dmg: number) {
                this.hp -= dmg;
        }

        /**
         * Checks whether this unit is dead. If he is, calles death() method.
         * @returns whether this unit is dead.
         */
        checkDeath(): boolean {
                if (this.hp <= 0) {
                        this.death();
                        return true;
                }
                return false;
        }
}

export class Player extends Unit {
        private moveDuration: number = 8;

        constructor(
                world: World,
                pos: Vector,
                hp: number,
                maxHp: number,
                damage: number,
        ) {
                super(world, pos, hp, maxHp, damage);
        }

        /**
         * Renders the player
         * @param ctx - rendering context
         */
        public render(ctx: CanvasRenderingContext2D): void {
                ctx.fillStyle = '#7fbfff';
                ctx.beginPath();
                ctx.arc(this.pos.x + 0.5, this.pos.y + 0.5, 0.3, 0, 2 * Math.PI);
                ctx.fill();
                ctx.closePath();
        }

        /**
         * With the death of a player initiates GameOver state of player's world.
         */
        public death(): void {
                this.world.gameOver = true;
        }

        /**
         * Attacks the unit. Calculates all the modificators and the damage dealt to the defending unit
         * @param unit - unit2
         */
        attack(unit: Unit): void {
                unit.takeDamage(this.damage);

                // Apply confusion only when a player hits an enemy,
                // but not when an enemy hits an enemy
                const enemy = unit as Enemy; // TODO: class for Mobs in case if we need NPCs
                if (this.world.randomizer.getRandomBool()) {
                        enemy.behaviour = new Confusion(enemy.behaviour, this.moveDuration, this.world.turnsCnt);
                }
        }

        readonly inventory = new class Inventory {
                used: Equipment[] = [];
                unused: Equipment[] = [];

                /**
                 * Tries to equip the equipment at given index
                 * @param index - index of the equipment
                 * @returns whether equipment at given index was equipped
                 */
                fromUnusedToUse(index: number): boolean {
                        const removed = this.unused.splice(index, 1);
                        if (removed.length > 0) {
                                this.used = this.used.concat(removed);
                                return true;
                        }
                        return false;
                }

                /**
                 * Tries to unequip the equipment at given index
                 * @param index - index of the equipment
                 * @returns whether equipment at given index was unequipped
                 */
                fromUsedToUnused(index: number): boolean {
                        const removed = this.used.splice(index, 1);
                        if (removed.length > 0) {
                                this.unused = this.unused.concat(removed);
                                return true;
                        }
                        return false;
                }

                /**
                 * Moves given equipment in the inventory
                 * @param equipment
                 */
                addToUnused(equipment: Equipment): void {
                        this.unused.push(equipment);
                }
        }

        get damage(): number {
                let dmg = super.damage;
                for (const item of this.inventory.used) {
                        dmg = item.attackDecorator(dmg);
                }
                return dmg;
        }

        takeDamage(dmg: number): void {
                for (const item of this.inventory.used) {
                        dmg = item.getDamageDecorator(dmg);
                }
                super.takeDamage(dmg);
        }

        /**
         * Attempt to take equipment from currect cell of player
         * @returns true if equipment is taken
         */
        tryToTakeEquipment(): boolean {
                const equip = this.world.getAndRemoveEquipmentAt(this.pos);
                if (equip === undefined) {
                        return false;
                }
                this.inventory.addToUnused(equip);
                return true;
        }

        /**
         * Attempt to take off equipment  from player and put it to inventory
         * @param index of equipment to take off
         * @returns true if equipment is taken off
         */
        tryToTakeOffEquipment(index: number): boolean {
                return this.inventory.fromUsedToUnused(index);
        }

        /**
         *  Attempt to put equipment on the player from inventory
         * @param index index of equipment to put on
         * @returns true if equipment is put on
         */
        tryToPutOnEquipment(index: number): boolean {
                return this.inventory.fromUnusedToUse(index);
        }
}

/**
 * Calculates whether units can see one another.
 * This is true when both units are on the same line and there is not any walls between them.
 * @param unit1
 * @param unit2
 * @returns whether units can see one another
 */
function canSee(unit1: Unit, unit2: Unit): boolean {
        const subtracktedPosition: Vector = sub(unit1.pos, unit2.pos);
        if (subtracktedPosition.x != 0 && subtracktedPosition.y != 0) {
                return false;
        }

        if (subtracktedPosition.x === 0) {
                const x: number = unit1.pos.x;
                const leftCol: number = Math.min(unit1.pos.y, unit2.pos.y);
                const rightCol: number = Math.max(unit1.pos.y, unit2.pos.y);
                for (let y = leftCol + 1; y < rightCol; y++) {
                        if (!unit1.world.getCellAt({ x, y }).isWalkable) {
                                return false;
                        }
                }
        }

        if (subtracktedPosition.y === 0) {
                const y: number = unit1.pos.y;
                const leftRow: number = Math.min(unit1.pos.x, unit2.pos.x);
                const rightRow: number = Math.max(unit1.pos.x, unit2.pos.x);
                for (let x = leftRow + 1; x < rightRow; x++) {
                        if (!unit1.world.getCellAt({ x, y }).isWalkable) {
                                return false;
                        }
                }
        }

        return true;
}

/**
 * Calculates a move at a random direction.
 * @param enemy
 * @returns
 */
function moveRandom(enemy: Enemy): Vector {
        const num: number = new SeededRandomUtilities().getRandomIntegar(3);
        switch (num) {
                case 0: return { x: 0, y: -1 };
                case 1: return { x: -1, y: 0 };
                case 2: return { x: 0, y: 1 };
                default: return { x: 1, y: 0 };
        }
}

export abstract class EnemyBehaviour {
        /**
         * Stand still
         * @param enemy
         * @returns
         */
        standStill(enemy: Enemy): Vector {
                return { x: 0, y: 0 };
        }

        /**
         * Make a move
         * @param enemy enemy
         */
        abstract move(enemy: Enemy): EnemyBehaviour;
}

export abstract class EnemyMaybeMoveTowardsThePlayer extends EnemyBehaviour {
        /**
         * Move towards the player.
         * Routing is simple - we just move in a player's direction on a line.
         * @param enemy
         * @returns
         */
        moveTowardsThePlayer(enemy: Enemy): Vector {
                const player = enemy.world.player;
                if (player.pos.x === enemy.pos.x) {
                        return { x: 0, y: player.pos.y > enemy.pos.y ? 1 : -1 };
                }
                if (player.pos.y === enemy.pos.y) {
                        return { x: player.pos.x > enemy.pos.x ? 1 : -1, y: 0 };
                }
                return { x: 0, y: 0 };
        }
}

export class PassiveBehaviour extends EnemyMaybeMoveTowardsThePlayer {
        /**
         * Moves randomly except if was attacked by somebody.
         * In this case moves towards the attacker.
         * @param enemy
         * @returns
         */
        move(enemy: Enemy): EnemyBehaviour {
                return this;
        }
}

export class AggressiveBehaviour extends EnemyMaybeMoveTowardsThePlayer {
        /**
         * Moves randomly except when sees the player.
         * In this case moves towards the player.
         * @param enemy
         * @returns
         */
        move(enemy: Enemy): EnemyBehaviour {
                const player = enemy.world.player;
                if (canSee(player, enemy)) {
                        enemy.tryWalk(this.moveTowardsThePlayer(enemy));
                } else {
                        enemy.tryWalk(moveRandom(enemy));
                }
                return this;
        }
}

export class CowardBehaviour extends EnemyBehaviour {
        moveFromThePlayer(enemy: Enemy): Vector {
                const player = enemy.world.player;
                if (player.pos.x === enemy.pos.x) {
                        return { x: 0, y: player.pos.y > enemy.pos.y ? -1 : 1 };
                }
                if (player.pos.y === enemy.pos.y) {
                        return { x: player.pos.x > enemy.pos.x ? -1 : 1, y: 0 };
                }
                return { x: 0, y: 0 };
        }

        /**
         * Moves randomly except when sees the player.
         * In this case moves from the player.
         * @param enemy
         * @returns
         */
        move(enemy: Enemy): EnemyBehaviour {
                const player = enemy.world.player;
                if (canSee(player, enemy)) {
                        enemy.tryWalk(this.moveFromThePlayer(enemy));
                } else {
                        enemy.tryWalk(moveRandom(enemy));
                }
                return this;
        }
}

export class Confusion extends EnemyBehaviour {
        constructor(
                private behaviour: EnemyBehaviour,
                private duration: number,
                private turnsCntStart: number
        ) {
                super();
        }

        /**
         * Behaviour modifier that makes enemy move randomly while under this effect.
         * @param enemy
         * @returns
         */
        move(enemy: Enemy): EnemyBehaviour {
                const player = enemy.world.player;
                if (player.world.turnsCnt - this.turnsCntStart > this.duration) {
                        return this.behaviour;
                } else {
                        enemy.tryWalk(moveRandom(enemy));
                }
                return this;
        }
}


class EnemyRender {
        public render(ctx: CanvasRenderingContext2D, position: Vector, canSee: boolean, ctxFillStyles: [any]): void {
                ctx.save();
                ctx.fillStyle = ctxFillStyles[0];
                if (canSee) {
                        ctx.strokeStyle = '#ff0000';
                }
                ctx.beginPath();
                ctx.arc(position.x + 0.5, position.y + 0.5, 0.3, 0, 2 * Math.PI);
                ctx.fill();
                ctx.closePath();
                ctx.restore();
        }

        public static defaultRender = new EnemyRender();
}

export class Enemy extends Unit {
        constructor(
                world: World,
                pos: Vector,
                public behaviour: EnemyBehaviour,
                public hp: number,
                public maxHp: number,
                baseDamage: number,
        ) {
                super(world, pos, hp, maxHp, baseDamage);
        }

        enemyRender = EnemyRender.defaultRender;
        ctxFillStyle = '#000000';

        /**
         * Moves enemy according to his behaviour
         */
        move(): void {
                this.behaviour = this.behaviour.move(this);
        }

        /**
         * Renders an enemy
         * @param ctx
         */
        render(ctx: CanvasRenderingContext2D): void {
                this.enemyRender.render(ctx, this.pos, canSee(this, this.world.player), [this.ctxFillStyle]);
        }

        /**
         * Attacks the defending unit
         * @param defender
         */
        attack(defender: Unit): void {
                defender.takeDamage(this.damage);
        }

        /**
         * Action on death
         */
        death() {
                this.world.enemies.splice(this.world.enemies.indexOf(this), 1);
        }
}

/**
 * Private class for slime type of enemies.
 * They should not be visible from anywhere but the factory,
 * and they are initially created by special factory methods.
 */
class SlimeEnemy extends Enemy {
        constructor(
                world: World,
                pos: Vector,
                behaviour: EnemyBehaviour,
                hp: number,
                maxHp: number,
                baseDamage: number,
                protected duplicationChance: number,
        ) {
                super(world, pos, behaviour, hp, maxHp, baseDamage);
        }

        private spreadTo(pos: Vector): void {
                const instance = new SlimeEnemy(
                        this.world,
                        pos,
                        this.behaviour,
                        this.hp,
                        this.maxHp,
                        this.baseDamage,
                        this.duplicationChance,
                );
                instance.ctxFillStyle = this.ctxFillStyle;
                instance.enemyRender = this.enemyRender;
                this.world.enemies.push(instance);
        }

        /**
         * Tries to move this unit to given position.
         * If it is walkable and not occupied by another unit - moves this unit.
         * If there is another unit at this position - initiates the fight with this unit as an attacker.
         * @param pos - desired position to move to
         * @returns whether this unit actually moved
         */
        tryMoveTo(pos: Vector): boolean {
                if (eq(pos, this.pos)) {
                        return true;
                }
                // Passive chance to leave a copy when moving
                // that does not depend on behaviour strategy
                const oldPos = this.pos;
                const result = super.tryMoveTo(pos);
                if (result && Math.random() < this.duplicationChance) {
                        this.spreadTo(oldPos);
                }
                return result;
        }
}

export abstract class AbstractEnemyFactory {
        constructor(
                protected world: World
        ) { }

        /**
         * create hard-level enemy
         */
        public abstract createHardEnemy(position: Vector): Enemy;

        /**
         * create medium-level enemy
         */
        public abstract createMediumEnemy(position: Vector): Enemy;

        /**
         * create easy-level enemy
         */
        public abstract createEasyEnemy(position: Vector): Enemy;

        /**
         * create hard-level slime enemy
         */
        public abstract createHardSlime(position: Vector): SlimeEnemy;

        /**
         * create medium-level slime enemy
         */
        public abstract createMediumSlime(position: Vector): SlimeEnemy;

        /**
         * create easy-level slime enemy
         */
        public abstract createEasySlime(position: Vector): SlimeEnemy;
}

/**
 * Factory produces default circle enemies
 */
export class SimpleEnemyFactory extends AbstractEnemyFactory {
        private static aggressiveBehaviour = new AggressiveBehaviour();
        private static passiveBehaviour = new PassiveBehaviour();
        private static cowardBehaviour = new CowardBehaviour();

        private static MAX_HP = 10;
        private static MAX_DAMAGE = 10;

        public createHardEnemy(position: Vector): Enemy {
                const instance = new Enemy(
                        this.world,
                        position,
                        SimpleEnemyFactory.aggressiveBehaviour,
                        SimpleEnemyFactory.MAX_HP,
                        SimpleEnemyFactory.MAX_HP,
                        SimpleEnemyFactory.MAX_DAMAGE
                );
                instance.ctxFillStyle = '#ffd700';
                return instance;
        }

        public createMediumEnemy(position: Vector): Enemy {
                const instance = new Enemy(
                        this.world,
                        position,
                        SimpleEnemyFactory.cowardBehaviour,
                        Math.floor(2 * SimpleEnemyFactory.MAX_HP / 3),
                        Math.floor(2 * SimpleEnemyFactory.MAX_HP / 3),
                        Math.floor(3 * SimpleEnemyFactory.MAX_DAMAGE / 4),
                );
                instance.ctxFillStyle = '#c7d1da';
                return instance;
        }

        public createEasyEnemy(position: Vector): Enemy {
                return new Enemy(
                        this.world,
                        position,
                        SimpleEnemyFactory.passiveBehaviour,
                        Math.floor(SimpleEnemyFactory.MAX_HP / 3),
                        Math.floor(SimpleEnemyFactory.MAX_HP / 3),
                        Math.floor(SimpleEnemyFactory.MAX_DAMAGE / 4),
                );
        }

        public createHardSlime(position: Vector): SlimeEnemy {
                const instance = new SlimeEnemy(
                        this.world,
                        position,
                        SimpleEnemyFactory.aggressiveBehaviour,
                        SimpleEnemyFactory.MAX_HP,
                        SimpleEnemyFactory.MAX_HP,
                        SimpleEnemyFactory.MAX_DAMAGE,
                        0.25,
                );
                instance.ctxFillStyle = '#ffd700';
                return instance;
        }

        public createMediumSlime(position: Vector): SlimeEnemy {
                const instance = new SlimeEnemy(
                        this.world,
                        position,
                        SimpleEnemyFactory.cowardBehaviour,
                        Math.floor(2 * SimpleEnemyFactory.MAX_HP / 3),
                        Math.floor(2 * SimpleEnemyFactory.MAX_HP / 3),
                        Math.floor(3 * SimpleEnemyFactory.MAX_DAMAGE / 4),
                        0.1,
                );
                instance.ctxFillStyle = '#c7d1da';
                return instance;
        }

        public createEasySlime(position: Vector): SlimeEnemy {
                return new SlimeEnemy(
                        this.world,
                        position,
                        SimpleEnemyFactory.passiveBehaviour,
                        Math.floor(SimpleEnemyFactory.MAX_HP / 3),
                        Math.floor(SimpleEnemyFactory.MAX_HP / 3),
                        Math.floor(SimpleEnemyFactory.MAX_DAMAGE / 4),
                        0.05,
                );
        }
}


/**
 * Factory produces triangle enemies
 */
export class TriangleEnemyFactory extends AbstractEnemyFactory {
        private static aggressiveBehaviour = new AggressiveBehaviour();
        private static cowardBehaviour = new CowardBehaviour();

        private enemyRender = new class extends EnemyRender {
                public render(ctx: CanvasRenderingContext2D, position: Vector, canSee: boolean, ctxFillStyles: [any]): void {
                        ctx.save();
                        ctx.fillStyle = ctxFillStyles[0];
                        if (canSee) {
                                ctx.strokeStyle = '#ff0000';
                        }
                        ctx.beginPath();
                        ctx.moveTo(position.x + 0.15, position.y + 0.85);
                        ctx.lineTo(position.x + 0.85, position.y + 0.85);
                        ctx.lineTo(position.x + 0.5, position.y + 0.15);
                        ctx.lineTo(position.x + 0.15, position.y + 0.85);
                        ctx.fill();
                        ctx.closePath();
                        ctx.restore();
                }
        }

        private static MAX_HP = 12;
        private static MAX_DAMAGE = 12;

        public createHardEnemy(position: Vector): Enemy {
                const instance = new Enemy(
                        this.world,
                        position,
                        TriangleEnemyFactory.aggressiveBehaviour,
                        TriangleEnemyFactory.MAX_HP,
                        TriangleEnemyFactory.MAX_HP,
                        TriangleEnemyFactory.MAX_DAMAGE
                );
                instance.ctxFillStyle = '#ffd700';
                instance.enemyRender = this.enemyRender;
                return instance;
        }

        public createMediumEnemy(position: Vector): Enemy {
                const instance = new Enemy(
                        this.world,
                        position,
                        TriangleEnemyFactory.aggressiveBehaviour,
                        Math.floor(2 * TriangleEnemyFactory.MAX_HP / 3),
                        Math.floor(2 * TriangleEnemyFactory.MAX_HP / 3),
                        Math.floor(3 * TriangleEnemyFactory.MAX_DAMAGE / 4),
                );
                instance.ctxFillStyle = '#c7d1da';
                instance.enemyRender = this.enemyRender;
                return instance;
        }

        public createEasyEnemy(position: Vector): Enemy {
                const instance = new Enemy(
                        this.world,
                        position,
                        TriangleEnemyFactory.cowardBehaviour,
                        Math.floor(TriangleEnemyFactory.MAX_HP / 3),
                        Math.floor(TriangleEnemyFactory.MAX_HP / 3),
                        Math.floor(TriangleEnemyFactory.MAX_DAMAGE / 4),
                );
                instance.enemyRender = this.enemyRender;
                return instance;
        }

        public createHardSlime(position: Vector): SlimeEnemy {
                const instance = new SlimeEnemy(
                        this.world,
                        position,
                        TriangleEnemyFactory.aggressiveBehaviour,
                        TriangleEnemyFactory.MAX_HP,
                        TriangleEnemyFactory.MAX_HP,
                        TriangleEnemyFactory.MAX_DAMAGE,
                        0.25,
                );
                instance.ctxFillStyle = '#ffd700';
                return instance;
        }

        public createMediumSlime(position: Vector): SlimeEnemy {
                const instance = new SlimeEnemy(
                        this.world,
                        position,
                        TriangleEnemyFactory.cowardBehaviour,
                        Math.floor(2 * TriangleEnemyFactory.MAX_HP / 3),
                        Math.floor(2 * TriangleEnemyFactory.MAX_HP / 3),
                        Math.floor(3 * TriangleEnemyFactory.MAX_DAMAGE / 4),
                        0.1,
                );
                instance.ctxFillStyle = '#c7d1da';
                return instance;
        }

        public createEasySlime(position: Vector): SlimeEnemy {
                return new SlimeEnemy(
                        this.world,
                        position,
                        TriangleEnemyFactory.cowardBehaviour,
                        Math.floor(TriangleEnemyFactory.MAX_HP / 3),
                        Math.floor(TriangleEnemyFactory.MAX_HP / 3),
                        Math.floor(TriangleEnemyFactory.MAX_DAMAGE / 4),
                        0.05,
                );
        }
}

/**
 * Special factory for mock units, does not implement standard interface
 * both in order to not be mistaken for normal and because
 * it requires a different interface
 */
export class MockUnitFactory {
        constructor(
                readonly world: World
        ) { }

        private static behaviour = new AggressiveBehaviour();

        public createWeakSlime(position: Vector): Enemy {
                return new SlimeEnemy(
                        this.world,
                        position,
                        MockUnitFactory.behaviour,
                        10,
                        10,
                        1,
                        0.0
                );
        }

        public createStrongSlime(position: Vector): Enemy {
                return new SlimeEnemy(
                        this.world,
                        position,
                        MockUnitFactory.behaviour,
                        10,
                        10,
                        1,
                        1.0
                );
        }
}

export class GetRandomPosition {
        private freeCell: boolean[][];
        private count: number = 0;

        constructor(
                readonly world: World,
                private width: number,
                private height: number,
                private randomizer: SeededRandomUtilities
        ) {
                this.freeCell = [];
                for (let i = 0; i < height; i++) {
                        this.freeCell[i] = [];
                        for (let j = 0; j < width; j++) {
                                const x: number = i;
                                const y: number = j;
                                const cell: Vector = { x, y };
                                this.freeCell[i][j] = this.world.getCellAt(cell).isWalkable;
                        }
                }
        }

        /**
         * Returns a vector with coordinates of a free cell
         * @returns
         */
        get(): Vector {
                let x, y: number;
                do {
                        x = this.randomizer.getRandomIntegar(this.width);
                        y = this.randomizer.getRandomIntegar(this.height);
                } while (!this.freeCell[x][y]);
                this.freeCell[x][y] = false;
                this.count++;
                return { x, y };
        }
}
