// Extracted verbatim from the original KitLuy Partner Portal bundle.
import { khr } from '../lib/format.js';

export const GENERIC = {};
Object.assign(GENERIC, {
  "store:Add-ons & Special Handling":{title:"Add-ons & Special Handling",subtitle:"Extra services attached to a laundry order — express, stain, fragrance and delicate handling",action:"Add service",sections:[
    {type:"table",title:"Add-on services",cols:[{label:"Add-on"},{label:"Pricing"},{label:"Price",align:"right"},{label:"Applies to"},{label:"Status"}],rows:[
      [{t:"Express turnaround",strong:true},"Flat / order",{t:khr(6000),align:"right"},"Any service",{t:"Active",badge:true,tone:"ok"}],
      [{t:"Stain removal",strong:true},"Per item",{t:khr(3000),align:"right"},"Wash / Dry clean",{t:"Active",badge:true,tone:"ok"}],
      [{t:"Fragrance boost",strong:true},"Flat / order",{t:khr(2000),align:"right"},"Wash & Fold",{t:"Active",badge:true,tone:"ok"}],
      [{t:"Hanger & press finish",strong:true},"Per piece",{t:khr(1500),align:"right"},"Press / Iron",{t:"Active",badge:true,tone:"ok"}],
      [{t:"Delicate handling",strong:true},"Flat / order",{t:khr(4000),align:"right"},"Dry clean",{t:"Active",badge:true,tone:"ok"}],
      [{t:"Same-day rush",strong:true},"Flat / order",{t:khr(8000),align:"right"},"Before 11:00 cutoff",{t:"Paused",badge:true,tone:"neutral"}],
    ]},
    {type:"note",text:"Add-ons print on the laundry tag and receipt, and can trigger extra inventory usage (e.g. stain remover 20ml/item). Configure usage formulas in Inventory → Settings."},
  ]},
  "store:Order Rules & Workflow":{title:"Order Rules & Workflow",subtitle:"The rules POS enforces for the laundry order lifecycle · active version v3",action:"Edit rules",freshness:"Synced to POS · 2m ago",sections:[
    {type:"kv",title:"Status sequence",subtitle:"Enabled statuses in order",rows:[
      {label:"New → Received → Washing → Drying → Ironing → Ready → Picked Up",value:"7 stages"},
      {label:"Issue / Rewash / Damaged branch",desc:"Reachable from any active status",value:"Enabled"},
    ]},
    {type:"kv",title:"Due date & turnaround",rows:[
      {label:"Default turnaround",value:"24 hours"},{label:"Express turnaround",value:"6 hours"},{label:"Same-day cutoff",value:"11:00"},
    ]},
    {type:"kv",title:"Pickup & payment workflow",rows:[
      {label:"Block pickup if balance unpaid",desc:"Manager PIN can override",on:true},
      {label:"Allow deposit at drop-off",desc:"Minimum 30% of net",on:true},
      {label:"Allow pay-at-pickup",on:true},
      {label:"Allow customer tab (B2B)",on:true},
    ]},
    {type:"kv",title:"Exceptions & printing",rows:[
      {label:"Reason required on cancellation",on:true},
      {label:"Paid order cancel routes to refund/adjustment",on:true},
      {label:"Photo required for damage/missing",on:true},
      {label:"Tag reprint requires manager after 2×",on:true},
    ]},
    {type:"kv",title:"Inventory & notification triggers",rows:[
      {label:"Deduct supplies at",value:"Washing"},{label:"Final usage check at",value:"Ready"},
      {label:"Notify: order ready",on:true},{label:"Notify: late pickup",on:true},{label:"Notify: payment reminder",on:true},
    ]},
  ]},
  "store:Store Profile":{title:"Store Profile",subtitle:"Identity and locale for this laundry store",action:"Edit profile",sections:[
    {type:"kv",title:"Store details",rows:[
      {label:"Store name",value:"Sok Laundry"},{label:"Store code",value:"SOK-01"},{label:"Vertical",value:"Laundry (locked)"},
      {label:"Address",value:"St. 271, Toul Kork, Phnom Penh"},{label:"Phone",value:"+855 23 880 100"},
      {label:"Timezone",value:"Asia/Phnom_Penh"},{label:"Currency",value:"KHR (៛)"},
    ]},
    {type:"note",text:"Vertical type is immutable after store creation — a laundry store cannot switch to café or retail POS."},
  ]},
  "store:Business Hours":{title:"Business Hours",subtitle:"Opening hours used for due-date rules and pickup windows",action:"Edit hours",sections:[
    {type:"table",title:"Weekly schedule",cols:[{label:"Day"},{label:"Hours",align:"right"}],rows:[
      ["Monday",{t:"07:00 – 20:00",align:"right"}],["Tuesday",{t:"07:00 – 20:00",align:"right"}],["Wednesday",{t:"07:00 – 20:00",align:"right"}],["Thursday",{t:"07:00 – 20:00",align:"right"}],["Friday",{t:"07:00 – 21:00",align:"right"}],["Saturday",{t:"08:00 – 21:00",align:"right"}],["Sunday",{t:"08:00 – 18:00",align:"right"}],
    ]},
  ]},
  "store:Receipt Templates":{title:"Receipt Templates",subtitle:"Customer receipt layout for POS thermal printer (ESC/POS)",action:"Preview receipt",sections:[
    {type:"kv",title:"Receipt content",rows:[
      {label:"Store header & logo",on:true},{label:"Order number & tag QR",on:true},{label:"Itemised service lines",on:true},
      {label:"Deposit & balance due",on:true},{label:"KHQR / payment reference",on:true},{label:"Khmer + English text",on:true},
      {label:"Footer message",value:"Thank you · អរគុណ"},
    ]},
  ]},
  "store:Laundry Tag Templates":{title:"Laundry Tag Templates",subtitle:"Physical tag attached to bags/garments for chain-of-custody — distinct from inventory barcode labels",action:"Preview tag",sections:[
    {type:"kv",title:"Tag fields",rows:[
      {label:"Order number + barcode",on:true},{label:"Customer name & phone",on:true},{label:"Service & piece count",on:true},
      {label:"Due date/time",on:true},{label:"Special handling flags",on:true},
      {label:"Printer type",value:"TSPL label printer"},{label:"Tag size",value:"40 × 30 mm"},
    ]},
    {type:"note",text:"Tag reprints beyond 2× require a manager PIN and a reason (Order Rules → printing)."},
  ]},
  "store:Payment Methods":{title:"Payment Methods",subtitle:"Tender types accepted at POS · cash is always required",action:"Configure",freshness:"Synced to POS · 2m ago",sections:[
    {type:"kv",title:"Accepted methods",rows:[
      {label:"Cash (KHR)",on:true},{label:"KHQR",desc:"Via ABA PayWay",on:true},{label:"ABA / card (manual)",on:true},
      {label:"Bank transfer",on:false},{label:"Customer tab (B2B)",on:true},{label:"Split payment",on:true},{label:"Store credit",on:false},
    ]},
    {type:"kv",title:"Gateway configuration",rows:[
      {label:"ABA PayWay",value:"Connected"},{label:"KHQR merchant",value:"Sok Laundry"},{label:"Settlement",value:"Next business day"},
    ]},
  ]},
  "store:POS Devices & Registers":{title:"POS Devices & Registers",subtitle:"Terminals, printers and the Store Hub paired to this store",action:"Pair device",freshness:"Hub online · heartbeat 12s ago",sections:[
    {type:"table",title:"Registered devices",cols:[{label:"Device"},{label:"Type"},{label:"Register"},{label:"Last seen"},{label:"Status"}],rows:[
      [{t:"Store Hub",strong:true,sub:"Raspberry Pi 5 · NVMe"},"Hub","—","12s ago",{t:"Online",badge:true,tone:"ok"}],
      [{t:"Counter T1",strong:true,sub:"POS Desktop"},"POS","REG-01","Just now",{t:"Online",badge:true,tone:"ok"}],
      [{t:"Roaming iPad",strong:true,sub:"POS Mobile"},"POS","REG-02","3m ago",{t:"Online",badge:true,tone:"ok"}],
      [{t:"Receipt printer",strong:true,sub:"ESC/POS"},"Printer","REG-01","Just now",{t:"Ready",badge:true,tone:"ok"}],
      [{t:"Tag printer",strong:true,sub:"TSPL"},"Printer","REG-01","1m ago",{t:"Ready",badge:true,tone:"ok"}],
      [{t:"USB scale",strong:true,sub:"Per-kg intake"},"Scale","REG-01","Just now",{t:"Ready",badge:true,tone:"ok"}],
    ]},
  ]},
  "store:Notifications":{title:"Notifications",subtitle:"Message triggers sent to customers and staff via Telegram / SMS",action:"Add trigger",sections:[
    {type:"table",title:"Notification triggers",cols:[{label:"Trigger"},{label:"Channel"},{label:"Sent (7d)",align:"right"},{label:"Status"}],rows:[
      [{t:"Order ready for pickup"},"Telegram",{t:"128",align:"right"},{t:"On",badge:true,tone:"ok"}],
      [{t:"Late pickup reminder"},"Telegram",{t:"42",align:"right"},{t:"On",badge:true,tone:"ok"}],
      [{t:"Payment reminder (balance)"},"Telegram / SMS",{t:"19",align:"right"},{t:"On",badge:true,tone:"ok"}],
      [{t:"Issue / damaged notice"},"Telegram",{t:"3",align:"right"},{t:"On",badge:true,tone:"ok"}],
      [{t:"B2B statement reminder"},"Email",{t:"4",align:"right"},{t:"On",badge:true,tone:"ok"}],
      [{t:"Promo campaign"},"Telegram",{t:"0",align:"right"},{t:"Off",badge:true,tone:"neutral"}],
    ]},
  ]},
  "store:Language & Currency":{title:"Language & Currency",subtitle:"Localization — Khmer-first, KHR integer money",action:"Edit",sections:[
    {type:"kv",title:"Locale",rows:[
      {label:"Primary language",value:"ខ្មែរ Khmer"},{label:"Secondary language",value:"English"},
      {label:"Currency",value:"KHR ៛ · integer, no decimals"},{label:"Date format",value:"DD/MM/YYYY"},{label:"Phone format",value:"+855 …"},
    ]},
  ]},
  "store:Data Import / Export":{title:"Data Import / Export",subtitle:"Bulk import services, customers and suppliers · export store data",sections:[
    {type:"list",title:"Import",items:[
      {title:"Services & pricing (CSV)",meta:"Bulk create or update the service catalog",badge:"Import",tone:"info",dot:"info"},
      {title:"Customers (CSV)",meta:"Names, phones, tiers, B2B accounts",badge:"Import",tone:"info",dot:"info"},
      {title:"Suppliers & items (CSV)",meta:"Inventory master data",badge:"Import",tone:"info",dot:"info"},
    ]},
    {type:"list",title:"Export",items:[
      {title:"Full store export (CSV/JSON)",meta:"Services, customers, settings — UTF-8, Khmer-safe",badge:"Export",tone:"ok",dot:"ok"},
    ]},
  ]},
});
Object.assign(GENERIC, {
  "supplies:Stock Receipts":{title:"Stock Receipts",subtitle:"Received supplies — posting a receipt creates purchase_received movements and updates stock",action:"Receive stock",freshness:"Synced 2m ago",sections:[
    {type:"table",title:"Recent receipts",cols:[{label:"Receipt"},{label:"PO"},{label:"Supplier"},{label:"Items"},{label:"Date"},{label:"Status"}],rows:[
      [{t:"GRN-058",mono:true,strong:true},"PO-0241","Angkor Packaging","Bags 500 · Tags 20",{t:"28 Jun"},{t:"Posted",badge:true,tone:"ok"}],
      [{t:"GRN-057",mono:true,strong:true},"PO-0239","Khmer Fragrance Co","Fragrance 12 L",{t:"21 Jun"},{t:"Posted",badge:true,tone:"ok"}],
      [{t:"GRN-056",mono:true,strong:true},"PO-0240","Mekong Chem Supply","Stain remover 12/24",{t:"3 Jul"},{t:"Partial",badge:true,tone:"warn"}],
      [{t:"GRN-055",mono:true,strong:true},"PO-0243","Mekong Chem Supply","Detergent 60 L · Softener 40 L",{t:"Awaiting",align:"left"},{t:"Expected",badge:true,tone:"info"}],
    ]},
    {type:"note",text:"Receipts are immutable once posted. A wrong receipt is corrected with a reversal movement, never edited."},
  ]},
  "supplies:Transfer Orders":{title:"Transfer Orders",subtitle:"Stock movements between stores · this store's transfers only",action:"New transfer",sections:[
    {type:"table",title:"Transfers",cols:[{label:"Transfer"},{label:"Direction"},{label:"Item"},{label:"Qty",align:"right"},{label:"Status"}],rows:[
      [{t:"TR-014",mono:true,strong:true},"Out → Riverside branch","Detergent (liquid)",{t:"10 L",align:"right"},{t:"Sent",badge:true,tone:"info"}],
      [{t:"TR-013",mono:true,strong:true},"In ← Central warehouse","Hangers",{t:"500 pcs",align:"right"},{t:"Received",badge:true,tone:"ok"}],
      [{t:"TR-012",mono:true,strong:true},"Out → Riverside branch","Garment bags",{t:"200 pcs",align:"right"},{t:"Cancelled",badge:true,tone:"danger"}],
    ]},
    {type:"note",text:"Cross-store rollups and approvals are owned by Chain Portal. Partner Portal shows only current-store transfers."},
  ]},
  "supplies:Production / Mixing / Bundles":{title:"Production / Mixing / Bundles",subtitle:"Produce inventory items from component inputs — stain mixes, wash kits",action:"New production run",sections:[
    {type:"table",title:"Recipes",cols:[{label:"Output item"},{label:"Inputs"},{label:"Yield",align:"right"},{label:"Last run"}],rows:[
      [{t:"Stain-treat mix",strong:true},"Stain remover + solvent + water",{t:"5 L",align:"right"},"2 Jul"],
      [{t:"Wash starter kit",strong:true},"Detergent 200ml + bag + tag",{t:"1 kit",align:"right"},"Yesterday"],
      [{t:"Delicate wash blend",strong:true},"Mild detergent + softener",{t:"3 L",align:"right"},"29 Jun"],
    ]},
    {type:"note",text:"Producing consumes component stock (production_input_consumed) and creates output stock (production_output_created) as linked movements."},
  ]},
  "supplies:Inventory Valuation":{title:"Inventory Valuation",subtitle:"Stock value by category · average-cost method",freshness:"Synced 2m ago",kpis:[
    {label:"Total stock value",value:khr(2148000),sub:"46 tracked items"},
    {label:"Chemicals",value:khr(1042000),sub:"49% of value"},
    {label:"Packaging",value:khr(712000),sub:"33% of value"},
    {label:"Printing supplies",value:khr(394000),sub:"18% of value"},
  ],sections:[
    {type:"table",title:"Valuation by category",cols:[{label:"Category"},{label:"Items",align:"right"},{label:"Qty value",align:"right"},{label:"% of total",align:"right"}],rows:[
      ["Detergent & chemicals",{t:"14",align:"right"},{t:khr(1042000),align:"right",strong:true},{t:"49%",align:"right"}],
      ["Packaging (bags, hangers)",{t:"18",align:"right"},{t:khr(712000),align:"right",strong:true},{t:"33%",align:"right"}],
      ["Printing (rolls, labels)",{t:"9",align:"right"},{t:khr(394000),align:"right",strong:true},{t:"18%",align:"right"}],
    ]},
    {type:"note",text:"Cost fields are permission-gated — cashiers and laundry staff do not see valuation."},
  ]},
  "supplies:Label Printing":{title:"Label Printing",subtitle:"Barcode/QR labels for inventory items — distinct from customer laundry tags",action:"Print labels",sections:[
    {type:"kv",title:"Label settings",rows:[
      {label:"Label type",value:"Barcode + item name"},{label:"Size",value:"50 × 25 mm"},{label:"Printer",value:"TSPL label printer"},
    ]},
    {type:"list",title:"Recent label batches",items:[
      {title:"Detergent (liquid) · 12 labels",meta:"Today 09:10 · Het Sovannara",badge:"Printed",tone:"ok",dot:"ok"},
      {title:"Hangers · 40 labels",meta:"Yesterday · Maly Sok",badge:"Printed",tone:"ok",dot:"ok"},
    ]},
  ]},
  "supplies:Import / Export":{title:"Inventory Import / Export",subtitle:"Bulk item master data and movement history",sections:[
    {type:"list",title:"Actions",items:[
      {title:"Import items & opening stock (CSV)",meta:"Creates items + opening_balance movements",badge:"Import",tone:"info",dot:"info"},
      {title:"Export movement ledger (CSV)",meta:"Immutable audit trail · date-ranged",badge:"Export",tone:"ok",dot:"ok"},
      {title:"Export valuation snapshot (CSV)",meta:"Permission-gated cost fields",badge:"Export",tone:"ok",dot:"ok"},
    ]},
  ]},
  "supplies:AI Reorder Suggestions":{title:"AI Reorder Suggestions",subtitle:"KitLuy AI forecasts reorder timing from usage trends",action:"Create POs",freshness:"KitLuy AI · generated 10m ago",kpis:[
    {label:"Items below reorder point",value:"3",sub:"1 critical"},
    {label:"Suggested spend",value:khr(977000),sub:"across 3 suppliers"},
    {label:"Avg days cover left",value:"5.6",sub:"detergent lowest"},
  ],sections:[
    {type:"table",title:"Suggested reorders",tag:"92% confidence",tagTone:"purple",cols:[{label:"Item"},{label:"Days cover",align:"right"},{label:"Suggest qty",align:"right"},{label:"Supplier"},{label:"Est. cost",align:"right"}],rows:[
      [{t:"Detergent (liquid)",strong:true},{t:"3",align:"right"},{t:"60 L",align:"right"},"Mekong Chem Supply",{t:khr(552000),align:"right"}],
      [{t:"Hangers",strong:true},{t:"6",align:"right"},{t:"1,000 pcs",align:"right"},"CleanPro Cambodia",{t:khr(240000),align:"right"}],
      [{t:"Garment bags",strong:true},{t:"9",align:"right"},{t:"500 pcs",align:"right"},"Angkor Packaging",{t:khr(185000),align:"right"}],
    ]},
    {type:"note",text:"Suggestions never auto-purchase. Review and create draft purchase orders — approval workflow still applies."},
  ]},
  "supplies:Approval Workflow":{title:"Approval Workflow",subtitle:"High-value adjustments and count variances that need a manager sign-off",action:"Set thresholds",sections:[
    {type:"table",title:"Pending approvals",cols:[{label:"Request"},{label:"Item"},{label:"Impact",align:"right"},{label:"Requested by"},{label:"Status"}],rows:[
      [{t:"Adjustment −",sub:"Damage write-off"},"Detergent (liquid)",{t:"−"+khr(46000),align:"right"},"Maly Sok",{t:"Pending",badge:true,tone:"warn"}],
      [{t:"Count variance",sub:"C-018 recount"},"Stain remover",{t:"−"+khr(36000),align:"right"},"Het Sovannara",{t:"Approved",badge:true,tone:"ok"}],
    ]},
    {type:"kv",title:"Thresholds",rows:[
      {label:"Adjustment needs approval above",value:khr(40000)},{label:"Count variance needs approval above",value:khr(30000)},{label:"Reason code required",on:true},
    ]},
  ]},
});
Object.assign(GENERIC, {
  "team:Overview":{title:"Employee Management",subtitle:"Overview — staff, access, time and accountability for Sok Laundry",freshness:"Synced 2m ago",kpis:[
    {label:"Active employees",value:"7",sub:"2 cashiers · 3 laundry"},
    {label:"On shift now",value:"4",sub:"across 3 stations"},
    {label:"Hours today",value:"31h",sub:"clocked so far"},
    {label:"Pending approvals",value:"2",up:false,sub:"1 refund · 1 time card"},
  ],sections:[
    {type:"list",title:"On shift now",items:[
      {title:"Maly Sok · Manager",meta:"07:00 – 15:00 · Front counter",badge:"On shift",tone:"ok",dot:"ok"},
      {title:"Dara Chan · Cashier",meta:"07:00 – 15:00 · Counter T1",badge:"On shift",tone:"ok",dot:"ok"},
      {title:"Sreyneang Kim · Washing",meta:"06:30 – 14:30 · Wash 1–2",badge:"On shift",tone:"ok",dot:"ok"},
      {title:"Vibol Chea · Ironing",meta:"08:00 – 16:00 · Press",badge:"On shift",tone:"ok",dot:"ok"},
    ]},
    {type:"list",title:"Needs attention",items:[
      {title:"Refund request awaiting approval",meta:"KIT-4830 · ៛20,000 · requested by Dara Chan",badge:"Approve",tone:"warn",dot:"warn"},
      {title:"Missing clock-out — yesterday",meta:"Rith Pov · time card needs adjustment",badge:"Review",tone:"warn",dot:"warn"},
    ]},
  ]},
  "team:Roles & Access":{title:"Roles & Access",subtitle:"Permission bundles — POS and Partner Portal capabilities per role",action:"New role",sections:[
    {type:"table",title:"Roles",cols:[{label:"Role"},{label:"Members",align:"right"},{label:"Key permissions"}],rows:[
      [{t:"Partner Owner",strong:true},{t:"1",align:"right"},"Full access · finance settings · exports"],
      [{t:"Store Manager",strong:true},{t:"1",align:"right"},"Daily ops · staff · threshold approvals"],
      [{t:"Supervisor",strong:true},{t:"1",align:"right"},"Production oversight · limited approvals"],
      [{t:"Accountant",strong:true},{t:"1",align:"right"},"Finance · reports · exports · no POS approvals"],
      [{t:"Cashier",strong:true},{t:"2",align:"right"},"POS intake · payment · receipt/tag"],
      [{t:"Laundry Staff",strong:true},{t:"2",align:"right"},"Status updates · issue reporting · scan"],
      [{t:"Read-only",strong:true},{t:"0",align:"right"},"View only, if granted"],
    ]},
  ]},
  "team:POS PIN Access":{title:"POS PIN Access",subtitle:"4–6 digit staff PINs verified by the Store Hub · raw PIN is never stored or shown",action:"Reset PIN",sections:[
    {type:"table",title:"PIN status",cols:[{label:"Employee"},{label:"PIN"},{label:"Last used"},{label:"Failed"},{label:"Status"}],rows:[
      [{t:"Maly Sok",strong:true,sub:"Manager"},{t:"•••• ••",mono:true},"Just now",{t:"0"},{t:"Active",badge:true,tone:"ok"}],
      [{t:"Dara Chan",strong:true,sub:"Cashier"},{t:"•••• ••",mono:true},"12m ago",{t:"0"},{t:"Active",badge:true,tone:"ok"}],
      [{t:"Rith Pov",strong:true,sub:"Cashier"},{t:"•••• ••",mono:true},"Yesterday",{t:"3"},{t:"Active",badge:true,tone:"ok"}],
      [{t:"Sreyneang Kim",strong:true,sub:"Washing"},{t:"•••• ••",mono:true},"2h ago",{t:"5"},{t:"Locked",badge:true,tone:"danger"}],
    ]},
    {type:"note",text:"PIN locks after 5 failed attempts. Unlock/reset requires owner or manager and is audited. PINs sync to the Store Hub cache for offline POS login."},
  ]},
  "team:Time Clock":{title:"Time Clock",subtitle:"Attendance clock-in/out — separate from POS shift",freshness:"Synced 2m ago",sections:[
    {type:"table",title:"Today",cols:[{label:"Employee"},{label:"Clock in"},{label:"Clock out"},{label:"Worked"},{label:"Status"}],rows:[
      [{t:"Sreyneang Kim",strong:true},"06:28","—",{t:"5h 32m"},{t:"On time",badge:true,tone:"ok"}],
      [{t:"Maly Sok",strong:true},"06:52","—",{t:"5h 08m"},{t:"On time",badge:true,tone:"ok"}],
      [{t:"Dara Chan",strong:true},"07:04","—",{t:"4h 56m"},{t:"Late 4m",badge:true,tone:"warn"}],
      [{t:"Vibol Chea",strong:true},"07:58","—",{t:"4h 02m"},{t:"On time",badge:true,tone:"ok"}],
    ]},
  ]},
  "team:Time Cards":{title:"Time Cards",subtitle:"Reviewable attendance for approval, adjustment and payroll prep",action:"Approve all",sections:[
    {type:"table",title:"This week",cols:[{label:"Employee"},{label:"Regular",align:"right"},{label:"Overtime",align:"right"},{label:"Total",align:"right"},{label:"Status"}],rows:[
      [{t:"Maly Sok",strong:true},{t:"46h",align:"right"},{t:"2h",align:"right"},{t:"48h",align:"right",strong:true},{t:"Approved",badge:true,tone:"ok"}],
      [{t:"Dara Chan",strong:true},{t:"44h",align:"right"},{t:"0h",align:"right"},{t:"44h",align:"right",strong:true},{t:"Approved",badge:true,tone:"ok"}],
      [{t:"Rith Pov",strong:true},{t:"40h",align:"right"},{t:"1h",align:"right"},{t:"41h",align:"right",strong:true},{t:"Needs review",badge:true,tone:"warn"}],
      [{t:"Sreyneang Kim",strong:true},{t:"42h",align:"right"},{t:"3h",align:"right"},{t:"45h",align:"right",strong:true},{t:"Pending",badge:true,tone:"neutral"}],
    ]},
    {type:"note",text:"Adjustments are append-only — the original clocked value is retained with the new value and a reason."},
  ]},
  "team:Shifts":{title:"Shifts",subtitle:"POS operating periods — cashier, float, expected vs counted cash",freshness:"Synced 2m ago",sections:[
    {type:"table",title:"Today",cols:[{label:"Employee"},{label:"Role"},{label:"Time"},{label:"Station"},{label:"Status"}],rows:[
      [{t:"Maly Sok",strong:true},"Manager","07:00 – 15:00","Front counter",{t:"On shift",badge:true,tone:"ok"}],
      [{t:"Dara Chan",strong:true},"Cashier","07:00 – 15:00","Counter T1",{t:"On shift",badge:true,tone:"ok"}],
      [{t:"Sreyneang Kim",strong:true},"Washing","06:30 – 14:30","Wash 1–2",{t:"On shift",badge:true,tone:"ok"}],
      [{t:"Rith Pov",strong:true},"Cashier","13:00 – 21:00","Counter T1",{t:"Upcoming",badge:true,tone:"neutral"}],
    ]},
  ]},
  "team:Sales by Employee":{title:"Sales by Employee",subtitle:"Order and revenue contribution per staff member · this week",freshness:"Synced 2m ago",sections:[
    {type:"table",title:"Contribution",cols:[{label:"Employee"},{label:"Role"},{label:"Orders",align:"right"},{label:"Revenue",align:"right"},{label:"Hours",align:"right"}],rows:[
      [{t:"Maly Sok",strong:true},"Manager",{t:"118",align:"right"},{t:khr(3050000),align:"right",strong:true},{t:"46h",align:"right"}],
      [{t:"Dara Chan",strong:true},"Cashier",{t:"104",align:"right"},{t:khr(2710000),align:"right",strong:true},{t:"44h",align:"right"}],
      [{t:"Rith Pov",strong:true},"Cashier",{t:"94",align:"right"},{t:khr(2444000),align:"right",strong:true},{t:"41h",align:"right"}],
    ]},
  ]},
  "team:Workload by Hour":{title:"Workload by Hour",subtitle:"Order intake distribution across the day — staff against demand",sections:[
    {type:"table",title:"Today by hour",cols:[{label:"Hour"},{label:"Orders",align:"right"},{label:"Staff on",align:"right"},{label:"Load"}],rows:[
      ["07:00 – 09:00",{t:"9",align:"right"},{t:"3",align:"right"},{t:"Steady",badge:true,tone:"ok"}],
      ["09:00 – 11:00",{t:"14",align:"right"},{t:"4",align:"right"},{t:"Busy",badge:true,tone:"warn"}],
      ["11:00 – 13:00",{t:"8",align:"right"},{t:"3",align:"right"},{t:"Steady",badge:true,tone:"ok"}],
      ["13:00 – 15:00",{t:"6",align:"right"},{t:"4",align:"right"},{t:"Quiet",badge:true,tone:"neutral"}],
      ["15:00 – 18:00",{t:"10",align:"right"},{t:"3",align:"right"},{t:"Steady",badge:true,tone:"ok"}],
    ]},
    {type:"note",text:"Mornings are your peak. KitLuy AI Staffing suggests moving one cashier earlier — see AI Staffing Recommendation."},
  ]},
  "team:Attendance":{title:"Attendance",subtitle:"Clock-in punctuality and worked hours",sections:[
    {type:"table",title:"Recent",cols:[{label:"Employee"},{label:"Date"},{label:"In"},{label:"Out"},{label:"Worked"},{label:"Status"}],rows:[
      [{t:"Sreyneang Kim",strong:true},"Today","06:28","—",{t:"5h 32m"},{t:"On time",badge:true,tone:"ok"}],
      [{t:"Dara Chan",strong:true},"Today","07:04","—",{t:"4h 56m"},{t:"Late 4m",badge:true,tone:"warn"}],
      [{t:"Rith Pov",strong:true},"Yesterday","12:55","21:02",{t:"8h 07m"},{t:"On time",badge:true,tone:"ok"}],
      [{t:"Maly Sok",strong:true},"Yesterday","06:58","15:10",{t:"8h 12m"},{t:"On time",badge:true,tone:"ok"}],
    ]},
  ]},
  "team:Approvals":{title:"Approvals",subtitle:"Sensitive actions requiring manager/owner sign-off with a reason",sections:[
    {type:"table",title:"Pending & recent",cols:[{label:"Action"},{label:"Detail"},{label:"Requested by"},{label:"Approver"},{label:"Status"}],rows:[
      [{t:"Refund",strong:true},"KIT-4830 · ៛20,000 · damaged","Dara Chan","—",{t:"Pending",badge:true,tone:"warn"}],
      [{t:"High discount",strong:true},"KIT-4827 · 25% B2B","Rith Pov","Maly Sok",{t:"Approved",badge:true,tone:"ok"}],
      [{t:"Tag reprint",strong:true},"KIT-4821 · 3rd reprint","Dara Chan","Maly Sok",{t:"Approved",badge:true,tone:"ok"}],
      [{t:"Void",strong:true},"KIT-4810 · ៛18,000","Rith Pov","Maly Sok",{t:"Approved",badge:true,tone:"ok"}],
    ]},
  ]},
  "team:Activity Log":{title:"Activity Log",subtitle:"Who did what — PIN sessions, status changes, approvals, reprints",freshness:"Synced 2m ago",sections:[
    {type:"list",title:"Recent staff activity",items:[
      {title:"Maly Sok approved a refund",meta:"KIT-4830 · ៛20,000 · reason: damaged garment · 10:41",dot:"warn"},
      {title:"Dara Chan created order KIT-4832",meta:"Wash & Fold 7.8kg · KHQR · 10:38",dot:"ok"},
      {title:"Sreyneang Kim moved KIT-4823 → Washing",meta:"Inventory usage deducted · 10:22",dot:"info"},
      {title:"Rith Pov opened POS shift",meta:"Counter T1 · float ៛100,000 · 09:00",dot:"neutral"},
    ]},
  ]},
  "team:Scheduling":{title:"Scheduling",subtitle:"Weekly staff roster",action:"Edit roster",sections:[
    {type:"table",title:"This week",cols:[{label:"Employee"},{label:"Mon–Fri"},{label:"Sat"},{label:"Sun"}],rows:[
      [{t:"Maly Sok",strong:true},"07:00–15:00","08:00–16:00","Off"],
      [{t:"Dara Chan",strong:true},"07:00–15:00","Off","08:00–16:00"],
      [{t:"Rith Pov",strong:true},"13:00–21:00","13:00–21:00","Off"],
      [{t:"Sreyneang Kim",strong:true},"06:30–14:30","06:30–14:30","Off"],
    ]},
  ]},
  "team:Payroll Export":{title:"Payroll Export",subtitle:"Approved hours packaged for payroll — Partner Portal is not a payroll engine",action:"Export period",sections:[
    {type:"table",title:"Pay periods",cols:[{label:"Period"},{label:"Employees",align:"right"},{label:"Hours",align:"right"},{label:"Status"}],rows:[
      [{t:"1–15 Jun",strong:true},{t:"7",align:"right"},{t:"612h",align:"right"},{t:"Exported",badge:true,tone:"ok"}],
      [{t:"16–30 Jun",strong:true},{t:"7",align:"right"},{t:"598h",align:"right"},{t:"Ready",badge:true,tone:"info"}],
      [{t:"1–15 Jul",strong:true},{t:"7",align:"right"},{t:"in progress",align:"right"},{t:"Open",badge:true,tone:"neutral"}],
    ]},
  ]},
  "team:Labor Cost":{title:"Labor Cost",subtitle:"Estimated labor against sales — operational estimate, not payroll",kpis:[
    {label:"Labor cost (est, wk)",value:khr(1680000),sub:"7 staff"},
    {label:"% of net sales",value:"20.5%",up:false,sub:"target < 22%"},
    {label:"Cost / order",value:khr(5300),sub:"316 orders"},
  ],sections:[
    {type:"table",title:"By role",cols:[{label:"Role"},{label:"Hours",align:"right"},{label:"Est. cost",align:"right"},{label:"% of labor",align:"right"}],rows:[
      ["Manager",{t:"48h",align:"right"},{t:khr(480000),align:"right"},{t:"29%",align:"right"}],
      ["Cashiers",{t:"85h",align:"right"},{t:khr(595000),align:"right"},{t:"35%",align:"right"}],
      ["Laundry & press",{t:"132h",align:"right"},{t:khr(605000),align:"right"},{t:"36%",align:"right"}],
    ]},
  ]},
  "team:Overtime Rules":{title:"Overtime Rules",subtitle:"How overtime is detected and rated",action:"Edit",sections:[
    {type:"kv",title:"Rules",rows:[
      {label:"Daily overtime after",value:"8 hours"},{label:"Weekly overtime after",value:"48 hours"},{label:"Overtime rate",value:"1.5×"},
      {label:"Require manager approval",on:true},{label:"Alert on unplanned overtime",on:true},
    ]},
  ]},
  "team:Incentives":{title:"Incentives",subtitle:"Optional staff performance incentives",action:"New incentive",sections:[
    {type:"table",title:"Programs",cols:[{label:"Incentive"},{label:"Basis"},{label:"Reward",align:"right"},{label:"Status"}],rows:[
      [{t:"Upsell add-ons",strong:true},"Per add-on sold",{t:khr(500),align:"right"},{t:"Active",badge:true,tone:"ok"}],
      [{t:"Zero cash variance",strong:true},"Per clean shift",{t:khr(5000),align:"right"},{t:"Active",badge:true,tone:"ok"}],
      [{t:"On-time processing",strong:true},"Weekly target",{t:khr(20000),align:"right"},{t:"Paused",badge:true,tone:"neutral"}],
    ]},
  ]},
  "team:Training Checklist":{title:"Training Checklist",subtitle:"Onboarding and SOP completion per employee",sections:[
    {type:"table",title:"Progress",cols:[{label:"Employee"},{label:"Order intake"},{label:"Tag/receipt"},{label:"Refund SOP"},{label:"Overall"}],rows:[
      [{t:"Maly Sok",strong:true},{t:"Done",badge:true,tone:"ok"},{t:"Done",badge:true,tone:"ok"},{t:"Done",badge:true,tone:"ok"},{t:"100%",align:"left"}],
      [{t:"Dara Chan",strong:true},{t:"Done",badge:true,tone:"ok"},{t:"Done",badge:true,tone:"ok"},{t:"Pending",badge:true,tone:"warn"},{t:"80%"}],
      [{t:"Sreyneang Kim",strong:true},{t:"Done",badge:true,tone:"ok"},{t:"N/A",badge:true,tone:"neutral"},{t:"N/A",badge:true,tone:"neutral"},{t:"100%"}],
    ]},
  ]},
  "team:AI Staffing Recommendation":{title:"AI Staffing Recommendation",subtitle:"KitLuy AI suggests staffing from workload patterns",freshness:"KitLuy AI · generated 8m ago",sections:[
    {type:"note",text:"Mornings (09:00–11:00) are consistently your busiest window with 14 orders against 4 staff, while 13:00–15:00 is quiet. Shifting one cashier's start from 13:00 to 09:00 on weekdays could cut peak wait time ~25% with no added hours."},
    {type:"list",title:"Suggestions",items:[
      {title:"Move Rith Pov's start to 09:00 (Mon–Fri)",meta:"Covers the morning peak · same total hours",badge:"Apply",tone:"purple",dot:"purple"},
      {title:"Add a floating press shift Saturday",meta:"Saturday express queue overflow",badge:"Consider",tone:"neutral",dot:"neutral"},
    ]},
  ]},
});
Object.assign(GENERIC, {
  "finance:Sales Ledger":{title:"Sales Ledger",subtitle:"Order-linked finance ledger · gross, discounts, refunds, net, paid, balance",freshness:"As of 15:42 · synced",action:"Export",kpis:[
    {label:"Gross today",value:khr(1284000),sub:"47 orders"},
    {label:"Net sales",value:khr(1180000),sub:"after disc & refunds"},
    {label:"Collected",value:khr(1040000),sub:"81% collection rate"},
    {label:"Balance due",value:khr(140000),up:false,sub:"9 open orders"},
  ],sections:[
    {type:"table",title:"Orders",cols:[{label:"Order"},{label:"Customer"},{label:"Net",align:"right"},{label:"Paid",align:"right"},{label:"Balance",align:"right"},{label:"Status"}],rows:[
      [{t:"KIT-4832",mono:true},"Phalla Nuon",{t:khr(31200),align:"right"},{t:khr(31200),align:"right"},{t:khr(0),align:"right"},{t:"Paid",badge:true,tone:"ok"}],
      [{t:"KIT-4823",mono:true},"Lux Riverside Hotel",{t:khr(96000),align:"right"},{t:khr(0),align:"right"},{t:khr(96000),align:"right"},{t:"Tab open",badge:true,tone:"warn"}],
      [{t:"KIT-4821",mono:true},"Sophea Chan",{t:khr(24800),align:"right"},{t:khr(24800),align:"right"},{t:khr(0),align:"right"},{t:"Paid",badge:true,tone:"ok"}],
      [{t:"KIT-4824",mono:true},"Maly Sok",{t:khr(27000),align:"right"},{t:khr(13500),align:"right"},{t:khr(13500),align:"right"},{t:"Deposit",badge:true,tone:"info"}],
      [{t:"KIT-4830",mono:true},"Borey Heng",{t:khr(30000),align:"right"},{t:khr(30000),align:"right"},{t:"−"+khr(30000),align:"right"},{t:"Refunded",badge:true,tone:"danger"}],
    ]},
    {type:"note",text:"Every number is drillable to its order. Financial records are append-only — corrections create new rows referencing the original."},
  ]},
  "finance:Payment Ledger":{title:"Payment Ledger",subtitle:"All tenders — cash, KHQR, ABA, deposit, balance, tab, refund",freshness:"As of 15:42 · synced",action:"Export",sections:[
    {type:"table",title:"Payments today",cols:[{label:"Time"},{label:"Order"},{label:"Method"},{label:"Type"},{label:"Amount",align:"right"},{label:"Staff"}],rows:[
      ["10:42",{t:"KIT-4832",mono:true},"KHQR","Order payment",{t:khr(31200),align:"right"},"Dara Chan"],
      ["10:18",{t:"KIT-4825",mono:true},"Cash","Balance",{t:khr(6000),align:"right"},"Maly Sok"],
      ["09:55",{t:"KIT-4821",mono:true},"KHQR","Order payment",{t:khr(24800),align:"right"},"Dara Chan"],
      ["09:30",{t:"KIT-4830",mono:true},"Cash","Refund",{t:"−"+khr(30000),align:"right",strong:true},"Maly Sok"],
      ["09:12",{t:"KIT-4824",mono:true},"KHQR","Deposit",{t:khr(13500),align:"right"},"Dara Chan"],
    ]},
  ]},
  "finance:Cash Drawer":{title:"Cash Drawer",subtitle:"Register cash control — float, sales, in/out, counted, variance",freshness:"Shift SH-01 open",kpis:[
    {label:"Opening float",value:khr(100000),sub:"09:00 open"},
    {label:"Cash sales",value:khr(486000),sub:"18 orders"},
    {label:"Expected cash",value:khr(610000),sub:"float + sales − out"},
    {label:"Counted / variance",value:khr(600000),up:false,sub:"−"+khr(10000)+" variance"},
  ],sections:[
    {type:"table",title:"Cash movements",cols:[{label:"Time"},{label:"Type"},{label:"Note"},{label:"Amount",align:"right"}],rows:[
      ["09:00","Opening float","Shift SH-01 open · Rith Pov",{t:khr(100000),align:"right"}],
      ["11:20","Cash out","Petty — cleaning supplies",{t:"−"+khr(24000),align:"right"}],
      ["12:05","Cash refund","KIT-4830 damaged garment",{t:"−"+khr(30000),align:"right"}],
      ["15:40","Cash count","Manager count",{t:khr(600000),align:"right",strong:true}],
    ]},
    {type:"note",text:"Variance −៛10,000 flagged for review. expected_cash = opening_float + cash_sales + cash_in − cash_refunds − cash_out."},
  ]},
  "finance:Refunds & Voids":{title:"Refunds & Voids",subtitle:"Append-only corrections — reason and audit required",action:"New refund",sections:[
    {type:"table",title:"Refunds & voids",cols:[{label:"Order"},{label:"Type"},{label:"Amount",align:"right"},{label:"Reason"},{label:"Approver"},{label:"Status"}],rows:[
      [{t:"KIT-4830",mono:true},"Refund",{t:khr(30000),align:"right"},"Damaged garment","Maly Sok",{t:"Completed",badge:true,tone:"ok"}],
      [{t:"KIT-4810",mono:true},"Void",{t:khr(18000),align:"right"},"Duplicate order","Maly Sok",{t:"Completed",badge:true,tone:"ok"}],
      [{t:"KIT-4828",mono:true},"Partial refund",{t:khr(8000),align:"right"},"Rewash credit","—",{t:"Pending",badge:true,tone:"warn"}],
    ]},
    {type:"note",text:"A refund can never exceed the refundable balance. Paid-order voids route through refund/adjustment — the original payment row always remains."},
  ]},
  "finance:Deposits & Balances":{title:"Deposits & Balances",subtitle:"Orders with deposits taken and balances still owed",freshness:"As of 15:42 · synced",sections:[
    {type:"table",title:"Open balances",cols:[{label:"Order"},{label:"Customer"},{label:"Deposit",align:"right"},{label:"Balance due",align:"right"},{label:"Due"}],rows:[
      [{t:"KIT-4824",mono:true},"Maly Sok",{t:khr(13500),align:"right"},{t:khr(13500),align:"right",strong:true},"Today 6pm"],
      [{t:"KIT-4823",mono:true},"Lux Riverside Hotel",{t:khr(0),align:"right"},{t:khr(96000),align:"right",strong:true},"Tomorrow"],
      [{t:"KIT-4827",mono:true},"Serenity Spa",{t:khr(0),align:"right"},{t:khr(74000),align:"right",strong:true},"Tomorrow"],
    ]},
  ]},
  "finance:Customer Tabs":{title:"Customer Tabs",subtitle:"Pay-later balances — usually B2B / hotel / spa accounts",action:"Record payment",kpis:[
    {label:"Open tab balance",value:khr(2100000),sub:"3 accounts"},
    {label:"Overdue",value:khr(620000),up:false,sub:"1 account > 30d"},
    {label:"Settled this month",value:khr(4820000),sub:"on cycle"},
  ],sections:[
    {type:"table",title:"Tabs",cols:[{label:"Account"},{label:"Balance",align:"right"},{label:"Limit",align:"right"},{label:"Aging"},{label:"Status"}],rows:[
      [{t:"Lux Riverside Hotel",strong:true},{t:khr(1480000),align:"right"},{t:khr(2000000),align:"right"},"12 days",{t:"Current",badge:true,tone:"ok"}],
      [{t:"Serenity Spa",strong:true},{t:khr(620000),align:"right"},{t:khr(1000000),align:"right"},"34 days",{t:"Overdue",badge:true,tone:"danger"}],
    ]},
  ]},
  "finance:B2B Statements":{title:"B2B Statements",subtitle:"Periodic statements for business accounts with aging",action:"Generate statement",sections:[
    {type:"table",title:"Statements",cols:[{label:"Account"},{label:"Period"},{label:"Invoiced",align:"right"},{label:"Paid",align:"right"},{label:"Outstanding",align:"right"},{label:"Status"}],rows:[
      [{t:"Lux Riverside Hotel",strong:true},"Jun 2026",{t:khr(3200000),align:"right"},{t:khr(1720000),align:"right"},{t:khr(1480000),align:"right",strong:true},{t:"Sent",badge:true,tone:"info"}],
      [{t:"Serenity Spa",strong:true},"Jun 2026",{t:khr(1420000),align:"right"},{t:khr(800000),align:"right"},{t:khr(620000),align:"right",strong:true},{t:"Overdue",badge:true,tone:"danger"}],
    ]},
  ]},
  "finance:Payouts":{title:"Payouts",subtitle:"Electronic settlement visibility from the payment gateway",freshness:"ABA PayWay · last settlement 08:10",sections:[
    {type:"table",title:"Settlements",cols:[{label:"Date"},{label:"Provider"},{label:"Gross",align:"right"},{label:"Fee",align:"right"},{label:"Net",align:"right"},{label:"Status"}],rows:[
      ["3 Jul","ABA PayWay",{t:khr(548000),align:"right"},{t:"−"+khr(6600),align:"right"},{t:khr(541400),align:"right",strong:true},{t:"Settled",badge:true,tone:"ok"}],
      ["2 Jul","ABA PayWay",{t:khr(612000),align:"right"},{t:"−"+khr(7300),align:"right"},{t:khr(604700),align:"right",strong:true},{t:"Settled",badge:true,tone:"ok"}],
      ["Today","ABA PayWay",{t:khr(392000),align:"right"},{t:"pending",align:"right"},{t:"pending",align:"right"},{t:"Pending",badge:true,tone:"warn"}],
    ]},
  ]},
  "finance:Documents":{title:"Documents",subtitle:"Receipts and invoices generated for orders",sections:[
    {type:"table",title:"Recent documents",cols:[{label:"Document"},{label:"Type"},{label:"Order"},{label:"Date"}],rows:[
      [{t:"RCP-4832",mono:true},"Receipt",{t:"KIT-4832",mono:true},"Today 10:42"],
      [{t:"INV-0044",mono:true},"B2B invoice",{t:"Lux Riverside",mono:true},"1 Jul"],
      [{t:"RCP-4830",mono:true},"Refund receipt",{t:"KIT-4830",mono:true},"Today 09:30"],
    ]},
  ]},
  "finance:Taxes & Fees":{title:"Taxes & Fees",subtitle:"Configurable summary only — formal tax filing belongs to a future ERP/accounting integration",action:"Configure",sections:[
    {type:"kv",title:"Tax configuration",rows:[
      {label:"VAT applied",desc:"Placeholder — no formal filing engine",on:false},{label:"Service charge",on:false},{label:"Rounding",value:"Nearest ៛100"},
    ]},
    {type:"note",text:"MVP has tax/fee placeholders only. General ledger, tax filing and compliance are owned by future ERP/SroulERP or accounting integration."},
  ]},
  "finance:Expenses":{title:"Expenses",subtitle:"Simple store expense log for profit estimate — not formal accounting",action:"Add expense",kpis:[
    {label:"Expenses this month",value:khr(1240000),up:false,sub:"18 entries"},
    {label:"Supplies",value:khr(720000),sub:"58%"},
    {label:"Utilities",value:khr(320000),sub:"26%"},
  ],sections:[
    {type:"table",title:"Recent expenses",cols:[{label:"Date"},{label:"Category"},{label:"Note"},{label:"Amount",align:"right"},{label:"By"}],rows:[
      ["Today","Supplies","Detergent restock PO-0243",{t:khr(864000),align:"right"},"Het Sovannara"],
      ["2 Jul","Utilities","Electricity — June",{t:khr(180000),align:"right"},"Het Sovannara"],
      ["1 Jul","Maintenance","Press machine service",{t:khr(90000),align:"right"},"Maly Sok"],
    ]},
  ]},
  "finance:Profitability":{title:"Profitability",subtitle:"Operational profit estimate — not a formal P&L",freshness:"As of 15:42 · synced",kpis:[
    {label:"Net sales (wk)",value:khr(8204000),sub:"316 orders"},
    {label:"Est. supplies",value:khr(1560000),up:false,sub:"19% of sales"},
    {label:"Expenses + fees",value:khr(1420000),up:false,sub:"labor est. separate"},
    {label:"Est. profit",value:khr(3544000),sub:"~43% margin"},
  ],sections:[
    {type:"note",text:"estimated_profit = net_sales − estimated_supplies − expenses − payment_fees − labor_estimate. This is an operational estimate to guide decisions, not formal accounting."},
  ]},
  "finance:Export Center":{title:"Export Center",subtitle:"Finance, sales and payment exports — audited and store-scoped",action:"New export",sections:[
    {type:"table",title:"Exports",cols:[{label:"Export"},{label:"Format"},{label:"Range"},{label:"Status"}],rows:[
      [{t:"Daily finance summary",strong:true},"CSV","3 Jul",{t:"Ready",badge:true,tone:"ok"}],
      [{t:"Payment ledger",strong:true},"CSV","1–3 Jul",{t:"Ready",badge:true,tone:"ok"}],
      [{t:"Sales by service",strong:true},"CSV","Jun 2026",{t:"Ready",badge:true,tone:"ok"}],
    ]},
    {type:"note",text:"Exports create a private, signed file and an audit event. Customer phone is masked for limited roles."},
  ]},
  "finance:Finance Alerts":{title:"Finance Alerts",subtitle:"Money-control alerts that need attention",sections:[
    {type:"list",title:"Active alerts",items:[
      {title:"Cash variance −៛10,000",meta:"Shift SH-01 · review count",badge:"Review",tone:"danger",dot:"danger"},
      {title:"Gateway payment pending > 10m",meta:"KHQR settlement delayed",badge:"Watch",tone:"warn",dot:"warn"},
      {title:"2 orders unreconciled",meta:"Missing payment/receipt link",badge:"Resolve",tone:"warn",dot:"warn"},
      {title:"1 B2B tab overdue",meta:"Serenity Spa · 34 days",badge:"Chase",tone:"danger",dot:"danger"},
    ]},
  ]},
  "finance:AI Finance Assistant":{title:"AI Finance Assistant",subtitle:"Ask KitLuy AI about your store's money — grounded in your ledgers",freshness:"KitLuy AI",sections:[
    {type:"note",text:"“Why is cash variance negative today?” — Cash variance is −៛10,000. The main contributors are one cash refund (KIT-4830, ៛30,000) and one petty cash-out (៛24,000). Counted cash is ៛600,000 against ៛610,000 expected. Review shift SH-01."},
    {type:"list",title:"Suggested actions",items:[
      {title:"Open shift SH-01 detail",meta:"Review cash movements",badge:"Open",tone:"purple",dot:"purple"},
      {title:"Run reconciliation",meta:"Clear today's checklist",badge:"Run",tone:"purple",dot:"purple"},
    ]},
  ]},
  "finance:ERP Export Prep":{title:"ERP Export Prep",subtitle:"Daily posting package for a future ERP/SroulERP connector — no MVP dependency",action:"Preview package",sections:[
    {type:"kv",title:"Daily posting package · 3 Jul",rows:[
      {label:"Gross sales",value:khr(1250000)},{label:"Discounts",value:"−"+khr(40000)},{label:"Refunds",value:"−"+khr(30000)},
      {label:"Net sales",value:khr(1180000)},{label:"Cash collected",value:khr(600000)},{label:"Electronic collected",value:khr(440000)},
      {label:"Customer tab increase",value:khr(140000)},{label:"Cash variance",value:"−"+khr(10000)},
    ]},
    {type:"note",text:"Idempotent by business date — the same day re-exports to the same package, never a duplicate posting. Finance never depends on ERP to operate."},
  ]},
});
Object.assign(GENERIC, {
  "reports:Overview":{title:"Reports",subtitle:"One-store business intelligence · operational and financial",freshness:"As of 15:42 · synced",kpis:[
    {label:"Gross revenue (wk)",value:khr(8204000),delta:"+9%",sub:"316 orders"},
    {label:"Avg order value",value:khr(25962),delta:"+3%",sub:"per paid order"},
    {label:"Rewash rate",value:"1.9%",up:false,sub:"6 rewashes"},
    {label:"On-time ready",value:"94%",delta:"+2%",sub:"vs due date"},
  ],sections:[
    {type:"list",title:"Report library",items:[
      {title:"Sales",meta:"Daily gross, discounts, net",dot:"info"},
      {title:"Orders & Due / Overdue",meta:"Volume, status mix, late pickups",dot:"info"},
      {title:"Payments & Shifts",meta:"Method mix, Z-reports, variance",dot:"info"},
      {title:"Staff & Services",meta:"Contribution, service mix",dot:"info"},
      {title:"Issues & Rewash · Consumables · Inventory",meta:"Quality and supply usage",dot:"info"},
    ]},
    {type:"note",text:"Every report shows a data-as-of timestamp and a sync-freshness banner so you know if POS/Hub data may be incomplete."},
  ]},
  "reports:Orders":{title:"Orders Report",subtitle:"Order volume and status mix",freshness:"As of 15:42 · synced",action:"Export",sections:[
    {type:"table",title:"By day",cols:[{label:"Day"},{label:"Orders",align:"right"},{label:"Ready",align:"right"},{label:"Cancelled",align:"right"}],rows:[
      ["Tue 16 Jun · today",{t:"47",align:"right"},{t:"41",align:"right"},{t:"1",align:"right"}],
      ["Mon 15 Jun",{t:"52",align:"right"},{t:"48",align:"right"},{t:"2",align:"right"}],
      ["Sun 14 Jun",{t:"45",align:"right"},{t:"42",align:"right"},{t:"0",align:"right"}],
      ["Sat 13 Jun",{t:"49",align:"right"},{t:"44",align:"right"},{t:"1",align:"right"}],
    ]},
  ]},
  "reports:Due & Overdue":{title:"Due & Overdue Report",subtitle:"Orders approaching or past their pickup date",action:"Export",sections:[
    {type:"table",title:"Attention",cols:[{label:"Order"},{label:"Customer"},{label:"Due"},{label:"Status"}],rows:[
      [{t:"KIT-4805",mono:true},"Chan Dara","2 days ago",{t:"Overdue",badge:true,tone:"danger"}],
      [{t:"KIT-4818",mono:true},"Serenity Spa","Today 3pm",{t:"Due soon",badge:true,tone:"warn"}],
      [{t:"KIT-4824",mono:true},"Maly Sok","Today 6pm",{t:"Due soon",badge:true,tone:"warn"}],
    ]},
  ]},
  "reports:Shifts":{title:"Shifts Report",subtitle:"Z-reports and cash variance by shift",freshness:"As of 15:42 · synced",action:"Export",sections:[
    {type:"table",title:"Shifts",cols:[{label:"Shift"},{label:"Cashier"},{label:"Orders",align:"right"},{label:"Cash",align:"right"},{label:"Variance",align:"right"},{label:"Status"}],rows:[
      [{t:"SH-01 · today"},"Maly Sok",{t:"29",align:"right"},{t:khr(312000),align:"right"},{t:khr(0),align:"right"},{t:"Closed",badge:true,tone:"ok"}],
      [{t:"SH-02 · today"},"Rith Pov",{t:"18",align:"right"},{t:khr(174000),align:"right"},{t:"−"+khr(2000),align:"right"},{t:"Open",badge:true,tone:"info"}],
      [{t:"SH-01 · Mon"},"Maly Sok",{t:"31",align:"right"},{t:khr(356000),align:"right"},{t:khr(0),align:"right"},{t:"Closed",badge:true,tone:"ok"}],
    ]},
  ]},
  "reports:Customers":{title:"Customers Report",subtitle:"Top customers and retention",action:"Export",sections:[
    {type:"table",title:"Top customers",cols:[{label:"Customer"},{label:"Type"},{label:"Orders",align:"right"},{label:"Lifetime",align:"right"}],rows:[
      [{t:"Lux Riverside Hotel",strong:true},"B2B",{t:"212",align:"right"},{t:khr(9840000),align:"right"}],
      [{t:"Phalla Nuon",strong:true},"B2C",{t:"140",align:"right"},{t:khr(5210000),align:"right"}],
      [{t:"Serenity Spa",strong:true},"B2B",{t:"96",align:"right"},{t:khr(4120000),align:"right"}],
    ]},
  ]},
  "reports:Consumables":{title:"Consumables Report",subtitle:"Supply usage deducted from laundry processing",freshness:"As of 15:42 · synced",action:"Export",sections:[
    {type:"table",title:"Usage this week",cols:[{label:"Item"},{label:"Used",align:"right"},{label:"Cost",align:"right"},{label:"Per order",align:"right"}],rows:[
      [{t:"Detergent (liquid)",strong:true},{t:"28.6 L",align:"right"},{t:khr(263000),align:"right"},{t:khr(832),align:"right"}],
      [{t:"Fabric softener",strong:true},{t:"7.2 L",align:"right"},{t:khr(56000),align:"right"},{t:khr(177),align:"right"}],
      [{t:"Garment bags",strong:true},{t:"316 pcs",align:"right"},{t:khr(117000),align:"right"},{t:khr(370),align:"right"}],
    ]},
  ]},
  "reports:Inventory":{title:"Inventory Report",subtitle:"Stock value and movement summary",action:"Export",sections:[
    {type:"table",title:"Summary",cols:[{label:"Metric"},{label:"Value",align:"right"}],rows:[
      ["Total stock value",{t:khr(2148000),align:"right",strong:true}],
      ["Items below reorder point",{t:"3",align:"right"}],
      ["Waste / loss this month",{t:khr(86400),align:"right"}],
      ["Movements this week",{t:"214",align:"right"}],
    ]},
  ]},
  "reports:Employee":{title:"Employee Report",subtitle:"Staff productivity and hours",action:"Export",sections:[
    {type:"table",title:"By employee",cols:[{label:"Employee"},{label:"Role"},{label:"Orders",align:"right"},{label:"Revenue",align:"right"},{label:"Hours",align:"right"}],rows:[
      [{t:"Maly Sok",strong:true},"Manager",{t:"118",align:"right"},{t:khr(3050000),align:"right"},{t:"46h",align:"right"}],
      [{t:"Dara Chan",strong:true},"Cashier",{t:"104",align:"right"},{t:khr(2710000),align:"right"},{t:"44h",align:"right"}],
      [{t:"Rith Pov",strong:true},"Cashier",{t:"94",align:"right"},{t:khr(2444000),align:"right"},{t:"41h",align:"right"}],
    ]},
  ]},
  "reports:Finance":{title:"Finance Report",subtitle:"Gross, net, collection and refund rates",freshness:"As of 15:42 · synced",action:"Export",kpis:[
    {label:"Gross (wk)",value:khr(8204000),sub:"316 orders"},
    {label:"Net sales",value:khr(7540000),sub:"after adj"},
    {label:"Collection rate",value:"88%",sub:"collected / net"},
    {label:"Refund rate",value:"0.6%",up:false,sub:"of gross"},
  ],sections:[
    {type:"table",title:"By day",cols:[{label:"Day"},{label:"Gross",align:"right"},{label:"Discounts",align:"right"},{label:"Net",align:"right"}],rows:[
      ["Tue 16 Jun",{t:khr(1284000),align:"right"},{t:khr(96000),align:"right"},{t:khr(1180000),align:"right",strong:true}],
      ["Mon 15 Jun",{t:khr(1340000),align:"right"},{t:khr(74000),align:"right"},{t:khr(1266000),align:"right",strong:true}],
      ["Sun 14 Jun",{t:khr(1180000),align:"right"},{t:khr(52000),align:"right"},{t:khr(1128000),align:"right",strong:true}],
    ]},
  ]},
  "reports:Exports":{title:"Exports",subtitle:"Report export jobs — audited and store-scoped",sections:[
    {type:"table",title:"Export jobs",cols:[{label:"Report"},{label:"Format"},{label:"Rows",align:"right"},{label:"Status"}],rows:[
      [{t:"Daily sales",strong:true},"CSV",{t:"47",align:"right"},{t:"Ready",badge:true,tone:"ok"}],
      [{t:"Payments",strong:true},"CSV",{t:"52",align:"right"},{t:"Ready",badge:true,tone:"ok"}],
      [{t:"Consumables",strong:true},"CSV",{t:"46",align:"right"},{t:"Running",badge:true,tone:"info"}],
    ]},
  ]},
  "reports:Presets":{title:"Report Presets",subtitle:"Saved report filters for reuse — presets do not grant extra permission",action:"New preset",sections:[
    {type:"table",title:"Saved presets",cols:[{label:"Preset"},{label:"Report"},{label:"Default"}],rows:[
      [{t:"Daily owner review",strong:true},"Sales","Yes"],
      [{t:"B2B monthly",strong:true},"Customers","No"],
      [{t:"Supply spend",strong:true},"Consumables","No"],
    ]},
  ]},
  "reports:AI Summary":{title:"AI Summary",subtitle:"KitLuy AI plain-language read of your store data",freshness:"KitLuy AI · generated 6m ago",sections:[
    {type:"note",text:"This week Sok Laundry ran 316 orders for ៛8.2M gross (+9% vs last week), driven by Wash & Fold and a strong Saturday. Rewash rate fell to 1.9%. Two watch-items: cash variance −៛10,000 today, and Serenity Spa's tab is 34 days overdue (៛620,000). Mornings remain your capacity bottleneck."},
    {type:"list",title:"Recommended next steps",items:[
      {title:"Chase Serenity Spa statement",meta:"Overdue B2B tab",badge:"Finance",tone:"purple",dot:"purple"},
      {title:"Shift a cashier to the morning peak",meta:"Cut wait time ~25%",badge:"Staffing",tone:"purple",dot:"purple"},
    ]},
  ]},
});
Object.assign(GENERIC, {
  "b2b":{title:"B2B Accounts",subtitle:"Business customers with credit limits, settlement cycles and statements",action:"New account",kpis:[
    {label:"B2B accounts",value:"2",sub:"hotel · spa"},
    {label:"Open tab balance",value:khr(2100000),sub:"across accounts"},
    {label:"MTD B2B revenue",value:khr(4820000),delta:"+14%",sub:"37% of revenue"},
  ],sections:[
    {type:"table",title:"Accounts",cols:[{label:"Account"},{label:"Contact"},{label:"Tab balance",align:"right"},{label:"Limit",align:"right"},{label:"Terms"},{label:"Status"}],rows:[
      [{t:"Lux Riverside Hotel",strong:true,sub:"212 orders"},"+855 23 880 100",{t:khr(1480000),align:"right"},{t:khr(2000000),align:"right"},"Net 15",{t:"Current",badge:true,tone:"ok"}],
      [{t:"Serenity Spa",strong:true,sub:"96 orders"},"+855 23 214 880",{t:khr(620000),align:"right"},{t:khr(1000000),align:"right"},"Net 30",{t:"Overdue",badge:true,tone:"danger"}],
    ]},
    {type:"note",text:"B2B tabs, statements and aging live in Finance. This page manages the account relationship — contacts, credit limit and settlement terms."},
  ]},
  "security":{title:"Security",subtitle:"Authentication, access and data protection for this store",action:"Edit policy",sections:[
    {type:"kv",title:"Access & authentication",rows:[
      {label:"Owner/manager 2-factor auth",on:true},
      {label:"POS PIN length",value:"4–6 digits"},
      {label:"PIN lockout after",value:"5 failed attempts"},
      {label:"Portal session timeout",value:"30 min idle"},
      {label:"Mask customer phone for limited roles",on:true},
    ]},
    {type:"kv",title:"Data protection",rows:[
      {label:"Row-Level Security (store scope)",desc:"Every query scoped to this store",on:true},
      {label:"Encryption in transit",value:"TLS 1.3"},
      {label:"Private file storage",desc:"Signed URLs only",on:true},
      {label:"PIN storage",value:"Argon2id hash · never raw"},
    ]},
    {type:"note",text:"Support access is HET-mediated, time-limited and fully audited with a reason."},
  ]},
  "audit":{title:"Audit Log",subtitle:"Append-only record of sensitive actions across the store",action:"Export",freshness:"As of 15:42 · synced",sections:[
    {type:"table",title:"Recent events",grid:"0.55fr 0.95fr 1.7fr 0.9fr 0.75fr",cols:[{label:"Time"},{label:"Actor"},{label:"Event"},{label:"Target"},{label:"Impact",align:"right"}],rows:[
      ["10:41",{t:"Maly Sok",sub:"Manager"},"finance.refund_completed",{t:"KIT-4830",mono:true},{t:"−"+khr(30000),align:"right"}],
      ["10:22",{t:"Sreyneang Kim",sub:"Washing"},"order.status_changed → Washing",{t:"KIT-4823",mono:true},{t:"—",align:"right"}],
      ["09:40",{t:"Maly Sok",sub:"Manager"},"inventory.stock_adjusted",{t:"Detergent",mono:true},{t:"−2 L",align:"right"}],
      ["09:00",{t:"Rith Pov",sub:"Cashier"},"shift.opened",{t:"SH-02",mono:true},{t:khr(100000),align:"right"}],
      ["08:32",{t:"Het Sovannara",sub:"Owner"},"settings.order_rules_updated",{t:"v3",mono:true},{t:"—",align:"right"}],
    ]},
    {type:"note",text:"Audit records capture actor, role, before/after, reason code, device, offline flag and sync status. Sensitive/financial events are retained per business policy."},
  ]},
  "support":{title:"Support",subtitle:"Help, contacts and system status for Sok Laundry",sections:[
    {type:"list",title:"Get help",items:[
      {title:"Contact KitLuy support",meta:"Telegram · +855 23 000 000 · Mon–Sat",badge:"Chat",tone:"info",dot:"info"},
      {title:"Knowledge Base",meta:"SOPs, setup guides, troubleshooting",badge:"Open",tone:"info",dot:"info"},
      {title:"Raise a ticket",meta:"Device, sync or billing issue",badge:"New",tone:"info",dot:"info"},
    ]},
    {type:"list",title:"System status",items:[
      {title:"Store Hub",meta:"Heartbeat 12s ago",badge:"Online",tone:"ok",dot:"ok"},
      {title:"Cloud sync",meta:"Queue empty · last sync 2m ago",badge:"Healthy",tone:"ok",dot:"ok"},
      {title:"Payment gateway",meta:"ABA PayWay reachable",badge:"Healthy",tone:"ok",dot:"ok"},
    ]},
  ]},
});
/* ===== INTEGRATION HUB — MARKETPLACE DATA ===== */
