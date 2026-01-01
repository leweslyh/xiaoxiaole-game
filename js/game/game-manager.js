import { BOARD_SIZE, COLORS, EMPTY, GAME_MODES, SPECIAL_NONE, SPECIAL_ROW, SPECIAL_COL, SPECIAL_BOMB, SPECIAL_RAINBOW, BLOCK_STATES, POWER_UPS, COMBO_MILESTONES, DIFFICULTY } from './game-constants.js';
import { playSound } from '../utils/sound.js';

class GameManager {
    constructor() {
        this.board = [];
        this.selectedCell = null;
        this.score = 0;
        this.level = 1;
        this.moves = 30;
        this.targetScore = 1000;
        this.gameMode = GAME_MODES.CLASSIC;
        this.difficulty = DIFFICULTY.NORMAL;
        this.timeLeft = 60;
        this.timer = null;
        this.combo = 0;
        this.maxCombo = 0;
        this.currentMilestone = 0;
        
        // 解谜模式相关
        this.puzzleLevels = this.generatePuzzleLevels();
        this.puzzleTarget = null; // 解谜模式的目标
        
        // 重力反转模式相关
        this.gravityDirection = 'down'; // 初始重力方向
        this.gravityTimer = null; // 重力方向切换计时器
        
        // 道具系统
        this.powerUps = {
            [POWER_UPS.REARRANGE]: 3,
            [POWER_UPS.HINT_BOOST]: 2,
            [POWER_UPS.SPECIAL_GENERATOR]: 1,
            [POWER_UPS.TIME_FREEZE]: 1
        };
        
        // DOM元素引用（在初始化时设置）
        this.boardElement = null;
        this.scoreElement = null;
        this.levelElement = null;
        this.targetScoreElement = null;
        this.movesElement = null;
        this.timeElement = null;
        this.movesStat = null;
        this.timeStat = null;
        
        // 游戏状态管理 - 使用状态机
        this.gameStates = {
            IDLE: 'idle',          // 空闲状态
            PLAYING: 'playing',     // 游戏进行中
            PAUSED: 'paused',       // 游戏暂停
            ANIMATING: 'animating', // 动画播放中
            LEVEL_UP: 'levelUp',    // 升级中
            GAME_OVER: 'gameOver'   // 游戏结束
        };
        
        this.currentState = this.gameStates.IDLE;
    }
    
    // 状态转换方法
    setState(newState) {
        const oldState = this.currentState;
        this.currentState = newState;
        console.log(`游戏状态转换: ${oldState} -> ${newState}`);
        this.onStateChange(newState);
    }
    
    // 状态变化回调
    onStateChange(newState) {
        switch (newState) {
            case this.gameStates.PLAYING:
                // 游戏开始
                break;
            case this.gameStates.PAUSED:
                // 游戏暂停
                this.stopTimer();
                break;
            case this.gameStates.ANIMATING:
                // 动画开始
                break;
            case this.gameStates.LEVEL_UP:
                // 升级开始
                this.stopTimer();
                break;
            case this.gameStates.GAME_OVER:
                // 游戏结束
                this.stopTimer();
                break;
            case this.gameStates.IDLE:
                // 空闲状态
                this.stopTimer();
                break;
        }
    }
    
    // 初始化游戏管理器
    init(domElements) {
        this.boardElement = domElements.boardElement;
        this.scoreElement = domElements.scoreElement;
        this.levelElement = domElements.levelElement;
        this.targetScoreElement = domElements.targetScoreElement;
        this.movesElement = domElements.movesElement;
        this.timeElement = domElements.timeElement;
        this.movesStat = domElements.movesStat;
        this.timeStat = domElements.timeStat;
    }
    
    // 初始化游戏
    initGame(mode = GAME_MODES.CLASSIC, difficulty = DIFFICULTY.NORMAL) {
        this.selectedCell = null;
        this.gameMode = mode;
        this.difficulty = difficulty;
        
        // 设置游戏状态为空闲
        this.setState(this.gameStates.IDLE);
        
        // 根据游戏模式和难度初始化参数
        this.score = 0;
        this.level = 1;
        this.combo = 0;
        this.maxCombo = 0;
        this.currentMilestone = 0;
        
        // 重置道具
        this.powerUps = {
            [POWER_UPS.REARRANGE]: 3,
            [POWER_UPS.HINT_BOOST]: 2,
            [POWER_UPS.SPECIAL_GENERATOR]: 1,
            [POWER_UPS.TIME_FREEZE]: 1
        };
        
        // 基础参数
        let baseMoves = 30;
        let baseTargetScore = 1000;
        let baseTime = 60;
        
        // 根据难度调整参数
        switch (difficulty) {
            case DIFFICULTY.EASY:
                baseMoves = 40;
                baseTargetScore = 800;
                baseTime = 70;
                break;
            case DIFFICULTY.NORMAL:
                baseMoves = 30;
                baseTargetScore = 1000;
                baseTime = 60;
                break;
            case DIFFICULTY.HARD:
                baseMoves = 20;
                baseTargetScore = 1200;
                baseTime = 50;
                break;
        }
        
        switch (mode) {
            case GAME_MODES.CLASSIC:
                this.moves = baseMoves;
                this.targetScore = baseTargetScore;
                this.timeLeft = baseTime;
                break;
            
            case GAME_MODES.TIME:
                this.moves = Infinity;
                this.targetScore = baseTargetScore;
                this.timeLeft = baseTime;
                break;
            
            case GAME_MODES.ENDLESS:
                this.moves = Infinity;
                this.targetScore = baseTargetScore;
                this.timeLeft = baseTime;
                break;
                
            case GAME_MODES.PUZZLE:
                // 解谜模式：使用关卡数据
                const levelData = this.puzzleLevels.find(level => level.level === this.level) || this.puzzleLevels[0];
                this.moves = levelData.moves;
                this.puzzleTarget = levelData.target;
                this.targetScore = levelData.target.type === 'score' ? levelData.target.value : 0;
                this.timeLeft = Infinity; // 解谜模式无时间限制
                break;
                
            case GAME_MODES.CHAIN_STORM:
                // 连锁风暴模式
                this.moves = Infinity;
                this.targetScore = 0; // 无固定目标，追求高分
                this.timeLeft = 60; // 基础时间60秒
                break;
                
            case GAME_MODES.SPECIAL_CHALLENGE:
                // 特殊方块挑战模式
                this.moves = 20; // 固定步数
                this.targetScore = 2000; // 目标分数
                this.timeLeft = Infinity; // 无时间限制
                break;
                
            case GAME_MODES.GRAVITY_FLIP:
                // 重力反转模式
                this.moves = Infinity;
                this.targetScore = 0; // 无固定目标，追求高分
                this.timeLeft = 120; // 基础时间120秒
                break;
        }
        
        this.updateStats();
        this.createBoard();
        this.renderBoard();
        
        // 确保没有初始匹配
        while (this.hasMatches()) {
            this.createBoard();
        }
        
        // 显示/隐藏相应的统计信息
        if (mode === GAME_MODES.TIME || mode === GAME_MODES.CHAIN_STORM || mode === GAME_MODES.GRAVITY_FLIP) {
            this.movesStat.classList.add('hidden');
            this.timeStat.classList.remove('hidden');
        } else {
            this.movesStat.classList.remove('hidden');
            this.timeStat.classList.add('hidden');
        }
        
        // 更新道具UI
        this.updatePowerUIs();
        
        // 绑定道具事件
        this.bindPowerUpEvents();
        
        // 设置游戏状态为播放中
        this.setState(this.gameStates.PLAYING);
        
        // 如果是限时模式，开始计时
        if (mode === GAME_MODES.TIME || mode === GAME_MODES.CHAIN_STORM || mode === GAME_MODES.GRAVITY_FLIP) {
            this.startTimer();
        }
        
        // 重力反转模式：启动重力方向切换计时器
        if (mode === GAME_MODES.GRAVITY_FLIP) {
            this.startGravityTimer();
        } else {
            // 其他模式：清除重力计时器
            this.clearGravityTimer();
        }
    }
    
