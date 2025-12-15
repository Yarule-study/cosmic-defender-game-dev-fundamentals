class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.running = false;
        this.score = 0;
        this.lives = 5;
        this.shieldEnergy = 100;
        this.shieldActive = false;
        this.keys = {};

        this.player = new Player(400, 550);
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.particles = [];
        this.powerups = [];

        this.starOffset = 0;

        // Режим виживання
        this.maxEnemies = 5;
        this.basicKills = 0; // к-ть убитих простих ворогів

        // Підсилення
        this.tripleShotTimer = 0; // кадри дії тройного пострілу
        this.powerupSpawnTimer = 0; // коли 0 — можна заспавнити новий powerup

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('startBtn')
            .addEventListener('click', () => this.start());

        const restartBtn = document.getElementById('restartBtn');
        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restart());
        }

        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            if (e.key === ' ' || e.key === 'Shift') e.preventDefault();
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    start() {
        document.getElementById('menu').classList.add('hidden');
        this.canvas.classList.remove('hidden');
        document.getElementById('ui').classList.remove('hidden');
        const gameOverOverlay = document.getElementById('gameOverOverlay');
        if (gameOverOverlay) {
            gameOverOverlay.classList.add('hidden');
        }

        // 🎵 музыка
        MUSIC.currentTime = 0;
        MUSIC.play().catch(() => {});

        this.reset();
        this.fillEnemies();
        this.running = true;
        this.loop();
    }

    restart() {
        // Скрыть окно game over
        const gameOverOverlay = document.getElementById('gameOverOverlay');
        if (gameOverOverlay) {
            gameOverOverlay.classList.add('hidden');
        }

        // Запуск игры заново
        this.start();
    }

    reset() {
        this.score = 0;
        this.lives = 5;
        this.shieldEnergy = 100;
        this.player = new Player(400, 550);
        this.bullets = [];
        this.enemies = [];
        this.enemyBullets = [];
        this.particles = [];
        this.powerups = [];
        this.basicKills = 0;
        this.tripleShotTimer = 0;
        this.powerupSpawnTimer = 0;
    }

    // Заполняем поле до максимального количества врагов
    fillEnemies() {
        let sideSpawnedThisTick = this.enemies.some(e => e.type === 'side');
        while (this.enemies.length < this.maxEnemies) {
            // Випадково обираємо тип: звичайний або горизонтальний,
            // але за один кадр спавнимо не більше одного нового "side" ворога
            if (!sideSpawnedThisTick && Math.random() < 0.7) {
                this.spawnSideEnemy();
                sideSpawnedThisTick = true;
            } else {
                this.spawnBasicEnemy();
            }
        }
    }

    spawnBasicEnemy() {
        const x = Math.random() * (this.canvas.width - 50) + 25;
        const y = -50 - Math.random() * 150;
        this.enemies.push(new Enemy(x, y, 'basic', 1));
    }

    spawnSideEnemy() {
        const fromLeft = Math.random() < 0.5;
        const x = fromLeft ? -40 : this.canvas.width + 40;
        // Вище середини поля, подалі від гравця
        const y = this.canvas.height / 3 + (Math.random() * 60 - 30);
        const enemy = new Enemy(x, y, 'side', 1);
        // Горизонтальний рух строго в одну сторону
        enemy.dx = fromLeft ? 1.2 : -1.2;
        this.enemies.push(enemy);
    }

    spawnBoss() {
        // Не спавнимо другого босса, если один уже есть
        const hasBoss = this.enemies.some(e => e.type === 'boss');
        if (hasBoss) return;

        const x = this.canvas.width / 2;
        const y = -100;
        this.enemies.push(new Enemy(x, y, 'boss', 1));
    }

    update() {
        // Гравець
        this.player.update(this.keys, this.canvas);

        // Стрілянина
        if (this.keys[' ']) {
            const bullet = this.player.shoot();
            if (bullet) {
                // Звичайний постріл уперед
                this.bullets.push(bullet);

                // Підсилення: тройний постріл
                if (this.tripleShotTimer > 0) {
                    const leftBullet = {
                        ...bullet,
                        dx: -2 // летить вліво під кутом
                    };
                    const rightBullet = {
                        ...bullet,
                        dx: 2 // летить вправо під кутом
                    };
                    this.bullets.push(leftBullet, rightBullet);
                }
            }
        }

        // Щит
        if (this.keys['Shift'] && this.shieldEnergy > 0) {
            this.shieldActive = true;
            this.shieldEnergy -= CONFIG.SHIELD_DRAIN_RATE;
        } else {
            this.shieldActive = false;
            this.shieldEnergy = Math.min(
                100,
                this.shieldEnergy + CONFIG.SHIELD_RECHARGE_RATE
            );
        }

        // Кулі гравця
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            // Горизонтальний зсув (для бічних пуль під кутом)
            if (this.bullets[i].dx) {
                this.bullets[i].x += this.bullets[i].dx;
            }
            this.bullets[i].y -= this.bullets[i].speed;
            if (this.bullets[i].y < -10) {
                this.bullets.splice(i, 1);
            }
        }

        // Вороги
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.enemies[i].update();

            const bullet = this.enemies[i].shoot();
            if (bullet) {
                // Новий тип ворога може повертати чергу куль масивом
                if (Array.isArray(bullet)) {
                    this.enemyBullets.push(...bullet);
                } else {
                    this.enemyBullets.push(bullet);
                }
            }

            if (this.enemies[i].isOffScreen(this.canvas)) {
                this.enemies.splice(i, 1);
            }
        }

        // Кулі ворогів
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            if (this.enemyBullets[i].dx) {
                this.enemyBullets[i].x += this.enemyBullets[i].dx;
            }
            this.enemyBullets[i].y += this.enemyBullets[i].speed;
            if (this.enemyBullets[i].y > this.canvas.height + 10) {
                this.enemyBullets.splice(i, 1);
            }
        }

        // Power-ups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            // Повільніше падіння підсилень
            this.powerups[i].y += 1;
            if (this.powerups[i].y > this.canvas.height) {
                this.powerups.splice(i, 1);
            }
        }

        // Частинки
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].isDead()) {
                this.particles.splice(i, 1);
            }
        }

        this.checkCollisions();

        // Пополняем врагов до максимума (режим виживання)
        if (this.running) {
            this.fillEnemies();
        }

        // Таймер тройного пострілу
        if (this.tripleShotTimer > 0) {
            this.tripleShotTimer--;
        }

        // Спавн powerup'ів незалежно від ворогів
        if (this.running) {
            if (this.powerupSpawnTimer > 0) {
                this.powerupSpawnTimer--;
            } else if (this.powerups.length === 0) {
                // Інколи з'являється новий powerup
                const x = Math.random() * (this.canvas.width - 40) + 20;
                this.powerups.push({
                    x,
                    y: -20,
                    type: 'triple'
                });
                // Наступний powerup через 10–20 секунд (приблизно)
                this.powerupSpawnTimer = 600 + Math.floor(Math.random() * 600);
            }
        }

        this.starOffset += 0.5;
    }

    checkCollisions() {
        // Кулі гравця vs вороги
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                if (checkCollision(
                    this.bullets[i],
                    this.enemies[j],
                    5,
                    this.enemies[j].width / 2
                )) {
                    this.bullets.splice(i, 1);

                    // 🔊 вибух
                    playSound(SOUNDS.explosion);

                    const enemy = this.enemies[j];

                    this.particles.push(...createExplosion(
                        enemy.x,
                        enemy.y,
                        '#00ff00',
                        10
                    ));

                    if (enemy.takeDamage()) {
                        let scoreGain;
                        if (enemy.type === 'boss') {
                            scoreGain = CONFIG.SCORE_BOSS;
                        } else if (enemy.type === 'side') {
                            scoreGain = CONFIG.SCORE_SIDE_ENEMY;
                        } else {
                            scoreGain = CONFIG.SCORE_BASIC_ENEMY;
                        }

                        this.score += scoreGain;

                        // Рахуємо убитих простих ворогів (для появи босса)
                        if (enemy.type === 'basic') {
                            this.basicKills++;

                            // Після кожних 10 простих ворогів — бос
                            if (this.basicKills % 10 === 0) {
                                this.spawnBoss();
                            }

                            // Шанс випадіння лікувальної пігулки
                            if (Math.random() < CONFIG.POWERUP_CHANCE) {
                                this.powerups.push({
                                    x: enemy.x,
                                    y: enemy.y,
                                    type: 'heal'
                                });
                            }
                        }

                        this.particles.push(...createExplosion(
                            enemy.x,
                            enemy.y,
                            enemy.type === 'boss'
                                ? '#ff0000'
                                : '#00ff00',
                            20
                        ));

                        this.enemies.splice(j, 1);
                    }
                    break;
                }
            }
        }

        // Вороги vs гравець
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            if (checkCollision(
                this.enemies[i],
                this.player,
                this.enemies[i].width / 2,
                this.player.width / 2
            )) {
                if (!this.shieldActive) {
                    playSound(SOUNDS.damage);
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameOver();
                        return;
                    }
                } else {
                    this.shieldEnergy -= 20;
                }
                this.enemies.splice(i, 1);
            }
        }

        // Кулі ворогів vs гравець
        for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
            if (checkCollision(
                this.enemyBullets[i],
                this.player,
                5,
                this.player.width / 2
            )) {
                if (!this.shieldActive) {
                    playSound(SOUNDS.damage);
                    this.lives--;
                    if (this.lives <= 0) {
                        this.gameOver();
                        return;
                    }
                } else {
                    this.shieldEnergy -= 10;
                }
                this.enemyBullets.splice(i, 1);
            }
        }

        // Power-ups vs гравець
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            if (checkCollision(
                this.powerups[i],
                this.player,
                10,
                this.player.width / 2
            )) {
                const p = this.powerups[i];
                playSound(SOUNDS.powerup);

                if (p.type === 'triple') {
                    // Активуємо тройний постріл на ~3 секунди (180 кадрів)
                    this.tripleShotTimer = 180;
                } else if (p.type === 'heal') {
                    // Лікувальна пігулка: +1 життя, але не більше 5
                    this.lives = Math.min(5, this.lives + 1);
                }

                this.powerups.splice(i, 1);
            }
        }
    }

    draw() {
        // Очистка
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Зірки
        drawStars(this.ctx, this.canvas, this.starOffset);

        // Кулі гравця
        for (const bullet of this.bullets) {
            if (IMAGES.bulletPlayer.complete) {
                this.ctx.drawImage(
                    IMAGES.bulletPlayer,
                    bullet.x - 2,
                    bullet.y,
                    8,
                    16
                );
            }
        }

        // Кулі ворогів
        for (const bullet of this.enemyBullets) {
            const img =
                bullet.kind === 'alt'
                    ? IMAGES.bulletEnemy1
                    : IMAGES.bulletEnemy;

            if (img && img.complete) {
                this.ctx.drawImage(
                    img,
                    bullet.x - 2,
                    bullet.y,
                    8,
                    16
                );
            }
        }

        // Вороги
        for (const enemy of this.enemies) {
            enemy.draw(this.ctx);
        }

        // Power-ups
        for (const powerup of this.powerups) {
            const img =
                powerup.type === 'heal'
                    ? IMAGES.healing
                    : IMAGES.powerup;

            if (img && img.complete) {
                this.ctx.drawImage(
                    img,
                    powerup.x - 10,
                    powerup.y - 10,
                    20,
                    20
                );
            }
        }

        // Частинки
        for (const particle of this.particles) {
            particle.draw(this.ctx);
        }

        // Гравець
        this.player.draw(this.ctx, this.shieldActive);
    }

    updateUI() {
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('score').textContent = this.score;
        document.getElementById('shield').textContent =
            Math.floor(this.shieldEnergy);
    }

    gameOver() {
        this.running = false;

        // 🔊 звук game over
        playSound(SOUNDS.gameover);
        MUSIC.pause();

        const gameOverOverlay = document.getElementById('gameOverOverlay');
        const scoreEl = document.getElementById('gameOverScore');
        const levelEl = document.getElementById('gameOverLevel');

        if (scoreEl) {
            scoreEl.textContent = `Фінальний рахунок: ${this.score}`;
        }
        if (levelEl) {
            levelEl.textContent = `Досягнуто рівень: ${this.level}`;
        }
        if (gameOverOverlay) {
            gameOverOverlay.classList.remove('hidden');
        }
    }

    loop() {
        if (!this.running) return;

        this.update();
        this.draw();
        this.updateUI();

        requestAnimationFrame(() => this.loop());
    }
}

// Ініціалізація гри
const game = new Game();
