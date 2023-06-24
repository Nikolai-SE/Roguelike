import { GamePage, MainMenuPage, Page } from "./pages";
import { StringWorldBuilder, RandomWorldBuilder } from "./world_builder";
import worldJson from '../World.json'

export interface Command {
    execute(): Page;
}


export class GenerateNewRandomWorldCommand implements Command {
    constructor(private page: MainMenuPage) {
    }
    execute(): Page {
        return new GamePage(new RandomWorldBuilder());
    }
}

export class LoadWorldFromFileCommand implements Command {
    constructor(private page: MainMenuPage) {
    }
    execute(): Page {
        let builder = new StringWorldBuilder();
        builder.source = JSON.stringify(worldJson);
        return new GamePage(builder);
    }
}


/**
 * Process user attempts to escape game
 */
export class EscapeCommand implements Command {
    constructor(private page: GamePage) {
    }
    execute(): Page {
        if (confirm("Quit the game?"))
            return new MainMenuPage();
        return this.page;
    }
}



/**
 * Player is trying to make a move in a corresponding direction.
 */

export class WalkForward implements Command {
    constructor(private page: GamePage) {
    }
    execute(): Page {
        this.page.world.player.tryWalk({ x: 0, y: -1 });
        return this.page;
    }
}

export class WalkBackWard implements Command {
    constructor(private page: GamePage) {
    }
    execute(): Page {
        this.page.world.player.tryWalk({ x: 0, y: 1 });
        return this.page;
    }
}

export class WalkRight implements Command {
    constructor(private page: GamePage) {
    }
    execute(): Page {
        this.page.world.player.tryWalk({ x: 1, y: 0 });
        return this.page;
    }
}

export class WalkLeft implements Command {
    constructor(private page: GamePage) {
    }
    execute(): Page {
        this.page.world.player.tryWalk({ x: -1, y: 0 });
        return this.page;
    }
}




/**
 * Player takes an equipment from cell where player is.
 */
export class TakeEquipmentCommand implements Command {
    constructor(private page: GamePage) {
    }
    execute(): Page {
        this.page.world.player.tryToTakeEquipment();
        return this.page
    }
}

/**
 * Player puts on an equipment with index which player enters after pressing.
 */
export class PutEquipmentCommand implements Command {
    constructor(private page: GamePage) {
    }
    execute(): Page {
        const indexEquip = Number(window.prompt("Enter index of equipment to put on.   1, 2, ...", ""));
        if (!Number.isNaN(indexEquip) && indexEquip > 0) {
            this.page.world.player.tryToPutOnEquipment(indexEquip - 1);
        }
        return this.page
    }
}

/**
 * Player takes off an equipment with index which player enters after pressing.
 */
export class TakeOffEquipmentCommand implements Command {
    constructor(private page: GamePage) {
    }
    execute(): Page {
        const indexRemove = Number(window.prompt("Enter index of equipment to take off.  1, 2, ...", ""));
        if (!Number.isNaN(indexRemove) && indexRemove > 0) {
            this.page.world.player.tryToTakeOffEquipment(indexRemove - 1);
        }
        return this.page
    }
}
