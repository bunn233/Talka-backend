/*
  Warnings:

  - You are about to alter the column `old_value` on the `activitylog` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.
  - You are about to alter the column `new_value` on the `activitylog` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.

*/
-- AlterTable
ALTER TABLE `activitylog` ADD COLUMN `message` VARCHAR(191) NULL,
    ADD COLUMN `metadata` JSON NULL,
    ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'system',
    MODIFY `old_value` JSON NULL,
    MODIFY `new_value` JSON NULL;

-- CreateIndex
CREATE INDEX `ActivityLog_chat_session_id_type_created_at_idx` ON `ActivityLog`(`chat_session_id`, `type`, `created_at`);

-- RenameIndex
ALTER TABLE `activitylog` RENAME INDEX `ActivityLog_user_id_fkey` TO `ActivityLog_user_id_idx`;
