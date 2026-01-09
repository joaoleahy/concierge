import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  decimal,
  timestamp,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============================================================================
// ENUMS
// ============================================================================

export const appRoleEnum = pgEnum("app_role", ["admin", "staff"]);

export const toneOfVoiceEnum = pgEnum("tone_of_voice", [
  "relaxed_resort",
  "formal_business",
  "boutique_chic",
  "family_friendly",
]);

export const serviceRequestStatusEnum = pgEnum("service_request_status", [
  "pending",
  "in_progress",
  "completed",
  "cancelled",
  "declined",
  "modified",
]);

export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant", "system"]);

// ============================================================================
// TABLES
// ============================================================================

// Hotels - Core entity
export const hotels = pgTable("hotels", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  country: text("country").notNull(),
  wifiPassword: text("wifi_password"),
  breakfastHours: text("breakfast_hours"),
  checkoutTime: text("checkout_time").default("12:00"),
  whatsappNumber: text("whatsapp_number").notNull(),
  accentColor: text("accent_color").default("#1e3a5f"),
  toneOfVoice: toneOfVoiceEnum("tone_of_voice").default("relaxed_resort"),
  logoUrl: text("logo_url"),
  bannerUrl: text("banner_url"),
  language: text("language").default("pt-BR"),
  timezone: text("timezone").default("America/Sao_Paulo"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Rooms - Physical rooms in hotels
export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    roomNumber: text("room_number").notNull(),
    qrCode: text("qr_code").notNull().unique(),
    floor: integer("floor"),
    roomType: text("room_type").default("standard"),
    accessPin: text("access_pin"),
    pinUpdatedAt: timestamp("pin_updated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueHotelRoom: unique().on(table.hotelId, table.roomNumber),
  })
);

// Users - Better Auth managed
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  emailVerified: boolean("email_verified").default(false),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Sessions - Better Auth managed
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Accounts - Better Auth managed (for OAuth providers)
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Verifications - Better Auth managed (for email verification, password reset)
export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// User Roles - Links users to hotels with roles
export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    hotelId: uuid("hotel_id")
      .notNull()
      .references(() => hotels.id, { onDelete: "cascade" }),
    role: appRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => ({
    uniqueUserHotelRole: unique().on(table.userId, table.hotelId, table.role),
  })
);

