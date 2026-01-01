// 游戏常量
export const BOARD_SIZE = 8;
export const COLORS = 7;
export const EMPTY = -1;

// 游戏模式
export const GAME_MODES = {
    CLASSIC: 'classic',
    TIME: 'time',
    ENDLESS: 'endless',
    PUZZLE: 'puzzle',  // 解谜模式
    CHAIN_STORM: 'chainStorm',  // 连锁风暴模式
    SPECIAL_CHALLENGE: 'specialChallenge',  // 特殊方块挑战模式
    GRAVITY_FLIP: 'gravityFlip'  // 重力反转模式
};

// 特殊方块类型
export const SPECIAL_NONE = 0;      // 普通方块
export const SPECIAL_ROW = 1;       // 横消方块
export const SPECIAL_COL = 2;       // 竖消方块
export const SPECIAL_BOMB = 3;      // 炸弹方块
export const SPECIAL_RAINBOW = 4;   // 彩虹方块（匹配任意颜色）
export const SPECIAL_LOCKED = 5;    // 锁定方块（需解锁）
export const SPECIAL_FROZEN = 6;    // 冰冻方块（需消除两次）

export const BLOCK_STATES = {
    NORMAL: 0,      // 正常状态
    LOCKED: 1,      // 锁定状态
    FROZEN: 2,      // 冰冻状态
    CHAINED: 3      // 链条状态
};

// 游戏难度
export const DIFFICULTY = {
    EASY: 'easy',
    NORMAL: 'normal',
    HARD: 'hard'
};

// 道具类型
export const POWER_UPS = {
    REARRANGE: 'rearrange',      // 重排道具
    HINT_BOOST: 'hintBoost',     // 提示增强
    SPECIAL_GENERATOR: 'specialGen', // 特殊方块生成器
    TIME_FREEZE: 'timeFreeze'    // 时间冻结
};

// 连击里程碑
export const COMBO_MILESTONES = [5, 10, 15, 20];

// 音效类型
export const SOUND_TYPES = {
    CLICK: 'click',
    MATCH: 'match',
    SPECIAL: 'special',
    LEVEL_UP: 'levelUp',
    GAME_OVER: 'gameOver',
    COMBO: 'combo',
    POWER_UP: 'powerUp'
};