import React, { useState } from "react";
import { Item, ValueTierId, VALUE_TIERS } from "../types";
import { PlusCircle, ShoppingBag, Eye, Trash, Info, Camera } from "lucide-react";

import { translations, Language } from "../lib/translations";

interface MyListingsProps {
  myItems: Item[];
  lang: Language;
  onCreateItem: (data: {
    title: string;
    description: string;
    value_tier: ValueTierId;
    images: string[];
    category: "clothing" | "shoe" | "accessories" | "other";
  }) => void;
  onDeleteItem?: (id: string) => void; // Optional extension
}

const IMAGE_PRESETS_OPTIONS = [
  { id: "gadget-watch", label: "Smartwatch/Tech", url: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&auto=format&fit=crop&q=80" },
  { id: "fashion-apparel", label: "Fashion Jackets", url: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=500&auto=format&fit=crop&q=80" },
  { id: "shoe-sneaker", label: "Sneakers/Footwear", url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=80" },
  { id: "home-decor", label: "Home Decor/Warm", url: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=500&auto=format&fit=crop&q=80" },
  { id: "misc-perfume", label: "Aesthetic Gear", url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=80" },
  { id: "vintage-guitar", label: "Instruments/Gear", url: "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=500&auto=format&fit=crop&q=80" }
];

export default function MyListings({ myItems, lang, onCreateItem }: MyListingsProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [valueTier, setValueTier] = useState<ValueTierId>(ValueTierId.TIER_2);
  const [category, setCategory] = useState<"clothing" | "shoe" | "accessories" | "other">("clothing");
  const [selectedPresetUrl, setSelectedPresetUrl] = useState(IMAGE_PRESETS_OPTIONS[0].url);
  const [customImageUrl, setCustomImageUrl] = useState("");

  const t = translations[lang];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    const finalImage = customImageUrl.trim() ? customImageUrl.trim() : selectedPresetUrl;
    onCreateItem({
      title,
      description,
      value_tier: valueTier,
      images: [finalImage],
      category
    });

    // Reset Form state
    setTitle("");
    setDescription("");
    setValueTier(ValueTierId.TIER_2);
    setCategory("clothing");
    setCustomImageUrl("");
    setShowForm(false);
  };

  return (
    <div className="w-full flex flex-col gap-6" id="my-listings-tab">
      
      {/* 1. Header with create toggle button */}
      <div className="flex justify-between items-center glass border border-white/5 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
        <div className="flex gap-2.5 items-center">
          <div className="p-2.5 bg-[#00F5FF]/10 rounded-xl text-[#00F5FF]">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">{t.myCatalogTitle}</h3>
            <p className="text-xs text-neutral-400 font-mono italic">
              {lang === "en" ? `Currently listing: ${myItems.length} items` : `በአሁኑ ሰዓት ያስመዘገቡት፡ ${myItems.length} እቃዎች`}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition duration-300 shadow cursor-pointer ${
            showForm 
              ? "bg-[#0A0A0B] border border-white/10 text-white hover:bg-[#0A0A0B]/85" 
              : "bg-[#00F5FF] text-black shadow-[0_0_15px_rgba(0,245,255,0.3)] hover:brightness-105"
          }`}
        >
          <PlusCircle size={15} />
          {showForm ? (lang === "en" ? "View Inventory" : "እቃዎቼን አሳይ") : t.addNewItemBtn}
        </button>
      </div>

      {/* 2. Listing submission Form */}
      {showForm ? (
        <form 
          onSubmit={handleSubmit} 
          className="glass border border-white/5 rounded-3xl p-6 shadow-2xl space-y-5 animate-fade-in"
          id="item-listing-form"
        >
          <div className="border-b border-white/5 pb-3">
            <h4 className="font-bold text-lg text-white">
              {lang === "en" ? "Create a New Lwach Swap Listing" : "አዲስ የልውውጥ እቃ ያስመዝግቡ"}
            </h4>
            <p className="text-xs text-neutral-400 mt-1">
              {lang === "en" ? "Provide fair value tier indicators. Fair tiering safeguards trust and keeps escrow matching fast!" : "ትክክለኛ ግምታዊ ዋጋ ደረጃ በመምረጥ ልውውጦችን የተሳለጠ ያድርጉ!"}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300 uppercase tracking-widest font-mono">
              {lang === "en" ? "Item Title" : "የእቃው ስም (Title)"}
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t.newItemTitlePlaceholder}
              className="w-full bg-[#0A0A0B]/80 border border-white/5 px-4 py-3 rounded-xl outline-none text-sm text-white focus:border-[#00F5FF] transition duration-300"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300 uppercase tracking-widest font-mono">
              {t.newItemPriceTier}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(Object.keys(VALUE_TIERS) as unknown as ValueTierId[]).map((tierIdStr) => {
                const tierId = Number(tierIdStr) as ValueTierId;
                const tier = VALUE_TIERS[tierId];
                const active = valueTier === tierId;
                return (
                  <button
                    key={tierId}
                    type="button"
                    onClick={() => setValueTier(tierId)}
                    className={`flex flex-col gap-0.5 p-3 rounded-xl text-left border transition duration-300 cursor-pointer ${
                      active 
                        ? "bg-[#00F5FF]/10 border-[#00F5FF]/30 text-white" 
                        : "bg-[#0A0A0B]/50 border-white/5 text-neutral-400 hover:border-white/10"
                    }`}
                  >
                    <span className="text-xs font-bold text-white flex items-center justify-between">
                      {lang === "en" ? tier.name : (
                        tierId === ValueTierId.TIER_1 ? "ደረጃ 1: ዝቅተኛ" :
                        tierId === ValueTierId.TIER_2 ? "ደረጃ 2: መካከለኛ" :
                        tierId === ValueTierId.TIER_3 ? "ደረጃ 3: ከፍተኛ" : "ደረጃ 4: የቅንጦት"
                      )}
                      {active && <span className="h-1.5 w-1.5 bg-[#00F5FF] rounded-full shadow-[0_0_8px_rgba(0,245,255,0.8)]"></span>}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400">{t.tierRange}: {tier.rangeLabel}</span>
                    <span className="text-[10px] font-mono text-emerald-400 mt-0.5 font-semibold">
                      {lang === "en" ? `Escrow Fee: ${tier.feeBirr} Birr` : `የመያዣ ክፍያ: ${tier.feeBirr} ብር`}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* New Item Category Dropdown Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300 uppercase tracking-widest font-mono">
              {t.newItemCatLabel}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full bg-[#0A0A0B]/80 border border-white/5 px-4 py-3 rounded-xl outline-none text-sm text-white focus:border-[#00F5FF] transition duration-300 cursor-pointer"
            >
              <option value="clothing" className="bg-[#0A0A0B] text-white">{t.catClothing}</option>
              <option value="shoe" className="bg-[#0A0A0B] text-white">{t.catShoe}</option>
              <option value="accessories" className="bg-[#0A0A0B] text-white">{t.catAccessories}</option>
              <option value="other" className="bg-[#0A0A0B] text-white">{t.catOther}</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-neutral-300 uppercase tracking-widest font-mono">
              {lang === "en" ? "Item Description & Wants" : "የእቃው ዝርዝር መግለጫ እና የሚፈልጉት ነገር"}
            </label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.newItemDescPlaceholder}
              rows={3}
              className="w-full bg-[#0A0A0B]/80 border border-white/5 px-4 py-3 rounded-xl outline-none text-sm text-white focus:border-[#00F5FF] transition resize-none leading-relaxed duration-300"
            />
          </div>

          {/* Picture Selector Presets */}
          <div className="space-y-3">
            <label className="text-xs font-medium text-neutral-300 uppercase tracking-widest font-mono block">
              {lang === "en" ? "Choose Product Image" : "የእቃው ምስል ይምረጡ"}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {IMAGE_PRESETS_OPTIONS.map((opt) => {
                const isSelected = selectedPresetUrl === opt.url && !customImageUrl;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setSelectedPresetUrl(opt.url);
                      setCustomImageUrl("");
                    }}
                    className={`relative rounded-xl overflow-hidden border-2 h-14 bg-neutral-950 hover:opacity-95 transition duration-300 cursor-pointer ${
                      isSelected ? "border-[#00F5FF] scale-95 shadow-[0_0_15px_rgba(0,245,255,0.25)]" : "border-white/5"
                    }`}
                  >
                    <img src={opt.url} alt={opt.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <span className="absolute inset-x-0 bottom-0 text-[8px] bg-black/80 font-semibold py-0.5 text-center truncate text-white">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-mono text-neutral-400">
                {lang === "en" ? "Or provide public Image URL:" : "ወይም የእቃውን ምስል ሊንክ ያስገቡ፡"}
              </span>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/your-custom-item"
                  className="w-full bg-[#0A0A0B]/80 border border-white/5 px-3 py-2 rounded-xl outline-none text-xs text-white focus:border-[#00F5FF] transition font-mono duration-300"
                />
              </div>
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-3 border-t border-white/5 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#00F5FF] hover:bg-[#00d7e0] text-black font-extrabold text-sm tracking-wide shadow-xl shadow-[#00F5FF]/15 transition duration-300 cursor-pointer"
            >
              {t.saveListingBtn}
            </button>
          </div>
        </form>
      ) : (
        /* 3. Listed items preview grid */
        <div className="flex flex-col gap-4">
          <h4 className="font-bold text-xs font-mono text-neutral-400 uppercase tracking-widest border-b border-white/5 pb-2">
            {t.yourPostings}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="listings-grid-view">
            {myItems.length === 0 ? (
              <div className="col-span-1 md:col-span-2 glass border border-white/5 rounded-3xl p-12 text-center text-neutral-400 flex flex-col items-center gap-3">
                <ShoppingBag size={32} className="text-neutral-700 mb-1" />
                <p className="text-sm font-medium">{t.emptyCatalog}</p>
                <p className="text-xs text-neutral-500 max-w-xs">
                  {t.emptyCatalogSub}
                </p>
              </div>
            ) : (
              myItems.map((item) => (
                <div 
                  key={item.id}
                  className="glass border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-white/20 transition duration-300"
                >
                  <div className="h-44 bg-[#0A0A0B] relative">
                    <img 
                      src={item.images[0]} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2 flex gap-1">
                      <span className="px-2 py-0.5 text-[9px] font-bold font-mono rounded-full bg-black/80 text-[#00F5FF] border border-[#00F5FF]/30 neon-accent">
                        {lang === "en" ? VALUE_TIERS[item.value_tier]?.name : (
                          item.value_tier === ValueTierId.TIER_1 ? "ዝቅተኛ" :
                          item.value_tier === ValueTierId.TIER_2 ? "መካከለኛ" :
                          item.value_tier === ValueTierId.TIER_3 ? "ከፍተኛ" : "የቅንጦት"
                        )}
                      </span>
                      {item.category && (
                        <span className="px-2 py-0.5 text-[9px] font-bold font-mono rounded-full bg-black/80 text-neutral-300 border border-white/10 uppercase">
                          {item.category === "clothing" ? t.catClothing.split(" ")[0] :
                           item.category === "shoe" ? t.catShoe.split(" ")[0] :
                           item.category === "accessories" ? t.catAccessories.split(" ")[0] : t.catOther.split(" ")[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-4 flex flex-col gap-2">
                    <h4 className="font-bold text-white text-sm truncate leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-neutral-400 font-sans line-clamp-2">
                      {item.description}
                    </p>
                    
                    <div className="pt-2.5 border-t border-white/5 flex justify-between items-center text-[10px] font-mono text-neutral-500">
                      <span>{t.tierRange}: {VALUE_TIERS[item.value_tier]?.rangeLabel}</span>
                      <span className="text-[#00F5FF] font-semibold">{lang === "en" ? "Active Listing" : "ንቁ ልውውጥ"}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
