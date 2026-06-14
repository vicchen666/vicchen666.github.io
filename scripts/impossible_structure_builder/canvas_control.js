let c;
const TAU = Math.PI * 2;
const canvas = $("#main-canvas canvas")[0];
const ctx = canvas.getContext("2d");
{
    class CanvasControl extends CanvasControlBase {
        constructor(options = {animate: false}) {
            super(options);
            this.set_canvas(true);
            this.setup_listeners();
            this.draw();
            this.axis1 = [0, -1];
            this.axis2 = [Math.cos(TAU / 6), Math.sin(TAU / 6)];
            this.axis3 = [Math.cos(TAU / 3), Math.sin(TAU / 3)];
        }

        render_frame() {
            ctx.clearRect(...vec_scale(this.origin, 1 / this.size), canvas.width / this.size, canvas.height / this.size);
            this.draw_beams();
        }

        draw_beams() {
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.strokeStyle = "yellow";
            ctx.lineWidth = 2 / this.size;

            ctx.beginPath();
            ctx.moveTo(-100, -100);
            ctx.lineTo(100, -100);
            ctx.lineTo(100, 100);
            ctx.lineTo(-100, 100);
            ctx.closePath();
            ctx.stroke();
            console.log("drawn");
        }
    }

    c = new CanvasControl();
}