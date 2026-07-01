import { 
  Scissors, 
  Sparkles, 
  Droplets, 
  Wind,
} from 'lucide-react';

export const services = [
  { id: "SRV-001", name: "Haircut (Men)", price: 500, category: "Hair – Men", icon: Scissors },
  { id: "SRV-002", name: "Beard Styling", price: 200, category: "Hair – Men", icon: Scissors },
  { id: "SRV-003", name: "Shaving", price: 200, category: "Hair – Men", icon: Scissors },
  { id: "SRV-004", name: "Hair Spa", price: 1000, category: "Hair – Men", icon: Scissors },
  { id: "SRV-005", name: "Oil Massage (Men)", price: 700, category: "Hair – Men", icon: Scissors },
  { id: "SRV-006", name: "Hair Color – Majirel", price: 1200, category: "Hair – Men", icon: Scissors },
  { id: "SRV-007", name: "Hair Color – Inoa", price: 1500, category: "Hair – Men", icon: Scissors },
  { id: "SRV-008", name: "Lotus Face Clean Up", price: 1200, category: "Skin / Face – Clean Up", icon: Sparkles },
  { id: "SRV-009", name: "O3+ Face Clean Up", price: 1500, category: "Skin / Face – Clean Up", icon: Sparkles },
  { id: "SRV-010", name: "Aroma Face Clean Up", price: 1100, category: "Skin / Face – Clean Up", icon: Sparkles },
  { id: "SRV-011", name: "Facial – Lotus Gold", price: 2500, category: "Skin / Face – Facials", icon: Sparkles },
  { id: "SRV-012", name: "Facial – O3+ Whitening", price: 3000, category: "Skin / Face – Facials", icon: Sparkles },
  { id: "SRV-013", name: "Facial – Rubber Mask", price: 3500, category: "Skin / Face – Facials", icon: Sparkles },
  { id: "SRV-014", name: "Facial – Pearl/Silver", price: 1500, category: "Skin / Face – Facials", icon: Sparkles },
  { id: "SRV-015", name: "Facial – Lotus Base Variant", price: 1800, category: "Skin / Face – Facials", icon: Sparkles },
  { id: "SRV-016", name: "Full Face Threading", price: 300, category: "Threading / Waxing", icon: Sparkles },
  { id: "SRV-017", name: "Eyebrow Threading", price: 50, category: "Threading / Waxing", icon: Sparkles },
  { id: "SRV-018", name: "Honey Wax – Full Hands", price: 550, category: "Threading / Waxing", icon: Sparkles },
  { id: "SRV-019", name: "Honey Wax – Underarms", price: 250, category: "Threading / Waxing", icon: Sparkles },
  { id: "SRV-020", name: "Honey Wax – Full Legs", price: 750, category: "Threading / Waxing", icon: Sparkles },
  { id: "SRV-021", name: "Honey Wax – Half Legs", price: 400, category: "Threading / Waxing", icon: Sparkles },
  { id: "SRV-022", name: "Honey Wax – Full Face", price: 850, category: "Threading / Waxing", icon: Sparkles },
  { id: "SRV-023", name: "Honey Wax – Upper Lip & Chin", price: 150, category: "Threading / Waxing", icon: Sparkles, notes: "each" },
  { id: "SRV-024", name: "Rica Wax – Full Face", price: 450, category: "Threading / Waxing", icon: Sparkles },
  { id: "SRV-025", name: "Rica Wax – Upper Lip & Chin", price: 150, category: "Threading / Waxing", icon: Sparkles },
  { id: "SRV-026", name: "Rica Wax – Full Hands", price: 900, category: "Threading / Waxing", icon: Sparkles },
  { id: "SRV-027", name: "Rica Wax – Underarms", price: 500, category: "Threading / Waxing", icon: Sparkles, notes: "each" },
  { id: "SRV-028", name: "Rica Wax – Full Legs", price: 1100, category: "Threading / Waxing", icon: Sparkles },
  { id: "SRV-029", name: "Rica Wax – Half Legs", price: 600, category: "Threading / Waxing", icon: Sparkles },
  { id: "SRV-030", name: "Base Manicure", price: 600, category: "Manicure", icon: Wind },
  { id: "SRV-031", name: "Lotus Manicure", price: 800, category: "Manicure", icon: Wind },
  { id: "SRV-032", name: "Crystal Manicure", price: 1100, category: "Manicure", icon: Wind },
  { id: "SRV-033", name: "Spa Manicure", price: 900, category: "Manicure", icon: Wind },
  { id: "SRV-034", name: "Nail Cut + Filing", price: 100, category: "Manicure", icon: Wind, notes: "Hand & Leg" },
  { id: "SRV-035", name: "Nail Polish", price: 200, category: "Manicure", icon: Wind, notes: "Hand & Leg" },
  { id: "SRV-036", name: "Base Pedicure", price: 800, category: "Pedicure", icon: Wind },
  { id: "SRV-037", name: "Lotus Pedicure", price: 1000, category: "Pedicure", icon: Wind },
  { id: "SRV-038", name: "Crystal Pedicure", price: 1500, category: "Pedicure", icon: Wind },
  { id: "SRV-039", name: "Spa Pedicure", price: 1200, category: "Pedicure", icon: Wind },
  { id: "SRV-040", name: "Haircut (Women)", price: 700, category: "Women's Hair", icon: Scissors },
  { id: "SRV-041", name: "Wash + Blow Dry", price: 600, category: "Women's Hair", icon: Scissors },
  { id: "SRV-042", name: "Wash + Blast Dry", price: 500, category: "Women's Hair", icon: Scissors },
  { id: "SRV-043", name: "Wash + Ironing", price: 800, category: "Women's Hair", icon: Scissors },
  { id: "SRV-044", name: "Iron Curls", price: 1000, category: "Women's Hair", icon: Scissors },
  { id: "SRV-045", name: "Tong Styling", price: 1200, category: "Women's Hair", icon: Scissors },
  { id: "SRV-046", name: "Hair Spa – L'Oreal", price: 1300, category: "Hair Spa – Women", icon: Scissors },
  { id: "SRV-047", name: "Hair Spa – Keratin", price: 1700, category: "Hair Spa – Women", icon: Scissors },
  { id: "SRV-048", name: "Hair Spa – Cadiveu", price: 2000, category: "Hair Spa – Women", icon: Scissors },
  { id: "SRV-049", name: "Hair Spa – Pro/Liss", price: 2400, category: "Hair Spa – Women", icon: Scissors },
  { id: "SRV-050", name: "Hair Spa – Matrix", price: 1300, category: "Hair Spa – Women", icon: Scissors },
  { id: "SRV-051", name: "Hair Spa – Argan Oil", price: 2000, category: "Hair Spa – Women", icon: Scissors },
  { id: "SRV-052", name: "Hair Spa – Moroccanoil", price: 2500, category: "Hair Spa – Women", icon: Scissors },
  { id: "SRV-053", name: "Raaga", price: 1100, category: "Hair Color – Root Touch-Up", icon: Droplets },
  { id: "SRV-054", name: "Majirel", price: 1400, category: "Hair Color – Root Touch-Up", icon: Droplets },
  { id: "SRV-055", name: "Matrix (Ammonia Free)", price: 1500, category: "Hair Color – Root Touch-Up", icon: Droplets },
  { id: "SRV-056", name: "Inoa", price: 1700, category: "Hair Color – Root Touch-Up", icon: Droplets },
  { id: "SRV-057", name: "Raaga (Global)", price: 3000, category: "Hair Color – Global", icon: Droplets },
  { id: "SRV-058", name: "Majirel (Global)", price: 4500, category: "Hair Color – Global", icon: Droplets },
  { id: "SRV-059", name: "Matrix (Global, Ammonia Free)", price: 4000, category: "Hair Color – Global", icon: Droplets },
  { id: "SRV-060", name: "Inoa (Global)", price: 5500, category: "Hair Color – Global", icon: Droplets },
  { id: "SRV-061", name: "Straightening", price: 4500, category: "Smoothening / Straightening", icon: Scissors },
  { id: "SRV-062", name: "Smoothening", price: 5000, category: "Smoothening / Straightening", icon: Scissors },
  { id: "SRV-063", name: "Nanoplastia", price: 7000, category: "Hair Treatment", icon: Scissors },
  { id: "SRV-064", name: "Nanoplastia (Premium)", price: 8500, category: "Hair Treatment", icon: Scissors },
  { id: "SRV-065", name: "Botox", price: 6000, category: "Hair Treatment", icon: Scissors },
  { id: "SRV-066", name: "Keratin Treatment", price: 4000, category: "Hair Treatment", icon: Scissors },
  { id: "SRV-067", name: "Foot Massage", price: 600, category: "Massage", icon: Sparkles, notes: "15 min" },
  { id: "SRV-068", name: "Hand Massage", price: 500, category: "Massage", icon: Sparkles, notes: "15 min" },
  { id: "SRV-069", name: "Oil Massage (Massage)", price: 700, category: "Massage", icon: Sparkles, notes: "Head, Neck, Back — ~20 min" },
  {
    id: "pkg-1",
    name: "Super Combo Package",
    price: 1800,
    category: "Packages",
    icon: Sparkles,
    isPackage: true,
    packageServices: [
      { name: "Haircut", price: 1000 },
      { name: "Nails (Pedicure)", price: 600 },
      { name: "Manicure", price: 400 },
      { name: "Facial", price: 1200 }
    ]
  },
  {
    id: "pkg-head2toe",
    name: "Head 2 Toe Package",
    price: 2999,
    category: "Packages",
    icon: Sparkles,
    isPackage: true,
    packageServices: [
      { name: "Keratin Hair Spa", price: 0 },
      { name: "Hair Cut + Blow Setting", price: 0 },
      { name: "Lotus Gold with Facial", price: 0 },
      { name: "Lotus Manicure", price: 0 },
      { name: "Lotus Pedicure", price: 0 },
      { name: "Threading", price: 0 },
      { name: "Head & Neck Massage", price: 0 }
    ]
  },
  {
    id: "pkg-1500",
    name: "1500 Package",
    price: 1500,
    category: "Packages",
    icon: Sparkles,
    isPackage: true,
    packageServices: [
      { name: "Haircut + Hair Wash + Blow-Dry", price: 0 },
      { name: "Loreal Hair Spa", price: 0 },
      { name: "Facial + Face De-Tan Pack", price: 0 },
      { name: "Manicure OR Pedicure", price: 0 },
      { name: "Head, Neck & Back Massage (10 min)", price: 0 },
      { name: "Threading (Upper Lip/Eyebrows)", price: 0 }
    ]
  }
];

