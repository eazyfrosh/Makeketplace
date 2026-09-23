import type { Airport } from "@/lib/airline/types";
import airportIndex from "./airports-index.json";

const featuredAirports: Airport[] = [
  { code: "JFK", name: "John F. Kennedy International Airport", city: "New York", country: "United States", timezone: "America/New_York" },
  { code: "LGA", name: "LaGuardia Airport", city: "New York", country: "United States", timezone: "America/New_York" },
  { code: "EWR", name: "Newark Liberty International Airport", city: "Newark", country: "United States", timezone: "America/New_York" },
  { code: "LAX", name: "Los Angeles International Airport", city: "Los Angeles", country: "United States", timezone: "America/Los_Angeles" },
  { code: "ORD", name: "O'Hare International Airport", city: "Chicago", country: "United States", timezone: "America/Chicago" },
  { code: "MDW", name: "Midway International Airport", city: "Chicago", country: "United States", timezone: "America/Chicago" },
  { code: "DFW", name: "Dallas/Fort Worth International Airport", city: "Dallas", country: "United States", timezone: "America/Chicago" },
  { code: "DEN", name: "Denver International Airport", city: "Denver", country: "United States", timezone: "America/Denver" },
  { code: "SFO", name: "San Francisco International Airport", city: "San Francisco", country: "United States", timezone: "America/Los_Angeles" },
  { code: "SEA", name: "Seattle–Tacoma International Airport", city: "Seattle", country: "United States", timezone: "America/Los_Angeles" },
  { code: "LAS", name: "Harry Reid International Airport", city: "Las Vegas", country: "United States", timezone: "America/Los_Angeles" },
  { code: "MIA", name: "Miami International Airport", city: "Miami", country: "United States", timezone: "America/New_York" },
  { code: "MCO", name: "Orlando International Airport", city: "Orlando", country: "United States", timezone: "America/New_York" },
  { code: "ATL", name: "Hartsfield–Jackson Atlanta International Airport", city: "Atlanta", country: "United States", timezone: "America/New_York" },
  { code: "BOS", name: "Logan International Airport", city: "Boston", country: "United States", timezone: "America/New_York" },
  { code: "PHX", name: "Phoenix Sky Harbor International Airport", city: "Phoenix", country: "United States", timezone: "America/Phoenix" },
  { code: "IAH", name: "George Bush Intercontinental Airport", city: "Houston", country: "United States", timezone: "America/Chicago" },
  { code: "IAD", name: "Washington Dulles International Airport", city: "Washington, D.C.", country: "United States", timezone: "America/New_York" },
  { code: "DCA", name: "Ronald Reagan Washington National Airport", city: "Washington, D.C.", country: "United States", timezone: "America/New_York" },
  { code: "PHL", name: "Philadelphia International Airport", city: "Philadelphia", country: "United States", timezone: "America/New_York" },
  { code: "MSP", name: "Minneapolis–Saint Paul International Airport", city: "Minneapolis", country: "United States", timezone: "America/Chicago" },
  { code: "DTW", name: "Detroit Metropolitan Airport", city: "Detroit", country: "United States", timezone: "America/Detroit" },
  { code: "CLT", name: "Charlotte Douglas International Airport", city: "Charlotte", country: "United States", timezone: "America/New_York" },
  { code: "SAN", name: "San Diego International Airport", city: "San Diego", country: "United States", timezone: "America/Los_Angeles" },
  { code: "TPA", name: "Tampa International Airport", city: "Tampa", country: "United States", timezone: "America/New_York" },
  { code: "PDX", name: "Portland International Airport", city: "Portland", country: "United States", timezone: "America/Los_Angeles" },
  { code: "AUS", name: "Austin-Bergstrom International Airport", city: "Austin", country: "United States", timezone: "America/Chicago" },
  { code: "HNL", name: "Daniel K. Inouye International Airport", city: "Honolulu", country: "United States", timezone: "Pacific/Honolulu" },
  { code: "YYZ", name: "Toronto Pearson International Airport", city: "Toronto", country: "Canada", timezone: "America/Toronto" },
  { code: "YVR", name: "Vancouver International Airport", city: "Vancouver", country: "Canada", timezone: "America/Vancouver" },
  { code: "YUL", name: "Montréal–Trudeau International Airport", city: "Montreal", country: "Canada", timezone: "America/Toronto" },
  { code: "YYC", name: "Calgary International Airport", city: "Calgary", country: "Canada", timezone: "America/Edmonton" },
  { code: "MEX", name: "Mexico City International Airport", city: "Mexico City", country: "Mexico", timezone: "America/Mexico_City" },
  { code: "CUN", name: "Cancún International Airport", city: "Cancún", country: "Mexico", timezone: "America/Cancun" },
  { code: "GRU", name: "São Paulo/Guarulhos International Airport", city: "São Paulo", country: "Brazil", timezone: "America/Sao_Paulo" },
  { code: "GIG", name: "Rio de Janeiro–Galeão International Airport", city: "Rio de Janeiro", country: "Brazil", timezone: "America/Sao_Paulo" },
  { code: "EZE", name: "Ministro Pistarini International Airport", city: "Buenos Aires", country: "Argentina", timezone: "America/Argentina/Buenos_Aires" },
  { code: "SCL", name: "Arturo Merino Benítez International Airport", city: "Santiago", country: "Chile", timezone: "America/Santiago" },
  { code: "BOG", name: "El Dorado International Airport", city: "Bogotá", country: "Colombia", timezone: "America/Bogota" },
  { code: "LIM", name: "Jorge Chávez International Airport", city: "Lima", country: "Peru", timezone: "America/Lima" },
  { code: "LHR", name: "London Heathrow Airport", city: "London", country: "United Kingdom", timezone: "Europe/London" },
  { code: "LGW", name: "London Gatwick Airport", city: "London", country: "United Kingdom", timezone: "Europe/London" },
  { code: "STN", name: "London Stansted Airport", city: "London", country: "United Kingdom", timezone: "Europe/London" },
  { code: "MAN", name: "Manchester Airport", city: "Manchester", country: "United Kingdom", timezone: "Europe/London" },
  { code: "EDI", name: "Edinburgh Airport", city: "Edinburgh", country: "United Kingdom", timezone: "Europe/London" },
  { code: "CDG", name: "Charles de Gaulle Airport", city: "Paris", country: "France", timezone: "Europe/Paris" },
  { code: "ORY", name: "Paris Orly Airport", city: "Paris", country: "France", timezone: "Europe/Paris" },
  { code: "NCE", name: "Nice Côte d'Azur Airport", city: "Nice", country: "France", timezone: "Europe/Paris" },
  { code: "FRA", name: "Frankfurt Airport", city: "Frankfurt", country: "Germany", timezone: "Europe/Berlin" },
  { code: "MUC", name: "Munich Airport", city: "Munich", country: "Germany", timezone: "Europe/Berlin" },
  { code: "BER", name: "Berlin Brandenburg Airport", city: "Berlin", country: "Germany", timezone: "Europe/Berlin" },
  { code: "AMS", name: "Amsterdam Airport Schiphol", city: "Amsterdam", country: "Netherlands", timezone: "Europe/Amsterdam" },
  { code: "MAD", name: "Adolfo Suárez Madrid–Barajas Airport", city: "Madrid", country: "Spain", timezone: "Europe/Madrid" },
  { code: "BCN", name: "Josep Tarradellas Barcelona-El Prat Airport", city: "Barcelona", country: "Spain", timezone: "Europe/Madrid" },
  { code: "FCO", name: "Leonardo da Vinci–Fiumicino Airport", city: "Rome", country: "Italy", timezone: "Europe/Rome" },
  { code: "MXP", name: "Milan Malpensa Airport", city: "Milan", country: "Italy", timezone: "Europe/Rome" },
  { code: "VCE", name: "Venice Marco Polo Airport", city: "Venice", country: "Italy", timezone: "Europe/Rome" },
  { code: "ZRH", name: "Zurich Airport", city: "Zurich", country: "Switzerland", timezone: "Europe/Zurich" },
  { code: "GVA", name: "Geneva Airport", city: "Geneva", country: "Switzerland", timezone: "Europe/Zurich" },
  { code: "VIE", name: "Vienna International Airport", city: "Vienna", country: "Austria", timezone: "Europe/Vienna" },
  { code: "BRU", name: "Brussels Airport", city: "Brussels", country: "Belgium", timezone: "Europe/Brussels" },
  { code: "CPH", name: "Copenhagen Airport", city: "Copenhagen", country: "Denmark", timezone: "Europe/Copenhagen" },
  { code: "OSL", name: "Oslo Airport", city: "Oslo", country: "Norway", timezone: "Europe/Oslo" },
  { code: "ARN", name: "Stockholm Arlanda Airport", city: "Stockholm", country: "Sweden", timezone: "Europe/Stockholm" },
  { code: "HEL", name: "Helsinki-Vantaa Airport", city: "Helsinki", country: "Finland", timezone: "Europe/Helsinki" },
  { code: "DUB", name: "Dublin Airport", city: "Dublin", country: "Ireland", timezone: "Europe/Dublin" },
  { code: "LIS", name: "Humberto Delgado Airport", city: "Lisbon", country: "Portugal", timezone: "Europe/Lisbon" },
  { code: "ATH", name: "Athens International Airport", city: "Athens", country: "Greece", timezone: "Europe/Athens" },
  { code: "IST", name: "Istanbul Airport", city: "Istanbul", country: "Turkey", timezone: "Europe/Istanbul" },
  { code: "SAW", name: "Istanbul Sabiha Gökçen Airport", city: "Istanbul", country: "Turkey", timezone: "Europe/Istanbul" },
  { code: "WAW", name: "Warsaw Chopin Airport", city: "Warsaw", country: "Poland", timezone: "Europe/Warsaw" },
  { code: "PRG", name: "Václav Havel Airport Prague", city: "Prague", country: "Czech Republic", timezone: "Europe/Prague" },
  { code: "BUD", name: "Budapest Ferenc Liszt International Airport", city: "Budapest", country: "Hungary", timezone: "Europe/Budapest" },
  { code: "SVO", name: "Sheremetyevo International Airport", city: "Moscow", country: "Russia", timezone: "Europe/Moscow" },
  { code: "DXB", name: "Dubai International Airport", city: "Dubai", country: "United Arab Emirates", timezone: "Asia/Dubai" },
  { code: "AUH", name: "Zayed International Airport", city: "Abu Dhabi", country: "United Arab Emirates", timezone: "Asia/Dubai" },
  { code: "DOH", name: "Hamad International Airport", city: "Doha", country: "Qatar", timezone: "Asia/Qatar" },
  { code: "RUH", name: "King Khalid International Airport", city: "Riyadh", country: "Saudi Arabia", timezone: "Asia/Riyadh" },
  { code: "JED", name: "King Abdulaziz International Airport", city: "Jeddah", country: "Saudi Arabia", timezone: "Asia/Riyadh" },
  { code: "AMM", name: "Queen Alia International Airport", city: "Amman", country: "Jordan", timezone: "Asia/Amman" },
  { code: "TLV", name: "Ben Gurion Airport", city: "Tel Aviv", country: "Israel", timezone: "Asia/Jerusalem" },
  { code: "CAI", name: "Cairo International Airport", city: "Cairo", country: "Egypt", timezone: "Africa/Cairo" },
  { code: "CMN", name: "Mohammed V International Airport", city: "Casablanca", country: "Morocco", timezone: "Africa/Casablanca" },
  { code: "JNB", name: "O.R. Tambo International Airport", city: "Johannesburg", country: "South Africa", timezone: "Africa/Johannesburg" },
  { code: "CPT", name: "Cape Town International Airport", city: "Cape Town", country: "South Africa", timezone: "Africa/Johannesburg" },
  { code: "LOS", name: "Murtala Muhammed International Airport", city: "Lagos", country: "Nigeria", timezone: "Africa/Lagos" },
  { code: "NBO", name: "Jomo Kenyatta International Airport", city: "Nairobi", country: "Kenya", timezone: "Africa/Nairobi" },
  { code: "ADD", name: "Addis Ababa Bole International Airport", city: "Addis Ababa", country: "Ethiopia", timezone: "Africa/Addis_Ababa" },
  { code: "HND", name: "Haneda Airport", city: "Tokyo", country: "Japan", timezone: "Asia/Tokyo" },
  { code: "NRT", name: "Narita International Airport", city: "Tokyo", country: "Japan", timezone: "Asia/Tokyo" },
  { code: "KIX", name: "Kansai International Airport", city: "Osaka", country: "Japan", timezone: "Asia/Tokyo" },
  { code: "NGO", name: "Chubu Centrair International Airport", city: "Nagoya", country: "Japan", timezone: "Asia/Tokyo" },
  { code: "ICN", name: "Incheon International Airport", city: "Seoul", country: "South Korea", timezone: "Asia/Seoul" },
  { code: "GMP", name: "Gimpo International Airport", city: "Seoul", country: "South Korea", timezone: "Asia/Seoul" },
  { code: "PEK", name: "Beijing Capital International Airport", city: "Beijing", country: "China", timezone: "Asia/Shanghai" },
  { code: "PKX", name: "Beijing Daxing International Airport", city: "Beijing", country: "China", timezone: "Asia/Shanghai" },
  { code: "PVG", name: "Shanghai Pudong International Airport", city: "Shanghai", country: "China", timezone: "Asia/Shanghai" },
  { code: "SHA", name: "Shanghai Hongqiao International Airport", city: "Shanghai", country: "China", timezone: "Asia/Shanghai" },
  { code: "CAN", name: "Guangzhou Baiyun International Airport", city: "Guangzhou", country: "China", timezone: "Asia/Shanghai" },
  { code: "SZX", name: "Shenzhen Bao'an International Airport", city: "Shenzhen", country: "China", timezone: "Asia/Shanghai" },
  { code: "HKG", name: "Hong Kong International Airport", city: "Hong Kong", country: "Hong Kong", timezone: "Asia/Hong_Kong" },
  { code: "TPE", name: "Taiwan Taoyuan International Airport", city: "Taipei", country: "Taiwan", timezone: "Asia/Taipei" },
  { code: "SIN", name: "Singapore Changi Airport", city: "Singapore", country: "Singapore", timezone: "Asia/Singapore" },
  { code: "KUL", name: "Kuala Lumpur International Airport", city: "Kuala Lumpur", country: "Malaysia", timezone: "Asia/Kuala_Lumpur" },
  { code: "BKK", name: "Suvarnabhumi Airport", city: "Bangkok", country: "Thailand", timezone: "Asia/Bangkok" },
  { code: "DMK", name: "Don Mueang International Airport", city: "Bangkok", country: "Thailand", timezone: "Asia/Bangkok" },
  { code: "HKT", name: "Phuket International Airport", city: "Phuket", country: "Thailand", timezone: "Asia/Bangkok" },
  { code: "CGK", name: "Soekarno–Hatta International Airport", city: "Jakarta", country: "Indonesia", timezone: "Asia/Jakarta" },
  { code: "DPS", name: "Ngurah Rai International Airport", city: "Denpasar (Bali)", country: "Indonesia", timezone: "Asia/Makassar" },
  { code: "MNL", name: "Ninoy Aquino International Airport", city: "Manila", country: "Philippines", timezone: "Asia/Manila" },
  { code: "SGN", name: "Tan Son Nhat International Airport", city: "Ho Chi Minh City", country: "Vietnam", timezone: "Asia/Ho_Chi_Minh" },
  { code: "HAN", name: "Noi Bai International Airport", city: "Hanoi", country: "Vietnam", timezone: "Asia/Ho_Chi_Minh" },
  { code: "DEL", name: "Indira Gandhi International Airport", city: "New Delhi", country: "India", timezone: "Asia/Kolkata" },
  { code: "BOM", name: "Chhatrapati Shivaji Maharaj International Airport", city: "Mumbai", country: "India", timezone: "Asia/Kolkata" },
  { code: "BLR", name: "Kempegowda International Airport", city: "Bengaluru", country: "India", timezone: "Asia/Kolkata" },
  { code: "MAA", name: "Chennai International Airport", city: "Chennai", country: "India", timezone: "Asia/Kolkata" },
  { code: "HYD", name: "Rajiv Gandhi International Airport", city: "Hyderabad", country: "India", timezone: "Asia/Kolkata" },
  { code: "CCU", name: "Netaji Subhas Chandra Bose International Airport", city: "Kolkata", country: "India", timezone: "Asia/Kolkata" },
  { code: "KHI", name: "Jinnah International Airport", city: "Karachi", country: "Pakistan", timezone: "Asia/Karachi" },
  { code: "DAC", name: "Hazrat Shahjalal International Airport", city: "Dhaka", country: "Bangladesh", timezone: "Asia/Dhaka" },
  { code: "CMB", name: "Bandaranaike International Airport", city: "Colombo", country: "Sri Lanka", timezone: "Asia/Colombo" },
  { code: "KTM", name: "Tribhuvan International Airport", city: "Kathmandu", country: "Nepal", timezone: "Asia/Kathmandu" },
  { code: "SYD", name: "Sydney Kingsford Smith Airport", city: "Sydney", country: "Australia", timezone: "Australia/Sydney" },
  { code: "MEL", name: "Melbourne Airport", city: "Melbourne", country: "Australia", timezone: "Australia/Melbourne" },
  { code: "BNE", name: "Brisbane Airport", city: "Brisbane", country: "Australia", timezone: "Australia/Brisbane" },
  { code: "PER", name: "Perth Airport", city: "Perth", country: "Australia", timezone: "Australia/Perth" },
  { code: "AKL", name: "Auckland Airport", city: "Auckland", country: "New Zealand", timezone: "Pacific/Auckland" },
  { code: "NAN", name: "Nadi International Airport", city: "Nadi", country: "Fiji", timezone: "Pacific/Fiji" },
  { code: "YYT", name: "St. John's International Airport", city: "St. John's", country: "Canada", timezone: "America/St_Johns" },
  { code: "REK", name: "Reykjavík Airport", city: "Reykjavík", country: "Iceland", timezone: "Atlantic/Reykjavik" },
  { code: "KEF", name: "Keflavík International Airport", city: "Reykjavík", country: "Iceland", timezone: "Atlantic/Reykjavik" },

  // Eastern & Southeastern Europe
  { code: "KBP", name: "Boryspil International Airport", city: "Kyiv", country: "Ukraine", timezone: "Europe/Kyiv" },
  { code: "ZAG", name: "Franjo Tuđman Airport", city: "Zagreb", country: "Croatia", timezone: "Europe/Zagreb" },
  { code: "OTP", name: "Henri Coandă International Airport", city: "Bucharest", country: "Romania", timezone: "Europe/Bucharest" },
  { code: "SOF", name: "Sofia Airport", city: "Sofia", country: "Bulgaria", timezone: "Europe/Sofia" },
  { code: "BEG", name: "Belgrade Nikola Tesla Airport", city: "Belgrade", country: "Serbia", timezone: "Europe/Belgrade" },
  { code: "BTS", name: "M. R. Štefánik Airport", city: "Bratislava", country: "Slovakia", timezone: "Europe/Bratislava" },
  { code: "LJU", name: "Ljubljana Jože Pučnik Airport", city: "Ljubljana", country: "Slovenia", timezone: "Europe/Ljubljana" },
  { code: "VNO", name: "Vilnius Airport", city: "Vilnius", country: "Lithuania", timezone: "Europe/Vilnius" },
  { code: "RIX", name: "Riga International Airport", city: "Riga", country: "Latvia", timezone: "Europe/Riga" },
  { code: "TLL", name: "Lennart Meri Tallinn Airport", city: "Tallinn", country: "Estonia", timezone: "Europe/Tallinn" },
  { code: "LUX", name: "Luxembourg Airport", city: "Luxembourg City", country: "Luxembourg", timezone: "Europe/Luxembourg" },
  { code: "MLA", name: "Malta International Airport", city: "Luqa", country: "Malta", timezone: "Europe/Malta" },
  { code: "LCA", name: "Larnaca International Airport", city: "Larnaca", country: "Cyprus", timezone: "Asia/Nicosia" },
  { code: "SJJ", name: "Sarajevo International Airport", city: "Sarajevo", country: "Bosnia and Herzegovina", timezone: "Europe/Sarajevo" },
  { code: "SKP", name: "Skopje International Airport", city: "Skopje", country: "North Macedonia", timezone: "Europe/Skopje" },
  { code: "TIA", name: "Tirana International Airport", city: "Tirana", country: "Albania", timezone: "Europe/Tirane" },
  { code: "TGD", name: "Podgorica Airport", city: "Podgorica", country: "Montenegro", timezone: "Europe/Podgorica" },
  { code: "KIV", name: "Chișinău International Airport", city: "Chișinău", country: "Moldova", timezone: "Europe/Chisinau" },
  { code: "MSQ", name: "Minsk National Airport", city: "Minsk", country: "Belarus", timezone: "Europe/Minsk" },

  // Latin America & Caribbean
  { code: "CCS", name: "Simón Bolívar International Airport", city: "Caracas", country: "Venezuela", timezone: "America/Caracas" },
  { code: "UIO", name: "Mariscal Sucre International Airport", city: "Quito", country: "Ecuador", timezone: "America/Guayaquil" },
  { code: "VVI", name: "Viru Viru International Airport", city: "Santa Cruz de la Sierra", country: "Bolivia", timezone: "America/La_Paz" },
  { code: "ASU", name: "Silvio Pettirossi International Airport", city: "Asunción", country: "Paraguay", timezone: "America/Asuncion" },
  { code: "MVD", name: "Carrasco International Airport", city: "Montevideo", country: "Uruguay", timezone: "America/Montevideo" },
  { code: "PTY", name: "Tocumen International Airport", city: "Panama City", country: "Panama", timezone: "America/Panama" },
  { code: "SJO", name: "Juan Santamaría International Airport", city: "San José", country: "Costa Rica", timezone: "America/Costa_Rica" },
  { code: "GUA", name: "La Aurora International Airport", city: "Guatemala City", country: "Guatemala", timezone: "America/Guatemala" },
  { code: "SAP", name: "Ramón Villeda Morales International Airport", city: "San Pedro Sula", country: "Honduras", timezone: "America/Tegucigalpa" },
  { code: "SAL", name: "El Salvador International Airport", city: "San Salvador", country: "El Salvador", timezone: "America/El_Salvador" },
  { code: "MGA", name: "Augusto C. Sandino International Airport", city: "Managua", country: "Nicaragua", timezone: "America/Managua" },
  { code: "HAV", name: "José Martí International Airport", city: "Havana", country: "Cuba", timezone: "America/Havana" },
  { code: "SDQ", name: "Las Américas International Airport", city: "Santo Domingo", country: "Dominican Republic", timezone: "America/Santo_Domingo" },
  { code: "KIN", name: "Norman Manley International Airport", city: "Kingston", country: "Jamaica", timezone: "America/Jamaica" },
  { code: "NAS", name: "Lynden Pindling International Airport", city: "Nassau", country: "Bahamas", timezone: "America/Nassau" },
  { code: "POS", name: "Piarco International Airport", city: "Port of Spain", country: "Trinidad and Tobago", timezone: "America/Port_of_Spain" },
  { code: "BGI", name: "Grantley Adams International Airport", city: "Bridgetown", country: "Barbados", timezone: "America/Barbados" },
  { code: "BZE", name: "Philip S. W. Goldson International Airport", city: "Belize City", country: "Belize", timezone: "America/Belize" },
  { code: "PAP", name: "Toussaint Louverture International Airport", city: "Port-au-Prince", country: "Haiti", timezone: "America/Port-au-Prince" },
  { code: "SJU", name: "Luis Muñoz Marín International Airport", city: "San Juan", country: "Puerto Rico", timezone: "America/Puerto_Rico" },

  // Middle East
  { code: "IKA", name: "Imam Khomeini International Airport", city: "Tehran", country: "Iran", timezone: "Asia/Tehran" },
  { code: "BGW", name: "Baghdad International Airport", city: "Baghdad", country: "Iraq", timezone: "Asia/Baghdad" },
  { code: "KWI", name: "Kuwait International Airport", city: "Kuwait City", country: "Kuwait", timezone: "Asia/Kuwait" },
  { code: "BAH", name: "Bahrain International Airport", city: "Manama", country: "Bahrain", timezone: "Asia/Bahrain" },
  { code: "MCT", name: "Muscat International Airport", city: "Muscat", country: "Oman", timezone: "Asia/Muscat" },
  { code: "BEY", name: "Beirut–Rafic Hariri International Airport", city: "Beirut", country: "Lebanon", timezone: "Asia/Beirut" },
  { code: "SAH", name: "Sana'a International Airport", city: "Sanaa", country: "Yemen", timezone: "Asia/Aden" },

  // Africa
  { code: "ACC", name: "Kotoka International Airport", city: "Accra", country: "Ghana", timezone: "Africa/Accra" },
  { code: "DAR", name: "Julius Nyerere International Airport", city: "Dar es Salaam", country: "Tanzania", timezone: "Africa/Dar_es_Salaam" },
  { code: "EBB", name: "Entebbe International Airport", city: "Entebbe", country: "Uganda", timezone: "Africa/Kampala" },
  { code: "KGL", name: "Kigali International Airport", city: "Kigali", country: "Rwanda", timezone: "Africa/Kigali" },
  { code: "DSS", name: "Blaise Diagne International Airport", city: "Dakar", country: "Senegal", timezone: "Africa/Dakar" },
  { code: "ABJ", name: "Félix-Houphouët-Boigny International Airport", city: "Abidjan", country: "Ivory Coast", timezone: "Africa/Abidjan" },
  { code: "DLA", name: "Douala International Airport", city: "Douala", country: "Cameroon", timezone: "Africa/Douala" },
  { code: "LUN", name: "Kenneth Kaunda International Airport", city: "Lusaka", country: "Zambia", timezone: "Africa/Lusaka" },
  { code: "HRE", name: "Robert Gabriel Mugabe International Airport", city: "Harare", country: "Zimbabwe", timezone: "Africa/Harare" },
  { code: "GBE", name: "Sir Seretse Khama International Airport", city: "Gaborone", country: "Botswana", timezone: "Africa/Gaborone" },
  { code: "WDH", name: "Hosea Kutako International Airport", city: "Windhoek", country: "Namibia", timezone: "Africa/Windhoek" },
  { code: "MPM", name: "Maputo International Airport", city: "Maputo", country: "Mozambique", timezone: "Africa/Maputo" },
  { code: "LAD", name: "Quatro de Fevereiro Airport", city: "Luanda", country: "Angola", timezone: "Africa/Luanda" },
  { code: "ALG", name: "Houari Boumediene Airport", city: "Algiers", country: "Algeria", timezone: "Africa/Algiers" },
  { code: "TUN", name: "Tunis–Carthage International Airport", city: "Tunis", country: "Tunisia", timezone: "Africa/Tunis" },
  { code: "MJI", name: "Mitiga International Airport", city: "Tripoli", country: "Libya", timezone: "Africa/Tripoli" },
  { code: "KRT", name: "Khartoum International Airport", city: "Khartoum", country: "Sudan", timezone: "Africa/Khartoum" },
  { code: "MRU", name: "Sir Seewoosagur Ramgoolam International Airport", city: "Port Louis", country: "Mauritius", timezone: "Indian/Mauritius" },
  { code: "SEZ", name: "Seychelles International Airport", city: "Victoria", country: "Seychelles", timezone: "Indian/Mahe" },
  { code: "TNR", name: "Ivato International Airport", city: "Antananarivo", country: "Madagascar", timezone: "Indian/Antananarivo" },
  { code: "FIH", name: "N'djili Airport", city: "Kinshasa", country: "Democratic Republic of the Congo", timezone: "Africa/Kinshasa" },
  { code: "BZV", name: "Maya-Maya Airport", city: "Brazzaville", country: "Republic of the Congo", timezone: "Africa/Brazzaville" },
  { code: "LBV", name: "Libreville International Airport", city: "Libreville", country: "Gabon", timezone: "Africa/Libreville" },

  // Central & South Asia, Caucasus
  { code: "ULN", name: "Chinggis Khaan International Airport", city: "Ulaanbaatar", country: "Mongolia", timezone: "Asia/Ulaanbaatar" },
  { code: "ALA", name: "Almaty International Airport", city: "Almaty", country: "Kazakhstan", timezone: "Asia/Almaty" },
  { code: "TAS", name: "Tashkent International Airport", city: "Tashkent", country: "Uzbekistan", timezone: "Asia/Tashkent" },
  { code: "GYD", name: "Heydar Aliyev International Airport", city: "Baku", country: "Azerbaijan", timezone: "Asia/Baku" },
  { code: "TBS", name: "Tbilisi International Airport", city: "Tbilisi", country: "Georgia", timezone: "Asia/Tbilisi" },
  { code: "EVN", name: "Zvartnots International Airport", city: "Yerevan", country: "Armenia", timezone: "Asia/Yerevan" },
  { code: "RGN", name: "Yangon International Airport", city: "Yangon", country: "Myanmar", timezone: "Asia/Yangon" },
  { code: "PNH", name: "Phnom Penh International Airport", city: "Phnom Penh", country: "Cambodia", timezone: "Asia/Phnom_Penh" },
  { code: "VTE", name: "Wattay International Airport", city: "Vientiane", country: "Laos", timezone: "Asia/Vientiane" },
  { code: "BWN", name: "Brunei International Airport", city: "Bandar Seri Begawan", country: "Brunei", timezone: "Asia/Brunei" },
  { code: "MLE", name: "Velana International Airport", city: "Malé", country: "Maldives", timezone: "Indian/Maldives" },
  { code: "PBH", name: "Paro International Airport", city: "Paro", country: "Bhutan", timezone: "Asia/Thimphu" },
  { code: "KBL", name: "Hamid Karzai International Airport", city: "Kabul", country: "Afghanistan", timezone: "Asia/Kabul" },
  { code: "FRU", name: "Manas International Airport", city: "Bishkek", country: "Kyrgyzstan", timezone: "Asia/Bishkek" },
  { code: "DYU", name: "Dushanbe International Airport", city: "Dushanbe", country: "Tajikistan", timezone: "Asia/Dushanbe" },
  { code: "ASB", name: "Ashgabat International Airport", city: "Ashgabat", country: "Turkmenistan", timezone: "Asia/Ashgabat" },

  // Oceania & Pacific
  { code: "POM", name: "Jacksons International Airport", city: "Port Moresby", country: "Papua New Guinea", timezone: "Pacific/Port_Moresby" },
  { code: "APW", name: "Faleolo International Airport", city: "Apia", country: "Samoa", timezone: "Pacific/Apia" },
  { code: "TBU", name: "Fuaʻamotu International Airport", city: "Nukuʻalofa", country: "Tonga", timezone: "Pacific/Tongatapu" },
  { code: "VLI", name: "Bauerfield International Airport", city: "Port Vila", country: "Vanuatu", timezone: "Pacific/Efate" },
  { code: "HIR", name: "Honiara International Airport", city: "Honiara", country: "Solomon Islands", timezone: "Pacific/Guadalcanal" },
  { code: "NOU", name: "La Tontouta International Airport", city: "Nouméa", country: "New Caledonia", timezone: "Pacific/Noumea" },
  { code: "GUM", name: "Antonio B. Won Pat International Airport", city: "Hagåtña", country: "Guam", timezone: "Pacific/Guam" },

  // Microstates. Andorra, Vatican City, and Liechtenstein have no airport of
  // their own, so these route through the real nearby airport that actually
  // serves them (a distinct code from that airport's own entry, since two
  // entries can't share a code). Monaco and San Marino have a genuine airport
  // of their own right at (or effectively at) the microstate itself.
  { code: "ALV", name: "Andorra (nearest airport: Barcelona–El Prat)", city: "Andorra la Vella", country: "Andorra", timezone: "Europe/Andorra" },
  { code: "MCM", name: "Monaco Heliport", city: "Monaco", country: "Monaco", timezone: "Europe/Monaco" },
  { code: "RMI", name: "Federico Fellini International Airport", city: "Rimini (for San Marino)", country: "San Marino", timezone: "Europe/San_Marino" },
  { code: "VAT", name: "Vatican City (nearest airport: Rome–Fiumicino)", city: "Vatican City", country: "Vatican City", timezone: "Europe/Vatican" },
  { code: "LIE", name: "Liechtenstein (nearest airport: Zurich)", city: "Vaduz", country: "Liechtenstein", timezone: "Europe/Vaduz" },

  // Other well-known microstates with their own real airport, no fallback needed.
  { code: "INU", name: "Nauru International Airport", city: "Yaren", country: "Nauru", timezone: "Pacific/Nauru" },
  { code: "FUN", name: "Funafuti International Airport", city: "Funafuti", country: "Tuvalu", timezone: "Pacific/Funafuti" },
  { code: "MAJ", name: "Marshall Islands International Airport", city: "Majuro", country: "Marshall Islands", timezone: "Pacific/Majuro" },
  { code: "ROR", name: "Roman Tmetuchl International Airport", city: "Koror", country: "Palau", timezone: "Pacific/Palau" },
  { code: "TRW", name: "Bonriki International Airport", city: "Tarawa", country: "Kiribati", timezone: "Pacific/Tarawa" },
  { code: "SKB", name: "Robert L. Bradshaw International Airport", city: "Basseterre", country: "Saint Kitts and Nevis", timezone: "America/St_Kitts" },
];