    // 生成解谜模式关卡
    generatePuzzleLevels() {
        return [
            {
                level: 1,
                layout: [
                    [0, 1, 2, 3, 4, 5, 6, 0],
                    [1, 2, 3, 4, 5, 6, 0, 1],
                    [2, 3, 4, 5, 6, 0, 1, 2],
                    [3, 4, 5, 6, 0, 1, 2, 3],
                    [4, 5, 6, 0, 1, 2, 3, 4],
                    [5, 6, 0, 1, 2, 3, 4, 5],
                    [6, 0, 1, 2, 3, 4, 5, 6],
                    [0, 1, 2, 3, 4, 5, 6, 0]
                ],
                moves: 5,
                target: { type: 'score', value: 500 }
            },
            {
                level: 2,
                layout: [
                    [0, 0, 1, 1, 2, 2, 3, 3],
                    [0, 0, 1, 1, 2, 2, 3, 3],
                    [4, 4, 5, 5, 6, 6, 0, 0],
                    [4, 4, 5, 5, 6, 6, 0, 0],
                    [1, 1, 2, 2, 3, 3, 4, 4],
                    [1, 1, 2, 2, 3, 3, 4, 4],
                    [5, 5, 6, 6, 0, 0, 1, 1],
                    [5, 5, 6, 6, 0, 0, 1, 1]
                ],
                moves: 3,
                target: { type: 'clearSpecial', value: BLOCK_STATES.LOCKED }
            }
        ];
    }
    
    // 创建棋盘
    createBoard() {
        if (this.gameMode === GAME_MODES.PUZZLE) {
            // 解谜模式使用预定义布局
            const levelData = this.puzzleLevels.find(level => level.level === this.level) || this.puzzleLevels[0];
            this.board = [];
            
            for (let row = 0; row < BOARD_SIZE; row++) {
                this.board[row] = [];
                for (let col = 0; col < BOARD_SIZE; col++) {
                    const color = levelData.layout[row][col];
                    let state = BLOCK_STATES.NORMAL;
                    let special = SPECIAL_NONE;
                    
                    // 为特定位置添加特殊状态（示例）
                    if ((row === 3 || row === 4) && (col === 3 || col === 4)) {
                        state = BLOCK_STATES.LOCKED;
                    }
                    
                    this.board[row][col] = {
                        color: color,
                        special: special,
                        state: state,
                        frozenLayers: state === BLOCK_STATES.FROZEN ? 2 : 0,
                        locked: state === BLOCK_STATES.LOCKED
                    };
                }
            }
        } else {
            // 普通模式随机生成
            this.board = [];
            
            for (let row = 0; row < BOARD_SIZE; row++) {
                this.board[row] = [];
                for (let col = 0; col < BOARD_SIZE; col++) {
                    // 确保生成的方块不会与左侧或上侧两个方块形成连续三个
                    let availableColors = [...Array(COLORS).keys()];
                    
                    // 检查左侧两个方块
                    if (col >= 2) {
                        const leftColor1 = this.board[row][col - 1].color;
                        const leftColor2 = this.board[row][col - 2].color;
                        if (leftColor1 === leftColor2) {
                            availableColors = availableColors.filter(color => color !== leftColor1);
                        }
                    }
                    
                    // 检查上侧两个方块
                    if (row >= 2) {
                        const topColor1 = this.board[row - 1][col].color;
                        const topColor2 = this.board[row - 2][col].color;
                        if (topColor1 === topColor2) {
                            availableColors = availableColors.filter(color => color !== topColor1);
                        }
                    }
                    
                    // 随机选择可用颜色
                    const color = availableColors[Math.floor(Math.random() * availableColors.length)];
                    
                    // 随机生成特殊状态（根据难度调整概率）
                    let state = BLOCK_STATES.NORMAL;
                    let special = SPECIAL_NONE;
                    
                    // 特殊方块挑战模式：大幅增加特殊方块生成概率
                    let specialChance, stateChance;
                    if (this.gameMode === GAME_MODES.SPECIAL_CHALLENGE) {
                        specialChance = 0.5; // 50%概率生成特殊方块
                        stateChance = 0.1; // 10%概率生成特殊状态
                    } else {
                        // 其他模式的正常概率
                        specialChance = this.level * 0.02 + (this.difficulty === DIFFICULTY.HARD ? 0.03 : this.difficulty === DIFFICULTY.EASY ? -0.01 : 0);
                        stateChance = this.level * 0.01 + (this.difficulty === DIFFICULTY.HARD ? 0.02 : this.difficulty === DIFFICULTY.EASY ? -0.005 : 0);
                    }
                    
                    if (Math.random() < specialChance) {
                        // 随机生成特殊方块
                        const specialTypes = [SPECIAL_ROW, SPECIAL_COL, SPECIAL_BOMB];
                        special = specialTypes[Math.floor(Math.random() * specialTypes.length)];
                    } else if (Math.random() < stateChance) {
                        // 随机生成特殊状态
                        const stateTypes = [BLOCK_STATES.LOCKED, BLOCK_STATES.FROZEN];
                        state = stateTypes[Math.floor(Math.random() * stateTypes.length)];
                    }
                    
                    this.board[row][col] = {
                        color: color,
                        special: special,
                        state: state,
                        frozenLayers: state === BLOCK_STATES.FROZEN ? 2 : 0,
                        locked: state === BLOCK_STATES.LOCKED
                    };
                }
            }
        }
    }
    
