// 国标麻将81种番种数据
const FANS_DATA = [
    // 88番 (7种)
    { id: 'dasixi', name: '大四喜', score: 88, desc: '4副風牌刻子 🀀🀀🀀 🀁🀁🀁 🀂🀂🀂 🀃🀃🀃' },
    { id: 'dasanyuan', name: '大三元', score: 88, desc: '中發白3副刻子 🀄🀄🀄 🀅🀅🀅 🀆🀆🀆' },
    { id: 'lvyise', name: '綠一色', score: 88, desc: '由23468條及發組成 🀑🀒🀓 🀕🀕🀕 🀗🀗 🀅🀅🀅' },
    { id: 'jiulianbaodeng', name: '九蓮寶燈', score: 88, desc: '同花色1112345678999 🀇🀇🀇🀈🀉🀊🀋🀌🀍🀎🀏🀏🀏和任意萬' },
    { id: 'sigang', name: '四槓', score: 88, desc: '4副槓 🀇🀇🀇🀇 🀉🀉🀉🀉 🀕🀕🀕🀕 🀝🀝🀝🀝' },
    { id: 'lianqidui', name: '連七對', score: 88, desc: '連續的7對 🀇🀇 🀈🀈 🀉🀉 🀊🀊 🀋🀋 🀌🀌 🀍🀍' },
    { id: 'shisanyao', name: '十三幺', score: 88, desc: '1、9及字牌各一，其中一張成對爲將牌 🀇🀏🀐🀘🀙 🀡🀡 🀀🀁🀂🀃🀄🀅🀆' },

    // 64番 (6种)
    { id: 'qingyaojiu', name: '清幺九', score: 64, desc: '僅由序數牌1、9組成 🀇🀇🀇 🀏🀏🀏 🀐🀐🀐 🀘🀘🀘 🀙🀙' },
    { id: 'xiaosixi', name: '小四喜', score: 64, desc: '3風刻+1風將牌 🀀🀀🀀 🀁🀁🀁 🀂🀂🀂 🀃🀃' },
    { id: 'xiaosanyuan', name: '小三元', score: 64, desc: '2箭刻+1箭將牌 🀄🀄🀄 🀅🀅🀅 🀆🀆' },
    { id: 'ziyise', name: '字一色', score: 64, desc: '由字牌組成的和牌 🀀🀀🀀 🀁🀁🀁 🀂🀂🀂 🀄🀄🀄 🀆🀆' },
    { id: 'sianke', name: '四暗刻', score: 64, desc: '4副暗刻 🀇🀇🀇 🀉🀉🀉 🀕🀕🀕 🀝🀝🀝' },
    { id: 'yiseshuanglonghui', name: '一色雙龍會', score: 64, desc: '一種花色的兩個老少副，5為將牌 🀇🀈🀉 🀇🀈🀉 🀍🀎🀏 🀍🀎🀏 🀋🀋' },

    // 48番 (2种)
    { id: 'yisesitongshun', name: '一色四同順', score: 48, desc: '一種花色4副序數相同的順子 🀇🀈🀉 🀇🀈🀉 🀇🀈🀉 🀇🀈🀉' },
    { id: 'yisesijiegao', name: '一色四節高', score: 48, desc: '一種花色4副依次遞增一位數的刻子 🀇🀇🀇 🀈🀈🀈 🀉🀉🀉 🀊🀊🀊' },

    // 32番 (3种)
    { id: 'yisesibugao', name: '一色四步高', score: 32, desc: '一種花色4副依次遞增一位數或依次遞增二位數的順子 🀇🀈🀉 🀈🀉🀊 🀉🀊🀋 🀊🀋🀌' },
    { id: 'sangang', name: '三槓', score: 32, desc: '3副槓 🀇🀇🀇🀇 🀉🀉🀉🀉 🀕🀕🀕🀕' },
    { id: 'hunyaojiu', name: '混幺九', score: 32, desc: '由字牌和序數牌一、九組成的和牌 🀇🀇🀇 🀏🀏🀏 🀐🀐🀐 🀘🀘🀘 🀀🀀' },

    // 24番 (9种)
    { id: 'qidui', name: '七對', score: 24, desc: '由7個對子組成的和牌 🀈🀈 🀌🀌 🀒🀒 🀖🀖 🀞🀞 🀠🀠 🀁🀁' },
    { id: 'qixingbukao', name: '七星不靠', score: 24, desc: '東南西北中發白+不相鄰序數牌 🀀🀁🀂🀃🀄🀅🀆 🀇🀊🀍 🀑🀔🀗 🀛' },
    { id: 'quanshuangke', name: '全雙刻', score: 24, desc: '全由偶數組成的碰碰和 🀈🀈🀈 🀊🀊🀊 🀌🀌🀌 🀗🀗🀗 🀜🀜' },
    { id: 'qingyise', name: '清一色', score: 24, desc: '全由同一種花色的序數牌組成 🀇🀇🀇 🀈🀉🀊 🀌🀍🀎 🀏🀏🀏 🀎🀎' },
    { id: 'yisesantongshun', name: '一色三同順', score: 24, desc: '一種花色3副序數相同的順子 🀇🀈🀉 🀇🀈🀉 🀇🀈🀉' },
    { id: 'yisesanjiegao', name: '一色三節高', score: 24, desc: '一種花色3副依次遞增一位數字的刻子 🀇🀇🀇 🀈🀈🀈 🀉🀉🀉' },
    { id: 'quanda', name: '全大', score: 24, desc: '全由7、8、9組成 🀍🀎🀏 🀏🀏🀏 🀗🀗🀗 🀟🀠🀡 🀠🀠' },
    { id: 'quanzhong', name: '全中', score: 24, desc: '全由4、5、6組成 🀊🀊🀊 🀋🀋🀋 🀜🀝🀞 🀔🀔🀔 🀕🀕' },
    { id: 'quanxiao', name: '全小', score: 24, desc: '全由1、2、3組成 🀇🀈🀉 🀇🀈🀉 🀐🀑🀒 🀙🀙🀙 🀚🀚' },

    // 16番 (6种)
    { id: 'qinglong', name: '清龍', score: 16, desc: '一種花色1-9的三副順子 🀇🀈🀉 🀊🀋🀌 🀍🀎🀏' },
    { id: 'yisesanbugao', name: '一色三步高', score: 16, desc: '一種花色3副依次遞增一位或依次遞增二位數字的順子 🀇🀈🀉 🀈🀉🀊 🀉🀊🀋' },
    { id: 'sanseshuanglonghui', name: '三色雙龍會', score: 16, desc: '兩種花色的各一個老少副、另一種花色5作將的和牌 🀇🀈🀉 🀍🀎🀏 🀐🀑🀒 🀖🀗🀘 🀝🀝' },
    { id: 'quandaiwu', name: '全帶五', score: 16, desc: '每副牌及將牌必須有5的序數牌 🀉🀊🀋 🀊🀋🀌 🀜🀝🀞 🀔🀔🀔 🀝🀝' },
    { id: 'santongke', name: '三同刻', score: 16, desc: '有3個序數相同的刻子 🀈🀈🀈 🀑🀑🀑 🀚🀚🀚' },
    { id: 'sananke', name: '三暗刻', score: 16, desc: '3副暗刻 🀈🀈🀈 🀙🀙🀙 🀆🀆🀆' },

    // 12番 (5种)
    { id: 'quanbukao', name: '全不靠', score: 12, desc: '由單張3種花色147、258、369不能錯位的序數牌及東南西北中發白中的任何14張牌組成 🀇🀊🀍 🀑🀔 🀛🀞🀡 🀀🀁🀂🀃🀄🀅' },
    { id: 'zuhelong', name: '組合龍', score: 12, desc: '3種花色的147、258、369不能錯位的序數牌 🀇🀊🀍 🀑🀔🀗 🀛🀞🀡' },
    { id: 'dayuwu', name: '大於五', score: 12, desc: '由序數牌6-9的順子、刻子、將牌組成的和牌 🀌🀍🀎 🀏🀏🀏 🀟🀠🀡 🀘🀘🀘 🀗🀗' },
    { id: 'xiaoyuwu', name: '小於五', score: 12, desc: '由序數牌1-4的順子、刻子、將牌組成的和牌 🀇🀈🀉 🀈🀉🀊 🀑🀒🀓 🀛🀛🀛 🀜🀜' },
    { id: 'sanfengke', name: '三風刻', score: 12, desc: '3副風刻 🀀🀀🀀 🀂🀂🀂 🀃🀃🀃' },

    // 8番 (9种)
    { id: 'miaoshouhuichun', name: '妙手回春', score: 8, desc: '自摸牌牆上最後一張牌和牌' },
    { id: 'haidilaoyue', name: '海底撈月', score: 8, desc: '和打出的最後一張牌' },
    { id: 'gangshangkaihua', name: '槓上開花', score: 8, desc: '開槓抓進的牌成和牌' },
    { id: 'qiangganghe', name: '搶槓和', score: 8, desc: '和別人抓開明槓的牌' },
    { id: 'hualong', name: '花龍', score: 8, desc: '3種花色的3副順子連線成1-9的序數牌 🀇🀈🀉 🀓🀔🀕 🀟🀠🀡' },
    { id: 'tuibudao', name: '推不倒', score: 8, desc: '由牌面圖形沒有上下區別的牌組成的和牌 🀙🀙🀙 🀜🀝🀞 🀓🀔🀕 🀆🀆🀆 🀗🀗' },
    { id: 'sansesantongshun', name: '三色三同順', score: 8, desc: '3種花色3副序數相同的順子 🀇🀈🀉 🀐🀑🀒 🀙🀚🀛' },
    { id: 'sansesanjiegao', name: '三色三節高', score: 8, desc: '3種花色3副依次遞增一位數的刻子 🀇🀇🀇 🀑🀑🀑 🀛🀛🀛' },
    { id: 'wufanhe', name: '無番和', score: 8, desc: '和牌後，數不出任何番種分（不包括花牌）' },

    // 6番 (7种)
    { id: 'pengpenghe', name: '碰碰和', score: 6, desc: '由4副刻子（或槓）、將牌組成的和牌 🀌🀌🀌 🀓🀓🀓 🀚🀚🀚 🀟🀟🀟 🀁🀁' },
    { id: 'hunyise', name: '混一色', score: 6, desc: '由一種花色序數牌及字牌組成的和牌 🀇🀇🀇 🀈🀉🀊 🀌🀍🀎 🀏🀏🀏 🀀🀀' },
    { id: 'sansesanbugao', name: '三色三步高', score: 6, desc: '3種花色3副依次遞增一位數的順子 🀇🀈🀉 🀑🀒🀓 🀛🀜🀝' },
    { id: 'wumenqi', name: '五門齊', score: 6, desc: '和牌時3種序數牌、風、箭牌齊全 🀇🀈🀉 🀘🀘 🀟🀠🀡 🀁🀁🀁 🀅🀅🀅' },
    { id: 'quanqiuren', name: '全求人', score: 6, desc: '全靠吃牌、碰牌、單釣別人打出的牌和牌' },
    { id: 'shuangangang', name: '雙暗槓', score: 6, desc: '2副暗槓 🀇🀇🀇🀇 🀈🀈🀈🀈' },
    { id: 'shuangjianke', name: '雙箭刻', score: 6, desc: '2副箭刻 🀄🀄🀄 🀅🀅🀅' },

    // 4番 (4种)
    { id: 'quandaiyao', name: '全帶幺', score: 4, desc: '和牌時，每副牌、將牌都有幺牌 🀇🀈🀉 🀘🀘🀘 🀟🀠🀡 🀁🀁🀁 🀐🀐' },
    { id: 'buqiuren', name: '不求人', score: 4, desc: '和牌全部由自己摸牌，即門清自摸' },
    { id: 'shuangminggang', name: '雙明槓', score: 4, desc: '2副明槓 🀇🀇🀇🀇 🀈🀈🀈🀈' },
    { id: 'hujuezhang', name: '和絕張', score: 4, desc: '和已亮明3張牌後所剩的第4張牌' },

    // 2番 (10种)
    { id: 'jianke', name: '箭刻', score: 2, desc: '有中發白刻子 🀄🀄🀄' },
    { id: 'quanfengke', name: '圈風刻', score: 2, desc: '與圈風相同的風刻 🀀🀀🀀圈風爲🀀' },
    { id: 'menfengke', name: '門風刻', score: 2, desc: '與本門風相同的風刻 🀀🀀🀀門風爲🀀' },
    { id: 'menqianqing', name: '門前清', score: 2, desc: '沒有吃、碰、明槓而聽牌，和別人打出的牌' },
    { id: 'pinghe', name: '平和', score: 2, desc: '和牌中有4副順子 🀇🀈🀉 🀋🀌🀍 🀓🀔🀕 🀚🀛🀜' },
    { id: 'siguiyi', name: '四歸一', score: 2, desc: '和牌中4張相同的牌分別在不同牌副或将中 🀇🀇🀇 🀇🀈🀉' },
    { id: 'shuangtongke', name: '雙同刻', score: 2, desc: '2副同數刻子 🀇🀇🀇 🀐🀐🀐' },
    { id: 'shuanganke', name: '雙暗刻', score: 2, desc: '2副暗刻 🀇🀇🀇 🀈🀈🀈' },
    { id: 'angang', name: '暗槓', score: 2, desc: '1副暗槓，全自己抓 🀇🀇🀇🀇' },
    { id: 'duanyao', name: '斷幺', score: 2, desc: '和牌中沒有1、9及字牌(東南西北中發白)' },

    // 1番 (13种)
    { id: 'yibangao', name: '一般高', score: 1, desc: '一種花色2副相同的順子 🀇🀈🀉 🀇🀈🀉' },
    { id: 'xixiangfeng', name: '喜相逢', score: 1, desc: '2種花色2副序數相同的順子 🀇🀈🀉 🀐🀑🀒' },
    { id: 'lianliu', name: '連六', score: 1, desc: '同花色6張相連順子 🀈🀉🀊 🀋🀌🀍' },
    { id: 'laoshaofu', name: '老少副', score: 1, desc: '同花色123+789 🀇🀈🀉 🀍🀎🀏' },
    { id: 'yaojiuke', name: '幺九刻', score: 1, desc: '3張1或9序数牌或非門風圈風的風牌 🀇🀇🀇' },
    { id: 'minggang', name: '明槓', score: 1, desc: '1副明杠 🀇🀇🀇🀇' },
    { id: 'queyimen', name: '缺一門', score: 1, desc: '和牌中缺少一種花色序數牌，如只有萬和餅' },
    { id: 'wuzi', name: '無字', score: 1, desc: '和牌中沒有字牌(東南西北中發白)' },
    { id: 'bianzhang', name: '邊張', score: 1, desc: '單和123的3或789的7 🀇🀈和🀉' },
    { id: 'kanzhang', name: '坎張', score: 1, desc: '和順子中間的牌 🀇🀉和🀈' },
    { id: 'dandiaojiang', name: '單釣', score: 1, desc: '釣單張牌作將 🀇和🀇' },
    { id: 'zimo', name: '自摸', score: 1, desc: '自己抓牌和' },
    { id: 'huapai', name: '花牌', score: 1, desc: '即春夏秋冬梅蘭竹菊，每花計一分' }
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
                <li>自动或点击"计算番数"查看结果</li>
                <li>起和番数为8番</li>
            </ul>
        </details>
    `;

    // 5. 渲染页面
    rulesContainer.innerHTML = html;
}

// DOM 加载完成后执行渲染
document.addEventListener('DOMContentLoaded', renderRulesReference);