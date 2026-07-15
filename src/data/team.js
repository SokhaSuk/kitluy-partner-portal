// Extracted verbatim from the original KitLuy Partner Portal bundle.

export const SHIFTS_TODAY=[
  {name:"Maly Sok",role:"Manager",time:"07:00 – 15:00",hours:"8h",station:"Front counter",status:"On shift"},
  {name:"Dara Chan",role:"Cashier",time:"07:00 – 15:00",hours:"8h",station:"Counter T1",status:"On shift"},
  {name:"Sreyneang Kim",role:"Washing",time:"06:30 – 14:30",hours:"8h",station:"Wash 1–2",status:"On shift"},
  {name:"Vibol Chea",role:"Ironing",time:"08:00 – 16:00",hours:"8h",station:"Press",status:"On shift"},
  {name:"Rith Pov",role:"Cashier",time:"13:00 – 21:00",hours:"8h",station:"Counter T1",status:"Upcoming"},
];

export const ATTENDANCE=[
  {name:"Sreyneang Kim",date:"Today",tin:"06:28",tout:"—",hours:"5h 32m so far",status:"On time"},
  {name:"Maly Sok",date:"Today",tin:"06:52",tout:"—",hours:"5h 08m so far",status:"On time"},
  {name:"Dara Chan",date:"Today",tin:"07:04",tout:"—",hours:"4h 56m so far",status:"Late 4m"},
  {name:"Vibol Chea",date:"Today",tin:"07:58",tout:"—",hours:"4h 02m so far",status:"On time"},
  {name:"Rith Pov",date:"Yesterday",tin:"12:55",tout:"21:02",hours:"8h 07m",status:"On time"},
  {name:"Maly Sok",date:"Yesterday",tin:"06:58",tout:"15:10",hours:"8h 12m",status:"On time"},
];

export const PERMISSIONS=[
  {label:"View dashboard",cells:["yes","yes","ltd","ltd","yes"]},
  {label:"View orders",cells:["yes","yes","yes","ltd","yes"]},
  {label:"Manage services & pricing",cells:["yes","yes","no","no","no"]},
  {label:"Create promos",cells:["yes","yes","no","no","no"]},
  {label:"View finance",cells:["yes","yes","no","no","yes"]},
  {label:"Export reports",cells:["yes","yes","no","no","yes"]},
  {label:"Approve refunds & voids",cells:["yes","yes","no","no","no"]},
  {label:"Adjust stock",cells:["yes","yes","no","ltd","no"]},
  {label:"Manage staff",cells:["yes","yes","no","no","no"]},
  {label:"Change settings",cells:["yes","ltd","no","no","no"]},
];
