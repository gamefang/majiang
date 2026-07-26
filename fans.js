// 国标麻将81种番种数据（供参考）

const FANS_DATA = [
    // 88番 (7种)
    { id: 'dasixi', name: '大四喜', score: 88, desc: '4副风牌刻子（杠）' },
    { id: 'dasanyuan', name: '大三元', score: 88, desc: '中、发、白3副刻子（杠）' },
    { id: 'lvyise', name: '绿一色', score: 88, desc: '由23468条及发字组成' },
    { id: 'jiulianbaodeng', name: '九莲宝灯', score: 88, desc: '1112345678999同花色' },
    { id: 'sigang', name: '四杠', score: 88, desc: '4副杠' },
    { id: 'lianqidui', name: '连七对', score: 88, desc: '7个连续对子' },
    { id: 'shisanyao', name: '十三幺', score: 88, desc: '19万条饼+7字牌各一+其中一对' },

    // 64番 (6种)
    { id: 'qingyaojiu', name: '清幺九', score: 64, desc: '仅由序数牌1、9组成' },
    { id: 'xiaosixi', name: '小四喜', score: 64, desc: '3风刻+1风对' },
    { id: 'xiaosanyuan', name: '小三元', score: 64, desc: '2箭刻+1箭对' },
    { id: 'ziyise', name: '字一色', score: 64, desc: '全部由字牌组成' },
    { id: 'sianke', name: '四暗刻', score: 64, desc: '4副暗刻（含暗杠）' },
    { id: 'yiseshuanglonghui', name: '一色双龙会', score: 64, desc: '同花色两个老少副+5将' },

    // 48番 (2种)
    { id: 'yisesitongshun', name: '一色四同顺', score: 48, desc: '4副相同顺子' },
    { id: 'yisesijiegao', name: '一色四节高', score: 48, desc: '4副递增刻子' },

    // 32番 (3种)
    { id: 'yisesibugao', name: '一色四步高', score: 32, desc: '4副递增顺子' },
    { id: 'sangang', name: '三杠', score: 32, desc: '3副杠' },
    { id: 'hunyaojiu', name: '混幺九', score: 32, desc: '字牌+序数牌1、9' },

    // 24番 (9种)
    { id: 'qidui', name: '七对', score: 24, desc: '7个对子' },
    { id: 'qixingbukao', name: '七星不靠', score: 24, desc: '东南西北中发白+不相邻序数牌' },
    { id: 'quanshuangke', name: '全双刻', score: 24, desc: '全部由2468组成' },
    { id: 'qingyise', name: '清一色', score: 24, desc: '同一花色序数牌' },
    { id: 'yisesantongshun', name: '一色三同顺', score: 24, desc: '3副相同顺子' },
    { id: 'yisesanjiegao', name: '一色三节高', score: 24, desc: '3副递增刻子' },
    { id: 'quanda', name: '全大', score: 24, desc: '全部由789组成' },
    { id: 'quanzhong', name: '全中', score: 24, desc: '全部由456组成' },
    { id: 'quanxiao', name: '全小', score: 24, desc: '全部由123组成' },

    // 16番 (6种)
    { id: 'qinglong', name: '清龙', score: 16, desc: '同花色123+456+789' },
    { id: 'yisesanbugao', name: '一色三步高', score: 16, desc: '3副递增顺子' },
    { id: 'sanseshuanglonghui', name: '三色双龙会', score: 16, desc: '2色老少副+另色5将' },
    { id: 'quandaiwu', name: '全带五', score: 16, desc: '每副牌都有5' },
    { id: 'santongke', name: '三同刻', score: 16, desc: '3种花色同数刻子' },
    { id: 'sananke', name: '三暗刻', score: 16, desc: '3副暗刻' },

    // 12番 (5种)
    { id: 'quanbukao', name: '全不靠', score: 12, desc: '不相邻序数牌+全部字牌' },
    { id: 'zuhelong', name: '组合龙', score: 12, desc: '3色的147+258+369' },
    { id: 'dayuwu', name: '大于五', score: 12, desc: '全部由6789组成' },
    { id: 'xiaoyuwu', name: '小于五', score: 12, desc: '全部由1234组成' },
    { id: 'sanfengke', name: '三风刻', score: 12, desc: '3副风刻' },

    // 8番 (9种)
    { id: 'miaoshouhuichun', name: '妙手回春', score: 8, desc: '自摸最后一张牌' },
    { id: 'haidilaoyue', name: '海底捞月', score: 8, desc: '和最后一张打出的牌' },
    { id: 'gangshangkaihua', name: '杠上开花', score: 8, desc: '杠后补牌成和' },
    { id: 'qiangganghe', name: '抢杠和', score: 8, desc: '和别人加杠的牌' },
    { id: 'hualong', name: '花龙', score: 8, desc: '3色组成123456789' },
    { id: 'tuibudao', name: '推不倒', score: 8, desc: '上下对称的牌' },
    { id: 'sansesantongshun', name: '三色三同顺', score: 8, desc: '3色同数顺子' },
    { id: 'sansesanjiegao', name: '三色三节高', score: 8, desc: '3色递增刻子' },
    { id: 'wufanhe', name: '无番和', score: 8, desc: '和牌后无番种' },

    // 6番 (2种)
    { id: 'pengpenghe', name: '碰碰和', score: 6, desc: '4副刻子' },
    { id: 'hunyise', name: '混一色', score: 6, desc: '序数牌+字牌' },

    // 4番 (4种)
    { id: 'quandaiyao', name: '全带幺', score: 4, desc: '每副牌都有19或字牌' },
    { id: 'buqiuren', name: '不求人', score: 4, desc: '门清自摸' },
    { id: 'shuangminggang', name: '双明杠', score: 4, desc: '2副明杠' },
    { id: 'hujuezhang', name: '和绝张', score: 4, desc: '和第4张牌' },

    // 2番 (10种)
    { id: 'jianke', name: '箭刻', score: 2, desc: '中/发/白刻子' },
    { id: 'quanfengke', name: '圈风刻', score: 2, desc: '与圈风相同的刻子' },
    { id: 'menfengke', name: '门风刻', score: 2, desc: '与门风相同的刻子' },
    { id: 'menqianqing', name: '门前清', score: 2, desc: '门清和别人的牌' },
    { id: 'pinghe', name: '平和', score: 2, desc: '4顺子+序数牌将' },
    { id: 'siguiyi', name: '四归一', score: 2, desc: '4张同牌分在各副中' },
    { id: 'shuangtongke', name: '双同刻', score: 2, desc: '2副同数刻子' },
    { id: 'shuananke', name: '双暗刻', score: 2, desc: '2副暗刻' },
    { id: 'angang', name: '暗杠', score: 2, desc: '1副暗杠' },
    { id: 'duanyao', name: '断幺', score: 2, desc: '没有19和字牌' },

    // 1番 (13种)
    { id: 'yibangao', name: '一般高', score: 1, desc: '2副同顺子' },
    { id: 'lianliu', name: '连六', score: 1, desc: '2副相连顺子' },
    { id: 'laoshaofu', name: '老少副', score: 1, desc: '123+789同花色' },
    { id: 'yaojiuke', name: '幺九刻', score: 1, desc: '19序数牌刻子' },
    { id: 'minggang', name: '明杠', score: 1, desc: '1副明杠' },
    { id: 'queyimen', name: '缺一门', score: 1, desc: '缺少万/条/饼之一' },
    { id: 'wuzi', name: '无字', score: 1, desc: '没有字牌' },
    { id: 'bianzhang', name: '边张', score: 1, desc: '单和12的3或89的7' },
    { id: 'kanzhang', name: '坎张', score: 1, desc: '和嵌张' },
    { id: 'dandiaojiang', name: '单钓将', score: 1, desc: '单和将牌' },
    { id: 'zimo', name: '自摸', score: 1, desc: '自己摸牌和' },
    { id: 'huapai', name: '花牌', score: 1, desc: '每有1张花牌' },
    { id: 'erwubajiang', name: '二五八将', score: 1, desc: '258作将' },
];

// 渲染番种参考面板
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

    // 4. 追加静态的“使用说明”
    html += `
        <details>
            <summary>使用说明</summary>
            <ul>
                <li>点击麻将牌添加到手牌（最多14张）</li>
                <li>如有吃/碰/杠，点击对应按钮添加副露</li>
                <li><strong>点击"和牌"区域选择和的那张牌</strong></li>
                <li>设置和牌条件（自摸/点和、圈风、门风等）</li>
                <li>点击"计算番数"查看结果</li>
                <li>起和番数为8番</li>
            </ul>
        </details>
    `;

    // 5. 渲染页面
    rulesContainer.innerHTML = html;
}

// DOM 加载完成后执行渲染
document.addEventListener('DOMContentLoaded', renderRulesReference);