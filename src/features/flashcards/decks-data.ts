import type { FlashcardCategory, FlashcardDeck } from "./types";

export const FLASHCARD_CATEGORY_LABELS: Record<FlashcardCategory, string> = {
  office: "Office & Operations",
  contracts: "Contracts & Negotiation",
  finance: "Finance & Accounting",
  travel: "Travel & Hospitality",
  marketing: "Marketing & Sales",
  hr: "HR & Recruitment",
  custom: "My Decks",
};

export const BUILTIN_FLASHCARD_DECKS: readonly FlashcardDeck[] = [
  {
    id: "deck-office",
    slug: "office-operations",
    title: "Office & Business Operations",
    description:
      "Core vocabulary for meeting schedules, internal notices, equipment, and workflows commonly seen in Part 3, 4, and 7.",
    category: "office",
    targetScore: "500–750+",
    estimatedMinutes: 8,
    cards: [
      {
        id: "off-1",
        term: "itinerary",
        phonetic: "/aɪˈtɪn.ə.rer.i/",
        partOfSpeech: "noun",
        meaningVi: "detailed schedule or plan (for a trip or business travel)",
        exampleEn:
          "Please review the updated travel itinerary before Monday's flight.",
        exampleVi:
          "Please review the updated business travel schedule before Monday's flight.",
        collocations: [
          "travel itinerary",
          "detailed itinerary",
          "revise an itinerary",
        ],
        toeicPart: "Part 3 · Part 7",
        level: "B2",
      },
      {
        id: "off-2",
        term: "accommodate",
        phonetic: "/əˈkɑː.mə.deɪt/",
        partOfSpeech: "verb",
        meaningVi:
          "meet (a need or request); hold or seat (a number of people)",
        exampleEn:
          "The conference hall can accommodate up to 300 attendees comfortably.",
        exampleVi: "The hall can comfortably seat up to 300 attendees.",
        collocations: [
          "accommodate a request",
          "accommodate guests",
          "accommodate changes",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "B2",
      },
      {
        id: "off-3",
        term: "agenda",
        phonetic: "/əˈdʒen.də/",
        partOfSpeech: "noun",
        meaningVi: "meeting agenda, list of topics to discuss",
        exampleEn:
          "The budget review is the first item on today's meeting agenda.",
        exampleVi: "Budget review is the first item on today's meeting agenda.",
        collocations: ["on the agenda", "set the agenda", "meeting agenda"],
        toeicPart: "Part 3 · Part 4",
        level: "B1",
      },
      {
        id: "off-4",
        term: "mandatory",
        phonetic: "/ˈmæn.də.tɔːr.i/",
        partOfSpeech: "adjective",
        meaningVi: "required by rule or policy, compulsory",
        exampleEn:
          "Attendance at the workplace safety briefing is mandatory for all staff.",
        exampleVi:
          "Attending the workplace safety briefing is mandatory for all employees.",
        collocations: [
          "mandatory training",
          "mandatory requirement",
          "make it mandatory",
        ],
        toeicPart: "Part 5 · Part 6",
        level: "B2",
      },
      {
        id: "off-5",
        term: "streamline",
        phonetic: "/ˈstriːm.laɪn/",
        partOfSpeech: "verb",
        meaningVi: "simplify and optimize a process",
        exampleEn:
          "The new software will streamline our invoice approval workflow.",
        exampleVi:
          "The new software will optimize our invoice approval process.",
        collocations: [
          "streamline operations",
          "streamline a process",
          "streamline production",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "C1",
      },
      {
        id: "off-6",
        term: "correspondence",
        phonetic: "/ˌkɔːr.əˈspɑːn.dəns/",
        partOfSpeech: "noun",
        meaningVi: "written communication, letters or emails exchanged",
        exampleEn:
          "All client correspondence must be archived in the shared folder.",
        exampleVi:
          "All written communication with clients must be archived in the shared folder.",
        collocations: [
          "business correspondence",
          "official correspondence",
          "handle correspondence",
        ],
        toeicPart: "Part 6 · Part 7",
        level: "B2",
      },
      {
        id: "off-7",
        term: "designate",
        phonetic: "/ˈdez.ɪɡ.neɪt/",
        partOfSpeech: "verb",
        meaningVi: "officially assign or appoint for a specific purpose",
        exampleEn:
          "Management designated the second floor as a quiet working zone.",
        exampleVi:
          "Management designated the second floor as a quiet work zone.",
        collocations: [
          "designated area",
          "designate a representative",
          "designated parking",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "C1",
      },
      {
        id: "off-8",
        term: "promptly",
        phonetic: "/ˈprɑːmpt.li/",
        partOfSpeech: "adverb",
        meaningVi: "on time, quickly, without delay",
        exampleEn:
          "The quarterly orientation session will begin promptly at 9:00 A.M.",
        exampleVi:
          "The quarterly orientation session will start promptly at 9:00 A.M.",
        collocations: [
          "respond promptly",
          "arrive promptly",
          "begin promptly at",
        ],
        toeicPart: "Part 4 · Part 5",
        level: "B2",
      },
    ],
  },
  {
    id: "deck-contracts",
    slug: "contracts-negotiation",
    title: "Contracts & Commercial Negotiation",
    description:
      "Master terms for clauses, renewals, compliance, and agreements that appear frequently in Part 6-7 emails and notices.",
    category: "contracts",
    targetScore: "650–850+",
    estimatedMinutes: 9,
    cards: [
      {
        id: "con-1",
        term: "stipulate",
        phonetic: "/ˈstɪp.jə.leɪt/",
        partOfSpeech: "verb",
        meaningVi: "state clearly as a requirement in a contract or agreement",
        exampleEn:
          "The lease stipulates that tenants must give 30 days' notice before moving out.",
        exampleVi:
          "The lease specifies that tenants must give 30 days' notice before moving out.",
        collocations: [
          "stipulate conditions",
          "as stipulated in",
          "contract stipulates",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "C1",
      },
      {
        id: "con-2",
        term: "abide by",
        phonetic: "/əˈbaɪd baɪ/",
        partOfSpeech: "phrasal verb",
        meaningVi: "follow or comply with (rules, terms, an agreement)",
        exampleEn:
          "Both parties agreed to abide by the revised confidentiality clause.",
        exampleVi:
          "Both sides agreed to comply with the amended confidentiality clause.",
        collocations: [
          "abide by the terms",
          "abide by regulations",
          "abide by an agreement",
        ],
        toeicPart: "Part 5 · Part 6",
        level: "B2",
      },
      {
        id: "con-3",
        term: "provision",
        phonetic: "/prəˈvɪʒ.ən/",
        partOfSpeech: "noun",
        meaningVi: "clause or term in a contract; act of supplying",
        exampleEn:
          "We added a warranty provision covering replacement parts for two years.",
        exampleVi:
          "We added a warranty clause covering replacement parts for two years.",
        collocations: [
          "contract provision",
          "under the provisions of",
          "make provision for",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "C1",
      },
      {
        id: "con-4",
        term: "renew",
        phonetic: "/rɪˈnuː/",
        partOfSpeech: "verb",
        meaningVi: "extend the validity of (a contract, subscription, license)",
        exampleEn:
          "Clients who renew their annual subscription early receive a 15% discount.",
        exampleVi:
          "Customers who renew their annual plan early get a 15% discount.",
        collocations: [
          "renew a contract",
          "automatic renewal",
          "renew a membership",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "B1",
      },
      {
        id: "con-5",
        term: "obligate",
        phonetic: "/ˈɑːb.lɪ.ɡeɪt/",
        partOfSpeech: "verb",
        meaningVi: "bind legally or morally to a duty",
        exampleEn:
          "The supplier is obligated to deliver all components by Friday.",
        exampleVi:
          "The supplier is required to deliver all components before Friday.",
        collocations: [
          "be obligated to",
          "contractual obligation",
          "meet an obligation",
        ],
        toeicPart: "Part 5 · Part 6",
        level: "B2",
      },
      {
        id: "con-6",
        term: "amendment",
        phonetic: "/əˈmend.mənt/",
        partOfSpeech: "noun",
        meaningVi: "formal change or addition to a document or contract",
        exampleEn:
          "Any amendment to the service agreement requires written approval.",
        exampleVi:
          "Any revision to the service agreement requires written approval.",
        collocations: [
          "proposed amendment",
          "make an amendment",
          "contract amendment",
        ],
        toeicPart: "Part 6 · Part 7",
        level: "C1",
      },
      {
        id: "con-7",
        term: "consensus",
        phonetic: "/kənˈsen.səs/",
        partOfSpeech: "noun",
        meaningVi: "general agreement among a group",
        exampleEn:
          "After two hours of negotiation, the committee reached a consensus.",
        exampleVi:
          "After two hours of negotiation, the committee reached a general agreement.",
        collocations: [
          "reach a consensus",
          "broad consensus",
          "build consensus",
        ],
        toeicPart: "Part 3 · Part 7",
        level: "C1",
      },
      {
        id: "con-8",
        term: "terminate",
        phonetic: "/ˈtɜːr.mɪ.neɪt/",
        partOfSpeech: "verb",
        meaningVi: "end or cancel (a contract or partnership)",
        exampleEn:
          "Either company may terminate the partnership upon written notice.",
        exampleVi:
          "Either company may end the partnership upon written notice.",
        collocations: [
          "terminate a contract",
          "early termination",
          "termination fee",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "B2",
      },
    ],
  },
  {
    id: "deck-finance",
    slug: "finance-accounting",
    title: "Finance, Invoicing & Budgeting",
    description:
      "Essential vocabulary for TOEIC revenue reports, reimbursements, audits, and accounting documents.",
    category: "finance",
    targetScore: "600–850+",
    estimatedMinutes: 8,
    cards: [
      {
        id: "fin-1",
        term: "reimburse",
        phonetic: "/ˌriː.ɪmˈbɜːrs/",
        partOfSpeech: "verb",
        meaningVi: "pay back expenses (for business travel or purchases)",
        exampleEn:
          "Keep all hotel receipts so the accounting team can reimburse you.",
        exampleVi:
          "Keep all hotel receipts so the accounting department can repay you.",
        collocations: [
          "reimburse expenses",
          "travel reimbursement",
          "reimbursement form",
        ],
        toeicPart: "Part 3 · Part 7",
        level: "B2",
      },
      {
        id: "fin-2",
        term: "discrepancy",
        phonetic: "/dɪˈskrep.ən.si/",
        partOfSpeech: "noun",
        meaningVi: "difference or mismatch (between figures or invoices)",
        exampleEn:
          "The auditor noticed a discrepancy between the invoice and the purchase order.",
        exampleVi:
          "The auditor spotted a mismatch between the invoice and the purchase order.",
        collocations: [
          "billing discrepancy",
          "resolve a discrepancy",
          "report a discrepancy",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "C1",
      },
      {
        id: "fin-3",
        term: "allocate",
        phonetic: "/ˈæl.ə.keɪt/",
        partOfSpeech: "verb",
        meaningVi: "assign or distribute (funds or resources)",
        exampleEn:
          "The board allocated additional funds to expand the R&D division.",
        exampleVi:
          "The board assigned additional budget to expand the R&D division.",
        collocations: [
          "allocate funds",
          "budget allocation",
          "allocate resources",
        ],
        toeicPart: "Part 5 · Part 6",
        level: "B2",
      },
      {
        id: "fin-4",
        term: "revenue",
        phonetic: "/ˈrev.ə.nuː/",
        partOfSpeech: "noun",
        meaningVi: "total income generated from sales or services",
        exampleEn:
          "Online subscriptions accounted for 40% of our annual revenue.",
        exampleVi:
          "Online subscriptions made up 40% of our total annual income.",
        collocations: ["annual revenue", "generate revenue", "revenue growth"],
        toeicPart: "Part 4 · Part 7",
        level: "B2",
      },
      {
        id: "fin-5",
        term: "overdue",
        phonetic: "/ˌoʊ.vɚˈduː/",
        partOfSpeech: "adjective",
        meaningVi: "past the due date (for payment or delivery)",
        exampleEn:
          "A late fee applies to any balance that is more than 15 days overdue.",
        exampleVi:
          "A late fee applies to any balance more than 15 days past due.",
        collocations: ["overdue payment", "overdue invoice", "long overdue"],
        toeicPart: "Part 5 · Part 7",
        level: "B1",
      },
      {
        id: "fin-6",
        term: "expenditure",
        phonetic: "/ɪkˈspen.dɪ.tʃɚ/",
        partOfSpeech: "noun",
        meaningVi: "money spent, operating expenses",
        exampleEn:
          "We need to curb operating expenditure during the third quarter.",
        exampleVi:
          "We need to control operating costs during the third quarter.",
        collocations: [
          "capital expenditure",
          "reduce expenditure",
          "public expenditure",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "C1",
      },
      {
        id: "fin-7",
        term: "forecast",
        phonetic: "/ˈfɔːr.kæst/",
        partOfSpeech: "noun / verb",
        meaningVi: "prediction or projection of financial performance",
        exampleEn:
          "Analysts forecast steady export demand through the end of the year.",
        exampleVi:
          "Analysts project steady export demand through the end of the year.",
        collocations: [
          "sales forecast",
          "financial forecast",
          "forecast growth",
        ],
        toeicPart: "Part 4 · Part 7",
        level: "B2",
      },
      {
        id: "fin-8",
        term: "deduct",
        phonetic: "/dɪˈdʌkt/",
        partOfSpeech: "verb",
        meaningVi: "subtract or take away from a total amount",
        exampleEn: "The discount will be automatically deducted at checkout.",
        exampleVi: "The discount will be subtracted automatically at checkout.",
        collocations: [
          "deduct from",
          "tax deduction",
          "automatically deducted",
        ],
        toeicPart: "Part 5 · Part 6",
        level: "B2",
      },
    ],
  },
  {
    id: "deck-travel",
    slug: "travel-hospitality",
    title: "Travel, Aviation & Hospitality",
    description:
      "Master conversations about room bookings, flight changes, and conference events in Part 2, 3, and 4.",
    category: "travel",
    targetScore: "450–700+",
    estimatedMinutes: 7,
    cards: [
      {
        id: "trv-1",
        term: "complimentary",
        phonetic: "/ˌkɑːm.pləˈmen.t̬ɚ.i/",
        partOfSpeech: "adjective",
        meaningVi: "provided free of charge (as a courtesy service for guests)",
        exampleEn:
          "All hotel guests receive complimentary breakfast and airport shuttle service.",
        exampleVi:
          "All staying guests receive free breakfast and airport shuttle service.",
        collocations: [
          "complimentary breakfast",
          "complimentary upgrade",
          "complimentary ticket",
        ],
        toeicPart: "Part 4 · Part 7",
        level: "B2",
      },
      {
        id: "trv-2",
        term: "occupancy",
        phonetic: "/ˈɑːk.jə.pən.si/",
        partOfSpeech: "noun",
        meaningVi: "rate of occupied rooms; maximum capacity",
        exampleEn: "Peak-season occupancy at the resort reached 95% last July.",
        exampleVi:
          "Peak-season room occupancy at the resort reached 95% last July.",
        collocations: [
          "occupancy rate",
          "maximum occupancy",
          "double occupancy",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "C1",
      },
      {
        id: "trv-3",
        term: "depart",
        phonetic: "/dɪˈpɑːrt/",
        partOfSpeech: "verb",
        meaningVi: "leave a station, airport, or terminal",
        exampleEn:
          "The express train to Kyoto departs from Platform 4 in ten minutes.",
        exampleVi:
          "The express train to Kyoto leaves from Platform 4 in ten minutes.",
        collocations: [
          "departure gate",
          "depart on schedule",
          "departure lounge",
        ],
        toeicPart: "Part 2 · Part 4",
        level: "B1",
      },
      {
        id: "trv-4",
        term: "amenity",
        phonetic: "/əˈmen.ə.t̬i/",
        partOfSpeech: "noun",
        meaningVi: "useful or pleasant facility or service",
        exampleEn:
          "Modern amenities include high-speed Wi-Fi and a 24-hour fitness center.",
        exampleVi:
          "Modern facilities include high-speed Wi-Fi and a 24-hour gym.",
        collocations: [
          "hotel amenities",
          "local amenities",
          "on-site amenities",
        ],
        toeicPart: "Part 4 · Part 7",
        level: "B2",
      },
      {
        id: "trv-5",
        term: "confirm",
        phonetic: "/kənˈfɜːrm/",
        partOfSpeech: "verb",
        meaningVi: "verify or finalize (a reservation or appointment)",
        exampleEn:
          "Could you confirm my reservation for two nights starting October 12?",
        exampleVi:
          "Could you verify my two-night reservation starting October 12?",
        collocations: [
          "confirm a reservation",
          "confirmation number",
          "written confirmation",
        ],
        toeicPart: "Part 2 · Part 3",
        level: "B1",
      },
      {
        id: "trv-6",
        term: "layover",
        phonetic: "/ˈleɪ.oʊ.vɚ/",
        partOfSpeech: "noun",
        meaningVi: "waiting period between two connecting flights",
        exampleEn:
          "Because of the three-hour layover in Seoul, I had time to answer emails.",
        exampleVi:
          "Thanks to the three-hour stopover in Seoul, I had time to reply to emails.",
        collocations: ["short layover", "overnight layover", "long layover"],
        toeicPart: "Part 3 · Part 7",
        level: "B2",
      },
      {
        id: "trv-7",
        term: "beverage",
        phonetic: "/ˈbev.ɚ.ɪdʒ/",
        partOfSpeech: "noun",
        meaningVi: "a drink of any kind",
        exampleEn:
          "Light snacks and beverages will be served in the lobby during intermission.",
        exampleVi:
          "Light snacks and drinks will be served in the lobby during the break.",
        collocations: [
          "food and beverage",
          "refreshing beverage",
          "complimentary beverages",
        ],
        toeicPart: "Part 1 · Part 4",
        level: "B1",
      },
      {
        id: "trv-8",
        term: "adjacent",
        phonetic: "/əˈdʒeɪ.sənt/",
        partOfSpeech: "adjective",
        meaningVi: "next to, immediately adjoining",
        exampleEn:
          "Parking is available in the garage adjacent to the convention center.",
        exampleVi:
          "Parking is available in the garage right next to the convention center.",
        collocations: ["adjacent to", "adjacent building", "adjacent rooms"],
        toeicPart: "Part 1 · Part 5",
        level: "B2",
      },
    ],
  },
  {
    id: "deck-marketing",
    slug: "marketing-sales",
    title: "Marketing, Product Launches & Sales",
    description:
      "Vocabulary for advertising, promotional campaigns, market research, and customer care in the TOEIC exam.",
    category: "marketing",
    targetScore: "550–800+",
    estimatedMinutes: 8,
    cards: [
      {
        id: "mkt-1",
        term: "merchandise",
        phonetic: "/ˈmɜːr.tʃən.daɪs/",
        partOfSpeech: "noun",
        meaningVi: "goods for sale or retail display",
        exampleEn: "Seasonal merchandise is marked down by 30% until Sunday.",
        exampleVi: "Seasonal goods are discounted by 30% through Sunday.",
        collocations: [
          "defective merchandise",
          "display merchandise",
          "promotional merchandise",
        ],
        toeicPart: "Part 1 · Part 7",
        level: "B2",
      },
      {
        id: "mkt-2",
        term: "demographics",
        phonetic: "/ˌdem.əˈɡræf.ɪks/",
        partOfSpeech: "noun",
        meaningVi: "statistical customer characteristics (age group, income)",
        exampleEn: "The campaign was tailored to younger urban demographics.",
        exampleVi:
          "The campaign was designed specifically for young urban customer groups.",
        collocations: [
          "target demographics",
          "customer demographics",
          "demographic data",
        ],
        toeicPart: "Part 4 · Part 7",
        level: "C1",
      },
      {
        id: "mkt-3",
        term: "incentive",
        phonetic: "/ɪnˈsen.tɪv/",
        partOfSpeech: "noun",
        meaningVi: "reward or benefit that encourages action",
        exampleEn:
          "Free express shipping served as a strong incentive for repeat orders.",
        exampleVi:
          "Free express shipping was a strong motivation for repeat orders.",
        collocations: [
          "financial incentive",
          "offer an incentive",
          "sales incentive",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "B2",
      },
      {
        id: "mkt-4",
        term: "launch",
        phonetic: "/lɔːntʃ/",
        partOfSpeech: "verb / noun",
        meaningVi: "introduce to the market (a product or campaign)",
        exampleEn:
          "The company plans to launch its eco-friendly packaging line in May.",
        exampleVi:
          "The company plans to introduce its eco-friendly packaging line in May.",
        collocations: ["product launch", "launch a campaign", "launch event"],
        toeicPart: "Part 3 · Part 6",
        level: "B1",
      },
      {
        id: "mkt-5",
        term: "endorse",
        phonetic: "/ɪnˈdɔːrs/",
        partOfSpeech: "verb",
        meaningVi: "publicly support, recommend, or promote",
        exampleEn:
          "Several professional athletes endorse our new running shoes.",
        exampleVi:
          "Several professional athletes officially promote our new running shoes.",
        collocations: [
          "celebrity endorsement",
          "officially endorse",
          "endorse a product",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "C1",
      },
      {
        id: "mkt-6",
        term: "competitive",
        phonetic: "/kəmˈpet̬.ə.t̬ɪv/",
        partOfSpeech: "adjective",
        meaningVi: "as good as or better than others (in price or quality)",
        exampleEn:
          "We maintain competitive pricing without compromising material quality.",
        exampleVi:
          "We keep our prices competitive without sacrificing material quality.",
        collocations: [
          "competitive edge",
          "competitive pricing",
          "highly competitive",
        ],
        toeicPart: "Part 5 · Part 6",
        level: "B1",
      },
      {
        id: "mkt-7",
        term: "outperform",
        phonetic: "/ˌaʊt.pɚˈfɔːrm/",
        partOfSpeech: "verb",
        meaningVi: "do better than or achieve higher results than",
        exampleEn:
          "The updated model outperformed rival devices in battery life tests.",
        exampleVi:
          "The upgraded model beat rival devices in battery life tests.",
        collocations: [
          "outperform competitors",
          "outperform expectations",
          "outperform the market",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "C1",
      },
      {
        id: "mkt-8",
        term: "survey",
        phonetic: "/ˈsɜːr.veɪ/",
        partOfSpeech: "noun / verb",
        meaningVi: "questionnaire or study of customer opinions",
        exampleEn:
          "Please take two minutes to complete our customer satisfaction survey.",
        exampleVi:
          "Please take two minutes to fill out our customer satisfaction questionnaire.",
        collocations: [
          "conduct a survey",
          "survey results",
          "satisfaction survey",
        ],
        toeicPart: "Part 4 · Part 7",
        level: "B1",
      },
    ],
  },
  {
    id: "deck-hr",
    slug: "hr-recruitment",
    title: "HR, Recruitment & Training",
    description:
      "Vocabulary for job applications, performance reviews, promotions, and employee benefits across all TOEIC levels.",
    category: "hr",
    targetScore: "500–800+",
    estimatedMinutes: 8,
    cards: [
      {
        id: "hr-1",
        term: "applicant",
        phonetic: "/ˈæp.lə.kənt/",
        partOfSpeech: "noun",
        meaningVi: "person who submits a job application",
        exampleEn:
          "Successful applicants will be contacted for a second-round interview.",
        exampleVi:
          "Qualified candidates will be contacted for a second-round interview.",
        collocations: [
          "job applicant",
          "qualified applicant",
          "screen applicants",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "B1",
      },
      {
        id: "hr-2",
        term: "credentials",
        phonetic: "/krɪˈden.ʃəlz/",
        partOfSpeech: "noun (plural)",
        meaningVi: "degrees, certificates, and professional qualifications",
        exampleEn:
          "The hiring panel verified all academic credentials prior to making an offer.",
        exampleVi:
          "The hiring panel checked all academic qualifications before sending an offer.",
        collocations: [
          "verify credentials",
          "professional credentials",
          "strong credentials",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "C1",
      },
      {
        id: "hr-3",
        term: "probationary",
        phonetic: "/proʊˈbeɪ.ʃə.ner.i/",
        partOfSpeech: "adjective",
        meaningVi: "relating to a trial period at a new job",
        exampleEn:
          "Health benefits begin immediately after the 60-day probationary period.",
        exampleVi:
          "Health insurance benefits start right after the 60-day trial period.",
        collocations: [
          "probationary period",
          "probationary employee",
          "complete probation",
        ],
        toeicPart: "Part 6 · Part 7",
        level: "C1",
      },
      {
        id: "hr-4",
        term: "proficient",
        phonetic: "/prəˈfɪʃ.ənt/",
        partOfSpeech: "adjective",
        meaningVi: "skilled and capable in a particular area",
        exampleEn:
          "Candidates must be proficient in spreadsheet modeling and data visualization.",
        exampleVi:
          "Applicants must be skilled in spreadsheet modeling and data visualization.",
        collocations: [
          "proficient in",
          "highly proficient",
          "language proficiency",
        ],
        toeicPart: "Part 5 · Part 7",
        level: "B2",
      },
      {
        id: "hr-5",
        term: "appraisal",
        phonetic: "/əˈpreɪ.zəl/",
        partOfSpeech: "noun",
        meaningVi: "formal evaluation of work performance",
        exampleEn:
          "Annual performance appraisals are scheduled for the first week of December.",
        exampleVi:
          "Annual performance evaluations are scheduled for the first week of December.",
        collocations: [
          "performance appraisal",
          "conduct an appraisal",
          "annual appraisal",
        ],
        toeicPart: "Part 3 · Part 7",
        level: "C1",
      },
      {
        id: "hr-6",
        term: "vacancy",
        phonetic: "/ˈveɪ.kən.si/",
        partOfSpeech: "noun",
        meaningVi: "an open, unfilled job position",
        exampleEn:
          "Internal staff are encouraged to apply for the senior analyst vacancy.",
        exampleVi:
          "Internal staff are encouraged to apply for the open senior analyst position.",
        collocations: ["fill a vacancy", "job vacancy", "current vacancies"],
        toeicPart: "Part 5 · Part 7",
        level: "B2",
      },
      {
        id: "hr-7",
        term: "eligible",
        phonetic: "/ˈel.ə.dʒə.bəl/",
        partOfSpeech: "adjective",
        meaningVi: "meeting the requirements to receive something",
        exampleEn:
          "Full-time employees are eligible for tuition reimbursement after one year.",
        exampleVi:
          "Full-time staff qualify for tuition assistance after one year of service.",
        collocations: [
          "be eligible for",
          "eligible candidates",
          "eligibility criteria",
        ],
        toeicPart: "Part 5 · Part 6",
        level: "B2",
      },
      {
        id: "hr-8",
        term: "mentor",
        phonetic: "/ˈmen.tɔːr/",
        partOfSpeech: "noun / verb",
        meaningVi: "experienced advisor; to guide and coach",
        exampleEn:
          "Each new hire is paired with an experienced mentor during onboarding.",
        exampleVi:
          "Every new hire is paired with an experienced advisor during onboarding.",
        collocations: [
          "mentorship program",
          "assign a mentor",
          "mentor junior staff",
        ],
        toeicPart: "Part 3 · Part 7",
        level: "B2",
      },
    ],
  },
];
