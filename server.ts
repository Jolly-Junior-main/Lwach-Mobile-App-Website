import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { 
  User, 
  Item, 
  Swipe, 
  Match, 
  Message, 
  LogisticsChecklist, 
  ActionType, 
  ValueTierId 
} from "./src/types";

// In-memory or persisted database file path
const DB_FILE = path.join(process.cwd(), "db.json");

// Helper to generate IDs
const generateUUID = () => {
  return "idx-" + Math.random().toString(36).substring(2, 15) + "-" + Date.now();
};

// Initial Seed Data
const DEFAULT_USERS: User[] = [
  {
    id: "user-1",
    full_name: "Abebe Kebede",
    phone_number: "+251911223344",
    created_at: new Date("2026-06-15").toISOString(),
  },
  {
    id: "user-2",
    full_name: "Helena Tesfaye",
    phone_number: "+251922334455",
    created_at: new Date("2026-06-16").toISOString(),
  },
  {
    id: "user-3",
    full_name: "Dawit Alamu",
    phone_number: "+251933445566",
    created_at: new Date("2026-06-17").toISOString(),
  }
];

const DEFAULT_ITEMS: Item[] = [
  // Abebe's Items
  {
    id: "item-abebe-1",
    user_id: "user-1",
    title: "Vintage Leather Jacket",
    description: "Classic black genuine leather biker jacket. Thick robust canvas inside, flawless silver-plated heavy zippers. Warm, heavy, and very stylish. Great for night rides. Looking for a decent mid-range smart watch or premium camera accessories.",
    images: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_2,
    category: "clothing",
    is_active: true,
  },
  {
    id: "item-abebe-2",
    user_id: "user-1",
    title: "Mechanical Keyboard",
    description: "Keychron K2 wireless mechanical keyboard with tactile brown switches. Double-shot keycaps, elegant RGB backlight, and solid aluminum chassis. Used for 2 months, exceptionally clean.",
    images: ["https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_1,
    category: "accessories",
    is_active: true,
  },
  {
    id: "item-abebe-3",
    user_id: "user-1",
    title: "Sony Active Noise Cancelling Headset",
    description: "WH-1000XM4 premium over-ear black headphones. 30-hour battery life, touch controls, high-res audio capability. Condition: spotless padding, complete storage case, excellent battery lifecycle.",
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_3,
    category: "accessories",
    is_active: true,
  },

  // Helena's Items
  {
    id: "item-helena-1",
    user_id: "user-2",
    title: "Fujifilm X-T30 Camera",
    description: "Premium retro-style compact mirrorless camera (Silver edition). Comes with one extra battery and generic strap. 26.1MP Trans CMOS sensor, pristine condition. Looking for a leather jacket and mechanical keyboard package or other smart gadgets.",
    images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_3,
    category: "accessories",
    is_active: true,
  },
  {
    id: "item-helena-2",
    user_id: "user-2",
    title: "Doc Martens Smooth Boots",
    description: "Iconic Doc Martens 1460 black-leather leather boots. Unisex, size 40. Smooth, durable, with yellow stitching. Almost spotless, worn twice in a home setting. Want to trade for designer sunglasses, premium footwear, or quality home lamps.",
    images: ["https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_2,
    category: "shoe",
    is_active: true,
  },
  {
    id: "item-helena-3",
    user_id: "user-2",
    title: "Minimalist Brass Desk Lamp",
    description: "Warm mid-century brass table lamp. Weighted base with pure linen cylinder shade. Cozy light output, perfect for workspace setups. Looking for vintage shirts or nice books.",
    images: ["https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_1,
    category: "other",
    is_active: true,
  },

  // Dawit's Items
  {
    id: "item-dawit-1",
    user_id: "user-3",
    title: "Razer DeathAdder Mouse",
    description: "V2 Ergonomic gaming mouse. 20K DPI optical sensor, ultra light, Chroma RGB lighting. Tested and running perfectly. Great for esports.",
    images: ["https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_1,
    category: "accessories",
    is_active: true,
  },
  {
    id: "item-dawit-2",
    user_id: "user-3",
    title: "Vintage Denim Overalls",
    description: "Sturdy medium-wash rugged canvas overalls. Heavy-duty utility clips, multiple pockets. Excellent street-culture aesthetic.",
    images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_2,
    category: "clothing",
    is_active: true,
  },
  {
    id: "item-dawit-3",
    user_id: "user-3",
    title: "DJI Mini Drone Combo",
    description: "Ultra-compact travel drone with fly-more bundle packs (includes 3 batteries, hardcarrying pouch, controller). Barely used, pristine aerial footage capability. Looking for a laptop or premium camera lens.",
    images: ["https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_3,
    category: "accessories",
    is_active: true,
  },

  // --- 20 More Swapping Items added recursively ---
  
  // Clothing (7 Items)
  {
    id: "item-new-1",
    user_id: "user-2",
    title: "Denim Sherpa Jacket",
    description: "Cozy thick sherpa-lined denim jacket in classic indigo stone-wash. Robust bronze metal buttons, dual insulated fleece hand pocket flaps. Incredibly warm, perfectly broken in, fits medium to large size. Highly desirable for chilly evening strolls in Addis.",
    images: ["https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_2,
    category: "clothing",
    is_active: true,
  },
  {
    id: "item-new-2",
    user_id: "user-3",
    title: "Nike Air Obsidian Parka",
    description: "Authentic full-length athletic windbreaker parka with synthetic down-fill insulation. Water-resistant matte nylon shell, drawstring insulated storm hood, multiple utility zipper compartments. Great for the rainy season.",
    images: ["https://images.unsplash.com/photo-1544923246-77307dd654cb?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_3,
    category: "clothing",
    is_active: true,
  },
  {
    id: "item-new-3",
    user_id: "user-1",
    title: "Habesha Kemis Traditional Dress",
    description: "Stunning handcrafted Ethiopian Habesha dress using premium hand-spun lightweight cotton threads. Displays vibrant traditional tilet patterns along the waistline and wide cuffs. Excellent dress for special holidays, cultural ceremonies, and family gatherings.",
    images: ["https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_3,
    category: "clothing",
    is_active: true,
  },
  {
    id: "item-new-4",
    user_id: "user-2",
    title: "Carhartt Active Hoodie",
    description: "Extremely heavy-duty active hoodie in carbon grey. Rain Defender water-repellent finish, thermal-weave honeycomb lining, ribbed storm cuffs, durable triple-stitched main seams. Condition 9.5/10.",
    images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_2,
    category: "clothing",
    is_active: true,
  },
  {
    id: "item-new-5",
    user_id: "user-3",
    title: "Vintage Woolen Varsity Jacket",
    description: "Retro crimson wool letterman varsity jacket featuring cream-colored genuine cowsuede leather sleeves, direct chest embroideries, snap-button closure system, and thick ribbed borders. Fits nicely for street casual attire.",
    images: ["https://images.unsplash.com/photo-1617137968427-85924c800a22?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_2,
    category: "clothing",
    is_active: true,
  },
  {
    id: "item-new-6",
    user_id: "user-1",
    title: "Patagonia Synchilla Fleece",
    description: "Signature midweight double-sided Synchilla polyester fleece snap-neck pullover in oatmeal cream colorway. Nylon chest pocket, elastic binding on cuffs and waist. Lightweight, cozy, and perfectly matches vintage style clothing.",
    images: ["https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_2,
    category: "clothing",
    is_active: true,
  },
  {
    id: "item-new-7",
    user_id: "user-2",
    title: "Uniqlo Ultra Light Down Coat",
    description: "Matte navy blue lightweight packable down coat with 750+ fill power down. Comes with its original storage pouch. Windproof and extremely compact to throw into small backpacks.",
    images: ["https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_2,
    category: "clothing",
    is_active: true,
  },

  // Shoes (7 Items)
  {
    id: "item-new-8",
    user_id: "user-3",
    title: "Yeezy Boost 350 V2",
    description: "Original 'Zebra' white & black knit lifestyle sneakers featuring signature premium stripe design and vibrant red branding text. Super comfortable padded foam boost responsive midsole. Spotless, completely clean outsoles, comes inside original shoe box setup.",
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_4,
    category: "shoe",
    is_active: true,
  },
  {
    id: "item-new-9",
    user_id: "user-1",
    title: "Air Jordan 1 Retro High",
    description: "Classic court style AJ1 'University Blue' colorway. Supple black and sky blue leather panels, premium high-top construction with intact collar supports. No heel drags, strictly authenticated.",
    images: ["https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_4,
    category: "shoe",
    is_active: true,
  },
  {
    id: "item-new-10",
    user_id: "user-2",
    title: "New Balance 990v5 Core",
    description: "Made in USA flagship running trainers styled in neutral grey mesh and suede overlays. Dual-density collar foam padding, blown rubber outsole, premium ENCAP active support system. Extremely soft walking and lifestyle shoes.",
    images: ["https://images.unsplash.com/photo-1539185441755-769473a23570?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_3,
    category: "shoe",
    is_active: true,
  },
  {
    id: "item-new-11",
    user_id: "user-3",
    title: "British Chelsea Suede Boots",
    description: "Premium honey tan genuine suede Chelsea boots with custom elastic side gores and a flexible plantation crepe rubber sole. Offers standard footbed support and ankle hugs.",
    images: ["https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_2,
    category: "shoe",
    is_active: true,
  },
  {
    id: "item-new-12",
    user_id: "user-1",
    title: "Birkenstock Suede Boston",
    description: "Taupe soft suede Boston clogs with adjustable instep metal pin buckle and anatomically carved cork-latex footbed. Worn lightly, cork is in robust form.",
    images: ["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_2,
    category: "shoe",
    is_active: true,
  },
  {
    id: "item-new-13",
    user_id: "user-2",
    title: "Salomon XT-6 Trail Trainers",
    description: "Sleek all-black techwear outdoor trail hiking sneakers. Sensifit construction wrapping, quicklace puller toggle system, durable Contagrip outsoles. Extremely resilient for mud, dirt, or dynamic urban daily walking maneuvers.",
    images: ["https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_3,
    category: "shoe",
    is_active: true,
  },
  {
    id: "item-new-14",
    user_id: "user-3",
    title: "Dr. Martens Oxford 1461",
    description: "Polished cherry red smooth leather standard oxford dress shoes. Double welt yellow thread stitching, signature air-cushioned bouncing rubber base. Highly versatile for smart casual workspaces.",
    images: ["https://images.unsplash.com/photo-1531310197839-ccf54634509e?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_2,
    category: "shoe",
    is_active: true,
  },

  // Accessories (6 Items)
  {
    id: "item-new-15",
    user_id: "user-1",
    title: "Apple Watch Series 8 GPS",
    description: "45mm Midnight black aluminum smart-watch casing with matching sporty band. Integrated Always-On Retina display, temperature sensor, high-fidelity blood oxygen sensors, and dynamic fitness tracking. Excellent battery lifecycle and complete charging cable.",
    images: ["https://images.unsplash.com/photo-1517502884422-41eaaced0168?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_4,
    category: "accessories",
    is_active: true,
  },
  {
    id: "item-new-16",
    user_id: "user-2",
    title: "Ray-Ban Classic Wayfarer",
    description: "Classic glossy black premium acetate frame sports sunglasses. Original G-15 glass dark crystal polarized lens blocks 99% reflections. Left lens carries the classic laser-etched RB signature. Fits nicely, original leather case and cleaning rag included.",
    images: ["https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_2,
    category: "accessories",
    is_active: true,
  },
  {
    id: "item-new-17",
    user_id: "user-3",
    title: "Fossil Vintage Messenger Bag",
    description: "Thick glazed dark mahogany leather bag structure. Spacious central zip pockets designed to hold up to 15-inch laptop securely. Antique brass buckles, sturdy top carry handle, and heavily woven canvas strap with shoulder pad.",
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_2,
    category: "accessories",
    is_active: true,
  },
  {
    id: "item-new-18",
    user_id: "user-1",
    title: "Seiko 5 Automatic Watch",
    description: "Sports automatic dive-style black dial timepiece. Displays day & date calendar, runs on 24-jewel Japanese mechanical motion, sweeping red second hand. Thick stainless steel link locking band, exhibition crystal caseback.",
    images: ["https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_3,
    category: "accessories",
    is_active: true,
  },
  {
    id: "item-new-19",
    user_id: "user-2",
    title: "Bellroy Slim Caramel Wallet",
    description: "Ultra-slim caramel eco-tanned leather bi-fold wallet. Conveniently stores up to 12 cards, dedicated hidden slot for flat paper currencies, and quick-pull strap for less-used cards. Keeps your pocket flat.",
    images: ["https://images.unsplash.com/photo-1627123424574-724758594e93?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_1,
    category: "accessories",
    is_active: true,
  },
  {
    id: "item-new-20",
    user_id: "user-3",
    title: "North Face Daily Backpack",
    description: "Sleek all-black Borealis commuter backpack. Holds up to a 15-inch laptop, contains fleece-lined front zip sections for chargers and media, external elastic bungee cord bindings. Padded FlexVent molded back support mesh panels.",
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&auto=format&fit=crop&q=80"],
    value_tier: ValueTierId.TIER_2,
    category: "accessories",
    is_active: true,
  }
];

// Helena likes Abebe's leather jacket initially so Abebe can swipe back to trigger an instant match!
const DEFAULT_SWIPES: Swipe[] = [
  {
    id: "swipe-seed-1",
    swiper_item_id: "item-helena-1", // camera
    target_item_id: "item-abebe-1", // Abebe leather jacket
    action_type: ActionType.LIKE,
    bundle_item_ids: [],
    cash_topup: 0,
    created_at: new Date("2026-06-18").toISOString(),
  },
  {
    id: "swipe-seed-2",
    swiper_item_id: "item-dawit-3", // drone
    target_item_id: "item-abebe-3", // sony headphones
    action_type: ActionType.LIKE,
    bundle_item_ids: ["item-dawit-1"], // bundled razer mouse 
    cash_topup: 1500, // Offered extra cash!
    created_at: new Date("2026-06-18T10:00:00").toISOString(),
  }
];

const DEFAULT_MATCHES: Match[] = [];
const DEFAULT_MESSAGES: Message[] = [];
const DEFAULT_LOGISTICS: LogisticsChecklist[] = [];

interface DbSchema {
  users: User[];
  items: Item[];
  swipes: Swipe[];
  matches: Match[];
  messages: Message[];
  logistics: LogisticsChecklist[];
  activeUserId: string;
}

// Ensure the db.json file is initialized
function getDb(): DbSchema {
  if (!fs.existsSync(DB_FILE)) {
    const defaultDb: DbSchema = {
      users: DEFAULT_USERS,
      items: DEFAULT_ITEMS,
      swipes: DEFAULT_SWIPES,
      matches: DEFAULT_MATCHES,
      messages: DEFAULT_MESSAGES,
      logistics: DEFAULT_LOGISTICS,
      activeUserId: "user-1", // Default logged-in simulated user is Abebe
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf8");
    return defaultDb;
  }
  const raw = fs.readFileSync(DB_FILE, "utf8");
  return JSON.parse(raw);
}

function saveDb(data: DbSchema) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoints
  app.get("/api/state", (req, res) => {
    res.json(getDb());
  });

  // Reset database back to default seed data
  app.post("/api/reset", (req, res) => {
    fs.unlinkSync(DB_FILE);
    const refreshed = getDb();
    res.json({ message: "Database reset to factory settings successful!", data: refreshed });
  });

  // Get active user details
  app.get("/api/users/current", (req, res) => {
    const db = getDb();
    const user = db.users.find(u => u.id === db.activeUserId) || db.users[0];
    res.json(user);
  });

  // Switch Active User Identity
  app.post("/api/users/switch", (req, res) => {
    const { userId } = req.body;
    const db = getDb();
    const targetUser = db.users.find(u => u.id === userId);
    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }
    db.activeUserId = userId;
    saveDb(db);
    res.json({ message: `Successfully switched to ${targetUser.full_name}`, user: targetUser });
  });

  // Create customized User
  app.post("/api/users/create", (req, res) => {
    const { full_name, phone_number } = req.body;
    if (!full_name || !phone_number) {
      return res.status(400).json({ error: "full_name and phone_number are required" });
    }
    const db = getDb();
    const existing = db.users.find(u => u.phone_number === phone_number);
    if (existing) {
      return res.status(400).json({ error: "Phone number already exists" });
    }
    
    const newUser: User = {
      id: generateUUID(),
      full_name,
      phone_number,
      created_at: new Date().toISOString()
    };
    db.users.push(newUser);
    db.activeUserId = newUser.id; // Automatically login as new user
    saveDb(db);
    res.json(newUser);
  });

  app.get("/api/users", (req, res) => {
    const db = getDb();
    res.json(db.users);
  });

  // Get items for matching, list items, or swipe recommendation feed
  app.get("/api/items", (req, res) => {
    const db = getDb();
    const { 
      swiperItemId, 
      userId, 
      excludeSwiped, 
      acceptDifferentTiers 
    } = req.query;

    let result = [...db.items];

    // Filter by specific owner user
    if (userId) {
      result = result.filter(item => item.user_id === userId);
      return res.json(result);
    }

    // Swipe recommendation engine workflow
    if (swiperItemId) {
      const swiperItem = db.items.find(i => i.id === swiperItemId);
      if (!swiperItem) {
        return res.status(404).json({ error: "Swiper item not found" });
      }

      // 1. Exclude items from the same owner (cannot trade with yourself!)
      result = result.filter(item => item.user_id !== swiperItem.user_id);

      // 2. Filter out already-swiped target items by this specific swiperItem
      if (excludeSwiped === "true" || excludeSwiped === undefined) {
        const swipedTargetIds = db.swipes
          .filter(s => s.swiper_item_id === swiperItemId)
          .map(s => s.target_item_id);
        result = result.filter(item => !swipedTargetIds.includes(item.id));
      }

      // 3. APPLY VALUE-TIER RECOMMENDATION RULES:
      // By default, recommendation engine displays items within the same tier
      if (acceptDifferentTiers !== "true") {
        result = result.filter(item => item.value_tier === swiperItem.value_tier);
      }
    }

    res.json(result);
  });

  // Create custom new item listing under Value-Tier
  app.post("/api/items/create", (req, res) => {
    const { title, description, value_tier, images, category } = req.body;
    if (!title || !description || !value_tier) {
      return res.status(400).json({ error: "Missing required listing fields: title, description, value_tier" });
    }

    const db = getDb();
    const activeUserId = db.activeUserId;

    // Use default Unsplash item image if none provided
    const defaultImages = [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80"
    ];

    const newItem: Item = {
      id: generateUUID(),
      user_id: activeUserId,
      title,
      description,
      images: Array.isArray(images) && images.length > 0 ? images : defaultImages,
      value_tier: Number(value_tier) as ValueTierId,
      category: category || "other",
      is_active: true
    };

    db.items.push(newItem);
    saveDb(db);
    res.json(newItem);
  });

  // Swipe Action endpoint
  app.post("/api/swipes", (req, res) => {
    const { swiper_item_id, target_item_id, action_type, bundle_item_ids, cash_topup } = req.body;
    if (!swiper_item_id || !target_item_id || !action_type) {
      return res.status(400).json({ error: "Missing parameters" });
    }

    const db = getDb();
    const activeUserId = db.activeUserId;

    // Verify ownership of the swiping item
    const swiperItem = db.items.find(i => i.id === swiper_item_id);
    if (!swiperItem || swiperItem.user_id !== activeUserId) {
      return res.status(403).json({ error: "Unauthorized swiping item" });
    }

    const targetItem = db.items.find(i => i.id === target_item_id);
    if (!targetItem) {
      return res.status(404).json({ error: "Target item not found" });
    }

    // Save swipe event
    const newSwipe: Swipe = {
      id: generateUUID(),
      swiper_item_id,
      target_item_id,
      action_type: action_type as ActionType,
      bundle_item_ids: Array.isArray(bundle_item_ids) ? bundle_item_ids : [],
      cash_topup: Number(cash_topup) || 0,
      created_at: new Date().toISOString()
    };
    
    db.swipes.push(newSwipe);

    let mutualMatchCreated = null;

    // If swiper Swipes LIKE: scan for mutual match
    if (action_type === ActionType.LIKE) {
      // Find a reciprocal swipe: target_item_id likes swiper_item_id
      const reciprocalSwipe = db.swipes.find(s => 
        s.swiper_item_id === target_item_id && 
        s.target_item_id === swiper_item_id && 
        s.action_type === ActionType.LIKE
      );

      if (reciprocalSwipe) {
        // Mutual MATCH triggered! Hold both behind escrow payment paywall.
        // Formulate payment links/QRs for Eth digital wallets
        const matchId = "match-" + Math.random().toString(36).substring(2, 10);
        
        // Generate mock dynamic Eth pay links
        const payUrlPrefix = "https://lwach-pay.et/checkout/" + matchId;

        const newMatch: Match = {
          id: matchId,
          item_a_id: swiper_item_id, // Swiper item (Party A)
          item_b_id: target_item_id, // Target item (Party B)
          party_a_paid: false,
          party_b_paid: false,
          payment_links: {
            party_a_telebirr: `${payUrlPrefix}/telebirr/party_a`,
            party_b_telebirr: `${payUrlPrefix}/telebirr/party_b`,
            party_a_qr: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=telebirr://pay?to=lwach&amount=fee&ref=${matchId}_A`,
            party_b_qr: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=telebirr://pay?to=lwach&amount=fee&ref=${matchId}_B`
          },
          is_unlocked: false,
          bundle_item_ids_a: newSwipe.bundle_item_ids,
          bundle_item_ids_b: reciprocalSwipe.bundle_item_ids,
          cash_topup_a: newSwipe.cash_topup,
          cash_topup_b: reciprocalSwipe.cash_topup,
          created_at: new Date().toISOString()
        };

        db.matches.push(newMatch);
        mutualMatchCreated = newMatch;

        // Initialize Logistics Checklist
        const defaultLogistics: LogisticsChecklist = {
          match_id: matchId,
          exchange_method: null,
          meetup_location: "",
          meetup_time: "",
          courier_status: null,
          courier_partner: "",
          party_a_completed: false,
          party_b_completed: false
        };
        db.logistics.push(defaultLogistics);
      }
    }

    saveDb(db);
    res.json({ swipe: newSwipe, match: mutualMatchCreated });
  });

  // Get active matches with payment status, item details, bundle details and escrow unlock state
  app.get("/api/matches", (req, res) => {
    const db = getDb();
    const activeUserId = db.activeUserId;

    // Get all matches involving any items owned by the current active user
    const userItemIds = db.items
      .filter(i => i.user_id === activeUserId)
      .map(i => i.id);

    const matches = db.matches.filter(m => 
      userItemIds.includes(m.item_a_id) || userItemIds.includes(m.item_b_id)
    );

    // Hydrate matches with item objects and user profiles
    const hydratedMatches = matches.map(match => {
      const itemA = db.items.find(i => i.id === match.item_a_id)!;
      const itemB = db.items.find(i => i.id === match.item_b_id)!;

      const userA = db.users.find(u => u.id === itemA.user_id)!;
      const userB = db.users.find(u => u.id === itemB.user_id)!;

      // Bundle objects hydration
      const bundleA = (match.bundle_item_ids_a || []).map(id => db.items.find(i => i.id === id)).filter(Boolean);
      const bundleB = (match.bundle_item_ids_b || []).map(id => db.items.find(i => i.id === id)).filter(Boolean);

      const logistics = db.logistics.find(l => l.match_id === match.id);

      return {
        ...match,
        itemA,
        itemB,
        userA,
        userB,
        bundleA,
        bundleB,
        logistics
      };
    });

    res.json(hydratedMatches);
  });

  // Trigger Escrow Paywall simulated action
  app.post("/api/matches/:id/pay", (req, res) => {
    const { id } = req.params;
    const { party } = req.body; // 'A' or 'B'

    if (party !== 'A' && party !== 'B') {
      return res.status(400).json({ error: "Party must be 'A' or 'B'" });
    }

    const db = getDb();
    const match = db.matches.find(m => m.id === id);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    if (party === 'A') {
      match.party_a_paid = true;
    } else {
      match.party_b_paid = true;
    }

    // Lockout condition trigger check
    if (match.party_a_paid && match.party_b_paid) {
      match.is_unlocked = true;
    }

    saveDb(db);
    res.json({ message: `Successfully simulated payment capture for Party ${party}`, match });
  });

  // Live chat messages for unlocked matches
  app.get("/api/matches/:id/messages", (req, res) => {
    const { id } = req.params;
    const db = getDb();
    const match = db.matches.find(m => m.id === id);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    const messages = db.messages.filter(msg => msg.match_id === id);
    res.json(messages);
  });

  app.post("/api/matches/:id/messages", (req, res) => {
    const { id } = req.params;
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: "Message content cannot be empty" });
    }

    const db = getDb();
    const match = db.matches.find(m => m.id === id);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    if (!match.is_unlocked) {
      return res.status(403).json({ error: "Escrow payment paywall locked. Unlock match first." });
    }

    const newMessage: Message = {
      id: generateUUID(),
      match_id: id,
      sender_id: db.activeUserId,
      content,
      created_at: new Date().toISOString()
    };

    db.messages.push(newMessage);
    saveDb(db);
    res.json(newMessage);
  });

  // Hub-Based logistics planner updater
  app.post("/api/matches/:id/logistics", (req, res) => {
    const { id } = req.params;
    const { 
      exchange_method, 
      meetup_location, 
      meetup_time, 
      courier_status, 
      courier_partner,
      party_a_completed,
      party_b_completed
    } = req.body;

    const db = getDb();
    let logistics = db.logistics.find(l => l.match_id === id);
    if (!logistics) {
      logistics = {
        match_id: id,
        exchange_method: null,
        meetup_location: "",
        meetup_time: "",
        courier_status: null,
        courier_partner: "",
        party_a_completed: false,
        party_b_completed: false
      };
      db.logistics.push(logistics);
    }

    if (exchange_method !== undefined) logistics.exchange_method = exchange_method;
    if (meetup_location !== undefined) logistics.meetup_location = meetup_location;
    if (meetup_time !== undefined) logistics.meetup_time = meetup_time;
    if (courier_status !== undefined) logistics.courier_status = courier_status;
    if (courier_partner !== undefined) logistics.courier_partner = courier_partner;
    if (party_a_completed !== undefined) logistics.party_a_completed = party_a_completed;
    if (party_b_completed !== undefined) logistics.party_b_completed = party_b_completed;

    saveDb(db);
    res.json(logistics);
  });

  // Serve static assets / fallback to Vite
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Lwach active on port ${PORT}`);
  });
}

startServer();
