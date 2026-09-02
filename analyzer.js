// 国标麻将番种分析器 (纯逻辑层)

// 动态构建映射表 (ID -> 番种对象) 和 排除规则表
const FANS_MAP = {};
const EXCLUSION_RULES_BY_ID = {};

if (typeof FANS_DATA !== 'undefined') {
    FANS_DATA.forEach(fan => {
        FANS_MAP[fan.id] = fan;
        // 提取不计规则
        if (fan.exclusion && fan.exclusion.length > 0) {
            EXCLUSION_RULES_BY_ID[fan.id] = fan.exclusion;
        }
    });
} else {
    console.error('[Analyzer] FANS_DATA 未定义，请确保 fans.js 已加载');
}

class MahjongAnalyzer {
    constructor() {
        this.reset();
    }

    reset() {
        this.hand = [];
        this.melds = [];
        this.winTile = null;
        this.conditions = {
            isSelfDrawn: true,
            prevalentWind: 'east',
            seatWind: 'east',
            flowerCount: 0,
            isLastTile: false,
            isKongDraw: false,
            isJuezhang: false
        };
    }

    setHand(hand, melds, winTile, conditions) {
        this.hand = [...hand];
        this.melds = [...melds];
        this.winTile = winTile;
        this.conditions = { ...this.conditions, ...conditions };
    }

    // 统一添加番种的辅助方法
    addFan(fansArray, fanId, overrides = {}) {
        const fan = FANS_MAP[fanId];
        if (!fan) {
            console.warn(`[Analyzer] 未知的番种 ID: ${fanId}`);
            return;
        }
        fansArray.push({
            id: fan.id,
            name: overrides.name || fan.name,
            score: overrides.score !== undefined ? overrides.score : fan.score,
            desc: fan.desc
        });
    }

    analyze() {
        const allTiles = this.getAllTiles();
        const decompositions = this.decomposeHand();
        
        if (decompositions.length === 0) {
            const specialResult = this.checkSpecialHands(allTiles);
            if (specialResult) {
                return specialResult;
            }
            return { valid: false, fans: [], totalScore: 0, message: '牌型不能和牌' };
        }

        let bestResult = { valid: true, fans: [], totalScore: 0 };
        
        for (const decomp of decompositions) {
            const fans = this.detectFans(decomp, allTiles);
            const totalScore = fans.reduce((sum, f) => sum + f.score, 0);
            
            if (totalScore > bestResult.totalScore) {
                bestResult = { valid: true, fans, totalScore };
            }
        }

        return bestResult;
    }

    getAllTiles() {
        const tiles = [...this.hand];
        for (const meld of this.melds) {
            tiles.push(...meld.tiles);
        }
        return tiles;
    }

    countTiles(tiles) {
        const count = {};
        for (const tile of tiles) {
            count[tile] = (count[tile] || 0) + 1;
        }
        return count;
    }

    decomposeHand() {
        const handTiles = [...this.hand];
        const tileCount = this.countTiles(handTiles);
        const decompositions = [];
        this._decompose(tileCount, [], null, decompositions);
        return decompositions;
    }

    _decompose(tileCount, sets, pair, results) {
        const remaining = Object.values(tileCount).reduce((a, b) => a + b, 0);
        
        if (remaining === 0 && pair) {
            results.push({ sets: [...sets], pair });
            return;
        }

        const sortedTiles = Object.keys(tileCount)
            .filter(t => tileCount[t] > 0)
            .sort((a, b) => {
                const typeOrder = { wan: 0, tiao: 1, bing: 2, wind: 3, dragon: 4 };
                const tileA = TILES[a];
                const tileB = TILES[b];
                if (!tileA || !tileB) return 0;
                if (tileA.type !== tileB.type) {
                    return typeOrder[tileA.type] - typeOrder[tileB.type];
                }
                if (typeof tileA.value === 'number' && typeof tileB.value === 'number') {
                    return tileA.value - tileB.value;
                }
                return 0;
            });

        if (sortedTiles.length === 0) return;

        const firstTile = sortedTiles[0];
        const tile = TILES[firstTile];
        
        if (!pair && tileCount[firstTile] >= 2) {
            const newCount = { ...tileCount };
            newCount[firstTile] -= 2;
            this._decompose(newCount, sets, firstTile, results);
        }

        if (tileCount[firstTile] >= 3) {
            const newCount = { ...tileCount };
            newCount[firstTile] -= 3;
            this._decompose(newCount, [...sets, { type: 'pong', tiles: [firstTile, firstTile, firstTile] }], pair, results);
        }

        if (tile && isNumberTile(firstTile) && tile.value <= 7) {
            const next1 = firstTile.charAt(0) + (tile.value + 1);
            const next2 = firstTile.charAt(0) + (tile.value + 2);
            
            if (tileCount[next1] > 0 && tileCount[next2] > 0) {
                const newCount = { ...tileCount };
                newCount[firstTile] -= 1;
                newCount[next1] -= 1;
                newCount[next2] -= 1;
                this._decompose(newCount, [...sets, { type: 'chi', tiles: [firstTile, next1, next2] }], pair, results);
            }
        }
    }

