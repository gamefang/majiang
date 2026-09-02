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
        this.activeFanTooltip = null;

        this.meldModal = {
            pendingTiles: [],   // 尚未成组的单牌（用户当前正在输入）
            groups: [],         // 已识别的 meld 组 { type, tiles }
            selectedGroupIdx: -1 // 当前选中的组 (用于切换杠类型)
        };

        this.init();
    }

    init() {
        this.initTileUsage();
        this.bindEvents();
        this.updateDisplay();
        this.bindGlobalTooltipEvents();
    }

    initTileUsage() {
        for (const tileId of Object.keys(TILES)) {
            this.tileUsage[tileId] = 0;
        }
    }

    // 全局tooltip事件：点击页面其它地方关闭展开的番名tooltip
    bindGlobalTooltipEvents() {
        document.addEventListener('click', (e) => {
            if (this.activeFanTooltip && !e.target.closest('.fan-tag')) {
                this.closeFanTooltip();
            }
        });
    }

    // 关闭当前展开的番名tooltip
    closeFanTooltip() {
        if (this.activeFanTooltip) {
            this.activeFanTooltip.classList.remove('fan-tag-tip-active');
            const tip = this.activeFanTooltip.querySelector('.fan-tag-tip');
            if (tip) tip.remove();
            this.activeFanTooltip = null;
        }
    }

    // 切换番名tooltip的显示（用于手机点击）
    toggleFanTooltip(fanEl, desc) {
        if (this.activeFanTooltip && this.activeFanTooltip !== fanEl) {
            this.closeFanTooltip();
        }

        if (fanEl.classList.contains('fan-tag-tip-active')) {
            this.closeFanTooltip();
        } else {
            const tip = document.createElement('div');
            tip.className = 'fan-tag-tip';
            tip.textContent = desc;
            fanEl.appendChild(tip);
            fanEl.classList.add('fan-tag-tip-active');
            this.activeFanTooltip = fanEl;
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

    // 渲染副露弹窗：当前尚未成组的输入单牌预览
    renderMeldPreview() {
        const container = document.getElementById('selectedMeldTiles');
        const previewBox = document.getElementById('selectedMeldPreview');
        if (!container || !previewBox) return;

        const tiles = this.meldModal.pendingTiles;
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

    // 渲染副露弹窗：已识别成组的预览区 + 选中态 + 杠切换
    renderMeldGroupsPreview() {
        const listEl = document.getElementById('meldGroupsPreviewList');
        const switcherEl = document.getElementById('gangSwitcher');
        const gangMingRadio = document.getElementById('gangMingRadio');
        const gangAnRadio = document.getElementById('gangAnRadio');
        if (!listEl) return;

        const { groups, selectedGroupIdx } = this.meldModal;
        if (groups.length === 0) {
            listEl.innerHTML = '<span class="preview-empty">暂无副露</span>';
            if (switcherEl) switcherEl.style.display = 'none';
            return;
        }

        const typeNames = { chi: '吃', pong: '碰', minggang: '明杠', angang: '暗杠' };
        listEl.innerHTML = groups.map((g, gIdx) => {
            const selectedClass = gIdx === selectedGroupIdx ? 'selected' : '';
            const tilesHtml = g.tiles.map((tileId, tileIdx) => {
                const tile = TILES[tileId];
                const isFaceDown = g.type === 'angang' && tileIdx > 0;
                return `<span class="preview-meld-tile ${isFaceDown ? 'face-down' : ''}">${isFaceDown ? '' : tile.unicode}</span>`;
            }).join('');
            return `
                <div class="preview-meld-group ${selectedClass}" data-group-idx="${gIdx}">
                    <div class="preview-meld-tiles">${tilesHtml}</div>
                    <div class="preview-meld-label">${typeNames[g.type] || g.type}</div>
                    <button class="preview-meld-remove" data-group-remove="${gIdx}" title="删除该组">✕</button>
                </div>
            `;
        }).join('');

        // 选中态是一个杠 => 显示切换按钮
        if (switcherEl) {
            const selG = groups[selectedGroupIdx];
            if (selG && (selG.type === 'minggang' || selG.type === 'angang')) {
                switcherEl.style.display = 'flex';
                if (gangMingRadio) gangMingRadio.checked = selG.type === 'minggang';
                if (gangAnRadio) gangAnRadio.checked = selG.type === 'angang';
            } else {
                switcherEl.style.display = 'none';
            }
        }
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

        // 副露展示区点击 => 打开副露弹窗（替代原来的按钮）
        document.getElementById('meldsDisplay')?.addEventListener('click', () => this.openMeldModal());
        document.getElementById('clearMelds')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearMelds();
        });

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
        // Cancel = 清空当前 pending tiles
        document.getElementById('modalCancel')?.addEventListener('click', () => {
            this.resetMeldModalPending();
        });
        document.getElementById('modalConfirm')?.addEventListener('click', () => this.confirmMeld());

        // 副露弹窗：点击牌选择
        document.getElementById('modalTiles')?.addEventListener('click', (e) => {
            const tileBtn = e.target.closest('.tile-btn');
            if (tileBtn && !tileBtn.classList.contains('disabled')) {
                this.selectMeldTile(tileBtn.dataset.tile);
            }
        });

        // 副露弹窗：点击预览区（pending）移除单牌
        document.getElementById('selectedMeldTiles')?.addEventListener('click', (e) => {
            const tileEl = e.target.closest('.preview-hand-tile');
            if (tileEl) {
                const idx = parseInt(tileEl.dataset.meldSelectionIndex);
                if (!isNaN(idx)) {
                    this.removeMeldSelectedTile(idx);
                }
            }
        });

        // 副露弹窗：点击 groups 预览 - 选中组 / 删除组
        document.getElementById('meldGroupsPreviewList')?.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('[data-group-remove]');
            if (removeBtn) {
                e.stopPropagation();
                const idx = parseInt(removeBtn.dataset.groupRemove);
                if (!isNaN(idx)) this.removeMeldGroup(idx);
                return;
            }
            const grp = e.target.closest('.preview-meld-group');
            if (grp) {
                const idx = parseInt(grp.dataset.groupIdx);
                if (!isNaN(idx)) this.toggleSelectMeldGroup(idx);
            }
        });

        // 副露弹窗：杠类型单选切换
        const gangSwitcher = document.getElementById('gangSwitcher');
        if (gangSwitcher) {
            gangSwitcher.addEventListener('change', (e) => {
                if (e.target?.name === 'gangType') {
                    this.setGangType(e.target.value);
                }
            });
        }

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
        const totalTiles = this.getTotalTiles();
        if (totalTiles >= this.getExpectedTotalTiles()) {
            this.showMessage('手牌已满');
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
        const totalTiles = this.getTotalTiles();
        if (totalTiles >= this.getExpectedTotalTiles()) {
            this.showMessage('手牌已满');
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

    // ============ 副露弹窗（自动成组模式）============
    openMeldModal() {
        this.meldModal = {
            pendingTiles: [],
            groups: JSON.parse(JSON.stringify(this.melds)), // 深拷貝主頁當前副露同步到彈窗
            selectedGroupIdx: -1
        };

        const modal = document.getElementById('meldModal');
        modal.classList.add('show');
        this.refreshMeldModal();
    }

    resetMeldModalPending() {
        this.meldModal.pendingTiles = [];
        this.meldModal.selectedGroupIdx = -1;
        this.refreshMeldModal();
    }

    refreshMeldModal() {
        this.renderMeldModalTiles();
        this.renderMeldPreview();
        this.renderMeldGroupsPreview();
    }

    renderMeldModalTiles() {
        const tileGroups = { ...TILES_BY_TYPE };
        // 重新計算彈窗內剩餘可用牌數：4 - 手牌佔用 - 彈窗內副露組佔用 - 當前輸入單牌佔用
        const usage = {};
        for (const tileId of Object.keys(TILES)) usage[tileId] = 0;
        for (const t of this.hand) usage[t]++;
        for (const g of this.meldModal.groups) {
            for (const t of g.tiles) usage[t]++;
        }
        for (const t of this.meldModal.pendingTiles) usage[t]++;

        const container = document.getElementById('modalTiles');
        if (!container) return;

        const groupNames = { wan: '萬', tiao: '條', bing: '餅', wind: '風', dragon: '箭' };
        let html = '';
        for (const [groupType, tileIds] of Object.entries(tileGroups)) {
            html += `<div class="tile-row-inline">`;
            html += `<span class="tile-group-label">${groupNames[groupType] || groupType}</span>`;
            html += `<div class="tile-row-items">`;
            for (const tileId of tileIds) {
                const tile = TILES[tileId];
                const remaining = this.maxTileCount - (usage[tileId] || 0);
                const disabled = remaining <= 0;
                html += `
                    <div class="tile-btn ${disabled ? 'disabled' : ''}" data-tile="${tileId}">
                        <span class="tile-char">${tile.unicode}</span>
                        <span class="tile-count">${remaining}</span>
                    </div>
                `;
            }
            html += `</div></div>`;
        }
        container.innerHTML = html;
    }

    selectMeldTile(tileId) {
        if (this.meldModal.pendingTiles.length >= 16) {
            this.showMessage('单次输入最多16张，请先确认或清空');
            return;
        }
        this.meldModal.pendingTiles.push(tileId);
        this.scanAndGroupPending();
        this.refreshMeldModal();
    }

    removeMeldSelectedTile(index) {
        if (index < 0 || index >= this.meldModal.pendingTiles.length) return;
        this.meldModal.pendingTiles.splice(index, 1);
        // 删除单张不触发自动成组（避免拆用户未提交的输入）
        this.refreshMeldModal();
    }

    // ===== 按阈值+前缀规则自动把 pendingTiles 识别为组 =====
    scanAndGroupPending(forceFinal = false) {
        while (true) {
            const tiles = this.meldModal.pendingTiles;
            if (tiles.length < 3) break;

            let grouped = false;

            // ===== Rule 1: 4张前缀 =====
            if (tiles.length >= 4) {
                const t0 = tiles[0], t1 = tiles[1], t2 = tiles[2], t3 = tiles[3];
                // 4张完全相同 -> 杠 (默认明杠)
                if (t0 === t1 && t1 === t2 && t2 === t3) {
                    this.meldModal.groups.push({ type: 'minggang', tiles: [t0, t0, t0, t0] });
                    tiles.splice(0, 4);
                    grouped = true;
                }
                // 前3张相同，第4张不同 -> 碰
                else if (t0 === t1 && t1 === t2 && t2 !== t3) {
                    this.meldModal.groups.push({ type: 'pong', tiles: [t0, t0, t0] });
                    tiles.splice(0, 3);
                    grouped = true;
                }
            }

            // ===== Rule 2: 3张前缀（或 length===3）=====
            if (!grouped && tiles.length >= 3) {
                const t0 = tiles[0], t1 = tiles[1], t2 = tiles[2];
                // 尝试吃（3连续同花色序数牌）- 不论是否 forceFinal，到3张都试
                if (isNumberTile(t0) && isNumberTile(t1) && isNumberTile(t2)) {
                    const tiles3 = [t0, t1, t2].map(id => TILES[id]);
                    if (tiles3.every(t => t && tiles3[0].type === t.type) &&
                        typeof tiles3[0].value === 'number' &&
                        typeof tiles3[1].value === 'number' &&
                        typeof tiles3[2].value === 'number') {
                        const sorted = tiles3.map(t => t.value).sort((a, b) => a - b);
                        if (sorted[0] + 1 === sorted[1] && sorted[1] + 1 === sorted[2]) {
                            // 保留原始3个tileId，按value排序后
                            const sortedIds = [t0, t1, t2].sort(
                                (a, b) => TILES[a].value - TILES[b].value
                            );
                            this.meldModal.groups.push({ type: 'chi', tiles: sortedIds });
                            tiles.splice(0, 3);
                            grouped = true;
                        }
                    }
                }
                // forceFinal（最终确认前）：3张相同也要当碰组加入
                if (!grouped && forceFinal && t0 === t1 && t1 === t2) {
                    this.meldModal.groups.push({ type: 'pong', tiles: [t0, t0, t0] });
                    tiles.splice(0, 3);
                    grouped = true;
                }
            }

            if (!grouped) {
                // 第一张无法和后续组成 -> 如果是 forceFinal，丢弃第一张继续扫
                if (forceFinal && tiles.length >= 3) {
                    tiles.shift();
                    continue;
                }
                break;
            }
        }
    }

    // ===== group 操作 =====
    toggleSelectMeldGroup(idx) {
        if (this.meldModal.selectedGroupIdx === idx) this.meldModal.selectedGroupIdx = -1;
        else this.meldModal.selectedGroupIdx = idx;
        this.renderMeldGroupsPreview();
    }

    removeMeldGroup(idx) {
        const g = this.meldModal.groups[idx];
        if (!g) return;
        this.meldModal.groups.splice(idx, 1);
        if (this.meldModal.selectedGroupIdx === idx) this.meldModal.selectedGroupIdx = -1;
        else if (this.meldModal.selectedGroupIdx > idx) this.meldModal.selectedGroupIdx--;
        this.refreshMeldModal();
    }

    // 切换选中组的杠类型（明/暗）
    setGangType(type) {
        const idx = this.meldModal.selectedGroupIdx;
        const g = this.meldModal.groups[idx];
        if (!g) return;
        if (g.type !== 'minggang' && g.type !== 'angang') return;
        if (type !== 'minggang' && type !== 'angang') return;
        g.type = type;
        this.renderMeldGroupsPreview();
    }

    confirmMeld() {
        // 最終確認前強制掃描一次
        this.scanAndGroupPending(true);

        const { groups } = this.meldModal;

        // 校驗牌數上限：手牌 + 彈窗副露組 <= 4
        const handUsage = {};
        for (const t of this.hand) handUsage[t] = (handUsage[t] || 0) + 1;

        const totalNeed = { ...handUsage };
        for (const g of groups) {
            for (const t of g.tiles) totalNeed[t] = (totalNeed[t] || 0) + 1;
        }

        for (const [t, n] of Object.entries(totalNeed)) {
            if (n > this.maxTileCount) {
                this.showMessage(`${TILES[t]?.name || t} 數量不足（手牌與副露合計需要${n}張，超過上限4張）`);
                return;
            }
        }

        // 全部通過 - 將彈窗中的副露同步保存到主頁的 melds 中
        this.melds = JSON.parse(JSON.stringify(groups));

        // 重新計算並更新全局牌數使用量
        this.initTileUsage();
        for (const t of this.hand) this.tileUsage[t]++;
        for (const g of this.melds) {
            for (const t of g.tiles) this.tileUsage[t]++;
        }

        this.closeMeldModal();
        this.updateDisplay();
    }

    closeMeldModal() {
        document.getElementById('meldModal').classList.remove('show');
        this.meldModal = {
            pendingTiles: [],
            groups: [],
            selectedGroupIdx: -1
        };
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
            container.innerHTML = '<p class="placeholder">点击添加副露</p>';
            return;
        }

        container.innerHTML = this.melds.map((meld, meldIndex) => {
            const typeNames = { chi: '吃', pong: '碰', minggang: '明杠', angang: '暗杠' };
            const tilesHtml = meld.tiles.map((tileId, tileIdx) => {
                const tile = TILES[tileId];
                // 暗杠：第1张显示明牌，其余显示暗牌
                const isFaceDown = meld.type === 'angang' && tileIdx > 0;
                return `<span class="meld-tile ${isFaceDown ? 'face-down' : ''}">${tile.unicode}</span>`;
            }).join('');
            
            return `
                <div class="meld-group" data-meld-index="${meldIndex}">
                    <div class="meld-tiles">${tilesHtml}</div>
                    <div class="meld-label">${typeNames[meld.type]}</div>
                    <button class="meld-remove" onclick="event.stopPropagation(); app.removeMeld(${meldIndex})">✕</button>
                </div>
            `;
        }).join('');
    }

    // ====== 工具：計算杠數 ======
    getKongCount() {
        return this.melds.filter(m => m.type === 'minggang' || m.type === 'angang').length;
    }

    // ====== 工具：預期和牌總數 = 基本14張 + 每杠1張補牌 ======
    getExpectedTotalTiles() {
        return 14 + this.getKongCount();
    }

    getTotalTiles() {
        return this.hand.length + this.melds.reduce((sum, m) => sum + m.tiles.length, 0);
    }

    updateHandCount() {
        const countEl = document.getElementById('handCount');
        if (countEl) {
            countEl.textContent = this.getTotalTiles();
        }
    }

    getConditions() {
        const winTypeRadio = document.querySelector('input[name="winType"]:checked');
        return {
            isSelfDrawn: winTypeRadio ? winTypeRadio.value === 'zimo' : false,
            prevalentWind: document.getElementById('prevalentWind')?.value || 'none',
            seatWind: document.getElementById('seatWind')?.value || 'none',
            flowerCount: parseInt(document.getElementById('flowerCount')?.value || '0'),
            isLastTile: document.getElementById('isLastTile')?.checked || false,
            isKongDraw: document.getElementById('isKongDraw')?.checked || false,
            isJuezhang: document.getElementById('isJuezhang')?.checked || false
        };
    }

    calculate() {
        const totalTiles = this.getTotalTiles();
        const expected = this.getExpectedTotalTiles();
        const kongCount = this.getKongCount();
        
        if (totalTiles !== expected) {
            const kongInfo = kongCount > 0 ? `（含${kongCount}杠，应${expected}张）` : '';
            this.showResult({ valid: false, message: `牌数不正确，当前${totalTiles}张，需要${expected}张${kongInfo}` });
            return;
        }

        if (!this.winTile) {
            this.showResult({ valid: false, message: '请先选择和牌（点击"和牌"区域，然后点击手牌中的一张）' });
            return;
        }

        const conditions = this.getConditions();
        analyzer.setHand(this.hand, this.melds, this.winTile, conditions);
        const result = analyzer.analyze();
        
        result.totalScore = result.fans.reduce((sum, f) => sum + f.score, 0);
        
        this.showResult(result);
    }

    showResult(result) {
        const scoreEl = document.getElementById('totalScore');
        const fansEl = document.getElementById('detectedFans');

        // 关闭之前展开的tooltip
        this.closeFanTooltip();

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
            <span class="fan-tag" data-desc="${fan.desc || ''}" title="${fan.desc || ''}">
                ${fan.name}
                <span class="fan-value">${fan.score}番</span>
            </span>
        `).join('');

        // 为番名标签绑定点击事件（手机点击显示tooltip）
        fansEl.querySelectorAll('.fan-tag').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleFanTooltip(el, el.dataset.desc);
            });
        });

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
