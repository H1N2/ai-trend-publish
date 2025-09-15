#!/usr/bin/env -S deno run -A

import { SQLiteManager } from "../src/db/sqlite-manager.ts";
import { Logger } from "@zilla/logger";
import { ConfigManager } from "../src/utils/config/config-manager.ts";

const logger = new Logger("SQLiteBackup");

async function backup() {
  try {
    const configManager = ConfigManager.getInstance();
    const dbPath = await configManager.get<string>("SQLITE_DB_PATH") || "./data/trendfinder.db";
    
    // 生成备份文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = dbPath.replace('.db', `_backup_${timestamp}.db`);
    
    logger.info(`开始备份数据库: ${dbPath} -> ${backupPath}`);
    
    // 执行 VACUUM INTO 命令进行备份
    await SQLiteManager.initialize();
    const db = await SQLiteManager.initialize();
    
    // 使用 SQLite 的 VACUUM INTO 命令创建备份
    await db.run(`VACUUM INTO '${backupPath}'`);
    
    logger.info(`数据库备份完成: ${backupPath}`);
    
    // 显示备份文件信息
    const backupStat = await Deno.stat(backupPath);
    logger.info(`备份文件大小: ${(backupStat.size / 1024 / 1024).toFixed(2)} MB`);
    
    // 清理旧备份（保留最近7天的备份）
    await cleanOldBackups(dbPath);
    
  } catch (error) {
    logger.error("数据库备份失败:", error);
    throw error;
  } finally {
    await SQLiteManager.close();
  }
}

async function cleanOldBackups(dbPath: string) {
  try {
    const dbDir = dbPath.substring(0, dbPath.lastIndexOf('/'));
    const dbName = dbPath.substring(dbPath.lastIndexOf('/') + 1).replace('.db', '');
    
    const entries = [];
    for await (const entry of Deno.readDir(dbDir)) {
      if (entry.isFile && entry.name.startsWith(`${dbName}_backup_`) && entry.name.endsWith('.db')) {
        const filePath = `${dbDir}/${entry.name}`;
        const stat = await Deno.stat(filePath);
        entries.push({
          name: entry.name,
          path: filePath,
          mtime: stat.mtime
        });
      }
    }
    
    // 按修改时间排序，保留最新的7个备份
    entries.sort((a, b) => (b.mtime?.getTime() || 0) - (a.mtime?.getTime() || 0));
    
    const toDelete = entries.slice(7);
    for (const entry of toDelete) {
      await Deno.remove(entry.path);
      logger.info(`删除旧备份: ${entry.name}`);
    }
    
    if (toDelete.length > 0) {
      logger.info(`清理了 ${toDelete.length} 个旧备份文件`);
    }
    
  } catch (error) {
    logger.warn("清理旧备份时出错:", error);
  }
}

if (import.meta.main) {
  backup().catch((error) => {
    console.error("备份失败:", error);
    Deno.exit(1);
  });
}