    checkSpecialHands(allTiles) {
        const tileCount = this.countTiles(allTiles);
        const hasKong = this.melds.some(m => m.type === 'minggang' || m.type === 'angang');

        if (this.melds.length === 0 && this.checkShiSanYao(tileCount)) {
            const fans = [];
            this.addFan(fans, 'shisanyao');
            this.addConditionFans(fans);
            return { valid: true, fans: this.applyExclusionRules(fans), totalScore: 0 };
        }

        if (this.melds.length === 0 && this.checkQiXingBuKao(tileCount)) {
            const fans = [];
            this.addFan(fans, 'qixingbukao');
            this.addConditionFans(fans);
            return { valid: true, fans: this.applyExclusionRules(fans), totalScore: 0 };
        }

        if (this.melds.length === 0 && this.checkQuanBuKao(tileCount)) {
            const fans = [];
            this.addFan(fans, 'quanbukao');
            this.addConditionFans(fans);
            return { valid: true, fans: this.applyExclusionRules(fans), totalScore: 0 };
        }

        if (this.melds.length === 0 && !hasKong && allTiles.length === 14) {
            const totalPairs = Object.values(tileCount).reduce((sum, c) => sum + Math.floor(c / 2), 0);
            if (totalPairs === 7 && Object.values(tileCount).every(c => c === 2 || c === 4)) {
                const fans = this.detectQiduiFans(tileCount);
                return { valid: true, fans: this.applyExclusionRules(fans), totalScore: 0 };
            }
        }

        return null;
    }

    checkShiSanYao(tileCount) {
        const yaoTiles = ['w1', 'w9', 't1', 't9', 'b1', 'b9', 'east', 'south', 'west', 'north', 'zhong', 'fa', 'bai'];
        let hasPair = false;
        
        for (const tile of yaoTiles) {
            const count = tileCount[tile] || 0;
            if (count === 0) return false;
            if (count === 2) hasPair = true;
            if (count > 2) return false;
        }
        
        return hasPair && Object.keys(tileCount).length === 13;
    }

    checkQuanBuKao(tileCount) {
        const tiles = Object.keys(tileCount);
        if (tiles.length !== 14) return false;
        if (!Object.values(tileCount).every(c => c === 1)) return false;

        const numberTiles = tiles.filter(t => isNumberTile(t));
        const honorTiles = tiles.filter(t => isHonorTile(t));
        return this.checkBuKaoPattern(numberTiles, honorTiles);
    }

    checkBuKaoPattern(numberTiles, honorTiles) {
        const patterns = [[1, 4, 7], [2, 5, 8], [3, 6, 9]];
        const suitValues = { w: [], t: [], b: [] };
        for (const tile of numberTiles) {
            const suit = tile.charAt(0);
            const value = parseInt(tile.charAt(1));
            suitValues[suit].push(value);
        }
        
        const suitPatternMap = {};
        for (const suit of ['w', 't', 'b']) {
            const values = suitValues[suit];
            if (values.length === 0) continue;
            
            let matchedPatternIdx = -1;
            for (let i = 0; i < patterns.length; i++) {
                if (values.every(v => patterns[i].includes(v))) {
                    matchedPatternIdx = i;
                    break;
                }
            }
            if (matchedPatternIdx === -1) return false;
            suitPatternMap[suit] = matchedPatternIdx;
        }
        
        const usedPatterns = new Set(Object.values(suitPatternMap));
        const suitsWithTiles = Object.keys(suitPatternMap).length;
        return usedPatterns.size === suitsWithTiles;
    }

    checkQiXingBuKao(tileCount) {
        const tiles = Object.keys(tileCount);
        if (tiles.length !== 14) return false;
        if (!Object.values(tileCount).every(c => c === 1)) return false;
        
        const honors = ['east', 'south', 'west', 'north', 'zhong', 'fa', 'bai'];
        if (!honors.every(h => tileCount[h] === 1)) return false;
        
        const numberTiles = tiles.filter(t => isNumberTile(t));
        if (numberTiles.length !== 7) return false;
        
        return this.checkQiXingPattern(numberTiles);
    }

    checkQiXingPattern(numberTiles) {
        const patterns = [[1, 4, 7], [2, 5, 8], [3, 6, 9]];
        const suitValues = { w: [], t: [], b: [] };
        for (const tile of numberTiles) {
            const suit = tile.charAt(0);
            const value = parseInt(tile.charAt(1));
            suitValues[suit].push(value);
        }
        
        const usedPatterns = new Set();
        for (const suit of ['w', 't', 'b']) {
            const values = suitValues[suit];
            if (values.length === 0) continue;
            
            let matchedIdx = -1;
            for (let i = 0; i < patterns.length; i++) {
                if (values.every(v => patterns[i].includes(v))) {
                    matchedIdx = i;
                    break;
                }
            }
            if (matchedIdx === -1) return false;
            if (usedPatterns.has(matchedIdx)) return false;
            usedPatterns.add(matchedIdx);
        }
        return usedPatterns.size === 3;
    }

