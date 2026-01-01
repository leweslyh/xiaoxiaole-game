import SoundManager from '../audio/sound-manager.js';

// 音效开关状态
export let soundEnabled = true;

// 创建音效管理器实例
const soundManager = new SoundManager();

// 激活音频上下文（处理浏览器音频策略）
function activateAudioContext() {
    if (soundManager.audioContext && soundManager.audioContext.state === 'suspended') {
        soundManager.audioContext.resume();
    }
    
    // 移除事件监听器，避免重复激活
    document.removeEventListener('click', activateAudioContext);
    document.removeEventListener('touchstart', activateAudioContext);
    document.removeEventListener('keydown', activateAudioContext);
}

// 添加事件监听器，在用户第一次交互时激活音频上下文
document.addEventListener('click', activateAudioContext);
document.addEventListener('touchstart', activateAudioContext);
document.addEventListener('keydown', activateAudioContext);

// 播放音效函数
export function playSound(soundName) {
    // 确保音频上下文已激活
    activateAudioContext();
    
    if (!soundEnabled) return;
    
    switch (soundName) {
        case 'click':
            soundManager.playClick();
            break;
        case 'match':
            soundManager.playMatch();
            break;
        case 'special':
            soundManager.playSpecial();
            break;
        case 'levelUp':
            soundManager.playLevelUp();
            break;
        case 'gameOver':
            soundManager.playGameOver();
            break;
    }
}

// 设置音效开关状态
export function setSoundEnabled(enabled) {
    soundEnabled = enabled;
    soundManager.setSoundEnabled(enabled);
}

// 设置背景音乐开关状态（预留）
export function setMusicEnabled(enabled) {
    // 背景音乐功能可在此处实现
}
