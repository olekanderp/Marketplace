"use strict";

/**
 * Deterministic demo dataset shared by the seeders.
 * Fixed UUIDs keep the seeders idempotent and let us wire up relations by hand.
 */
const bcrypt = require("bcryptjs");

const PASSWORD = "Password123!";
const HASH = bcrypt.hashSync(PASSWORD, 10);

const day = 86_400_000;
const daysAgo = (n) => new Date(Date.now() - n * day);

const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

/* ── Users ───────────────────────────────────────────────────────────── */

const U = {
  manager: id(1),
  sellerAlex: id(10),
  sellerBianca: id(11),
  sellerCaio: id(12),
  sellerDana: id(13),
  sellerSpam: id(19), // suspended — demonstrates moderation
  buyerFinn: id(20),
  buyerGreta: id(21),
  buyerHugo: id(22),
  buyerInes: id(23),
  buyerJack: id(24),
  buyerKira: id(25),
};

const users = [
  { id: U.manager, email: "manager@n5deal.test", name: "Morgan Platform", role: "manager", status: "active" },
  { id: U.sellerAlex, email: "alex.seller@n5deal.test", name: "Alex Nakamura", role: "seller", status: "active" },
  { id: U.sellerBianca, email: "bianca.seller@n5deal.test", name: "Bianca Ferreira", role: "seller", status: "active" },
  { id: U.sellerCaio, email: "caio.seller@n5deal.test", name: "Caio Almeida", role: "seller", status: "active" },
  { id: U.sellerDana, email: "dana.seller@n5deal.test", name: "Dana Volkov", role: "seller", status: "active" },
  { id: U.sellerSpam, email: "flagged.seller@n5deal.test", name: "Quick Flip Holdings", role: "seller", status: "suspended" },
  { id: U.buyerFinn, email: "finn.buyer@n5deal.test", name: "Finn Larsson", role: "buyer", status: "active" },
  { id: U.buyerGreta, email: "greta.buyer@n5deal.test", name: "Greta Hoffmann", role: "buyer", status: "active" },
  { id: U.buyerHugo, email: "hugo.buyer@n5deal.test", name: "Hugo Marchetti", role: "buyer", status: "active" },
  { id: U.buyerInes, email: "ines.buyer@n5deal.test", name: "Inês Costa", role: "buyer", status: "active" },
  { id: U.buyerJack, email: "jack.buyer@n5deal.test", name: "Jack Thompson", role: "buyer", status: "active" },
  { id: U.buyerKira, email: "kira.buyer@n5deal.test", name: "Kira Blum", role: "buyer", status: "active" },
];

/* ── Profiles ────────────────────────────────────────────────────────── */

const sellerProfiles = [
  { userId: U.sellerAlex, companyName: "Meridian Licensing Partners", about: "We build and exit regulated payment and EMI structures across the EEA and UK.", website: "https://meridian.example.com" },
  { userId: U.sellerBianca, companyName: "Ferreira Capital", about: "Boutique advisory divesting fintech and banking assets in LATAM.", website: null },
  { userId: U.sellerCaio, companyName: "Almeida Ventures", about: "Founder-led studio selling crypto and forex operations.", website: null },
  { userId: U.sellerDana, companyName: "Volkov Group", about: "Cross-border banking and BaaS infrastructure divestments.", website: "https://volkov.example.com" },
];

