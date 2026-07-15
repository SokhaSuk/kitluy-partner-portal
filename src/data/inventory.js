// Extracted verbatim from the original KitLuy Partner Portal bundle.

export const ADJUSTMENTS=[
  {item:"Detergent (liquid)",change:"−2 L",neg:true,reason:"Damage",note:"Leaked container in storage",by:"Maly Sok",time:"Today 09:40"},
  {item:"Hangers",change:"−24 pcs",neg:true,reason:"Waste",note:"Bent or broken during pressing",by:"Dara Chan",time:"Yesterday 16:20"},
  {item:"Garment bags",change:"+15 pcs",neg:false,reason:"Recount",note:"Found extra box on shelf B",by:"Maly Sok",time:"Yesterday 10:05"},
  {item:"Stain remover",change:"−1 bottle",neg:true,reason:"Loss",note:"Unaccounted at count C-018",by:"Het Sovannara",time:"28 Jun 18:30"},
];

export const COUNTS=[
  {code:"C-019",scope:"Full count · all storage",date:"Sun 6 Jul",items:"48 items",variance:"—",status:"Scheduled"},
  {code:"C-018",scope:"Full count · all storage",date:"28 Jun",items:"46 items",variance:"−៛36,000",neg:true,status:"Completed"},
  {code:"C-017",scope:"Spot check · chemicals",date:"21 Jun",items:"12 items",variance:"៛0",status:"Completed"},
  {code:"C-016",scope:"Spot check · packaging",date:"14 Jun",items:"9 items",variance:"−៛8,500",neg:true,status:"Completed"},
];

export const STOCK_MOVES=[
  {kind:"usage",title:"Detergent · auto-deducted from orders",meta:"14 orders processed since 07:00",qty:"−4.1 L",time:"Today 10:05"},
  {kind:"adjust",title:"Detergent · damage adjustment",meta:"Leaked container · Maly Sok",qty:"−2 L",time:"Today 09:40"},
  {kind:"receipt",title:"Garment bags · received PO-0241",meta:"Angkor Packaging · 2 line items",qty:"+500 pcs",time:"28 Jun 08:20"},
  {kind:"count",title:"Count C-018 variance posted",meta:"3 items adjusted · −៛36,000",qty:"−3 items",time:"28 Jun 18:40"},
  {kind:"usage",title:"Hangers · auto-deducted from orders",meta:"Daily usage across stations",qty:"−40 pcs",time:"Yesterday"},
  {kind:"receipt",title:"Fragrance · received PO-0239",meta:"Khmer Fragrance Co · 1 line item",qty:"+12 L",time:"21 Jun 09:15"},
];