    // 渲染棋盘
    renderBoard() {
        // 遍历所有方块，实现增量渲染
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                const block = this.board[row][col];
                
                // 尝试获取已存在的方块元素
                let cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                
                if (!cell) {
                    // 如果方块不存在，创建新元素
                    cell = document.createElement('div');
                    cell.dataset.row = row;
                    cell.dataset.col = col;
                    
                    // 添加点击事件支持
                    cell.addEventListener('click', () => this.selectCell(row, col));
                    
                    // 添加触摸事件支持
                    cell.addEventListener('touchstart', (e) => {
                        e.preventDefault(); // 防止浏览器默认行为
                        this.selectCell(row, col);
                    });
                    
                    // 添加到棋盘
                    this.boardElement.appendChild(cell);
                }
                
                // 更新方块内容和样式
                this.updateCell(cell, block);
            }
        }
    }
    
    // 更新单个方块的内容和样式
    updateCell(cell, block) {
        // 重置类名，只保留必要的类
        cell.className = `cell`;
        
        // 添加基本颜色类
        cell.classList.add(`color-${block.color}`);
        
        // 清空内容
        cell.innerHTML = '';
        
        // 添加特殊方块类型
        if (block.special === SPECIAL_ROW) {
            cell.classList.add('special-row');
            cell.textContent = '↔️';
        } else if (block.special === SPECIAL_COL) {
            cell.classList.add('special-col');
            cell.textContent = '↕️';
        } else if (block.special === SPECIAL_BOMB) {
            cell.classList.add('special-bomb');
            cell.innerHTML = '<span>💣</span>';
        } else if (block.special === SPECIAL_RAINBOW) {
            cell.classList.add('special-rainbow');
            cell.textContent = '🌈';
        } else {
            // 使用不同的 emoji 表示不同颜色
            const emojis = ['🍎', '🍊', '🍋', '🍇', '🍓', '🍑', '🥝'];
            cell.textContent = emojis[block.color];
        }
        
        // 添加方块状态
        if (block.state === BLOCK_STATES.LOCKED) {
            cell.classList.add('locked');
            cell.innerHTML += '<span class="lock-icon">🔒</span>';
        } else if (block.state === BLOCK_STATES.FROZEN) {
            cell.classList.add('frozen');
            cell.innerHTML += `<span class="frozen-layers">${'❄️'.repeat(block.frozenLayers)}</span>`;
        }
        
        // 添加动画类：只有新生成的方块才添加new类，下落的方块添加falling类
        if (block.isNew) {
            cell.classList.add('new');
            delete block.isNew; // 清除标记
        } else if (block.isFalling) {
            cell.classList.add('falling');
            delete block.isFalling; // 清除标记
        }
    }
    
    // 方块下落
    dropCells() {
        // 为每一列执行下落逻辑
        for (let col = 0; col < BOARD_SIZE; col++) {
            let hasChanges = true;
            
            // 循环处理当前列，直到没有更多的方块可以下落
            while (hasChanges) {
                hasChanges = false;
                
                // 从底部开始向上遍历每一行
                for (let row = BOARD_SIZE - 1; row >= 0; row--) {
                    // 如果当前位置是空的
                    if (this.board[row][col].color === EMPTY) {
                        // 查找当前位置上方最近的非空方块
                        // 从当前位置的上一行开始，向上查找
                        let nonEmptyRow = -1;
                        for (let r = row - 1; r >= 0; r--) {
                            if (this.board[r][col].color !== EMPTY) {
                                nonEmptyRow = r;
                                break;
                            }
                        }
                        
                        // 如果找到了非空方块
                        if (nonEmptyRow !== -1) {
                            // 1. 保存要下落的方块的完整属性
                            const fallingBlock = {
                                ...this.board[nonEmptyRow][col],
                                // 标记为下落方块，用于添加下落动画
                                isFalling: true
                            };
                            
                            // 2. 将原位置设置为空方块
                            this.board[nonEmptyRow][col] = {
                                color: EMPTY,
                                special: SPECIAL_NONE,
                                state: BLOCK_STATES.NORMAL,
                                frozenLayers: 0,
                                locked: false
                            };
                            
                            // 3. 将下落的方块放置到空位置
                            this.board[row][col] = fallingBlock;
                            
                            // 标记有变化，需要重新检查
                            hasChanges = true;
                            
                            // 跳出内层循环，重新从底部开始检查
                            break;
                        }
                        // 如果没有找到非空方块，说明当前列顶部需要补充新方块，由fillEmptyCells处理
                    }
                }
            }
        }
    }
    
    // 填充空方块
    fillEmptyCells() {
        // 为每一列执行填充逻辑
        for (let col = 0; col < BOARD_SIZE; col++) {
            // 只填充每一列最顶部的连续空位置
            // 从顶部开始，找到第一个空位置
            let startRow = -1;
            for (let row = 0; row < BOARD_SIZE; row++) {
                if (this.board[row][col].color === EMPTY) {
                    startRow = row;
                    break;
                }
            }
            
            // 如果没有空位置，跳过当前列
            if (startRow === -1) continue;
            
            // 从startRow开始，填充所有连续的空位置
            for (let row = startRow; row < BOARD_SIZE; row++) {
                if (this.board[row][col].color === EMPTY) {
                    // 生成新的方块，只在顶部补充
                    this.board[row][col] = {
                        color: Math.floor(Math.random() * COLORS),
                        special: SPECIAL_NONE,
                        state: BLOCK_STATES.NORMAL,
                        frozenLayers: 0,
                        locked: false,
                        // 标记为新生成的方块，用于添加新生成动画
                        isNew: true
                    };
                } else {
                    // 遇到非空方块，停止填充
                    break;
                }
            }
        }
    }
    
    // 更新游戏统计
    updateStats() {
        this.scoreElement.textContent = this.score;
        this.levelElement.textContent = this.level;
        this.targetScoreElement.textContent = this.targetScore;
        
        if (this.gameMode === GAME_MODES.CLASSIC || this.gameMode === GAME_MODES.ENDLESS) {
            this.movesElement.textContent = this.moves;
        }
        
        if (this.gameMode === GAME_MODES.TIME) {
            this.timeElement.textContent = this.timeLeft;
        }
    }
    
    // 选择方块
    selectCell(row, col) {
        // 只有在游戏进行中才能选择方块
        if (this.currentState !== this.gameStates.PLAYING) return;
        
        // 播放点击音效
        playSound('click');
        
        // 只有在经典模式下才检查移动次数
        if (this.gameMode === GAME_MODES.CLASSIC && this.moves <= 0) return;
        
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        // 处理特殊方块点击
        if (this.board[row][col].special !== SPECIAL_NONE) {
            this.handleSpecialCell(row, col);
            // 只有在经典模式下才减少移动次数
            if (this.gameMode === GAME_MODES.CLASSIC) {
                this.moves--;
            }
            this.updateStats();
            this.checkGameProgress();
            return;
        }
        
        // 如果没有选中任何方块，选中当前方块
        if (!this.selectedCell) {
            this.selectedCell = { row, col };
            cell.classList.add('selected');
            return;
        }
        
        // 如果点击的是同一个方块，取消选择
        if (this.selectedCell.row === row && this.selectedCell.col === col) {
            this.selectedCell = null;
            cell.classList.remove('selected');
            return;
        }
        
        // 检查是否相邻
        if (!this.isAdjacent(this.selectedCell, { row, col })) {
            // 如果不相邻，选择新方块
            const prevCell = document.querySelector(`[data-row="${this.selectedCell.row}"][data-col="${this.selectedCell.col}"]`);
            prevCell.classList.remove('selected');
            this.selectedCell = { row, col };
            cell.classList.add('selected');
            return;
        }
        
        // 保存当前选中的细胞
        const currentSelectedCell = this.selectedCell;
        
        // 取消选择（移除选中样式）
        const prevCell = document.querySelector(`[data-row="${this.selectedCell.row}"][data-col="${this.selectedCell.col}"]`);
        prevCell.classList.remove('selected');
        this.selectedCell = null;
        
        // 保存交换前的状态
        const tempBoard = JSON.parse(JSON.stringify(this.board));
        
        // 执行交换
        this.swapCells(currentSelectedCell, { row, col });
        
        // 渲染交换后的状态，并添加交换动画
        this.renderBoard();
        
        // 给交换的两个方块添加动画类
        const cell1 = document.querySelector(`[data-row="${currentSelectedCell.row}"][data-col="${currentSelectedCell.col}"]`);
        const cell2 = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell1.classList.add('swapping');
        cell2.classList.add('swapping');
        
        // 等待交换动画完成后再检查匹配
        setTimeout(() => {
            // 移除交换动画类
            cell1.classList.remove('swapping');
            cell2.classList.remove('swapping');
            
            // 检查是否有匹配
            let matches = this.findAllMatches();
            if (matches.length === 0) {
                // 如果没有匹配，交换回来
                this.board = tempBoard;
                this.renderBoard();
            } else {
                // 如果有匹配，处理匹配
                // 只有在经典模式下才减少移动次数
                if (this.gameMode === GAME_MODES.CLASSIC) {
                    this.moves--;
                }
                this.handleMatches();
            }
            
            this.updateStats();
        }, 300);
    }
    
    // 检查两个方块是否相邻
    isAdjacent(cell1, cell2) {
        const rowDiff = Math.abs(cell1.row - cell2.row);
        const colDiff = Math.abs(cell1.col - cell2.col);
        return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
    }
    
    // 交换两个方块
    swapCells(cell1, cell2) {
        const temp = this.board[cell1.row][cell1.col];
        this.board[cell1.row][cell1.col] = this.board[cell2.row][cell2.col];
        this.board[cell2.row][cell2.col] = temp;
    }
    
    // 查找所有匹配
    findAllMatches() {
        const matches = [];
        const visited = Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(false));
        const specialCells = new Set(); // 使用Set避免重复添加
        
        // 辅助函数：检查两个方块是否匹配（考虑彩虹方块）
        const isMatch = (block1, block2) => {
            if (block1.color === EMPTY || block2.color === EMPTY) return false;
            if (block1.special === SPECIAL_RAINBOW || block2.special === SPECIAL_RAINBOW) return true;
            return block1.color === block2.color;
        };
        
        // 辅助函数：添加匹配
        const addMatches = (start, end, isRow, index) => {
            const count = end - start;
            if (count < 3) return;
            
            const matchesToAdd = [];
            for (let i = start; i < end; i++) {
                const row = isRow ? index : i;
                const col = isRow ? i : index;
                if (!visited[row][col]) {
                    matchesToAdd.push({ row, col });
                    visited[row][col] = true;
                }
            }
            
            // 只有当找到新匹配时才添加
            if (matchesToAdd.length > 0) {
                matches.push(...matchesToAdd);
                
                // 生成特殊方块
                if (count >= 4) {
                    const center = Math.floor((start + end - 1) / 2);
                    const centerRow = isRow ? index : center;
                    const centerCol = isRow ? center : index;
                    // 检查是否已经添加过这个位置的特殊方块
                    const key = `${centerRow},${centerCol}`;
                    if (!specialCells.has(key)) {
                        // 检查是否包含彩虹方块
                        let hasRainbow = false;
                        for (let i = start; i < end; i++) {
                            const row = isRow ? index : i;
                            const col = isRow ? i : index;
                            if (this.board[row][col].special === SPECIAL_RAINBOW) {
                                hasRainbow = true;
                                break;
                            }
                        }
                        specialCells.add(key);
                        specialCells.add({ 
                            row: centerRow, 
                            col: centerCol, 
                            type: count >= 5 ? SPECIAL_BOMB : (hasRainbow ? SPECIAL_RAINBOW : (isRow ? SPECIAL_ROW : SPECIAL_COL)) 
                        });
                    }
                }
            }
        };
        
        // 检查行匹配
        for (let row = 0; row < BOARD_SIZE; row++) {
            let startCol = 0;
            
            for (let col = 1; col <= BOARD_SIZE; col++) {
                // 如果到达行尾或当前块与前一块不匹配
                if (col === BOARD_SIZE || !isMatch(this.board[row][col], this.board[row][col - 1])) {
                    addMatches(startCol, col, true, row);
                    startCol = col;
                }
            }
        }
        
        // 重置访问标记，检查列匹配
        for (let row = 0; row < BOARD_SIZE; row++) {
            visited[row].fill(false);
        }
        
        // 检查列匹配
        for (let col = 0; col < BOARD_SIZE; col++) {
            let startRow = 0;
            
            for (let row = 1; row <= BOARD_SIZE; row++) {
                // 如果到达列尾或当前块与前一块不匹配
                if (row === BOARD_SIZE || !isMatch(this.board[row][col], this.board[row - 1][col])) {
                    addMatches(startRow, row, false, col);
                    startRow = row;
                }
            }
        }
        
        // 应用特殊方块
        for (const cell of specialCells) {
            // 跳过Set中的字符串键
            if (typeof cell === 'string') continue;
            
            // 确保特殊方块不会被覆盖
            const existingMatch = matches.find(m => m.row === cell.row && m.col === cell.col);
            if (existingMatch) {
                // 在下落和填充后设置特殊方块
                setTimeout(() => {
                    if (this.board[cell.row] && this.board[cell.row][cell.col]) {
                        this.board[cell.row][cell.col].special = cell.type;
                        this.renderBoard();
                    }
                }, 800);
            }
        }
        
        return matches;
    }
    
    // 检查是否有匹配
    hasMatches() {
        return this.findAllMatches().length > 0;
    }
    
    // 检查是否存在可移动方块
    hasValidMoves() {
        // 尝试所有可能的相邻交换，检查是否能产生匹配
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                // 尝试向右交换
                if (col < BOARD_SIZE - 1) {
                    this.swapCells({ row, col }, { row, col: col + 1 });
                    if (this.hasMatches()) {
                        this.swapCells({ row, col: col + 1 }, { row, col });
                        return true;
                    }
                    this.swapCells({ row, col: col + 1 }, { row, col });
                }
                
                // 尝试向下交换
                if (row < BOARD_SIZE - 1) {
                    this.swapCells({ row, col }, { row: row + 1, col });
                    if (this.hasMatches()) {
                        this.swapCells({ row: row + 1, col }, { row, col });
                        return true;
                    }
                    this.swapCells({ row: row + 1, col }, { row, col });
                }
            }
        }
        return false;
    }
    
    // 重排棋盘
    rearrangeBoard() {
        // 打乱现有方块的位置
        const allCells = [];
        
        // 收集所有方块
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                allCells.push(this.board[row][col]);
            }
        }
        
        // 随机打乱
        for (let i = allCells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
        }
        
        // 将打乱后的方块放回棋盘
        let index = 0;
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                this.board[row][col] = allCells[index++];
            }
        }
        
        // 确保重排后没有初始匹配
        while (this.hasMatches() || !this.hasValidMoves()) {
            this.rearrangeBoard();
        }
        
        this.renderBoard();
    }
    
    // 处理匹配主函数
    handleMatches() {
        // 设置游戏状态为动画中
        this.setState(this.gameStates.ANIMATING);
        
        // 查找所有匹配
        const matches = this.findAllMatches();
        
        if (matches.length === 0) {
            // 处理没有匹配的情况
            this.handleNoMatches();
        } else {
            // 处理找到匹配的情况
            this.handleMatchesFound(matches);
        }
    }
    
    // 处理没有匹配的情况
    handleNoMatches() {
        // 连锁风暴模式：连锁中断时减少时间
        if (this.gameMode === GAME_MODES.CHAIN_STORM) {
            this.timeLeft -= 10; // 连锁中断减少10秒
            if (this.timeLeft < 0) this.timeLeft = 0;
            this.updateStats();
        }
        
        // 重置连击数
        this.combo = 0;
        this.currentMilestone = 0;
        
        // 没有更多匹配，检查是否需要升级
        this.checkGameProgress();
        
        // 检查是否存在可移动方块
        if (!this.hasValidMoves()) {
            // 没有可移动方块，重排棋盘
            this.rearrangeBoard();
        }
        
        // 恢复游戏状态为播放中
        this.setState(this.gameStates.PLAYING);
    }
    
    // 处理找到匹配的情况
    handleMatchesFound(matches) {
        // 播放匹配音效
        playSound('match');
        
        // 连锁风暴模式：根据连锁长度增加时间
        if (this.gameMode === GAME_MODES.CHAIN_STORM) {
            const timeBonus = Math.min(5, Math.max(1, Math.floor(this.combo / 2))); // 1-5秒
            this.timeLeft += timeBonus;
            this.updateStats();
        }
        
        // 标记匹配的方块
        this.markMatchedBlocks(matches);
        
        // 增加连击数
        this.incrementCombo();
        
        // 检查并显示连击里程碑
        this.checkComboMilestone();
        
        // 处理匹配动画和后续流程
        this.processMatchAnimation(matches);
    }
    
    // 标记匹配的方块
    markMatchedBlocks(matches) {
        for (const match of matches) {
            const cell = document.querySelector(`[data-row="${match.row}"][data-col="${match.col}"]`);
            cell.classList.add('matched');
        }
    }
    
    // 增加连击数
    incrementCombo() {
        this.combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
    }
    
    // 检查并显示连击里程碑
    checkComboMilestone() {
        if (COMBO_MILESTONES.includes(this.combo)) {
            // 播放连击音效
            playSound('combo');
            // 显示连击里程碑效果
            this.showComboMilestone(this.combo);
            this.currentMilestone = this.combo;
        }
    }
    
    // 处理匹配动画和后续流程
    processMatchAnimation(matches) {
        // 添加匹配动画延迟
        setTimeout(() => {
            // 处理匹配的方块
            const totalMatchScore = this.processMatchedBlocks(matches);
            
            // 计算分数，包含连击奖励
            this.calculateAndAddScore(totalMatchScore);
            
            // 生成新方块并下落
            this.processBlockFalling();
            
            // 更新UI
            this.renderBoard();
            this.updateStats();
            
            // 处理下一批匹配（使用迭代方式）
            this.handleChainReaction();
        }, 600);
    }
    
    // 处理匹配的方块
    processMatchedBlocks(matches) {
        let totalMatchScore = 0;
        
        for (const match of matches) {
            const block = this.board[match.row][match.col];
            
            // 处理特殊状态
            if (block.state === BLOCK_STATES.LOCKED) {
                // 解锁方块
                block.locked = false;
                block.state = BLOCK_STATES.NORMAL;
                // 不消除，只解锁
                continue;
            } else if (block.state === BLOCK_STATES.FROZEN) {
                // 减少冰冻层数
                block.frozenLayers--;
                if (block.frozenLayers > 0) {
                    // 还剩冰冻层数，不消除
                    continue;
                } else {
                    // 冰冻层消除，恢复正常状态
                    block.state = BLOCK_STATES.NORMAL;
                }
            }
            
            // 消除方块
            block.color = EMPTY;
            totalMatchScore++;
        }
        
        return totalMatchScore;
    }
    
    // 计算并添加分数
    calculateAndAddScore(totalMatchScore) {
        // 计算分数，包含连击奖励
        const baseScore = totalMatchScore * 10 * this.level;
        const comboBonus = Math.floor(baseScore * (this.combo * 0.1)); // 每连击增加10%分数
        const milestoneBonus = this.currentMilestone > 0 ? Math.floor(baseScore * (this.currentMilestone * 0.05)) : 0;
        const totalScore = baseScore + comboBonus + milestoneBonus;
        this.score += totalScore;
    }
    
    // 处理方块下落
    processBlockFalling() {
        this.dropCells();
        this.fillEmptyCells();
    }
    
    // 处理连锁反应（迭代方式）
    handleChainReaction() {
        // 使用迭代方式处理连锁反应，避免递归栈溢出
        // 创建一个匹配处理队列
        const matchQueue = [];
        let maxIterations = 20; // 限制最大处理次数，防止无限循环
        
        // 开始处理队列
        const processNextMatch = () => {
            // 减少剩余迭代次数
            maxIterations--;
            
            if (maxIterations <= 0) {
                // 达到最大迭代次数，停止处理
                console.warn('Reached maximum iterations for chain reaction');
                this.setState(this.gameStates.PLAYING);
                return;
            }
            
            // 查找所有匹配
            const matches = this.findAllMatches();
            
            if (matches.length === 0) {
                // 处理没有匹配的情况
                this.handleNoMatches();
            } else {
                // 处理找到匹配的情况
                this.handleMatchesFound(matches);
                
                // 处理完当前匹配后，继续处理下一批匹配
                setTimeout(processNextMatch, 700); // 等待动画完成
            }
        };
        
        // 开始处理连锁反应
        setTimeout(processNextMatch, 700); // 等待当前匹配动画完成
    }
    
    // 显示连击里程碑效果
    showComboMilestone(comboCount) {
        // 创建连击效果元素
        const comboEffect = document.createElement('div');
        comboEffect.className = 'combo-effect';
        comboEffect.textContent = `${comboCount} Combo!`;
        document.body.appendChild(comboEffect);
        
        // 添加动画
        comboEffect.style.position = 'fixed';
        comboEffect.style.top = '50%';
        comboEffect.style.left = '50%';
        comboEffect.style.transform = 'translate(-50%, -50%)';
        comboEffect.style.fontSize = '3em';
        comboEffect.style.fontWeight = 'bold';
        comboEffect.style.color = '#ffd700';
        comboEffect.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.5)';
        comboEffect.style.zIndex = '10000';
        comboEffect.style.animation = 'comboEffect 1s ease-out forwards';
        
        // 1秒后移除元素
        setTimeout(() => {
            document.body.removeChild(comboEffect);
        }, 1000);
    }
    
    // 更新道具UI
    updatePowerUIs() {
        // 更新重排道具
        const rearrangeCount = document.getElementById('count-rearrange');
        if (rearrangeCount) {
            rearrangeCount.textContent = this.powerUps[POWER_UPS.REARRANGE];
            const rearrangeItem = document.getElementById('power-up-rearrange');
            if (this.powerUps[POWER_UPS.REARRANGE] <= 0) {
                rearrangeItem.classList.add('disabled');
            } else {
                rearrangeItem.classList.remove('disabled');
            }
        }
        
        // 更新提示道具
        const hintCount = document.getElementById('count-hint');
        if (hintCount) {
            hintCount.textContent = this.powerUps[POWER_UPS.HINT_BOOST];
            const hintItem = document.getElementById('power-up-hint');
            if (this.powerUps[POWER_UPS.HINT_BOOST] <= 0) {
                hintItem.classList.add('disabled');
            } else {
                hintItem.classList.remove('disabled');
            }
        }
        
        // 更新特殊方块生成道具
        const specialCount = document.getElementById('count-special');
        if (specialCount) {
            specialCount.textContent = this.powerUps[POWER_UPS.SPECIAL_GENERATOR];
            const specialItem = document.getElementById('power-up-special');
            if (this.powerUps[POWER_UPS.SPECIAL_GENERATOR] <= 0) {
                specialItem.classList.add('disabled');
            } else {
                specialItem.classList.remove('disabled');
            }
        }
        
        // 更新时间冻结道具
        const freezeCount = document.getElementById('count-freeze');
        if (freezeCount) {
            freezeCount.textContent = this.powerUps[POWER_UPS.TIME_FREEZE];
            const freezeItem = document.getElementById('power-up-freeze');
            if (this.powerUps[POWER_UPS.TIME_FREEZE] <= 0) {
                freezeItem.classList.add('disabled');
            } else {
                freezeItem.classList.remove('disabled');
            }
        }
    }
    
    // 绑定道具事件
    bindPowerUpEvents() {
        // 重排道具
        const rearrangeItem = document.getElementById('power-up-rearrange');
        if (rearrangeItem) {
            rearrangeItem.addEventListener('click', () => this.useRearrangePowerUp());
            rearrangeItem.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.useRearrangePowerUp();
            });
        }
        
        // 提示道具
        const hintItem = document.getElementById('power-up-hint');
        if (hintItem) {
            hintItem.addEventListener('click', () => this.useHintBoostPowerUp());
            hintItem.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.useHintBoostPowerUp();
            });
        }
        
        // 特殊方块生成道具
        const specialItem = document.getElementById('power-up-special');
        if (specialItem) {
            specialItem.addEventListener('click', () => this.useSpecialGeneratorPowerUp());
            specialItem.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.useSpecialGeneratorPowerUp();
            });
        }
        
        // 时间冻结道具
        const freezeItem = document.getElementById('power-up-freeze');
        if (freezeItem) {
            freezeItem.addEventListener('click', () => this.useTimeFreezePowerUp());
            freezeItem.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.useTimeFreezePowerUp();
            });
        }
        
        // 绑定键盘事件
        this.bindKeyboardEvents();
    }
    
    // 绑定键盘事件
    bindKeyboardEvents() {
        // 移除之前的事件监听器，避免重复绑定
        document.removeEventListener('keydown', this.handleKeyDown);
        
        // 绑定新的事件监听器
        this.handleKeyDown = (e) => this.onKeyDown(e);
        document.addEventListener('keydown', this.handleKeyDown);
    }
    
    // 键盘事件处理
    onKeyDown(e) {
        // 只有在游戏进行中才能使用键盘操作
        if (this.currentState !== this.gameStates.PLAYING) return;
        
        // 如果没有选中任何方块，使用方向键选择方块
        if (!this.selectedCell) {
            // 默认选择中心方块
            if (!this.selectedCell) {
                this.selectedCell = { 
                    row: Math.floor(BOARD_SIZE / 2), 
                    col: Math.floor(BOARD_SIZE / 2) 
                };
                this.renderBoard();
                const cell = document.querySelector(`[data-row="${this.selectedCell.row}"][data-col="${this.selectedCell.col}"]`);
                cell.classList.add('selected');
            }
        } else {
            // 已经选中了一个方块，使用方向键选择另一个方块
            let newRow = this.selectedCell.row;
            let newCol = this.selectedCell.col;
            
            switch (e.key) {
                case 'ArrowUp':
                    newRow = Math.max(0, this.selectedCell.row - 1);
                    break;
                case 'ArrowDown':
                    newRow = Math.min(BOARD_SIZE - 1, this.selectedCell.row + 1);
                    break;
                case 'ArrowLeft':
                    newCol = Math.max(0, this.selectedCell.col - 1);
                    break;
                case 'ArrowRight':
                    newCol = Math.min(BOARD_SIZE - 1, this.selectedCell.col + 1);
                    break;
                case ' ': // 空格键确认选择
                    this.selectCell(this.selectedCell.row, this.selectedCell.col);
                    return;
                case 'Escape': // ESC键取消选择
                    const cell = document.querySelector(`[data-row="${this.selectedCell.row}"][data-col="${this.selectedCell.col}"]`);
                    if (cell) {
                        cell.classList.remove('selected');
                    }
                    this.selectedCell = null;
                    return;
            }
            
            // 更新选中的方块
            const prevCell = document.querySelector(`[data-row="${this.selectedCell.row}"][data-col="${this.selectedCell.col}"]`);
            if (prevCell) {
                prevCell.classList.remove('selected');
            }
            
            this.selectedCell = { row: newRow, col: newCol };
            const newCell = document.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);
            if (newCell) {
                newCell.classList.add('selected');
            }
        }
    }
    
    // 使用重排道具
    useRearrangePowerUp() {
        if (this.powerUps[POWER_UPS.REARRANGE] <= 0 || this.currentState !== this.gameStates.PLAYING) return;
        
        this.powerUps[POWER_UPS.REARRANGE]--;
        this.updatePowerUIs();
        this.rearrangeBoard();
        playSound('powerUp');
    }
    
    // 使用提示增强道具
    useHintBoostPowerUp() {
        if (this.powerUps[POWER_UPS.HINT_BOOST] <= 0 || this.currentState !== this.gameStates.PLAYING) return;
        
        this.powerUps[POWER_UPS.HINT_BOOST]--;
        this.updatePowerUIs();
        this.getHint(true); // 增强提示
        playSound('powerUp');
    }
    
    // 使用特殊方块生成道具
    useSpecialGeneratorPowerUp() {
        if (this.powerUps[POWER_UPS.SPECIAL_GENERATOR] <= 0 || this.currentState !== this.gameStates.PLAYING) return;
        
        this.powerUps[POWER_UPS.SPECIAL_GENERATOR]--;
        this.updatePowerUIs();
        
        // 随机选择一个位置生成特殊方块
        const row = Math.floor(Math.random() * BOARD_SIZE);
        const col = Math.floor(Math.random() * BOARD_SIZE);
        const specialTypes = [SPECIAL_ROW, SPECIAL_COL, SPECIAL_BOMB, SPECIAL_RAINBOW];
        const specialType = specialTypes[Math.floor(Math.random() * specialTypes.length)];
        
        this.board[row][col].special = specialType;
        this.renderBoard();
        playSound('powerUp');
    }
    
    // 使用时间冻结道具
    useTimeFreezePowerUp() {
        if (this.powerUps[POWER_UPS.TIME_FREEZE] <= 0 || this.gameMode !== GAME_MODES.TIME || this.currentState !== this.gameStates.PLAYING) return;
        
        this.powerUps[POWER_UPS.TIME_FREEZE]--;
        this.updatePowerUIs();
        
        // 冻结时间5秒
        this.stopTimer();
        setTimeout(() => {
            if (this.currentState === this.gameStates.PLAYING) {
                this.startTimer();
            }
        }, 5000);
        
        playSound('powerUp');
    }
    

    
    // 处理特殊方块效果
    handleSpecialCell(row, col) {
        // 播放特殊方块音效
        playSound('special');
        
        const specialType = this.board[row][col].special;
        const matches = [];
        
        switch (specialType) {
            case SPECIAL_ROW:
                // 消除整行
                for (let c = 0; c < BOARD_SIZE; c++) {
                    matches.push({ row, col: c });
                }
                break;
            
            case SPECIAL_COL:
                // 消除整列
                for (let r = 0; r < BOARD_SIZE; r++) {
                    matches.push({ row: r, col });
                }
                break;
            
            case SPECIAL_BOMB:
                // 消除周围8个方块以及自身
                for (let r = Math.max(0, row - 1); r <= Math.min(BOARD_SIZE - 1, row + 1); r++) {
                    for (let c = Math.max(0, col - 1); c <= Math.min(BOARD_SIZE - 1, col + 1); c++) {
                        matches.push({ row: r, col: c });
                    }
                }
                break;
        }
        
        // 显示匹配动画
        for (const match of matches) {
            const cell = document.querySelector(`[data-row="${match.row}"][data-col="${match.col}"]`);
            if (cell) {
                cell.classList.add('matched');
            }
        }
        
        // 延迟处理消除
        setTimeout(() => {
            // 移除匹配的方块
            for (const match of matches) {
                this.board[match.row][match.col].color = EMPTY;
            }
            
            // 计算分数
            this.score += matches.length * 15 * this.level;
            
            // 生成新方块并下落
            this.dropCells();
            this.fillEmptyCells();
            
            // 特殊方块挑战模式：每使用一个特殊方块，在随机位置生成新的特殊方块
            if (this.gameMode === GAME_MODES.SPECIAL_CHALLENGE) {
                // 随机选择一个位置
                const randRow = Math.floor(Math.random() * BOARD_SIZE);
                const randCol = Math.floor(Math.random() * BOARD_SIZE);
                
                // 在随机位置生成新的特殊方块
                const specialTypes = [SPECIAL_ROW, SPECIAL_COL, SPECIAL_BOMB];
                const newSpecialType = specialTypes[Math.floor(Math.random() * specialTypes.length)];
                this.board[randRow][randCol].special = newSpecialType;
            }
            
            this.renderBoard();
            this.updateStats();
            
            // 检查是否有新的匹配
            if (this.hasMatches()) {
                this.handleMatches();
            } else {
                // 没有更多匹配，检查是否需要升级
                this.checkGameProgress();
            }
        }, 600);
    }
    
    // 检查游戏进度
    checkGameProgress() {
        if (this.gameMode === GAME_MODES.PUZZLE) {
            // 解谜模式胜利条件检查
            let isPuzzleCompleted = false;
            
            switch (this.puzzleTarget.type) {
                case 'score':
                    // 分数目标：达到指定分数
                    isPuzzleCompleted = this.score >= this.puzzleTarget.value;
                    break;
                    
                case 'clearSpecial':
                    // 清除特殊状态目标：检查是否还有指定特殊状态的方块
                    isPuzzleCompleted = !this.board.some(row => 
                        row.some(cell => cell.state === this.puzzleTarget.value)
                    );
                    break;
            }
            
            if (isPuzzleCompleted) {
                // 解谜关卡完成
                this.levelUp();
            } else if (this.moves <= 0) {
                // 步数用完，解谜失败
                this.endGame();
            }
        } else {
            // 普通模式逻辑
            // 所有模式下，达到目标分数都要升级
            if (this.score >= this.targetScore) {
                this.levelUp();
            }
            
            // 检查是否游戏结束
            switch (this.gameMode) {
                case GAME_MODES.CLASSIC:
                    if (this.moves <= 0) {
                        this.endGame();
                    }
                    break;
                
                case GAME_MODES.TIME:
                    // 时间模式下，游戏不会主动结束，除非时间耗尽
                    break;
                
                case GAME_MODES.ENDLESS:
                    // 无尽模式下，游戏永远不会结束
                    break;
            }
        }
    }
    
    // 关卡升级
    levelUp() {
        // 播放升级音效
        playSound('levelUp');
        
        this.level++;
        
        if (this.gameMode === GAME_MODES.PUZZLE) {
            // 解谜模式：切换到下一个预定义关卡
            const nextLevel = this.puzzleLevels.find(level => level.level === this.level);
            if (nextLevel) {
                // 设置新关卡参数
                this.moves = nextLevel.moves;
                this.puzzleTarget = nextLevel.target;
                this.targetScore = nextLevel.target.type === 'score' ? nextLevel.target.value : 0;
                
                // 重置分数
                this.score = 0;
                
                // 重新创建棋盘
                this.createBoard();
                this.renderBoard();
                this.updateStats();
                
                // 显示升级界面
                const levelUpElement = document.getElementById('level-up');
                const newLevelElement = document.getElementById('new-level');
                newLevelElement.textContent = this.level;
                levelUpElement.classList.remove('hidden');
            } else {
                // 所有解谜关卡完成
                this.endGame();
            }
        } else {
            // 普通模式逻辑
            switch (this.gameMode) {
                case GAME_MODES.CLASSIC:
                    this.moves += 20;
                    break;
                
                case GAME_MODES.TIME:
                    this.timeLeft += 30; // 增加30秒时间
                    this.timeElement.textContent = this.timeLeft;
                    break;
                
                case GAME_MODES.ENDLESS:
                    // 无尽模式下，升级可以增加一些奖励
                    break;
            }
            
            this.targetScore += this.level * 1000;
            
            // 显示升级界面
            const levelUpElement = document.getElementById('level-up');
            const newLevelElement = document.getElementById('new-level');
            newLevelElement.textContent = this.level;
            levelUpElement.classList.remove('hidden');
        }
    }
    
    // 游戏结束
    endGame() {
        // 播放游戏结束音效
        playSound('gameOver');
        
        const gameOverElement = document.getElementById('game-over');
        const finalScoreElement = document.getElementById('final-score');
        const finalLevelElement = document.getElementById('final-level');
        finalScoreElement.textContent = this.score;
        finalLevelElement.textContent = this.level;
        gameOverElement.classList.remove('hidden');
    }
    
    // 开始计时器
    startTimer() {
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        this.timer = setInterval(() => {
            this.timeLeft--;
            this.timeElement.textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                clearInterval(this.timer);
                this.timer = null;
                this.endGame();
            }
        }, 1000);
    }
    
    // 停止计时器
    stopTimer() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    
    // 启动重力方向切换计时器
    startGravityTimer() {
        this.clearGravityTimer(); // 清除现有计时器
        
        // 每30秒切换一次重力方向
        this.gravityTimer = setInterval(() => {
            this.switchGravityDirection();
        }, 30000);
    }
    
    // 清除重力方向切换计时器
    clearGravityTimer() {
        if (this.gravityTimer) {
            clearInterval(this.gravityTimer);
            this.gravityTimer = null;
        }
    }
    
    // 切换重力方向
    switchGravityDirection() {
        const directions = ['up', 'down', 'left', 'right'];
        const currentIndex = directions.indexOf(this.gravityDirection);
        const nextIndex = (currentIndex + 1) % directions.length;
        this.gravityDirection = directions[nextIndex];
        
        // 应用新的重力方向，更新方块位置
        this.applyGravity();
        
        // 显示重力方向变化效果
        this.showGravityChangeEffect();
    }
    
    // 应用重力方向，更新方块位置
    applyGravity() {
        // 这里需要实现根据不同重力方向调整方块位置的逻辑
        // 简化实现：直接重排棋盘，模拟重力效果
        this.rearrangeBoard();
        this.renderBoard();
    }
    
    // 显示重力方向变化效果
    showGravityChangeEffect() {
        // 创建重力方向指示器
        const gravityIndicator = document.createElement('div');
        gravityIndicator.className = 'gravity-indicator';
        gravityIndicator.textContent = `重力方向: ${this.gravityDirection}`;
        gravityIndicator.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            font-size: 1.5em;
            font-weight: bold;
            z-index: 10000;
            animation: fadeInOut 2s ease;
        `;
        
        // 添加到文档
        document.body.appendChild(gravityIndicator);
        
        // 2秒后移除
        setTimeout(() => {
            document.body.removeChild(gravityIndicator);
        }, 2000);
    }
    
    // 获取提示
    getHint() {
        // 简单提示：找到第一个可能的匹配
        for (let row = 0; row < BOARD_SIZE; row++) {
            for (let col = 0; col < BOARD_SIZE; col++) {
                // 尝试向右交换
                if (col < BOARD_SIZE - 1) {
                    this.swapCells({ row, col }, { row, col: col + 1 });
                    if (this.hasMatches()) {
                        this.swapCells({ row, col: col + 1 }, { row, col });
                        this.highlightCell(row, col);
                        this.highlightCell(row, col + 1);
                        return;
                    }
                    this.swapCells({ row, col: col + 1 }, { row, col });
                }
                
                // 尝试向下交换
                if (row < BOARD_SIZE - 1) {
                    this.swapCells({ row, col }, { row: row + 1, col });
                    if (this.hasMatches()) {
                        this.swapCells({ row: row + 1, col }, { row, col });
                        this.highlightCell(row, col);
                        this.highlightCell(row + 1, col);
                        return;
                    }
                    this.swapCells({ row: row + 1, col }, { row, col });
                }
            }
        }
    }
    
    // 高亮提示方块
    highlightCell(row, col) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        cell.style.boxShadow = '0 0 20px #ffd700';
        setTimeout(() => {
            cell.style.boxShadow = '';
        }, 1000);
    }
}

// 导出游戏管理器
export default GameManager;