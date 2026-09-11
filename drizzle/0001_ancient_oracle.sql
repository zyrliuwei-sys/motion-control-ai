CREATE TABLE "backlink" (
	"id" text PRIMARY KEY NOT NULL,
	"site_name" text NOT NULL,
	"target_url" text NOT NULL,
	"display_text" text NOT NULL,
	"image_url" text,
	"placement" text DEFAULT 'footer' NOT NULL,
	"rel" text DEFAULT 'nofollow' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"enabled" boolean DEFAULT false NOT NULL,
	"notes" text DEFAULT '',
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "backlink" ADD CONSTRAINT "backlink_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_backlink_status_enabled" ON "backlink" USING btree ("status","enabled");
