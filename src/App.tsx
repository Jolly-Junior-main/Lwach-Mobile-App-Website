import React, { useState, useEffect } from "react";
import { User, Item, Match, ValueTierId, ActionType } from "./types";
import SwipeCard from "./components/SwipeCard";
import MyListings from "./components/MyListings";
import MatchesSection from "./components/MatchesSection";
import { db, collection, doc, getDocs, setDoc, onSnapshot, query, where, updateDoc } from "./lib/firebase";
import { 
  Sparkle, 
  Layers, 
  HelpCircle, 
  Compass, 
  ShoppingBag, 
  Workflow, 
  TrendingUp, 
  ExternalLink,
  ChevronRight,
  UserCheck,
  RefreshCw,
  Plus,
  Lock,
  MessageCircle,
  AlertCircle,
  Moon,
  Sun
} from "lucide-react";

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [swipedItemIds, setSwipedItemIds] = useState<string[]>([]);
  
  // UI states
  const [activeTab, setActiveTab] = useState<"swipe" | "listings" | "matches">("swipe");
  const [activeMyItem, setActiveMyItem] = useState<Item | null>(null);
  const [candidates, setCandidates] = useState<Item[]>([]);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);

  // Settings matching filter states
  const [acceptDifferentTiers, setAcceptDifferentTiers] = useState<boolean>(false);
  const [blindBoxMode, setBlindBoxMode] = useState<boolean>(false);

  const [lang, setLang] = useState<"en" | "am">("en");
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    if (theme === "light") {
      document.body.classList.add("light");
    } else {
      document.body.classList.remove("light");
    }
  }, [theme]);

  // Secure User Session Authentication & Login
  const [isSignUpMode, setIsSignUpMode] = useState<boolean>(false);
  const [signUpFirstName, setSignUpFirstName] = useState("");
  const [signUpLastName, setSignUpLastName] = useState("");
  const [signUpPhone, setSignUpPhone] = useState("");
  const [signUpPass, setSignUpPass] = useState("");
  const [signUpConfirmPass, setSignUpConfirmPass] = useState("");
  const [signUpError, setSignUpError] = useState("");
  const [signUpSuccess, setSignUpSuccess] = useState("");

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("lwach_is_logged_in") === "true";
  });
  const [loggedUsername, setLoggedUsername] = useState<string>(() => {
    return localStorage.getItem("lwach_logged_user") || "";
  });
  const [loginUserVal, setLoginUserVal] = useState("");
  const [loginPassVal, setLoginPassVal] = useState("");
  const [loginError, setLoginError] = useState("");

  const validateEthiopianPhone = (phone: string) => {
    const trimmed = phone.trim();
    // Match optional +, then optional 251 or 0, then 9 or 7, then 8 digits.
    const regex = /^(?:\+251|251|0)?[97]\d{8}$/;
    if (!regex.test(trimmed)) {
      return null;
    }
    // Standardize to "+251XXXXXXXXX"
    let clean = trimmed.replace(/\D/g, ""); // extract only digits
    if (clean.startsWith("0")) {
      clean = "251" + clean.substring(1);
    } else if (!clean.startsWith("251")) {
      clean = "251" + clean;
    }
    return "+" + clean;
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignUpError("");
    setSignUpSuccess("");

    const fName = signUpFirstName.trim();
    const lName = signUpLastName.trim();
    const phone = signUpPhone.trim();
    const pass = signUpPass.trim();
    const confirm = signUpConfirmPass.trim();

    if (!fName || !lName || !phone || !pass || !confirm) {
      setSignUpError(lang === "en" ? "All fields are required." : "ሁሉም መስኮች ያስፈልጋሉ።");
      return;
    }

    if (pass !== confirm) {
      setSignUpError(lang === "en" ? "Passwords do not match." : "የይለፍ ቃሎች አይዛመዱም።");
      return;
    }

    if (pass.length < 4) {
      setSignUpError(lang === "en" ? "Password must be at least 4 characters." : "የይለፍ ቃል ቢያንስ 4 ቁምፊዎች መሆን አለበት።");
      return;
    }

    const formattedPhone = validateEthiopianPhone(phone);
    if (!formattedPhone) {
      setSignUpError(lang === "en" 
        ? "Invalid Ethiopian Phone format (e.g., 0911002233 or +251911002233)" 
        : "ትክክለኛ የኢትዮጵያ ስልክ ቅርጸት ያስገቡ (ለምሳሌ 0911002233)"
      );
      return;
    }

    try {
      const baseUsername = `${fName.toLowerCase()}${lName.toLowerCase()}`.replace(/[^a-z0-9]/g, "");
      
      const q = query(
        collection(db, "users"),
        where("username", "==", baseUsername)
      );
      const querySnap = await getDocs(q);
      
      let finalUsername = baseUsername;
      if (!querySnap.empty) {
        finalUsername = `${baseUsername}${Math.floor(100 + Math.random() * 900)}`;
      }

      const uId = "custom-user-" + Math.random().toString(36).substring(2, 9);
      const userObj = {
        id: uId,
        full_name: `${fName} ${lName}`,
        username: finalUsername,
        password: pass,
        phone_number: formattedPhone,
        rating: "5.0",
        created_at: new Date().toISOString()
      };

      await setDoc(doc(db, "users", uId), userObj);

      setSignUpSuccess(lang === "en" 
        ? `Account registered successfully! Login with Username: "${finalUsername}" and Password: "${pass}"` 
        : `መለያ በተሳካ ሁኔታ ተፈጥሯል! መለያ ስም: "${finalUsername}" እና የይለፍ ቃል: "${pass}"`
      );

      setLoginUserVal(finalUsername);
      setLoginPassVal(pass);

      setSignUpFirstName("");
      setSignUpLastName("");
      setSignUpPhone("");
      setSignUpPass("");
      setSignUpConfirmPass("");

      setTimeout(() => {
        setIsSignUpMode(false);
      }, 4000);

    } catch (err) {
      console.error("Sign up user creation error:", err);
      setSignUpError(lang === "en" ? "Failed to save account to Cloud Database." : "መገለጫውን ማዳን አልተቻለም።");
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const u = loginUserVal.trim();
    const p = loginPassVal.trim();
    setLoginError("");

    try {
      // Fetch credential check directly from Firebase Database in Real-time
      const q = query(
        collection(db, "users"),
        where("username", "==", u),
        where("password", "==", p)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        // Authenticated Session Identity Found
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();
        
        localStorage.setItem("lwach_is_logged_in", "true");
        localStorage.setItem("lwach_logged_user", userData.full_name);
        
        setIsLoggedIn(true);
        setLoggedUsername(userData.full_name);
        setCurrentUser({ id: userDoc.id, ...userData } as any);
        setLoginError("");
      } else {
        // Double fallback check for default evaluation accounts
        if (u.toLowerCase() === "admin" && p === "admin") {
          const userDocRef = doc(db, "users", "user-admin");
          const targetObj = {
            id: "user-admin",
            full_name: "Admin",
            username: "Admin",
            password: "admin",
            phone_number: "+251911000001",
            rating: "5.0",
            created_at: new Date().toISOString()
          };
          await setDoc(userDocRef, targetObj);
          
          localStorage.setItem("lwach_is_logged_in", "true");
          localStorage.setItem("lwach_logged_user", "Admin");
          setIsLoggedIn(true);
          setLoggedUsername("Admin");
          setCurrentUser(targetObj as any);
          setLoginError("");
        } else if (u.toLowerCase() === "bahreab" && p === "Bahreab") {
          const userDocRef = doc(db, "users", "user-bahreab");
          const targetObj = {
            id: "user-bahreab",
            full_name: "Bahreab",
            username: "Bahreab",
            password: "Bahreab",
            phone_number: "+251911993300",
            rating: "4.9",
            created_at: new Date().toISOString()
          };
          await setDoc(userDocRef, targetObj);
          
          localStorage.setItem("lwach_is_logged_in", "true");
          localStorage.setItem("lwach_logged_user", "Bahreab");
          setIsLoggedIn(true);
          setLoggedUsername("Bahreab");
          setCurrentUser(targetObj as any);
          setLoginError("");
        } else {
          setLoginError(lang === "en" 
            ? "Invalid Username or Password. Please try again!" 
            : "የተሳሳተ መለያ ስም ወይም የይለፍ ቃል! እባክዎ እንደገና ይሞክሩ።"
          );
        }
      }
    } catch (err) {
      console.error("Firebase Login query details failure:", err);
      setLoginError("Failed to verify credentials with cloud database.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("lwach_is_logged_in");
    localStorage.removeItem("lwach_logged_user");
    setIsLoggedIn(false);
    setLoggedUsername("");
    setLoginUserVal("");
    setLoginPassVal("");
    setLoginError("");
  };

  // Match celebration modal state
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [celeborateMatch, setCelebrateMatch] = useState<any | null>(null);

  // Custom User Profile Creator State
  const [showCreator, setShowCreator] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [loading, setLoading] = useState(true);

  // Seed Firebase Database with Initial Core Data Fallback
  const seedFirestore = async () => {
    try {
      const res = await fetch("/api/state");
      if (!res.ok) return;
      const data = await res.json();
      
      // Inject Users with Logins
      for (const u of data.users) {
        const uLower = u.full_name.toLowerCase();
        let pass = "password";
        let username = u.full_name;
        if (uLower === "admin") {
          pass = "admin";
          username = "Admin";
        } else if (uLower === "bahreab") {
          pass = "Bahreab";
          username = "Bahreab";
        }
        await setDoc(doc(db, "users", u.id), {
          id: u.id,
          full_name: u.full_name,
          username: username,
          password: pass,
          phone_number: u.phone_number || "+251911993300",
          rating: u.full_name === "Admin" ? "5.0" : u.full_name === "Bahreab" ? "4.9" : "4.7",
          created_at: u.created_at || new Date().toISOString()
        }, { merge: true });
      }

      // Add precise credential identities
      const specials = [
        { id: "user-admin", full_name: "Admin", username: "Admin", password: "admin", phone_number: "+251911000001", rating: "5.0" },
        { id: "user-bahreab", full_name: "Bahreab", username: "Bahreab", password: "Bahreab", phone_number: "+251911993300", rating: "4.9" }
      ];
      for (const sp of specials) {
        await setDoc(doc(db, "users", sp.id), {
          id: sp.id,
          full_name: sp.full_name,
          username: sp.username,
          password: sp.password,
          phone_number: sp.phone_number,
          rating: sp.rating,
          created_at: new Date().toISOString()
        }, { merge: true });
      }

      // Inject default items
      for (const item of data.items) {
        let tUser = item.user_id;
        if (item.user_id === "user-1") tUser = "user-admin";
        if (item.user_id === "user-2") tUser = "user-bahreab";
        await setDoc(doc(db, "items", item.id), {
          id: item.id,
          user_id: tUser,
          title: item.title,
          description: item.description,
          images: item.images,
          value_tier: item.value_tier,
          category: item.category || "other",
          is_active: true
        }, { merge: true });
      }

      // 5 Custom Ethiopian Users Seeding
      const seedUsers = [
        { id: "u-henok", full_name: "Henok Abebe", username: "henok", password: "password123", phone_number: "+251911223344", rating: "4.8" },
        { id: "u-selam", full_name: "Selam Tesfaye", username: "selam", password: "selamPass78", phone_number: "+251922334455", rating: "4.9" },
        { id: "u-bekele", full_name: "Bekele Tolossa", username: "bekele", password: "bekeleTol12", phone_number: "+251933445566", rating: "4.7" },
        { id: "u-aster", full_name: "Aster Awoke", username: "aster", password: "asterAw89!", phone_number: "+251944556677", rating: "5.0" },
        { id: "u-yared", full_name: "Yared Negu", username: "yared", password: "yaredNeg55", phone_number: "+251955667788", rating: "4.6" }
      ];

      for (const u of seedUsers) {
        await setDoc(doc(db, "users", u.id), {
          id: u.id,
          full_name: u.full_name,
          username: u.username,
          password: u.password,
          phone_number: u.phone_number,
          rating: u.rating,
          created_at: new Date().toISOString()
        }, { merge: true });
      }

      // 3 Unique Listings per User
      const seedItems = [
        { id: "i-henok-1", user_id: "u-henok", title: "iPhone 13 Pro Max", description: "256GB Alpine Green in pristine condition, looking to barter for a MacBook.", value_tier: "gold" as any, images: ["https://images.unsplash.com/photo-1632661674596-df8be070a5c5?w=500&auto=format&fit=crop"], category: "electronics" },
        { id: "i-henok-2", user_id: "u-henok", title: "Dahon Folding Bicycle", description: "Model D8 folding bike in black. Handy for urban commuting, pristine brakes.", value_tier: "silver" as any, images: ["https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&auto=format&fit=crop"], category: "other" },
        { id: "i-henok-3", user_id: "u-henok", title: "Sony WH-1000XM4 Headphones", description: "Excellent ANC over-ear headphones, like new. Box and original accessories included.", value_tier: "silver" as any, images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop"], category: "electronics" },
        
        { id: "i-selam-1", user_id: "u-selam", title: "MacBook Air M1", description: "8GB memory, 256GB SSD in stylish Space Gray. Battery health at 92%.", value_tier: "gold" as any, images: ["https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop"], category: "electronics" },
        { id: "i-selam-2", user_id: "u-selam", title: "Canon EOS M50 Mark II", description: "Mirrorless camera with 15-45mm lens pack. Great shape, superb for vlogging.", value_tier: "gold" as any, images: ["https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop"], category: "electronics" },
        { id: "i-selam-3", user_id: "u-selam", title: "JBL Charge 5 Speaker", description: "Waterproof Bluetooth speaker in navy blue. Bold sound and long lasting playback.", value_tier: "silver" as any, images: ["https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&auto=format&fit=crop"], category: "electronics" },
        
        { id: "i-bekele-1", user_id: "u-bekele", title: "Samsung Galaxy S22 Ultra", description: "Phantom Black, 12GB RAM, 5G enabled. Excellent zoom cameras.", value_tier: "gold" as any, images: ["https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=500&auto=format&fit=crop"], category: "electronics" },
        { id: "i-bekele-2", user_id: "u-bekele", title: "Fender Squier Stratocaster", description: "Electric guitar, sunburst finish. Sounds rich and plays beautifully.", value_tier: "silver" as any, images: ["https://images.unsplash.com/photo-1550985616-10810253b84d?w=500&auto=format&fit=crop"], category: "other" },
        { id: "i-bekele-3", user_id: "u-bekele", title: "Kindle Paperwhite (11th Gen)", description: "8GB storage with adjustable warm light. Battery lasts for weeks, water-resistant.", value_tier: "bronze" as any, images: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop"], category: "books" },
        
        { id: "i-aster-1", user_id: "u-aster", title: "Dell XPS 13 Laptop", description: "Premium i7 laptop with infinity border display. 16GB RAM for productivity.", value_tier: "gold" as any, images: ["https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=500&auto=format&fit=crop"], category: "electronics" },
        { id: "i-aster-2", user_id: "u-aster", title: "iPad Air 4th Generation", description: "Sky Blue, 64GB with original Charger. Works flawlessly with Apple Pencil.", value_tier: "gold" as any, images: ["https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop"], category: "electronics" },
        { id: "i-aster-3", user_id: "u-aster", title: "Logitech MX Master 3S Mouse", description: "Fabulous ergonomic mouse with super fast scroll wheel. Like new.", value_tier: "bronze" as any, images: ["https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&auto=format&fit=crop"], category: "electronics" },
        
        { id: "i-yared-1", user_id: "u-yared", title: "PlayStation 5 Console", description: "Disc Edition in white with 1 DualSense controller and HDMI cable.", value_tier: "gold" as any, images: ["https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500&auto=format&fit=crop"], category: "electronics" },
        { id: "i-yared-2", user_id: "u-yared", title: "Nike Air Max Sneakers", description: "Sport sneakers in Size 42. Extremely comfortable and never worn outdoors.", value_tier: "bronze" as any, images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop"], category: "other" },
        { id: "i-yared-3", user_id: "u-yared", title: "Casio G-Shock Watch", description: "Rugged black sport watch, water and shock resistant. Extremely durable.", value_tier: "bronze" as any, images: ["https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=500&auto=format&fit=crop"], category: "other" }
      ];

      for (const item of seedItems) {
        await setDoc(doc(db, "items", item.id), {
          id: item.id,
          user_id: item.user_id,
          title: item.title,
          description: item.description,
          images: item.images,
          value_tier: item.value_tier,
          category: item.category,
          is_active: true
        }, { merge: true });
      }
    } catch (e) {
      console.error("Automatic Firestore database seeding error:", e);
    }
  };

  // Setup Live Listeners for Real-Time Firestore Sync
  useEffect(() => {
    setLoading(true);

    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const uList: any[] = [];
      snapshot.forEach(docSnap => {
        uList.push({ id: docSnap.id, ...docSnap.data() });
      });
      
      if (uList.length > 0) {
        setUsers(uList);
        if (isLoggedIn && loggedUsername) {
          const matched = uList.find(u => u.full_name.toLowerCase() === loggedUsername.toLowerCase());
          if (matched) {
            setCurrentUser(matched);
          }
        }
      } else {
        seedFirestore();
      }
      setLoading(false);
    }, (err) => {
      console.error("Firestore user snapshot listener failure:", err);
      setLoading(false);
    });

    const unsubItems = onSnapshot(collection(db, "items"), (snapshot) => {
      const iList: any[] = [];
      snapshot.forEach(docSnap => {
        iList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setItems(iList);
    });

    const unsubMatches = onSnapshot(collection(db, "matches"), (snapshot) => {
      const mList: any[] = [];
      snapshot.forEach(docSnap => {
        mList.push({ id: docSnap.id, ...docSnap.data() });
      });
      setMatches(mList);
    });

    return () => {
      unsubUsers();
      unsubItems();
      unsubMatches();
    };
  }, [isLoggedIn, loggedUsername]);

  // Sync personal swipes to prevent swiping on already queried matches/swipes
  useEffect(() => {
    if (!currentUser || !activeMyItem) {
      setSwipedItemIds([]);
      return;
    }
    const q = query(
      collection(db, "swipes"),
      where("swiper_item_id", "==", activeMyItem.id)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const list: string[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        if (d.target_item_id) {
          list.push(d.target_item_id);
        }
      });
      setSwipedItemIds(list);
    });
    return () => unsub();
  }, [currentUser, activeMyItem]);

  // Real-time local filtering of candidate list cards
  useEffect(() => {
    if (!activeMyItem || !currentUser || items.length === 0) {
      setCandidates([]);
      return;
    }

    const filtered = items.filter(item => {
      if (item.user_id === currentUser.id) return false;
      if (!item.is_active) return false;
      if (swipedItemIds.includes(item.id)) return false;
      if (!acceptDifferentTiers && item.value_tier !== activeMyItem.value_tier) return false;
      return true;
    });

    setCandidates(filtered);
  }, [activeMyItem, currentUser, items, swipedItemIds, acceptDifferentTiers]);

  // Sync selected offer item auto slider when currentUser profile activates
  useEffect(() => {
    if (currentUser && items.length > 0) {
      const myActiveListings = items.filter(i => i.user_id === currentUser.id);
      if (myActiveListings.length > 0) {
        const stillSelected = myActiveListings.find(i => i.id === activeMyItem?.id);
        if (!stillSelected) {
          setActiveMyItem(myActiveListings[0]);
        }
      } else {
        setActiveMyItem(null);
      }
    }
  }, [currentUser, items]);

  const [hydratedMatches, setHydratedMatches] = useState<any[]>([]);

  useEffect(() => {
    if (items.length === 0 || users.length === 0 || matches.length === 0) {
      setHydratedMatches([]);
      return;
    }
    const hydrated = matches.map(m => {
      const itemA = items.find(i => i.id === m.item_a_id);
      const itemB = items.find(i => i.id === m.item_b_id);
      const userA = users.find(u => u.id === itemA?.user_id);
      const userB = users.find(u => u.id === itemB?.user_id);
      return {
        ...m,
        itemA,
        itemB,
        userA,
        userB
      };
    }).filter(m => m.itemA && m.itemB);
    setHydratedMatches(hydrated);
  }, [matches, items, users]);

  const handleSwitchUser = async (userId: string) => {
    const matched = users.find(u => u.id === userId);
    if (matched) {
      localStorage.setItem("lwach_logged_user", matched.full_name);
      setLoggedUsername(matched.full_name);
      setCurrentUser(matched);
    }
  };


  const handleResetDb = async () => {
    if (!window.confirm("This will reset all listed items, matches, and transactions. Continue?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      if (res.ok) {
        await seedFirestore();
        setActiveTab("swipe");
      }
    } catch (err) {
      console.error("Error resetting states:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newPhone) return;
    try {
      const uId = "custom-user-" + Math.random().toString(36).substring(2, 9);
      await setDoc(doc(db, "users", uId), {
        id: uId,
        full_name: newName,
        username: newName.toLowerCase().replace(/\s+/g, ""),
        password: "password",
        phone_number: newPhone,
        rating: "4.8",
        created_at: new Date().toISOString()
      });
      setNewName("");
      setNewPhone("");
      setShowCreator(false);
      setActiveTab("listings");
    } catch (err) {
      console.error("Creation failed:", err);
    }
  };

  const handleListItem = async (data: {
    title: string;
    description: string;
    value_tier: ValueTierId;
    images: string[];
  }) => {
    if (!currentUser) return;
    try {
      const itemId = "item-" + Math.random().toString(36).substring(2, 9);
      await setDoc(doc(db, "items", itemId), {
        id: itemId,
        user_id: currentUser.id,
        title: data.title,
        description: data.description,
        value_tier: data.value_tier,
        images: data.images,
        category: "other",
        is_active: true
      });
      setActiveTab("swipe");
    } catch (err) {
      console.error("Failed adding listing items:", err);
    }
  };

  const handleSwipeAction = async (
    targetItemId: string, 
    action: ActionType, 
    bundles: string[], 
    cashTopup: number
  ) => {
    if (!activeMyItem || !currentUser) return;
    try {
      const swipeId = "swipe-" + Math.random().toString(36).substring(2, 9);
      await setDoc(doc(db, "swipes", swipeId), {
        id: swipeId,
        swiper_item_id: activeMyItem.id,
        target_item_id: targetItemId,
        action_type: action,
        bundle_item_ids: bundles,
        cash_topup: cashTopup,
        created_at: new Date().toISOString()
      });

      if (action === ActionType.LIKE) {
        // Query if target item owners swiped LIKE on activeMyItem
        const q = query(
          collection(db, "swipes"),
          where("swiper_item_id", "==", targetItemId),
          where("target_item_id", "==", activeMyItem.id),
          where("action_type", "==", "LIKE")
        );
        const querySnap = await getDocs(q);

        if (!querySnap.empty) {
          // Mutually matched
          const matchId = "match-" + Math.random().toString(36).substring(2, 9);
          const matchObj = {
            id: matchId,
            item_a_id: activeMyItem.id,
            item_b_id: targetItemId,
            party_a_paid: false,
            party_b_paid: false,
            payment_links: {
              party_a_telebirr: "https://pay.telebirr.et/simulated_lwach_payment_a_" + matchId,
              party_b_telebirr: "https://pay.telebirr.et/simulated_lwach_payment_b_" + matchId,
              party_a_qr: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=telebirr_lwach_a_" + matchId,
              party_b_qr: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=telebirr_lwach_b_" + matchId,
            },
            is_unlocked: false,
            bundle_item_ids_a: bundles,
            cash_topup_a: cashTopup,
            created_at: new Date().toISOString(),
            logistics: {
              match_id: matchId,
              exchange_method: "MEETUP",
              meetup_location: "Bole Medhanialem Mall, Addis Ababa",
              meetup_time: "Saturday, 3:00 PM",
              courier_status: "PENDING",
              courier_partner: "Simulated DHL Express",
              party_a_completed: false,
              party_b_completed: false
            }
          };
          await setDoc(doc(db, "matches", matchId), matchObj);

          setCelebrateMatch(matchObj);
          setShowCelebration(true);
          setActiveMatchId(matchId);
          setActiveTab("matches");
        }
      }

      setCandidates(prev => prev.filter(c => c.id !== targetItemId));
    } catch (err) {
      console.error("Failed to register swipe:", err);
    }
  };

  const handleSimulatePayment = async (matchId: string, party: "A" | "B") => {
    try {
      const matchRef = doc(db, "matches", matchId);
      const activeMatch = matches.find(m => m.id === matchId);
      if (!activeMatch) return;

      const updateObj: any = {};
      if (party === "A") {
        updateObj.party_a_paid = true;
      } else {
        updateObj.party_b_paid = true;
      }

      const isAPaid = party === "A" ? true : activeMatch.party_a_paid;
      const isBPaid = party === "B" ? true : activeMatch.party_b_paid;
      if (isAPaid && isBPaid) {
        updateObj.is_unlocked = true;
      }

      await updateDoc(matchRef, updateObj);
    } catch (err) {
      console.error("Escrow payment simulated fail:", err);
    }
  };

  const handleSendMessage = async (matchId: string, content: string) => {
    if (!currentUser) return;
    try {
      const msgId = "msg-" + Math.random().toString(36).substring(2, 9);
      await setDoc(doc(db, "messages", msgId), {
        id: msgId,
        match_id: matchId,
        sender_id: currentUser.id,
        content: content,
        created_at: new Date().toISOString()
      });
    } catch (err) {
      console.error("Sending message failed:", err);
    }
  };

  const handleUpdateLogistics = async (matchId: string, data: any) => {
    try {
      const matchRef = doc(db, "matches", matchId);
      const activeMatch = matches.find(m => m.id === matchId);
      const currentLogistics = activeMatch?.logistics || {};
      await updateDoc(matchRef, {
        logistics: {
          ...currentLogistics,
          ...data
        }
      });
    } catch (err) {
      console.error("Logistics update failed:", err);
    }
  };

  const myItemsList = items.filter(item => item.user_id === currentUser?.id);

  if (!isLoggedIn) {
    return (
      <div 
        className="min-h-screen bg-cover bg-center text-inherit font-sans flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-[#00F5FF] selection:text-black relative"
        style={{ backgroundImage: "url('/src/assets/images/login_background_1781887549029.jpg')" }}
      >
        {/* Dark subtle overlay for perfect contrast */}
        <div className="absolute inset-0 bg-neutral-950/75 backdrop-blur-[2px] z-0"></div>

        <div className={`max-w-md w-full space-y-6 p-8 rounded-3xl border shadow-2xl relative z-10 transition duration-300 ${
          theme === "light" 
            ? "bg-white/95 border-neutral-200 text-neutral-800" 
            : "glass border-white/5 text-white"
        }`}>
          <div className="flex justify-between items-center mb-1">
            {/* Lang Selector inside Login Card */}
            <div className={`flex gap-0.5 p-0.5 rounded-xl border ${
              theme === "light" ? "bg-neutral-100 border-neutral-200/60" : "bg-neutral-900/50 border-white/5"
            }`}>
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2 py-1 text-[9px] uppercase font-mono font-bold rounded-lg transition duration-200 cursor-pointer ${
                  lang === "en" 
                    ? "bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/10 font-bold" 
                    : "text-neutral-400 hover:text-white font-normal bg-transparent"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("am")}
                className={`px-2 py-1 text-[9px] uppercase font-mono font-bold rounded-lg transition duration-200 cursor-pointer ${
                  lang === "am" 
                    ? "bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/10 font-bold" 
                    : "text-neutral-400 hover:text-white font-normal bg-transparent"
                }`}
              >
                አማ
              </button>
            </div>

            {/* Theme Selector inside Login Card - Icon based on Sun/Moon */}
            <div className={`flex gap-0.5 p-0.5 rounded-xl border ${
              theme === "light" ? "bg-neutral-100 border-neutral-200/60" : "bg-neutral-900/50 border-white/5"
            }`}>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-lg transition duration-200 cursor-pointer ${
                  theme === "dark" 
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/10" 
                    : "text-neutral-400 hover:text-neutral-600 bg-transparent"
                }`}
                title="Dark Mode"
              >
                <Moon size={11} />
              </button>
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-lg transition duration-200 cursor-pointer ${
                  theme === "light" 
                    ? "bg-amber-500/20 text-amber-500 border border-amber-500/10" 
                    : "text-neutral-400 hover:text-white bg-transparent"
                }`}
                title="Light Mode"
              >
                <Sun size={11} />
              </button>
            </div>
          </div>

          {/* Logo illustration */}
          <div className="relative group overflow-hidden rounded-2xl border border-white/10 shadow-lg select-none">
            <img
              src="/src/assets/images/lwach_logo_1781884730926.jpg"
              alt="Lwach Swapping Logo Illustration"
              className="w-full h-40 object-cover transition duration-500 hover:scale-105"
              referrerPolicy="no-referrer"
            />
          </div>

          <div>
            <h2 className={`text-xl font-black tracking-tight uppercase select-none ${
              theme === "light" ? "text-neutral-900" : "text-white"
            }`}>
              {isSignUpMode
                ? (lang === "en" ? "Sign Up with Lwach" : "መለያ ይፍጠሩ")
                : (lang === "en" ? "Sign In to Lwach" : "ወደ መለዋወጫው ይግቡ")
              }
            </h2>
            <p className="mt-1 text-xs text-neutral-400">
              {lang === "en" 
                ? "Discover peer-to-peer bartering with secure escrow swap pools" 
                : "የእቃ በገንዘብ ግምታዊ የዋስትና መለዋወጫ መድረክ"}
            </p>
          </div>

          {!isSignUpMode ? (
            /* LOGIN CARD FLOW */
            <form className="mt-4 space-y-4 text-left font-sans" onSubmit={handleLoginSubmit}>
              <div>
                <label className={`text-[10px] font-mono tracking-wider uppercase block mb-1 ${
                  theme === "light" ? "text-neutral-500" : "text-neutral-400"
                }`}>
                  {lang === "en" ? "Username" : "የመለያ ስም (Username)"}
                </label>
                <input
                  type="text"
                  required
                  className={`appearance-none rounded-xl relative block w-full px-3 py-2 border text-xs focus:outline-none focus:border-[#00F5FF] transition ${
                    theme === "light" 
                      ? "bg-neutral-50 border-neutral-200 text-neutral-800 placeholder-neutral-400" 
                      : "bg-neutral-950 border-white/5 text-white placeholder-neutral-500"
                  }`}
                  placeholder={lang === "en" ? "Enter Username..." : "የመለያ ስም ያስገቡ..."}
                  value={loginUserVal}
                  onChange={(e) => setLoginUserVal(e.target.value)}
                />
              </div>

              <div>
                <label className={`text-[10px] font-mono tracking-wider uppercase block mb-1 ${
                  theme === "light" ? "text-neutral-500" : "text-neutral-400"
                }`}>
                  {lang === "en" ? "Password" : "የይለፍ ቃል (Password)"}
                </label>
                <input
                  type="password"
                  required
                  className={`appearance-none rounded-xl relative block w-full px-3 py-2 border text-xs focus:outline-none focus:border-[#00F5FF] transition ${
                    theme === "light" 
                      ? "bg-neutral-50 border-neutral-200 text-neutral-800 placeholder-neutral-400" 
                      : "bg-neutral-950 border-white/5 text-white placeholder-neutral-500"
                  }`}
                  placeholder="••••••••"
                  value={loginPassVal}
                  onChange={(e) => setLoginPassVal(e.target.value)}
                />
              </div>

              {loginError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 p-2 rounded-xl text-center text-[10px] leading-relaxed font-sans">
                  {loginError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-[#00F5FF] hover:bg-[#00d7e0] text-black font-black uppercase text-xs tracking-wider rounded-xl transition duration-300 shadow-[0_0_15px_rgba(0,245,255,0.2)] focus:outline-none cursor-pointer text-center"
              >
                {lang === "en" ? "Secure Sign In" : "ደህንነቱ በተጠበቀ ሁኔታ ግባ"}
              </button>
            </form>
          ) : (
            /* SIGN UP CARD FLOW */
            <form className="mt-4 space-y-3.5 text-left font-sans" onSubmit={handleSignUpSubmit}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-[10px] font-mono tracking-wider uppercase block mb-1 ${
                    theme === "light" ? "text-neutral-500" : "text-neutral-400"
                  }`}>
                    {lang === "en" ? "First Name" : "የመጀመሪያ ስም"}
                  </label>
                  <input
                    type="text"
                    required
                    className={`appearance-none rounded-xl relative block w-full px-3 py-2 border text-xs focus:outline-none focus:border-[#00F5FF] transition ${
                      theme === "light" 
                        ? "bg-neutral-100 border-neutral-200 text-neutral-800 placeholder-neutral-400" 
                        : "bg-neutral-950 border-white/5 text-white placeholder-neutral-500"
                    }`}
                    placeholder={lang === "en" ? "e.g. Henok" : "ምሳሌ፦ ሄኖክ"}
                    value={signUpFirstName}
                    onChange={(e) => setSignUpFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className={`text-[10px] font-mono tracking-wider uppercase block mb-1 ${
                    theme === "light" ? "text-neutral-500" : "text-neutral-400"
                  }`}>
                    {lang === "en" ? "Last Name" : "የአያት ስም"}
                  </label>
                  <input
                    type="text"
                    required
                    className={`appearance-none rounded-xl relative block w-full px-3 py-2 border text-xs focus:outline-none focus:border-[#00F5FF] transition ${
                      theme === "light" 
                        ? "bg-neutral-100 border-neutral-200 text-neutral-800 placeholder-neutral-400" 
                        : "bg-neutral-950 border-white/5 text-white placeholder-neutral-500"
                    }`}
                    placeholder={lang === "en" ? "e.g. Abebe" : "ምሳሌ፦ አበበ"}
                    value={signUpLastName}
                    onChange={(e) => setSignUpLastName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className={`text-[10px] font-mono tracking-wider uppercase block mb-1 ${
                  theme === "light" ? "text-neutral-500" : "text-neutral-400"
                }`}>
                  {lang === "en" ? "Ethiopian Phone Number" : "የኢትዮጵያ ስልክ ቁጥር"}
                </label>
                <input
                  type="text"
                  required
                  className={`appearance-none rounded-xl relative block w-full px-3 py-2 border text-xs focus:outline-none focus:border-[#00F5FF] transition font-mono ${
                    theme === "light" 
                      ? "bg-neutral-100 border-neutral-200 text-neutral-800 placeholder-neutral-400" 
                      : "bg-neutral-950 border-white/10 text-white placeholder-neutral-500"
                  }`}
                  placeholder={lang === "en" ? "0911002233" : "0911002233"}
                  value={signUpPhone}
                  onChange={(e) => setSignUpPhone(e.target.value)}
                />
                <span className="text-[9px] text-neutral-500 mt-1 block">
                  {lang === "en" ? "Formats accept: 09... or +251..." : "ትክክለኛ ስልክ ቁጥር ብቻ (ለምሳሌ 09...)"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-[10px] font-mono tracking-wider uppercase block mb-1 ${
                    theme === "light" ? "text-neutral-500" : "text-neutral-400"
                  }`}>
                    {lang === "en" ? "Password" : "የይለፍ ቃል"}
                  </label>
                  <input
                    type="password"
                    required
                    className={`appearance-none rounded-xl relative block w-full px-3 py-2 border text-xs focus:outline-none focus:border-[#00F5FF] transition ${
                      theme === "light" 
                        ? "bg-neutral-100 border-neutral-200 text-neutral-800 placeholder-neutral-400" 
                        : "bg-neutral-950 border-white/5 text-white placeholder-neutral-500"
                    }`}
                    placeholder="••••••••"
                    value={signUpPass}
                    onChange={(e) => setSignUpPass(e.target.value)}
                  />
                </div>
                <div>
                  <label className={`text-[10px] font-mono tracking-wider uppercase block mb-1 ${
                    theme === "light" ? "text-neutral-500" : "text-neutral-400"
                  }`}>
                    {lang === "en" ? "Confirm" : "ማረጋገጫ"}
                  </label>
                  <input
                    type="password"
                    required
                    className={`appearance-none rounded-xl relative block w-full px-3 py-2 border text-xs focus:outline-none focus:border-[#00F5FF] transition ${
                      theme === "light" 
                        ? "bg-neutral-100 border-neutral-200 text-neutral-800 placeholder-neutral-400" 
                        : "bg-neutral-950 border-white/5 text-white placeholder-neutral-500"
                    }`}
                    placeholder="••••••••"
                    value={signUpConfirmPass}
                    onChange={(e) => setSignUpConfirmPass(e.target.value)}
                  />
                </div>
              </div>

              {signUpError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 p-2 rounded-xl text-center text-[10px] leading-relaxed font-sans">
                  {signUpError}
                </div>
              )}

              {signUpSuccess && (
                <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 p-2.5 rounded-xl text-center text-[10px] leading-normal font-sans">
                  {signUpSuccess}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-[#00F5FF] hover:bg-[#00d7e0] text-black font-black uppercase text-xs tracking-wider rounded-xl transition duration-300 shadow-[0_0_15px_rgba(0,245,255,0.2)] focus:outline-none cursor-pointer text-center"
              >
                {lang === "en" ? "Create Account" : "አዲስ መለያ ፍጠር"}
              </button>
            </form>
          )}

          {/* Toggle Link at bottom */}
          {!isSignUpMode ? (
            <div className="text-xs text-neutral-400 mt-4 select-none">
              {lang === "en" ? "Don't have an account?" : "መለያ የለዎትም?"}{" "}
              <button 
                onClick={() => {
                  setIsSignUpMode(true);
                  setSignUpError("");
                  setSignUpSuccess("");
                }} 
                className="text-[#00F5FF] hover:underline font-black cursor-pointer bg-transparent border-none outline-none"
              >
                {lang === "en" ? "Sign Up Now" : "አሁን ይመዝገቡ"}
              </button>
            </div>
          ) : (
            <div className="text-xs text-neutral-400 mt-4 select-none">
              {lang === "en" ? "Already have an account?" : "ቀድሞውኑ መለያ አለዎት?"}{" "}
              <button 
                onClick={() => {
                  setIsSignUpMode(false);
                  setLoginError("");
                }} 
                className="text-[#00F5FF] hover:underline font-black cursor-pointer bg-transparent border-none outline-none"
              >
                {lang === "en" ? "Sign In" : "ይግቡ"}
              </button>
            </div>
          )}

          {/* Quick Mock Accounts List */}
          <div className={`pt-4 border-t space-y-1 text-left text-[9px] tracking-wide leading-normal ${
            theme === "light" ? "border-neutral-200 text-neutral-500" : "border-white/5 text-neutral-400"
          }`}>
            <span className={`font-mono text-[8px] uppercase tracking-wider block ${
              theme === "light" ? "text-neutral-600" : "text-neutral-400"
            }`}>
              {lang === "en" ? "MOCK EVALUATION ACCOUNTS:" : "ለግምገማ መለያዎች፦"}
            </span>
            <div className="grid grid-cols-2 gap-1 mt-1 font-mono text-[8px]">
              <div className="p-1 rounded bg-neutral-900/40 border border-white/5 text-neutral-300">
                <span className="text-[#00F5FF] font-bold">henok</span> / <span className="opacity-80">password123</span>
              </div>
              <div className="p-1 rounded bg-neutral-900/40 border border-white/5 text-neutral-300">
                <span className="text-[#00F5FF] font-bold">selam</span> / <span className="opacity-80">selamPass78</span>
              </div>
              <div className="p-1 rounded bg-neutral-900/40 border border-white/5 text-neutral-300">
                <span className="text-amber-400 font-bold">bekele</span> / <span className="opacity-80">bekeleTol12</span>
              </div>
              <div className="p-1 rounded bg-neutral-900/40 border border-white/5 text-neutral-300">
                <span className="text-[#00F5FF] font-bold">aster</span> / <span className="opacity-80">asterAw89!</span>
              </div>
              <div className="p-1 rounded bg-neutral-900/40 border border-white/5 text-neutral-300">
                <span className="text-amber-400 font-bold">yared</span> / <span className="opacity-80">yaredNeg55</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-inherit font-sans flex flex-col justify-between selection:bg-[#00F5FF] selection:text-black">
      
      {/* Simulation Master Control Bar */}
      <div className="w-full glass border-b border-white/5 py-4 px-4 sm:px-8 shadow-2xl backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Logo and Title in Blackish Oval Container */}
          <div className="flex items-center gap-3 bg-neutral-950/95 border border-white/10 px-5 py-2.5 rounded-full shadow-[0_4px_22px_rgba(0,0,0,0.5)] select-none">
            <div className="flex h-8.5 w-8.5 overflow-hidden rounded-full items-center justify-center border border-[#00F5FF]/50 shadow-[0_0_8px_rgba(0,245,255,0.3)] bg-black/60 shrink-0">
              <img 
                src="/src/assets/images/lwach_logo_1781884730926.jpg" 
                alt="Lwach Mini Logo" 
                className="w-full h-full object-cover scale-110"
                referrerPolicy="no-referrer"
              />
            </div>
            {theme === "dark" && (
              <div className="flex flex-col text-left">
                <h1 className="text-sm font-black tracking-tight leading-none uppercase text-white">
                  Lwach <span className="text-[#00F5FF]">Swapping</span>
                </h1>
                <span className="text-[8px] font-mono font-bold text-[#00F5FF]/80 tracking-widest leading-none mt-0.5">
                  ESCROW DIRECTORY
                </span>
              </div>
            )}
          </div>

          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Authenticated User Status Display Only - No list of other selectable accounts */}
            <div className="flex items-center gap-2.5 bg-neutral-950/85 p-2 rounded-full border border-white/5 px-4 shadow-lg select-none">
              <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-[#00F5FF] to-purple-500 flex items-center justify-center text-black text-[10px] font-black uppercase shrink-0">
                {loggedUsername ? loggedUsername.charAt(0) : "U"}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-black text-white leading-none uppercase tracking-wide">
                  {loggedUsername}
                </span>
                <span className="text-[9px] font-mono text-[#00F5FF] neon-accent leading-none mt-0.5 flex items-center gap-1">
                  ★ {currentUser?.rating || "4.8"} | {currentUser?.phone_number || "Verified"}
                </span>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse ml-1 shrink-0"></span>
            </div>

            {/* Language Controls Toggle */}
            <div className="flex gap-0.5 bg-neutral-900 p-0.5 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setLang("en")}
                className={`px-2 py-1 text-[9px] uppercase font-mono font-bold rounded-lg transition duration-200 cursor-pointer ${
                  lang === "en" 
                    ? "bg-[#00F5FF]/20 text-[#00F5FF] border border-[#00F5FF]/10 font-black" 
                    : "text-neutral-400 hover:text-white font-normal bg-transparent"
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang("am")}
                className={`px-2 py-1 text-[9px] uppercase font-mono font-bold rounded-lg transition duration-200 cursor-pointer ${
                  lang === "am" 
                    ? "bg-[#00F5FF]/20 text-[#00F5FF] border border-[#00F5FF]/10 font-black" 
                    : "text-neutral-400 hover:text-white font-normal bg-transparent"
                }`}
              >
                አማ
              </button>
            </div>

            {/* Visual Theme Mode Controls */}
            <div className="flex gap-0.5 bg-neutral-900 p-0.5 rounded-xl border border-white/5">
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`p-1.5 rounded-lg transition duration-200 cursor-pointer ${
                  theme === "dark" 
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/10" 
                    : "text-neutral-400 hover:text-white bg-transparent"
                }`}
                title="Dark Mode"
              >
                <Moon size={11} />
              </button>
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`p-1.5 rounded-lg transition duration-200 cursor-pointer ${
                  theme === "light" 
                    ? "bg-amber-500/20 text-amber-500 border border-amber-500/10" 
                    : "text-neutral-400 hover:text-white bg-transparent"
                }`}
                title="Light Mode"
              >
                <Sun size={11} />
              </button>
            </div>

            {/* Reset button slider */}
            <button
              onClick={handleResetDb}
              className="p-1 px-2 text-neutral-500 hover:text-[#00F5FF] transition cursor-pointer"
              title="Reset Sandbox State"
            >
              <RefreshCw size={13} />
            </button>

            {/* Sign Out Action */}
            <button
              type="button"
              onClick={handleLogout}
              className="px-2.5 py-1.5 text-[9px] uppercase font-mono font-bold rounded-xl transition duration-200 cursor-pointer bg-red-500/20 text-red-400 border border-red-500/10 hover:bg-red-500/35 flex items-center gap-1"
              title="Logout Session"
            >
              <Lock size={10} /> Logout
            </button>
          </div>
        </div>
      </div>

      {/* Simulator accounts setup form overlay */}
      {showCreator && (
        <div className="bg-neutral-900 border-b border-white/5 animate-slide-down">
          <div className="max-w-xl mx-auto p-4 flex flex-col gap-3">
            <h4 className="text-xs font-bold font-mono tracking-wider text-neutral-400 uppercase">
              Configure Custom Simulation Profile
            </h4>
            <form onSubmit={handleCreateUser} className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                required
                placeholder="Full Name (eg. Chala Sissay)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-neutral-950 border border-white/5 text-xs px-3 py-2 rounded-xl outline-none focus:border-[#00F5FF] transition"
              />
              <input
                type="text"
                required
                placeholder="Phone (eg. +2519119933)"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="bg-neutral-950 border border-white/5 text-xs px-3 py-2 rounded-xl outline-none focus:border-[#00F5FF] transition font-mono"
              />
              <button
                type="submit"
                className="bg-[#00F5FF] hover:bg-[#00d7e0] text-black text-xs font-bold px-4 py-2 rounded-xl transition shadow-[0_0_15px_rgba(0,245,255,0.2)]"
              >
                Provision & Authenticate
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Core Dashboard Layout */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-8 flex-grow">
        
        {/* Navigation Tab Header Bar */}
        <div className="flex gap-4 border-b border-white/5 justify-center sm:justify-start pb-4 mb-6">
          <button
            onClick={() => setActiveTab("swipe")}
            className={`flex items-center gap-1.5 pb-2 border-b-2 font-bold text-sm tracking-tight transition duration-300 ${
              activeTab === "swipe" 
                ? "border-[#00F5FF] text-[#00F5FF] neon-accent font-extrabold shadow-[0_2px_10px_-4px_rgba(0,245,255,0.4)]" 
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Compass size={16} /> Swipe Discovery
          </button>
          
          <button
            onClick={() => setActiveTab("listings")}
            className={`flex items-center gap-1.5 pb-2 border-b-2 font-bold text-sm tracking-tight transition duration-300 ${
              activeTab === "listings" 
                ? "border-[#00F5FF] text-[#00F5FF] neon-accent font-extrabold shadow-[0_2px_10px_-4px_rgba(0,245,255,0.4)]" 
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <ShoppingBag size={16} /> My Listings
          </button>

          <button
            onClick={() => setActiveTab("matches")}
            className={`flex items-center gap-1.5 pb-2 border-b-2 font-bold text-sm tracking-tight transition duration-300 ${
              activeTab === "matches" 
                ? "border-[#00F5FF] text-[#00F5FF] neon-accent font-extrabold shadow-[0_2px_10px_-4px_rgba(0,245,255,0.4)]" 
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            <Workflow size={16} /> Matches & Escrow
            {hydratedMatches.length > 0 && (
              <span className="bg-[#00F5FF] text-black rounded-full h-4 w-4 text-[10px] flex items-center justify-center font-black shadow-[0_0_8px_rgba(0,245,255,0.6)]">
                {hydratedMatches.length}
              </span>
            )}
          </button>
        </div>

        {/* Dynamic State Layout Loader */}
        {loading ? (
          <div className="flex flex-col items-center justify-center p-24 text-neutral-500">
            <RefreshCw className="animate-spin mb-2 text-amber-500" size={24} />
            <p className="text-sm">Synchronizing Lwach state directories...</p>
          </div>
        ) : (
          <div>
            {/* Walkthrough hint notice block */}
            {activeTab === "swipe" && activeMyItem?.id === "item-abebe-1" && (
              <div className="max-w-xl mx-auto mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3 flex gap-3 text-left items-start text-xs text-emerald-400">
                <span className="bg-emerald-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 mt-0.5">
                  Walkthrough Tip
                </span>
                <p className="leading-relaxed">
                  You are currently logged in as <strong className="text-white">Abebe</strong>. Swipe <strong>LIKE</strong> on Helena's Fujifilm Camera with your Vintage Leather Jacket to trigger an <strong>instant swap match</strong>! Helena has already liked your jacket under the hood!
                </p>
              </div>
            )}

            {activeTab === "swipe" && (
              <SwipeCard
                candidates={candidates}
                myItems={myItemsList}
                activeMyItem={activeMyItem}
                setActiveMyItem={setActiveMyItem}
                onSwipe={handleSwipeAction}
                acceptDifferentTiers={acceptDifferentTiers}
                setAcceptDifferentTiers={setAcceptDifferentTiers}
                blindBoxMode={blindBoxMode}
                setBlindBoxMode={setBlindBoxMode}
                lang={lang}
              />
            )}

            {activeTab === "listings" && (
              <MyListings
                myItems={myItemsList}
                onCreateItem={handleListItem}
                lang={lang}
              />
            )}

            {activeTab === "matches" && (
              <MatchesSection
                matches={hydratedMatches}
                currentUserId={currentUser?.id || ""}
                onSimulatePayment={handleSimulatePayment}
                onSendMessage={handleSendMessage}
                onUpdateLogistics={handleUpdateLogistics}
                activeMatchId={activeMatchId}
                setActiveMatchId={setActiveMatchId}
                blindBoxMode={blindBoxMode}
                lang={lang}
              />
            )}
          </div>
        )}
      </main>

      {/* 5. GORGEOUS MATCH CELEBRATION MODAL OVERLAY */}
      {showCelebration && celeborateMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-6">
          <div className="glass border border-white/10 rounded-3xl p-8 max-w-md w-full text-center space-y-6 animate-zoom-in relative shadow-[0_0_50px_rgba(0,245,255,0.15)]">
            
            <div className="absolute top-2 right-2">
              <button 
                onClick={() => {
                  setShowCelebration(false);
                  setActiveTab("matches");
                }}
                className="text-neutral-500 hover:text-white font-mono text-xs p-3 transition"
              >
                ✕ Close
              </button>
            </div>

            <div className="relative">
              <div className="w-20 h-20 mx-auto rounded-full bg-[#00F5FF]/15 flex items-center justify-center text-[#00F5FF] border border-[#00F5FF]/30 animate-ping absolute inset-0 z-0"></div>
              <div className="w-20 h-20 mx-auto rounded-full bg-neutral-950 flex items-center justify-center text-[#00F5FF] border border-[#00F5FF]/40 z-10 relative shadow-[0_0_20px_rgba(0,245,255,0.25)]">
                <Sparkle size={36} className="animate-pulse" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono font-bold text-[#00F5FF] uppercase tracking-widest block neon-accent">
                IT'S A MATCH!
              </span>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight">
                Lwach Trading Milestone
              </h3>
              <p className="text-sm text-neutral-400">
                You and your trading partner have mutually liked each other's listings. Settle the escrow lock to open direct live messaging!
              </p>
            </div>

            <div className="bg-neutral-950/80 p-4 rounded-2xl border border-white/5 text-left space-y-1">
              <div className="text-xs font-semibold text-white">
                Offering: {activeMyItem?.title}
              </div>
              <div className="text-xs text-[#00F5FF] font-mono">
                For Match Item
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => {
                  setShowCelebration(false);
                  setActiveTab("matches");
                }}
                className="w-full py-3 bg-[#00F5FF] hover:bg-[#00d7e0] text-black font-extrabold uppercase text-xs tracking-wider rounded-xl transition duration-300 shadow-[0_0_20px_rgba(0,245,255,0.35)]"
              >
                Settle Escrow Lockout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sleek footer section */}
      <footer className="border-t border-neutral-900 py-6 text-center text-xs text-neutral-600 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4 justify-between items-center px-8">
          <span>&copy; 2026 Lwach. All rights reserved Ethiopia.</span>
          <span className="text-neutral-500">
            Escrow Swap Pool Protocol v2.5.0
          </span>
        </div>
      </footer>
    </div>
  );
}
