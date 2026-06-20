import React, { useState, useEffect } from "react";
import { Item, ValueTierId, VALUE_TIERS, ActionType, Swipe } from "../types";
import { 
  Sparkle, 
  HelpCircle, 
  Layers, 
  Coins, 
  Heart, 
  X, 
  Filter, 
  EyeOff, 
  ChevronRight, 
  ChevronLeft,
  Briefcase,
  UserCheck,
  AlertCircle
} from "lucide-react";
import { translations, Language } from "../lib/translations";

interface SwipeCardProps {
  candidates: Item[];
  myItems: Item[];
  activeMyItem: Item | null;
  setActiveMyItem: (item: Item) => void;
  onSwipe: (
    targetItemId: string, 
    action: ActionType, 
    bundles: string[], 
    cashTopup: number
  ) => void;
  acceptDifferentTiers: boolean;
  setAcceptDifferentTiers: (accept: boolean) => void;
  blindBoxMode: boolean;
  setBlindBoxMode: (blind: boolean) => void;
  lang: Language;
}

export default function SwipeCard({
  candidates,
  myItems,
  activeMyItem,
  setActiveMyItem,
  onSwipe,
  acceptDifferentTiers,
  setAcceptDifferentTiers,
  blindBoxMode,
  setBlindBoxMode,
  lang
}: SwipeCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "clothing" | "shoe" | "accessories" | "other">("all");
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  
  // Custom offer modifiers
  const [selectedBundleItemIds, setSelectedBundleItemIds] = useState<string[]>([]);
  const [cashTopupAmount, setCashTopupAmount] = useState<number>(0);
  const [showOfferCustomizer, setShowOfferCustomizer] = useState(false);

  const t = translations[lang];

  // Candidates filtered by category
  const filteredCandidates = candidates.filter(item => {
    if (selectedCategory === "all") return true;
    return item.category === selectedCategory;
  });

  // Keep index within bounds of filtered items
  useEffect(() => {
    setCurrentIndex(0);
    resetModifiers();
    setIsDescExpanded(false);
  }, [selectedCategory, candidates.length]);

  const activeCandidate = filteredCandidates[currentIndex];

  const handleNext = () => {
    if (filteredCandidates.length > 0) {
      setCurrentIndex((prev) => (prev + 1) % filteredCandidates.length);
    }
    resetModifiers();
    setIsDescExpanded(false);
  };

  const handlePrev = () => {
    if (filteredCandidates.length > 0) {
      setCurrentIndex((prev) => (prev === 0 ? filteredCandidates.length - 1 : prev - 1));
    }
    resetModifiers();
    setIsDescExpanded(false);
  };

  const resetModifiers = () => {
    setSelectedBundleItemIds([]);
    setCashTopupAmount(0);
    setShowOfferCustomizer(false);
  };

  const performSwipe = (action: ActionType) => {
    if (!activeCandidate || !activeMyItem) return;
    onSwipe(
      activeCandidate.id, 
      action, 
      action === ActionType.LIKE ? selectedBundleItemIds : [], 
      action === ActionType.LIKE ? cashTopupAmount : 0
    );
    // Move to next card
    if (filteredCandidates.length > 1) {
      if (currentIndex === filteredCandidates.length - 1) {
        setCurrentIndex(0);
      }
      resetModifiers();
      setIsDescExpanded(false);
    }
  };

  const toggleBundleItem = (id: string) => {
    setSelectedBundleItemIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Filter out the active swiper item from bundle choices
  const bundleChoices = myItems.filter(item => item.id !== activeMyItem?.id);

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col gap-4" id="swipe-discovery-section">
      
      {/* 1. Header Control Panel: Choose your offer item */}
      <div className="glass border border-white/5 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl backdrop-blur-md">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-[#00F5FF] animate-pulse"></span>
            <label className="text-xs font-mono font-medium text-neutral-400 uppercase tracking-wider">
              {t.tradingItem}
            </label>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-[#00F5FF]/15 text-[#00F5FF] border border-[#00F5FF]/20 mt-0.5 font-mono">
            {t.activeSwap}
          </span>
        </div>

        {myItems.length === 0 ? (
          <div className="p-3 bg-neutral-950/80 rounded-xl border border-dashed border-white/10 text-center text-sm text-neutral-400">
            {t.noListingsWarning}
          </div>
        ) : (
          <div className="flex gap-2 items-center">
            <select
              id="active-my-item-select"
              value={activeMyItem?.id || ""}
              onChange={(e) => {
                const selected = myItems.find(item => item.id === e.target.value);
                if (selected) {
                  setActiveMyItem(selected);
                  resetModifiers();
                  setCurrentIndex(0);
                }
              }}
              className="w-full bg-[#0A0A0B]/80 border border-white/5 outline-none text-white text-sm px-3 py-2.5 rounded-xl cursor-pointer focus:border-[#00F5FF] transition duration-300"
            >
              {myItems.map((item) => (
                <option key={item.id} value={item.id} className="bg-[#0A0A0B] text-white">
                  {item.title} ({VALUE_TIERS[item.value_tier]?.rangeLabel})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 2. Swiper constraints setup */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5 text-xs">
          <button
            onClick={() => setAcceptDifferentTiers(!acceptDifferentTiers)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition duration-300 cursor-pointer ${
              acceptDifferentTiers 
                ? "bg-[#00F5FF]/15 border-[#00F5FF]/30 text-[#00F5FF]" 
                : "bg-neutral-950/80 border-white/5 text-neutral-400 hover:text-white"
            }`}
          >
            <Filter size={13} />
            {acceptDifferentTiers ? t.recExploreAll : t.recSameTier}
          </button>

          <button
            onClick={() => setBlindBoxMode(!blindBoxMode)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition duration-300 cursor-pointer ${
              blindBoxMode 
                ? "bg-purple-500/15 border-purple-500/30 text-purple-400" 
                : "bg-neutral-950/80 border-white/5 text-neutral-400 hover:text-white"
            }`}
          >
            <EyeOff size={13} />
            {blindBoxMode ? t.modeBlindOn : t.modeNormal}
          </button>
        </div>
      </div>

      {/* 3. Segmented Navigation Bar for CATEGORIES Filtering */}
      <div className="flex bg-neutral-950/80 p-1 border border-white/5 rounded-2xl gap-1 shadow-md">
        {(["all", "clothing", "shoe", "accessories"] as const).map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-1 py-2 text-center text-xs font-bold rounded-xl transition duration-300 cursor-pointer ${
                isActive 
                  ? "bg-[#00F5FF]/10 text-[#00F5FF] font-extrabold border border-[#00F5FF]/15 shadow-sm" 
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {cat === "all" ? t.catAll :
               cat === "clothing" ? t.catClothing.split(" ")[0] :
               cat === "shoe" ? t.catShoe.split(" ")[0] : t.catAccessories.split(" ")[0]}
            </button>
          );
        })}
      </div>

      {/* 4. Swiper card Deck context */}
      {!activeMyItem ? (
        <div className="glass border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center gap-3">
          <Briefcase size={40} className="text-neutral-600 mb-2" />
          <h3 className="text-lg font-bold text-white">{t.createActiveListing}</h3>
          <p className="text-sm text-neutral-400 max-w-sm">
            {t.createActiveListingDesc}
          </p>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="glass border border-white/5 rounded-3xl p-12 text-center flex flex-col items-center gap-4 shadow-xl">
          <Sparkle size={48} className="text-[#00F5FF] animate-spin-slow mb-1 neon-accent" />
          <h3 className="text-lg font-bold text-white">
            {lang === "en" ? "No Items in this Category" : "በዚህ ዘርፍ ፈጽሞ እቃዎች የሉም"}
          </h3>
          <p className="text-sm text-neutral-400 max-w-md">
            {lang === "en" 
              ? `There are currently no items matching the "${selectedCategory}" category in your recommended tier. Try selecting "All Items" or explore different levels.`
              : `በተመረጠው የዋጋ ደረጃ ውስጥ "${selectedCategory === "all" ? "ሁሉንም እቃዎች" : selectedCategory === "clothing" ? "ልብስ" : selectedCategory === "shoe" ? "ጫማ" : "አክሰሰሪዎች"} " ዘርፍ ውስጥ እቃ አልተገኘም። እባክዎ "ሁሉንም እቃዎች" መርጠው ይፈልጉ!`}
          </p>
        </div>
      ) : (
        <div className="relative flex flex-col gap-4">
          
          {/* Main Swiper Deck Layout */}
          <div className="relative glass rounded-3xl overflow-hidden border border-white/5 shadow-2xl flex flex-col justify-between group min-h-[460px] backdrop-blur-md">
            
            {/* Value Tier Tag overlay */}
            <div className="absolute top-4 left-4 z-15 flex gap-2">
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-black/75 backdrop-blur-md text-[#00F5FF] border border-[#00F5FF]/35 font-mono shadow-md neon-accent">
                {lang === "en" ? VALUE_TIERS[activeCandidate.value_tier]?.name : (
                  activeCandidate.value_tier === ValueTierId.TIER_1 ? "ዝቅተኛ ዋጋ" :
                  activeCandidate.value_tier === ValueTierId.TIER_2 ? "መካከለኛ ዋጋ" :
                  activeCandidate.value_tier === ValueTierId.TIER_3 ? "ከፍተኛ ዋጋ" : "የቅንጦት ዋጋ"
                )}
              </span>
              
              {blindBoxMode && (
                <span className="px-3 py-1 text-xs font-bold rounded-full bg-purple-500/80 backdrop-blur-md text-white border border-purple-400 shadow-md flex items-center gap-1">
                  <EyeOff size={11} /> Mystery
                </span>
              )}
            </div>

            {/* Pagination Controls */}
            <div className="absolute top-4 right-4 z-15 flex gap-1.5 font-sans">
              <button 
                onClick={handlePrev} 
                className="p-1.5 rounded-full bg-black/75 hover:bg-black/90 text-neutral-400 hover:text-white transition shadow-md cursor-pointer"
                title="Previous"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs bg-black/75 text-neutral-300 font-mono px-2 py-1.5 rounded-full flex items-center justify-center min-w-[44px] shadow-md">
                {currentIndex + 1} / {filteredCandidates.length}
              </span>
              <button 
                onClick={handleNext} 
                className="p-1.5 rounded-full bg-black/75 hover:bg-black/90 text-neutral-400 hover:text-white transition shadow-md cursor-pointer"
                title="Next"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Item Image Component with Blind Box filter */}
            <div className="relative w-full h-64 overflow-hidden bg-[#0A0A0B]">
              {blindBoxMode ? (
                <div className="relative w-full h-full flex flex-col items-center justify-center select-none bg-radial from-purple-950/40 to-neutral-950">
                  <div className="absolute inset-0 bg-cover bg-center blur-2xl opacity-30 select-none scale-110" style={{ backgroundImage: `url(${activeCandidate.images[0]})` }}></div>
                  
                  {/* Mystery container illustration */}
                  <div className="relative flex flex-col items-center gap-3 text-center z-10 p-6 animate-pulse">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center shadow-lg border border-purple-400/40">
                      <HelpCircle size={40} className="text-white" />
                    </div>
                    <div>
                      <span className="text-purple-400/80 text-xs font-bold uppercase tracking-widest font-mono">Lwach Blindbox</span>
                      <h4 className="text-neutral-200 text-sm font-semibold mt-0.5">
                        {lang === "en" ? "Image Revealed After Swap Match" : "ምስሉ የሚከፈተው እቃ ስትገጣጠሙ ነው"}
                      </h4>
                    </div>
                  </div>
                </div>
              ) : (
                <img 
                  src={activeCandidate.images[0]} 
                  alt={activeCandidate.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Description & Details Info */}
            <div className="p-6 flex flex-col flex-grow justify-between gap-4">
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-4">
                  <h3 className="text-xl font-bold font-sans text-white tracking-tight leading-snug">
                    {activeCandidate.title}
                  </h3>
                </div>
                <p className="text-xs font-mono font-medium text-[#00F5FF] uppercase tracking-widest neon-accent mt-0.5">
                  {t.estimatedRange}: {VALUE_TIERS[activeCandidate.value_tier]?.rangeLabel}
                </p>
                
                {/* Collapsible Expandable description block */}
                <div>
                  <p className={`text-sm text-neutral-300 font-sans leading-relaxed ${isDescExpanded ? "" : "line-clamp-2"}`}>
                    {activeCandidate.description}
                  </p>
                  {activeCandidate.description.length > 80 && (
                    <button
                      onClick={() => setIsDescExpanded(!isDescExpanded)}
                      className="text-xs text-[#00F5FF] font-mono font-bold hover:underline mt-1 focus:outline-none cursor-pointer uppercase tracking-wider block"
                    >
                      {isDescExpanded ? `▲ ${t.seeLess}` : `▼ ${t.seeMore}`}
                    </button>
                  )}
                </div>
              </div>

              {/* Match modifier indicators if present */}
              {(selectedBundleItemIds.length > 0 || cashTopupAmount !== 0) && (
                <div className="bg-[#00F5FF]/5 border border-[#00F5FF]/15 rounded-xl p-3 flex flex-col gap-1.5 mt-2 animate-fade-in text-xs text-[#00F5FF]">
                  <span className="font-semibold uppercase tracking-wider text-[10px] text-[#00F5FF] font-mono neon-accent">
                    {lang === "en" ? "YOUR SWAP OFFER AMENDMENTS:" : "ያቀረቡት ጭማሪ ማስተካከያ፦"}
                  </span>
                  <div className="flex flex-col gap-1 font-sans text-neutral-300">
                    {selectedBundleItemIds.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Layers size={11} className="text-[#00F5FF]" /> <strong>{lang === "en" ? "Bundled Items" : "የደረቡት እቃ"} ({selectedBundleItemIds.length}):</strong>{" "}
                        {selectedBundleItemIds.map(id => bundleChoices.find(b => b.id === id)?.title).join(", ")}
                      </span>
                    )}
                    {cashTopupAmount !== 0 && (
                      <span className="flex items-center gap-1">
                        <Coins size={11} className="text-[#00F5FF]" /> <strong>{lang === "en" ? "Cash topup" : "የገንዘብ ጭማሪ"}፡</strong>{" "}
                        {cashTopupAmount > 0 
                          ? (lang === "en" ? `+ ${cashTopupAmount} Birr (You Pay)` : `+ ${cashTopupAmount} ብር (እርስዎ የሚከፍሉት)`) 
                          : (lang === "en" ? `${Math.abs(cashTopupAmount)} Birr (You Request)` : `${Math.abs(cashTopupAmount)} ብር (ለእርስዎ የሚከፈል)`)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Offer customization buttons */}
              <div className="pt-2 border-t border-white/5 flex justify-between items-center text-xs">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowOfferCustomizer(!showOfferCustomizer)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 text-neutral-300 hover:text-white hover:bg-white/10 transition duration-300 cursor-pointer"
                  >
                    <Layers size={13} className="text-[#00F5FF] neon-accent" />
                    {t.bundleCashButton}
                  </button>
                </div>
                
                {activeMyItem.value_tier !== activeCandidate.value_tier && (
                  <div className="flex items-center gap-1 text-[#00F5FF] bg-[#00F5FF]/5 border border-[#00F5FF]/20 px-2 py-1 rounded-md text-[10px] font-mono shadow-[0_0_8px_rgba(0,245,255,0.1)]">
                    <AlertCircle size={10} /> {t.swapDisparity}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bundle & Cash Customizer panel drawer style */}
          {showOfferCustomizer && (
            <div className="glass border border-[#00F5FF]/10 rounded-2xl p-4 shrink-0 transition-all duration-300 shadow-2xl animate-fade-in flex flex-col gap-4 bg-[#0A0A0B]/90 backdrop-blur-md">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Layers size={14} className="text-[#00F5FF] neon-accent" /> {t.bundleCashTitle}
                </h4>
                <button 
                  onClick={() => setShowOfferCustomizer(false)}
                  className="text-neutral-500 hover:text-white text-xs font-mono transition cursor-pointer"
                >
                  {t.closeBtn}
                </button>
              </div>

              {/* Multi item bundling selection list */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-300 flex items-center gap-1">
                  {t.bundleLabel}
                </label>
                {bundleChoices.length === 0 ? (
                  <p className="text-xs text-neutral-500 italic bg-[#0A0A0B] p-2.5 rounded-lg border border-white/5">
                    {t.noOtherListings}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 max-h-24 overflow-y-auto pr-1">
                    {bundleChoices.map(item => {
                      const selected = selectedBundleItemIds.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleBundleItem(item.id)}
                          className={`flex items-center gap-2 p-2 rounded-xl text-left border transition text-xs cursor-pointer ${
                            selected 
                              ? "bg-[#00F5FF]/10 border-[#00F5FF]/30 text-white animate-pulse font-bold" 
                              : "bg-[#0A0A0B]/80 border-white/5 text-neutral-400 hover:border-neutral-700 hover:text-white"
                          }`}
                        >
                          <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${selected ? "bg-[#00F5FF] border-[#00F5FF]" : "border-white/10"}`}>
                            {selected && <div className="w-1.5 h-1.5 bg-black rounded-xs"></div>}
                          </span>
                          <span className="truncate">{item.title}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Cash Topup modifier */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-neutral-300 flex justify-between">
                  <span>{t.cashTopupCompensation}</span>
                  <span className="text-[#00F5FF] font-mono text-[10px] neon-accent font-bold">
                    {cashTopupAmount > 0 ? t.cashTopupYouPay : cashTopupAmount < 0 ? t.cashTopupYouDemand : t.cashTopupNone}
                  </span>
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={cashTopupAmount || ""}
                    onChange={(e) => setCashTopupAmount(parseInt(e.target.value) || 0)}
                    placeholder="E.g. 500 or -300"
                    className="w-full bg-[#0A0A0B]/80 border border-white/5 px-3 py-2 rounded-xl outline-none focus:border-[#00F5FF] text-sm text-white font-mono transition duration-300"
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => setCashTopupAmount(500)}
                      className="px-2.5 py-2 text-xs font-mono bg-[#0A0A0B]/80 hover:bg-neutral-800 text-neutral-300 border border-white/5 rounded-lg transition duration-300 cursor-pointer text-white"
                    >
                      +500
                    </button>
                    <button
                      onClick={() => setCashTopupAmount(-500)}
                      className="px-2.5 py-2 text-xs font-mono bg-[#0A0A0B]/80 hover:bg-neutral-800 text-neutral-300 border border-white/5 rounded-lg transition duration-300 cursor-pointer text-white"
                    >
                      -500
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. Action Swipe Buttons */}
          <div className="flex items-center justify-center gap-4 mt-1 font-sans">
            <button
              onClick={() => performSwipe(ActionType.DISLIKE)}
              className="group flex h-14 w-14 items-center justify-center rounded-full bg-neutral-950/80 border border-white/5 hover:bg-neutral-900 text-neutral-400 hover:text-red-500 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-neutral-950/20 cursor-pointer"
              title={t.dislikeTitle}
            >
              <X size={24} className="transition-transform group-hover:rotate-12" />
            </button>

            <button
              onClick={() => performSwipe(ActionType.LIKE)}
              className="group flex h-16 w-44 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#00F5FF] to-[#0188bb] hover:from-[#00F5FF]/95 font-black uppercase text-xs tracking-wider text-black transition-all duration-300 hover:scale-105 active:scale-95 shadow-2xl shadow-[#00F5FF]/20 cursor-pointer"
              title={t.proposeSwap}
            >
              <Heart size={16} fill="currentColor" />
              {t.proposeSwap}
            </button>

            <div className="h-10 w-px bg-white/5"></div>

            <button
              onClick={handleNext}
              className="text-xs hover:text-white text-neutral-400 font-bold py-2 px-3 hover:bg-white/5 rounded-xl border border-white/5 transition cursor-pointer"
              title={t.skipItem}
            >
              {lang === "en" ? "Skip" : "ማለፊያ"}
            </button>
          </div>

          <div className="text-center">
            <p className="text-[11px] font-sans text-neutral-500">
              {t.swipeDisclaimer}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
