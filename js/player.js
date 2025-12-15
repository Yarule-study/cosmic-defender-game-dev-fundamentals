class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = CONFIG.PLAYER_SPEED;
        this.shootCooldown = 0;
    }

    update(keys, canvas) {
        if (keys['ArrowLeft'] || keys['a']) {
            this.x = Math.max(this.width / 2, this.x - this.speed);
        }
        if (keys['ArrowRight'] || keys['d']) {
            this.x = Math.min(canvas.width - this.width / 2, this.x + this.speed);
        }
        this.shootCooldown = Math.max(0, this.shootCooldown - 1);
    }

    shoot() {
        if (this.shootCooldown <= 0) {
            this.shootCooldown = CONFIG.PLAYER_SHOOT_COOLDOWN;
            playSound(SOUNDS.laser);
            return {
                x: this.x,
                y: this.y - this.height / 2,
                speed: CONFIG.BULLET_SPEED,
                width: 4,
                height: 10
            };
        }
        return null;
    }

    draw(ctx, shieldActive) {
        if (IMAGES.player.complete) {
            ctx.drawImage(
                IMAGES.player,
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
        }

        // === ЩИТ ===
        if (shieldActive) {
            ctx.strokeStyle = 'rgba(0,255,255,0.6)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.width };
    }
}
