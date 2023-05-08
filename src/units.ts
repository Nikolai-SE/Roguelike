import { World, white } from "./game_rules"
import SeededRandomUtilities from "seeded-random-utilities"
import { Vector, add, sub } from "./common_constants"

function fight(aggressor: Unit, defender: Unit) {
    aggressor.attack(defender) //TODO: ; in the ends
    if (defender.checkDeath()) {
        aggressor.onKill(defender);
        return;
    }
    defender.attack(aggressor)
    if (aggressor.checkDeath()) {
        defender.onKill(aggressor);
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

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = '#7fbfff';
    }

    onKill(killedUnit: Unit): void {
        this.xp += killedUnit.level;
        if (this.xp > this.limitXp) {
            this.xp %= this.limitXp;
            this.level++;
            this.maxHp++;
            this.damage++;
            this.hp = this.maxHp;
            this.limitXp += this.level;
        }
    }

    abstract death(): void

    abstract attack(unit: Unit): void

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

    tryWalk(delta: Vector): boolean {
        if (delta.x * delta.y != 0 || Math.abs(delta.x) + Math.abs(delta.y) != 1) {
            return false;
        }
        return this.tryMoveTo(add(this.pos, delta));
    }

    render(ctx: CanvasRenderingContext2D) {
        ctx.fillStyle = '#7fbfff';
        ctx.beginPath();
        ctx.arc(this.pos.x + 0.5, this.pos.y + 0.5, 0.3, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
    }

    death(): void { //TODO: death

    }

    attack(unit: Unit) { //TODO: ; and types
        let enemy = unit as Enemy; // TODO: class for Mobs in case if we need NPCs
        enemy.hp -= this.damage;
        if (this.world.randomizer.getRandomBool()) {
            enemy.behaviour = new Confusion(enemy.behaviour, this.moveDuration, this.world.turnsCnt);
        }
    }
}

function canSee(aggressor: Unit, defender: Unit): boolean {
    const subtracktedPosition: Vector = sub(aggressor.pos, defender.pos);
    if (subtracktedPosition.x != 0 && subtracktedPosition.y != 0) {
        return false;
    }

    if (subtracktedPosition.x == 0) {
        const x: number = aggressor.pos.x;
        const leftCol: number = Math.min(aggressor.pos.y, defender.pos.y);
        const rightCol: number = Math.max(aggressor.pos.y, defender.pos.y);
        for (let y = leftCol + 1; y < rightCol; y++) {
            if (aggressor.world.getCellAt({ x, y }) != white) {
                return false;
            }
        }
    }

    if (subtracktedPosition.y == 0) {
        const y: number = aggressor.pos.y;
        const leftRow: number = Math.min(aggressor.pos.x, defender.pos.x);
        const rightRow: number = Math.max(aggressor.pos.x, defender.pos.x);
        for (let x = leftRow + 1; x < rightRow; x++) {
            if (aggressor.world.getCellAt({ x, y }) != white) {
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