export const staffMembers: any[] = [
  {
    "id": "ST-ADNAN",
    "name": "Adnan",
    "role": "junior hair stylist",
    "phone": "+919999999901",
    "email": "adnan@trendzsalon.com",
    "instagram": "@adnan"
  },
  {
    "id": "ST-RABIA",
    "name": "Rabia",
    "role": "Pedicurist",
    "phone": "+919999999902",
    "email": "rabia@trendzsalon.com",
    "instagram": "@rabia"
  },
  {
    "id": "ST-ANITA",
    "name": "Anita",
    "role": "beautician",
    "phone": "+919999999903",
    "email": "anita@trendzsalon.com",
    "instagram": "@anita"
  },
  {
    "id": "ST-VICKY",
    "name": "Vicky",
    "role": "Senior Stylist",
    "phone": "+919999999904",
    "email": "vicky@trendzsalon.com",
    "instagram": "@vicky"
  },
  {
    "id": "ST-WASIF",
    "name": "Wasif",
    "role": "hairstylist",
    "phone": "+919999999905",
    "email": "wasif@trendzsalon.com",
    "instagram": "@wasif"
  },
  {
    "id": "ST-JULIANA",
    "name": "Juliana",
    "role": "Pedicurist",
    "phone": "+919999999906",
    "email": "juliana@trendzsalon.com",
    "instagram": "@juliana"
  },
  {
    "id": "ST-ZOYA",
    "name": "Zoya",
    "role": "Stylist",
    "phone": "+919999999907",
    "email": "zoya@trendzsalon.com",
    "instagram": "@zoya"
  },
  {
    "id": "ST-TRENDZ",
    "name": "Trendz",
    "role": "Management",
    "phone": "+919999999908",
    "email": "management@trendzsalon.com",
    "instagram": "@trendz"
  },
  {
    "id": "ST-EJAZ",
    "name": "Ejaz",
    "role": "receptionist",
    "phone": "+919999999909",
    "email": "ejaz@trendzsalon.com",
    "instagram": "@ejaz"
  }
];

