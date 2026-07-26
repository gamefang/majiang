// 国标麻将算番器 - 主应用逻辑

class MahjongApp {
    constructor() {
        this.hand = [];
        this.melds = [];
        this.winTile = null;  // 和牌（最后和的那张牌）
        this.winTileIndex = -1; // 和牌在手牌中的索引
        this.selectingWinTile = false; // 是否正在选择和牌
        this.tileUsage = {};  // 记录每张牌使用次数
        this.maxTileCount = 4; // 每种牌最多4张
        
        this.meldModal = {
            type: null,
            selectedTiles: []
        };

        this.init();
    }

    init() {
        this.initTileUsage();
        this.renderTileSelector();
        this.bindEvents();
        this.updateDisplay();
    }

    initTileUsage() {
        for (const tileId of Object.keys(TILES)) {
            this.tileUsage[tileId] = 0;
        }
    }

    renderTileSelector() {
        // 万
        this.renderTileGroup('wanTiles', TILES_BY_TYPE.wan);
        // 条
        this.renderTileGroup('tiaoTiles', TILES_BY_TYPE.tiao);
        // 饼
        this.renderTileGroup('bingTiles', TILES_BY_TYPE.bing);
        // 风
        this.renderTileGroup('windTiles', TILES_BY_TYPE.wind);
        // 箭
        this.renderTileGroup('dragonTiles', TILES_BY_TYPE.dragon);
    }

