CREATE TABLE "transactions" (
	"id" BIGINT NOT NULL DEFAULT 'nextval(''transactions_id_seq''::regclass)',
	"created_at" TIMESTAMPTZ NULL DEFAULT NULL,
	"updated_at" TIMESTAMPTZ NULL DEFAULT NULL,
	"deleted_at" TIMESTAMPTZ NULL DEFAULT NULL,
	"merchant_id" TEXT NOT NULL,
	"amount" NUMERIC NOT NULL,
	"trx_id" TEXT NOT NULL,
	"partner_reference_no" TEXT NOT NULL,
	"reference_no" TEXT NOT NULL,
	"status" TEXT NOT NULL DEFAULT 'PENDING',
	"transaction_date" TIMESTAMPTZ NULL DEFAULT NULL,
	"paid_date" TIMESTAMPTZ NULL DEFAULT NULL,
	"currency" TEXT NULL DEFAULT NULL,
	PRIMARY KEY ("id"),
	UNIQUE INDEX "uni_transactions_partner_reference_no" ("partner_reference_no"),
	UNIQUE INDEX "uni_transactions_reference_no" ("reference_no"),
	UNIQUE INDEX "uni_transactions_trx_id" ("trx_id"),
	INDEX "idx_transactions_deleted_at" ("deleted_at")
)
;
COMMENT ON COLUMN "transactions"."id" IS '';
COMMENT ON COLUMN "transactions"."created_at" IS '';
COMMENT ON COLUMN "transactions"."updated_at" IS '';
COMMENT ON COLUMN "transactions"."deleted_at" IS '';
COMMENT ON COLUMN "transactions"."merchant_id" IS '';
COMMENT ON COLUMN "transactions"."amount" IS '';
COMMENT ON COLUMN "transactions"."trx_id" IS '';
COMMENT ON COLUMN "transactions"."partner_reference_no" IS '';
COMMENT ON COLUMN "transactions"."reference_no" IS '';
COMMENT ON COLUMN "transactions"."status" IS '';
COMMENT ON COLUMN "transactions"."transaction_date" IS '';
COMMENT ON COLUMN "transactions"."paid_date" IS '';
COMMENT ON COLUMN "transactions"."currency" IS '';