export const customers: any[] = [
  {
    "id": "CL-KSURK9B",
    "name": "REHMAT",
    "phone": "+919748019631",
    "visits": 1,
    "points": 50,
    "totalSpent": 500,
    "lastVisit": "2026-01-01"
  },
  {
    "id": "CL-2K0YLAG",
    "name": "SHIPRA JAIN",
    "phone": "+919792868178",
    "visits": 1,
    "points": 60,
    "totalSpent": 600,
    "lastVisit": "2026-01-16"
  },
  {
    "id": "CL-NLCQSZ4",
    "name": "DEEPATRA",
    "phone": "+918961622890",
    "visits": 1,
    "points": 80,
    "totalSpent": 800,
    "lastVisit": "2026-01-16"
  },
  {
    "id": "CL-2BE9RRP",
    "name": "ASHTA",
    "phone": "+919831354280",
    "visits": 1,
    "points": 50,
    "totalSpent": 500,
    "lastVisit": "2026-01-16"
  },
  {
    "id": "CL-HAQNWL7",
    "name": "SANJANA AGARWAL",
    "phone": "+917003194855",
    "visits": 1,
    "points": 100,
    "totalSpent": 1000,
    "lastVisit": "2026-01-17"
  },
  {
    "id": "CL-UNOFOBM",
    "name": "Anuradha",
    "phone": "+916901217566",
    "visits": 1,
    "points": 130,
    "totalSpent": 1300,
    "lastVisit": "2026-01-18"
  },
  {
    "id": "CL-0ASZMY5",
    "name": "SHALINI CHOUDHARY",
    "phone": "+919903997157",
    "visits": 1,
    "points": 175,
    "totalSpent": 1750,
    "lastVisit": "2026-01-24"
  },
  {
    "id": "CL-3J67Q7I",
    "name": "DEEPASHA CHATTERJEE",
    "phone": "+916295453212",
    "visits": 1,
    "points": 320,
    "totalSpent": 3200,
    "lastVisit": "2026-02-01"
  },
  {
    "id": "CL-R11K733",
    "name": "RADHIKA",
    "phone": "+917462034176",
    "visits": 1,
    "points": 40,
    "totalSpent": 400,
    "lastVisit": "2026-02-08"
  },
  {
    "id": "CL-MH5OIHO",
    "name": "SAMAN",
    "phone": "+919971372480",
    "visits": 1,
    "points": 40,
    "totalSpent": 400,
    "lastVisit": "2026-02-08"
  },
  {
    "id": "CL-Z2125IS",
    "name": "BHARTI",
    "phone": "+919831493372",
    "visits": 1,
    "points": 100,
    "totalSpent": 1000,
    "lastVisit": "2026-02-11"
  },
  {
    "id": "CL-GYH6WRG",
    "name": "RANU",
    "phone": "+919903455870",
    "visits": 1,
    "points": 120,
    "totalSpent": 1200,
    "lastVisit": "2026-02-18"
  },
  {
    "id": "CL-F2WAPCO",
    "name": "SREEMONTI",
    "phone": "+918240253078",
    "visits": 1,
    "points": 90,
    "totalSpent": 900,
    "lastVisit": "2026-03-02"
  },
  {
    "id": "CL-44HGTY2",
    "name": "GOPAL NONIA",
    "phone": "+917980450897",
    "visits": 1,
    "points": 60,
    "totalSpent": 600,
    "lastVisit": "2026-03-09"
  },
  {
    "id": "CL-3FPFW94",
    "name": "AREEN",
    "phone": "+918981919110",
    "visits": 1,
    "points": 40,
    "totalSpent": 400,
    "lastVisit": "2026-03-13"
  },
  {
    "id": "CL-ZB70LTG",
    "name": "SANA",
    "phone": "+918017403976",
    "visits": 1,
    "points": 30,
    "totalSpent": 300,
    "lastVisit": "2026-03-19"
  },
  {
    "id": "CL-75A0CSD",
    "name": "AMIT BHAGAT",
    "phone": "+919007127950",
    "visits": 1,
    "points": 50,
    "totalSpent": 500,
    "lastVisit": "2026-04-08"
  }
];

