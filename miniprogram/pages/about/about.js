Page({
  data: {
    currentTab: 'intro',
    difficultyLevels: [
      { level: '初级', description: '需要填写的空格较少，逻辑推理简单' },
      { level: '中级', description: '需要更复杂的推理方法' },
      { level: '高级', description: '可能需要使用多种解题技巧的组合' }
    ],
    gameRules: [
      '1. 游戏在9×9的格子中进行',
      '2. 整个格子被分为9个3×3的小方格',
      '3. 每一行必须包含1-9的数字，且不能重复',
      '4. 每一列必须包含1-9的数字，且不能重复',
      '5. 每个3×3的小方格必须包含1-9的数字，且不能重复'
    ],
    solvingTips: [
      { name: '单数法', description: '某个格子只可能填入一个数字' },
      { name: '唯一数法', description: '某个数字在行/列/宫中只能填在一个位置' },
      { name: '区块法', description: '利用数字在某些格子的分布规律' },
      { name: '候选数删减法', description: '通过排除法确定可能的数字' }
    ],
    benefits: [
      '1. 提高逻辑思维和推理分析能力',
      '2. 培养持续的注意力集中',
      '3. 锻炼耐心和毅力',
      '4. 有助于预防认知能力衰退'
    ]
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({ currentTab: tab });
  },

  onLoad() {
    wx.setNavigationBarTitle({
      title: '数独教学'
    });
  }
});