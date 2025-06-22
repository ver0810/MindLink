// 此文件已弃用 - 系统已迁移到PostgreSQL
// 请使用 backend/config/postgresql.js 进行数据库操作
console.log('⚠️  警告: 此SQLite数据库工具已弃用，请使用PostgreSQL配置');

module.exports = {
    // 提供空的接口以兼容旧代码
    get: () => Promise.resolve(null),
    all: () => Promise.resolve([]),
    run: () => Promise.resolve({ id: null, changes: 0 }),
    close: () => Promise.resolve()
}; 