export const transactions: any[] = [
  {
    "id": "TX-7VAWJ34",
    "date": new Date().toISOString().split('T')[0],
    "timestamp": new Date().toISOString(),
    "clientName": "Walk-in Customer",
    "phone": "N/A",
    "services": "KERATIN HAIR SPA",
    "total": 1000,
    "paymentMethod": "Cash",
    "staffIds": [
      "ST-ADNAN"
    ],
    "staffNames": "Adnan",
    "incentivePerStaff": 50,
    "staffIncentives": {
      "ST-ADNAN": 50
    },
    "staffRevenueShare": {
      "ST-ADNAN": 1000
    }
  },
  {
    "id": "TX-UJ0KBPS",
    "date": new Date().toISOString().split('T')[0],
    "timestamp": new Date().toISOString(),
    "clientName": "Walk-in Customer",
    "phone": "N/A",
    "services": "HAIRWASH + IRONING",
    "total": 600,
    "paymentMethod": "Cash",
    "staffIds": [
      "ST-ADNAN"
    ],
    "staffNames": "Adnan",
    "incentivePerStaff": 30,
    "staffIncentives": {
      "ST-ADNAN": 30
    },
    "staffRevenueShare": {
      "ST-ADNAN": 600
    }
  },
  {
    "id": "TX-UYLOOOK",
    "date": new Date().toISOString().split('T')[0],
    "timestamp": new Date().toISOString(),
    "clientName": "Walk-in Customer",
    "phone": "N/A",
    "services": "PEDICURE",
    "total": 700,
    "paymentMethod": "UPI",
    "staffIds": [
      "ST-RABIA"
    ],
    "staffNames": "Rabia",
    "incentivePerStaff": 35,
    "staffIncentives": {
      "ST-RABIA": 35
    },
    "staffRevenueShare": {
      "ST-RABIA": 700
    }
  },
  {
    "id": "TX-RUA57PT",
    "date": new Date().toISOString().split('T')[0],
    "timestamp": new Date().toISOString(),
    "clientName": "Walk-in Customer",
    "phone": "N/A",
    "services": "MANICURE+THREADING",
    "total": 650,
    "paymentMethod": "UPI",
    "staffIds": [
      "ST-ANITA"
    ],
    "staffNames": "Anita",
    "incentivePerStaff": 33,
    "staffIncentives": {
      "ST-ANITA": 33
    },
    "staffRevenueShare": {
      "ST-ANITA": 650
    }
  },
  {
    "id": "TX-L4P21JW",
    "date": new Date().toISOString().split('T')[0],
    "timestamp": new Date().toISOString(),
    "clientName": "Walk-in Customer",
    "phone": "N/A",
    "services": "HAIRCUT",
    "total": 500,
    "paymentMethod": "UPI",
    "staffIds": [
      "ST-VICKY"
    ],
    "staffNames": "Vicky",
    "incentivePerStaff": 25,
    "staffIncentives": {
      "ST-VICKY": 25
    },
    "staffRevenueShare": {
      "ST-VICKY": 500
    }
  },
  {
    "id": "TX-628IP38",
    "date": new Date().toISOString().split('T')[0],
    "timestamp": new Date().toISOString(),
    "clientName": "Walk-in Customer",
    "phone": "N/A",
    "services": "HAIRCUT",
    "total": 400,
    "paymentMethod": "Cash",
    "staffIds": [
      "ST-WASIF"
    ],
    "staffNames": "Wasif",
    "incentivePerStaff": 20,
    "staffIncentives": {
      "ST-WASIF": 20
    },
    "staffRevenueShare": {
      "ST-WASIF": 400
    }
  },
  {
    "id": "TX-U316V8C",
    "date": new Date().toISOString().split('T')[0],
    "timestamp": new Date().toISOString(),
    "clientName": "REHMAT",
    "phone": "+919748019631",
    "services": "HAIR SPA",
    "total": 500,
    "paymentMethod": "Cash",
    "staffIds": [
      "ST-ADNAN"
    ],
    "staffNames": "Adnan",
    "incentivePerStaff": 25,
    "staffIncentives": {
      "ST-ADNAN": 25
    },
    "staffRevenueShare": {
      "ST-ADNAN": 500
    }
  }
];