    detectQiduiFans(tileCount) {
        const fans = [];
        this.addFan(fans, 'qidui');
        const tiles = Object.keys(tileCount);
        
        const suitCounts = { w: [], t: [], b: [] };
        for (const tile of tiles) {
            if (isNumberTile(tile)) {
                const suit = tile.charAt(0);
                const value = parseInt(tile.charAt(1));
                suitCounts[suit].push(value);
            }
        }

        for (const suit of ['w', 't', 'b']) {
            const values = suitCounts[suit].sort((a, b) => a - b);
            if (values.length === 7) {
                let isConsecutive = true;
                for (let i = 1; i < 7; i++) {
                    if (values[i] !== values[i-1] + 1) {
                        isConsecutive = false;
                        break;
                    }
                }
                if (isConsecutive) {
                    fans.length = 0;
                    this.addFan(fans, 'lianqidui');
                    break;
                }
            }
        }

        if (fans[0].id === 'qidui') {
            const types = new Set(tiles.map(t => TILES[t]?.type));
            if (types.size === 1 && !tiles.some(t => isHonorTile(t))) {
                this.addFan(fans, 'qingyise');
            }
            if (tiles.every(t => isNumberTile(t) && TILES[t].value % 2 === 0)) {
                this.addFan(fans, 'quanshuangke');
            }
            if (tiles.every(t => !isTerminalOrHonor(t))) {
                this.addFan(fans, 'duanyao');
            }
        }

        this.addConditionFans(fans);
        return fans;
    }

    detectFans(decomp, allTiles) {
        const fans = [];
        const { sets, pair } = decomp;
        const allSets = [...sets, ...this.melds];
        const tileCount = this.countTiles(allTiles);

        if (!fans.some(f => f.score >= 88)) this.check88Fan(fans, allSets, pair, allTiles, tileCount);
        if (!fans.some(f => f.score >= 64)) this.check64Fan(fans, allSets, pair, allTiles, tileCount);
        if (!fans.some(f => f.score >= 48)) this.check48Fan(fans, allSets, pair, allTiles, tileCount);
        if (!fans.some(f => f.score >= 32)) this.check32Fan(fans, allSets, pair, allTiles, tileCount);
        if (!fans.some(f => f.score >= 24)) this.check24Fan(fans, allSets, pair, allTiles, tileCount);
        
        this.checkLowerFans(fans, allSets, pair, allTiles, tileCount);
        this.addConditionFans(fans);
        this.addWinTypeFans(fans, decomp, allSets, pair);

        // 无番和：过滤掉花牌后，如果没有其他番种
        const nonFlowerFans = fans.filter(f => f.id !== 'huapai');
        if (nonFlowerFans.length === 0) {
            this.addFan(fans, 'wufanhe');
        }

        return this.applyExclusionRules(fans);
    }

    addWinTypeFans(fans, decomp, allSets, pair) {
        if (!this.winTile) return;
        const winType = this.detectWinType(decomp, allSets, pair, this.winTile);

        if (winType === 'bian') this.addFan(fans, 'bianzhang');
        else if (winType === 'kan') this.addFan(fans, 'kanzhang');
        else if (winType === 'dandiao') this.addFan(fans, 'dandiaojiang');
    }

    detectWinType(decomp, allSets, pair, winTile) {
        const { sets } = decomp;
        const tile = TILES[winTile];

        if (pair === winTile) {
            let countInSets = 0;
            for (const set of sets) {
                countInSets += set.tiles.filter(t => t === winTile).length;
            }
            const countInHand = this.hand.filter(t => t === winTile).length;
            if (countInSets === 0 || countInHand === 2) {
                return 'dandiao';
            }
        }

        if (!isNumberTile(winTile)) return null;
        const winValue = tile.value;

        for (const set of sets) {
            if (set.type !== 'chi') continue;
            if (!set.tiles.includes(winTile)) continue;

            const values = set.tiles.map(t => TILES[t].value).sort((a, b) => a - b);

            if (values[0] === 1 && values[2] === 3 && winValue === 3) return 'bian';
            if (values[0] === 7 && values[2] === 9 && winValue === 7) return 'bian';
            if (winValue === values[1]) return 'kan';
        }

        return null;
    }

    checkQuanQiuRen(allSets, pair) {
        const concealedCount = allSets.length - this.melds.length;
        if (concealedCount !== 0) return false;
        if (this.melds.length !== 4) return false;
        if (!this.melds.every(m => m.type === 'chi' || m.type === 'pong' || m.type === 'minggang')) return false;
        if (this.conditions.isSelfDrawn) return false;
        if (pair !== this.winTile) return false;
        return true;
    }

