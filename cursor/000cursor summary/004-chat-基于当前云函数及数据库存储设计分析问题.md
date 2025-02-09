


当前 duoGameStatistics 云函数 有一个  updateGameStats  方法，代码如下，执行代码后数据库存储数据如下，与 预期不符

代码：
<especially_relevant_code_snippet>
文件路径: erDuoLab\cloudfunctions\duoGameStatistics\index.js
// 代码内容
/**
 * 更新游戏统计
 */
async function updateGameStats(userId, gameData) {
  try {
    const {
      difficulty,
      timeSpent,
      errors,
      hintsUsed,
      completed
    } = gameData

    // 获取当前统计
    const userStats = await db.collection('duo_user_statistics')
      .where({ userId })
      .get()

    const isPerfectGame = errors === 0 && hintsUsed === 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 准备更新数据
    const updateData = {
      [`stats.gamesTotal`]: _.inc(1),                                    // 更新总局数
      [`stats.difficultyStats.${difficulty}.total`]: _.inc(1),          // 更新难度总局数
      updatedAt: db.serverDate()
    }

    if (completed) {
      updateData[`stats.gamesCompleted`] = _.inc(1)                     // 更新完成数
      updateData[`stats.difficultyStats.${difficulty}.completed`] = _.inc(1)  // 更新难度完成数

      // 更新最佳时间
      if (!userStats.data[0]?.stats.difficultyStats[difficulty]?.bestTime ||
        timeSpent < userStats.data[0].stats.difficultyStats[difficulty].bestTime) {
        updateData[`stats.difficultyStats.${difficulty}.bestTime`] = timeSpent
      }

      // 更新完美游戏统计
      if (isPerfectGame) {
        updateData[`stats.difficultyStats.${difficulty}.perfectGames`] = _.inc(1)
        updateData[`stats.streaks.current.perfect`] = _.inc(1)
      } else {
        updateData[`stats.streaks.current.perfect`] = 0
      }

      // 更新连续记录
      if (userStats.data[0]?.stats.lastPlayDate) {
        const lastPlay = new Date(userStats.data[0].stats.lastPlayDate)
        lastPlay.setHours(0, 0, 0, 0)
        const daysDiff = Math.floor((today - lastPlay) / (1000 * 60 * 60 * 24))

        if (daysDiff === 1) {
          updateData[`stats.streaks.current.daily`] = _.inc(1)
        } else if (daysDiff > 1) {
          updateData[`stats.streaks.current.daily`] = 1
        }
      } else {
        updateData[`stats.streaks.current.daily`] = 1
      }

      // 更新最佳连续记录
      if (userStats.data[0]?.stats.streaks.current.daily > userStats.data[0]?.stats.streaks.best.daily) {
        updateData[`stats.streaks.best.daily`] = userStats.data[0].stats.streaks.current.daily
      }
      if (userStats.data[0]?.stats.streaks.current.perfect > userStats.data[0]?.stats.streaks.best.perfect) {
        updateData[`stats.streaks.best.perfect`] = userStats.data[0].stats.streaks.current.perfect
      }

      // 更新最后游戏日期
      updateData[`stats.lastPlayDate`] = today
    }

    // 执行更新或创建
    if (!userStats.data.length) {
      await db.collection('duo_user_statistics').add({
        data: {
          userId,
          stats: initializeUserStats(),
          ...updateData
        }
      })
    } else {
      await db.collection('duo_user_statistics')
        .where({ userId })
        .update({ data: updateData })
    }

    return { code: 0 }
  } catch (error) {
    console.error('Update game stats failed:', error)
    throw error
  }
}
</especially_relevant_code_snippet>


数据：
```javascript
{
    "_id": "4d40d44d676d3f23005cd3ae1341f679",
    "userId": "olzgS5bifeSdfRQvWsFDh2wrRfUM",
    "stats": {
        "gamesTotal": 0,
        "gamesCompleted": 0,
        "difficultyStats": {
            "easy": {
                "total": 0,
                "completed": 0,
                "perfectGames": 0,
                "bestTime": null
            },
            "medium": {
                "total": 0,
                "completed": 0,
                "perfectGames": 0,
                "bestTime": null
            },
            "hard": {
                "total": 0,
                "completed": 0,
                "perfectGames": 0,
                "bestTime": null
            }
        },
        "streaks": {
            "current": {
                "daily": 0,
                "perfect": 0
            },
            "best": {
                "daily": 0,
                "perfect": 0
            }
        },
        "lastPlayDate": null
    },
    "stats.gamesTotal": {
        "operator": "inc",
        "operands": [
            1
        ],
        "fieldName": {}
    },
    "stats.difficultyStats.easy.total": {
        "operator": "inc",
        "operands": [
            1
        ],
        "fieldName": {}
    },
    "updatedAt": {
        "$date": "2024-12-26T11:33:55.069Z"
    },
    "stats.gamesCompleted": {
        "operator": "inc",
        "operands": [
            1
        ],
        "fieldName": {}
    },
    "stats.difficultyStats.easy.completed": {
        "operator": "inc",
        "operands": [
            1
        ],
        "fieldName": {}
    },
    "stats.difficultyStats.easy.bestTime": 19,
    "stats.difficultyStats.easy.perfectGames": {
        "operator": "inc",
        "operands": [
            1
        ],
        "fieldName": {}
    },
    "stats.streaks.current.perfect": {
        "operator": "inc",
        "operands": [
            1
        ],
        "fieldName": {}
    },
    "stats.streaks.current.daily": 1,
    "stats.lastPlayDate": {
        "$date": "2024-12-26T00:00:00Z"
    }
}
```

分析一下 updateGameStats 的 操作逻辑，并给出 修改建议
