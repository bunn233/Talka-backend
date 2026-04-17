import prisma from "../lib/prisma.js";
import logger from "../lib/logger.js";

/**
 * Core DB Logger - ใช้บันทึก log ลง Database และสำรองลงไฟล์ผ่าน Winston หาก DB มีปัญหา
 */
export async function dbLog(data) {
  try {
    const record = await prisma.activityLog.create({
      data: {
        action: data.action?.toLowerCase(),
        level: data.level || "info",
        type: data.type || "system",
        message: data.message || null,
        user_id: data.user_id ?? null,
        chat_session_id: data.chat_session_id ?? null,
        request_id: data.request_id ?? null,
        old_value: data.old_value ? String(data.old_value) : null,
        new_value: data.new_value ? String(data.new_value) : null,
        context: data.context ?? null,
        metadata: data.metadata ?? null,
      },
    });

    return record;
  } catch (error) {
    // บันทึกลง Winston (logger.js) เมื่อบันทึกฐานข้อมูลไม่สำเร็จ
    logger.error("db.log.failed", {
      error: error.message,
      action: data?.action,
      data: data
    });
    return null;
  }
}

/**
 * Query activity logs with filtering and pagination
 * @param {object} filters - Filter criteria
 * @param {string} filters.level - Filter by log level ('info' or 'error')
 * @param {string} filters.action - Filter by action name (partial match)
 * @param {number} filters.user_id - Filter by user ID
 * @param {number} filters.chat_session_id - Filter by chat session ID
 * @param {Date} filters.startDate - Filter logs created after this date
 * @param {Date} filters.endDate - Filter logs created before this date
 * @param {number} filters.limit - Number of records to return (default: 50)
 * @param {number} filters.offset - Number of records to skip (default: 0)
 * @param {string} filters.sortBy - Sort field ('created_at', 'action', 'level')
 * @param {string} filters.sortOrder - Sort order ('asc' or 'desc')
 * @returns {Promise<array>} Array of ActivityLog records
 */
export async function getActivityLogs(filters = {}) {
  try {
    const {
      level,
      action,
      user_id,
      chat_session_id,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
      sortBy = "created_at",
      sortOrder = "desc",
    } = filters;

    // Build where clause
    const where = {};

    if (level) where.level = level;
    if (action) where.action = { contains: action };
    if (user_id) where.user_id = user_id;
    if (chat_session_id) where.chat_session_id = chat_session_id;

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = new Date(startDate);
      if (endDate) where.created_at.lte = new Date(endDate);
    }

    const records = await prisma.activityLog.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: {
        [sortBy]: sortOrder.toLowerCase(),
      },
      include: {
        user: {
          select: {
            user_id: true,
            username: true,
            email: true,
          },
        },
        chat: {
          select: {
            chat_session_id: true,
            status: true,
          },
        },
      },
    });

    return records;
  } catch (error) {
    logger.error("Failed to retrieve activity logs", error, {
      context: { filters },
    });
    return [];
  }
}

/**
 * Get total count of activity logs matching filters
 * @param {object} filters - Filter criteria (same as getActivityLogs)
 * @returns {Promise<number>} Total count of matching records
 */
export async function getActivityLogCount(filters = {}) {
  try {
    const { level, action, user_id, chat_session_id, startDate, endDate } =
      filters;

    const where = {};

    if (level) where.level = level;
    if (action) {
      where.action = { contains: action.toLowerCase() };
    }
    if (user_id) where.user_id = user_id;
    if (chat_session_id) where.chat_session_id = chat_session_id;

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at.gte = new Date(startDate);
      if (endDate) where.created_at.lte = new Date(endDate);
    }

    const count = await prisma.activityLog.count({ where });
    return count;
  } catch (error) {
    logger.error("Failed to count activity logs", error, {
      context: { filters },
    });
    return 0;
  }
}

/**
 * Bulk create multiple activity logs (useful for batch operations)
 * @param {array} logDataArray - Array of log entry data
 * @returns {Promise<number>} Number of records created
 */
export async function createActivityLogBatch(logDataArray) {
  try {
    const recordsToCreate = logDataArray.map((logData) => ({
      action: logData.action.toLowerCase(),
      level: logData.level || "info",
      type: logData.type || "system",
      message: logData.message || null,

      user_id: logData.user_id ?? null,
      chat_session_id: logData.chat_session_id ?? null,
      request_id: logData.request_id ?? null,

      old_value: logData.old_value ?? null,
      new_value: logData.new_value ?? null,
      context: logData.context,
      metadata: logData.metadata,
    }));

    const result = await prisma.activityLog.createMany({
      data: recordsToCreate,
      skipDuplicates: true,
    });

    return result.count;
  } catch (error) {
    logger.error("db.activity_log.batch_failed", error, {
      context: { batchSize: logDataArray?.length },
    });
    return 0;
  }
}

/**
 * Delete old logs (for cleanup/archival)
 * @param {Date} beforeDate - Delete logs created before this date
 * @returns {Promise<number>} Number of records deleted
 */
export async function deleteOldActivityLogs(beforeDate) {
  try {
    const result = await prisma.activityLog.deleteMany({
      where: {
        created_at: {
          lt: new Date(beforeDate),
        },
      },
    });

    return result.count;
  } catch (error) {
    logger.error("Failed to delete old activity logs", error, {
      context: { beforeDate },
    });
    return 0;
  }
}

export default {
  dbLog,
  getActivityLogs,
  getActivityLogCount,
  createActivityLogBatch,
  deleteOldActivityLogs,
};
