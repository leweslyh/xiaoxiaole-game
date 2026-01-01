import GameManager from './game/game-manager.js';
import UIManager from './ui/ui-manager.js';

// 游戏应用类
class GameApp {
    constructor() {
        this.gameManager = new GameManager();
        this.uiManager = new UIManager();
    }
    
    // 初始化游戏应用
    init() {
        // 初始化游戏管理器的DOM元素
        const domElements = {
            boardElement: document.getElementById('board'),
            scoreElement: document.getElementById('score'),
            levelElement: document.getElementById('level'),
            targetScoreElement: document.getElementById('target-score'),
            movesElement: document.getElementById('moves'),
            timeElement: document.getElementById('time'),
            movesStat: document.getElementById('moves-stat'),
            timeStat: document.getElementById('time-stat')
        };
        
        // 初始化游戏管理器
        this.gameManager.init(domElements);
        
        // 初始化UI管理器
        this.uiManager.init(this.gameManager);
        
        // 显示主菜单
        this.uiManager.showMainMenu();
        
        console.log('消消乐游戏已初始化完成！');
    }
}

// 当DOM加载完成后初始化游戏
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const gameApp = new GameApp();
        gameApp.init();
    });
} else {
    const gameApp = new GameApp();
    gameApp.init();
}