// Keep the featured airports first for the empty search and retain their
// familiar display names. The generated index covers the remaining IATA codes.
const featuredCodes = new Set(featuredAirports.map((airport) => airport.code));
export const airports: Airport[] = [
  ...featuredAirports,
  ...airportIndex
    .filter(([code]) => !featuredCodes.has(code))
    .map(([code, name, city, country]) => ({ code, name, city, country })),
];

const airportsByCode = new Map(airports.map((airport) => [airport.code, airport]));

function normalizeSearchText(text: string): string {
  return text.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
const searchIndex = airports.map((airport) => {
  const city = normalizeSearchText(airport.city);
  const name = normalizeSearchText(airport.name);
  const country = normalizeSearchText(airport.country);
  return { airport, code: airport.code.toLowerCase(), city, name, country,
    haystack: `${airport.code.toLowerCase()} ${city} ${name} ${country}` };
});

export function findAirport(code: string): Airport | undefined {
  return airportsByCode.get(code.toUpperCase());
}

/**
 * Resolves pasted text straight to a single airport when the paste itself
 * unambiguously identifies one, e.g. "JFK", "jfk", "JFK - John F. Kennedy
 * International Airport", "New York (JFK)", or the full airport name copied
 * from elsewhere in the app. Returns undefined for anything looser (a city
 * or country name, a partial word) so the normal fuzzy dropdown handles it.
 */
export function recognizeAirport(pasted: string): Airport | undefined {
  const trimmed = pasted.trim();
  if (!trimmed) return undefined;

  if (/^[A-Za-z]{3}$/.test(trimmed)) {
    const exact = findAirport(trimmed.toUpperCase());
    if (exact) return exact;
  }

  const trailingCode = trimmed.match(/\(([A-Za-z]{3})\)\s*$/);
  if (trailingCode) {
    const exact = findAirport(trailingCode[1].toUpperCase());
    if (exact) return exact;
  }

  const leadingCode = trimmed.match(/^([A-Za-z]{3})\s*[-:,]/);
  if (leadingCode) {
    const exact = findAirport(leadingCode[1].toUpperCase());
    if (exact) return exact;
  }

  const lower = normalizeSearchText(trimmed);
  const exactName = airports.find((a) => normalizeSearchText(a.name) === lower);
  if (exactName) return exactName;

  // Looser paste formats, e.g. "Paris Charles de Gaulle Airport" (the city
  // prefixed onto the airport's own name) or any other reordering/combination
  // of the airport's own fields. Auto-select only when every word in the
  // paste is accounted for by exactly one airport, so an ambiguous or
  // unrelated paste safely falls through to the normal fuzzy dropdown
  // instead of guessing.
  const words = lower.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const matches = airports.filter((a) => wordsMatchAirport(words, a));
    if (matches.length === 1) return matches[0];
  }

  return undefined;
}

function wordsMatchAirport(words: string[], a: Airport): boolean {
  const haystack = normalizeSearchText(`${a.code} ${a.city} ${a.name} ${a.country}`);
  return words.every((w) => haystack.includes(w));
}

export function searchAirports(query: string, limit = 8): Airport[] {
  const q = normalizeSearchText(query);
  if (!q) return airports.slice(0, limit);
  const words = q.split(/\s+/).filter(Boolean);
  const scored = searchIndex
    .map(({ airport, code, city, name, country, haystack }) => {
      let score = -1;
      if (code === q) score = 100;
      else if (code.startsWith(q)) score = 90;
      else if (city.startsWith(q)) score = 80;
      else if (city.includes(q)) score = 60;
      else if (name.includes(q)) score = 40;
      else if (country.includes(q)) score = 20;
      // Multi-word query where the words are spread across the airport's
      // fields in some order/combination, e.g. "Paris Charles de Gaulle
      // Airport" (city name prefixed onto the airport's own name).
      else if (words.length > 1 && words.every((word) => haystack.includes(word))) score = 30;
      return { airport, score };
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score);
  return scored.slice(0, limit).map((x) => x.airport);
}
