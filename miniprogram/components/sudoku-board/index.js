Component({
    properties: {
        // 当前数独数据
        puzzle: {
            type: Array,
            value: []
        },
        // 初始数独数据（用于区分初始数字）
        initialPuzzle: {
            type: Array,
            value: []
        },
        // 是否可编辑
        editable: {
            type: Boolean,
            value: true
        },
        enableNumberHighlight: {  // 新增：控制高亮功能的开关
            type: Boolean,
            value: true
        }
    },

    data: {
        selectedCell: null, // 当前选中的单元格
        cellStatus: {}, // 单元格状态（错误/警告/正确）
        cellStyles: {}, // 单元格样式
        animatingCells: {}, // 动画状态
        selectedNumber: null,  // 当前选中数字
        lastHighlightedNumber: null

    },

    lifetimes: {
        attached() {
            // 确保数据结构完整
            this.setData({
                cellStatus: {},
                cellStyles: {},
                animatingCells: {}
            });
        }
    },

    methods: {
        /**
         * 显示单元格动画效果
         * @param {number} row - 行索引 (0-8)
         * @param {number} col - 列索引 (0-8)
         * @description 显示单元格提示动画，动画持续800ms
         * @example
         * this.showCellAnimation(0, 0); // 显示第一个单元格的动画
         */
        showCellAnimation(row, col) {
            const key = `${row}-${col}`;

            // 设置动画状态和提示标记
            this.setCellStatus(row, col, {
                status: 'correct',
                isHint: true  // 明确设置提示标记
            });

            this.setData({
                [`animatingCells.${key}`]: true
            });

            setTimeout(() => {
                this.setData({
                    [`animatingCells.${key}`]: false
                });
            }, 800);
        },


        /**
         * 处理单元格点击事件
         * @param {Object} event - 点击事件对象
         * @param {Object} event.currentTarget.dataset - 包含行列信息
         * @param {number} event.currentTarget.dataset.row - 行索引
         * @param {number} event.currentTarget.dataset.col - 列索引
         * @description 处理单元格点击，包含初始数字判断和动画状态判断
         */
        onTapCell(event) {
            if (!this.properties.editable) return

            // 获取当前单元格的数字
            const { row, col } = event.currentTarget.dataset
            // 获取当前选中的数字
            const currentNumber = this.properties.puzzle[row][col];
            // 检查是否是初始数字
            const isInitialNumber = this.properties.initialPuzzle[row][col]
            // 检查是否正在动画中
            const isAnimating = this.data.animatingCells[`${row}-${col}`];

            // 如果单元格正在动画中，不响应点击
            if (isAnimating) return;

            // 新增：点击数字时触发高亮
            if (currentNumber) {
                this.highlightSameNumber(currentNumber);
                this.triggerEvent('numbertap', { number: currentNumber });
            }

            // 如果不是初始数字，允许选中
            if (!isInitialNumber) {
                this.setData({ selectedCell: { row, col } })
            } else {
                // 初始数字点击时清除选中状态
                this.setData({ selectedCell: null })
            }
            this.triggerEvent('celltap', { row, col, isInitialNumber })
        },

        /**
         * 重置所有样式
         * @public
         */
        resetStyles() {
            this.clearAllStatus()  // 使用统一的清理方法
        },

        /**
         * 强制更新组件
         * @public
         */
        forceUpdate() {
            const currentData = this.data
            this.setData({
                ...currentData,
                _updateFlag: Date.now() // 添加一个更新标记强制刷新
            })
        },

        /**
         * 设置单元格状态
         * @param {number} row - 行索引 (0-8)
         * @param {number} col - 列索引 (0-8)
         * @param {string} status - 状态值 ('error'|'warning'|'correct')
         * @description 设置指定单元格的状态，保留提示标记
         */
        setCellStatus(row, col, status) {
            const key = `cellStatus.${row}-${col}`;
            const currentCell = this.data.cellStatus[`${row}-${col}`] || {};

            // 只更新 cellStatus
            if (typeof status === 'object') {
                this.setData({
                    [key]: {
                        ...status,
                        isHint: status.isHint ?? currentCell.isHint ?? false
                    }
                });
            } else {
                this.setData({
                    [key]: {
                        status,
                        isHint: currentCell.isHint ?? false
                    }
                });
            }
        },


        /**
         * 清除所有状态
         * @description 重置所有单元格状态，包括选中、状态和动画
         */
        clearAllStatus() {
            this.setData({
                selectedCell: null,
                cellStatus: {},
                cellStyles: {},
                animatingCells: {},
                selectedNumber: null
            })
        },

        /**
         * 设置选中单元格
         * @param {number} row - 行索引 (0-8)
         * @param {number} col - 列索引 (0-8)
         * @description 设置当前选中的单元格
         */
        setSelectedCell(row, col) {
            this.setData({
                selectedCell: { row, col }
            })
        },

        /**
         * 高亮单元格
         * @param {number} row - 行索引 (0-8)
         * @param {number} col - 列索引 (0-8)
         * @description 设置指定单元格的高亮状态
         */
        highlightCell(row, col) {
            const key = `cellStyles.${row}-${col}.highlight`
            this.setData({
                [key]: true
            })
        },

        /**
         * 设置单元格笔记
         * @param {number} row - 行索引 (0-8)
         * @param {number} col - 列索引 (0-8)
         * @param {number[]} notes - 笔记数组
         * @description 设置指定单元格的笔记内容
         */
        setNotes(row, col, notes) {
            const key = `cellStyles.${row}-${col}.notes`;
            this.setData({
                [key]: notes
            });
        },

        /**
         * 高亮相同数字
         * @param {number|null} number - 要高亮的数字 (1-9)
         * @description 高亮所有与指定数字相同的单元格
         */
        highlightSameNumber(number) {
            this.setData({
                selectedNumber: number
            });
        },

        /**
         * 清除相同数字高亮
         * @description 清除当前选中的数字高亮状态
         */
        clearSameNumberHighlight() {
            this.setData({
                selectedNumber: null
            });
        },

        /**
         * 切换数字高亮
         * @param {number} number - 要高亮的数字 (1-9)
         * @description 切换当前选中的数字高亮状态
         */
        toggleNumberHighlight(number) {
            if (this.data.lastHighlightedNumber === number) {
                this.clearSameNumberHighlight();
            } else {
                this.highlightSameNumber(number);
            }
            this.setData({
                lastHighlightedNumber: this.data.selectedNumber
            });
        },

        /**
         * 清除高亮状态
         * @description 清除所有单元格的高亮状态
         */
        clearHighlight() {
            const newStyles = {}
            Object.keys(this.data.cellStyles).forEach(key => {
                newStyles[key] = {
                    ...this.data.cellStyles[key],
                    highlight: false
                }
            })
            this.setData({
                cellStyles: newStyles
            })
        },

        /**
         * 高亮相关单元格
         * @param {number} row - 行索引 (0-8)
         * @param {number} col - 列索引 (0-8)
         * @description 高亮指定单元格所在的行、列和3x3宫格内的所有单元格
         */
        highlightRelatedCells(row, col) {
            const newStyles = {};

            // 同行
            for (let i = 0; i < 9; i++) {
                newStyles[`${row}-${i}`] = {
                    ...this.data.cellStyles[`${row}-${i}`],
                    highlight: true
                };
            }

            // 同列
            for (let i = 0; i < 9; i++) {
                newStyles[`${i}-${col}`] = {
                    ...this.data.cellStyles[`${i}-${col}`],
                    highlight: true
                };
            }

            // 同宫格
            const boxRow = Math.floor(row / 3) * 3;
            const boxCol = Math.floor(col / 3) * 3;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 3; j++) {
                    newStyles[`${boxRow + i}-${boxCol + j}`] = {
                        ...this.data.cellStyles[`${boxRow + i}-${boxCol + j}`],
                        highlight: true
                    };
                }
            }

            this.setData({
                cellStyles: {
                    ...this.data.cellStyles,
                    ...newStyles
                }
            });
        },
        /**
         * 更新单元格数字
         * @param {number} row - 行索引 (0-8)
         * @param {number} col - 列索引 (0-8)
         * @param {number|null} value - 数字值
         */
        async updateCell(row, col, value) {
            // 更新数独数据
            const newPuzzle = [...this.properties.puzzle];
            if (!newPuzzle[row]) {
                newPuzzle[row] = [];
            }
            newPuzzle[row][col] = value;

            this.setData({
                puzzle: newPuzzle
            });

            // 清除该单元格的所有状态
            this.setCellStatus(row, col, {
                status: value ? 'normal' : null,
                isHint: false
            });


            // 清除该单元格的笔记
            // 获取当前的 cellStyles
            const cellStyles = { ...this.data.cellStyles };
            const cellKey = `${row}-${col}`;

            // 如果存在该单元格的样式对象
            if (cellStyles[cellKey]) {
                // 删除 notes 属性
                delete cellStyles[cellKey].notes;
            }

            // 更新整个 cellStyles 对象
            await this.setData({
                [`cellStyles`]: cellStyles
            });
        },

        /**
         * 批量更新单元格
         * @param {Array<{row: number, col: number, value: number}>} updates - 更新数组
         */
        batchUpdateCells(updates) {
            const newPuzzle = [...this.properties.puzzle];
            const cellStatus = { ...this.data.cellStatus };
            const cellStyles = { ...this.data.cellStyles };

            updates.forEach(({ row, col, value }) => {
                // 更新数独数据
                if (!newPuzzle[row]) {
                    newPuzzle[row] = [];
                }
                newPuzzle[row][col] = value;

                // 更新状态
                const statusKey = `${row}-${col}`;
                cellStatus[statusKey] = {
                    status: value ? 'normal' : null,
                    isHint: false
                };

                // 清除笔记
                if (cellStyles[statusKey]) {
                    delete cellStyles[statusKey].notes;
                }
            });

            this.setData({
                puzzle: newPuzzle,
                cellStatus,
                cellStyles
            });
        }
    }
})
