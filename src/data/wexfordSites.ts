// src/data/wexfordSites.ts
// County Wexford – curated from the National Monuments Service
// Sites and Monuments Record (SMR) via HEV ArcGIS REST API
// Source: https://services-eu1.arcgis.com/HyjXgkV6KGMSF3jt/arcgis/rest/services/SMR/FeatureServer/0
// Data licence: CC BY 4.0 (Government of Ireland / Tailte Éireann)
import { ArchSite } from './sites';

export const WEXFORD_SITES: ArchSite[] = [
  {
    id: 'wex-001',
    name: 'Hook Lighthouse',
    irishName: 'Teach Solais an Chorráin',
    type: 'Lighthouse (Medieval Tower)',
    period: 'medieval',
    lat: 52.12378,
    lng: -6.92945,
    whatItIs:
      'One of the oldest working lighthouses in the world — a 13th-century cylindrical tower built by Augustinian monks on the tip of the Hook Peninsula, still guiding ships today.',
    whyItMatters:
      'William Marshal, Earl of Pembroke, may have commissioned the tower around 1210–1230 after surviving a storm off the Wexford coast (the same shipwreck that prompted him to found Tintern Abbey). The monks of St. Saviour\'s were ordered in 1245 to continue maintaining the light they had built — making this one of the earliest confirmed lighthouse records in Ireland. It operated almost without interruption for 700 years, was automated in 1996, and is still a functioning lighthouse. The medieval tower has never been demolished or rebuilt from scratch: the 13th-century groin-vaulted interior is original.',
    whenUsed: { start: 1210, end: 9999 },
    whatToLookFor:
      'The massive cylindrical tower (12.3m wide, 24.7m tall) with its distinctive black and white stripes. Inside, three barrel-vaulted floors with plank-centring and four ribs each — original 13th-century construction. The pointed doorway in the annexe at the SE base is probably original.',
    accessStatus: 'accessible',
    accessNote: 'Open to visitors year-round. Guided tours of the medieval tower available. See hookheritage.ie.',
    isMonument: true,
    smrRef: 'WX054-012----',
    county: 'Wexford',
  },
  {
    id: 'wex-002',
    name: 'Ferns Cathedral',
    irishName: 'Ardeaglais Fhearna',
    type: 'Cathedral',
    period: 'medieval',
    lat: 52.59000,
    lng: -6.49280,
    whatItIs:
      'A 13th-century cathedral built on the site of St Máedóg\'s 7th-century monastery — the mother church of the Diocese of Ferns, one of five Leinster dioceses established at the Synod of Rathbreasail in 1111 AD.',
    whyItMatters:
      'St Máedóg (Mogue) founded his monastery here before 624 AD on land granted by King Brandubh of Leinster. Ferns was the ecclesiastical capital of Leinster and was raided by Vikings nine times from 835 AD. The cathedral was built by the first Anglo-Norman bishop, John St. John (1223–1253), and was burned by Fiach Mac Hugh O\'Byrne in 1575. The effigy of a bishop inside may be John St. John himself — or Adam de Northampton (d. 1346). The cathedral is still the Church of Ireland cathedral of the Diocese of Ferns.',
    whenUsed: { start: 624, end: 9999 },
    whatToLookFor:
      'Four early medieval high crosses re-erected in the graveyard — plain ringed crosses with moulded edges. Inside, the medieval chancel with double barrel-vaulted crypt below it, the five lancet windows at the east end, and the bishop\'s effigy. The curved boundary of the N11 road hints at the original circular ecclesiastical enclosure (c. 200m across).',
    accessStatus: 'accessible',
    accessNote: 'Graveyard freely accessible. Cathedral open for services and visitors — check locally for hours.',
    isMonument: true,
    smrRef: 'WX015-003003-',
    county: 'Wexford',
  },
  {
    id: 'wex-003',
    name: 'St Mary\'s Abbey & Round Tower, Ferns',
    irishName: 'Mainistir Naomh Muire, Fearna',
    type: 'Augustinian Abbey',
    period: 'medieval',
    lat: 52.58953,
    lng: -6.49173,
    whatItIs:
      'The ruins of an Augustinian abbey founded around 1158 by Dermot Mac Murrough, King of Leinster — featuring a rare hybrid round tower and preserved as a National Monument.',
    whyItMatters:
      'Dermot Mac Murrough founded this abbey and was buried here in 1171 after his death. He is remembered as the man who invited the Anglo-Normans to Ireland, an act that reshaped the island for centuries. The round tower attached to the west wall of the nave is an unusual form — a Viking-age round tower merged with a 12th-century Romanesque church. The abbey was suppressed in 1538 and granted to Thomas Masterson in 1583.',
    whenUsed: { start: 1158, end: 1538 },
    whatToLookFor:
      'The north wall of the nave standing to near full height with round-headed recesses. The round tower with square base attached to the west wall — enter from the nave; a newel stairs rises to a doorway above, with four square lights at the top. Ribbed vaulting survives in the chancel. Two crude cross-bases lie within the nave.',
    accessStatus: 'accessible',
    accessNote: 'National Monument No. 133. Freely accessible during daylight hours. 50m south of the cathedral.',
    isMonument: true,
    smrRef: 'WX015-003004-',
    county: 'Wexford',
  },
  {
    id: 'wex-004',
    name: 'Enniscorthy Castle',
    irishName: 'Caisleán Inis Córthaidh',
    type: 'Tower House Castle',
    period: 'medieval',
    lat: 52.50145,
    lng: -6.56715,
    whatItIs:
      'A four-tower castle built around 1585 by Sir Henry Wallop on a rock outcrop above the River Slaney — now home to the County Wexford Museum.',
    whyItMatters:
      'The site has been defended since at least the 12th century when Robert de Quincy received the manor of Duffry from Strongbow. The present castle was built by Wallop modelled on Ferns Castle, with four corner towers and distinctive late 16th-century features. Its oubliette (hidden chamber) contains a soldier\'s image scratched in plaster. The castle served as a rebel base in 1798, then as a prison. After restoration it opened as the County Museum in 2010.',
    whenUsed: { start: 1200, end: 9999 },
    whatToLookFor:
      'Three surviving circular corner towers (the fourth was demolished in the 19th century), the granite doorway with an elliptical head and a square hood moulding at the SE entrance, diamond-shaped chimney stacks, and the yett (iron gate) protecting the entrance passage.',
    accessStatus: 'accessible',
    accessNote: 'County Wexford Museum. Open Tuesday–Sunday; admission charged. Check wexfordcountymuseum.ie for hours.',
    isMonument: true,
    smrRef: 'WX020-031003-',
    county: 'Wexford',
  },
  {
    id: 'wex-005',
    name: 'Tintern Abbey',
    irishName: 'Mainistir Thintern',
    type: 'Cistercian Abbey',
    period: 'medieval',
    lat: 52.23697,
    lng: -6.83787,
    whatItIs:
      'A Cistercian abbey founded in 1200 by William Marshal, Earl of Pembroke, after he vowed to establish a monastery if he survived a storm off the Wexford coast — colonised by monks from Tintern Major in Wales.',
    whyItMatters:
      'William Marshal was the greatest knight in medieval Europe, serving five English kings and acting as Regent of England for Henry III. He founded the abbey de voto — "of the vow". Unlike most Irish abbeys, Tintern was converted to a fortified residence after the Dissolution (1536) by the Colclough family, who lived here until 1959 — meaning much of the medieval fabric survived. The state acquired it in 1963; the OPW carried out extensive excavations in the 1980s–90s.',
    whenUsed: { start: 1200, end: 1960 },
    whatToLookFor:
      'The crossing tower with crenellated parapets (27m high), the austere 13th-century nave with unmoulded arches and rectangular piers, the sophisticated chancel with slender lancet windows. The medieval gatehouse is incorporated into the 18th-century stable block. The medieval single-arch bridge over the Tintern stream (c. 200m south-west) is also original.',
    accessStatus: 'accessible',
    accessNote: 'OPW National Monument No. 614. Seasonal guided tours; site accessible year-round. See heritageireland.ie.',
    isMonument: true,
    smrRef: 'WX045-027001-',
    county: 'Wexford',
  },
  {
    id: 'wex-006',
    name: 'Duncannon Fort',
    irishName: 'Dún Canann',
    type: 'Bastioned Fort',
    period: 'post_medieval',
    lat: 52.22081,
    lng: -6.93679,
    whatItIs:
      'A 16th-century star-shaped bastioned fort built on a promontory at the mouth of the Barrow, Nore, and Suir estuary — constructed to protect Waterford from Spanish invasion.',
    whyItMatters:
      'Construction began in 1587 panic before the Spanish Armada. Despite being held by Confederate rebels (1645), Parliamentarians, and Williamite forces (1690), the fort survived every siege. King James II embarked here for Kinsale after his defeat at the Boyne; King William III visited in September 1690. The fort was garrisoned until 1857 and burned by the IRA in 1921. Now restored and open for guided tours — one of the best-preserved star forts in Ireland.',
    whenUsed: { start: 1587, end: 1921 },
    whatToLookFor:
      'The V-shaped bastion projecting east into the ditch, the main entrance through the bastion face, gun-emplacement chambers (with enfilading fire for the south wall) built into the glacis at the south end, the two-storey barrack buildings around the parade ground, and the D-shaped west court with gun emplacements covering the estuary to the south.',
    accessStatus: 'accessible',
    accessNote: 'Guided tours available. The fort is operated by Wexford County Council. See duncannonfort.ie.',
    isMonument: true,
    smrRef: 'WX044-015001-',
    county: 'Wexford',
  },
  {
    id: 'wex-007',
    name: 'Rathmacknee Castle',
    irishName: 'Caisleán Rátha Mochnaoí',
    type: 'Tower House',
    period: 'medieval',
    lat: 52.26928,
    lng: -6.49055,
    whatItIs:
      'One of the best-preserved 15th-century tower houses in south Wexford — a tall rectangular keep with a walled bawn, built in the dense Anglo-Norman manorial landscape of the Forth barony.',
    whyItMatters:
      'The Forth barony was settled by English and Flemish colonists from the 12th century. Their descendants — the "Old English" or Bargy and Forth people — retained a distinct language called Yola until the 19th century, the last remnant of Middle English spoken in Ireland. The tower houses of south Wexford, including Rathmacknee, are the physical legacy of this persistent colonial culture. The castle is a National Monument.',
    whenUsed: { start: 1420, end: 1700 },
    whatToLookFor:
      'The five-storey rectangular tower rising above a bawn wall, with corner bartizans near the top. The entrance to the tower is at ground floor on the south side. The bawn (fortified enclosure) wall is largely intact — an unusual survival.',
    accessStatus: 'accessible',
    accessNote: 'OPW National Monument. Freely accessible. Located on a minor road south of Wexford town off the R730.',
    isMonument: true,
    smrRef: 'WX042-029001-',
    county: 'Wexford',
  },
  {
    id: 'wex-008',
    name: 'Ballyhack Castle',
    irishName: 'Caisleán Bhéal Átha Hacket',
    type: 'Tower House',
    period: 'medieval',
    lat: 52.24593,
    lng: -6.96743,
    whatItIs:
      'A five-storey tower house perched above the Barrow estuary at the Ballyhack–Passage East ferry crossing — probably built by the Knights Hospitaller in the 15th or early 16th century.',
    whyItMatters:
      'The ferry crossing at Ballyhack is ancient and the tower controlled this strategic route between Wexford and Waterford. The Knights Hospitaller (a crusading military order) received lands in south Wexford from the Anglo-Normans; from this tower they could monitor river traffic on the Barrow. The castle was acquired by the OPW and the ferry still runs today — one of the oldest continuous ferry crossings in Ireland.',
    whenUsed: { start: 1450, end: 1700 },
    whatToLookFor:
      'The five-storey tower above the harbour with stepped battlements. The castle commands dramatic views across the Barrow to County Waterford. The Ballyhack–Passage East car ferry operates from the slip just below.',
    accessStatus: 'accessible',
    accessNote: 'OPW National Monument. Open seasonally; café in the courtyard. The Passage East ferry runs from beside the castle.',
    isMonument: true,
    smrRef: 'WX044-009001-',
    county: 'Wexford',
  },
  {
    id: 'wex-009',
    name: 'Ferrycarrig Castle',
    irishName: 'Caisleán Cheatharlach',
    type: 'Tower House',
    period: 'medieval',
    lat: 52.35151,
    lng: -6.50964,
    whatItIs:
      'A tower house castle on a dramatic rock above the tidal Slaney estuary, at the lowest fordable point above Wexford town — controlling the main route north through the county.',
    whyItMatters:
      'Ferrycarrig was the strategic gateway to the Slaney valley. Whoever held this crossing controlled access to Enniscorthy, Ferns, and the routes north to Dublin and Wicklow. The adjacent Irish National Heritage Park reconstructs Irish settlement from the Stone Age through the Norman period — making this a combined natural and archaeological landscape that tells the whole story of Wexford in one place.',
    whenUsed: { start: 1400, end: 1700 },
    whatToLookFor:
      'The stark rectangular tower rising from the exposed rock above the river. Best seen from the road bridge or from the Heritage Park grounds on the opposite bank. The tidal mudflats below attract wading birds at low tide. The ringfort replica and Norman motte in the Heritage Park nearby are visible from the castle.',
    accessStatus: 'accessible',
    accessNote:
      'Tower visible from public roads and the Irish National Heritage Park (irishheritage.ie). The Heritage Park has its own admission charge.',
    isMonument: true,
    smrRef: 'WX037-027----',
    county: 'Wexford',
  },
  {
    id: 'wex-010',
    name: 'Ballybrittas Portal Tomb',
    type: 'Portal Tomb (Dolmen)',
    period: 'stone_age',
    lat: 52.42867,
    lng: -6.63642,
    whatItIs:
      'A Neolithic megalithic portal tomb (dolmen) in the hills west of Enniscorthy — a stone Age burial monument built around 4000–3500 BC, one of the few megalithic tombs surviving in the Wexford uplands.',
    whyItMatters:
      'Portal tombs were built using capstones weighing many tonnes, levered and hauled without metal tools or wheels — an extraordinary demonstration of collective organisation. They were the burial places of important individuals and served as territorial markers visible across the landscape. Their builders knew the land before the first plough, before the first field-fence, and long before the first ringfort.',
    whenUsed: { start: -4000, end: -3000 },
    whatToLookFor:
      'The twin tall portal stones at the front of the chamber, the covering capstone resting at a characteristically raised angle, and the lower closing stone at the back. The monument is set in open farmland — look for the distinctive silhouette on the skyline.',
    accessStatus: 'accessible',
    accessNote:
      'In open countryside on private farmland. Visible from the road. Approach respectfully; no facilities on site.',
    isMonument: true,
    smrRef: 'WX031-010----',
    county: 'Wexford',
  },
  {
    id: 'wex-011',
    name: 'Clone Passage Tomb & Rock Art',
    type: 'Passage Tomb (with megalithic art)',
    period: 'stone_age',
    lat: 52.56838,
    lng: -6.50510,
    whatItIs:
      'A Neolithic passage tomb near Ferns with decorated carved stones — one of only a handful of sites with passage tomb art surviving in County Wexford.',
    whyItMatters:
      'Passage tomb art is found in abundance at Newgrange and Knowth in County Meath — its presence at Clone shows that the communities building monuments across Leinster were connected to the same intellectual and spiritual world as the great Boyne Valley tomb-builders. The same geometric vocabulary of spirals, lozenges, and zigzags appears here 100km south. The art predates writing by over 3,000 years.',
    whenUsed: { start: -3500, end: -2800 },
    whatToLookFor:
      'The decorated carved capstone with incised megalithic art (spirals and abstract forms). The mound itself has been damaged but the carved stone is the key survival. A decorated stone head from Clone church was incorporated into the superstructure of St Mogue\'s Well in Ferns village in 1847.',
    accessStatus: 'restricted',
    accessNote:
      'Not fully accessible to the general public. Contact the National Monuments Service for information.',
    isMonument: true,
    smrRef: 'WX015-023014-',
    county: 'Wexford',
  },
  {
    id: 'wex-012',
    name: 'Clonmines Medieval Town',
    irishName: 'Cluain Mainis',
    type: 'Deserted Medieval Town',
    period: 'medieval',
    lat: 52.26248,
    lng: -6.76417,
    whatItIs:
      'The ghost of a medieval walled port town on the west shore of Bannow Bay — abandoned when the bay silted up in the 17th century, leaving its churches, tower houses, and town plan almost intact.',
    whyItMatters:
      'Clonmines was a thriving Anglo-Norman borough with town walls, two tower houses, an Augustinian priory, a Franciscan friary, a parish church, and a harbour. The silting of Bannow Bay — which accelerated after a great storm in the late medieval period — killed the port and the town was never redeveloped. Because no later town was built over it, Clonmines preserves one of the most complete above-ground medieval town plans in Ireland.',
    whenUsed: { start: 1200, end: 1700 },
    whatToLookFor:
      'Two surviving tower houses (one with five storeys), the substantial remains of the Augustinian priory, the Franciscan friary ruins, and St Nicholas\' church — all within a short walking circuit through fields and scrubland beside Bannow Bay.',
    accessStatus: 'accessible',
    accessNote:
      'Freely accessible. A looped walking trail connects the main monuments. No facilities on site. Park at the end of the lane from Wellingtonbridge.',
    isMonument: true,
    smrRef: 'WX045-012001-',
    county: 'Wexford',
  },
  {
    id: 'wex-013',
    name: 'Nook Promontory Fort',
    type: 'Promontory Fort',
    period: 'iron_age',
    lat: 52.26254,
    lng: -6.97469,
    whatItIs:
      'An Iron Age coastal promontory fort on the cliffs north of Duncannon — a sea-cliff headland cut off by a defensive bank and ditch, reusing a natural landform as a fortification.',
    whyItMatters:
      'Promontory forts are found all along the Irish Atlantic coast and date mainly to the Iron Age (c. 600 BC–400 AD). Three sides are defended by sheer cliffs; a single bank and ditch seals the landward approach. They were used by communities who lived from the sea — fishing, raiding, and trading — and who chose the most dramatic coastal features to both occupy and signal power.',
    whenUsed: { start: -600, end: 400 },
    whatToLookFor:
      'The earthen bank (with outer ditch) running across the neck of the promontory, cutting it off from the mainland. The cliff-top views over the Hook Peninsula and the Barrow estuary are extraordinary. Duncannon Fort (built 1587) is visible to the south.',
    accessStatus: 'accessible',
    accessNote:
      'Accessible via the coastal walk near Duncannon. Take care near cliff edges. No facilities.',
    isMonument: true,
    smrRef: 'WX044-002001-',
    county: 'Wexford',
  },
  {
    id: 'wex-014',
    name: 'Newbawn Portal Tomb',
    type: 'Portal Tomb (Dolmen)',
    period: 'stone_age',
    lat: 52.33943,
    lng: -6.78304,
    whatItIs:
      'A Neolithic megalithic portal tomb near New Ross — a Stone Age burial monument quietly surviving in the agricultural landscape of south-west Wexford.',
    whyItMatters:
      'New Ross and the Barrow valley were important passage routes between the interior and the sea in every period of Irish prehistory. Portal tombs cluster in areas of good farmland — their builders were early farmers who established the first permanent fields and the first permanent cemeteries. This tomb has survived over 5,000 years of ploughing, road-building, and land drainage — a remarkable continuity.',
    whenUsed: { start: -4000, end: -3000 },
    whatToLookFor:
      'The large upright portal stones and the massive capstone. Portal tombs have a distinctive angular silhouette — the capstone raised at the front and sloping backward. The surrounding farmland would have looked very different when the monument was built — open forest rather than enclosed fields.',
    accessStatus: 'accessible',
    accessNote: 'In open farmland near New Ross. Visible from the road. Approach respectfully.',
    isMonument: true,
    smrRef: 'WX035-052----',
    county: 'Wexford',
  },
  {
    id: 'wex-015',
    name: 'Selskar Abbey, Wexford',
    irishName: 'Mainistir Shéalascair',
    type: 'Augustinian Abbey',
    period: 'medieval',
    lat: 52.33660,
    lng: -6.45910,
    whatItIs:
      'The ruined 12th-century Augustinian priory inside the walls of Wexford town — where Henry II of England came to do penance for the murder of Thomas Becket in 1172.',
    whyItMatters:
      'After Henry II ordered the killing of Archbishop Thomas Becket at Canterbury in 1170, he spent Lent 1172 at Selskar "doing penance for his sins". The priory became the most politically significant religious house in Norman Ireland for a brief period. The 1169 Treaty of Windsor — which confirmed the submission of the Irish kings to Henry — may have been drafted during his stay in Wexford. The ruins stand within the medieval town walls, with the Westgate Tower nearby.',
    whenUsed: { start: 1190, end: 1540 },
    whatToLookFor:
      'The substantial tower and nave walls of the monastic church, the medieval graveyard within the ruins, and the stretch of Wexford\'s medieval town wall that runs adjacent. The Westgate Tower (13th century) is just to the north along the wall.',
    accessStatus: 'accessible',
    accessNote: 'Located on Westgate Street in Wexford town. The ruins are freely accessible. The Westgate Heritage Centre provides town wall context.',
    isMonument: true,
    smrRef: 'WX037-034----',
    county: 'Wexford',
  },
];
