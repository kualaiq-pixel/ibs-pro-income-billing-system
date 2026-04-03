export const CAR_MAKES: string[] = [
  // Japanese
  "Toyota", "Honda", "Nissan", "Mazda", "Subaru", "Mitsubishi", "Suzuki", "Isuzu", "Lexus", "Acura", "Infiniti",
  // European
  "Volkswagen", "Mercedes-Benz", "BMW", "Audi", "Volvo", "Renault", "Peugeot", "Citroën", "Fiat", "Alfa Romeo", "Ferrari", "Lamborghini", "Porsche", "Jaguar", "Land Rover", "Mini", "Smart", "Seat", "Skoda",
  // American
  "Ford", "Chevrolet", "Cadillac", "GMC", "Jeep", "Dodge", "Chrysler", "Tesla", "Buick", "Lincoln", "Ram",
  // Korean
  "Hyundai", "Kia", "Genesis", "SsangYong",
  // Chinese
  "Geely", "BYD", "Great Wall", "Chery", "MG", "SAIC", "NIO", "XPeng", "Li Auto",
  // Others
  "Tata", "Mahindra", "Maruti Suzuki", "Proton", "Perodua", "Other",
];

export const CAR_MODELS: Record<string, string[]> = {
  "Toyota": ["Corolla", "Camry", "RAV4", "Highlander", "Prius", "Hilux", "Land Cruiser", "Yaris", "C-HR", "Avanza", "Innova", "Fortuner", "Vios", "Sienna", "Tacoma", "Tundra", "4Runner", "Sequoia", "Crown", "Century", "Other"],
  "Honda": ["Civic", "Accord", "CR-V", "HR-V", "Jazz", "City", "BR-V", "Brio", "Mobilio", "Odyssey", "Pilot", "Ridgeline", "NSX", "Other"],
  "Nissan": ["Qashqai", "Juke", "X-Trail", "Micra", "Leaf", "Altima", "Sentra", "Maxima", "Rogue", "Pathfinder", "Armada", "Frontier", "Titan", "GT-R", "Z", "Other"],
  "Volkswagen": ["Golf", "Caddy", "Crafter", "Passat", "Tiguan", "Touareg", "Polo", "Jetta", "Arteon", "ID.3", "ID.4", "ID.Buzz", "T-Roc", "T-Cross", "Other"],
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLB", "GLC", "GLE", "GLS", "G-Class", "CLA", "CLS", "AMG GT", "Other"],
  "BMW": ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "8 Series", "X1", "X2", "X3", "X4", "X5", "X6", "X7", "i3", "i4", "i7", "iX", "M3", "M4", "M5", "Other"],
  "Audi": ["A1", "A3", "A4", "A5", "A6", "A7", "A8", "Q2", "Q3", "Q4 e-tron", "Q5", "Q7", "Q8", "e-tron", "TT", "R8", "Other"],
  "Ford": ["Focus", "Fiesta", "Mondeo", "Kuga", "Ranger", "Mustang", "Explorer", "Expedition", "F-150", "Escape", "Bronco", "Maverick", "Transit", "Other"],
  "Hyundai": ["Tucson", "i30", "i20", "Kona", "Santa Fe", "Elantra", "Sonata", "Accent", "Venue", "Palisade", "Ioniq 5", "Ioniq 6", "Other"],
  "Kia": ["Sportage", "Ceed", "Niro", "Sorento", "Picanto", "Rio", "Forte", "Optima", "Carnival", "Stinger", "EV6", "Telluride", "Other"],
  "Volvo": ["XC90", "XC60", "XC40", "S90", "S60", "V90", "V60", "C40", "Other"],
  "Mazda": ["Mazda3", "Mazda6", "CX-3", "CX-5", "CX-9", "CX-30", "MX-5", "BT-50", "Other"],
  "Subaru": ["Impreza", "Legacy", "Outback", "Forester", "Crosstrek", "BRZ", "WRX", "Ascent", "Other"],
  "Tesla": ["Model S", "Model 3", "Model X", "Model Y", "Cybertruck", "Roadster", "Other"],
  "Chevrolet": ["Cruze", "Malibu", "Impala", "Equinox", "Traverse", "Tahoe", "Suburban", "Silverado", "Camaro", "Corvette", "Spark", "Other"],
  "Renault": ["Clio", "Megane", "Captur", "Kadjar", "Koleos", "Zoe", "Twingo", "Kangoo", "Other"],
  "Peugeot": ["208", "308", "508", "2008", "3008", "5008", "Partner", "Expert", "Other"],
  "Fiat": ["500", "Panda", "Tipo", "500X", "500L", "Ducato", "Other"],
  "Porsche": ["911", "Cayenne", "Macan", "Panamera", "Taycan", "Boxster", "Cayman", "Other"],
  "Skoda": ["Octavia", "Superb", "Kodiaq", "Karoq", "Fabia", "Scala", "Enyaq", "Other"],
  "Other": ["Custom Model"],
};
