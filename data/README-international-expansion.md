# International City Data Expansion

This directory contains city data for the top 20 countries by population, enabling global venue generation for the BarCrush platform.

## Overview

The international expansion includes city data files for major countries worldwide, allowing the venue generation system to fetch nightclub and entertainment venue data globally using the ValueSERP API.

## Completed Countries

### ✅ Available Data Files

1. **🇺🇸 United States** - [`us-cities-top-200.json`](us-cities-top-200.json)
   - 200 cities by population
   - Includes major metropolitan areas from all 50 states

2. **🇨🇳 China** - [`china-cities-top-200.json`](china-cities-top-200.json)
   - 200 cities across all provinces
   - Covers major urban centers and provincial capitals

3. **🇮🇳 India** - [`india-cities-top-200.json`](india-cities-top-200.json)
   - 200 cities across all states and union territories
   - Includes major metropolitan areas and state capitals

4. **🇧🇷 Brazil** - [`brazil-cities-top-200.json`](brazil-cities-top-200.json)
   - 200 cities across all states
   - Covers major urban centers from all regions

5. **🇯🇵 Japan** - [`japan-cities-top-200.json`](japan-cities-top-200.json)
   - 200 cities across all prefectures
   - Includes major metropolitan areas and regional centers

6. **🇬🇧 United Kingdom** - [`uk-cities-top-200.json`](uk-cities-top-200.json)
   - 200 cities across England, Scotland, Wales, and Northern Ireland
   - Covers major urban centers and regional capitals

## Pending Countries

The following countries are planned for future implementation:

- 🇮🇩 Indonesia
- 🇵🇰 Pakistan
- 🇳🇬 Nigeria
- 🇧🇩 Bangladesh
- 🇷🇺 Russia
- 🇲🇽 Mexico
- 🇪🇹 Ethiopia
- 🇵🇭 Philippines
- 🇪🇬 Egypt
- 🇻🇳 Vietnam
- 🇹🇷 Turkey
- 🇮🇷 Iran
- 🇩🇪 Germany
- 🇹🇭 Thailand

## Data Structure

Each country file follows the same enhanced structure with Google geographical location queries:

```json
[
  { "city": "City Name", "state": "State/Province/Region", "location": "City Name, State, Country" },
  { "city": "Another City", "state": "Another State", "location": "Another City, State, Country" }
]
```

### Key Features:
- **Consistent Format**: All files use the same `city`, `state`, and `location` structure
- **Google Location Queries**: Each city includes a `location` field optimized for ValueSERP API targeting
- **Local Administrative Divisions**: Uses appropriate regional divisions (states, provinces, prefectures, etc.)
- **Population-Based Ordering**: Cities are generally ordered by population size
- **200+ Cities Each**: Provides comprehensive coverage for each country

## Usage with Venue Generation

### Basic Usage

The venue generation system can now process international cities:

```bash
# Generate venues for all countries (requires country parameter)
node bin/generate-venues.js --country china --limit 50

# Generate venues for specific countries
node bin/generate-venues.js --country japan --start 10 --limit 25
node bin/generate-venues.js --country brazil --dry-run

# The location field will be used for precise geographical targeting
```

### Configuration

Update your venue generation script to support country selection:

```javascript
// Example: Load different country data with location targeting
const countryFiles = {
  'us': 'data/us-cities-top-200.json',
  'china': 'data/china-cities-top-200.json',
  'india': 'data/india-cities-top-200.json',
  'brazil': 'data/brazil-cities-top-200.json',
  'japan': 'data/japan-cities-top-200.json',
  'uk': 'data/uk-cities-top-200.json'
};

// Example: Using location field for API calls
const city = cities[0];
const apiParams = {
  q: 'night clubs',
  location: city.location, // e.g., "Shanghai, Shanghai, China"
  gl: countryCode,
  hl: languageCode
};
```

## API Considerations

### ValueSERP API Settings

Different countries may require different API configurations:

```javascript
// Country-specific API settings
const apiSettings = {
  'us': { gl: 'us', hl: 'en', google_domain: 'google.com' },
  'china': { gl: 'cn', hl: 'zh', google_domain: 'google.cn' },
  'india': { gl: 'in', hl: 'en', google_domain: 'google.co.in' },
  'brazil': { gl: 'br', hl: 'pt', google_domain: 'google.com.br' },
  'japan': { gl: 'jp', hl: 'ja', google_domain: 'google.co.jp' },
  'uk': { gl: 'gb', hl: 'en', google_domain: 'google.co.uk' }
};
```

### Search Query Localization

Consider localizing search queries for better results:

```javascript
const searchQueries = {
  'us': 'night clubs',
  'china': '夜总会',
  'india': 'night clubs',
  'brazil': 'casas noturnas',
  'japan': 'ナイトクラブ',
  'uk': 'night clubs'
};
```

## Database Schema Updates

The existing `places` table schema supports international data:

- `country` column defaults to 'United States' but can store any country
- `city` and `state` columns accommodate international naming conventions
- PostGIS `location` column works globally with WGS84 coordinates

## Implementation Roadmap

### Phase 1: Core Countries (Completed)
- ✅ United States
- ✅ China  
- ✅ India
- ✅ Brazil
- ✅ Japan
- ✅ United Kingdom

### Phase 2: Major Economies (Planned)
- 🔄 Germany
- 🔄 Russia
- 🔄 Mexico
- 🔄 Indonesia

### Phase 3: Regional Powers (Planned)
- 🔄 Turkey
- 🔄 Iran
- 🔄 Thailand
- 🔄 Nigeria

### Phase 4: Additional Markets (Future)
- 🔄 Pakistan
- 🔄 Bangladesh
- 🔄 Ethiopia
- 🔄 Philippines
- 🔄 Egypt
- 🔄 Vietnam

## Best Practices

### Rate Limiting
- Use appropriate delays between API calls for international requests
- Consider time zones when scheduling bulk operations
- Monitor API quotas more carefully with increased volume

### Data Quality
- Validate city names and coordinates for each country
- Handle different address formats and naming conventions
- Account for local business listing variations

### Localization
- Store venue names in local languages when available
- Handle different currency formats for pricing
- Consider local business hours and cultural factors

## Monitoring and Analytics

Track venue generation performance by country:

```sql
-- Venue count by country
SELECT country, COUNT(*) as venue_count
FROM places 
GROUP BY country 
ORDER BY venue_count DESC;

-- Success rate by country
SELECT 
  country,
  COUNT(*) as total_attempts,
  COUNT(CASE WHEN rating IS NOT NULL THEN 1 END) as successful_venues,
  ROUND(COUNT(CASE WHEN rating IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as success_rate
FROM places 
GROUP BY country;
```

## Contributing

When adding new countries:

1. Research the country's administrative divisions
2. Compile a list of 200+ major cities by population
3. Use appropriate regional names (states, provinces, etc.)
4. Test with a small subset before full generation
5. Update the countries index file
6. Document any special considerations

## Support

For issues with international data:
- Check the [`countries-index.json`](countries-index.json) for file status
- Verify API settings for the target country
- Review rate limiting and quota usage
- Test with smaller city subsets first