// Australian Suburb Intelligence Dataset (SuburbIQ)
// Realistically modeled micro-demographic and property metrics across major Australian metropolitan regions

export const AUSTRALIAN_SUBURBS = [
  {
    id: 'surry-hills-nsw',
    name: 'Surry Hills',
    state: 'NSW',
    postcode: '2010',
    lga: 'City of Sydney',
    lat: -33.8861,
    lng: 151.2114,
    distanceToCbdKm: 1.8,
    badge: 'Cultural Epicentre',
    heroImage: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1200&q=80',
    summary: 'A bustling inner-city precinct celebrated for premier specialty coffee, award-winning dining along Crown Street, restored Victorian terraces, and cutting-edge creative agencies. Ideal for young professionals and design lovers who thrive on vibrant urban energy.',
    propertyMetrics: {
      medianHousePrice: 2180000,
      medianUnitPrice: 925000,
      growth12mPercent: 6.8,
      houseRentalYield: 3.1,
      unitRentalYield: 4.8,
      medianWeeklyRentHouse: 1250,
      medianWeeklyRentUnit: 780,
      daysOnMarket: 26,
      clearanceRatePercent: 74
    },
    lifestyleScores: {
      vibeCulture: 98,
      familyLiving: 62,
      tranquility: 54,
      transitWalk: 96,
      affluenceEconomic: 88,
      safetyCommunity: 76,
      overallScore: 88
    },
    demographics: {
      population: 16410,
      medianAge: 33,
      weeklyHouseholdIncome: 2540,
      stateAvgWeeklyIncome: 1829,
      householdType: {
        couplesNoKids: 49,
        singleLiving: 36,
        familiesWithKids: 15
      },
      housingTenure: {
        renting: 61,
        mortgage: 22,
        ownedOutright: 17
      },
      educationHigherEdPercent: 64,
      employedProfessionalsPercent: 68,
      topAncestries: ['Australian', 'English', 'Irish', 'Chinese', 'Italian']
    },
    amenities: {
      topSchools: [
        { name: 'Bourke Street Public School', type: 'Public Primary', icsea: 1140, distance: '300m' },
        { name: 'Sydney Boys High School', type: 'Selective High', icsea: 1180, distance: '1.2km' },
        { name: 'Sydney Girls High School', type: 'Selective High', icsea: 1175, distance: '1.3km' }
      ],
      transitHubs: ['Surry Hills Light Rail (L2/L3)', 'Central Station (500m)', 'Crown St Bus Corridors'],
      parksAndRecreation: ['Shannon Reserve', 'Prince Alfred Park & Heated Pool', 'Ward Park'],
      coffeeAndDining: {
        cafesPerSqKm: 42,
        notableSpots: ['Single O Coffee Roasters', 'Reuben Hills', 'Firedoor', 'Chin Chin Sydney']
      }
    },
    pocketHighlights: {
      pros: ['World-class culinary scene', 'Immediate walkability to CBD', 'Light rail accessibility', 'Heritage architecture'],
      cons: ['Limited off-street parking', 'Higher weekend pedestrian noise', 'High property price per sqm'],
      idealFor: ['Tech & Creative Professionals', 'Couples without children', 'Urban Foodies', 'Investors seeking tight vacancy'],
      developmentHotspots: 'Tech Central corridor expansion around Central Station precinct.'
    }
  },
  {
    id: 'bondi-beach-nsw',
    name: 'Bondi Beach',
    state: 'NSW',
    postcode: '2026',
    lga: 'Waverley Council',
    lat: -33.8915,
    lng: 151.2767,
    distanceToCbdKm: 7.2,
    badge: 'Iconic Coastal Lifestyle',
    heroImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    summary: 'Australias most world-renowned beachside community blending sunrise surf culture, wellness studios, organic health cafes, and high-end residential enclaves. Attracts high-earning expats and coastal connoisseurs.',
    propertyMetrics: {
      medianHousePrice: 3850000,
      medianUnitPrice: 1420000,
      growth12mPercent: 8.4,
      houseRentalYield: 2.6,
      unitRentalYield: 3.9,
      medianWeeklyRentHouse: 1900,
      medianWeeklyRentUnit: 980,
      daysOnMarket: 31,
      clearanceRatePercent: 78
    },
    lifestyleScores: {
      vibeCulture: 95,
      familyLiving: 71,
      tranquility: 63,
      transitWalk: 84,
      affluenceEconomic: 92,
      safetyCommunity: 82,
      overallScore: 89
    },
    demographics: {
      population: 11650,
      medianAge: 32,
      weeklyHouseholdIncome: 2890,
      stateAvgWeeklyIncome: 1829,
      householdType: {
        couplesNoKids: 44,
        singleLiving: 34,
        familiesWithKids: 22
      },
      housingTenure: {
        renting: 58,
        mortgage: 23,
        ownedOutright: 19
      },
      educationHigherEdPercent: 62,
      employedProfessionalsPercent: 65,
      topAncestries: ['English', 'Australian', 'Irish', 'Scottish', 'South African']
    },
    amenities: {
      topSchools: [
        { name: 'Bondi Beach Public School', type: 'Public Primary', icsea: 1125, distance: '250m' },
        { name: 'Reddam House', type: 'Private Combined', icsea: 1195, distance: '1.8km' }
      ],
      transitHubs: ['333 Express Bus to Martin Place', 'Bondi Junction Interchange (2.4km)'],
      parksAndRecreation: ['Bondi Beach & Promenade', 'Bondi to Bronte Coastal Walk', 'Bondi Icebergs Pool'],
      coffeeAndDining: {
        cafesPerSqKm: 28,
        notableSpots: ['Bills Bondi', 'Porch and Parlour', 'Icebergs Dining Room & Bar', 'Speedos Cafe']
      }
    },
    pocketHighlights: {
      pros: ['Pristine world-famous beach access', 'Electric coastal atmosphere', 'Year-round high rental demand', 'Prestigious brand equity'],
      cons: ['Summer tourist congestion', 'No direct passenger rail line', 'High strata levies on oceanfront units'],
      idealFor: ['High-income Singles & Couples', 'Fitness & Ocean Enthusiasts', 'Luxury Holiday Let Investors'],
      developmentHotspots: 'Boutique architectural luxury apartment redevelopments along Campbell Parade.'
    }
  },
  {
    id: 'manly-nsw',
    name: 'Manly',
    state: 'NSW',
    postcode: '2095',
    lga: 'Northern Beaches Council',
    lat: -33.7969,
    lng: 151.2842,
    distanceToCbdKm: 11.5,
    badge: 'Seaside Sanctuary',
    heroImage: 'https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?auto=format&fit=crop&w=1200&q=80',
    summary: 'A pristine peninsula bordered by Sydney Harbour on one side and an ocean surf break on the other. Renowned for its scenic 20-minute Fast Ferry commute to Circular Quay, Norfolk pines, and high community safety.',
    propertyMetrics: {
      medianHousePrice: 4200000,
      medianUnitPrice: 1650000,
      growth12mPercent: 7.2,
      houseRentalYield: 2.7,
      unitRentalYield: 3.7,
      medianWeeklyRentHouse: 1950,
      medianWeeklyRentUnit: 1050,
      daysOnMarket: 29,
      clearanceRatePercent: 77
    },
    lifestyleScores: {
      vibeCulture: 88,
      familyLiving: 89,
      tranquility: 78,
      transitWalk: 89,
      affluenceEconomic: 94,
      safetyCommunity: 91,
      overallScore: 92
    },
    demographics: {
      population: 16180,
      medianAge: 37,
      weeklyHouseholdIncome: 3120,
      stateAvgWeeklyIncome: 1829,
      householdType: {
        couplesNoKids: 41,
        familiesWithKids: 36,
        singleLiving: 23
      },
      housingTenure: {
        renting: 49,
        mortgage: 27,
        ownedOutright: 24
      },
      educationHigherEdPercent: 66,
      employedProfessionalsPercent: 67,
      topAncestries: ['English', 'Australian', 'Irish', 'Scottish', 'German']
    },
    amenities: {
      topSchools: [
        { name: 'Manly Village Public School', type: 'Public Primary', icsea: 1150, distance: '300m' },
        { name: 'St Pauls Catholic College', type: 'Private Secondary', icsea: 1105, distance: '900m' },
        { name: 'Stella Maris College', type: 'Private Secondary', icsea: 1120, distance: '1.1km' }
      ],
      transitHubs: ['Manly Fast Ferry Wharf (Circular Quay in 18 mins)', 'B-Line Bus Network'],
      parksAndRecreation: ['Shelly Beach Marine Reserve', 'North Head Sanctuary', 'Manly Oval'],
      coffeeAndDining: {
        cafesPerSqKm: 22,
        notableSpots: ['The Boathouse Shelly Beach', 'Fenix Manly', 'Hugo’s Manly', 'Rollers Bakehouse']
      }
    },
    pocketHighlights: {
      pros: ['Scenic ferry commute to Sydney CBD', 'Exceptional safety & community feel', 'Both harbor and ocean waterfronts'],
      cons: ['Spit Bridge road bottlenecks during peak hours', 'Extremely high barrier to house entry'],
      idealFor: ['Executive Families', 'Surf & Ocean Athletes', 'Discerning Lifestyle Buyers'],
      developmentHotspots: 'Manly Wharf dining precinct revamp.'
    }
  },
  {
    id: 'chatswood-nsw',
    name: 'Chatswood',
    state: 'NSW',
    postcode: '2067',
    lga: 'Willoughby City Council',
    lat: -33.7961,
    lng: 151.1804,
    distanceToCbdKm: 9.0,
    badge: 'North Shore Powerhouse',
    heroImage: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
    summary: 'A bustling cosmopolitan commercial and high-density residential powerhouse on the Lower North Shore. Famed for premier academic performance, high-end shopping centres (Westfield & Chatswood Chase), and Sydney Metro connectivity.',
    propertyMetrics: {
      medianHousePrice: 3100000,
      medianUnitPrice: 1150000,
      growth12mPercent: 5.4,
      houseRentalYield: 2.8,
      unitRentalYield: 4.5,
      medianWeeklyRentHouse: 1400,
      medianWeeklyRentUnit: 850,
      daysOnMarket: 34,
      clearanceRatePercent: 72
    },
    lifestyleScores: {
      vibeCulture: 86,
      familyLiving: 93,
      tranquility: 68,
      transitWalk: 97,
      affluenceEconomic: 90,
      safetyCommunity: 89,
      overallScore: 90
    },
    demographics: {
      population: 25550,
      medianAge: 35,
      weeklyHouseholdIncome: 2680,
      stateAvgWeeklyIncome: 1829,
      householdType: {
        familiesWithKids: 48,
        couplesNoKids: 32,
        singleLiving: 20
      },
      housingTenure: {
        renting: 46,
        mortgage: 28,
        ownedOutright: 26
      },
      educationHigherEdPercent: 71,
      employedProfessionalsPercent: 63,
      topAncestries: ['Chinese', 'English', 'Australian', 'Korean', 'Cantonese']
    },
    amenities: {
      topSchools: [
        { name: 'Chatswood High School', type: 'Public Secondary', icsea: 1158, distance: '800m' },
        { name: 'Chatswood Public School', type: 'Public Primary', icsea: 1184, distance: '600m' },
        { name: 'St Pius X College', type: 'Private Secondary', icsea: 1140, distance: '950m' }
      ],
      transitHubs: ['Chatswood Metro & Heavy Rail Interchange', 'Major Bus Interchange'],
      parksAndRecreation: ['Beauchamp Park', 'Chatswood Oval', 'Lane Cove National Park proximity'],
      coffeeAndDining: {
        cafesPerSqKm: 31,
        notableSpots: ['The Concourse Cafes', 'Hawker Lane', 'Mamak Chatswood', 'Tim Ho Wan']
      }
    },
    pocketHighlights: {
      pros: ['Unmatched public transit via Sydney Metro', 'Top tier educational ratings', 'Vibrant Asian culinary epicenter'],
      cons: ['High density tower congestion along Victoria Ave', 'Competitive school catchments'],
      idealFor: ['Education-focused Families', 'Corporate Commuters', 'Apartment Investors'],
      developmentHotspots: 'Chatswood Chase luxury retail expansion and Victoria Avenue civic improvements.'
    }
  },
  {
    id: 'newtown-nsw',
    name: 'Newtown',
    state: 'NSW',
    postcode: '2042',
    lga: 'Inner West Council',
    lat: -33.8980,
    lng: 151.1793,
    distanceToCbdKm: 4.1,
    badge: 'Bohemian Heartland',
    heroImage: 'https://images.unsplash.com/photo-1524813686514-a57563d77d61?auto=format&fit=crop&w=1200&q=80',
    summary: 'The eccentric artistic heart of Sydneys Inner West, packed with independent bookstores, live theatres, vintage clothing boutiques, and eclectic vegan restaurants along iconic King Street.',
    propertyMetrics: {
      medianHousePrice: 1820000,
      medianUnitPrice: 790000,
      growth12mPercent: 5.9,
      houseRentalYield: 3.4,
      unitRentalYield: 5.1,
      medianWeeklyRentHouse: 1050,
      medianWeeklyRentUnit: 690,
      daysOnMarket: 24,
      clearanceRatePercent: 76
    },
    lifestyleScores: {
      vibeCulture: 99,
      familyLiving: 67,
      tranquility: 50,
      transitWalk: 95,
      affluenceEconomic: 79,
      safetyCommunity: 78,
      overallScore: 86
    },
    demographics: {
      population: 15100,
      medianAge: 32,
      weeklyHouseholdIncome: 2280,
      stateAvgWeeklyIncome: 1829,
      householdType: {
        couplesNoKids: 46,
        singleLiving: 35,
        familiesWithKids: 19
      },
      housingTenure: {
        renting: 59,
        mortgage: 23,
        ownedOutright: 18
      },
      educationHigherEdPercent: 68,
      employedProfessionalsPercent: 62,
      topAncestries: ['Australian', 'English', 'Irish', 'Scottish', 'Greek']
    },
    amenities: {
      topSchools: [
        { name: 'Newtown High School of the Performing Arts', type: 'Selective Arts', icsea: 1145, distance: '400m' },
        { name: 'Newtown Public School', type: 'Public Primary', icsea: 1130, distance: '300m' }
      ],
      transitHubs: ['Newtown Train Station (T2 line)', 'King St Frequent Bus Corridor'],
      parksAndRecreation: ['Camperdown Memorial Rest Park', 'Hollis Park', 'Sydney Uni Grounds'],
      coffeeAndDining: {
        cafesPerSqKm: 38,
        notableSpots: ['Black Star Pastry', 'Marys Newtown', 'Lentil As Anything (orig)', '212 Blu']
      }
    },
    pocketHighlights: {
      pros: ['Phenomenal artistic atmosphere', 'Proximity to Sydney University and RPA Hospital', 'High rental occupancy rate'],
      cons: ['Aircraft flight path noise exposure', 'Narrow residential streets with competitive street parking'],
      idealFor: ['Academics & Medical Staff', 'Students & Young Creatives', 'Investors looking for yield'],
      developmentHotspots: 'Inner West green canopy enhancement and active transport links.'
    }
  },
  {
    id: 'fitzroy-vic',
    name: 'Fitzroy',
    state: 'VIC',
    postcode: '3065',
    lga: 'City of Yarra',
    lat: -37.8014,
    lng: 144.9786,
    distanceToCbdKm: 2.1,
    badge: 'Melbournes Creative Soul',
    heroImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    summary: 'Melbournes historic bohemian precinct, famous for world-class lane way street art, vintage markets, micro-breweries, rooftop cocktail bars, and heritage Victorian worker cottages.',
    propertyMetrics: {
      medianHousePrice: 1620000,
      medianUnitPrice: 745000,
      growth12mPercent: 4.8,
      houseRentalYield: 3.5,
      unitRentalYield: 5.2,
      medianWeeklyRentHouse: 950,
      medianWeeklyRentUnit: 640,
      daysOnMarket: 28,
      clearanceRatePercent: 71
    },
    lifestyleScores: {
      vibeCulture: 99,
      familyLiving: 60,
      tranquility: 52,
      transitWalk: 97,
      affluenceEconomic: 84,
      safetyCommunity: 79,
      overallScore: 87
    },
    demographics: {
      population: 10450,
      medianAge: 33,
      weeklyHouseholdIncome: 2360,
      stateAvgWeeklyIncome: 1759,
      householdType: {
        couplesNoKids: 52,
        singleLiving: 33,
        familiesWithKids: 15
      },
      housingTenure: {
        renting: 64,
        mortgage: 20,
        ownedOutright: 16
      },
      educationHigherEdPercent: 67,
      employedProfessionalsPercent: 64,
      topAncestries: ['English', 'Australian', 'Irish', 'Scottish', 'Italian']
    },
    amenities: {
      topSchools: [
        { name: 'Fitzroy Primary School', type: 'Public Primary', icsea: 1060, distance: '400m' },
        { name: 'Fitzroy High School', type: 'Public Secondary', icsea: 1090, distance: '1.4km' },
        { name: 'Academy of Mary Immaculate', type: 'Private Secondary', icsea: 1110, distance: '700m' }
      ],
      transitHubs: ['Route 11 Tram (Brunswick St)', 'Route 86 Tram (Smith St)', 'Route 96 Tram'],
      parksAndRecreation: ['Edinburgh Gardens (adjacent)', 'Carlton Gardens', 'Atherton Gardens'],
      coffeeAndDining: {
        cafesPerSqKm: 46,
        notableSpots: ['Industry Beans Fitzroy', 'Lune Croissanterie', 'Naked for Satan', 'Marion Wine Bar']
      }
    },
    pocketHighlights: {
      pros: ['Brunswick & Gertrude Street dining strips', 'Tram direct into Melbourne CBD in 8 mins', 'Unrivaled coffee culture'],
      cons: ['Weekend nightlife noise', 'Limited land parcel sizes', 'Premium price per square meter'],
      idealFor: ['Creative Entrepreneurs', 'Design Enthusiasts', 'Young Executives'],
      developmentHotspots: 'Heritage warehouse residential conversions.'
    }
  },
  {
    id: 'south-yarra-vic',
    name: 'South Yarra',
    state: 'VIC',
    postcode: '3141',
    lga: 'City of Stonnington',
    lat: -37.8396,
    lng: 144.9926,
    distanceToCbdKm: 3.5,
    badge: 'Affluent Cosmopolitan',
    heroImage: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    summary: 'A sophisticated blue-chip inner-city hub where high-fashion boutiques along Chapel Street meet the serenity of the Royal Botanic Gardens and stately heritage mansions.',
    propertyMetrics: {
      medianHousePrice: 2350000,
      medianUnitPrice: 620000,
      growth12mPercent: 4.2,
      houseRentalYield: 3.0,
      unitRentalYield: 5.4,
      medianWeeklyRentHouse: 1180,
      medianWeeklyRentUnit: 590,
      daysOnMarket: 33,
      clearanceRatePercent: 73
    },
    lifestyleScores: {
      vibeCulture: 94,
      familyLiving: 73,
      tranquility: 71,
      transitWalk: 95,
      affluenceEconomic: 93,
      safetyCommunity: 86,
      overallScore: 89
    },
    demographics: {
      population: 25200,
      medianAge: 34,
      weeklyHouseholdIncome: 2710,
      stateAvgWeeklyIncome: 1759,
      householdType: {
        couplesNoKids: 48,
        singleLiving: 38,
        familiesWithKids: 14
      },
      housingTenure: {
        renting: 60,
        mortgage: 21,
        ownedOutright: 19
      },
      educationHigherEdPercent: 69,
      employedProfessionalsPercent: 66,
      topAncestries: ['English', 'Australian', 'Irish', 'Chinese', 'Scottish']
    },
    amenities: {
      topSchools: [
        { name: 'Melbourne Girls Grammar', type: 'Private Secondary', icsea: 1195, distance: '850m' },
        { name: 'Melbourne Grammar School', type: 'Private Combined', icsea: 1205, distance: '1.2km' },
        { name: 'South Yarra Primary School', type: 'Public Primary', icsea: 1170, distance: '450m' }
      ],
      transitHubs: ['South Yarra Railway Station (4 lines)', 'Tram Routes 58 & 78'],
      parksAndRecreation: ['Royal Botanic Gardens & Tan Track', 'Fawkner Park', 'Yarra River Trail'],
      coffeeAndDining: {
        cafesPerSqKm: 34,
        notableSpots: ['Two Birds One Stone', 'Bar Carolina', 'France-Soir', 'Abacus Bar']
      }
    },
    pocketHighlights: {
      pros: ['Unmatched parkland access (Tan Track & Fawkner Park)', 'Sub-10 minute train ride into Flinders St', 'Dynamic fashion & culinary strips'],
      cons: ['Oversupply of high-rise micro-apartments near Forrest Hill', 'Traffic on Toorak Road'],
      idealFor: ['High-earning Corporate Singles', 'Downsizers', 'Fitness and Nature Walkers'],
      developmentHotspots: 'Jam Factory multi-hundred-million precinct masterplan.'
    }
  },
  {
    id: 'brighton-vic',
    name: 'Brighton',
    state: 'VIC',
    postcode: '3186',
    lga: 'Bayside City Council',
    lat: -37.9062,
    lng: 144.9926,
    distanceToCbdKm: 11.2,
    badge: 'Prestigious Coastal Elite',
    heroImage: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
    summary: 'The benchmark of Bayside luxury living, celebrated for its 82 historic colourful bathing boxes, private school elite campuses, manicured palm-fringed estates, and peaceful coastline.',
    propertyMetrics: {
      medianHousePrice: 3380000,
      medianUnitPrice: 1120000,
      growth12mPercent: 6.1,
      houseRentalYield: 2.5,
      unitRentalYield: 4.1,
      medianWeeklyRentHouse: 1650,
      medianWeeklyRentUnit: 780,
      daysOnMarket: 36,
      clearanceRatePercent: 75
    },
    lifestyleScores: {
      vibeCulture: 80,
      familyLiving: 97,
      tranquility: 91,
      transitWalk: 79,
      affluenceEconomic: 98,
      safetyCommunity: 95,
      overallScore: 92
    },
    demographics: {
      population: 23250,
      medianAge: 44,
      weeklyHouseholdIncome: 3420,
      stateAvgWeeklyIncome: 1759,
      householdType: {
        familiesWithKids: 51,
        couplesNoKids: 33,
        singleLiving: 16
      },
      housingTenure: {
        ownedOutright: 44,
        mortgage: 34,
        renting: 22
      },
      educationHigherEdPercent: 68,
      employedProfessionalsPercent: 68,
      topAncestries: ['English', 'Australian', 'Irish', 'Scottish', 'Chinese']
    },
    amenities: {
      topSchools: [
        { name: 'Brighton Grammar School', type: 'Private Combined', icsea: 1180, distance: '700m' },
        { name: 'Firbank Grammar School', type: 'Private Combined', icsea: 1185, distance: '650m' },
        { name: 'St Leonards College', type: 'Private Combined', icsea: 1175, distance: '1.9km' }
      ],
      transitHubs: ['Middle Brighton Station', 'Brighton Beach Station', 'North Brighton Station'],
      parksAndRecreation: ['Dendy Street Beach & Bathing Boxes', 'Brighton Yacht Club', 'Hurlingham Park'],
      coffeeAndDining: {
        cafesPerSqKm: 14,
        notableSpots: ['The Deck Brighton', 'Church Street Boutiques', 'Half Moon Hotel', 'Pantry']
      }
    },
    pocketHighlights: {
      pros: ['Top safety and family amenities in Victoria', 'Prestigious private schools within walking distance', 'Exclusive seaside vibe'],
      cons: ['Substantial capital cost to enter', 'Slower nightlife / evening quietness'],
      idealFor: ['Affluent Families', 'Established Executives', 'Long-term Generational Wealth'],
      developmentHotspots: 'Boutique single-level downsizer residences along Church St corridor.'
    }
  },
  {
    id: 'new-farm-qld',
    name: 'New Farm',
    state: 'QLD',
    postcode: '4005',
    lga: 'Brisbane City Council',
    lat: -27.4698,
    lng: 153.0533,
    distanceToCbdKm: 2.2,
    badge: 'Subtropical Riverside Luxe',
    heroImage: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80',
    summary: 'Brisbanes crown jewel peninsula, framed by jacaranda-lined avenues, the iconic Brisbane Powerhouse arts centre, sweeping riverwalk connections, and high-end cafes.',
    propertyMetrics: {
      medianHousePrice: 2850000,
      medianUnitPrice: 880000,
      growth12mPercent: 11.2,
      houseRentalYield: 2.8,
      unitRentalYield: 4.6,
      medianWeeklyRentHouse: 1350,
      medianWeeklyRentUnit: 700,
      daysOnMarket: 22,
      clearanceRatePercent: 81
    },
    lifestyleScores: {
      vibeCulture: 96,
      familyLiving: 84,
      tranquility: 82,
      transitWalk: 88,
      affluenceEconomic: 95,
      safetyCommunity: 90,
      overallScore: 92
    },
    demographics: {
      population: 12500,
      medianAge: 36,
      weeklyHouseholdIncome: 2980,
      stateAvgWeeklyIncome: 1675,
      householdType: {
        couplesNoKids: 52,
        singleLiving: 32,
        familiesWithKids: 16
      },
      housingTenure: {
        renting: 54,
        mortgage: 24,
        ownedOutright: 22
      },
      educationHigherEdPercent: 67,
      employedProfessionalsPercent: 65,
      topAncestries: ['English', 'Australian', 'Irish', 'Italian', 'Scottish']
    },
    amenities: {
      topSchools: [
        { name: 'New Farm State School', type: 'Public Primary', icsea: 1145, distance: '400m' },
        { name: 'Holy Spirit Primary School', type: 'Private Primary', icsea: 1130, distance: '600m' }
      ],
      transitHubs: ['New Farm Park CityCat Ferry Terminal', 'Sydney Street CityCat', 'Route 196 Bus'],
      parksAndRecreation: ['New Farm Park (rose gardens & playground)', 'Brisbane Riverwalk', 'Powerhouse Cultural Precinct'],
      coffeeAndDining: {
        cafesPerSqKm: 27,
        notableSpots: ['Spicers Balfour Dining', 'Mary Mae’s Powerhouse', 'Kin & Co', 'James St Precinct (adjacent)']
      }
    },
    pocketHighlights: {
      pros: ['Sublime riverfront parklands and CityCat ferries', 'Very high 12m capital appreciation', 'Walkable to James Street luxury retail'],
      cons: ['Low-lying pockets require flood overlay check', 'Limited off-street parking on older streets'],
      idealFor: ['Executive Professionals', 'Urban Upsizers & Downsizers', 'High-net-worth River Lifestyle Seekers'],
      developmentHotspots: 'Riverfront luxury penthouse developments.'
    }
  },
  {
    id: 'west-end-qld',
    name: 'West End',
    state: 'QLD',
    postcode: '4101',
    lga: 'Brisbane City Council',
    lat: -27.4848,
    lng: 153.0101,
    distanceToCbdKm: 2.4,
    badge: 'Artisan & Cultural Enclave',
    heroImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    summary: 'A vibrant subtropical cultural enclave on the Brisbane River bend, characterized by indie bookshops, Greek and Mediterranean culinary history, craft breweries, and the prestigious Brisbane State High catchment.',
    propertyMetrics: {
      medianHousePrice: 1780000,
      medianUnitPrice: 685000,
      growth12mPercent: 9.4,
      houseRentalYield: 3.4,
      unitRentalYield: 5.5,
      medianWeeklyRentHouse: 1000,
      medianWeeklyRentUnit: 640,
      daysOnMarket: 25,
      clearanceRatePercent: 78
    },
    lifestyleScores: {
      vibeCulture: 97,
      familyLiving: 83,
      tranquility: 69,
      transitWalk: 92,
      affluenceEconomic: 86,
      safetyCommunity: 83,
      overallScore: 88
    },
    demographics: {
      population: 13800,
      medianAge: 34,
      weeklyHouseholdIncome: 2420,
      stateAvgWeeklyIncome: 1675,
      householdType: {
        couplesNoKids: 48,
        singleLiving: 32,
        familiesWithKids: 20
      },
      housingTenure: {
        renting: 61,
        mortgage: 21,
        ownedOutright: 18
      },
      educationHigherEdPercent: 66,
      employedProfessionalsPercent: 63,
      topAncestries: ['Australian', 'English', 'Irish', 'Greek', 'Vietnamese']
    },
    amenities: {
      topSchools: [
        { name: 'Brisbane State High School (In-Catchment)', type: 'Public / Partially Selective', icsea: 1198, distance: '1.1km' },
        { name: 'West End State School', type: 'Public Primary', icsea: 1152, distance: '350m' }
      ],
      transitHubs: ['West End CityCat Ferry', 'Glider CityGlider High-frequency Bus (24/7 weekend)'],
      parksAndRecreation: ['Davies Park & Saturday Markets', 'Orleigh Park Riverbank', 'Riverside Bike Way'],
      coffeeAndDining: {
        cafesPerSqKm: 32,
        notableSpots: ['Morning After', 'Gunshop Cafe', 'Brisbane Brewing Co', 'Lefkas Taverna']
      }
    },
    pocketHighlights: {
      pros: ['Guaranteed entry to Brisbane State High School (BSHS)', 'Thriving weekend farmers market culture', 'Short commute into South Bank & CBD'],
      cons: ['Rapid density growth along Montague Road', 'Monsoon season stormwater drainage watch'],
      idealFor: ['Families prioritizing high school entrance', 'Eco-conscious Professionals', 'Food & Market Lovers'],
      developmentHotspots: 'Montague Markets urban renewal precinct.'
    }
  },
  {
    id: 'burleigh-heads-qld',
    name: 'Burleigh Heads',
    state: 'QLD',
    postcode: '4220',
    lga: 'City of Gold Coast',
    lat: -28.0872,
    lng: 153.4475,
    distanceToCbdKm: 12.0,
    badge: 'Surfers Paradise Alternative',
    heroImage: 'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80',
    summary: 'The epicenter of relaxed modern Queensland coastal luxury, anchored by the ancient basalt headland and national park, world-class point break, James Street boutique village, and beachfront dining.',
    propertyMetrics: {
      medianHousePrice: 1950000,
      medianUnitPrice: 995000,
      growth12mPercent: 12.8,
      houseRentalYield: 3.2,
      unitRentalYield: 4.8,
      medianWeeklyRentHouse: 1150,
      medianWeeklyRentUnit: 820,
      daysOnMarket: 21,
      clearanceRatePercent: 82
    },
    lifestyleScores: {
      vibeCulture: 93,
      familyLiving: 86,
      tranquility: 75,
      transitWalk: 82,
      affluenceEconomic: 88,
      safetyCommunity: 87,
      overallScore: 90
    },
    demographics: {
      population: 10200,
      medianAge: 38,
      weeklyHouseholdIncome: 2380,
      stateAvgWeeklyIncome: 1675,
      householdType: {
        couplesNoKids: 46,
        familiesWithKids: 34,
        singleLiving: 20
      },
      housingTenure: {
        renting: 48,
        mortgage: 28,
        ownedOutright: 24
      },
      educationHigherEdPercent: 54,
      employedProfessionalsPercent: 58,
      topAncestries: ['Australian', 'English', 'Irish', 'Scottish', 'New Zealander']
    },
    amenities: {
      topSchools: [
        { name: 'Burleigh Heads State School', type: 'Public Primary', icsea: 1110, distance: '500m' },
        { name: 'Marymount College', type: 'Private Combined', icsea: 1120, distance: '2.1km' }
      ],
      transitHubs: ['Gold Coast Light Rail Stage 3 (under commissioning)', 'Gold Coast Highway Bus routes'],
      parksAndRecreation: ['Burleigh Head National Park', 'Burleigh Point Lookout', 'Tallebudgera Creek'],
      coffeeAndDining: {
        cafesPerSqKm: 21,
        notableSpots: ['Rick Shores (beachfront)', 'The Tropic (Burleigh Pavilion)', 'Paddock Bakery', 'Social Espresso']
      }
    },
    pocketHighlights: {
      pros: ['Pristine nature reserve & world-tour surfing break', 'Surging interstate capital inflow', 'Light rail extension providing direct airport & Broadbeach link'],
      cons: ['Weekend parking competition near The Hill', 'Higher building insurance costs near sea spray'],
      idealFor: ['Interstate Migrants', 'Ocean & Outdoor Enthusiasts', 'Capital Growth Property Investors'],
      developmentHotspots: 'Gold Coast Light Rail Stage 3 transport corridor integration.'
    }
  },
  {
    id: 'subiaco-wa',
    name: 'Subiaco',
    state: 'WA',
    postcode: '6008',
    lga: 'City of Subiaco',
    lat: -31.9478,
    lng: 115.8239,
    distanceToCbdKm: 3.2,
    badge: 'Perths Heritage Hub',
    heroImage: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    summary: 'A leafy, historic Western Australian inner-western enclave with European-style cafe strips along Rokeby Road, restored federation cottages, and direct train links to Perth CBD and Cottesloe Beach.',
    propertyMetrics: {
      medianHousePrice: 1750000,
      medianUnitPrice: 580000,
      growth12mPercent: 14.1,
      houseRentalYield: 3.6,
      unitRentalYield: 6.2,
      medianWeeklyRentHouse: 980,
      medianWeeklyRentUnit: 620,
      daysOnMarket: 18,
      clearanceRatePercent: 85
    },
    lifestyleScores: {
      vibeCulture: 88,
      familyLiving: 89,
      tranquility: 80,
      transitWalk: 91,
      affluenceEconomic: 92,
      safetyCommunity: 91,
      overallScore: 90
    },
    demographics: {
      population: 9800,
      medianAge: 39,
      weeklyHouseholdIncome: 2750,
      stateAvgWeeklyIncome: 1815,
      householdType: {
        couplesNoKids: 48,
        familiesWithKids: 32,
        singleLiving: 20
      },
      housingTenure: {
        renting: 45,
        mortgage: 29,
        ownedOutright: 26
      },
      educationHigherEdPercent: 68,
      employedProfessionalsPercent: 67,
      topAncestries: ['English', 'Australian', 'Irish', 'Scottish', 'Italian']
    },
    amenities: {
      topSchools: [
        { name: 'Subiaco Primary School', type: 'Public Primary', icsea: 1188, distance: '300m' },
        { name: 'Bob Hawke College', type: 'Public Secondary', icsea: 1165, distance: '900m' },
        { name: 'Perth Modern School (WA Only Selective)', type: 'Selective Secondary', icsea: 1220, distance: '1.2km' }
      ],
      transitHubs: ['Subiaco Railway Station (Fremantle Line)', 'West Leederville Station (700m)'],
      parksAndRecreation: ['Subiaco Common & Lake', 'Kings Park & Botanic Garden (adjacent)', 'Market Square'],
      coffeeAndDining: {
        cafesPerSqKm: 24,
        notableSpots: ['Architects and Heroes', 'Subiaco Hotel', 'Deli Guild', 'Lulu La Delizia']
      }
    },
    pocketHighlights: {
      pros: ['Proximity to Bob Hawke College & Perth Modern', 'Subi Centro urban renewal with vibrant new dining', 'Direct rail access into Perth CBD and Fremantle port'],
      cons: ['Subiaco Oval redevelopment still concluding', 'Commercial retail vacancy adjusting after boom'],
      idealFor: ['High-tech & Mining Executives', 'Families seeking top WA public secondary education', 'Yield investors'],
      developmentHotspots: 'Subi East landmark masterplanned village.'
    }
  },
  {
    id: 'norwood-sa',
    name: 'Norwood',
    state: 'SA',
    postcode: '5067',
    lga: 'City of Norwood Payneham & St Peters',
    lat: -34.9208,
    lng: 138.6344,
    distanceToCbdKm: 3.0,
    badge: 'Cosmopolitan Heritage',
    heroImage: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    summary: 'Adelaides most coveted eastern city fringe suburb. Centred around The Parade, featuring heritage stone cottages, alfresco Italian espresso bars, boutique shopping, and leafy tree-canopied avenues.',
    propertyMetrics: {
      medianHousePrice: 1420000,
      medianUnitPrice: 560000,
      growth12mPercent: 10.5,
      houseRentalYield: 3.5,
      unitRentalYield: 5.4,
      medianWeeklyRentHouse: 820,
      medianWeeklyRentUnit: 520,
      daysOnMarket: 23,
      clearanceRatePercent: 83
    },
    lifestyleScores: {
      vibeCulture: 91,
      familyLiving: 88,
      tranquility: 82,
      transitWalk: 89,
      affluenceEconomic: 89,
      safetyCommunity: 92,
      overallScore: 89
    },
    demographics: {
      population: 6200,
      medianAge: 40,
      weeklyHouseholdIncome: 2350,
      stateAvgWeeklyIncome: 1530,
      householdType: {
        couplesNoKids: 47,
        familiesWithKids: 31,
        singleLiving: 22
      },
      housingTenure: {
        renting: 44,
        mortgage: 26,
        ownedOutright: 30
      },
      educationHigherEdPercent: 63,
      employedProfessionalsPercent: 64,
      topAncestries: ['English', 'Australian', 'Italian', 'Irish', 'Scottish']
    },
    amenities: {
      topSchools: [
        { name: 'Norwood Primary School', type: 'Public Primary', icsea: 1140, distance: '400m' },
        { name: 'St Ignatius Junior College', type: 'Private Primary', icsea: 1170, distance: '1.2km' },
        { name: 'Marryatville High School (Catchment proximity)', type: 'Public Secondary', icsea: 1135, distance: '1.8km' }
      ],
      transitHubs: ['The Parade GoZone Bus network (every 5-10 mins to CBD)'],
      parksAndRecreation: ['Norwood Oval (SANFL hub)', 'Richards Park', 'Adelaide Parklands (1.2km)'],
      coffeeAndDining: {
        cafesPerSqKm: 22,
        notableSpots: ['Argo On The Parade', 'Cafe Melba', 'Bath Hotel', 'Cibo Espresso Original']
      }
    },
    pocketHighlights: {
      pros: ['Walk to Adelaide East Parklands and Fringe venues', 'Historic bluestone villa streetscapes', 'High community safety'],
      cons: ['Tight supply of detached houses for sale', 'The Parade traffic during AFL Gather Round & events'],
      idealFor: ['Medical & Academic Professionals', 'Upscale Families', 'Downsizers'],
      developmentHotspots: 'The Parade apartment and cinema precinct modernizations.'
    }
  },
  {
    id: 'braddon-act',
    name: 'Braddon',
    state: 'ACT',
    postcode: '2612',
    lga: 'ACT Government',
    lat: -35.2728,
    lng: 149.1328,
    distanceToCbdKm: 0.8,
    badge: 'Canberras Cool Quarter',
    heroImage: 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1200&q=80',
    summary: 'Transformed from an industrial automotive strip into Canberras buzzing hipster and gastronomic heartland. Lonsdale Street hosts independent fashion labels, specialty coffee, and craft microbreweries, all steps from the Light Rail.',
    propertyMetrics: {
      medianHousePrice: 1510000,
      medianUnitPrice: 545000,
      growth12mPercent: 3.8,
      houseRentalYield: 4.1,
      unitRentalYield: 6.3,
      medianWeeklyRentHouse: 880,
      medianWeeklyRentUnit: 580,
      daysOnMarket: 27,
      clearanceRatePercent: 68
    },
    lifestyleScores: {
      vibeCulture: 94,
      familyLiving: 66,
      tranquility: 62,
      transitWalk: 95,
      affluenceEconomic: 92,
      safetyCommunity: 86,
      overallScore: 86
    },
    demographics: {
      population: 6800,
      medianAge: 30,
      weeklyHouseholdIncome: 2950,
      stateAvgWeeklyIncome: 2370,
      householdType: {
        singleLiving: 44,
        couplesNoKids: 44,
        familiesWithKids: 12
      },
      housingTenure: {
        renting: 66,
        mortgage: 21,
        ownedOutright: 13
      },
      educationHigherEdPercent: 74,
      employedProfessionalsPercent: 72,
      topAncestries: ['Australian', 'English', 'Irish', 'Chinese', 'Scottish']
    },
    amenities: {
      topSchools: [
        { name: 'Ainslie School', type: 'Public Primary', icsea: 1145, distance: '850m' },
        { name: 'Merici College', type: 'Private Secondary', icsea: 1115, distance: '1.1km' }
      ],
      transitHubs: ['Canberra Metro Light Rail (Elouera St Stop & Alinga St)', 'City Bus Interchange (600m)'],
      parksAndRecreation: ['Haig Park (historic pine forest & markets)', 'Mount Ainslie Nature Reserve (nearby)', 'Glebe Park'],
      coffeeAndDining: {
        cafesPerSqKm: 38,
        notableSpots: ['Lonsdale Street Roasters', 'BentSpoke Brewing Co', 'Rye Cafe', 'Eightysix']
      }
    },
    pocketHighlights: {
      pros: ['Walk to Canberra Civic and ANU campus', 'Highest public servant income profile', 'Outstanding unit rental yields for investors'],
      cons: ['Weekend night street activity along Lonsdale St', 'Limited stand-alone house stock'],
      idealFor: ['Diplomatic & Public Sector Professionals', 'Tech Contractors', 'High-yield Property Investors'],
      developmentHotspots: 'Haig Park community activated masterplan.'
    }
  },
  {
    id: 'parramatta-nsw',
    name: 'Parramatta',
    state: 'NSW',
    postcode: '2150',
    lga: 'City of Parramatta',
    lat: -33.8150,
    lng: 151.0011,
    distanceToCbdKm: 23.5,
    badge: 'Sydney’s Dual Epicentre',
    heroImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    summary: 'The bustling geographic heart of Greater Sydney and premier commercial hub. Driven by the brand new Parramatta Light Rail, Sydney Metro West construction, riverside restaurant precinct, and multinational corporate headquarters.',
    propertyMetrics: {
      medianHousePrice: 1540000,
      medianUnitPrice: 620000,
      growth12mPercent: 7.9,
      houseRentalYield: 3.2,
      unitRentalYield: 5.6,
      medianWeeklyRentHouse: 780,
      medianWeeklyRentUnit: 610,
      daysOnMarket: 29,
      clearanceRatePercent: 71
    },
    lifestyleScores: {
      vibeCulture: 88,
      familyLiving: 83,
      tranquility: 63,
      transitWalk: 96,
      affluenceEconomic: 82,
      safetyCommunity: 78,
      overallScore: 84
    },
    demographics: {
      population: 31500,
      medianAge: 32,
      weeklyHouseholdIncome: 2180,
      stateAvgWeeklyIncome: 1829,
      householdType: {
        couplesNoKids: 41,
        familiesWithKids: 39,
        singleLiving: 20
      },
      housingTenure: {
        renting: 65,
        mortgage: 21,
        ownedOutright: 14
      },
      educationHigherEdPercent: 65,
      employedProfessionalsPercent: 59,
      topAncestries: ['Indian', 'Chinese', 'Australian', 'English', 'Lebanese']
    },
    amenities: {
      topSchools: [
        { name: 'Macarthur Girls High School', type: 'Public Secondary', icsea: 1098, distance: '850m' },
        { name: 'Parramatta High School', type: 'Public Partially Selective', icsea: 1115, distance: '900m' },
        { name: 'The Kings School', type: 'Private Secondary (Nearby)', icsea: 1175, distance: '3.5km' }
      ],
      transitHubs: ['Parramatta Railway & Metro Interchange', 'Parramatta Light Rail', 'Parramatta River Cat Ferry'],
      parksAndRecreation: ['Parramatta Park (UNESCO World Heritage)', 'CommBank Stadium', 'Parramatta Aquatic Centre'],
      coffeeAndDining: {
        cafesPerSqKm: 29,
        notableSpots: ['Circa Espresso', 'Eat Street (Church St)', 'Lillies Waterfront', 'Riverside Theatres']
      }
    },
    pocketHighlights: {
      pros: ['Sydney Metro West 20-minute CBD connection underway', 'Exceptional multicultural gastronomy', 'High rental demand from corporate workforce'],
      cons: ['Substantial apartment supply pipeline', 'Traffic density along Victoria Road & Great Western Hwy'],
      idealFor: ['First Home Buyers', 'Young Families', 'Commuters working in Western Sydney or Barangaroo'],
      developmentHotspots: 'Parramatta Square and Civic Link transformation.'
    }
  }
];

