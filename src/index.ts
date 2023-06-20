import { MainMenuPage, Page } from "./pages";

let currentPage: Page = new MainMenuPage();
let prevTime = 0;

function onAnimationFrame(time: number) {
        const dt = time - prevTime;
        prevTime = time;

        currentPage = currentPage.update(time, dt);

        const canvas = document.getElementById('mainCanvas') as HTMLCanvasElement;
        const bounds = {
                x: canvas.clientWidth,
                y: canvas.clientHeight,
        };
        canvas.width = bounds.x;
        canvas.height = bounds.y;
        const ctx = canvas.getContext('2d')!;
        currentPage.render(ctx, bounds);
        requestAnimationFrame(onAnimationFrame);
}

function onKeyDown(evt: KeyboardEvent) {
        currentPage = currentPage.onKeyDown(evt);
}

window.addEventListener('keydown', onKeyDown);
requestAnimationFrame(onAnimationFrame);
