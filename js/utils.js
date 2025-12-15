// ====== CONFIG БЕЗ ИЗМЕНЕНИЙ ======
const CONFIG = {
    PLAYER_SPEED: 3,
    PLAYER_SHOOT_COOLDOWN: 25,
    BULLET_SPEED: 4,
    ENEMY_BASE_SPEED: 1,
    BOSS_HEALTH: 10,
    SHIELD_DRAIN_RATE: 0.25,
    SHIELD_RECHARGE_RATE: 0.05,
    POWERUP_CHANCE: 0.2,
    SCORE_BASIC_ENEMY: 10,
    SCORE_SIDE_ENEMY: 30,
    SCORE_BOSS: 100
};

// ====== IMAGES ======
const IMAGES = {
    player: new Image(),
    enemy: new Image(),
    enemy1: new Image(),
    boss: new Image(),
    bulletPlayer: new Image(),
    bulletEnemy: new Image(),
    bulletEnemy1: new Image(),
    powerup: new Image(),
    healing: new Image()
};

IMAGES.player.src = 'assets/images/player.png';
IMAGES.enemy.src = 'assets/images/enemy.png';
IMAGES.enemy1.src = 'assets/images/enemy1.png';
IMAGES.boss.src = 'assets/images/boss.png';
IMAGES.bulletPlayer.src = 'assets/images/bullet_player.png';
IMAGES.bulletEnemy.src = 'assets/images/bullet_enemy.png';
IMAGES.bulletEnemy1.src = 'assets/images/bullet_enemy1.png';
IMAGES.powerup.src = 'assets/images/powerup.png';
IMAGES.healing.src = 'assets/images/healing.png';

// ====== SOUNDS ======
const SOUNDS = {
    laser: new Audio('assets/sounds/laser.wav'),
    explosion: new Audio('assets/sounds/explosion.wav'),
    powerup: new Audio('assets/sounds/powerup.wav'),
    gameover: new Audio('assets/sounds/gameover.wav'),
    levelup: new Audio('assets/sounds/levelup.wav'),
    damage: new Audio('assets/sounds/damage.wav')
};

Object.values(SOUNDS).forEach(s => s.volume = 0.4);

function playSound(sound) {
    if (!sound) return;
    sound.currentTime = 0;
    sound.play().catch(() => {});
}

// ====== MUSIC ======
const MUSIC = new Audio('assets/music/background.mp3');
MUSIC.loop = true;
MUSIC.volume = 0.3;

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = (Math.random() - 0.5) * 4;
        this.life = 30;
        this.color = color;
        this.size = Math.random() * 4 + 2;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        this.vy += 0.1; // Гравітація
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.life / 30;
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.globalAlpha = 1;
    }
    
    isDead() {
        return this.life <= 0;
    }
}

function createExplosion(x, y, color, count = 15) {
    const particles = [];
    for (let i = 0; i < count; i++) {
        particles.push(new Particle(x, y, color));
    }
    return particles;
}

function checkCollision(obj1, obj2, radius1, radius2) {
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < radius1 + radius2;
}

// ====== STARS BACKGROUND ======
let STARS = null;

function initStars(canvas) {
    const count = 120;
    STARS = [];
    for (let i = 0; i < count; i++) {
        STARS.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: 0.5 + Math.random() * 2,
            speed: 0.3 + Math.random() * 1.2
        });
    }
}

function drawStars(ctx, canvas, offset) {
    if (!STARS) {
        initStars(canvas);
    }

    ctx.fillStyle = '#ffffff';
    for (const star of STARS) {
        let y = star.y + offset * star.speed;
        // зацикливаем движение по вертикали
        y = y % canvas.height;
        ctx.fillRect(star.x, y, star.size, star.size);
    }
}