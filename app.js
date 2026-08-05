// 渲染番种参考面板 (视图层逻辑)
function renderRulesReference() {
    const rulesContainer = document.getElementById('rulesContent');
    if (!rulesContainer || typeof FANS_DATA === 'undefined') return;

    // 1. 按番数对 FANS_DATA 进行分组
    const groupedFans = {};
    FANS_DATA.forEach(fan => {
        if (!groupedFans[fan.score]) {
            groupedFans[fan.score] = [];
        }
        groupedFans[fan.score].push(fan);
    });

    // 2. 获取番数并按从大到小排序
    const sortedScores = Object.keys(groupedFans)
        .map(Number)
        .sort((a, b) => b - a);

    // 3. 拼接 HTML
    let html = '';

    sortedScores.forEach(score => {
        const fans = groupedFans[score];
        html += `
            <details>
                <summary>${score}番 (${fans.length}种)</summary>
                <ul>
                    ${fans.map(f => `<li><strong>${f.name}</strong> - ${f.desc}</li>`).join('')}
                </ul>
            </details>
        `;
    });

    // 4. 追加静态的"使用说明" (从配置中读取)
    if (typeof USAGE_GUIDE !== 'undefined') {
        html += `
            <details>
                <summary>使用说明</summary>
                <ul>
                    ${USAGE_GUIDE.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </details>
        `;
    }

    // 5. 渲染页面
    rulesContainer.innerHTML = html;
}

// DOM 加载完成后执行渲染
document.addEventListener('DOMContentLoaded', renderRulesReference);


// 国标麻将算番器 - 主应用逻辑 (业务层)
class MahjongApp {
    constructor() {
        this.hand = [];
        this.melds = [];
        this.winTile = null;
        this.winTileIndex = -1;
        this.selectingWinTile = false;
        this.tileUsage = {};
        this.maxTileCount = 4;
        
        this.meldModal = {
            type: null,
            selectedTiles: []
        };

        this.init();
    }

    init() {
        this.initTileUsage();
        this.bindEvents();
        this.updateDisplay();
    }

    initTileUsage() {
        for (const tileId of Object.keys(TILES)) {
            this.tileUsage[tileId] = 0;
        }
    }

    // 渲染分类牌组（通用方法：用于选牌弹窗和副露弹窗） - 内联样式（标签与牌同行）
    renderCategorizedTilesInline(containerId, tileGroups, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const { disabledCheck = null } = options;

        const groupNames = {
            wan: '萬',
            tiao: '條',
            bing: '餅',
            wind: '風',
            dragon: '箭'
        };

        let html = '';
        for (const [groupType, tileIds] of Object.entries(tileGroups)) {
            html += `<div class="tile-row-inline">`;
            html += `<span class="tile-group-label">${groupNames[groupType] || groupType}</span>`;
            html += `<div class="tile-row-items">`;
            for (const tileId of tileIds) {
                const tile = TILES[tileId];
                const remaining = this.maxTileCount - this.tileUsage[tileId];
                let isDisabled = remaining === 0;
                if (disabledCheck && typeof disabledCheck === 'function') {
                    isDisabled = disabledCheck(tileId, remaining);
                }
                html += `
                    <div class="tile-btn ${isDisabled ? 'disabled' : ''}" data-tile="${tileId}">
                        <span class="tile-char">${tile.unicode}</span>
                        <span class="tile-count">${remaining}</span>
                    </div>
                `;
            }
            html += `</div></div>`;
        }

        container.innerHTML = html;
    }