const buyerProfiles = [
  {
    userId: U.buyerFinn,
    headline: "Nordic PSP consolidating EEA payment licences",
    bio: "Corp-dev lead at a Nordic payments group. We acquire licensed PIs to enter new EEA markets fast.",
    mandate: "Seeking EU/EEA Payment Institution or EMI licences with live processing. Prefer SEPA direct participation, clean AML history, <25 staff.",
    targetSectors: ["payment", "emi"],
    targetJurisdictions: ["Lithuania", "Germany", "Estonia", "Poland"],
    ticketMin: 500000, ticketMax: 6000000, currency: "EUR",
  },
  {
    userId: U.buyerGreta,
    headline: "Family office — regulated banking exposure",
    bio: "Single-family office in Frankfurt building a regulated financial-services portfolio.",
    mandate: "Interested in small banks, BaaS providers and credit institutions in the EU. Long hold. Will consider majority stakes only.",
    targetSectors: ["bank", "fintech"],
    targetJurisdictions: ["Germany", "Lithuania", "Switzerland"],
    ticketMin: 2000000, ticketMax: 40000000, currency: "EUR",
  },
  {
    userId: U.buyerHugo,
    headline: "Crypto exchange operator expanding into MiCA",
    bio: "COO of a mid-size exchange. Acquiring CASP/VASP licences ahead of MiCA.",
    mandate: "Looking for crypto/VASP licensed entities in the EU with banking rails. Speed and regulatory standing matter more than price.",
    targetSectors: ["crypto"],
    targetJurisdictions: ["Lithuania", "Estonia", "Cyprus"],
    ticketMin: 200000, ticketMax: 3000000, currency: "USD",
  },
  {
    userId: U.buyerInes,
    headline: "LATAM fintech roll-up",
    bio: "Investment manager running a Brazil-focused fintech roll-up.",
    mandate: "Payment institutions and BaaS platforms in Brazil with real TPV. Open to distressed assets.",
    targetSectors: ["payment", "fintech"],
    targetJurisdictions: ["Brazil"],
    ticketMin: null, ticketMax: 20000000, currency: "USD",
  },
  {
    userId: U.buyerJack,
    headline: "UK EMI acquirer",
    bio: "Serial fintech founder looking for a UK FCA-authorised EMI to relaunch.",
    mandate: "UK EMI or API licence, dormant or active. Small team. Ready to move within 60 days.",
    targetSectors: ["emi", "payment"],
    targetJurisdictions: ["United Kingdom"],
    ticketMin: 100000, ticketMax: 2500000, currency: "GBP",
  },
  {
    userId: U.buyerKira,
    headline: "Generalist — still defining mandate",
    bio: "Exploring the marketplace.",
    mandate: "",
    targetSectors: [],
    targetJurisdictions: [],
    ticketMin: null, ticketMax: null, currency: "USD",
  },
];

/* ── Assets ──────────────────────────────────────────────────────────── */

const A = {
  ltEmi: id(100), deBank: id(101), brPi: id(102), ltCasp: id(103),
  ukEmi: id(104), eeApi: id(105), chBaas: id(106), cyForex: id(107),
  brBaas: id(108), plApi: id(109), ltPiDormant: id(110), deFintech: id(111),
  aeCrypto: id(112), sgPayment: id(113), draftOne: id(114), draftTwo: id(115),
  spamAsset: id(119),
};

