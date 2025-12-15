// Система завантаження ресурсів

class AssetLoader {
    constructor() {
        this.images = {};
        this.sounds = {};
        this.music = null;
        this.loaded = false;
        this.musicEnabled = true;
        this.musicReady = false;
    }
    
    async loadAll() {
        await this.loadImages();
        this.loadSounds();
        await this.loadMusic(); // Змінили на async
        this.loaded = true;
    }
    
    async loadImages() {
        const imageFiles = {
            player: 'assets/images/player.png',
            enemy: 'assets/images/enemy.png',
            enemy1: 'assets/images/enemy1.png',
            boss: 'assets/images/boss.png',
            bulletPlayer: 'assets/images/bullet_player.png',
            bulletEnemy: 'assets/images/bullet_enemy.png',
            bulletEnemy1: 'assets/images/bullet_enemy1.png',
            powerup: 'assets/images/powerup.png',
            healing: 'assets/images/healing.png'
        };
        
        const promises = [];
        
        for (const [key, src] of Object.entries(imageFiles)) {
            promises.push(
                new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        this.images[key] = img;
                        console.log(`✅ Завантажено зображення: ${key}`);
                        resolve();
                    };
                    img.onerror = () => {
                        console.warn(`⚠️ Не вдалося завантажити зображення: ${src}`);
                        this.images[key] = null;
                        resolve();
                    };
                    img.src = src;
                })
            );
        }
        
        await Promise.all(promises);
        console.log('🎨 Всі зображення завантажені');
    }
    
    loadSounds() {
        const soundFiles = {
            laser: 'assets/sounds/laser.wav',
            explosion: 'assets/sounds/explosion.wav',
            powerup: 'assets/sounds/powerup.wav',
            gameover: 'assets/sounds/gameover.wav',
            levelup: 'assets/sounds/levelup.wav'
        };
        
        for (const [key, src] of Object.entries(soundFiles)) {
            try {
                const audio = new Audio();
                audio.src = src;
                audio.volume = 0.3;
                audio.preload = 'auto';
                this.sounds[key] = audio;
            } catch (e) {
                console.warn(`⚠️ Помилка завантаження звуку ${src}:`, e);
                this.sounds[key] = null;
            }
        }
        
        console.log('🔊 Звуки завантажені');
    }
    
    async loadMusic() {
        return new Promise((resolve) => {
            try {
                this.music = new Audio();
                this.music.src = 'assets/music/background.mp3';
                this.music.loop = true;
                this.music.volume = 0.2;
                this.music.preload = 'auto';
                
                this.music.addEventListener('canplaythrough', () => {
                    this.musicReady = true;
                    console.log('🎵 Музика готова до відтворення!');
                    resolve();
                }, { once: true });
                
                this.music.addEventListener('error', (e) => {
                    console.error('❌ Помилка завантаження музики:', e);
                    console.error('Перевірте чи існує файл: assets/music/background.mp3');
                    this.music = null;
                    this.musicReady = false;
                    resolve();
                });
                
                // Спробуємо завантажити
                this.music.load();
                
                // Таймаут на випадок проблем
                setTimeout(() => {
                    if (!this.musicReady) {
                        console.warn('⚠️ Музика не завантажилась за 5 секунд');
                    }
                    resolve();
                }, 5000);
                
            } catch (e) {
                console.error('❌ Критична помилка при створенні музики:', e);
                this.music = null;
                this.musicReady = false;
                resolve();
            }
        });
    }
    
    playSound(name) {
        if (this.sounds[name]) {
            try {
                const sound = this.sounds[name].cloneNode();
                sound.volume = 0.3;
                sound.play().catch(e => {
                    // Ігноруємо помилки автоплею
                });
            } catch (e) {
                // Тихо ігноруємо
            }
        }
    }
    
    playMusic() {
        if (!this.music) {
            console.warn('⚠️ Музика не завантажена. Перевірте файл: assets/music/background.mp3');
            return;
        }
        
        if (!this.musicReady) {
            console.warn('⚠️ Музика ще не готова до відтворення');
            return;
        }
        
        if (!this.musicEnabled) {
            console.log('🔇 Музика вимкнена');
            return;
        }
        
        this.music.currentTime = 0;
        
        const playPromise = this.music.play();
        
        if (playPromise !== undefined) {
            playPromise
                .then(() => {
                    console.log('🎵 Музика почала грати!');
                })
                .catch(error => {
                    console.warn('⚠️ Автоплей заблоковано браузером:', error.message);
                    console.log('💡 Натисніть будь-яку клавішу в грі для запуску музики');
                    
                    // Спробуємо запустити після взаємодії
                    const tryPlayAgain = () => {
                        this.music.play()
                            .then(() => {
                                console.log('🎵 Музика запущена після взаємодії!');
                                document.removeEventListener('keydown', tryPlayAgain);
                                document.removeEventListener('click', tryPlayAgain);
                            })
                            .catch(() => {});
                    };
                    
                    document.addEventListener('keydown', tryPlayAgain);
                    document.addEventListener('click', tryPlayAgain);
                });
        }
    }
    
    stopMusic() {
        if (this.music) {
            this.music.pause();
            this.music.currentTime = 0;
            console.log('🎵 Музика зупинена');
        }
    }
    
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        if (this.musicEnabled && this.musicReady) {
            this.playMusic();
        } else {
            this.stopMusic();
        }
        return this.musicEnabled;
    }
}

// Глобальний екземпляр
const assets = new AssetLoader();