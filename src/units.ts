import { World, white } from "./game_rules";
import { Equipment, Helmet, Sword } from "./equipment";
import SeededRandomUtilities from "seeded-random-utilities";
import { Vector, add, sub } from "./vector";

/**
 * Initiates a fight between attacker and defending Unit.
 * The unit1 has the first strike.
 * If he kills the other Unit with this strike, unit1 will not receive a counter attack.
 * @param attacker - a unit who attacked
 * @param defender - a unit who is defending
 * @returns void
 */
function fight(attacker: Unit, defender: Unit): void {
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
        public level: number = 1;
        public xp: number = 0;
        public limitXp: number = 2;

        constructor(
                readonly world: World,
                private _pos: Vector,
                public hp: number,
                public maxHp: number,
                public damage: number,
        ) { }

        get pos(): Vector {
                return {
                        x: this._pos.x,
                        y: this._pos.y,
                };
        }

        /**
         * Tries to move this unit to given position.
         * If it is walkable and not occupied by another unit - moves this unit.
         * If there is another unit at this position - initiates the fight with this unit as an attacker.
         * @param pos - desired position to move to
         * @returns whether this unit actually moved
         */
        public tryMoveTo(pos: Vector): boolean {
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
        public tryWalk(delta: Vector): boolean {
                if (delta.x * delta.y != 0 || Math.abs(delta.x) + Math.abs(delta.y) != 1) {
                        return false;
                }
                return this.tryMoveTo(add(this.pos, delta));
        }

        /**
         * Renders the unit
         * @param ctx - rendering context
         */
        public render(ctx: CanvasRenderingContext2D) {
                ctx.fillStyle = '#7fbfff';
        }

        /**
         * Called whenever this unit kills another unit.
         * Serves to register the fact and grant killer with according bonuses in xp that might lead to leveling the killer up.
         * @param killedUnit
         */
        public onKill(killedUnit: Unit): void {
                this.xp += killedUnit.level;
                if (this.xp > this.limitXp) {
                        this.xp %= this.limitXp;
                        this.level++; //TODO: вынести levelUp в отдельную функцию
                        this.maxHp++;
                        this.damage++;
                        this.hp = this.maxHp;
                        this.limitXp += this.level;
                }
        }

        /**
         * Called when this unit is dead.
         */
        public abstract death(): void

        /**
         * Called when this unit is attacking another.
         * @param unit - attacked unit
         */
        abstract attack(unit: Unit): void

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
        public attack(unit: Unit) {
                const enemy = unit as Enemy; // TODO: class for Mobs in case if we need NPCs
                enemy.hp -= this.damage;
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

        /**
         * Attempt to take equipment from currect cell of player
         * @returns true if equipment is taken
         */
        tryToTakeEquipment(): boolean {
                const equip = this.world.getAndRemoveEquipmentAt(this.pos)
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
                case 0:
                        return { x: 0, y: -1 };
                case 1:
                        return { x: -1, y: 0 };
                case 2:
                        return { x: 0, y: 1 };
                default:
                        return { x: 1, y: 0 };
        }
}

export abstract class EnemyBehaviour {
        wasAttacked: boolean = false;

        /**
         * Stand still
         * @param enemy
         * @returns
         */
        standStill(enemy: Enemy) {
                return { x: 0, y: 0 };
        }

        /**
         * Make a move
         * @param enemy enemy
         */
        abstract move(enemy: Enemy): EnemyBehaviour
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
        move(enemy: Enemy): EnemyBehaviour { //TODO: сделать так, чтобы поведение соответствовало описанию
                const player = enemy.world.player;
                if (this.wasAttacked) {
                        if (canSee(player, enemy)) {
                                enemy.tryWalk(this.moveTowardsThePlayer(enemy));
                        } else {
                                enemy.tryWalk(moveRandom(enemy));
                        }
                }
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

export class Enemy extends Unit {
        constructor(
                world: World,
                pos: Vector,
                public behaviour: EnemyBehaviour,
                public hp: number,
                public maxHp: number,
                public damage: number,
        ) {
                super(world, pos, hp, maxHp, damage);
        }

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
        render(ctx: CanvasRenderingContext2D) {
                ctx.fillStyle = '#000000';
                if (canSee(this, this.world.player)) {
                        ctx.fillStyle = '#ff0000';
                } // TODO: delete later
                ctx.beginPath();
                ctx.arc(this.pos.x + 0.5, this.pos.y + 0.5, 0.3, 0, 2 * Math.PI);
                ctx.fill();
                ctx.closePath();
        }

        /**
         * Attacks the defending unit
         * @param defender
         */
        attack(defender: Unit) {
                defender.hp -= this.damage;
        }

        /**
         * Action on death
         */
        death(): void {
                this.world.enemies.splice(this.world.enemies.indexOf(this), 1);
                this.world.units.splice(this.world.units.indexOf(this), 1);
        }
}

export class CreateEnemy {
        private getRandomPosition: GetRandomPosition
        private behaviours: EnemyBehaviour[] = [new AggressiveBehaviour(), new PassiveBehaviour(), new CowardBehaviour()];
        private len: number = this.behaviours.length;

        constructor(
                private world: World,
                width: number,
                height: number,
                private randomizer: SeededRandomUtilities
        ) {
                this.getRandomPosition = new GetRandomPosition(world, width, height, this.randomizer);
        }

        /**
         * Returns a randomly selected mob behavior
         * @returns
         */
        private getRandomBehavior(): EnemyBehaviour {
                return this.behaviours[this.randomizer.getRandomIntegar(this.len)];
        }

        /**
         * Returns a random number from 0 to m inclusive
         * @param m
         * @returns
         */
        private getRandomBefore(m: number): number {
                return this.randomizer.getRandomIntegar(1, m);
        }

        /**
         * Returns new Enemy
         * @returns
         */
        get() {
                return new Enemy(
                        this.world,
                        this.getRandomPosition.get(),
                        this.getRandomBehavior(),
                        this.getRandomBefore(10),
                        this.getRandomBefore(10),
                        this.getRandomBefore(10)
                )
        }

}

export class GetRandomPosition {
        constructor(
                readonly world: World,
                private width: number,
                private height: number,
                private randomizer: SeededRandomUtilities
        ) { }

        /**
         * Returns a vector with coordinates of a free cell
         * @returns
         */
        public get(): Vector {
                let x, y: number;
                do {
                        x = this.randomizer.getRandomIntegar(this.width);
                        y = this.randomizer.getRandomIntegar(this.height);
                } while (!this.world.getCellAt({ x, y }).isWalkable);
                return { x: x, y: y };
        }
}
