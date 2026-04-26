// src/data/todayInHistory.ts
// Hand-curated entries surfaced by the "On this day" card on the welcome
// screen. Each entry has a fixed month/day; the year is editorial. Keep
// entries short — the card is small.

export interface OnThisDay {
  month: number; // 1-12
  day: number;   // 1-31
  year: number;  // For display only ("AD 432", "1843", etc.)
  yearLabel?: string; // Override of the year display (e.g. "c. 3200 BC")
  title: string;
  blurb: string;
}

export const ON_THIS_DAY: OnThisDay[] = [
  {
    month: 12,
    day: 21,
    year: -3200,
    yearLabel: 'c. 3200 BC',
    title: 'Sun reaches the Newgrange chamber',
    blurb:
      'Each winter solstice, the rising sun threads the roofbox at Newgrange and lights the chamber for ~17 minutes — built five millennia ago.',
  },
  {
    month: 3,
    day: 17,
    year: 461,
    title: 'Death of St Patrick',
    blurb:
      "Traditional date for the death of Ireland's patron saint, who began the Christianisation of the island in the 5th century.",
  },
  {
    month: 6,
    day: 8,
    year: 793,
    title: 'First Viking raid on Ireland',
    blurb:
      'Vikings sacked the monastery at Rathlin Island, beginning two centuries of raids that reshaped the Irish coastline and its monastic towns.',
  },
  {
    month: 4,
    day: 23,
    year: 1014,
    title: 'Battle of Clontarf',
    blurb:
      "High King Brian Boru defeated a Viking-Leinster alliance near Dublin. He was killed in his tent at the moment of victory.",
  },
  {
    month: 8,
    day: 15,
    year: 1843,
    title: 'O\u2019Connell\u2019s Tara monster meeting',
    blurb:
      'An estimated 750,000 people gathered on the Hill of Tara to hear Daniel O\u2019Connell call for repeal of the Act of Union.',
  },
  {
    month: 10,
    day: 31,
    year: -500,
    yearLabel: 'c. 500 BC',
    title: 'Samhain — origin of Halloween',
    blurb:
      'The Celtic feast of Samhain marked the end of summer. Fires were lit on Tlachtga (Hill of Ward) in Co. Meath, and the dead were said to walk the earth.',
  },
  {
    month: 9,
    day: 23,
    year: -3000,
    yearLabel: 'c. 3000 BC',
    title: 'Equinox at Loughcrew',
    blurb:
      'On the autumn equinox, the rising sun illuminates the back stone of Cairn T at Loughcrew, Co. Meath — covered in megalithic art.',
  },
];

/**
 * Returns today's entry, or null if no entry exists for this calendar day.
 */
export function getTodayEntry(date: Date = new Date()): OnThisDay | null {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return ON_THIS_DAY.find((e) => e.month === m && e.day === d) ?? null;
}

/**
 * Returns the closest upcoming entry (within 30 days) when nothing
 * matches today exactly. Useful as a "Coming up" fallback.
 */
export function getUpcomingEntry(date: Date = new Date()): OnThisDay | null {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  let best: { entry: OnThisDay; days: number } | null = null;
  for (const e of ON_THIS_DAY) {
    let candidate = new Date(today.getFullYear(), e.month - 1, e.day);
    if (candidate < today) {
      candidate = new Date(today.getFullYear() + 1, e.month - 1, e.day);
    }
    const days = Math.round(
      (candidate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (days > 0 && days <= 30 && (!best || days < best.days)) {
      best = { entry: e, days };
    }
  }
  return best?.entry ?? null;
}
