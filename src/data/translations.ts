export type Language = 'en' | 'am';

export const translations = {
  en: {
    // Navigation & General
    app_title: "BidLow",
    app_subtitle: "Unique Auctions",
    welcome_banner: "Welcome to BidLow — Ethiopia's premier Lowest Unique Bid Auction Platform!",
    provably_fair_badge: "100% Provably Fair",
    dashboard: "Dashboard",
    browse_auctions: "Browse Auctions",
    wallet: "Wallet",
    fairness_audit: "Fairness Audit",
    my_bids: "My Bids",
    alerts: "Alerts",
    audit: "Audit",
    home: "Home",
    balance: "Balance",
    admin: "Admin",
    logout: "Logout",
    language: "Language",
    english: "English",
    amharic: "አማርኛ",

    // Dashboard
    hero_title: "Ethiopia's Lowest Unique Bid Platform",
    hero_desc: "Place strategic bids. The lowest non-duplicate bid wins the prize!",
    active_auctions: "Active Live Auctions",
    upcoming_auctions: "Upcoming Auctions",
    closed_auctions: "Recently Closed",
    view_details: "View & Bid Now",
    retail_value: "Retail Value",
    bid_cost: "Bid Cost",
    time_left: "Time Left",
    total_bids: "Total Bids",
    bidders: "Bidders",
    winner: "Winner",
    no_active_auctions: "No live auctions active right now.",

    // Wallet Page
    my_wallet: "My Wallet",
    wallet_subtitle: "Manage your deposit funds, active bidding power, and financial history.",
    available_balance: "Available Balance",
    topup_guidelines: "Top-Up Guidelines",
    verified_account: "Verified Account",
    select_payment_method: "Select Payment Method",
    chapa_payment: "Chapa Payment",
    chapa_desc: "Instant online checkout supporting Telebirr, CBE Birr, Mobile Banking, and Debit Cards.",
    manual_payment: "Manual Payment",
    manual_desc: "Direct bank transfer to CBE, Awash, or Telebirr with manual transaction slip receipt submission.",
    topup_with_chapa: "Top up with Chapa",
    submit_bank_receipt: "Submit Bank Receipt",
    transaction_history: "Transaction History",
    no_transactions: "No transactions recorded yet",
    amount_etb: "Amount (ETB)",
    reference_id: "Transaction / Reference ID",
    receipt_proof: "Receipt Proof Image / URL",
    notes_optional: "Notes (Optional)",
    cancel: "Cancel",
    pay_with_chapa: "Pay with Chapa",
    submit_deposit_proof: "Submit Deposit Proof",

    // Auction Detail
    bidding_portal: "Live Bidding Portal",
    enter_bid_amount: "Enter Bid Amount (ETB)",
    bid_step_info: "Bid amount must be a unique number within the allowed range.",
    place_bid_btn: "Place Unique Bid Now",
    live_bids_activity: "Live Bidding Activity",
    unique_bid_status: "Unique Bid",
    duplicate_bid_status: "Duplicate Bid",
    winning_bid_status: "Winning Bid",
    specifications: "Specifications & Details",

    // My Bids Page
    my_bids_title: "My Placed Bids",
    my_bids_subtitle: "Track all your submitted bids across live and past auctions.",
    status: "Status",
    auction_item: "Auction Item",

    // Fairness Audit Page
    fairness_title: "Provably Fair Verification",
    fairness_subtitle: "Auditable mathematical verification for every auction outcome.",
    hash_algorithm: "Cryptographic Hash Standard",

    // Notifications Page
    notifications_title: "My Notifications",
    mark_all_read: "Mark all as read",

    // App Download & Mobile
    install_app: "Install App",
    install_success: "APK Download Started!",
    download_app_text: "Download Mobile App for Instant Bidding Notifications",
  },
  am: {
    // Navigation & General
    app_title: "ቢድሎ",
    app_subtitle: "ልዩ የጨረታ መድረክ",
    welcome_banner: "እንኳን ወደ ቢድሎ በደህና መጡ — የኢትዮጵያ ቀዳሚ የዝቅተኛ ልዩ ጨረታ መድረክ!",
    provably_fair_badge: "100% አስተማማኝ እና ታማኝ",
    dashboard: "ዳሽቦርድ",
    browse_auctions: "ጨረታዎችን ይመልከቱ",
    wallet: "ዋሌት (ሂሳብ)",
    fairness_audit: "የግልፅነት ምርመራ",
    my_bids: "የእኔ ጨረታዎች",
    alerts: "ማስታወቂያዎች",
    audit: "ምርመራ",
    home: "ዋና ገጽ",
    balance: "ቀሪ ሂሳብ",
    admin: "አስተዳዳሪ",
    logout: "ውጣ",
    language: "ቋንቋ",
    english: "English",
    amharic: "አማርኛ",

    // Dashboard
    hero_title: "የኢትዮጵያ ቀዳሚ የዝቅተኛ ልዩ ጨረታ መድረክ",
    hero_desc: "ብልሃተኛ ዋጋ ያስገቡ። ዝቅተኛው እና ያልተደገመው ልዩ ዋጋ አሸናፊ ይሆናል!",
    active_auctions: "በአሁኑ ሰዓት ክፍት የሆኑ ጨረታዎች",
    upcoming_auctions: "በቅርብ የሚጀመሩ ጨረታዎች",
    closed_auctions: "በቅርቡ የተጠናቀቁ",
    view_details: "ተመልከት እና ተወዳደር",
    retail_value: "የገበያ ዋጋ",
    bid_cost: "የአንድ ጨረታ ዋጋ",
    time_left: "ቀሪ ጊዜ",
    total_bids: "አጠቃላይ ጨረታዎች",
    bidders: "ተወዳዳሪዎች",
    winner: "አሸናፊ",
    no_active_auctions: "በአሁኑ ሰዓት ክፍት ጨረታ የለም።",

    // Wallet Page
    my_wallet: "የእኔ ዋሌት",
    wallet_subtitle: "የተቀማጭ ገንዘብዎን፣ የጨረታ አቅምዎን እና የሂሳብ ታሪክዎን ያስተዳድሩ።",
    available_balance: "ያለዎት ቀሪ ሂሳብ",
    topup_guidelines: "የገንዘብ ማስገቢያ መመሪያዎች",
    verified_account: "የተረጋገጠ መለያ",
    select_payment_method: "የክፍያ መንገድ ይምረጡ",
    chapa_payment: "በ ቻፓ (Chapa) ይክፈሉ",
    chapa_desc: "በቴሌብር፣ በሲቢኢ ብር፣ በሞባይል ባንኪንግ እና በካርድ ወዲያውኑ ይክፈሉ።",
    manual_payment: "በ ባንክ ሒሳብ (መደበኛ)",
    manual_desc: "ቀጥታ ወደ ንግድ ባንክ፣ አዋሽ ወይም ቴሌብር በማስገባት የደረሰኝ ቁጥር ያስገቡ።",
    topup_with_chapa: "በ ቻፓ ይክፈሉ",
    submit_bank_receipt: "የባንክ ደረሰኝ ያስገቡ",
    transaction_history: "የሂሳብ እንቅስቃሴ ታሪክ",
    no_transactions: "እስካሁን ምንም የሂሳብ እንቅስቃሴ የለም",
    amount_etb: "የገንዘብ መጠን (ብር)",
    reference_id: "የደረሰኝ / የግብይት ማጣቀሻ ቁጥር",
    receipt_proof: "የደረሰኝ ፎቶ / ሊንክ",
    notes_optional: "ተጨማሪ ማስታወሻ (አማራጭ)",
    cancel: "ሰርዝ",
    pay_with_chapa: "በ ቻፓ ይክፈሉ",
    submit_deposit_proof: "የክፍያ ማረጋገጫ ያስገቡ",

    // Auction Detail
    bidding_portal: "የጨረታ መወዳደሪያ ገጽ",
    enter_bid_amount: "የሚጫረቱበትን ዋጋ ያስገቡ (ብር)",
    bid_step_info: "የሚጫረቱበት ዋጋ በተፈቀደው ክልል ውስጥ ልዩ ቁጥር መሆን አለበት።",
    place_bid_btn: "አሁን ዋጋ ያስገቡ",
    live_bids_activity: "የጨረታ ሂደት እንቅስቃሴ",
    unique_bid_status: "ልዩ ዋጋ",
    duplicate_bid_status: "የተደገፈ ዋጋ",
    winning_bid_status: "አሸናፊ ዋጋ",
    specifications: "የእቃው ዝርዝር መረጃ",

    // My Bids Page
    my_bids_title: "የተወዳደሩባቸው ጨረታዎች",
    my_bids_subtitle: "ያቀረቧቸውን ጨረታዎች በሙሉ እዚህ ይከታተሉ።",
    status: "ሁኔታ",
    auction_item: "የጨረታ እቃ",

    // Fairness Audit Page
    fairness_title: "የግልፅነት እና ታማኝነት ማረጋገጫ",
    fairness_subtitle: "የእያንዳንዱ ጨረታ ውጤት በሂሳባዊ ቀመር የተረጋገጠ እና ግልጽ ነው።",
    hash_algorithm: "የክሪፕቶግራፊክ ሃሽ መለኪያ",

    // Notifications Page
    notifications_title: "ማስታወቂያዎች",
    mark_all_read: "ሁሉንም እንደተነበቡ ቁጠር",

    // App Download & Mobile
    install_app: "መተግበሪያ ጫን",
    install_success: "የኤፒኬ ውርድ ተጀምሯል!",
    download_app_text: "የሞባይል መተግበሪያውን በማውረድ የጨረታ ማስታወቂያዎችን በፍጥነት ያግኙ",
  }
};
