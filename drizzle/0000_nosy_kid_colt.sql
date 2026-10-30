CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"schedule_id" uuid NOT NULL,
	"title" varchar(100) NOT NULL,
	"notes" varchar(1000) DEFAULT '' NOT NULL,
	"location" varchar(120) DEFAULT '' NOT NULL,
	"person" varchar(8) NOT NULL,
	"day" date NOT NULL,
	"start_minute" integer NOT NULL,
	"end_minute" integer NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "events_time_check" CHECK ("events"."start_minute" >= 0 AND "events"."end_minute" <= 1440 AND "events"."end_minute" > "events"."start_minute"),
	CONSTRAINT "events_person_check" CHECK ("events"."person" IN ('one', 'two', 'both'))
);
--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"title" varchar(80) NOT NULL,
	"person_one" varchar(30) NOT NULL,
	"person_two" varchar(30) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "schedules_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_schedule_id_schedules_id_fk" FOREIGN KEY ("schedule_id") REFERENCES "public"."schedules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_schedule_day_idx" ON "events" USING btree ("schedule_id","day");