// Service Types - Available services per hotel
export const serviceTypes = pgTable("service_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotelId: uuid("hotel_id")
    .notNull()
    .references(() => hotels.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  namePt: text("name_pt"),
  description: text("description"),
  icon: text("icon").notNull(),
  whatsappTemplate: text("whatsapp_template").notNull(),
  whatsappTemplatePt: text("whatsapp_template_pt"),
  requiresDetails: boolean("requires_details").default(false),
  detailsPlaceholder: text("details_placeholder"),
  estimatedResponseMinutes: integer("estimated_response_minutes").default(15),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Service Requests - Guest service requests
export const serviceRequests = pgTable("service_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotelId: uuid("hotel_id")
    .notNull()
    .references(() => hotels.id, { onDelete: "cascade" }),
  roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
  serviceTypeId: uuid("service_type_id").references(() => serviceTypes.id, {
    onDelete: "set null",
  }),
  requestType: text("request_type").notNull(),
  details: text("details"),
  status: serviceRequestStatusEnum("status").default("pending").notNull(),
  guestLanguage: text("guest_language").default("en"),
  staffResponse: text("staff_response"),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  resolution: text("resolution"),
  guestAccepted: boolean("guest_accepted"),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Menu Categories - Room service categories
export const menuCategories = pgTable("menu_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotelId: uuid("hotel_id")
    .notNull()
    .references(() => hotels.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  namePt: text("name_pt"),
  description: text("description"),
  icon: text("icon").default("utensils"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Menu Items - Individual menu items
export const menuItems = pgTable("menu_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => menuCategories.id, { onDelete: "cascade" }),
  hotelId: uuid("hotel_id")
    .notNull()
    .references(() => hotels.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  namePt: text("name_pt"),
  description: text("description"),
  descriptionPt: text("description_pt"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  isAvailable: boolean("is_available").default(true),
  isVegetarian: boolean("is_vegetarian").default(false),
  isVegan: boolean("is_vegan").default(false),
  isGlutenFree: boolean("is_gluten_free").default(false),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Local Recommendations - Places to visit
export const localRecommendations = pgTable("local_recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotelId: uuid("hotel_id")
    .notNull()
    .references(() => hotels.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  namePt: text("name_pt"),
  description: text("description"),
  descriptionPt: text("description_pt"),
  category: text("category").notNull(),
  address: text("address"),
  googleMapsUrl: text("google_maps_url"),
  imageUrl: text("image_url"),
  priceRange: text("price_range"),
  isHiddenGem: boolean("is_hidden_gem").default(true),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Chat Sessions - Guest chat sessions
export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id").references(() => rooms.id, { onDelete: "set null" }),
  hotelId: uuid("hotel_id")
    .notNull()
    .references(() => hotels.id, { onDelete: "cascade" }),
  guestLanguage: text("guest_language").default("en"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Chat Messages - Individual messages in sessions
export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// Itinerary Items - Guest travel plans
export const itineraryItems = pgTable("itinerary_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id")
    .notNull()
    .references(() => chatSessions.id, { onDelete: "cascade" }),
  hotelId: uuid("hotel_id")
    .notNull()
    .references(() => hotels.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  category: text("category").default("activity"),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }),
  googleMapsUrl: text("google_maps_url"),
  recommendationId: uuid("recommendation_id").references(
    () => localRecommendations.id,
    { onDelete: "set null" }
  ),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// Staff Invitations - Invitation tokens for new staff
export const staffInvitations = pgTable("staff_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotelId: uuid("hotel_id")
    .notNull()
    .references(() => hotels.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: appRoleEnum("role").default("staff").notNull(),
  invitedBy: uuid("invited_by").notNull(),
  token: text("token").notNull().unique(),
  acceptedAt: timestamp("accepted_at", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// PIN Attempts - Rate limiting for room access
export const pinAttempts = pgTable("pin_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id").references(() => rooms.id, { onDelete: "cascade" }),
  ipAddress: text("ip_address"),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }).defaultNow(),
  success: boolean("success").default(false),
});

// Demo Requests - Contact form submissions
export const demoRequests = pgTable("demo_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotelName: text("hotel_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  message: text("message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

// ============================================================================
// RELATIONS
// ============================================================================

export const hotelsRelations = relations(hotels, ({ many }) => ({
  rooms: many(rooms),
  userRoles: many(userRoles),
  serviceTypes: many(serviceTypes),
  serviceRequests: many(serviceRequests),
  menuCategories: many(menuCategories),
  menuItems: many(menuItems),
  localRecommendations: many(localRecommendations),
  chatSessions: many(chatSessions),
  itineraryItems: many(itineraryItems),
  staffInvitations: many(staffInvitations),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  hotel: one(hotels, { fields: [rooms.hotelId], references: [hotels.id] }),
  serviceRequests: many(serviceRequests),
  chatSessions: many(chatSessions),
  pinAttempts: many(pinAttempts),
}));

export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, { fields: [userRoles.userId], references: [users.id] }),
  hotel: one(hotels, { fields: [userRoles.hotelId], references: [hotels.id] }),
}));

export const serviceTypesRelations = relations(serviceTypes, ({ one, many }) => ({
  hotel: one(hotels, { fields: [serviceTypes.hotelId], references: [hotels.id] }),
  serviceRequests: many(serviceRequests),
}));

export const serviceRequestsRelations = relations(serviceRequests, ({ one }) => ({
  hotel: one(hotels, { fields: [serviceRequests.hotelId], references: [hotels.id] }),
  room: one(rooms, { fields: [serviceRequests.roomId], references: [rooms.id] }),
  serviceType: one(serviceTypes, {
    fields: [serviceRequests.serviceTypeId],
    references: [serviceTypes.id],
  }),
}));

export const menuCategoriesRelations = relations(menuCategories, ({ one, many }) => ({
  hotel: one(hotels, { fields: [menuCategories.hotelId], references: [hotels.id] }),
  items: many(menuItems),
}));

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
  hotel: one(hotels, { fields: [menuItems.hotelId], references: [hotels.id] }),
}));

export const localRecommendationsRelations = relations(
  localRecommendations,
  ({ one, many }) => ({
    hotel: one(hotels, {
      fields: [localRecommendations.hotelId],
      references: [hotels.id],
    }),
    itineraryItems: many(itineraryItems),
  })
);

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  hotel: one(hotels, { fields: [chatSessions.hotelId], references: [hotels.id] }),
  room: one(rooms, { fields: [chatSessions.roomId], references: [rooms.id] }),
  messages: many(chatMessages),
  itineraryItems: many(itineraryItems),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(chatSessions, {
    fields: [chatMessages.sessionId],
    references: [chatSessions.id],
  }),
}));

export const itineraryItemsRelations = relations(itineraryItems, ({ one }) => ({
  session: one(chatSessions, {
    fields: [itineraryItems.sessionId],
    references: [chatSessions.id],
  }),
  hotel: one(hotels, { fields: [itineraryItems.hotelId], references: [hotels.id] }),
  recommendation: one(localRecommendations, {
    fields: [itineraryItems.recommendationId],
    references: [localRecommendations.id],
  }),
}));

export const staffInvitationsRelations = relations(staffInvitations, ({ one }) => ({
  hotel: one(hotels, {
    fields: [staffInvitations.hotelId],
    references: [hotels.id],
  }),
}));

export const pinAttemptsRelations = relations(pinAttempts, ({ one }) => ({
  room: one(rooms, { fields: [pinAttempts.roomId], references: [rooms.id] }),
}));

// ============================================================================
// TYPES (inferred from schema)
// ============================================================================

export type Hotel = typeof hotels.$inferSelect;
export type NewHotel = typeof hotels.$inferInsert;

export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;

export type ServiceType = typeof serviceTypes.$inferSelect;
export type NewServiceType = typeof serviceTypes.$inferInsert;

export type ServiceRequest = typeof serviceRequests.$inferSelect;
export type NewServiceRequest = typeof serviceRequests.$inferInsert;

export type MenuCategory = typeof menuCategories.$inferSelect;
export type NewMenuCategory = typeof menuCategories.$inferInsert;

export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;

export type LocalRecommendation = typeof localRecommendations.$inferSelect;
export type NewLocalRecommendation = typeof localRecommendations.$inferInsert;

export type ChatSession = typeof chatSessions.$inferSelect;
export type NewChatSession = typeof chatSessions.$inferInsert;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type NewChatMessage = typeof chatMessages.$inferInsert;

export type ItineraryItem = typeof itineraryItems.$inferSelect;
export type NewItineraryItem = typeof itineraryItems.$inferInsert;

export type StaffInvitation = typeof staffInvitations.$inferSelect;
export type NewStaffInvitation = typeof staffInvitations.$inferInsert;

export type PinAttempt = typeof pinAttempts.$inferSelect;
export type NewPinAttempt = typeof pinAttempts.$inferInsert;

export type DemoRequest = typeof demoRequests.$inferSelect;
export type NewDemoRequest = typeof demoRequests.$inferInsert;