// City filters and quick presets
export const METRO_REGIONS = [
  { id: 'all', label: 'All Australia', count: AUSTRALIAN_SUBURBS.length },
  { id: 'NSW', label: 'Sydney & NSW', count: AUSTRALIAN_SUBURBS.filter(s => s.state === 'NSW').length },
  { id: 'VIC', label: 'Melbourne & VIC', count: AUSTRALIAN_SUBURBS.filter(s => s.state === 'VIC').length },
  { id: 'QLD', label: 'Brisbane & QLD', count: AUSTRALIAN_SUBURBS.filter(s => s.state === 'QLD').length },
  { id: 'WA', label: 'Perth & WA', count: AUSTRALIAN_SUBURBS.filter(s => s.state === 'WA').length },
  { id: 'SA', label: 'Adelaide & SA', count: AUSTRALIAN_SUBURBS.filter(s => s.state === 'SA').length },
  { id: 'ACT', label: 'Canberra & ACT', count: AUSTRALIAN_SUBURBS.filter(s => s.state === 'ACT').length }
];

// Score categories description for tooltips and cards
export const SCORE_METRICS_INFO = {
  vibeCulture: {
    label: 'Vibe & Culture',
    description: 'Cafe density, boutique dining, nightlife, arts, and creative street energy.',
    color: '#8B5CF6',
    icon: 'Sparkles'
  },
  familyLiving: {
    label: 'Family Living',
    description: 'ICSEA school performance, playgrounds, childcare availability, and community events.',
    color: '#10B981',
    icon: 'Users'
  },
  tranquility: {
    label: 'Greenery & Peace',
    description: 'Tree canopy cover, low arterial noise, open parklands, and relaxed pace.',
    color: '#059669',
    icon: 'Trees'
  },
  transitWalk: {
    label: 'Transit & Walkability',
    description: 'Walk Score, train/ferry/tram frequency, cycleways, and CBD commute efficiency.',
    color: '#3B82F6',
    icon: 'Train'
  },
  affluenceEconomic: {
    label: 'Affluence & Wealth',
    description: 'Household income bracket, professional employment ratio, and investment strength.',
    color: '#F59E0B',
    icon: 'Briefcase'
  },
  safetyCommunity: {
    label: 'Safety & Cohesion',
    description: 'Low crime incidence index, community satisfaction, and neighborhood security.',
    color: '#06B6D4',
    icon: 'ShieldCheck'
  }
};
