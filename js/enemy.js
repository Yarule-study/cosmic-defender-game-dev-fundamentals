class Enemy {
    constructor(x, y, type = 'basic', level = 1) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = type === 'boss' ? 60 : 30;
        this.height = type === 'boss' ? 60 : 30;

        if (type === 'boss') {
            this.speed = 0.6;
        } else if (type === 'side') {
            // Горизонтальний противник: повільний
            this.speed = CONFIG.ENEMY_BASE_SPEED * 0.3;
        } else {
            this.speed = CONFIG.ENEMY_BASE_SPEED + level * 0.2;
        }

        this.health = type === 'boss' ? CONFIG.BOSS_HEALTH : 1;
        this.maxHealth = this.health;
        this.shootCooldown = 0;

        // Для бокових ворогів
        this.dx = 0;
        this.burstCount = 0;
        this.burstRest = 0;
        this.angle = 0;

        // 🔥 ТАЙМЕР ВЕЕРНОЙ АТАКИ БОССА
        this.fanCooldown = type === 'boss' ? 180 : 0;
    }

    update() {
        if (this.type === 'side') {
            this.x += this.dx || 0;
        } else {
            this.y += this.speed;
            this.angle += 0.05;
        }

        this.shootCooldown = Math.max(0, this.shootCooldown - 1);

        if (this.burstRest > 0) {
            this.burstRest--;
        }

        if (this.fanCooldown > 0) {
            this.fanCooldown--;
        }
    }

    shoot() {
        // ---------- SIDE ----------
        if (this.type === 'side') {
            if (this.burstRest > 0 || this.shootCooldown > 0) return null;

            if (this.burstCount < 3) {
                this.burstCount++;
                this.shootCooldown = 15;
                return {
                    x: this.x,
                    y: this.y + this.height / 2,
                    speed: 2.2,
                    width: 4,
                    height: 10,
                    kind: 'alt'
                };
            }

            this.burstCount = 0;
            this.burstRest = 90;
            return null;
        }

        // ---------- BOSS ----------
        if (this.type === 'boss' && this.shootCooldown <= 0) {
            this.shootCooldown = 80;

            // 💥 ВЕЕРНАЯ АТАКА
            if (this.fanCooldown <= 0) {
                this.fanCooldown = 180;

                const bullets = [];
                const angles = [-2, -1, 0, 1, 2];

                for (const dx of angles) {
                    bullets.push({
                        x: this.x,
                        y: this.y + this.height / 2,
                        speed: 2,
                        dx: dx,
                        width: 4,
                        height: 10,
                        kind: 'normal'
                    });
                }

                return bullets;
            }

            // 🔫 ОСНОВНАЯ АТАКА БОССА
            return {
                x: this.x,
                y: this.y + this.height / 2,
                speed: 2,
                width: 4,
                height: 10,
                kind: 'normal'
            };
        }

        // ---------- BASIC ----------
        if (this.shootCooldown <= 0 && Math.random() < 0.01) {
            this.shootCooldown = 80;
            return {
                x: this.x,
                y: this.y + this.height / 2,
                speed: 2,
                width: 4,
                height: 10,
                kind: 'normal'
            };
        }

        return null;
    }

    draw(ctx) {
        let img;
        if (this.type === 'boss') {
            img = IMAGES.boss;
        } else if (this.type === 'side') {
            img = IMAGES.enemy1;
        } else {
            img = IMAGES.enemy;
        }

        if (img.complete) {
            ctx.drawImage(
                img,
                this.x - this.width / 2,
                this.y - this.height / 2,
                this.width,
                this.height
            );
        }

        // HP бар босса
        if (this.type === 'boss') {
            const barW = 50;
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - barW / 2, this.y - 40, barW, 5);
            ctx.fillStyle = '#0f0';
            ctx.fillRect(
                this.x - barW / 2,
                this.y - 40,
                barW * (this.health / this.maxHealth),
                5
            );
        }
    }

    takeDamage() {
        this.health--;
        return this.health <= 0;
    }

    isOffScreen(canvas) {
        if (this.type === 'side') {
            return this.x < -50 || this.x > canvas.width + 50;
        }
        return this.y > canvas.height + 50;
    }

    getBounds() {
        return { x: this.x, y: this.y, width: this.width };
    }
}