    // 动态应用"不计"规则
    applyExclusionRules(fans) {
        const excludedFanIds = new Set();

        for (const fan of fans) {
            const exclusions = EXCLUSION_RULES_BY_ID[fan.id];
            if (exclusions) {
                for (const excludedId of exclusions) {
                    excludedFanIds.add(excludedId);
                }
            }
        }

        return fans.filter(f => !excludedFanIds.has(f.id));
    }

    check88Fan(fans, allSets, pair, allTiles, tileCount) {
        const pongs = allSets.filter(s => s.type === 'pong' || s.type === 'minggang' || s.type === 'angang');
        
        if (pongs.filter(s => TILES[s.tiles[0]]?.type === TILE_TYPES.WIND).length === 4) this.addFan(fans, 'dasixi');
        if (pongs.filter(s => TILES[s.tiles[0]]?.type === TILE_TYPES.DRAGON).length === 3) this.addFan(fans, 'dasanyuan');
        if (allTiles.every(t => GREEN_TILES.includes(t))) this.addFan(fans, 'lvyise');
        if (this.checkJiuLianBaoDeng(tileCount)) this.addFan(fans, 'jiulianbaodeng');
        if (allSets.filter(s => s.type === 'minggang' || s.type === 'angang').length === 4) this.addFan(fans, 'sigang');
    }

    check64Fan(fans, allSets, pair, allTiles, tileCount) {
        const pongs = allSets.filter(s => s.type === 'pong' || s.type === 'minggang' || s.type === 'angang');
        
        if (allTiles.every(t => isTerminal(t))) this.addFan(fans, 'qingyaojiu');
        
        const windPongs = pongs.filter(s => TILES[s.tiles[0]]?.type === TILE_TYPES.WIND);
        if (windPongs.length === 3 && TILES[pair]?.type === TILE_TYPES.WIND) this.addFan(fans, 'xiaosixi');

        const dragonPongs = pongs.filter(s => TILES[s.tiles[0]]?.type === TILE_TYPES.DRAGON);
        if (dragonPongs.length === 2 && TILES[pair]?.type === TILE_TYPES.DRAGON) this.addFan(fans, 'xiaosanyuan');

        if (allTiles.every(t => isHonorTile(t))) this.addFan(fans, 'ziyise');

        const anPongs = allSets.filter(s => (s.type === 'pong' && !this.melds.includes(s)) || s.type === 'angang');
        if (anPongs.length === 4) this.addFan(fans, 'sianke');

        if (this.checkYiSeShuangLongHui(allSets, pair)) this.addFan(fans, 'yiseshuanglonghui');
    }

    check48Fan(fans, allSets, pair, allTiles, tileCount) {
        const chis = allSets.filter(s => s.type === 'chi');
        if (this.checkSameChiCount(chis, 4)) this.addFan(fans, 'yisesitongshun');
        if (this.checkSiJieGao(allSets)) this.addFan(fans, 'yisesijiegao');
    }

    check32Fan(fans, allSets, pair, allTiles, tileCount) {
        if (this.checkYiSeSiBuGao(allSets)) this.addFan(fans, 'yisesibugao');
        
        const gangs = allSets.filter(s => s.type === 'minggang' || s.type === 'angang');
        if (gangs.length === 3) this.addFan(fans, 'sangang');

        if (allTiles.every(t => isTerminalOrHonor(t)) && 
            allTiles.some(t => isTerminal(t)) && 
            allTiles.some(t => isHonorTile(t))) {
            this.addFan(fans, 'hunyaojiu');
        }
    }

    check24Fan(fans, allSets, pair, allTiles, tileCount) {
        const types = new Set(allTiles.map(t => TILES[t]?.type));
        if (types.size === 1 && !allTiles.some(t => isHonorTile(t))) this.addFan(fans, 'qingyise');

        const pongs = allSets.filter(s => s.type === 'pong' || s.type === 'minggang' || s.type === 'angang');
        if (pongs.length === 4 && allTiles.every(t => isNumberTile(t) && TILES[t].value % 2 === 0)) this.addFan(fans, 'quanshuangke');

        const chis = allSets.filter(s => s.type === 'chi');
        if (this.checkSameChiCount(chis, 3)) this.addFan(fans, 'yisesantongshun');
        if (this.checkSanJieGao(allSets)) this.addFan(fans, 'yisesanjiegao');

        if (allTiles.every(t => isNumberTile(t) && TILES[t].value >= 7)) this.addFan(fans, 'quanda');
        if (allTiles.every(t => isNumberTile(t) && TILES[t].value >= 4 && TILES[t].value <= 6)) this.addFan(fans, 'quanzhong');
        if (allTiles.every(t => isNumberTile(t) && TILES[t].value <= 3)) this.addFan(fans, 'quanxiao');
    }

