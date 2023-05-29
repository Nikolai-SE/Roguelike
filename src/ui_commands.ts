import { World } from "./game_rules";
import { GamePage, MainMenuPage, Page } from "./pages";
import { FileWorldBuilder, RandomWorldBuilder } from "./world_builder";
import worldJson from '../World.json'

export interface Command {
    execute(): Page;
}


export class GenerateNewRandomWorld implements Command {
    constructor(private page: GamePage) {
    }
    execute(): Page {
        return new GamePage(new RandomWorldBuilder());
    }
}

export class LoadWorldFromFile implements Command {
    constructor(private page: GamePage) {
    }
    execute(): Page {
        let builder = new FileWorldBuilder();
        builder.source = JSON.stringify(worldJson);
        return new GamePage(builder);
    }
}




export class EscapeCommand implements Command {
    constructor(private page: GamePage, private world: World) {
    }

    execute(): Page {
        if (this.page.confirmExit)
            return new MainMenuPage();

        this.page._confirmExit = true;
        return this.page;
    }

}


export class WalkForward implements Command {
    constructor(private page: GamePage, private world: World) {
    }
    execute(): Page {
        this.world.player.tryWalk({ x: 0, y: -1 });
        return this.page;
    }
}

export class WalkBackWard implements Command {
    constructor(private page: GamePage, private world: World) {
    }
    execute(): Page {
        this.world.player.tryWalk({ x: 0, y: 1 });
        return this.page;
    }
}

export class WalkRight implements Command {
    constructor(private page: GamePage, private world: World) {
    }
    execute(): Page {
        this.world.player.tryWalk({ x: 1, y: 0 });
        return this.page;
    }
}

export class WalkLeft implements Command {
    constructor(private page: GamePage, private world: World) {
    }
    execute(): Page {
        this.world.player.tryWalk({ x: -1, y: 0 });
        return this.page;
    }
}

export class TakeEquipmentCommand implements Command {
    constructor(private page: GamePage, private world: World) {
    }
    execute(): Page {
        this.world.player.tryToTakeEquipment();
        return this.page
    }
}

export class PutEquipmentCommand implements Command {
    constructor(private page: GamePage, private world: World) {
    }
    execute(): Page {
        const indexEquip = Number(window.prompt("Enter index of equipment to put on.   1, 2, ...", ""));
        if (!Number.isNaN(indexEquip) && indexEquip > 0) {
            this.world.player.tryToPutOnEquipment(indexEquip - 1);
        }
        return this.page
    }
}

export class TakeOffEquipmentCommand implements Command {
    constructor(private page: GamePage, private world: World) {
    }
    execute(): Page {
        const indexRemove = Number(window.prompt("Enter index of equipment to take off.  1, 2, ...", ""));
        if (!Number.isNaN(indexRemove) && indexRemove > 0) {
            this.world.player.tryToTakeOffEquipment(indexRemove - 1);
        }
        return this.page
    }
}
