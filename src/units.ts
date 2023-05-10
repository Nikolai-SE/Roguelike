import { World, white } from "./game_rules"
import { Equipment, Helmet, Sword } from "./equipment"
import SeededRandomUtilities from "seeded-random-utilities"
import { Vector, add, sub } from "./common_constants"

/**
 * Initiates a fight between attacker and defending Unit. 
 * The agressor has the first strike.
 * If he kills the other Unit with this strike, agressor will not receive a counter attack.
 * @param agressor - a unit who attacked
 * @param defender - a unit who is defending
 * @returns void
 */
function fight(agressor: Unit, defender: Unit): void {
    agressor.attack(defender);
    if (defender.checkDeath()) {
        agressor.onKill(defender);
        return;
    }
    defender.attack(agressor);
    if (agressor.checkDeath()) {
        defender.onKill(agressor);
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
        public hp: number,
        public maxHp: number,
        public damage: number,
    ) {
        super(world, pos, hp, maxHp, damage);
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
     * @param unit - defender
     */
    public attack(unit: Unit) {
        let enemy = unit as Enemy; // TODO: class for Mobs in case if we need NPCs
        enemy.hp -= this.damage;
        if (this.world.randomizer.getRandomBool()) {
            enemy.behaviour = new Confusion(enemy.behaviour, this.moveDuration, this.world.turnsCnt);
        }
    }

    readonly inventory = new class Inventory {
        used: Equipment[] = [];
        unused: Equipment[] = [];

        /**
         * addToUse: void
         * transfer equipment from unused by index to used
         * index: number 
         */
        fromUnusedToUse(index: number): boolean { //TODO: fix spelling
            let removed = this.unused.slice(index, 1);
            if (removed.length > 0) {
                this.used.concat(removed);
                return true;
            }
            else {
                return false;
            }
        }

        /**
         * Tries to unequip the equipment at given index
         * @param index - index of the equipment
         * @returns whether equipment at given index was unequipped
         */
        fromUsedToUnused(index: number): boolean {
            let removed = this.used.slice(index, 1);
            if (removed.length > 0) {
                this.unused.concat(removed);
                return true;
            }
            else {
                return false;
            }
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
        let equip = this.world.getAndRemoveEquipmentAt(this.pos)
        if (equip == null)
            return false;
        this.inventory.addToUnused(equip);
        return true;
    }

    /**
     * Attempt to take off equipment  from player and put it to inventory
     * @param index of equipment to take off
     * @returns true if equipment is taken off 
     */
    tryToTakeOffEquipment(index: number): boolean {
        let equip = this.inventory.used.splice(index, 1);
        if (equip.length == 0)
            return false;
        this.inventory.unused.push(equip[0]);
        return true;
    }

    /**
     *  Attempt to put equipment on the player from inventory
     * @param index index of equipment to put on
     * @returns true if equipment is put on
     */
    tryToPutOnEquipment(index: number): boolean {
        let equip = this.inventory.unused.splice(index, 1);
        if (equip.length == 0)
            return false;
        this.inventory.used.push(equip[0]);
        return true;
    }
}

function canSee(agressor: Unit, defender: Unit): boolean {
    const subtracktedPosition: Vector = sub(agressor.pos, defender.pos);
    if (subtracktedPosition.x != 0 && subtracktedPosition.y != 0) {
        return false;
    }

    if (subtracktedPosition.x == 0) {
        const x: number = agressor.pos.x;
        const leftCol: number = Math.min(agressor.pos.y, defender.pos.y);
        const rightCol: number = Math.max(agressor.pos.y, defender.pos.y);
        for (let y = leftCol + 1; y < rightCol; y++) {
            if (agressor.world.getCellAt({ x, y }) != white) {
                return false;
            }
        }
    }

    if (subtracktedPosition.y == 0) {
        const y: number = agressor.pos.y;
        const leftRow: number = Math.min(agressor.pos.x, defender.pos.x);
        const rightRow: number = Math.max(agressor.pos.x, defender.pos.x);
        for (let x = leftRow + 1; x < rightRow; x++) {
            if (agressor.world.getCellAt({ x, y }) != white) {
                return false;
            }
        }
    }

    return true;
}

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

    moveOnPlace(enemy: Enemy) {
        return { x: 0, y: 0 };
    }

    abstract move(player: Player, enemy: Enemy): EnemyBehaviour
}

export abstract class EnemyMaybeMoveTowardsThePlayer extends EnemyBehaviour {
    moveTowardsThePlayer(player: Player, enemy: Enemy): Vector {
        if (player.pos.x == enemy.pos.x) {
            return { x: 0, y: player.pos.y > enemy.pos.y ? 1 : -1 };
        }
        if (player.pos.y == enemy.pos.y) {
            return { x: player.pos.x > enemy.pos.x ? 1 : -1, y: 0 };
        }
        return { x: 0, y: 0 };
    }
}

export class PassiveBehaviour extends EnemyMaybeMoveTowardsThePlayer {
    move(player: Player, enemy: Enemy): EnemyBehaviour {
        if (this.wasAttacked) {
            if (canSee(player, enemy)) {
                enemy.tryWalk(this.moveTowardsThePlayer(player, enemy));
            } else {
                enemy.tryWalk(moveRandom(enemy));
            }
        }
        return this;
    }
}

export class AggressiveBehaviour extends EnemyMaybeMoveTowardsThePlayer {
    move(player: Player, enemy: Enemy): EnemyBehaviour {
        if (canSee(player, enemy)) {
            enemy.tryWalk(this.moveTowardsThePlayer(player, enemy));
        } else {
            enemy.tryWalk(moveRandom(enemy));
        }
        return this;
    }
}

export class CowardBehaviour extends EnemyBehaviour {
    moveFromThePlayer(player: Player, enemy: Enemy): Vector {
        if (player.pos.x == enemy.pos.x) {
            return { x: 0, y: player.pos.y > enemy.pos.y ? -1 : 1 };
        }
        if (player.pos.y == enemy.pos.y) {
            return { x: player.pos.x > enemy.pos.x ? -1 : 1, y: 0 };
        }
        return { x: 0, y: 0 };
    }

    move(player: Player, enemy: Enemy): EnemyBehaviour {
        if (canSee(player, enemy)) {
            enemy.tryWalk(this.moveFromThePlayer(player, enemy));
        } else {
            enemy.tryWalk(moveRandom(enemy));
        }
        return this;
    }
}

export class Confusion extends EnemyBehaviour {
    private behaviour: EnemyBehaviour;
    private duration: number;
    private turnsCntStart: number;
    constructor(behaviour: EnemyBehaviour, duration: number, turnsCntStart: number) {
        super();
        this.behaviour = behaviour;
        this.duration = duration;
        this.turnsCntStart = turnsCntStart;
    }



    move(player: Player, enemy: Enemy): EnemyBehaviour {
        if (player.world.turnsCnt - this.turnsCntStart > this.duration) {
            return this.behaviour;
        } else {
            enemy.tryWalk(moveRandom(enemy));
        }
        return this;
    }
}

export class Enemy extends Unit {
    behaviour: EnemyBehaviour;
    constructor(
        world: World,
        pos: Vector,
        behaviour: EnemyBehaviour,
        public hp: number,
        public maxHp: number,
        public damage: number,
    ) {
        super(world, pos, hp, maxHp, damage);
        this.behaviour = behaviour;
    }

    move(): void {
        this.behaviour = this.behaviour.move(this.world.player, this);
    }

    tryWalk(delta: Vector): boolean {
        if (delta.x * delta.y != 0 || Math.abs(delta.x) + Math.abs(delta.y) != 1) {
            return false;
        }
        return this.tryMoveTo(add(this.pos, delta));
    }

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

    attack(unit: Unit) {
        unit.hp -= this.damage;
    }

    death(): void { //TODO: death
        this.world.enemies.splice(this.world.enemies.indexOf(this), 1);
        this.world.units.splice(this.world.units.indexOf(this), 1);
    }
}

export class CreateEnemy {
    private world: World;
    readonly walls: boolean[][];
    private randomizer: SeededRandomUtilities;
    private getRandomPosition: GetRandomPosition
    private behaviours: EnemyBehaviour[] = [new AggressiveBehaviour(), new PassiveBehaviour(), new CowardBehaviour()];
    private len: number = this.behaviours.length;
    constructor(world: World, walls: boolean[][]) {
        this.world = world;
        this.walls = walls;
        this.randomizer = this.world.randomizer;
        this.getRandomPosition = new GetRandomPosition(walls, this.randomizer);
    }

    private getRandomBehavior(): EnemyBehaviour {
        return this.behaviours[this.randomizer.getRandomIntegar(this.len)];
    }

    private getRandomBefore(m: number): number {
        return this.randomizer.getRandomIntegar(1, m);
    }

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
    private randomizer: SeededRandomUtilities;
    readonly walls: boolean[][];
    constructor(walls: boolean[][], randomizer: SeededRandomUtilities) {
        this.walls = walls;
        this.randomizer = randomizer;
    }

    public get(): Vector {
        if (!this.walls[0]) {
            return { x: 0, y: 0 };
        }
        const maxX: number = this.walls.length;
        const maxY: number = this.walls[0].length;
        let x, y: number;
        do {
            x = this.randomizer.getRandomIntegar(maxX);
            y = this.randomizer.getRandomIntegar(maxY);
        } while (this.walls[x][y]);
        return { x: x, y: y };
    }
}