    checkLowerFans(fans, allSets, pair, allTiles, tileCount) {
        const pongs = allSets.filter(s => s.type === 'pong' || s.type === 'minggang' || s.type === 'angang');
        const chis = allSets.filter(s => s.type === 'chi');
        const gangs = allSets.filter(s => s.type === 'minggang' || s.type === 'angang');

        // 16番
        if (this.checkQingLong(allSets)) this.addFan(fans, 'qinglong');
        if (this.checkSanSeShuangLongHui(allSets, pair)) this.addFan(fans, 'sanseshuanglonghui');
        if (this.checkYiSeSanBuGao(chis)) this.addFan(fans, 'yisesanbugao');
        if (this.checkSanTongKe(pongs)) this.addFan(fans, 'santongke');
        
        const anPongs = allSets.filter(s => (s.type === 'pong' && !this.melds.includes(s)) || s.type === 'angang');
        if (anPongs.length === 3) this.addFan(fans, 'sananke');
        if (this.checkQuanDaiWu(allSets, pair)) this.addFan(fans, 'quandaiwu');

        // 12番
        if (this.checkZuHeLong(allSets)) this.addFan(fans, 'zuhelong');
        if (allTiles.every(t => isNumberTile(t) && TILES[t].value >= 6)) this.addFan(fans, 'dayuwu');
        if (allTiles.every(t => isNumberTile(t) && TILES[t].value <= 4)) this.addFan(fans, 'xiaoyuwu');
        if (pongs.filter(s => TILES[s.tiles[0]]?.type === TILE_TYPES.WIND).length === 3) this.addFan(fans, 'sanfengke');

        // 8番
        if (this.checkHuaLong(chis)) this.addFan(fans, 'hualong');
        if (allTiles.every(t => REVERSIBLE_TILES.includes(t))) this.addFan(fans, 'tuibudao');
        if (this.checkSanSeSanTongShun(chis)) this.addFan(fans, 'sansesantongshun');
        if (this.checkSanSeSanJieGao(pongs)) this.addFan(fans, 'sansesanjiegao');

        // 6番
        if (pongs.length === 4) this.addFan(fans, 'pengpenghe');
        
        const numberTypes = new Set(allTiles.filter(t => isNumberTile(t)).map(t => TILES[t].type));
        if (numberTypes.size === 1 && allTiles.some(t => isHonorTile(t))) this.addFan(fans, 'hunyise');
        
        if (this.checkSanSeSanBuGao(chis)) this.addFan(fans, 'sansesanbugao');
        if (this.checkWuMenQi(allTiles)) this.addFan(fans, 'wumenqi');
        if (this.checkQuanQiuRen(allSets, pair)) this.addFan(fans, 'quanqiuren');
        if (gangs.filter(s => s.type === 'angang').length === 2) this.addFan(fans, 'shuangangang');
        if (pongs.filter(s => TILES[s.tiles[0]]?.type === TILE_TYPES.DRAGON).length === 2) this.addFan(fans, 'shuangjianke');

        // 4番
        if (this.checkQuanDaiYao(allSets, pair)) this.addFan(fans, 'quandaiyao');
        if (gangs.filter(s => s.type === 'minggang').length === 2) this.addFan(fans, 'shuangminggang');

        // 2番
        if (pongs.filter(s => TILES[s.tiles[0]]?.type === TILE_TYPES.DRAGON).length === 1) this.addFan(fans, 'jianke');
        
        let quanFengKe = null;
        let menFengKe = null;
        if (this.conditions.prevalentWind && this.conditions.prevalentWind !== 'none') {
            quanFengKe = pongs.find(s => s.tiles[0] === this.conditions.prevalentWind);
            if (quanFengKe) this.addFan(fans, 'quanfengke');
        }
        if (this.conditions.seatWind && this.conditions.seatWind !== 'none') {
            menFengKe = pongs.find(s => s.tiles[0] === this.conditions.seatWind);
            if (menFengKe && menFengKe !== quanFengKe) this.addFan(fans, 'menfengke');
        }

        if (chis.length === 4 && isNumberTile(pair)) this.addFan(fans, 'pinghe');
        if (anPongs.length === 2) this.addFan(fans, 'shuanganke');
        if (gangs.filter(s => s.type === 'angang').length === 1) this.addFan(fans, 'angang');
        if (allTiles.every(t => !isTerminalOrHonor(t))) this.addFan(fans, 'duanyao');
        if (this.checkShuangTongKe(pongs)) this.addFan(fans, 'shuangtongke');

        const siGuiYiCount = this.checkSiGuiYi(allSets, pair, allTiles);
        if (siGuiYiCount > 0) {
            this.addFan(fans, 'siguiyi', { score: 2 * siGuiYiCount, name: `四归一×${siGuiYiCount}` });
        }

        // 1番
        if (this.checkYiBanGao(chis)) this.addFan(fans, 'yibangao');
        if (this.checkXiXiangFeng(chis)) this.addFan(fans, 'xixiangfeng');
        if (this.checkLianLiu(chis)) this.addFan(fans, 'lianliu');
        if (this.checkLaoShaoFu(chis)) this.addFan(fans, 'laoshaofu');
        
        const yaoKeCount = pongs.filter(s => isTerminal(s.tiles[0])).length;
        if (yaoKeCount > 0) {
            this.addFan(fans, 'yaojiuke', { score: 1 * yaoKeCount, name: `幺九刻×${yaoKeCount}` });
        }

        if (gangs.filter(s => s.type === 'minggang').length === 1) this.addFan(fans, 'minggang');
        
        const suits = new Set(allTiles.filter(t => isNumberTile(t)).map(t => TILES[t].type));
        if (suits.size === 2 && !allTiles.some(t => isHonorTile(t))) this.addFan(fans, 'queyimen');
        if (!allTiles.some(t => isHonorTile(t)) && allTiles.length > 0) this.addFan(fans, 'wuzi');
    }

