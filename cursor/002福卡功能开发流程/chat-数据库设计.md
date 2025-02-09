
当前有一个微信小程序，使用云开发数据库
设计一个 duo_blessings 祝福语 数据表
字段如下：

```javascript
{
    "_id": "string",          // 祝福语ID
    "id": "string",          // 祝福语ID 同 _id
    "content": "string",      // 四字祝福语内容
    "category": ["string"],  // 类别可以包含: study/work/love/wealth/health/family/friendship
    "probability": number,   // 生成概率 (0-1)
    "weight": number,        // 排序权重 (1-100)
    "order": number,         // 排序 显示顺序 代表数据库中的具体数据排序
    "isActive": boolean,    // 是否启用
    "createdAt": "Date",     // 创建时间
    "updatedAt": "Date"      // 更新时间
}

```
参考以下数据中的 id 字段，设计 category 字段
```javascript
      { id: 'health', name: '健康' },
      { id: 'family', name: '家庭' },
      { id: 'wealth', name: '财富' },
      { id: 'work', name: '事业' },
      { id: 'friendship', name: '友情' },
      { id: 'love', name: '爱情' },
      { id: 'study', name: '学业' },
      { id: 'all', name: '全部' }
```


初始化参考以下json 格式

json 格式

```json

{"_id":"health_1","order":1,"category":["health"],"content":"身体健康","createdAt":{"$date":"2025-01-22T17:42:49.233Z"},"id":"health_1","isActive":true,"probability":0.8,"updatedAt":{"$date":"2025-01-22T17:42:49.233Z"},"weight":90.0}
{"_id":"family_2","order":1,"category":["family"],"content":"家庭美满","createdAt":{"$date":"2025-01-22T17:42:49.233Z"},"id":"family_2","isActive":true,"probability":0.7,"updatedAt":{"$date":"2025-01-22T17:42:49.233Z"},"weight":80.0}

```


基于以上梳理，初始化 祝福语 数据表


      { id: 'health', name: '健康' },
      { id: 'family', name: '家庭' },
      { id: 'wealth', name: '财富' },
      { id: 'work', name: '事业' },
      { id: 'friendship', name: '友情' },
      { id: 'love', name: '爱情' },
      { id: 'study', name: '学业' }


1. 健康类（health）- 50条
2. 家庭类（family）- 50条
3. 财富类（wealth）- 50条
4. 事业类（work）- 50条
5. 友情类（friendship）- 50条
6. 爱情类（love）- 50条
7. 学业类（study）- 50条