    // 渲染手牌预览区（与主UI手牌样式一致）
    renderHandPreview() {
        const container = document.getElementById('selectedHandTiles');
        const previewBox = document.getElementById('selectedHandPreview');
        if (!container || !previewBox) return;

        const totalTiles = this.hand.length + this.melds.reduce((sum, m) => sum + m.tiles.length, 0);
        if (this.hand.length === 0) {
            previewBox.classList.add('empty');
            container.innerHTML = '<span class="preview-empty">未选择</span>';
            return;
        }
        previewBox.classList.remove('empty');

        const indexedHand = this.hand.map((tileId, index) => ({ tileId, originalIndex: index }));
        indexedHand.sort((a, b) => {
            const tileA = TILES[a.tileId];
            const tileB = TILES[b.tileId];
            const typeOrder = { wan: 0, tiao: 1, bing: 2, wind: 3, dragon: 4 };
            if (tileA.type !== tileB.type) return typeOrder[tileA.type] - typeOrder[tileB.type];
            if (typeof tileA.value === 'number' && typeof tileB.value === 'number') return tileA.value - tileB.value;
            return 0;
        });

        container.innerHTML = indexedHand.map(({ tileId, originalIndex }) => {
            const tile = TILES[tileId];
            const isWinTile = originalIndex === this.winTileIndex;
            return `
                <div class="hand-tile preview-hand-tile ${isWinTile ? 'win-tile-highlight' : ''}" data-hand-index="${originalIndex}" title="点击移除 ${tile.name}">
                    <span class="tile-char">${tile.unicode}</span>
                    ${isWinTile ? '<span class="win-marker">和</span>' : ''}
                </div>
            `;
        }).join('');
    }

    // 渲染副露预览区（点击可移除）
    renderMeldPreview() {
        const container = document.getElementById('selectedMeldTiles');
        const previewBox = document.getElementById('selectedMeldPreview');
        if (!container || !previewBox) return;

        const tiles = this.meldModal.selectedTiles;
        if (tiles.length === 0) {
            previewBox.classList.add('empty');
            container.innerHTML = '<span class="preview-empty">未选择</span>';
            return;
        }
        previewBox.classList.remove('empty');

        container.innerHTML = tiles.map((tileId, idx) => {
            const tile = TILES[tileId];
            return `
                <div class="hand-tile preview-hand-tile" data-meld-selection-index="${idx}" title="点击移除 ${tile.name}">
                    <span class="tile-char">${tile.unicode}</span>
                </div>
            `;
        }).join('');
    }

    bindEvents() {
        // 手牌展示区域：点击背景添加牌，点击单牌移除/选为和牌
        document.getElementById('handDisplay')?.addEventListener('click', (e) => {
            const tileEl = e.target.closest('.hand-tile');
            if (tileEl) {
                const index = parseInt(tileEl.dataset.index);
                if (this.selectingWinTile) {
                    this.setWinTile(index);
                } else {
                    this.removeTileFromHand(index);
                }
            } else {
                if (!this.selectingWinTile) {
                    this.openTileSelectorModal();
                }
            }
        });

        document.getElementById('clearHand')?.addEventListener('click', () => this.clearHand());
        document.getElementById('undoTile')?.addEventListener('click', () => this.undoLastTile());

        // 副露按钮
        document.getElementById('addChi')?.addEventListener('click', () => this.openMeldModal('chi'));
        document.getElementById('addPong')?.addEventListener('click', () => this.openMeldModal('pong'));
        document.getElementById('addMingGang')?.addEventListener('click', () => this.openMeldModal('minggang'));
        document.getElementById('addAnGang')?.addEventListener('click', () => this.openMeldModal('angang'));
        document.getElementById('clearMelds')?.addEventListener('click', () => this.clearMelds());

        // ========== 通用选牌弹窗事件 ==========
        document.getElementById('tileSelectorClose')?.addEventListener('click', () => this.closeTileSelectorModal());
        document.getElementById('tileSelectorDone')?.addEventListener('click', () => this.closeTileSelectorModal());
        document.getElementById('tileSelectorCancel')?.addEventListener('click', () => {
            this.clearHand();
            this.refreshTileSelector();
        });

        // 选牌弹窗：点击牌添加
        document.getElementById('selectorTiles')?.addEventListener('click', (e) => {
            const tileBtn = e.target.closest('.tile-btn');
            if (tileBtn && !tileBtn.classList.contains('disabled')) {
                this.addTileToHand(tileBtn.dataset.tile);
                this.refreshTileSelector();
            }
        });

        // 选牌弹窗：点击预览区手牌移除
        document.getElementById('selectedHandTiles')?.addEventListener('click', (e) => {
            const tileEl = e.target.closest('.preview-hand-tile');
            if (tileEl) {
                const index = parseInt(tileEl.dataset.handIndex);
                if (!isNaN(index)) {
                    this.removeTileFromHand(index);
                    this.refreshTileSelector();
                }
            }
        });

        // ========== 副露弹窗事件 ==========
        document.getElementById('modalClose')?.addEventListener('click', () => this.closeMeldModal());
        document.getElementById('modalCancel')?.addEventListener('click', () => this.closeMeldModal());
        document.getElementById('modalConfirm')?.addEventListener('click', () => this.confirmMeld());

        // 副露弹窗：点击牌选择
        document.getElementById('modalTiles')?.addEventListener('click', (e) => {
            const tileBtn = e.target.closest('.tile-btn');
            if (tileBtn && !tileBtn.classList.contains('disabled')) {
                this.selectMeldTile(tileBtn.dataset.tile);
            }
        });

        // 副露弹窗：点击预览区移除
        document.getElementById('selectedMeldTiles')?.addEventListener('click', (e) => {
            const tileEl = e.target.closest('.preview-hand-tile');
            if (tileEl) {
                const idx = parseInt(tileEl.dataset.meldSelectionIndex);
                if (!isNaN(idx)) {
                    this.removeMeldSelectedTile(idx);
                }
            }
        });

        document.getElementById('calculateBtn')?.addEventListener('click', () => this.calculate());

        // 和牌条件变化
        document.querySelectorAll('.conditions-section select, .conditions-section input').forEach(el => {
            el.addEventListener('change', () => this.updateConditions());
        });

        // 和牌选择
        document.getElementById('selectWinTile')?.addEventListener('click', () => this.startWinTileSelection());
        document.getElementById('clearWinTile')?.addEventListener('click', () => this.clearWinTile());
    }