    addConditionFans(fans) {
        if (this.conditions.flowerCount > 0) {
            this.addFan(fans, 'huapai', { 
                name: `花牌×${this.conditions.flowerCount}`, 
                score: this.conditions.flowerCount 
            });
        }

        if (this.conditions.isLastTile) {
            this.addFan(fans, this.conditions.isSelfDrawn ? 'miaoshouhuichun' : 'haidilaoyue');
        }

        if (this.conditions.isKongDraw) {
            this.addFan(fans, this.conditions.isSelfDrawn ? 'gangshangkaihua' : 'qiangganghe');
        }

        if (this.conditions.isJuezhang) {
            this.addFan(fans, 'hujuezhang');
        }

        if (this.melds.length === 0 && this.conditions.isSelfDrawn) {
            this.addFan(fans, 'buqiuren');
        } else if (this.melds.length === 0 && !this.conditions.isSelfDrawn) {
            this.addFan(fans, 'menqianqing');
        } else if (this.conditions.isSelfDrawn) {
            this.addFan(fans, 'zimo');
        }
    }

    // === 辅助检测函数 (保持原有逻辑不变) ===
    checkJiuLianBaoDeng(tileCount) {
        const suits = ['w', 't', 'b'];
        for (const suit of suits) {
            const pattern = [3, 1, 1, 1, 1, 1, 1, 1, 3];
            let matches = true, extra = 0;
            for (let i = 1; i <= 9; i++) {
                const tileId = suit + i;
                const count = tileCount[tileId] || 0;
                if (count < pattern[i - 1]) { matches = false; break; }
                extra += count - pattern[i - 1];
            }
            if (matches && extra === 1 && Object.keys(tileCount).filter(t => !t.startsWith(suit)).length === 0) return true;
        }
        return false;
    }

    checkYiSeShuangLongHui(allSets, pair) {
        const chis = allSets.filter(s => s.type === 'chi');
        if (chis.length !== 4) return false;
        const tile = TILES[pair];
        if (!tile || !isNumberTile(pair) || tile.value !== 5) return false;
        const suit = pair.charAt(0);
        return chis.filter(c => c.tiles[0] === suit + '1').length === 2 && chis.filter(c => c.tiles[0] === suit + '7').length === 2;
    }

    checkSameChiCount(chis, count) {
        const chiMap = {};
        for (const chi of chis) {
            const key = chi.tiles.join(',');
            chiMap[key] = (chiMap[key] || 0) + 1;
        }
        return Object.values(chiMap).some(c => c >= count);
    }

    checkSiJieGao(allSets) {
        const pongs = allSets.filter(s => s.type === 'pong' || s.type === 'minggang' || s.type === 'angang');
        if (pongs.length !== 4) return false;
        const tiles = pongs.map(p => p.tiles[0]).filter(t => isNumberTile(t));
        if (tiles.length !== 4) return false;
        const suit = tiles[0].charAt(0);
        if (!tiles.every(t => t.charAt(0) === suit)) return false;
        const values = tiles.map(t => parseInt(t.charAt(1))).sort((a, b) => a - b);
        for (let i = 1; i < 4; i++) {
            if (values[i] !== values[i-1] + 1) return false;
        }
        return true;
    }

    checkSanJieGao(allSets) {
        const pongs = allSets.filter(s => s.type === 'pong' || s.type === 'minggang' || s.type === 'angang');
        for (const suit of ['w', 't', 'b']) {
            const suitPongs = pongs.filter(p => p.tiles[0].charAt(0) === suit);
            if (suitPongs.length >= 3) {
                const values = suitPongs.map(p => parseInt(p.tiles[0].charAt(1))).sort((a, b) => a - b);
                for (let i = 0; i <= values.length - 3; i++) {
                    if (values[i+1] === values[i] + 1 && values[i+2] === values[i] + 2) return true;
                }
            }
        }
        return false;
    }

