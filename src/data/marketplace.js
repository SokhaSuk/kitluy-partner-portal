// Extracted verbatim from the original KitLuy Partner Portal bundle.

export const MP_CATS=["All","Payments","Messaging","AI","Loyalty","Logistics","Accounting & ERP","Analytics","Developer API"];

export const CAT_COLOR={Payments:"var(--accent)",Messaging:"var(--info-fg)",AI:"var(--purple)",Loyalty:"var(--gold)",Logistics:"var(--ok-fg)","Accounting & ERP":"var(--muted)",Analytics:"#E8833A","Developer API":"var(--purple)"};

export const MARKETPLACE=[
  {name:"ABA PayWay",cat:"Payments",desc:"KHQR & card settlement with next-day payout to your bank.",color:"#0072BC",status:"connected",rating:"4.9",installs:"12k",sync:"2m ago"},
  {name:"Bakong KHQR",cat:"Payments",desc:"National interbank QR standard operated by NBC.",color:"#E4002B",status:"connected",rating:"4.8",installs:"9.4k",sync:"2m ago"},
  {name:"KitLuy AI",cat:"AI",desc:"Insights, summaries and reorder suggestions from your own data.",color:"var(--purple)",status:"connected",rating:"5.0",installs:"native",sync:"live"},
  {name:"KitLuy Loyalty",cat:"Loyalty",desc:"Points, tiers and rewards that run natively in your store.",color:"var(--gold)",status:"connected",rating:"4.7",installs:"native",sync:"live"},
  {name:"Telegram",cat:"Messaging",desc:"Order-ready alerts, reminders and AI bot replies to customers.",color:"#2AABEE",status:"connected",rating:"4.9",installs:"20k",sync:"5m ago"},
  {name:"Wing Bank",cat:"Payments",desc:"Wallet and bank transfers used widely across Cambodia.",color:"#00A94F",status:"available",rating:"4.6",installs:"7.1k"},
  {name:"Pi Pay",cat:"Payments",desc:"QR wallet payments with cashback promotions.",color:"#6A2C91",status:"available",rating:"4.3",installs:"3.2k"},
  {name:"SMS Gateway",cat:"Messaging",desc:"Cellcard & Smart SMS for pickup and balance reminders.",color:"#F5A623",status:"available",rating:"4.4",installs:"5.6k"},
  {name:"Email (SMTP)",cat:"Messaging",desc:"Send receipts and B2B statements over email.",color:"#0c7fd1",status:"available",rating:"4.5",installs:"8.9k"},
  {name:"Facebook Page",cat:"Messaging",desc:"Reply to customers straight from your Messenger inbox.",color:"#1877F2",status:"available",rating:"4.2",installs:"6.3k"},
  {name:"Nham24",cat:"Logistics",desc:"On-demand pickup and delivery across Phnom Penh.",color:"#EE4D2D",status:"available",rating:"4.4",installs:"4.8k"},
  {name:"HSAL Logistics",cat:"Logistics",desc:"Scheduled route delivery with live tracking.",color:"#0e9f6e",status:"available",rating:"4.1",installs:"1.2k"},
  {name:"Grab Express",cat:"Logistics",desc:"Same-day courier for express laundry orders.",color:"#00B14F",status:"available",rating:"4.6",installs:"9.0k"},
  {name:"ERPNext",cat:"Accounting & ERP",desc:"Sync sales and expenses to open-source ERP.",color:"#2490EF",status:"available",rating:"4.5",installs:"2.7k"},
  {name:"SroulERP",cat:"Accounting & ERP",desc:"Cambodia-first ERP export and GL posting package.",color:"#475569",status:"available",rating:"4.3",installs:"900"},
  {name:"QuickBooks",cat:"Accounting & ERP",desc:"Push a daily finance summary to QuickBooks Online.",color:"#2CA01C",status:"available",rating:"4.7",installs:"11k"},
  {name:"Google Sheets",cat:"Analytics",desc:"Auto-export reports to a live spreadsheet.",color:"#0F9D58",status:"available",rating:"4.8",installs:"15k"},
  {name:"Looker Studio",cat:"Analytics",desc:"Build custom dashboards on top of your store data.",color:"#4285F4",status:"available",rating:"4.4",installs:"3.9k"},
  {name:"Google Maps",cat:"Analytics",desc:"Service-area maps and delivery geocoding.",color:"#DB4437",status:"available",rating:"4.6",installs:"10k"},
];

export const DEV_TOOLS=[
  {name:"REST API",desc:"Read orders, customers, inventory and finance over HTTPS.",color:"var(--purple)",tag:"Stable"},
  {name:"Webhooks",desc:"Realtime events like order.ready and payment.captured.",color:"var(--accent)",tag:"Stable"},
  {name:"GraphQL",desc:"Flexible single-endpoint queries across store data.",color:"var(--info-fg)",tag:"Beta"},
  {name:"Zapier",desc:"No-code automation to 6,000+ apps.",color:"#FF4A00",tag:"Available"},
];

export const API_KEYS=[
  {label:"Production key",key:"kl_live_••••••••••4f2a",created:"12 Mar 2026",scope:"read / write",last:"2m ago"},
  {label:"Read-only key",key:"kl_ro_••••••••••9c11",created:"2 Apr 2026",scope:"read",last:"1h ago"},
];

export const WEBHOOKS=[
  {url:"https://hooks.soklaundry.kh/orders",events:"order.ready · order.picked_up",status:"Active",tone:"ok"},
  {url:"https://hooks.soklaundry.kh/payments",events:"payment.captured · refund.completed",status:"Active",tone:"ok"},
  {url:"https://n8n.internal/kitluy",events:"inventory.low_stock",status:"Paused",tone:"neutral"},
];
