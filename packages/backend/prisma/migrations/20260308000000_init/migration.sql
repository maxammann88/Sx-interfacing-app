-- CreateTable
CREATE TABLE "countries" (
    "id" SERIAL NOT NULL,
    "fir" INTEGER NOT NULL,
    "debitor1" TEXT NOT NULL,
    "iso" TEXT NOT NULL,
    "kst" INTEGER,
    "name" TEXT NOT NULL,
    "comment" TEXT,
    "verrkto" TEXT,
    "kreditor" TEXT,
    "revc" TEXT,
    "debitor760" TEXT,
    "kreditor760" TEXT,
    "stSchlLstRe" TEXT,
    "stSchlLstGs" TEXT,
    "revc2" TEXT,
    "stSchlLiefRe" TEXT,
    "emails" TEXT,
    "partnerStatus" TEXT,
    "zusatz" TEXT,
    "finalInterfacing" TEXT,
    "vertragsende" TIMESTAMP(3),
    "debitor10" TEXT,
    "paymentBlock" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_data" (
    "id" SERIAL NOT NULL,
    "uid" TEXT,
    "ktod" TEXT NOT NULL,
    "nam1" TEXT,
    "nam2" TEXT,
    "nam3" TEXT,
    "str" TEXT,
    "ort" TEXT,
    "plz" TEXT,
    "lanb" TEXT,
    "payt" INTEGER,

    CONSTRAINT "master_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sap_imports" (
    "id" SERIAL NOT NULL,
    "uploadId" INTEGER NOT NULL,
    "konto" TEXT NOT NULL,
    "buchungsschluessel" TEXT,
    "belegart" TEXT,
    "referenzschluessel3" TEXT,
    "referenz" TEXT,
    "zuordnung" TEXT,
    "buchungsperiode" TEXT,
    "buchungsdatum" TIMESTAMP(3),
    "belegdatum" TIMESTAMP(3),
    "nettofaelligkeit" TIMESTAMP(3),
    "kontoGegenbuchung" TEXT,
    "sollHabenKennz" TEXT,
    "steuerkennzeichen" TEXT,
    "belegnummer" TEXT,
    "p" TEXT,
    "ausgleichsdatum" TIMESTAMP(3),
    "text" TEXT,
    "belegkopftext" TEXT,
    "buchungsprogramm" TEXT,
    "betragHauswaehrung" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hauswaehrung" TEXT,
    "type" TEXT,

    CONSTRAINT "sap_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_cost_imports" (
    "id" SERIAL NOT NULL,
    "uploadId" INTEGER NOT NULL,
    "yearMonth" TEXT,
    "companyCode" TEXT NOT NULL,
    "postingDate" TIMESTAMP(3),
    "offsettingAcctNo" TEXT,
    "assignment" TEXT,
    "documentType" TEXT,
    "documentDate" TIMESTAMP(3),
    "postingKey" TEXT,
    "debitCreditInd" TEXT,
    "amountLocalCurrency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "localCurrency" TEXT,
    "taxCode" TEXT,
    "text" TEXT,
    "postingPeriod" TEXT,
    "costCenter" TEXT,
    "bookingProgram" TEXT,
    "account" TEXT,
    "entryDate" TIMESTAMP(3),

    CONSTRAINT "billing_cost_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deposit_imports" (
    "id" SERIAL NOT NULL,
    "uploadId" INTEGER NOT NULL,
    "yearMonth" TEXT,
    "companyCode" TEXT NOT NULL,
    "postingDate" TIMESTAMP(3),
    "clearedOpenSymbol" TEXT,
    "refKeyHeader1" TEXT,
    "referenceKey3" TEXT,
    "reference" TEXT,
    "assignment" TEXT,
    "documentNumber" TEXT,
    "documentDate" TIMESTAMP(3),
    "postingKey" TEXT,
    "amountLocalCurrency" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "localCurrency" TEXT,
    "text" TEXT,
    "postingPeriod" TEXT,
    "bookingProgram" TEXT,
    "servicePeriodFrom" TIMESTAMP(3),
    "servicePeriodTo" TIMESTAMP(3),
    "offsettingAcctNo" TEXT,
    "account" TEXT,
    "clearingDate" TIMESTAMP(3),
    "clearingDocument" TEXT,

    CONSTRAINT "deposit_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "uploads" (
    "id" SERIAL NOT NULL,
    "filename" TEXT NOT NULL,
    "uploadType" TEXT NOT NULL,
    "accountingPeriod" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "billing_runs" (
    "id" SERIAL NOT NULL,
    "accountingPeriod" TEXT NOT NULL,
    "releaseDate" TIMESTAMP(3) NOT NULL,
    "paymentTermDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "billing_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interfacing_plans" (
    "id" SERIAL NOT NULL,
    "period" TEXT NOT NULL,
    "releaseDate" TEXT,
    "creator" TEXT,
    "reviewer" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interfacing_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country_plan_assignments" (
    "id" SERIAL NOT NULL,
    "period" TEXT NOT NULL,
    "countryId" INTEGER NOT NULL,
    "creator" TEXT,
    "reviewer" TEXT,

    CONSTRAINT "country_plan_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corrected_statements" (
    "id" SERIAL NOT NULL,
    "countryId" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "corrected_statements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_items" (
    "id" SERIAL NOT NULL,
    "app" TEXT NOT NULL DEFAULT 'Interfacing',
    "author" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "notes" TEXT,
    "jiraUrl" TEXT,
    "confluenceUrl" TEXT,
    "deadlineWeek" TEXT,
    "deadlineDate" TIMESTAMP(3),
    "deadlineHistory" JSONB,
    "assignee" TEXT,
    "automationFTE" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "codingEffort" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "peakPercent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback_comments" (
    "id" SERIAL NOT NULL,
    "feedbackId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'User',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feedback_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streams" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "streamOwner" TEXT,

    CONSTRAINT "streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_apps" (
    "id" SERIAL NOT NULL,
    "streamId" INTEGER NOT NULL,
    "app" TEXT NOT NULL,
    "owner" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Planning',
    "description" TEXT,
    "deadlineTarget" TEXT,
    "budgetHours" DOUBLE PRECISION,
    "isStarted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "sub_apps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_guarantees" (
    "id" SERIAL NOT NULL,
    "debitor1" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',

    CONSTRAINT "bank_guarantees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_members" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "stream" TEXT,
    "deletePassword" TEXT,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "countries_debitor1_idx" ON "countries"("debitor1");
CREATE INDEX "countries_fir_idx" ON "countries"("fir");
CREATE INDEX "countries_iso_idx" ON "countries"("iso");

-- CreateIndex
CREATE UNIQUE INDEX "master_data_ktod_key" ON "master_data"("ktod");
CREATE INDEX "master_data_ktod_idx" ON "master_data"("ktod");

-- CreateIndex
CREATE INDEX "sap_imports_konto_idx" ON "sap_imports"("konto");
CREATE INDEX "sap_imports_buchungsdatum_idx" ON "sap_imports"("buchungsdatum");
CREATE INDEX "sap_imports_type_idx" ON "sap_imports"("type");
CREATE INDEX "sap_imports_uploadId_idx" ON "sap_imports"("uploadId");

-- CreateIndex
CREATE INDEX "billing_cost_imports_uploadId_idx" ON "billing_cost_imports"("uploadId");
CREATE INDEX "billing_cost_imports_companyCode_idx" ON "billing_cost_imports"("companyCode");
CREATE INDEX "billing_cost_imports_costCenter_idx" ON "billing_cost_imports"("costCenter");
CREATE INDEX "billing_cost_imports_yearMonth_idx" ON "billing_cost_imports"("yearMonth");
CREATE INDEX "billing_cost_imports_postingDate_idx" ON "billing_cost_imports"("postingDate");
CREATE INDEX "billing_cost_imports_bookingProgram_idx" ON "billing_cost_imports"("bookingProgram");

-- CreateIndex
CREATE INDEX "deposit_imports_uploadId_idx" ON "deposit_imports"("uploadId");
CREATE INDEX "deposit_imports_offsettingAcctNo_idx" ON "deposit_imports"("offsettingAcctNo");
CREATE INDEX "deposit_imports_account_idx" ON "deposit_imports"("account");

-- CreateIndex
CREATE UNIQUE INDEX "interfacing_plans_period_key" ON "interfacing_plans"("period");

-- CreateIndex
CREATE UNIQUE INDEX "country_plan_assignments_period_countryId_key" ON "country_plan_assignments"("period", "countryId");
CREATE INDEX "country_plan_assignments_period_idx" ON "country_plan_assignments"("period");
CREATE INDEX "country_plan_assignments_countryId_idx" ON "country_plan_assignments"("countryId");

-- CreateIndex
CREATE INDEX "corrected_statements_countryId_period_idx" ON "corrected_statements"("countryId", "period");
CREATE INDEX "corrected_statements_period_idx" ON "corrected_statements"("period");

-- CreateIndex
CREATE INDEX "feedback_items_status_idx" ON "feedback_items"("status");
CREATE INDEX "feedback_items_type_idx" ON "feedback_items"("type");
CREATE INDEX "feedback_items_app_idx" ON "feedback_items"("app");

-- CreateIndex
CREATE INDEX "feedback_comments_feedbackId_idx" ON "feedback_comments"("feedbackId");

-- CreateIndex
CREATE UNIQUE INDEX "streams_name_key" ON "streams"("name");

-- CreateIndex
CREATE UNIQUE INDEX "sub_apps_streamId_app_key" ON "sub_apps"("streamId", "app");
CREATE INDEX "sub_apps_streamId_idx" ON "sub_apps"("streamId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_guarantees_debitor1_key" ON "bank_guarantees"("debitor1");

-- CreateIndex
CREATE UNIQUE INDEX "team_members_name_key" ON "team_members"("name");

-- AddForeignKey
ALTER TABLE "sap_imports" ADD CONSTRAINT "sap_imports_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "billing_cost_imports" ADD CONSTRAINT "billing_cost_imports_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deposit_imports" ADD CONSTRAINT "deposit_imports_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback_comments" ADD CONSTRAINT "feedback_comments_feedbackId_fkey" FOREIGN KEY ("feedbackId") REFERENCES "feedback_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_apps" ADD CONSTRAINT "sub_apps_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;
