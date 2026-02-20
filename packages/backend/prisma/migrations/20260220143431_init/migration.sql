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

    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_data" (
    "id" SERIAL NOT NULL,
    "konto" TEXT NOT NULL,
    "firmenname" TEXT,
    "adresszeile1" TEXT,
    "adresszeile2" TEXT,
    "plz" TEXT,
    "ort" TEXT,
    "land" TEXT,
    "depositHeld" DOUBLE PRECISION,
    "depositDue" DOUBLE PRECISION,

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

-- CreateIndex
CREATE INDEX "countries_debitor1_idx" ON "countries"("debitor1");

-- CreateIndex
CREATE INDEX "countries_fir_idx" ON "countries"("fir");

-- CreateIndex
CREATE INDEX "countries_iso_idx" ON "countries"("iso");

-- CreateIndex
CREATE UNIQUE INDEX "master_data_konto_key" ON "master_data"("konto");

-- CreateIndex
CREATE INDEX "master_data_konto_idx" ON "master_data"("konto");

-- CreateIndex
CREATE INDEX "sap_imports_konto_idx" ON "sap_imports"("konto");

-- CreateIndex
CREATE INDEX "sap_imports_buchungsdatum_idx" ON "sap_imports"("buchungsdatum");

-- CreateIndex
CREATE INDEX "sap_imports_type_idx" ON "sap_imports"("type");

-- CreateIndex
CREATE INDEX "sap_imports_uploadId_idx" ON "sap_imports"("uploadId");

-- AddForeignKey
ALTER TABLE "sap_imports" ADD CONSTRAINT "sap_imports_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "uploads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
