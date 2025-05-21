-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedTime" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Question" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "options" TEXT,
    "answer" TEXT NOT NULL,
    "analysis" TEXT,
    "difficulty" INTEGER NOT NULL,
    "createdTime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedTime" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