const assets = [
  {
    id: A.ltEmi, sellerId: U.sellerAlex, slug: "lithuania-emi-sepa-direct-100",
    title: "Lithuania EMI licence with SEPA direct participation",
    description:
      "Fully licensed Electronic Money Institution authorised by the Bank of Lithuania. Direct SEPA (SCT/SCT Inst/SDD) participant with its own BIC, live BaaS clients and an in-house core ledger. IBAN issuance, SEPA, card programme (BIN sponsor in place), and an integrated AML/KYC stack. Around 18 FTE. Clean regulatory record, no open enforcement actions.",
    sector: "emi", licenseType: "EMI", country: "Lithuania", businessStatus: "active",
    askingPrice: 4200000, currency: "EUR", yearIssued: 2020, employees: "18",
    regulator: "Bank of Lithuania",
    highlights: ["SEPA direct participant", "Own BIC", "Live BaaS clients", "Card BIN sponsorship", "In-house AML/KYC"],
    status: "published", views: 214, createdAt: daysAgo(6),
  },
  {
    id: A.deBank, sellerId: U.sellerDana, slug: "germany-credit-institution-baas-101",
    title: "Germany credit institution (BaaS) — BaFin licensed",
    description:
      "BaFin-licensed credit institution operating a Banking-as-a-Service platform. Deposit-taking and lending permissions, connected to Bundesbank payment rails, EU passporting active for 12 member states. ~40 staff, profitable at EBITDA level. Sale driven by group restructuring.",
    sector: "bank", licenseType: "CRR credit institution", country: "Germany", businessStatus: "active",
    askingPrice: 28000000, currency: "EUR", yearIssued: 2016, employees: "41",
    regulator: "BaFin",
    highlights: ["Deposit + lending permissions", "EU passporting (12 states)", "Bundesbank connection", "EBITDA positive"],
    status: "published", views: 502, createdAt: daysAgo(15),
  },
  {
    id: A.brPi, sellerId: U.sellerBianca, slug: "brazil-payment-institution-pix-102",
    title: "Brazil Payment Institution — direct PIX participant",
    description:
      "Instituição de Pagamento authorised by the Banco Central do Brasil, direct PIX participant with its own settlement account. Issuing, acquiring and cross-border FX (eFX) permissions. Multi-billion-Real annual TPV, hundreds of thousands of accounts, Mastercard issuer via sub-BIN.",
    sector: "payment", licenseType: "PI - Instituição de Pagamento", country: "Brazil", businessStatus: "active",
    askingPrice: null, currency: "USD", yearIssued: 2019, employees: "60",
    regulator: "Banco Central do Brasil",
    highlights: ["Direct PIX participation", "Own settlement code", "eFX cross-border", "Mastercard issuer", "Multi-billion BRL TPV"],
    status: "published", views: 331, createdAt: daysAgo(3),
  },
  {
    id: A.ltCasp, sellerId: U.sellerCaio, slug: "lithuania-crypto-casp-banking-103",
    title: "Lithuania crypto company (CASP) with banking rails",
    description:
      "Registered virtual asset service provider transitioning to full MiCA CASP authorisation. Fiat on/off ramp via two EU banking partners, custody and exchange services, AML programme audited in 2025. ~9 staff.",
    sector: "crypto", licenseType: "CASP (MiCA transition)", country: "Lithuania", businessStatus: "active",
    askingPrice: 1350000, currency: "EUR", yearIssued: 2022, employees: "9",
    regulator: "Bank of Lithuania",
    highlights: ["Fiat on/off ramp", "2 EU banking partners", "Custody + exchange", "MiCA transition filed"],
    status: "published", views: 148, createdAt: daysAgo(9),
  },
  {
    id: A.ukEmi, sellerId: U.sellerAlex, slug: "uk-fca-emi-authorised-104",
    title: "UK FCA-authorised EMI — low volume, clean",
    description:
      "FCA-authorised Electronic Money Institution. Currently low transaction volume after a strategic wind-down of the consumer product. Safeguarding accounts in place, agent/distributor network dormant. Ideal shell for relaunch.",
    sector: "emi", licenseType: "EMI (FCA)", country: "United Kingdom", businessStatus: "dormant",
    askingPrice: 950000, currency: "GBP", yearIssued: 2018, employees: "4",
    regulator: "FCA",
    highlights: ["FCA authorised", "Safeguarding in place", "Clean AML record", "Relaunch-ready"],
    status: "published", views: 276, createdAt: daysAgo(21),
  },
  {
    id: A.eeApi, sellerId: U.sellerCaio, slug: "estonia-payment-institution-api-105",
    title: "Estonia Payment Institution (API) with PIS/AIS",
    description:
      "Estonian Payment Institution authorised for PIS and AIS plus money remittance. Open banking connectivity to 2,000+ EU banks via a maintained aggregation layer. 6 staff, remote-first.",
    sector: "payment", licenseType: "API - Authorised Payment Institution", country: "Estonia", businessStatus: "active",
    askingPrice: 1800000, currency: "EUR", yearIssued: 2021, employees: "6",
    regulator: "Finantsinspektsioon",
    highlights: ["PIS + AIS", "Money remittance", "2,000+ bank connections", "Remote team"],
    status: "published", views: 190, createdAt: daysAgo(12),
  },
  {
    id: A.chBaas, sellerId: U.sellerDana, slug: "switzerland-fintech-baas-106",
    title: "Switzerland fintech licence (BaaS) — FINMA",
    description:
      "FINMA fintech licence (Art. 1b BankG) operating an embedded-finance platform. Deposits up to CHF 100m, no interest, no lending. White-label wallet and card issuing through partners. ~15 staff.",
    sector: "fintech", licenseType: "FINMA fintech licence (Art. 1b)", country: "Switzerland", businessStatus: "active",
    askingPrice: 6500000, currency: "USD", yearIssued: 2020, employees: "15",
    regulator: "FINMA",
    highlights: ["FINMA fintech licence", "Embedded finance platform", "White-label wallet + cards"],
    status: "published", views: 233, createdAt: daysAgo(30),
  },
  {
    id: A.cyForex, sellerId: U.sellerCaio, slug: "cyprus-forex-cif-cysec-107",
    title: "Cyprus forex brokerage (CIF) — CySEC licensed",
    description:
      "Cyprus Investment Firm licensed by CySEC for dealing on own account and reception/transmission of orders. Active retail book, MT4/MT5, PSP integrations, EU passporting. ~22 staff.",
    sector: "forex", licenseType: "CIF (CySEC)", country: "Cyprus", businessStatus: "active",
    askingPrice: 3100000, currency: "EUR", yearIssued: 2017, employees: "22",
    regulator: "CySEC",
    highlights: ["CySEC CIF licence", "Active retail book", "MT4/MT5", "EU passporting"],
    status: "published", views: 205, createdAt: daysAgo(18),
  },
  {
    id: A.brBaas, sellerId: U.sellerBianca, slug: "brazil-baas-platform-108",
    title: "Brazil BaaS platform (SCD) — credit fintech",
    description:
      "Sociedade de Crédito Direto authorised by BACEN. Lends from own capital, credit-as-a-service APIs, 20+ contracted partners. Loan book ~R$120m, low NPL. 35 staff.",
    sector: "fintech", licenseType: "SCD - Sociedade de Crédito Direto", country: "Brazil", businessStatus: "active",
    askingPrice: 9000000, currency: "USD", yearIssued: 2019, employees: "35",
    regulator: "Banco Central do Brasil",
    highlights: ["BACEN SCD licence", "Credit-as-a-service APIs", "R$120m loan book", "20+ partners"],
    status: "published", views: 177, createdAt: daysAgo(24),
  },
  {
    id: A.plApi, sellerId: U.sellerAlex, slug: "poland-small-payment-institution-109",
    title: "Poland Small Payment Institution (MIP)",
    description:
      "KNF-registered Small Payment Institution. Monthly turnover cap EUR 1.5m, upgrade path to full NKIP prepared. Good option for a controlled EU market entry. 3 staff.",
    sector: "payment", licenseType: "MIP - Small Payment Institution", country: "Poland", businessStatus: "active",
    askingPrice: 260000, currency: "EUR", yearIssued: 2023, employees: "3",
    regulator: "KNF",
    highlights: ["KNF registered", "Upgrade path to full PI", "Low run-rate cost"],
    status: "published", views: 121, createdAt: daysAgo(5),
  },
  {
    id: A.ltPiDormant, sellerId: U.sellerDana, slug: "lithuania-payment-institution-dormant-110",
    title: "Lithuania Payment Institution — dormant, licence live",
    description:
      "Payment Institution licence from the Bank of Lithuania, operations paused 14 months ago. Licence in good standing, annual reporting maintained. No staff currently; founder available for transition.",
    sector: "payment", licenseType: "PI - Payment Institution", country: "Lithuania", businessStatus: "dormant",
    askingPrice: 700000, currency: "EUR", yearIssued: 2020, employees: "0",
    regulator: "Bank of Lithuania",
    highlights: ["Licence in good standing", "Reporting maintained", "Founder-led transition"],
    status: "published", views: 264, createdAt: daysAgo(40),
  },
  {
    id: A.deFintech, sellerId: U.sellerDana, slug: "germany-fintech-tipp-agent-111",
    title: "Germany fintech — tied agent (§ 3 WpIG) investment platform",
    description:
      "Investment platform operating as a tied agent under a German liability umbrella. Robo-advisory and brokerage front end, 4,500 active users, EUR 60m AUM. Path to own § 15 WpIG licence scoped.",
    sector: "fintech", licenseType: "Tied agent (§ 3 WpIG)", country: "Germany", businessStatus: "active",
    askingPrice: 2400000, currency: "EUR", yearIssued: 2021, employees: "11",
    regulator: "BaFin (via umbrella)",
    highlights: ["4,500 active users", "EUR 60m AUM", "Robo-advisory + brokerage"],
    status: "published", views: 139, createdAt: daysAgo(11),
  },
  {
    id: A.aeCrypto, sellerId: U.sellerCaio, slug: "uae-vara-crypto-broker-dealer-112",
    title: "UAE VARA crypto broker-dealer licence",
    description:
      "Dubai VARA licence for Broker-Dealer Services in virtual assets. Office and local team in place, banking with a regional bank, OTC desk live. 8 staff.",
    sector: "crypto", licenseType: "VARA Broker-Dealer", country: "United Arab Emirates", businessStatus: "active",
    askingPrice: 2900000, currency: "USD", yearIssued: 2023, employees: "8",
    regulator: "VARA (Dubai)",
    highlights: ["VARA licensed", "Local office + team", "Regional bank account", "OTC desk live"],
    status: "published", views: 158, createdAt: daysAgo(8),
  },
  {
    id: A.sgPayment, sellerId: U.sellerDana, slug: "singapore-mpi-payment-services-113",
    title: "Singapore Major Payment Institution (MPI)",
    description:
      "MAS Major Payment Institution licence covering account issuance, domestic and cross-border transfers, merchant acquisition and e-money. Live corridors into SEA, ~28 staff.",
    sector: "payment", licenseType: "MPI (MAS)", country: "Singapore", businessStatus: "active",
    askingPrice: 12500000, currency: "USD", yearIssued: 2020, employees: "28",
    regulator: "MAS",
    highlights: ["MAS MPI licence", "Cross-border transfers", "Merchant acquiring", "Live SEA corridors"],
    status: "published", views: 288, createdAt: daysAgo(17),
  },
  {
    id: A.draftOne, sellerId: U.sellerAlex, slug: "malta-emi-in-preparation-114",
    title: "Malta EMI — application in preparation",
    description: "Draft listing. MFSA EMI application being assembled; not yet published.",
    sector: "emi", licenseType: "EMI (MFSA)", country: "Malta", businessStatus: "in_development",
    askingPrice: 300000, currency: "EUR", yearIssued: null, employees: "2",
    regulator: "MFSA",
    highlights: [],
    status: "draft", views: 0, createdAt: daysAgo(2),
  },
  {
    id: A.draftTwo, sellerId: U.sellerBianca, slug: "brazil-forex-corretora-draft-115",
    title: "Brazil FX brokerage — early draft",
    description: "Draft. Corretora de câmbio, details being finalised with the founder.",
    sector: "forex", licenseType: "Corretora de câmbio", country: "Brazil", businessStatus: "active",
    askingPrice: null, currency: "USD", yearIssued: 2015, employees: "12",
    regulator: "Banco Central do Brasil",
    highlights: [],
    status: "draft", views: 0, createdAt: daysAgo(1),
  },
  {
    id: A.spamAsset, sellerId: U.sellerSpam, slug: "guaranteed-returns-offshore-license-119",
    title: "GUARANTEED offshore licence — instant approval no KYC",
    description: "Suspended by the platform for non-compliance with listing rules.",
    sector: "crypto", licenseType: "n/a", country: "Cyprus", businessStatus: "active",
    askingPrice: 50000, currency: "USD", yearIssued: null, employees: "0",
    regulator: null,
    highlights: ["No due diligence"],
    status: "suspended", views: 3, createdAt: daysAgo(4),
  },
];

