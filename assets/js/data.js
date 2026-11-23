/**
 * Serop Kizirian Development: site data.
 *
 * MEDIA: every photo registered once by id (src = full WebP, thumb = 720px WebP,
 * lqip = tiny blurred preview shown while it loads). Unregistered ids draw the
 * gold elevation placeholder, so a project with no photos still looks finished.
 *
 * PROJECTS: order here = order on the site. Fill in when the project content arrives.
 * pin is an approximate [lat, lon] for the schematic map (confirm with the client).
 * region drives the location filter; highlights (optional) is a list of short lines
 * shown on the project page.
 */
window.SK_MEDIA = {
  "villa-aerial": { src: "assets/media/renders/villa-aerial.webp", thumb: "assets/media/renders/villa-aerial-sm.webp", lqip: "data:image/webp;base64,UklGRhYBAABXRUJQVlA4IAoBAAAwBwCdASoUAC8APu1krlEppKQiqrgKATAdiUAY/TXuMBpWjd7CE5mT2ehXJLNf57Q63PnXO90naiKnOpgifdF3OAgA/u5+7K+a3ErZ0Kk7EDTKr1IdDihzlllyhJXo2dnQGaFQOvTWN0z5TIRtcD+JA3N/cCMtvcnwYKEADW09ZZ/qjTzzTrMXYW+7wFDXEMbFJLxbe79ZoTi8EGhsxlE9VOrXqD3HgfyrwT7BVGfcIP5KBtU63IzwXL+wK74f/Abxt3h6ILXz9DwWbip+OK7V/610SxtuJVHr4AvZ9msSifCzYUvMP3hymx/aATGhJkUeDxFnOhy3bibvaczR7xkQ/HGwi2MNULgAAA==", width: 688, height: 1602, alt: "Aerial render of a modern villa with a pool, palms and timber planters" },
  "pool-terrace": { src: "assets/media/renders/pool-terrace.webp", thumb: "assets/media/renders/pool-terrace-sm.webp", lqip: "data:image/webp;base64,UklGRnwAAABXRUJQVlA4IHAAAAAQBACdASoUAAwAPu1iqU2ppaOiMAgBMB2JQBOmUABwV/81PbxzhVahAADw4X6UXLbGiuKNHpJnX8Q+aa0bt+MC615G+BhInqnyeJhPRG3ndIa72TfIDI20vkaZJs4RbPIwYO0lTmhYCNPwh0BgkgAA", width: 1284, height: 754, alt: "Render of a villa terrace with a lit pool, timber deck and green walls" }
};

window.SK_PROJECTS = [
  {
    slug: "kfarjarra-hills",
    pin: [33.548, 35.435],
    region: "Saida area",
    map: "https://www.google.com/maps/search/?api=1&query=Kfarjarra+Saida+Lebanon",
    title: "Kfarjarra Hills",
    location: "Kfarjarra, minutes from Saida",
    type: "Villas",
    summary: "Villas on the hills above Saida.",
    description: "",
    facts: [],
    coverId: "",
    galleryIds: []
  },
  {
    slug: "chehime",
    pin: [33.632, 35.486],
    region: "Chouf",
    map: "https://www.google.com/maps/search/?api=1&query=Chehime+Lebanon",
    title: "Chehime",
    location: "Chehime, Chouf",
    type: "Villas",
    summary: "Villas near our Chehime office.",
    description: "",
    facts: [],
    coverId: "",
    galleryIds: []
  },
  {
    slug: "ain-el-delb",
    pin: [33.553, 35.395],
    region: "Saida area",
    map: "https://www.google.com/maps/search/?api=1&query=Ain+El+Delb+Saida+Lebanon",
    title: "Ain El Delb",
    location: "Ain El Delb, Saida",
    type: "Villas",
    summary: "Homes on the edge of Saida.",
    description: "",
    facts: [],
    coverId: "",
    galleryIds: []
  },
  {
    slug: "qrayeh",
    pin: [33.537, 35.407],
    region: "Saida area",
    map: "https://www.google.com/maps/search/?api=1&query=Qrayeh+Saida+Lebanon",
    title: "Qrayeh",
    location: "Qrayeh, Saida",
    type: "Villas",
    summary: "Homes in the Saida hills.",
    description: "",
    facts: [],
    coverId: "",
    galleryIds: []
  }
];

window.SK_CONTACT = {
  whatsapp: "96181309384",
  phones: [
    { display: "+961 81 309 384", wa: "96181309384", tel: "+96181309384" },
    { display: "+961 76 716 617", wa: "96176716617", tel: "+96176716617" }
  ],
  offices: [
    { name: "Main office", place: "Baasiri Street, Saida", pin: [33.563, 35.372], map: "https://www.google.com/maps/search/?api=1&query=Serop+Kizirian+Development+Baasiri+Street+Saida" },
    { name: "Second office", place: "Chehime", pin: [33.629, 35.481], map: "https://www.google.com/maps/search/?api=1&query=Chehime+Lebanon" }
  ],
  instagram: "seropkiziriandevelopment"
};
