### 6. 交互改进建议
1. 提问前可以更清晰地列出：
   - 当前代码的状态
   - 期望实现的效果
   - 已尝试的解决方案
   
2. 代码对比时可以：
   - 明确指出关键的代码片段
   - 说明具体的修改点
   
3. 问题解决后可以：
   - 验证解决方案是否完全有效
   - 及时反馈遇到的新问题

4. 整体交互建议：
   - 每次聚焦于一个具体问题
   - 避免同时处理多个相关但不同的问题
   - 在解决一个问题后再转向下一个问题


每轮明确当前进展
指出仍存在的具体问题
确认是否达到预期效果



-------------------------------------------------------------------------------

良好的交互方式：
- 使用 <especially_relevant_code_snippet> 标签提供关键代码
- 明确指出要分析的问题
- 如果代码有更新，明确告知是更新后的版本
- 一次只关注一个具体问题

示例：
<especially_relevant_code_snippet>
文件路径: xxx/xxx.js
// 代码内容
</especially_relevant_code_snippet>

我的问题是：xxx


-------------------------------------------------------------------------------

codebase 使用方法

使用步骤：
1. 初始化 Codebase：
   - 提供项目的主要结构
   - 说明关键文件的作用

2. 进行分析：
   - 使用 search 命令搜索相关代码
   - 使用 list 命令查看文件列表
   - 使用 show 命令查看具体文件内容

3. 最佳实践：
   - 先提供项目结构
   - 明确分析目标
   - 逐步深入具体实现


// 初始化 Codebase
我的项目结构如下：
/miniprogram
  /services
  /pages
  /utils
  
// 分析具体问题
我想分析 achievement 系统的实现，
相关文件在 /services/achievement/ 目录下


-------------------------------------------------------------------------------

/codebase search "globalEventManager.on("


大型系统，包含大量文件时，梳理分析业务流程时，chat的交互实践：
1. 先提供代码的整体结构
2. 提出希望分析的具体问题
3. 先分析出业务问题可能涉及的具体文件
4. 通过分析，提出希望提供的具体文件 
5. 多次交互，确定业务调用链
6. 然后针对具体代码进行分析
4. 完全基于实际代码进行梳理，不确定的逻辑或者文件，及时询问
5. 不对不存在的代码进行臆测 


<especially_relevant_code_snippet>
文件路径: xxx/xxx.js
// 代码内容
</especially_relevant_code_snippet>
<especially_relevant_code_snippet>
文件路径: xxx/xxx.js
// 代码内容
</especially_relevant_code_snippet>
<especially_relevant_code_snippet>
文件路径: xxx/xxx.js
// 代码内容
</especially_relevant_code_snippet>
<especially_relevant_code_snippet>
文件路径: xxx/xxx.js
// 代码内容
</especially_relevant_code_snippet>
<especially_relevant_code_snippet>
文件路径: xxx/xxx.js
// 代码内容
</especially_relevant_code_snippet>
<especially_relevant_code_snippet>
文件路径: xxx/xxx.js
// 代码内容
</especially_relevant_code_snippet>
<especially_relevant_code_snippet>
文件路径: xxx/xxx.js
// 代码内容
</especially_relevant_code_snippet>