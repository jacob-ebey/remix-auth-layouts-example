/*
  Warnings:

  - Added the required column `userPasswordId` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "userPasswordId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "UserPassword" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPassword_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_userPasswordId_fkey" FOREIGN KEY ("userPasswordId") REFERENCES "UserPassword"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
