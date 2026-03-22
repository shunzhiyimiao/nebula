/**
 * 检查数据库是否已配置（非占位符 URL）
 * 在静态构建时数据库不可用，API 路由返回空数据
 */
export function isDatabaseAvailable(): boolean {
  const url = process.env.DATABASE_URL || "";
  return url.length > 0 && !url.includes("user:password@localhost");
}
