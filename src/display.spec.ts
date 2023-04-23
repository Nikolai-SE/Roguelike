import { ok } from "assert";
import { eq } from "./rectangle";
import { GamePage } from "./pages";
import { CELL_SIZE } from "./common_constants";

describe('Camera bounds', () => {
        it('should capture the world', () => {
                const mockPage = new GamePage();
                const screenBounds = { x: 1.5 * CELL_SIZE, y: 1.5 * CELL_SIZE };
                const camera = mockPage.camera;

                let calcBounds = camera.calcWorldBounds(screenBounds);
                ok(eq(calcBounds, { xMin: -1, xMax: 1, yMin: -1, yMax: 1 }));

                camera.center = { x: 0.5, y: 0.5 };
                calcBounds = camera.calcWorldBounds(screenBounds);
                ok(eq(calcBounds, { xMin: 0, xMax: 1, yMin: 0, yMax: 1 }));
        });
});
