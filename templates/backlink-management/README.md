# Backlink / Badge 管理模板

这是一个可复制到其他 ShipAny Next / TanStack Start 项目的后台外链管理模块。

## 功能

- 后台 CRUD：网站名称、对方网址、显示文字、Badge 图片地址、放置位置、`nofollow` / `sponsored`
- `pending` / `approved` 审核状态
- 启用/停用开关
- 仅允许 `http` / `https` 外链
- 不存储、不执行第三方 JavaScript、iframe 或任意 HTML
- API 统一使用 `/api/admin/backlinks`

## 复制清单

将以下文件复制到目标项目对应位置：

```text
src/modules/backlinks/service.ts
src/routes/api/admin/backlinks.ts
src/routes/admin/backlinks.tsx
```

同时将 `src/config/db/schema.postgres.ts` 中的 `backlink` 表定义复制到目标项目的数据库模板；如果目标项目使用 SQLite 或 MySQL，也需要按对应 Drizzle 方言复制同一字段定义。然后执行：

```bash
pnpm db:push
```

## 集成步骤

1. 在 `src/routes/admin/route.tsx` 的内容导航中加入 `/admin/backlinks`。
2. 将 `messages/en.json` 和 `messages/zh.json` 中 `admin.nav.backlinks`、`admin.backlinks.*`、`common.cancel` 翻译键复制过去。
3. 确认目标项目已有 `Input`、`Button`、`Card`、`Badge` 组件和 `@/lib/api-client`。
4. 确认管理员拥有 `admin.*` 权限。
5. 如需在前台显示已审核外链，在页面服务端调用 `listEnabled('footer')`，只渲染返回的 `targetUrl`、`displayText` 与可选 `imageUrl`。

## 安全约束

- 生产环境建议只允许 HTTPS。
- 不要把对方提供的 Badge 代码直接 `dangerouslySetInnerHTML`。
- 不要执行外链 JavaScript，也不要允许任意 iframe。
- 如果需要审核流，可在 API 中限制只有 `admin.*` 用户可以把状态改为 `approved`。

## 已验证

本项目已运行 `pnpm db:push` 和 `pnpm build` 验证。
