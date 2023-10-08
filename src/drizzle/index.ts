import {
  timestamp,
  pgTable,
  text,
  primaryKey,
  integer,
  uuid,
  json,
  pgEnum,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { AdapterAccount } from "@auth/core/adapters";

export const users = pgTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("emailVerified", { mode: "date" }),
  image: text("image"),
});

export const accounts = pgTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey(account.provider, account.providerAccountId),
  }),
);

export const sessions = pgTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey(vt.identifier, vt.token),
  }),
);

export const documentType = pgEnum("document_type", [
  "source",
  "destination",
  "sharepoint",
]);

export const documents = pgTable("document", {
  id: uuid("id").notNull().defaultRandom().primaryKey(),
  type: documentType("type").notNull(),
  title: text("title").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  embedding: json("embedding").$type<number[]>().notNull(),
  updated: boolean("updated").default(false).notNull(),
});

export const sharepointDocuments = pgTable(
  "sharepointDocument",
  {
    id: uuid("id").notNull().primaryKey(),
    fileName: text("fileName").notNull(),
    sharepointId: text("sharepointId").notNull(),
    driveId: text("driveId").notNull(),
    siteId: text("siteId").notNull(),
  },
  (sd) => ({
    unq: unique("external_id").on(sd.sharepointId, sd.driveId, sd.siteId),
  }),
);

export const sharepointDocumentsRelation = relations(
  sharepointDocuments,
  ({ one }) => ({
    document: one(documents, {
      fields: [sharepointDocuments.id],
      references: [documents.id],
    }),
  }),
);

export type SharepointDocument = typeof sharepointDocuments.$inferSelect;

export type Document = typeof documents.$inferSelect;

export const dbSharepointDrives = pgTable(
  "sharepointDrive",
  {
    id: uuid("id").notNull().primaryKey().defaultRandom(),
    siteId: text("siteId").notNull(),
    siteName: text("siteName").notNull(),
    driveId: text("driveId").notNull(),
    driveName: text("driveName").notNull(),
    deltaLink: text("deltaLink"),
  },
  (t) => ({
    unq: unique().on(t.siteId, t.driveId),
  }),
);

export type DBSharepointDrive = typeof dbSharepointDrives.$inferSelect;

export const dbSharepointFiles = pgTable("sharepointFile", {
  itemId: text("itemId").notNull().primaryKey(),
  name: text("name").notNull(),
  sharepointDriveId: uuid("sharepointDriveId")
    .notNull()
    .references(() => dbSharepointDrives.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  embedding: json("embedding").$type<number[]>().notNull(),
  updated: boolean("updated").default(false).notNull(),
  cTag: text("cTag").notNull(),
  content: text("content").notNull(),
});

export type NewDBSharepointFile = typeof dbSharepointFiles.$inferInsert;

export const dbSharepointSubscription = pgTable("sharepointSubscription", {
  id: uuid("id").notNull().primaryKey(),
  dbDriveId: uuid("dbDriveId")
    .notNull()
    .references(() => dbSharepointDrives.id, { onDelete: "cascade" }),
  expirationDateTime: timestamp("expirationDateTime").notNull(),
});

export type DBSharepointSubscription =
  typeof dbSharepointSubscription.$inferSelect;

export const fileChangeType = pgEnum("file_change_type", [
  "created",
  "updated",
  "deleted",
]);

export const sharepointFileChanges = pgTable("sharepointFileChange", {
  id: uuid("id").notNull().defaultRandom().primaryKey(),
  itemId: text("itemId")
    .notNull()
    .references(() => dbSharepointFiles.itemId, { onDelete: "cascade" }),
  processed: boolean("processed").default(false).notNull(),
  changeType: fileChangeType("changeType").notNull(),
  createdAt: timestamp("time").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  oldContent: text("oldContent"),
  newContent: text("newContent").notNull(),
});
