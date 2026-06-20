import React, { useState, useEffect, useRef } from "react";
import { Match, VALUE_TIERS, Message, LogisticsChecklist } from "../types";
import { 
  Lock, 
  Unlock, 
  Send, 
  MessageSquare, 
  Compass, 
  MapPin, 
  Truck, 
  CheckSquare, 
  Square,
  ShieldAlert, 
  Smartphone, 
  AlertCircle,
  HelpCircle,
  Clock,
  ExternalLink,
  Coins,
  Layers
} from "lucide-react";
import { translations, Language } from "../lib/translations";
import { db, collection, query, where, orderBy, onSnapshot, doc, setDoc } from "../lib/firebase";

interface MatchesSectionProps {
  matches: any[]; // Hydrated matches from server API
  currentUserId: string;
  onSimulatePayment: (matchId: string, party: "A" | "B") => void;
  onSendMessage: (matchId: string, content: string) => Promise<void>;
  onUpdateLogistics: (matchId: string, data: Partial<LogisticsChecklist>) => void;
  activeMatchId: string | null;
  setActiveMatchId: (id: string | null) => void;
  blindBoxMode: boolean;
  lang: Language;
}

export default function MatchesSection({
  matches,
  currentUserId,
  onSimulatePayment,
  onSendMessage,
  onUpdateLogistics,
  activeMatchId,
  setActiveMatchId,
  blindBoxMode,
  lang
}: MatchesSectionProps) {
  const [selectedPaymentGateway, setSelectedPaymentGateway] = useState<"telebirr" | "cbe" | "bank" | "card">("telebirr");
  const [localChatMessage, setLocalChatMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const t = translations[lang];

  const activeMatch = matches.find((m) => m.id === activeMatchId);

  // Fetch chat messages continuously if match is selected and unlocked
  useEffect(() => {
    if (!activeMatchId || !activeMatch || !activeMatch.is_unlocked) {
      setMessages([]);
      return;
    }

    const q = query(
      collection(db, "messages"),
      where("match_id", "==", activeMatchId),
      orderBy("created_at", "asc")
    );

    const unsub = onSnapshot(q, (snapshot: any) => {
      const msgList: Message[] = [];
      snapshot.forEach((docSnap: any) => {
        msgList.push({ id: docSnap.id, ...docSnap.data() } as Message);
      });
      setMessages(msgList);
    }, (err: any) => {
      console.error("Firebase Chat realtime sub error:", err);
    });

    return () => unsub();
  }, [activeMatchId, activeMatch?.is_unlocked]);

  // Scroll to chat bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!localChatMessage.trim() || !activeMatchId) return;

    const textToSend = localChatMessage;
    setLocalChatMessage("");
    await onSendMessage(activeMatchId, textToSend);

    // Simulated response from peer user
    setTimeout(async () => {
      try {
        const peerResponses = [
          "Super excited to unlock this swap! The details look perfect.",
          "Where would you prefer to meetup? Bole Medhanialem works great for me.",
          "Both listings are locked in. Should we use Deliver Addis courier or exchange in person?",
          "Lwach escrow verified perfectly. Let's complete the logistics checklist!",
        ];
        const randomMsg = peerResponses[Math.floor(Math.random() * peerResponses.length)];
        
        const isUserA = currentUserId === activeMatch.itemA.user_id;
        const peerUserId = isUserA ? activeMatch.userB.id : activeMatch.userA.id;

        const msgId = "peer-msg-" + Math.random().toString(36).substring(2, 9);
        await setDoc(doc(db, "messages", msgId), {
          id: msgId,
          match_id: activeMatchId,
          sender_id: peerUserId,
          content: randomMsg,
          created_at: new Date().toISOString()
        });
      } catch (err) {
        console.error("Simulated peer reply post error:", err);
      }
    }, 1500);
  };

  const isUserPartyA = activeMatch ? (activeMatch.itemA.user_id === currentUserId) : false;
  const myItem = activeMatch ? (isUserPartyA ? activeMatch.itemA : activeMatch.itemB) : null;
  const targetItem = activeMatch ? (isUserPartyA ? activeMatch.itemB : activeMatch.itemA) : null;
  const myUser = activeMatch ? (isUserPartyA ? activeMatch.userA : activeMatch.userB) : null;
  const targetUser = activeMatch ? (isUserPartyA ? activeMatch.userB : activeMatch.userA) : null;
  
  const myPaidStatus = activeMatch ? (isUserPartyA ? activeMatch.party_a_paid : activeMatch.party_b_paid) : false;
  const targetPaidStatus = activeMatch ? (isUserPartyA ? activeMatch.party_b_paid : activeMatch.party_a_paid) : false;

  const currentTier = activeMatch ? VALUE_TIERS[targetItem?.value_tier as number] : null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="matches-section-view">
      
      {/* 1. Matches list sidebar (on left) */}
      <div className="glass border border-white/5 rounded-3xl p-4 flex flex-col gap-3 h-[580px] overflow-y-auto shadow-2xl backdrop-blur-md">
        <h3 className="font-bold text-base text-white border-b border-white/5 pb-2 flex items-center gap-2">
          <span className="p-1 px-2.2 text-xs font-mono font-black bg-[#00F5FF] text-black rounded-lg shadow-[0_0_8px_rgba(0,245,255,0.6)]">
            {matches.length}
          </span>
          {lang === "en" ? "Matches on Lwach" : "የልውውጥ ስምምነቶች (Matches)"}
        </h3>

        {matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-neutral-500 h-full">
            <Compass size={36} className="text-neutral-700 mb-2 animate-pulse" />
            <p className="text-sm font-semibold">{t.noMatchesTitle}</p>
            <p className="text-[11px] text-neutral-600 max-w-xs mt-1 leading-relaxed">
              {t.noMatchesSub}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {matches.map((m) => {
              const userIsPartyA = m.itemA.user_id === currentUserId;
              const sideMyItem = userIsPartyA ? m.itemA : m.itemB;
              const sideTargetItem = userIsPartyA ? m.itemB : m.itemA;
              const sideTargetUser = userIsPartyA ? m.userB : m.userA;
              const isSelected = m.id === activeMatchId;

              return (
                <button
                  key={m.id}
                  onClick={() => setActiveMatchId(m.id)}
                  className={`flex gap-3 text-left p-3 rounded-2xl border transition duration-300 cursor-pointer ${
                    isSelected 
                      ? "bg-[#00F5FF]/10 border-[#00F5FF]/40 shadow-[0_0_15px_rgba(0,245,255,0.05)]" 
                      : "bg-[#0A0A0B]/60 border-white/5 hover:bg-white/5"
                  }`}
                >
                  <div className="h-12 w-12 rounded-xl overflow-hidden bg-[#0A0A0B] relative shrink-0">
                    <img 
                      src={sideTargetItem.images[0]} 
                      alt={sideTargetItem.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {!m.is_unlocked && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[#00F5FF]">
                        <Lock size={12} className="neon-accent animate-pulse" />
                      </div>
                    )}
                  </div>

                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-xs truncate text-white leading-tight">
                        {sideTargetItem.title}
                      </h4>
                      <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold ${
                        m.is_unlocked ? "bg-emerald-500/10 text-emerald-400" : "bg-[#00F5FF]/10 text-[#00F5FF] neon-accent"
                      }`}>
                        {m.is_unlocked ? (lang === "en" ? "UNLOCKED" : "ተከፍቷል") : (lang === "en" ? "LOCKED" : "የተቆለፈ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {lang === "en" ? "Trade target: " : "መለዋወጫ ባልደረባ፦ "} {m.is_unlocked ? sideTargetUser.full_name : (lang === "en" ? "🔒 Locked profile" : "🔒 ተቆልፏል")}
                    </p>
                    <p className="text-[9px] font-mono text-[#00F5FF] mt-1 neon-accent">
                      {lang === "en" ? VALUE_TIERS[sideTargetItem.value_tier]?.name : (
                        sideTargetItem.value_tier === 1 ? "ዝቅተኛ ደረጃ" :
                        sideTargetItem.value_tier === 2 ? "መካከለኛ ደረጃ" :
                        sideTargetItem.value_tier === 3 ? "ከፍተኛ ደረጃ" : "የቅንጦት ደረጃ"
                      )}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Main Match Focus Area (Center and Right) */}
      <div className="lg:col-span-2 h-[580px] glass border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between backdrop-blur-md">
        {!activeMatch ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-neutral-400 h-full gap-4">
            <Unlock size={48} className="text-[#00F5FF] animate-pulse mb-1 neon-accent" />
            <h3 className="font-bold text-lg text-white">Lwach Trading Escrow Engine</h3>
            <p className="text-sm text-neutral-400 max-w-sm">
              {lang === "en"
                ? "Select an active confirmed match from the sidebar to inspect escrow validation, settle local digital checkout fees, or engage custom trading planners!"
                : "የመለዋወጫ ስምምነት መያዣን ለመመልከት፣ ክፍያዎችን ለመፈጸም እና ጥበቃ የሚደረግለትን ልዩ መድረክ ለመመልከት አንዱን ግጥጥሞሽ ከጎን ይምረጡ!"}
            </p>
          </div>
        ) : !activeMatch.is_unlocked ? (
          /* ================= LOCKOUT SCREEN ================= */
          <div className="p-6 flex flex-col flex-grow justify-between overflow-y-auto">
            
            <div className="space-y-4">
              {/* Confirmed Milestone Banner */}
              <div className="text-center py-4 bg-gradient-to-r from-[#00F5FF]/10 via-purple-500/10 to-emerald-500/10 border border-white/10 rounded-2xl shadow-inner">
                <span className="text-xs font-mono font-black text-[#00F5FF] uppercase tracking-widest block neon-accent animate-pulse">
                  {lang === "en" ? "SECURE TELEBIRR ESCROW ACTIVE" : "አስተማማኝ የቴሌብር ዋስትና ቻናል"}
                </span>
                <h3 className="font-bold text-xl text-white mt-1 uppercase tracking-tight">
                  {lang === "en" ? "ESCROW SYSTEM LOCKED" : "የዋስትናው ስርዓት ተቆልፏል"}
                </h3>
                <p className="text-xs text-neutral-400 max-w-md mx-auto mt-2 px-4 leading-relaxed">
                  {lang === "en"
                    ? "Direct messages and profile contacts are securely concealed until both parties settle a fixed flat platform fee to Lwach."
                    : "ለልውውጥ ደህንነት እና መጋጠሚያዎች አስተማማኝነት ሲባል ሁለቱም ወገኖች ቋሚ የአስተዳደር ክፍያ እስኪፈጽሙ ድረስ የእውቂያ ስልክ እና ውይይቱ ተቆልፎ ይቆያል።"}
                </p>
              </div>

              {/* Matched Listings layout */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                
                {/* My Item Offering */}
                <div className="bg-[#0A0A0B]/60 border border-[#00F5FF]/5 rounded-2xl p-3 flex flex-col gap-2 relative">
                  <span className="absolute top-2 right-2 text-[8px] uppercase tracking-wider font-mono bg-[#00F5FF]/15 text-[#00F5FF] border border-[#00F5FF]/20 px-1.5 py-0.5 rounded-full neon-accent">
                    {lang === "en" ? "YOUR ACTIVE OFFER" : "የእርስዎ እቃ"}
                  </span>
                  
                  <div className="h-28 rounded-xl overflow-hidden bg-neutral-900 relative">
                    <img 
                      src={myItem?.images[0]} 
                      alt={myItem?.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-white truncate">{myItem?.title}</h5>
                    <p className="text-[10px] text-neutral-400 font-sans mt-0.5 line-clamp-1">{myItem?.description}</p>
                    
                    {/* Display user own customization elements if exist */}
                    {((isUserPartyA ? activeMatch.bundle_item_ids_a : activeMatch.bundle_item_ids_b) || []).length > 0 && (
                      <span className="text-[9px] text-[#00F5FF] font-mono block mt-1 neon-accent">
                        + bundled extra items
                      </span>
                    )}

                    <div className="mt-2 text-xs font-mono">
                      {lang === "en" ? "Payment: " : "የእርስዎ ክፍያ፦ "}{myPaidStatus ? (
                        <span className="text-emerald-400 font-bold">{t.confirmedFeeLabel}</span>
                      ) : (
                        <span className="text-[#00F5FF] font-semibold animate-pulse">{t.pendingFeeLabel}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Target Matched Item */}
                <div className="bg-[#0A0A0B]/60 border border-white/5 rounded-2xl p-3 flex flex-col gap-2 relative">
                  <span className="absolute top-2 right-2 text-[8px] uppercase tracking-wider font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded-full">
                    {t.peerTargetLabel}
                  </span>

                  <div className="h-28 rounded-xl overflow-hidden bg-neutral-900 relative">
                    {activeMatch.bundle_item_ids_b && activeMatch.bundle_item_ids_b.length > 0 && (
                      <div className="absolute top-2 bottom-2 left-2 right-2 pointer-events-none z-10 bg-purple-950/20 blur opacity-40"></div>
                    )}
                    <img 
                      src={targetItem?.images[0]} 
                      alt={targetItem?.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-white truncate">{targetItem?.title}</h5>
                    <p className="text-[10px] text-neutral-400 font-sans mt-0.5 line-clamp-1">Owner Profile: {t.lockoutContactHidden}</p>
                    
                    {/* Display target modifications */}
                    {((isUserPartyA ? activeMatch.bundle_item_ids_b : activeMatch.bundle_item_ids_a) || []).length > 0 && (
                      <span className="text-[9px] text-[#00F5FF] font-mono block mt-1">
                        + bundled extra items
                      </span>
                    )}

                    <div className="mt-2 text-xs font-mono">
                      {lang === "en" ? "Payment: " : "የሌላው ክፍያ፦ "}{targetPaidStatus ? (
                        <span className="text-emerald-400 font-bold">{t.confirmedFeeLabel}</span>
                      ) : (
                        <span className="text-neutral-500">{t.pendingFeeLabel}</span>
                      )}
                    </div>
                  </div>
                </div>

              </div>

              {/* Payment Terminal Widget */}
              <div className="bg-[#0A0A0B]/60 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-2xl">
                <div className="space-y-2 text-left w-full sm:w-1/2">
                  <h4 className="text-xs font-bold font-mono text-[#00F5FF] uppercase tracking-widest flex items-center gap-1 neon-accent">
                    <Coins size={12} /> {t.payTerminalTitle}
                  </h4>
                  <p className="text-xl font-black text-white">{currentTier?.feeBirr} {lang === "en" ? "Birr" : "ብር"} <span className="text-xs text-neutral-400 font-sans font-normal">{t.flatFeeLabel}</span></p>
                  <p className="text-[10px] text-neutral-400 font-sans leading-tight">
                    {lang === "en"
                      ? "Each matched user must pay the fixed transaction fee to obtain shipping vouchers, unlock profile contact directories, and instantiate live chat room coordinates."
                      : "እቃውን በአካል ወይም በፖስታ ለመረካከብ የልውውጥ ደህንነት እና የስልክ ማውጫዎቻችሁ በቀጥታ እንዲገናኙ ሁለቱም ወገኖች ቋሚ የአስተዳደር ክፍያውን መክፈል አለባቸው።"}
                  </p>

                  {/* Simulator action hooks */}
                  <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                    <span className="text-[10px] font-mono font-bold text-[#00F5FF] uppercase tracking-wider block neon-accent">
                      {lang === "en" ? "SIMULATE CAPTURE INTEGRATION:" : "የክፍያ ውህደት ማስመሰያ ቁልፍ፡"}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onSimulatePayment(activeMatch.id, isUserPartyA ? "A" : "B")}
                        className={`px-3 py-1 text-[11px] font-bold font-mono rounded-lg border transition duration-300 cursor-pointer ${
                          myPaidStatus 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-not-allowed" 
                            : "bg-[#0A0A0B] border-white/10 text-neutral-200 hover:bg-[#00F5FF]/10 hover:border-[#00F5FF]/20"
                        }`}
                        disabled={myPaidStatus}
                      >
                        {myPaidStatus ? (lang === "en" ? "You Paid" : "ከፍለዋል") : t.simulatePaymentBtn}
                      </button>

                      <button
                        onClick={() => onSimulatePayment(activeMatch.id, isUserPartyA ? "B" : "A")}
                        className={`px-3 py-1 text-[11px] font-bold font-mono rounded-lg border transition duration-300 cursor-pointer ${
                          targetPaidStatus 
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 cursor-not-allowed" 
                            : "bg-[#0A0A0B] border-white/10 text-neutral-200 hover:bg-[#00F5FF]/10 hover:border-[#00F5FF]/20"
                        }`}
                        disabled={targetPaidStatus}
                      >
                        {targetPaidStatus ? (lang === "en" ? "Peer Paid" : "ባልደረባዎ ከፍሏል") : t.simulatePeerPayBtn}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Scannable Paytabs Selection & QR */}
                <div className="w-full sm:w-1/2 flex flex-col gap-2 items-center text-center">
                  <div className="flex gap-1.5 w-full bg-[#0A0A0B] p-1 rounded-xl text-[10px] font-mono border border-white/5">
                    <button 
                      onClick={() => setSelectedPaymentGateway("telebirr")}
                      className={`flex-grow py-1 rounded-lg transition duration-200 cursor-pointer ${selectedPaymentGateway === 'telebirr' ? 'bg-[#00F5FF] text-black font-extrabold shadow-[0_0_8px_rgba(0,245,255,0.4)]' : 'text-neutral-400 hover:text-white'}`}
                    >
                      Telebirr
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSelectedPaymentGateway("cbe")}
                      className={`flex-grow py-1 rounded-lg transition duration-200 cursor-pointer ${selectedPaymentGateway === 'cbe' ? 'bg-[#00F5FF] text-black font-extrabold shadow-[0_0_8px_rgba(0,245,255,0.4)]' : 'text-neutral-400 hover:text-white'}`}
                    >
                      CBE Birr
                    </button>
                    <button 
                      type="button"
                      onClick={() => setSelectedPaymentGateway("bank")}
                      className={`flex-grow py-1 rounded-lg transition duration-200 cursor-pointer ${selectedPaymentGateway === 'bank' ? 'bg-[#00F5FF] text-black font-extrabold shadow-[0_0_8px_rgba(0,245,255,0.4)]' : 'text-neutral-400 hover:text-white'}`}
                    >
                      Transfer
                    </button>
                  </div>

                  <div className="bg-white p-2 rounded-xl h-28 w-28 flex items-center justify-center shadow-lg relative group">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${
                        selectedPaymentGateway === 'telebirr' 
                          ? 'telebirr://pay?to=lwachMerchant_A' 
                          : 'cbebirr://pay?to=lwach_A'
                      }`} 
                      alt="Local Payment QR Code"
                      className="h-full w-full"
                    />
                  </div>
                  <span className="text-[9px] font-mono text-neutral-400 tracking-tight leading-none uppercase">
                    LWACH ETHIOPIA ESCROW DEPOSIT MERCH #9382
                  </span>
                </div>
              </div>

            </div>

            <div className="pt-3 border-t border-white/5 text-center text-[11px] font-mono text-neutral-500">
              * {t.escrowExplanation}
            </div>

          </div>
        ) : (
          /* ================= UNLOCKED STATUS: ACTIVE CHAT & LOGISTICS CHECKLIST ================= */
          <div className="flex flex-col lg:flex-row flex-grow overflow-hidden h-full">
            
            {/* Live Chat Panel (Left area of unlocked container) */}
            <div className="flex-grow flex flex-col justify-between h-full border-r border-white/5 animate-fade-in">
              
              {/* Unlocked Header */}
              <div className="p-3 bg-neutral-950 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-[#00F5FF] shadow-[0_0_8px_rgba(0,245,255,0.8)] neon-accent animate-pulse"></span>
                  <div className="text-left">
                    <h4 className="font-bold text-xs text-white uppercase">{targetUser?.full_name}</h4>
                    <p className="text-[10px] font-mono text-neutral-400">
                      {lang === "en" ? "Escrow Chat Unlocked" : "ልውውጥ ውይይት ተከፍቷል"} • {targetUser?.phone_number}
                    </p>
                  </div>
                </div>

                <div className="text-[11px] font-bold text-[#00F5FF] uppercase tracking-wide bg-[#00F5FF]/10 px-2.5 py-1 rounded-full border border-[#00F5FF]/25 font-mono neon-accent">
                  {t.securedBadge}
                </div>
              </div>

              {/* Chat Message Lists scroll */}
              <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-[#0A0A0B]/20 text-xs text-neutral-100 max-h-[380px]">
                {messages.length === 0 ? (
                  <div className="text-center p-6 text-neutral-500 italic">
                    <MessageSquare size={20} className="mx-auto mb-1 opacity-40 text-neutral-400" />
                    {lang === "en" 
                      ? `Secure connection verified between ${myUser?.full_name} and ${targetUser?.full_name}. Coordinate meetup point in Addis Ababa!`
                      : `ደህንነቱ የተጠበቀ ግንኙነት በ ${myUser?.full_name} እና ${targetUser?.full_name} መካከል ተሰናድቷል። የልውውጥ ሰፈር ለመምረጥ መልዕክት ይጻፉ!`}
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMeSf = msg.sender_id === currentUserId;
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col max-w-[80%] ${isMeSf ? "ml-auto items-end" : "mr-auto items-start"}`}
                      >
                        <span className="text-[9px] font-mono text-neutral-500 mb-0.5 mt-1">
                          {isMeSf ? (lang === "en" ? "You" : "እርስዎ") : targetUser?.full_name}
                        </span>
                        <div className={`p-2.5 rounded-2xl leading-relaxed ${
                          isMeSf 
                            ? "bg-[#00F5FF] text-black font-semibold rounded-tr-none shadow-[0_0_12px_rgba(0,245,255,0.15)]" 
                            : "bg-neutral-800 text-white rounded-tl-none"
                        }`}>
                          {msg.content}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Msg typing inputs */}
              <form onSubmit={handleSendChat} className="p-3 bg-neutral-950 border-t border-white/5 flex gap-2">
                <input
                  type="text"
                  value={localChatMessage}
                  onChange={(e) => setLocalChatMessage(e.target.value)}
                  placeholder={t.messageInputPlaceholder}
                  className="w-full bg-[#0A0A0B] border border-white/5 outline-none px-3 py-2 text-xs text-white rounded-xl focus:border-[#00F5FF] transition duration-300"
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-[#00F5FF] hover:bg-[#00d7e0] text-black transition duration-300 shadow-[0_0_8px_rgba(0,245,255,0.2)] cursor-pointer"
                >
                  <Send size={15} />
                </button>
              </form>
            </div>

            {/* Hub-Based exchange Logistics planner (Right area of unlocked container) */}
            <div className="w-full lg:w-64 bg-neutral-950 p-4 shrink-0 flex flex-col justify-between overflow-y-auto h-full text-left">
              <div className="space-y-4">
                <div className="pb-2 border-b border-white/5 text-left">
                  <h4 className="text-xs font-bold font-mono text-[#00F5FF] uppercase tracking-widest flex items-center gap-1 neon-accent">
                    <MapPin size={12} /> {t.swapLogisticsHeader}
                  </h4>
                  <p className="text-[10px] text-neutral-400">
                    {lang === "en" ? "Step-by-step physical swap confirmation." : "ደረጃ-በደረጃ የአካል ስረካከብ ማረጋገጫ።"}
                  </p>
                </div>

                {/* Swap Delivery checklist tabs */}
                <div className="flex gap-1.5 bg-[#0A0A0B] p-1 rounded-xl text-[9px] font-mono border border-white/5">
                  <button
                    type="button"
                    onClick={() => onUpdateLogistics(activeMatch.id, { exchange_method: "MEETUP" })}
                    className={`flex-grow py-1 rounded-md flex items-center justify-center gap-1 transition duration-200 cursor-pointer ${
                      activeMatch.logistics?.exchange_method === "MEETUP" ? "bg-[#00F5FF] text-black font-extrabold shadow-[0_0_8px_rgba(0,245,255,0.3)]" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    <Compass size={10} /> {t.logisticInPerson}
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateLogistics(activeMatch.id, { exchange_method: "COURIER" })}
                    className={`flex-grow py-1 rounded-md flex items-center justify-center gap-1 transition duration-200 cursor-pointer ${
                      activeMatch.logistics?.exchange_method === "COURIER" ? "bg-[#00F5FF] text-black font-extrabold shadow-[0_0_8px_rgba(0,245,255,0.3)]" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    <Truck size={10} /> {t.logisticCourier}
                  </button>
                </div>

                {/* Sub configuration options based on method */}
                {activeMatch.logistics?.exchange_method === "MEETUP" && (
                  <div className="space-y-2 animate-fade-in text-[11px] text-left">
                     <div className="space-y-1">
                       <span className="text-[9px] font-mono text-neutral-400 uppercase">{t.meetupLocationLabel}</span>
                       <input
                         type="text"
                         value={activeMatch.logistics?.meetup_location || ""}
                         onChange={(e) => onUpdateLogistics(activeMatch.id, { meetup_location: e.target.value })}
                         placeholder="E.g. Bole Medhanialem, Kasanchis..."
                         className="w-full bg-[#0A0A0B] border border-white/5 px-2 py-1.5 rounded-lg outline-none text-white focus:border-[#00F5FF] font-sans transition duration-200"
                       />
                     </div>
                     <div className="space-y-1">
                       <span className="text-[9px] font-mono text-neutral-400 uppercase">{t.meetupTimeLabel}</span>
                       <input
                         type="text"
                         value={activeMatch.logistics?.meetup_time || ""}
                         onChange={(e) => onUpdateLogistics(activeMatch.id, { meetup_time: e.target.value })}
                         placeholder="E.g. Saturday 10:30 AM"
                         className="w-full bg-[#0A0A0B] border border-white/5 px-2 py-1.5 rounded-lg outline-none text-white focus:border-[#00F5FF] font-sans transition duration-200"
                       />
                     </div>
                  </div>
                )}

                {activeMatch.logistics?.exchange_method === "COURIER" && (
                  <div className="space-y-2 animate-fade-in text-[11px] text-left">
                     <span className="text-[9px] font-mono text-neutral-400 uppercase">{t.courierPartnerLabel}</span>
                     <select
                       value={activeMatch.logistics?.courier_partner || ""}
                       onChange={(e) => onUpdateLogistics(activeMatch.id, { courier_partner: e.target.value, courier_status: "PENDING" })}
                       className="w-full bg-[#0A0A0B] border border-white/5 px-2 py-1.5 rounded-lg outline-none text-white text-xs cursor-pointer"
                     >
                       <option value="">{t.courierSelectPartner}</option>
                       <option value="Deliver Addis">Deliver Addis (ደሊቨር አዲስ)</option>
                       <option value="ZMALL Delivery">ZMALL Delivery</option>
                       <option value="Lwach Express Dispatch">Lwach Express Dispatch (ልዋጭ ኤክስፕረስ)</option>
                     </select>
                     
                     {activeMatch.logistics?.courier_partner && (
                       <div className="bg-[#0A0A0B] px-2 py-1.5 rounded-lg border border-white/5">
                          <span className="text-[9px] font-mono text-neutral-400">{t.courierStatusLabel}</span>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-[#00F5FF] font-bold font-mono neon-accent">
                              {activeMatch.logistics?.courier_status === "PENDING" ? t.courierStatusPending :
                               activeMatch.logistics?.courier_status === "DISPATCHED" ? t.courierStatusDispatched :
                               t.courierStatusDelivered}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                const transitions: Record<string, "PENDING" | "DISPATCHED" | "DELIVERED"> = {
                                  "PENDING": "DISPATCHED",
                                  "DISPATCHED": "DELIVERED",
                                  "DELIVERED": "PENDING"
                                };
                                const nextStat = transitions[activeMatch.logistics?.courier_status || "PENDING"];
                                onUpdateLogistics(activeMatch.id, { courier_status: nextStat });
                              }}
                              className="text-[9px] text-[#00F5FF]/70 font-mono underline cursor-pointer hover:text-[#00F5FF]"
                            >
                              {t.courierTransition}: {activeMatch.logistics?.courier_status}
                            </button>
                          </div>
                       </div>
                     )}
                  </div>
                )}

                {/* Final receipt double checklist confirmation to finalize transaction */}
                {activeMatch.logistics?.exchange_method && (
                  <div className="pt-2 border-t border-white/5 space-y-2 text-left">
                     <span className="text-[9px] font-mono text-neutral-400 uppercase block">
                       {t.physicalReceiptTitle}
                     </span>
                     
                     <button
                       type="button"
                       onClick={() => onUpdateLogistics(activeMatch.id, { party_a_completed: !activeMatch.logistics?.party_a_completed })}
                       className={`w-full flex items-center gap-2 p-2 rounded-xl text-[10px] transition duration-200 border cursor-pointer ${
                         activeMatch.logistics?.party_a_completed 
                           ? "bg-[#00F5FF]/15 border-[#00F5FF]/40 text-white" 
                           : "bg-[#0A0A0B] border-white/5 text-neutral-300 hover:border-neutral-700 hover:text-white"
                       }`}
                     >
                       <span className="shrink-0 text-[#00F5FF]">
                         {activeMatch.logistics?.party_a_completed ? <CheckSquare size={14} className="neon-accent shadow-sm" /> : <Square size={14} />}
                       </span>
                       <span className="truncate">
                         {activeMatch.userA.full_name} - {t.receivedItemsBtn}
                       </span>
                     </button>

                     <button
                       type="button"
                       onClick={() => onUpdateLogistics(activeMatch.id, { party_b_completed: !activeMatch.logistics?.party_b_completed })}
                       className={`w-full flex items-center gap-2 p-2 rounded-xl text-[10px] transition duration-200 border cursor-pointer ${
                         activeMatch.logistics?.party_b_completed 
                           ? "bg-[#00F5FF]/15 border-[#00F5FF]/40 text-white" 
                           : "bg-[#0A0A0B] border-white/5 text-neutral-300 hover:border-neutral-700 hover:text-white"
                       }`}
                     >
                       <span className="shrink-0 text-[#00F5FF]">
                         {activeMatch.logistics?.party_b_completed ? <CheckSquare size={14} className="neon-accent shadow-sm" /> : <Square size={14} />}
                       </span>
                       <span className="truncate">
                         {activeMatch.userB.full_name} - {t.receivedItemsBtn}
                       </span>
                     </button>
                  </div>
                )}
              </div>

              {/* Completion indicators */}
              <div className="pt-3 border-t border-white/5 text-[10px]">
                {activeMatch.logistics?.party_a_completed && activeMatch.logistics?.party_b_completed ? (
                  <div className="bg-emerald-950/40 border border-[#00F5FF]/30 text-[#00F5FF] p-2.5 rounded-lg font-black uppercase tracking-widest text-center shadow-[0_0_15px_rgba(0,245,255,0.15)] neon-accent animate-pulse font-mono">
                    {t.completeSwapTitle}
                  </div>
                ) : (
                  <div className="bg-[#0A0A0B]/80 border border-white/5 p-2 text-neutral-400 text-center font-mono">
                    {t.waitingReceiptTitle}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}
      </div>

    </div>
  );
}