    renderTileGroup(containerId, tileIds) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = tileIds.map(tileId => {
            const tile = TILES[tileId];
            const remaining = this.maxTileCount - this.tileUsage[tileId];
            return `
                <div class="tile-btn ${remaining === 0 ? 'disabled' : ''}" data-tile="${tileId}">
                    <span class="tile-char">${tile.unicode}</span>
                    <span class="tile-name">${tile.name}</span>
                    <span class="tile-count">${remaining}</span>
                </div>
            `;
        }).join('');
    }

    bindEvents() {
        // 牌选择
        document.querySelectorAll('.tiles-row').forEach(row => {
            row.addEventListener('click', (e) => {
                const tileBtn = e.target.closest('.tile-btn');
                if (tileBtn && !tileBtn.classList.contains('disabled')) {
                    this.addTileToHand(tileBtn.dataset.tile);
                }
            });
        });

        // 清空手牌
        document.getElementById('clearHand')?.addEventListener('click', () => {
            this.clearHand();
        });

        // 撤销
        document.getElementById('undoTile')?.addEventListener('click', () => {
            this.undoLastTile();
        });

        // 副露按钮
        document.getElementById('addChi')?.addEventListener('click', () => this.openMeldModal('chi'));
        document.getElementById('addPong')?.addEventListener('click', () => this.openMeldModal('pong'));
        document.getElementById('addMingGang')?.addEventListener('click', () => this.openMeldModal('minggang'));
        document.getElementById('addAnGang')?.addEventListener('click', () => this.openMeldModal('angang'));
        document.getElementById('clearMelds')?.addEventListener('click', () => this.clearMelds());

        // 弹窗
        document.getElementById('modalClose')?.addEventListener('click', () => this.closeMeldModal());
        document.getElementById('modalCancel')?.addEventListener('click', () => this.closeMeldModal());
        document.getElementById('modalConfirm')?.addEventListener('click', () => this.confirmMeld());
        document.getElementById('modalTiles')?.addEventListener('click', (e) => {
            const tileBtn = e.target.closest('.tile-btn');
            if (tileBtn && !tileBtn.classList.contains('disabled')) {
                this.selectMeldTile(tileBtn.dataset.tile);
            }
        });

        // 计算按钮
        document.getElementById('calculateBtn')?.addEventListener('click', () => {
            this.calculate();
        });

        // 条件变化
        document.querySelectorAll('.conditions-section select, .conditions-section input').forEach(el => {
            el.addEventListener('change', () => this.updateConditions());
        });

        // 手牌区域点击 - 选择和牌或移除
        document.getElementById('handDisplay')?.addEventListener('click', (e) => {
            const tileEl = e.target.closest('.hand-tile');
            if (tileEl) {
                const index = parseInt(tileEl.dataset.index);
                if (this.selectingWinTile) {
                    this.setWinTile(index);
                } else {
                    this.removeTileFromHand(index);
                }
            }
        });

        // 选择和牌按钮 - 进入选择模式
        document.getElementById('selectWinTile')?.addEventListener('click', () => {
            this.startWinTileSelection();
        });

        // 清除和牌
        document.getElementById('clearWinTile')?.addEventListener('click', () => {
            this.clearWinTile();
        });
    }

    // 开始选择和牌模式
    startWinTileSelection() {
        if (this.hand.length === 0) {
            this.showMessage('请先添加手牌');
            return;
        }
        
        this.selectingWinTile = true;
        const handDisplay = document.getElementById('handDisplay');
        const selectBtn = document.getElementById('selectWinTile');
        
        handDisplay?.classList.add('selecting-win-tile');
        selectBtn?.classList.add('active');
        this.showMessage('👆 请点击手牌中的一张作为和牌');
    }

    // 取消选择模式
    cancelWinTileSelection() {
        this.selectingWinTile = false;
        document.getElementById('handDisplay')?.classList.remove('selecting-win-tile');
        document.getElementById('selectWinTile')?.classList.remove('active');
    }

    // 设置和牌
    setWinTile(index) {
        if (index >= 0 && index < this.hand.length) {
            this.winTile = this.hand[index];
            this.winTileIndex = index;
            this.cancelWinTileSelection();
            
            this.showMessage(`已选择 ${TILES[this.winTile].name} 作为和牌`);
            this.updateWinTileDisplay();
            this.updateHandDisplay();

            // 设置完和牌后，自动触发计算
            this.calculate();
        }
    }

    // 清除和牌选择
    clearWinTile() {
        this.winTile = null;
        this.winTileIndex = -1;
        this.cancelWinTileSelection();
        
        this.updateWinTileDisplay();
        this.updateHandDisplay();
    }

    // 更新和牌显示
    updateWinTileDisplay() {
        const container = document.getElementById('winTileDisplay');
        if (!container) return;

        if (this.winTile) {
            const tile = TILES[this.winTile];
            container.innerHTML = `<span class="win-tile-char">${tile.unicode}</span><span class="win-tile-name">${tile.name}</span>`;
        } else {
            container.innerHTML = '<span class="placeholder">点击此处选择和牌</span>';
        }
    }

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
            
            // 如果移除的是和牌，清除和牌选择
            if (index === this.winTileIndex) {
                this.winTile = null;
                this.winTileIndex = -1;
            } else if (index < this.winTileIndex) {
                // 如果移除的是和牌前面的牌，更新和牌索引
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

    openMeldModal(type) {
        this.meldModal = { type, selectedTiles: [] };
        
        const modal = document.getElementById('meldModal');
        const title = document.getElementById('modalTitle');
        const instruction = document.getElementById('modalInstruction');
        
        const typeNames = {
            chi: '吃',
            pong: '碰',
            minggang: '明杠',
            angang: '暗杠'
        };

        title.textContent = `添加${typeNames[type]}`;
        
        if (type === 'chi') {
            instruction.textContent = '请依次选择3张连续的序数牌';
        } else if (type === 'pong') {
            instruction.textContent = '请选择1张牌（自动组成3张）';
        } else {
            instruction.textContent = '请选择1张牌（自动组成4张）';
        }

        this.renderModalTiles();
        modal.classList.add('show');
    }

    renderModalTiles() {
        const container = document.getElementById('modalTiles');
        const selectedContainer = document.getElementById('selectedMeldTiles');
        
        // 根据副露类型显示可选的牌
        let availableTiles = [];
        
        if (this.meldModal.type === 'chi') {
            // 吃只能是序数牌
            availableTiles = [...TILES_BY_TYPE.wan, ...TILES_BY_TYPE.tiao, ...TILES_BY_TYPE.bing];
        } else {
            // 碰和杠可以是任何牌
            availableTiles = Object.keys(TILES);
        }

        container.innerHTML = availableTiles.map(tileId => {
            const tile = TILES[tileId];
            const neededCount = this.meldModal.type === 'chi' ? 1 : 
                              (this.meldModal.type === 'pong' ? 3 : 4);
            const available = this.maxTileCount - this.tileUsage[tileId];
            const isDisabled = available < (this.meldModal.type === 'chi' ? 1 : neededCount);
            
            return `
                <div class="tile-btn modal-tile ${isDisabled ? 'disabled' : ''}" data-tile="${tileId}">
                    <span class="tile-char">${tile.unicode}</span>
                </div>
            `;
        }).join('');

        // 显示已选择的牌
        selectedContainer.innerHTML = this.meldModal.selectedTiles.map(tileId => {
            const tile = TILES[tileId];
            return `<span class="selected-tile">${tile.unicode}</span>`;
        }).join('');
    }

    selectMeldTile(tileId) {
        const { type, selectedTiles } = this.meldModal;
        
        if (type === 'chi') {
            // 吃需要3张连续牌
            if (selectedTiles.length < 3) {
                // 检查是否可以形成顺子
                if (selectedTiles.length === 0) {
                    selectedTiles.push(tileId);
                } else {
                    // 检查是否同花色且可以连续
                    const firstTile = TILES[selectedTiles[0]];
                    const newTile = TILES[tileId];
                    
                    if (firstTile.type === newTile.type && isNumberTile(tileId)) {
                        selectedTiles.push(tileId);
                        // 排序
                        selectedTiles.sort((a, b) => TILES[a].value - TILES[b].value);
                    } else {
                        this.showMessage('吃必须是同花色的序数牌');
                        return;
                    }
                }
            }
        } else {
            // 碰或杠只需选一张
            this.meldModal.selectedTiles = [tileId];
        }

        this.renderModalTiles();
    }

    confirmMeld() {
        const { type, selectedTiles } = this.meldModal;
        
        if (type === 'chi') {
            if (selectedTiles.length !== 3) {
                this.showMessage('请选择3张牌');
                return;
            }
            // 先按数值排序
            selectedTiles.sort((a, b) => TILES[a].value - TILES[b].value);
            
            // 检查是否连续
            const values = selectedTiles.map(t => TILES[t].value);
            if (values[1] !== values[0] + 1 || values[2] !== values[1] + 1) {
                this.showMessage('顺子必须是连续的3张牌');
                return;
            }
            // 检查是否有足够的牌
            for (const tileId of selectedTiles) {
                if (this.tileUsage[tileId] >= this.maxTileCount) {
                    this.showMessage(`${TILES[tileId].name}已用完`);
                    return;
                }
            }
            // 添加副露（已排序）
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

            const meld = { 
                type: type, 
                tiles: Array(count).fill(tileId) 
            };
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

    updateDisplay() {
        this.updateHandDisplay();
        this.updateMeldsDisplay();
        this.updateTileSelector();
        this.updateHandCount();
        this.updateWinTileDisplay();
    }

    updateHandDisplay() {
        const container = document.getElementById('handDisplay');
        if (!container) return;

        if (this.hand.length === 0) {
            container.innerHTML = '<p class="placeholder">点击下方麻将牌添加到手牌</p>';
            return;
        }

        // 创建索引映射用于排序后追踪原始索引
        const indexedHand = this.hand.map((tileId, index) => ({ tileId, originalIndex: index }));
        
        // 按花色和数字排序
        indexedHand.sort((a, b) => {
            const tileA = TILES[a.tileId];
            const tileB = TILES[b.tileId];
            const typeOrder = { wan: 0, tiao: 1, bing: 2, wind: 3, dragon: 4 };
            if (tileA.type !== tileB.type) {
                return typeOrder[tileA.type] - typeOrder[tileB.type];
            }
            if (typeof tileA.value === 'number' && typeof tileB.value === 'number') {
                return tileA.value - tileB.value;
            }
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

    updateTileSelector() {
        document.querySelectorAll('.tile-btn[data-tile]').forEach(btn => {
            const tileId = btn.dataset.tile;
            const remaining = this.maxTileCount - this.tileUsage[tileId];
            const countEl = btn.querySelector('.tile-count');
            
            if (countEl) {
                countEl.textContent = remaining;
            }
            
            if (remaining === 0) {
                btn.classList.add('disabled');
            } else {
                btn.classList.remove('disabled');
            }
        });
    }

    updateHandCount() {
        const countEl = document.getElementById('handCount');
        if (countEl) {
            const totalTiles = this.hand.length + this.melds.reduce((sum, m) => sum + m.tiles.length, 0);
            countEl.textContent = totalTiles;
        }
    }

    updateConditions() {
        // 条件会在计算时读取
    }

    getConditions() {
        return {
            isSelfDrawn: document.getElementById('winType')?.value === 'zimo',
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
            this.showResult({
                valid: false,
                message: `牌数不正确，当前${totalTiles}张，需要14张`
            });
            return;
        }

        // 检查是否选择了和牌
        if (!this.winTile) {
            this.showResult({
                valid: false,
                message: '请先选择和牌（点击"和牌"区域，然后点击手牌中的一张）'
            });
            return;
        }

        const conditions = this.getConditions();
        
        // 设置分析器数据，传入和牌
        analyzer.setHand(this.hand, this.melds, this.winTile, conditions);
        
        // 分析
        const result = analyzer.analyze();
        
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
        
        // 动画
        scoreEl.style.transform = 'scale(1.2)';
        setTimeout(() => {
            scoreEl.style.transform = 'scale(1)';
        }, 200);

        if (result.fans.length === 0) {
            fansEl.innerHTML = '<p class="placeholder">无番和（8番起和）</p>';
            return;
        }

        // 按番数排序
        const sortedFans = [...result.fans].sort((a, b) => b.score - a.score);
        
        fansEl.innerHTML = sortedFans.map(fan => `
            <span class="fan-tag">
                ${fan.name}
                <span class="fan-value">${fan.score}番</span>
            </span>
        `).join('');

        // 检查是否满足起和要求
        if (result.totalScore < 8) {
            fansEl.innerHTML += '<p class="warning-message">⚠️ 未满8番，不能和牌</p>';
        }
    }

    showMessage(msg) {
        // 简单的消息提示
        const existing = document.querySelector('.toast-message');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = msg;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
        }, 10);

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// 初始化应用
const app = new MahjongApp();