    // ============ 通用选牌弹窗 (添加手牌) ============
    openTileSelectorModal() {
        const totalTiles = this.hand.length + this.melds.reduce((sum, m) => sum + m.tiles.length, 0);
        if (totalTiles >= 14) {
            this.showMessage('手牌已满（最多14张）');
            return;
        }

        const modal = document.getElementById('tileSelectorModal');
        modal.classList.add('show');
        this.refreshTileSelector();
    }

    refreshTileSelector() {
        const tileGroups = { ...TILES_BY_TYPE };
        this.renderCategorizedTilesInline('selectorTiles', tileGroups);
        this.renderHandPreview();
    }

    closeTileSelectorModal() {
        document.getElementById('tileSelectorModal').classList.remove('show');
    }

    // ============ 和牌选择 ============
    startWinTileSelection() {
        if (this.hand.length === 0) {
            this.showMessage('请先添加手牌');
            return;
        }
        
        this.selectingWinTile = true;
        document.getElementById('handDisplay')?.classList.add('selecting-win-tile');
        document.getElementById('selectWinTile')?.classList.add('active');
        this.showMessage('👆 请点击手牌中的一张作为和牌');
    }

    cancelWinTileSelection() {
        this.selectingWinTile = false;
        document.getElementById('handDisplay')?.classList.remove('selecting-win-tile');
        document.getElementById('selectWinTile')?.classList.remove('active');
    }

    setWinTile(index) {
        if (index >= 0 && index < this.hand.length) {
            this.winTile = this.hand[index];
            this.winTileIndex = index;
            this.cancelWinTileSelection();
            
            this.showMessage(`已选择 ${TILES[this.winTile].name} 作为和牌`);
            this.updateWinTileDisplay();
            this.updateHandDisplay();
            this.calculate();
        }
    }

    clearWinTile() {
        this.winTile = null;
        this.winTileIndex = -1;
        this.cancelWinTileSelection();
        
        this.updateWinTileDisplay();
        this.updateHandDisplay();
    }

    updateWinTileDisplay() {
        const container = document.getElementById('winTileDisplay');
        if (!container) return;

        if (this.winTile) {
            const tile = TILES[this.winTile];
            container.innerHTML = `<span class="win-tile-char">${tile.unicode}</span><span class="win-tile-name">${tile.name}</span>`;
        } else {
            container.innerHTML = '<span class="placeholder">未选择</span>';
        }
    }

