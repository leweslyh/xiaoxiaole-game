import { GAME_MODES } from '../game/game-constants.js';
import { setSoundEnabled, setMusicEnabled } from '../utils/sound.js';

class UIManager {
    constructor() {
        // DOM元素引用
        this.mainMenu = null;
        this.settingsMenu = null;
        this.helpMenu = null;
        this.gameContainer = null;
        this.gameOverElement = null;
        this.levelUpElement = null;
        
        // 按钮元素引用
        this.classicModeBtn = null;
        this.timeModeBtn = null;
        this.endlessModeBtn = null;
        this.puzzleModeBtn = null;
        this.chainStormModeBtn = null;
        this.specialChallengeModeBtn = null;
        this.gravityFlipModeBtn = null;
        this.helpBtn = null;
        this.backFromHelpBtn = null;
        this.settingsBtn = null;
        this.backToMenuBtn = null;
        this.backBtn = null;
        this.restartBtn = null;
        this.hintBtn = null;
        this.playAgainBtn = null;
        this.backToMenuGameOverBtn = null;
        this.continueBtn = null;
        
        // 设置元素引用
        this.soundToggle = null;
        this.musicToggle = null;
        
        // 帮助菜单元素引用
        this.helpTabs = null;
        this.helpPanels = null;
        
        // 游戏管理器引用
        this.gameManager = null;
    }
    
    // 初始化UI管理器
    init(gameManager) {
        this.gameManager = gameManager;
        this.initDOMElements();
        this.bindEvents();
    }
    