    checkYiSeSiBuGao(allSets) {
        const chis = allSets.filter(s => s.type === 'chi');
        if (chis.length !== 4) return false;
        for (const suit of ['w', 't', 'b']) {
            const suitChis = chis.filter(c => c.tiles[0].charAt(0) === suit);
            if (suitChis.length === 4) {
                const starts = suitChis.map(c => parseInt(c.tiles[0].charAt(1))).sort((a, b) => a - b);
                if (starts[1] === starts[0] + 1 && starts[2] === starts[0] + 2 && starts[3] === starts[0] + 3) return true;
                if (starts[1] === starts[0] + 2 && starts[2] === starts[0] + 4 && starts[3] === starts[0] + 6) return true;
            }
        }
        return false;
    }

    checkYiSeSanBuGao(chis) {
        for (const suit of ['w', 't', 'b']) {
            const suitChis = chis.filter(c => c.tiles[0].charAt(0) === suit);
            if (suitChis.length >= 3) {
                const starts = suitChis.map(c => parseInt(c.tiles[0].charAt(1))).sort((a, b) => a - b);
                for (let i = 0; i <= starts.length - 3; i++) {
                    if (starts[i+1] === starts[i] + 1 && starts[i+2] === starts[i] + 2) return true;
                    if (starts[i+1] === starts[i] + 2 && starts[i+2] === starts[i] + 4) return true;
                }
            }
        }
        return false;
    }

    checkQingLong(allSets) {
        const chis = allSets.filter(s => s.type === 'chi');
        for (const suit of ['w', 't', 'b']) {
            if (chis.some(c => c.tiles[0] === suit + '1') && 
                chis.some(c => c.tiles[0] === suit + '4') && 
                chis.some(c => c.tiles[0] === suit + '7')) return true;
        }
        return false;
    }

    checkHuaLong(chis) {
        const segments = [{ start: 1, suits: [] }, { start: 4, suits: [] }, { start: 7, suits: [] }];
        for (const chi of chis) {
            const suit = chi.tiles[0].charAt(0);
            const start = parseInt(chi.tiles[0].charAt(1));
            if (start === 1) segments[0].suits.push(suit);
            if (start === 4) segments[1].suits.push(suit);
            if (start === 7) segments[2].suits.push(suit);
        }
        for (const s1 of segments[0].suits) {
            for (const s2 of segments[1].suits) {
                for (const s3 of segments[2].suits) {
                    if (s1 !== s2 && s2 !== s3 && s1 !== s3) return true;
                }
            }
        }
        return false;
    }

    checkSanTongKe(pongs) {
        const valueMap = {};
        for (const pong of pongs) {
            const tile = TILES[pong.tiles[0]];
            if (tile && isNumberTile(pong.tiles[0])) {
                const value = tile.value;
                valueMap[value] = (valueMap[value] || 0) + 1;
            }
        }
        return Object.values(valueMap).some(c => c >= 3);
    }

    checkSanSeSanTongShun(chis) {
        const chiMap = {};
        for (const chi of chis) {
            const value = parseInt(chi.tiles[0].charAt(1));
            if (!chiMap[value]) chiMap[value] = new Set();
            chiMap[value].add(chi.tiles[0].charAt(0));
        }
        return Object.values(chiMap).some(suits => suits.size >= 3);
    }

    checkSanSeSanJieGao(pongs) {
        const numberPongs = pongs.filter(p => isNumberTile(p.tiles[0]));
        if (numberPongs.length < 3) return false;
        for (let startValue = 1; startValue <= 7; startValue++) {
            const suits = { w: false, t: false, b: false };
            for (const pong of numberPongs) {
                const tile = TILES[pong.tiles[0]];
                const suit = pong.tiles[0].charAt(0);
                if (tile.value >= startValue && tile.value <= startValue + 2) {
                    if (!suits[suit]) suits[suit] = tile.value;
                }
            }
            const values = Object.values(suits).filter(v => v !== false).sort((a, b) => a - b);
            if (values.length === 3 && values[1] === values[0] + 1 && values[2] === values[0] + 2) return true;
        }
        return false;
    }

    checkQuanDaiWu(allSets, pair) {
        const tile = TILES[pair];
        if (!tile || !isNumberTile(pair) || tile.value !== 5) return false;
        for (const set of allSets) {
            if (!set.tiles.some(t => { const tObj = TILES[t]; return tObj && isNumberTile(t) && tObj.value === 5; })) return false;
        }
        return true;
    }

    checkQuanDaiYao(allSets, pair) {
        if (!isTerminalOrHonor(pair)) return false;
        for (const set of allSets) {
            if (!set.tiles.some(t => isTerminalOrHonor(t))) return false;
        }
        return true;
    }

    checkYiBanGao(chis) {
        const chiSet = {};
        for (const chi of chis) {
            const key = chi.tiles.join(',');
            chiSet[key] = (chiSet[key] || 0) + 1;
        }
        return Object.values(chiSet).some(c => c >= 2);
    }

