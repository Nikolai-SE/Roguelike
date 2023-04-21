import { Camera } from "./Camera";
import { World } from "./GameRules";

const world = new World();
const camera = new Camera({x: 0, y: 0}, world);

let prevTime = 0;

function onAnimationFrame(time: number) {
        const dt = time - prevTime;
        prevTime = time;
        camera.animate(time, dt);

        const canvas = document.getElementById('mainCanvas') as HTMLCanvasElement;
        const bounds = {
                x: canvas.clientWidth,
                y: canvas.clientHeight,
        };
        canvas.width = bounds.x;
        canvas.height = bounds.y;
        const ctx = canvas.getContext('2d')!;

        camera.render(ctx, bounds);
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(bounds.x / 2 - 5, bounds.y / 2 - 5, 10, 10);
        ctx.closePath();

        requestAnimationFrame(onAnimationFrame);
}

requestAnimationFrame(onAnimationFrame);