    // 初始化DOM元素引用
    initDOMElements() {
        // 游戏界面元素
        this.mainMenu = document.getElementById('main-menu');
        this.settingsMenu = document.getElementById('settings');
        this.helpMenu = document.getElementById('help-menu');
        this.gameContainer = document.getElementById('game-container');
        this.gameOverElement = document.getElementById('game-over');
        this.levelUpElement = document.getElementById('level-up');
        
        // 按钮元素
        this.classicModeBtn = document.getElementById('classic-mode');
        this.timeModeBtn = document.getElementById('time-mode');
        this.endlessModeBtn = document.getElementById('endless-mode');
        this.puzzleModeBtn = document.getElementById('puzzle-mode');
        this.chainStormModeBtn = document.getElementById('chain-storm-mode');
        this.specialChallengeModeBtn = document.getElementById('special-challenge-mode');
        this.gravityFlipModeBtn = document.getElementById('gravity-flip-mode');
        this.helpBtn = document.getElementById('help-btn');
        this.backFromHelpBtn = document.getElementById('back-from-help');
        this.settingsBtn = document.getElementById('settings-btn');
        this.backToMenuBtn = document.getElementById('back-to-menu');
        this.backBtn = document.getElementById('back-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.hintBtn = document.getElementById('hint-btn');
        this.playAgainBtn = document.getElementById('play-again');
        this.backToMenuGameOverBtn = document.getElementById('back-to-menu-btn');
        this.continueBtn = document.getElementById('continue');
        
        // 设置元素
        this.soundToggle = document.getElementById('sound-toggle');
        this.musicToggle = document.getElementById('music-toggle');
        this.difficultySelector = document.getElementById('difficulty');
        
        // 帮助菜单元素
        this.helpTabs = document.querySelectorAll('.help-tab');
        this.helpPanels = document.querySelectorAll('.help-panel');
        
        // 当前选择的难度
        this.currentDifficulty = this.difficultySelector ? this.difficultySelector.value : 'normal';
    }
    
    // 绑定事件监听器
    bindEvents() {
        // 添加事件监听的辅助函数
        const addEventListeners = (element, callback) => {
            element.addEventListener('click', callback);
            element.addEventListener('touchstart', (e) => {
                e.preventDefault();
                callback(e);
            });
        };
        
        // 主菜单按钮事件
        addEventListeners(this.classicModeBtn, () => this.startGame(GAME_MODES.CLASSIC));
        addEventListeners(this.timeModeBtn, () => this.startGame(GAME_MODES.TIME));
        addEventListeners(this.endlessModeBtn, () => this.startGame(GAME_MODES.ENDLESS));
        addEventListeners(this.puzzleModeBtn, () => this.startGame(GAME_MODES.PUZZLE));
        addEventListeners(this.chainStormModeBtn, () => this.startGame(GAME_MODES.CHAIN_STORM));
        addEventListeners(this.specialChallengeModeBtn, () => this.startGame(GAME_MODES.SPECIAL_CHALLENGE));
        addEventListeners(this.gravityFlipModeBtn, () => this.startGame(GAME_MODES.GRAVITY_FLIP));
        addEventListeners(this.helpBtn, () => {
            this.mainMenu.classList.add('hidden');
            this.helpMenu.classList.remove('hidden');
        });
        addEventListeners(this.settingsBtn, () => {
            this.mainMenu.classList.add('hidden');
            this.settingsMenu.classList.remove('hidden');
        });
        
        // 帮助菜单按钮事件
        addEventListeners(this.backFromHelpBtn, () => {
            this.helpMenu.classList.add('hidden');
            this.mainMenu.classList.remove('hidden');
        });
        
        // 帮助标签切换事件
        this.helpTabs.forEach(tab => {
            addEventListeners(tab, () => {
                this.switchHelpTab(tab);
            });
        });
        
        // 设置菜单按钮事件
        addEventListeners(this.backToMenuBtn, () => {
            this.settingsMenu.classList.add('hidden');
            this.mainMenu.classList.remove('hidden');
        });
        
        // 游戏内按钮事件
        addEventListeners(this.restartBtn, () => this.gameManager.initGame());
        addEventListeners(this.hintBtn, () => this.gameManager.getHint());
        addEventListeners(this.backBtn, () => this.backToMainMenu());
        
        // 游戏结束界面事件
        addEventListeners(this.playAgainBtn, () => this.gameManager.initGame());
        addEventListeners(this.backToMenuGameOverBtn, () => this.backToMainMenu());
        
        // 关卡升级界面事件
        addEventListeners(this.continueBtn, () => {
            this.levelUpElement.classList.add('hidden');
            this.gameManager.renderBoard();
            this.gameManager.updateStats();
        });
        
        // 设置切换事件
        this.soundToggle.addEventListener('change', (e) => {
            setSoundEnabled(e.target.checked);
        });
        
        this.musicToggle.addEventListener('change', (e) => {
            setMusicEnabled(e.target.checked);
        });
        
        // 难度选择事件
        if (this.difficultySelector) {
            this.difficultySelector.addEventListener('change', (e) => {
                this.currentDifficulty = e.target.value;
            });
        }
    }
    
    // 切换帮助标签
    switchHelpTab(activeTab) {
        // 移除所有标签的active类
        this.helpTabs.forEach(tab => tab.classList.remove('active'));
        // 添加当前标签的active类
        activeTab.classList.add('active');
        
        // 获取目标面板ID
        const targetTab = activeTab.dataset.tab;
        
        // 隐藏所有面板
        this.helpPanels.forEach(panel => panel.classList.remove('active'));
        // 显示目标面板
        const targetPanel = document.getElementById(targetTab);
        targetPanel.classList.add('active');
    }
    
    // 开始游戏
    startGame(mode) {
        this.mainMenu.classList.add('hidden');
        this.gameContainer.classList.remove('hidden');
        this.gameManager.initGame(mode, this.currentDifficulty);
    }
    
    // 返回主菜单
    backToMainMenu() {
        // 停止游戏计时器
        this.gameManager.stopTimer();
        
        // 隐藏所有其他界面，显示主菜单
        this.gameContainer.classList.add('hidden');
        this.settingsMenu.classList.add('hidden');
        this.helpMenu.classList.add('hidden');
        this.gameOverElement.classList.add('hidden');
        this.levelUpElement.classList.add('hidden');
        this.mainMenu.classList.remove('hidden');
    }
    
    // 显示游戏结束界面
    showGameOver() {
        this.gameOverElement.classList.remove('hidden');
    }
    
    // 显示关卡升级界面
    showLevelUp() {
        this.levelUpElement.classList.remove('hidden');
    }
    
    // 隐藏所有菜单
    hideAllMenus() {
        this.mainMenu.classList.add('hidden');
        this.settingsMenu.classList.add('hidden');
        this.helpMenu.classList.add('hidden');
    }
    
    // 显示主菜单
    showMainMenu() {
        this.hideAllMenus();
        this.mainMenu.classList.remove('hidden');
    }
}

// 导出UI管理器
export default UIManager;