/* ── Conversations ───────────────────────────────────────────────────── */

const C = { finnAlex: id(300), jackAlex: id(301), inesBianca: id(302) };

const conversations = [
  {
    id: C.finnAlex, assetId: A.ltEmi, buyerId: U.buyerFinn, sellerId: U.sellerAlex,
    subject: "Re: Lithuania EMI licence with SEPA direct participation",
    messages: [
      { senderId: U.buyerFinn, body: "Hi Alex — interested in the Lithuania EMI. Is the SEPA Inst participation direct or via a sponsor bank? And can you share the AML audit date?", offsetMin: 0 },
      { senderId: U.sellerAlex, body: "Hi Finn. Direct participation, own BIC. Last AML audit was March 2025, no findings. Happy to open a data room after an NDA.", offsetMin: 90 },
      { senderId: U.buyerFinn, body: "Great. Please send the NDA to this address and we'll turn it around today.", offsetMin: 140 },
    ],
  },
  {
    id: C.jackAlex, assetId: A.ukEmi, buyerId: U.buyerJack, sellerId: U.sellerAlex,
    subject: "Re: UK FCA-authorised EMI — low volume, clean",
    messages: [
      { senderId: U.buyerJack, body: "Is the FCA authorisation full EMI or small EMI? And are safeguarding accounts currently funded?", offsetMin: 0 },
      { senderId: U.sellerAlex, body: "Full EMI. Safeguarding accounts are open with a small float. Change in control would need FCA approval — figure ~3 months.", offsetMin: 30 },
    ],
  },
  {
    id: C.inesBianca, assetId: A.brPi, buyerId: U.buyerInes, sellerId: U.sellerBianca,
    subject: "Re: Brazil Payment Institution — direct PIX participant",
    messages: [
      { senderId: U.buyerInes, body: "What's driving the sale, and is the asking price really on LOI only? We can move quickly on the right structure.", offsetMin: 0 },
    ],
  },
];

module.exports = {
  PASSWORD,
  HASH,
  daysAgo,
  U,
  A,
  C,
  users,
  sellerProfiles,
  buyerProfiles,
  assets,
  conversations,
};
