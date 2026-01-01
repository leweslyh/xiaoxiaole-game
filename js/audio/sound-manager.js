// Web Audio API 音效系统
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.soundEnabled = true;
        this.initAudioContext();
    }
    
    // 初始化音频上下文
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API 不受支持');
        }
    }
    
    // 设置音效开关
    setSoundEnabled(enabled) {
        this.soundEnabled = enabled;
    }
    
    // 播放简单音调
    playTone(frequency, duration, volume = 0.1, type = 'sine') {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    // 播放点击音效
    playClick() {
        this.playTone(800, 0.1, 0.1, 'square');
    }
    
    // 播放匹配音效
    playMatch() {
        // 连续播放两个音调，形成匹配音效
        this.playTone(440, 0.15, 0.15, 'sine');
        setTimeout(() => {
            this.playTone(523, 0.15, 0.15, 'sine');
        }, 150);
    }
    
    // 播放特殊方块音效
    playSpecial() {
        // 播放多个音调，形成特殊效果
        this.playTone(600, 0.1, 0.2, 'sawtooth');
        setTimeout(() => {
            this.playTone(800, 0.1, 0.2, 'sawtooth');
        }, 100);
        setTimeout(() => {
            this.playTone(1000, 0.15, 0.2, 'sawtooth');
        }, 200);
    }
    
    // 播放升级音效
    playLevelUp() {
        // 上升音阶，形成升级效果
        this.playTone(440, 0.15, 0.2, 'sine');
        setTimeout(() => {
            this.playTone(523, 0.15, 0.2, 'sine');
        }, 150);
        setTimeout(() => {
            this.playTone(659, 0.15, 0.2, 'sine');
        }, 300);
        setTimeout(() => {
            this.playTone(880, 0.25, 0.3, 'sine');
        }, 450);
    }
    
    // 播放游戏结束音效
    playGameOver() {
        // 下降音阶，形成游戏结束效果
        this.playTone(659, 0.2, 0.2, 'triangle');
        setTimeout(() => {
            this.playTone(523, 0.2, 0.2, 'triangle');
        }, 200);
        setTimeout(() => {
            this.playTone(440, 0.2, 0.2, 'triangle');
        }, 400);
        setTimeout(() => {
            this.playTone(330, 0.3, 0.2, 'triangle');
        }, 600);
    }
}

// 导出音效管理器
export default SoundManager;