// Extracted verbatim from the original KitLuy Partner Portal bundle.
import { I } from '../lib/icons.jsx';

export const ST = {
  created:{label:"Received",bg:"var(--info-bg)",fg:"var(--info-fg)",icon:I.box},
  paid:{label:"Paid",bg:"var(--info-bg)",fg:"var(--info-fg)",icon:I.wallet},
  processing:{label:"Processing",bg:"var(--purple-bg)",fg:"var(--purple-fg)",icon:I.droplet},
  ready:{label:"Ready",bg:"var(--gold-bg)",fg:"var(--gold-fg)",icon:I.check},
  collected:{label:"Collected",bg:"var(--ok-bg)",fg:"var(--ok-fg)",icon:I.shirt},
  completed:{label:"Completed",bg:"var(--ok-bg)",fg:"var(--ok-fg)",icon:I.check},
  cancelled:{label:"Cancelled",bg:"var(--danger-bg)",fg:"var(--danger-fg)",icon:I.clock},
};

export const TIERCOLOR = {
  Silver:["var(--neutral-bg)","var(--neutral-fg)"],Gold:["var(--gold-bg)","var(--gold-fg)"],
  Platinum:["var(--info-bg)","var(--info-fg)"],Diamond:["var(--purple-bg)","var(--purple-fg)"],
  "Black Diamond":["#1f2937","#e5e7eb"],B2B:["var(--ok-bg)","var(--ok-fg)"],
};
