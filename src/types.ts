/**
 * Lwach - Type Declarations for the Swapping Platform
 */

export interface User {
  id: string; // UUID
  full_name: string;
  phone_number: string;
  created_at: string;
}

export enum ValueTierId {
  TIER_1 = 1, // < 1,000 Birr (Budget)
  TIER_2 = 2, // 1,000 - 5,000 Birr (Mid-Range)
  TIER_3 = 3, // 5,000 - 20,000 Birr (Premium)
  TIER_4 = 4, // 20,000+ Birr (Luxury)
}

export interface ValueTier {
  id: ValueTierId;
  name: string;
  rangeLabel: string;
  feeBirr: number; // Flat fee for unlocking swaps in this tier
}

export const VALUE_TIERS: Record<ValueTierId, ValueTier> = {
  [ValueTierId.TIER_1]: {
    id: ValueTierId.TIER_1,
    name: "Tier 1: Budget",
    rangeLabel: "< 1,000 Birr",
    feeBirr: 25,
  },
  [ValueTierId.TIER_2]: {
    id: ValueTierId.TIER_2,
    name: "Tier 2: Mid-Range",
    rangeLabel: "1,000 - 5,000 Birr",
    feeBirr: 100,
  },
  [ValueTierId.TIER_3]: {
    id: ValueTierId.TIER_3,
    name: "Tier 3: Premium",
    rangeLabel: "5,000 - 20,000 Birr",
    feeBirr: 250,
  },
  [ValueTierId.TIER_4]: {
    id: ValueTierId.TIER_4,
    name: "Tier 4: Luxury",
    rangeLabel: "20,000+ Birr",
    feeBirr: 500,
  },
};

export interface Item {
  id: string; // UUID
  user_id: string; // Foreign Key to User.id
  title: string;
  description: string;
  images: string[]; // Image URLs/Placeholders
  value_tier: ValueTierId;
  category?: "clothing" | "shoe" | "accessories" | "other";
  is_active: boolean;
}

export enum ActionType {
  LIKE = "LIKE",
  DISLIKE = "DISLIKE",
}

export interface Swipe {
  id: string; // UUID
  swiper_item_id: string; // Foreign Key referring to the item offered by swiper
  target_item_id: string; // Foreign Key referring to the item being swiped on
  action_type: ActionType;
  // Advanced features: Multi-Item Swaps & Cash Top-Ups
  bundle_item_ids: string[]; // Optional secondary items bundled from the swiper's item inventory
  cash_topup: number; // Optional. positive if swiper offers topup (e.g. "My Item + 200 ETB for yours")
  created_at: string;
}

export interface Match {
  id: string; // UUID
  item_a_id: string; // Foreign Key to Items
  item_b_id: string; // Foreign Key to Items
  party_a_paid: boolean;
  party_b_paid: boolean;
  payment_links: {
    party_a_telebirr?: string;
    party_b_telebirr?: string;
    party_a_qr?: string;
    party_b_qr?: string;
    [key: string]: string | undefined;
  };
  is_unlocked: boolean;
  // Advanced swap configurations resolved at match creation from the swipes:
  bundle_item_ids_a?: string[];
  bundle_item_ids_b?: string[];
  cash_topup_a?: number; // cash offered by party a to party b
  cash_topup_b?: number; // cash offered by party b to party a
  created_at: string;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface LogisticsChecklist {
  match_id: string;
  exchange_method: "MEETUP" | "COURIER" | null;
  meetup_location: string;
  meetup_time: string;
  courier_status: "PENDING" | "DISPATCHED" | "DELIVERED" | null;
  courier_partner: string;
  party_a_completed: boolean;
  party_b_completed: boolean;
}
