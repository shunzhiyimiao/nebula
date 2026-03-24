-- CreateEnum
CREATE TYPE "Grade" AS ENUM ('PRIMARY_1', 'PRIMARY_2', 'PRIMARY_3', 'PRIMARY_4', 'PRIMARY_5', 'PRIMARY_6', 'JUNIOR_1', 'JUNIOR_2', 'JUNIOR_3', 'SENIOR_1', 'SENIOR_2', 'SENIOR_3');

-- CreateEnum
CREATE TYPE "Subject" AS ENUM ('MATH', 'CHINESE', 'ENGLISH', 'PHYSICS', 'CHEMISTRY', 'BIOLOGY', 'HISTORY', 'GEOGRAPHY', 'POLITICS');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('CHOICE', 'MULTI_CHOICE', 'FILL_BLANK', 'SHORT_ANSWER', 'CALCULATION', 'PROOF', 'APPLICATION', 'TRUE_FALSE', 'OTHER');

-- CreateEnum
CREATE TYPE "ErrorType" AS ENUM ('CONCEPT_CONFUSION', 'FORMULA_ERROR', 'CALCULATION_MISTAKE', 'LOGIC_ERROR', 'MISSING_CONDITION', 'METHOD_WRONG', 'CARELESS', 'NOT_UNDERSTOOD', 'OTHER');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD', 'CHALLENGE');

-- CreateEnum
CREATE TYPE "MasteryLevel" AS ENUM ('NOT_MASTERED', 'PARTIAL', 'MASTERED');

-- CreateEnum
CREATE TYPE "PracticeType" AS ENUM ('DAILY', 'WEEKLY', 'TARGETED', 'REVIEW', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'EXPIRED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "grade" "Grade",
    "subjects" "Subject"[] DEFAULT ARRAY[]::"Subject"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "gradeLevel" "Grade",
    "questionType" "QuestionType" NOT NULL,
    "originalImage" TEXT,
    "questionText" TEXT NOT NULL,
    "questionLatex" TEXT,
    "solution" JSONB NOT NULL,
    "solutionText" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "keyFormulas" JSONB,
    "userAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "isInNotebook" BOOLEAN NOT NULL DEFAULT false,
    "errorReason" TEXT,
    "errorType" "ErrorType",
    "masteryLevel" "MasteryLevel" NOT NULL DEFAULT 'NOT_MASTERED',
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "nextReviewAt" TIMESTAMP(3),
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "source" TEXT,
    "chapter" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgePoint" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" "Subject" NOT NULL,
    "gradeLevel" "Grade",
    "chapter" TEXT,
    "definition" TEXT NOT NULL,
    "formulas" JSONB,
    "keyPoints" JSONB,
    "examples" JSONB,
    "commonMistakes" JSONB,
    "parentId" TEXT,
    "relatedIds" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "KnowledgePoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionKnowledgePoint" (
    "questionId" TEXT NOT NULL,
    "knowledgePointId" TEXT NOT NULL,
    "isMainPoint" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "QuestionKnowledgePoint_pkey" PRIMARY KEY ("questionId","knowledgePointId")
);

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "PracticeType" NOT NULL,
    "subject" "Subject" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetKnowledgePoints" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "difficulty" "Difficulty" NOT NULL DEFAULT 'MEDIUM',
    "questionCount" INTEGER NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "score" INTEGER,
    "totalScore" INTEGER,
    "accuracy" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeQuestion" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "questionText" TEXT NOT NULL,
    "questionLatex" TEXT,
    "questionType" "QuestionType" NOT NULL,
    "options" JSONB,
    "correctAnswer" TEXT NOT NULL,
    "solution" JSONB NOT NULL,
    "steps" JSONB NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "knowledgePointIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "originQuestionId" TEXT,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "PracticeQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "practiceQuestionId" TEXT NOT NULL,
    "userAnswer" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "timeSpent" INTEGER,
    "aiExplanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "questionsScanned" INTEGER NOT NULL DEFAULT 0,
    "questionsCorrect" INTEGER NOT NULL DEFAULT 0,
    "questionsWrong" INTEGER NOT NULL DEFAULT 0,
    "practiceCompleted" INTEGER NOT NULL DEFAULT 0,
    "practiceAccuracy" DOUBLE PRECISION,
    "studyMinutes" INTEGER NOT NULL DEFAULT 0,
    "newKnowledgePoints" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DailyStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE INDEX "Question_userId_subject_createdAt_idx" ON "Question"("userId", "subject", "createdAt");

-- CreateIndex
CREATE INDEX "Question_userId_isInNotebook_subject_idx" ON "Question"("userId", "isInNotebook", "subject");

-- CreateIndex
CREATE INDEX "Question_userId_masteryLevel_idx" ON "Question"("userId", "masteryLevel");

-- CreateIndex
CREATE INDEX "Question_userId_nextReviewAt_idx" ON "Question"("userId", "nextReviewAt");

-- CreateIndex
CREATE INDEX "KnowledgePoint_subject_gradeLevel_idx" ON "KnowledgePoint"("subject", "gradeLevel");

-- CreateIndex
CREATE UNIQUE INDEX "KnowledgePoint_name_subject_key" ON "KnowledgePoint"("name", "subject");

-- CreateIndex
CREATE INDEX "PracticeSession_userId_type_createdAt_idx" ON "PracticeSession"("userId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "PracticeSession_userId_status_idx" ON "PracticeSession"("userId", "status");

-- CreateIndex
CREATE INDEX "PracticeQuestion_sessionId_sortOrder_idx" ON "PracticeQuestion"("sessionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "PracticeAnswer_practiceQuestionId_key" ON "PracticeAnswer"("practiceQuestionId");

-- CreateIndex
CREATE INDEX "DailyStats_userId_date_idx" ON "DailyStats"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailyStats_userId_date_key" ON "DailyStats"("userId", "date");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgePoint" ADD CONSTRAINT "KnowledgePoint_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "KnowledgePoint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionKnowledgePoint" ADD CONSTRAINT "QuestionKnowledgePoint_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionKnowledgePoint" ADD CONSTRAINT "QuestionKnowledgePoint_knowledgePointId_fkey" FOREIGN KEY ("knowledgePointId") REFERENCES "KnowledgePoint"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeQuestion" ADD CONSTRAINT "PracticeQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PracticeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeQuestion" ADD CONSTRAINT "PracticeQuestion_originQuestionId_fkey" FOREIGN KEY ("originQuestionId") REFERENCES "Question"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAnswer" ADD CONSTRAINT "PracticeAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAnswer" ADD CONSTRAINT "PracticeAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "PracticeSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeAnswer" ADD CONSTRAINT "PracticeAnswer_practiceQuestionId_fkey" FOREIGN KEY ("practiceQuestionId") REFERENCES "PracticeQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyStats" ADD CONSTRAINT "DailyStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
