/*
  Warnings:

  - You are about to drop the column `code` on the `Device` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Device` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Device_code_key` ON `Device`;

-- AlterTable
ALTER TABLE `Device` DROP COLUMN `code`,
    DROP COLUMN `name`,
    MODIFY `qrCode` LONGTEXT NULL;