    checkLianLiu(chis) {
        for (const suit of ['w', 't', 'b']) {
            const starts = chis.filter(c => c.tiles[0].charAt(0) === suit).map(c => parseInt(c.tiles[0].charAt(1)));
            for (let i = 0; i < starts.length; i++) {
                for (let j = i + 1; j < starts.length; j++) {
                    if (Math.abs(starts[i] - starts[j]) === 3) return true;
                }
            }
        }
        return false;
    }

    checkLaoShaoFu(chis) {
        for (const suit of ['w', 't', 'b']) {
            if (chis.some(c => c.tiles[0] === suit + '1') && chis.some(c => c.tiles[0] === suit + '7')) return true;
        }
        return false;
    }

    checkZuHeLong(allSets) {
        const chis = allSets.filter(s => s.type === 'chi');
        const allChiTiles = [];
        for (const chi of chis) allChiTiles.push(...chi.tiles);
        
        const patterns = [[1, 4, 7], [2, 5, 8], [3, 6, 9]];
        const hasSuits = { w: new Set(), t: new Set(), b: new Set() };
        for (const tile of allChiTiles) {
            if (isNumberTile(tile)) {
                hasSuits[tile.charAt(0)].add(parseInt(tile.charAt(1)));
            }
        }
        
        const suits = ['w', 't', 'b'];
        for (let i = 0; i < 6; i++) {
            const assignment = [suits[i % 3], suits[(i + 1) % 3], suits[(i + 2) % 3]];
            let valid = true;
            for (let p = 0; p < 3; p++) {
                for (const val of patterns[p]) {
                    if (!hasSuits[assignment[p]].has(val)) { valid = false; break; }
                }
                if (!valid) break;
            }
            if (valid) return true;
        }
        return false;
    }

    checkSanSeShuangLongHui(allSets, pair) {
        const chis = allSets.filter(s => s.type === 'chi');
        if (chis.length !== 4) return false;
        const tile = TILES[pair];
        if (!tile || !isNumberTile(pair) || tile.value !== 5) return false;
        
        const pairSuit = pair.charAt(0);
        const otherSuits = ['w', 't', 'b'].filter(s => s !== pairSuit);
        for (const suit of otherSuits) {
            if (chis.filter(c => c.tiles[0] === suit + '1').length !== 1 || 
                chis.filter(c => c.tiles[0] === suit + '7').length !== 1) return false;
        }
        return true;
    }

    checkSanSeSanBuGao(chis) {
        if (chis.length < 3) return false;
        const chisByStart = {};
        for (const chi of chis) {
            chisByStart[`${chi.tiles[0].charAt(0)}-${parseInt(chi.tiles[0].charAt(1))}`] = true;
        }
        for (let startVal = 1; startVal <= 7; startVal++) {
            const suits = ['w', 't', 'b'];
            for (let i = 0; i < 6; i++) {
                const assignment = [suits[i % 3], suits[(i + 1) % 3], suits[(i + 2) % 3]];
                if (chisByStart[`${assignment[0]}-${startVal}`] &&
                    chisByStart[`${assignment[1]}-${startVal + 1}`] &&
                    chisByStart[`${assignment[2]}-${startVal + 2}`]) return true;
            }
        }
        return false;
    }

    checkWuMenQi(allTiles) {
        return allTiles.some(t => TILES[t]?.type === TILE_TYPES.WAN) &&
               allTiles.some(t => TILES[t]?.type === TILE_TYPES.TIAO) &&
               allTiles.some(t => TILES[t]?.type === TILE_TYPES.BING) &&
               allTiles.some(t => TILES[t]?.type === TILE_TYPES.WIND) &&
               allTiles.some(t => TILES[t]?.type === TILE_TYPES.DRAGON);
    }

    checkSiGuiYi(allSets, pair, allTiles) {
        const tileCount = this.countTiles(allTiles);
        let count = 0;
        for (const [tileId, num] of Object.entries(tileCount)) {
            if (num !== 4) continue;
            const inGang = allSets.some(s => (s.type === 'minggang' || s.type === 'angang') && s.tiles[0] === tileId);
            if (!inGang) count++;
        }
        return count;
    }

    checkShuangTongKe(pongs) {
        const valueCount = {};
        for (const pong of pongs) {
            const tile = TILES[pong.tiles[0]];
            if (tile && isNumberTile(pong.tiles[0])) {
                const value = tile.value;
                valueCount[value] = (valueCount[value] || 0) + 1;
            }
        }
        return Object.values(valueCount).some(c => c >= 2);
    }

    checkXiXiangFeng(chis) {
        const chiMap = {};
        for (const chi of chis) {
            const start = parseInt(chi.tiles[0].charAt(1));
            if (!chiMap[start]) chiMap[start] = new Set();
            chiMap[start].add(chi.tiles[0].charAt(0));
        }
        return Object.values(chiMap).some(suits => suits.size >= 2);
    }
}

const analyzer = new MahjongAnalyzer();