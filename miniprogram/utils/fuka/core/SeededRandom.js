/**
 * 伪随机数生成器
 */
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }

    random() {
        const x = Math.sin(this.seed++) * 10000;
        return x - Math.floor(x);
    }

    getRandomInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }
}

module.exports = SeededRandom;
