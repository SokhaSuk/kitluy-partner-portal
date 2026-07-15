// Extracted verbatim from the original KitLuy Partner Portal bundle.

export const SUPPLIERS=[
  {name:"Mekong Chem Supply",category:"Detergent & chemicals",phone:"+855 23 456 771",lead:"2 days",items:12,last:"30 Jun"},
  {name:"CleanPro Cambodia",category:"Hangers & consumables",phone:"+855 12 887 220",lead:"4 days",items:8,last:"26 Jun"},
  {name:"Angkor Packaging",category:"Bags, rolls & labels",phone:"+855 17 665 090",lead:"3 days",items:6,last:"28 Jun"},
  {name:"Khmer Fragrance Co",category:"Fragrance & softener",phone:"+855 96 240 118",lead:"5 days",items:3,last:"21 Jun"},
];

export const PURCHASE_ORDERS=[
  {code:"PO-0243",supplier:"Mekong Chem Supply",items:"Detergent 60 L · Softener 40 L",qty:"2 line items",total:864000,expected:"Fri 4 Jul",status:"Ordered",lines:[{name:"Detergent (liquid)",qty:"60 L",cost:552000},{name:"Fabric softener",qty:"40 L",cost:312000}]},
  {code:"PO-0242",supplier:"CleanPro Cambodia",items:"Hangers 1,000 pcs",qty:"1 line item",total:240000,expected:"Mon 7 Jul",status:"Draft",lines:[{name:"Hangers",qty:"1,000 pcs",cost:240000}]},
  {code:"PO-0240",supplier:"Mekong Chem Supply",items:"Stain remover 24 bottles",qty:"12 of 24 received",total:288000,expected:"Thu 3 Jul",status:"Partial",lines:[{name:"Stain remover",qty:"24 bottles",cost:288000}]},
  {code:"PO-0241",supplier:"Angkor Packaging",items:"Garment bags 500 · Tag rolls 20",qty:"2 line items",total:312000,expected:"28 Jun",status:"Received",lines:[{name:"Garment bags",qty:"500 pcs",cost:185000},{name:"Tag rolls",qty:"20 rolls",cost:127000}]},
  {code:"PO-0239",supplier:"Khmer Fragrance Co",items:"Fragrance 12 L",qty:"1 line item",total:144000,expected:"21 Jun",status:"Received",lines:[{name:"Fragrance",qty:"12 L",cost:144000}]},
];

export const LOW_REORDER=[
  {item:"Detergent (liquid)",qty:"60 L",supplier:"Mekong Chem Supply",cost:552000},
  {item:"Hangers",qty:"1,000 pcs",supplier:"CleanPro Cambodia",cost:240000},
  {item:"Garment bags",qty:"500 pcs",supplier:"Angkor Packaging",cost:185000},
];

export const SUPPLY_DETAIL={
  "Detergent (liquid)":{unitCost:"៛9,200 / L",value:"៛110,400",supplier:"Mekong Chem Supply",reorderCost:552000,reorderAt:"5 days cover"},
  "Fabric softener":{unitCost:"៛7,800 / L",value:"៛140,400",supplier:"Mekong Chem Supply",reorderCost:312000,reorderAt:"7 days cover"},
  "Hangers":{unitCost:"៛240 / pc",value:"៛57,600",supplier:"CleanPro Cambodia",reorderCost:240000,reorderAt:"7 days cover"},
  "Garment bags":{unitCost:"៛370 / pc",value:"៛114,700",supplier:"Angkor Packaging",reorderCost:185000,reorderAt:"7 days cover"},
  "Starch spray":{unitCost:"៛6,500 / can",value:"៛143,000",supplier:"Mekong Chem Supply",reorderCost:156000,reorderAt:"10 days cover"},
  "Stain remover":{unitCost:"៛12,000 / bottle",value:"៛84,000",supplier:"Mekong Chem Supply",reorderCost:288000,reorderAt:"7 days cover"},
};