    // ============ 手牌操作 ============
    addTileToHand(tileId) {
        const totalTiles = this.hand.length + this.melds.reduce((sum, m) => sum + m.tiles.length, 0);
        if (totalTiles >= 14) {
            this.showMessage('手牌已满（最多14张）');
            return;
        }

        if (this.tileUsage[tileId] >= this.maxTileCount) {
            this.showMessage('该牌已用完');
            return;
        }

        this.hand.push(tileId);
        this.tileUsage[tileId]++;
        this.updateDisplay();
    }

    removeTileFromHand(index) {
        if (index >= 0 && index < this.hand.length) {
            const tileId = this.hand[index];
            this.hand.splice(index, 1);
            this.tileUsage[tileId]--;
            
            if (index === this.winTileIndex) {
                this.winTile = null;
                this.winTileIndex = -1;
            } else if (index < this.winTileIndex) {
                this.winTileIndex--;
            }
            
            this.updateDisplay();
        }
    }

    undoLastTile() {
        if (this.hand.length > 0) {
            const tileId = this.hand.pop();
            this.tileUsage[tileId]--;
            this.updateDisplay();
        }
    }

    clearHand() {
        for (const tileId of this.hand) {
            this.tileUsage[tileId]--;
        }
        this.hand = [];
        this.winTile = null;
        this.winTileIndex = -1;
        this.updateDisplay();
    }

    clearMelds() {
        for (const meld of this.melds) {
            for (const tileId of meld.tiles) {
                this.tileUsage[tileId]--;
            }
        }
        this.melds = [];
        this.updateDisplay();
    }

    // ============ 副露弹窗 ============
    openMeldModal(type) {
        this.meldModal = { type, selectedTiles: [] };
        
        const modal = document.getElementById('meldModal');
        const title = document.getElementById('modalTitle');
        const instruction = document.getElementById('modalInstruction');
        
        const typeNames = { chi: '吃', pong: '碰', minggang: '明杠', angang: '暗杠' };
        title.textContent = `添加${typeNames[type]}`;
        
        if (type === 'chi') instruction.textContent = '请依次选择3张连续的序数牌（点击预览区可移除）';
        else if (type === 'pong') instruction.textContent = '请选择1张牌（自动组成3张，点击预览区可移除）';
        else instruction.textContent = '请选择1张牌（自动组成4张，点击预览区可移除）';

        this.renderMeldModalTiles();
        this.renderMeldPreview();
        modal.classList.add('show');
    }

    renderMeldModalTiles() {
        let tileGroups;
        const { type } = this.meldModal;

        if (type === 'chi') {
            tileGroups = {
                wan: TILES_BY_TYPE.wan,
                tiao: TILES_BY_TYPE.tiao,
                bing: TILES_BY_TYPE.bing
            };
        } else {
            tileGroups = { ...TILES_BY_TYPE };
        }

        const disabledCheck = (tileId, remaining) => {
            const neededCount = type === 'chi' ? 1 : (type === 'pong' ? 3 : 4);
            return remaining < neededCount;
        };

        this.renderCategorizedTilesInline('modalTiles', tileGroups, { disabledCheck });
    }

    selectMeldTile(tileId) {
        const { type, selectedTiles } = this.meldModal;
        
        if (type === 'chi') {
            if (selectedTiles.length < 3) {
                if (selectedTiles.length === 0) {
                    selectedTiles.push(tileId);
                } else {
                    const firstTile = TILES[selectedTiles[0]];
                    const newTile = TILES[tileId];
                    
                    if (firstTile.type === newTile.type && isNumberTile(tileId)) {
                        selectedTiles.push(tileId);
                        selectedTiles.sort((a, b) => TILES[a].value - TILES[b].value);
                    } else {
                        this.showMessage('吃必须是同花色的序数牌');
                        return;
                    }
                }
            } else {
                this.showMessage('吃最多选3张牌');
                return;
            }
        } else {
            this.meldModal.selectedTiles = [tileId];
        }

        this.renderMeldModalTiles();
        this.renderMeldPreview();
    }

