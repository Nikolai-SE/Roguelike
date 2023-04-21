function onAnimationFrame(_time: DOMHighResTimeStamp) {
        const canvas = document.getElementById('mainCanvas') as HTMLCanvasElement;
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        const ctx = canvas.getContext('2d')!;

        ctx.fillStyle = '#ffc080';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        for (let x = 0; x <= 10; x++) {
                for (let y = 0; y <= 10; y++) {
                        ctx.rect(20 * (x + 2), 20 * (y + 2), 10, 10);
                }
        }
        ctx.stroke();
        ctx.closePath();

        requestAnimationFrame(onAnimationFrame);
}

requestAnimationFrame(onAnimationFrame);
