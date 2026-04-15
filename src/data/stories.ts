// src/data/stories.ts
export interface Story {
  id: string;
  title: string;
  hook: string; // one-line teaser
  body: string; // 500-700 words
  period: string;
  relatedSiteIds: string[];
  readTimeMinutes: number;
  imageEmoji: string;
}

export const STORIES: Story[] = [
  {
    id: 'story-001',
    title: 'Daily Life in a Ringfort',
    hook: 'Ireland has over 40,000 ringforts. Here is what it was actually like to live in one.',
    period: 'Early Medieval (AD 500–1100)',
    relatedSiteIds: [],
    readTimeMinutes: 3,
    imageEmoji: '🏯',
    body: `Imagine waking before dawn inside a circular thatched house, the smell of turf smoke thick in the air. Cattle move in the yard outside, restless. Somewhere beyond the earthen bank that circles your home, a dog barks once and goes quiet.

This was daily life for hundreds of thousands of Irish people between roughly AD 500 and 1100. The ringfort — a circular bank-and-ditch enclosure typically 25 to 50 metres across — was the basic unit of rural settlement in early medieval Ireland. More than 40,000 survive across the country, making them the most common field monument in Ireland. Thousands more have been destroyed by ploughing.

**Who lived there?**

Most ringforts were farms. A single family — perhaps two or three generations, ten to fifteen people — lived inside, along with their animals at night. The enclosure was not primarily a military fortification: the bank was too low to repel a serious attack. It was, above all, a symbol of status and a practical means of keeping livestock in and wolves out.

Social rank mattered enormously. A *bó-aire* (a cattle lord of middling status) would have a simple single-banked ringfort. A *flaith* (nobleman) would have a larger, multi-banked example — the more banks, the higher the prestige. Excavations frequently find evidence of metalworking, leather-working, and textile production inside, suggesting these were industrious, self-sufficient homesteads.

**What did they eat?**

Cattle were the primary measure of wealth, but they were rarely slaughtered for meat — they were too valuable alive, producing milk, butter, and cheese, the staple foods. Pigs were eaten more often. Cereals — oats and barley — were grown in nearby fields and ground by hand on rotary querns. Wild resources — hazelnuts, berries, fish, game — supplemented the diet seasonally.

**What did they believe?**

The early medieval period in Ireland sits at a fascinating threshold. Christianity was spreading rapidly after Saint Patrick's mission in the 5th century, but older beliefs ran deep and slow. Many ringforts were built near or aligned with earlier prehistoric monuments — this was not accidental. The same hills, the same springs, the same boundaries held power across millennia.

**Why so many survived?**

Irish folklore gave ringforts a protective reputation. They were called *lios* or *ráth*, and were widely believed to be the dwelling places of the *sídhe* — the fairy folk. To plough a ringfort was to invite catastrophe: illness, the death of cattle, madness. This belief, more than any law, preserved Ireland's archaeological record in a way that has no parallel elsewhere in Europe.

The next time you see a circular raised mound in a field — sometimes just a slight bump with a ring of whitethorn bushes around it — you are looking at someone's home. A family lived there. They worried about the harvest, about their children, about the winter ahead. They were entirely ordinary, and entirely remarkable.`,
  },
  {
    id: 'story-002',
    title: 'Who Built the Passage Tombs — and Why?',
    hook: 'They were older than the pyramids and more precisely engineered. Who were these people?',
    period: 'Neolithic (4000–2500 BC)',
    relatedSiteIds: ['meath-001', 'meath-002', 'meath-003', 'meath-005', 'meath-009'],
    readTimeMinutes: 3,
    imageEmoji: '🪨',
    body: `Five thousand years ago, before bronze, before writing, before the wheel reached Ireland, a community of farmers built something extraordinary. They felled trees with stone axes. They moved single stones weighing tonnes across kilometres of landscape. They aligned their greatest monument to a 17-minute sunrise on the shortest day of the year, and got it exactly right.

We do not know what they called themselves. We call them the Neolithic — the New Stone Age people — and they arrived in Ireland from continental Europe around 4000 BC, bringing with them agriculture, domesticated cattle, and the practice of building large communal tombs.

**How did they build Newgrange?**

The engineering of Newgrange is genuinely staggering. The mound contains roughly 200,000 tonnes of material. The kerbstones — 97 large stones forming the outer ring — were transported from sources up to 80 kilometres away. The passage and chamber are corbelled (each stone slightly overhanging the last) to create a waterproof vault that has kept the chamber dry for 5,200 years.

The roofbox — a small opening above the entrance designed specifically to admit the winter solstice sunrise — required an understanding of solar movement that modern archaeologists still find difficult to fully reconstruct. The builders had no instruments we would recognise. They had generations of accumulated observation.

**Who was buried there?**

Analysis of burned bone from Newgrange suggests the remains of at least five individuals, possibly more. These were not ordinary people: the effort required to build the tomb implies that those interred within it held enormous social authority. Whether they were kings, priests, or ancestors-made-sacred, we cannot say.

What is striking is that the tombs were communal. The chamber held multiple individuals, accumulated over time. These were not monuments to one person but to lineage — to the continuity of the family or the clan across generations and across the boundary between the living and the dead.

**Why align them to the sun?**

The solstice alignment at Newgrange, the equinox alignment at Loughcrew, the sunset alignment at Dowth — these were not decorative. In a farming society entirely dependent on the cycle of seasons, controlling or communing with the sun was the most important thing you could do. The passage tomb may have been a machine for death and rebirth: the light entering the darkness, illuminating the ancestors, then withdrawing for another year.

We will never fully understand what these monuments meant to the people who built them. But standing in the chamber at Newgrange on the winter solstice, watching the light move down the passage floor toward you, it is impossible not to feel that something true is happening.`,
  },
  {
    id: 'story-003',
    title: 'Monasteries as Power Centres',
    hook: 'Early Irish monasteries were not quiet retreats. They were towns, banks, and political capitals.',
    period: 'Early Christian (AD 400–1100)',
    relatedSiteIds: [],
    readTimeMinutes: 3,
    imageEmoji: '✝️',
    body: `The popular image of the early Irish monk — alone on a windswept island, copying manuscripts by candlelight — is real but incomplete. Alongside the hermits and the island communities, early medieval Ireland developed some of the most complex and powerful institutions in northwestern Europe: the great monasteries.

By the 7th and 8th centuries, monasteries like Clonmacnoise, Armagh, Glendalough, and Durrow were not simply religious communities. They were towns.

**The monastic town**

A great monastery was ringed by a circular enclosure, the *vallum monasterii*, which functioned like a city wall. Inside lived monks, craftsmen, scribes, students, pilgrims, merchants, and servants — sometimes thousands of people. The monastery was simultaneously a church, a university, a scriptorium, a hospital, a guesthouse, and a treasury.

Land was the foundation of monastic power. Great monasteries held vast territories granted by local kings in exchange for prayers, prestige, and literacy. They kept records (the Annals of the Four Masters, the Book of Kells), educated the sons of nobles, and provided the administrative infrastructure that no secular ruler could replicate.

**Money and violence**

Irish monasteries were economic engines. They held silver, precious books, reliquaries (decorated containers for saints' relics valued like gold), and accumulated tribute from dependent lands. This made them targets. Viking raids from the 790s onward were devastating — but it is worth noting that Irish monasteries also raided each other. Armagh and Clonmacnoise fought military battles over territory and relics. Monks could be warriors. Abbots could command armies.

**The round towers**

The iconic Irish round towers — slender, tapering, with doorways raised several metres off the ground — were built from the 9th century onward. Their exact purpose is debated, but they served as bell towers (the Irish word *cloigtheach* means bell-house), landmarks visible from a great distance, and possibly as refuges where valuables could be stored during raids. The high doorways would have been reached by a removable ladder.

**What survived**

The monasteries declined after the Anglo-Norman invasion and the introduction of Continental religious orders in the 12th century. But their legacy is written into the landscape in high crosses, round towers, carved slab cemeteries, and the placenames of thousands of Irish towns. Wherever you see *kil-*, *kill-*, or *cill-* in an Irish placename, you are looking at the word for a monastic cell — *cill*. Ireland is covered in them.`,
  },
  {
    id: 'story-004',
    title: 'The Origin of Halloween',
    hook: 'Halloween began on a hilltop in County Meath. Here is the real story.',
    period: 'Iron Age (700 BC – AD 400)',
    relatedSiteIds: ['meath-006'],
    readTimeMinutes: 3,
    imageEmoji: '🔥',
    body: `On the last night of October, children across the world dress as ghosts and kneel at strangers' doors. The custom has been exported globally via America, but it began — in a form that would still be recognisable — on a hilltop in County Meath.

The hill is called Tlachtga, now known as the Hill of Ward, near the town of Athboy. The feast is Samhain, and its origin is genuinely ancient.

**What was Samhain?**

Samhain (pronounced approximately "SAH-win") was one of four great festivals that divided the Celtic year. It marked the end of summer, the beginning of the dark half of the year. Modern calendars make October 31st an arbitrary date; for Iron Age Irish farmers, it was the hinge of the year. The cattle were brought in from summer pastures. The harvest was complete. The world was about to go cold and dark.

Ancient Irish texts — most written down by monks centuries after the events they describe — consistently describe Samhain as a time when the boundary between the world of the living and the world of the dead became thin, permeable. Supernatural beings moved freely. The dead might return. To be outside, unprotected, on Samhain night was dangerous.

**The fire at Tlachtga**

The mythological sources describe a great fire being lit at Tlachtga on Samhain night. This fire had to be lit before the fires of Tara — the seat of the High Kings — could be kindled. Tlachtga thus had ritual precedence over the most powerful political site in Ireland.

The hill is named for Tlachtga, a female druidic figure in Irish mythology associated with fire and sovereignty. Three sons were born to her violently at this place, forming the mythological origin of the three provinces. The details are brutal and symbolic: this was a place of dangerous power, at a dangerous time of year.

**From Samhain to Halloween**

The Christian church, expanding into Celtic Europe, moved the feast of All Saints to November 1st — this placed Samhain's eve on October 31st, the night before. The folk customs of Samhain — fires, disguises, apotropaic rituals to ward off the dead — were absorbed, adapted, and eventually exported by Irish emigrants to America in the 19th century, where they merged with other traditions and became the global phenomenon of Halloween.

The carved pumpkins? Derived from carved turnips in Irish folk practice, used as lanterns to represent or ward off the dead.

Standing on the earthworks of Tlachtga on a cold October night, looking south toward the distant silhouette of the Hill of Tara, the roots of Halloween are not hard to feel.`,
  },
  {
    id: 'story-005',
    title: 'The Norman Transformation of Ireland',
    hook: 'In 1169, a small fleet landed in Wexford. Within a generation, Ireland was unrecognisable.',
    period: 'Medieval (AD 1100–1500)',
    relatedSiteIds: ['meath-008', 'meath-010'],
    readTimeMinutes: 3,
    imageEmoji: '🏰',
    body: `In May 1169, a fleet of ships landed at Bannow Bay in County Wexford. They carried perhaps 600 men-at-arms and archers — a tiny force by medieval standards. Within two or three decades, their descendants had built more stone castles than exist in the entirety of Ireland's pre-Norman history, reshaped the country's towns, reformed its church, and introduced a feudal land system that would define Irish history for the next 800 years.

The Anglo-Norman invasion of Ireland was, by any measure, one of the most transformative events in the island's history.

**Why did they come?**

The invasion was invited. Diarmait Mac Murchada, the exiled King of Leinster, sought military help from King Henry II of England to recover his kingdom. Henry permitted his lordship to recruit from among the Norman lords in Wales. The most important was Richard de Clare, known as Strongbow. In exchange for military service, Strongbow was promised the hand of Diarmait's daughter Aoife and the succession to the kingdom of Leinster.

The Normans came, won, and did not leave.

**What did they build?**

The Norman impact on the Irish landscape was immediate and visible. Motte-and-bailey castles — earthen mounds topped with wooden towers — appeared across the country within years of the invasion. Stone castles followed. Trim Castle in County Meath, built by Hugh de Lacy from around 1176, is the largest Anglo-Norman castle in Ireland: a massive statement of power in stone, visible for kilometres across the Boyne Valley.

Towns were planted along Norman lines, with regular street grids, markets, and walls. Monasteries of the new Continental orders — Cistercians, Augustinians, Dominicans — replaced older Irish monastic foundations or were built alongside them. The landscape was being reorganised according to a fundamentally different model of power.

**What did the Irish do?**

The Irish did not simply submit. Gaelic lords in Ulster, Connacht, and parts of Munster maintained power for centuries after the invasion. The Normans, famously, became "more Irish than the Irish themselves" — intermarrying extensively, adopting Irish law, language, and custom, until the Crown in England grew alarmed by the cultural assimilation and passed the Statutes of Kilkenny in 1366, prohibiting the Norman settlers from speaking Irish or following Irish customs.

It did not work.

**Why the landscape still tells this story**

Every castle, every walled town, every planned medieval borough in Ireland is a monument to the Norman transformation. The ruins of Trim Castle, the walls of Kilkenny, the tower houses of Clare and Galway — these are not just ruins. They are the shape of an invasion, frozen in stone, still visible from the road.`,
  },
];