    // 副露预览区：点击移除指定索引的牌
    removeMeldSelectedTile(index) {
        const { type, selectedTiles } = this.meldModal;
        if (index < 0 || index >= selectedTiles.length) return;

        selectedTiles.splice(index, 1);
        // 碰/杠只选1张的情况，直接清空
        if (type !== 'chi') {
            this.meldModal.selectedTiles = [];
        }
        this.renderMeldModalTiles();
        this.renderMeldPreview();
    }

    confirmMeld() {
        const { type, selectedTiles } = this.meldModal;
        
        if (type === 'chi') {
            if (selectedTiles.length !== 3) {
                this.showMessage('请选择3张牌');
                return;
            }
            selectedTiles.sort((a, b) => TILES[a].value - TILES[b].value);
            const values = selectedTiles.map(t => TILES[t].value);
            if (values[1] !== values[0] + 1 || values[2] !== values[1] + 1) {
                this.showMessage('顺子必须是连续的3张牌');
                return;
            }
            for (const tileId of selectedTiles) {
                if (this.tileUsage[tileId] >= this.maxTileCount) {
                    this.showMessage(`${TILES[tileId].name}已用完`);
                    return;
                }
            }
            const meld = { type: 'chi', tiles: [...selectedTiles] };
            this.melds.push(meld);
            for (const tileId of selectedTiles) {
                this.tileUsage[tileId]++;
            }
        } else {
            if (selectedTiles.length !== 1) {
                this.showMessage('请选择1张牌');
                return;
            }
            
            const tileId = selectedTiles[0];
            const count = type === 'pong' ? 3 : 4;
            
            if (this.tileUsage[tileId] + count > this.maxTileCount) {
                this.showMessage(`${TILES[tileId].name}数量不足`);
                return;
            }

            const meld = { type: type, tiles: Array(count).fill(tileId) };
            this.melds.push(meld);
            this.tileUsage[tileId] += count;
        }

        this.closeMeldModal();
        this.updateDisplay();
    }

    closeMeldModal() {
        document.getElementById('meldModal').classList.remove('show');
        this.meldModal = { type: null, selectedTiles: [] };
    }

    removeMeld(index) {
        if (index >= 0 && index < this.melds.length) {
            const meld = this.melds[index];
            for (const tileId of meld.tiles) {
                this.tileUsage[tileId]--;
            }
            this.melds.splice(index, 1);
            this.updateDisplay();
        }
    }

    // ============ 展示更新 ============
    updateDisplay() {
        this.updateHandDisplay();
        this.updateMeldsDisplay();
        this.updateHandCount();
        this.updateWinTileDisplay();

        // 如果选牌弹窗打开，同步刷新预览
        const modal = document.getElementById('tileSelectorModal');
        if (modal && modal.classList.contains('show')) {
            this.refreshTileSelector();
        }
    }

    updateHandDisplay() {
        const container = document.getElementById('handDisplay');
        if (!container) return;

        if (this.hand.length === 0) {
            container.innerHTML = '<p class="placeholder">点击选择麻将牌</p>';
            return;
        }

        const indexedHand = this.hand.map((tileId, index) => ({ tileId, originalIndex: index }));
        
        indexedHand.sort((a, b) => {
            const tileA = TILES[a.tileId];
            const tileB = TILES[b.tileId];
            const typeOrder = { wan: 0, tiao: 1, bing: 2, wind: 3, dragon: 4 };
            if (tileA.type !== tileB.type) return typeOrder[tileA.type] - typeOrder[tileB.type];
            if (typeof tileA.value === 'number' && typeof tileB.value === 'number') return tileA.value - tileB.value;
            return 0;
        });

        const selectingClass = this.selectingWinTile ? 'selecting-win-tile' : '';
        container.innerHTML = indexedHand.map(({ tileId, originalIndex }) => {
            const tile = TILES[tileId];
            const isWinTile = originalIndex === this.winTileIndex;
            const title = this.selectingWinTile ? '点击选为和牌' : '点击移除';
            return `
                <div class="hand-tile ${isWinTile ? 'win-tile-highlight' : ''}" data-index="${originalIndex}" title="${title}">
                    <span class="tile-char">${tile.unicode}</span>
                    ${isWinTile ? '<span class="win-marker">和</span>' : ''}
                </div>
            `;
        }).join('');
    }

    updateMeldsDisplay() {
        const container = document.getElementById('meldsDisplay');
        if (!container) return;

        if (this.melds.length === 0) {
            container.innerHTML = '<p class="placeholder">点击下方按钮添加副露</p>';
            return;
        }

        container.innerHTML = this.melds.map((meld, meldIndex) => {
            const typeNames = { chi: '吃', pong: '碰', minggang: '明杠', angang: '暗杠' };
            const tilesHtml = meld.tiles.map(tileId => {
                const tile = TILES[tileId];
                return `<span class="meld-tile ${meld.type === 'angang' ? 'face-down' : ''}">${tile.unicode}</span>`;
            }).join('');
            
            return `
                <div class="meld-group" data-meld-index="${meldIndex}">
                    <div class="meld-tiles">${tilesHtml}</div>
                    <div class="meld-label">${typeNames[meld.type]}</div>
                    <button class="meld-remove" onclick="app.removeMeld(${meldIndex})">✕</button>
                </div>
            `;
        }).join('');
    }

    updateHandCount() {
        const countEl = document.getElementById('handCount');
        if (countEl) {
            const totalTiles = this.hand.length + this.melds.reduce((sum, m) => sum + m.tiles.length, 0);
            countEl.textContent = totalTiles;
        }
    }

    updateConditions() {}

    getConditions() {
        const winTypeRadio = document.querySelector('input[name="winType"]:checked');
        return {
            isSelfDrawn: winTypeRadio ? winTypeRadio.value === 'zimo' : false,
            prevalentWind: document.getElementById('prevalentWind')?.value || 'east',
            seatWind: document.getElementById('seatWind')?.value || 'east',
            flowerCount: parseInt(document.getElementById('flowerCount')?.value || '0'),
            isLastTile: document.getElementById('isLastTile')?.checked || false,
            isKongDraw: document.getElementById('isKongDraw')?.checked || false,
            isJuezhang: document.getElementById('isJuezhang')?.checked || false
        };
    }

    calculate() {
        const totalTiles = this.hand.length + this.melds.reduce((sum, m) => sum + m.tiles.length, 0);
        
        if (totalTiles !== 14) {
            this.showResult({ valid: false, message: `牌数不正确，当前${totalTiles}张，需要14张` });
            return;
        }

        if (!this.winTile) {
            this.showResult({ valid: false, message: '请先选择和牌（点击"和牌"区域，然后点击手牌中的一张）' });
            return;
        }

        const conditions = this.getConditions();
        analyzer.setHand(this.hand, this.melds, this.winTile, conditions);
        const result = analyzer.analyze();
        
        // 计算最终总分
        result.totalScore = result.fans.reduce((sum, f) => sum + f.score, 0);
        
        this.showResult(result);
    }

    showResult(result) {
        const scoreEl = document.getElementById('totalScore');
        const fansEl = document.getElementById('detectedFans');

        if (!result.valid) {
            scoreEl.textContent = '0';
            fansEl.innerHTML = `<p class="error-message">❌ ${result.message || '无法和牌'}</p>`;
            return;
        }

        scoreEl.textContent = result.totalScore;
        scoreEl.style.transform = 'scale(1.2)';
        setTimeout(() => { scoreEl.style.transform = 'scale(1)'; }, 200);

        if (result.fans.length === 0) {
            fansEl.innerHTML = '<p class="placeholder">无番和（8番起和）</p>';
            return;
        }

        const sortedFans = [...result.fans].sort((a, b) => b.score - a.score);
        
        fansEl.innerHTML = sortedFans.map(fan => `
            <span class="fan-tag" title="${fan.desc || ''}">
                ${fan.name}
                <span class="fan-value">${fan.score}番</span>
            </span>
        `).join('');

        if (result.totalScore < 8) {
            fansEl.innerHTML += '<p class="warning-message">⚠️ 未满8番，不能和牌</p>';
        }
    }

    showMessage(msg) {
        const existing = document.querySelector('.toast-message');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = msg;
        document.body.appendChild(toast);

        setTimeout(() => { toast.classList.add('show'); }, 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// 初始化应用
const app = new MahjongApp();
