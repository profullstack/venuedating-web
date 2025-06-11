# Venue Generation System

This system fetches nightclub data from the ValueSERP API for the top 200 most populated US cities and stores the results in a Supabase database.

## Overview

The venue generation system consists of:

1. **Database Migration**: Creates a `places` table to store venue data
2. **Cities Data**: JSON file with the top 200 US cities by population
3. **Generation Script**: Fetches venue data from ValueSERP API and saves to database

## Setup

### 1. Environment Variables

Add the following to your `.env` file:

```bash
# ValueSERP API Configuration
VALUESERP_API_KEY=your_valueserp_api_key_here

# Supabase Configuration (should already be configured)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Database Migration

First, apply the places table migration:

```bash
# Apply the migration to create the places table
node bin/apply-migration.js
```

This creates a `places` table with the following schema:

- `id` - UUID primary key
- `title` - Venue name
- `address` - Street address
- `city`, `state`, `country` - Location information
- `coordinates` - PostGIS geography point (longitude, latitude)
- `rating`, `reviews` - Rating and review count
- `category` - Venue category (e.g., "Night club")
- `phone` - Phone number
- `extensions` - Additional metadata from API
- `price`, `price_parsed`, `price_description` - Pricing information
- And more fields for comprehensive venue data

The migration also enables the PostGIS extension and creates a database function `insert_place_with_coordinates()` to handle GPS coordinate insertion properly.

## Usage

### Basic Usage

```bash
# Generate venues for all 200 cities
node bin/generate-venues.js

# Test with dry run (doesn't make API calls or save data)
node bin/generate-venues.js --dry-run

# Process only the first 10 cities
node bin/generate-venues.js --limit 10

# Start from city 50 and process 25 cities
node bin/generate-venues.js --start 50 --limit 25

# Add delay between API calls (default: 1000ms)
node bin/generate-venues.js --delay 2000
```

### Command Line Options

- `--limit <number>` - Limit the number of cities to process
- `--start <number>` - Start from a specific city index (0-based)
- `--delay <number>` - Delay between API calls in milliseconds (default: 1000)
- `--dry-run` - Show what would be done without making API calls
- `--help` - Show help message

### Examples

```bash
# Test the system with a few cities
node bin/generate-venues.js --dry-run --limit 5

# Process major cities only (first 20)
node bin/generate-venues.js --limit 20

# Resume processing from city 100
node bin/generate-venues.js --start 100

# Slow down API calls to be more conservative
node bin/generate-venues.js --delay 2000 --limit 50
```

## API Rate Limiting

The script includes built-in rate limiting:

- Default delay of 1000ms between API calls
- Configurable delay with `--delay` option
- Monitors API credits usage and remaining credits
- Handles API errors gracefully

## Data Structure

Each venue record includes:

```json
{
  "title": "Venue Name",
  "address": "123 Main St",
  "city": "New York",
  "state": "New York",
  "country": "United States",
  "coordinates": "POINT(-74.0060 40.7128)",
  "rating": 4.2,
  "reviews": 150,
  "category": "Night club",
  "phone": "+1-555-123-4567",
  "price": "$30–50",
  "extensions": ["Hours", "Reviews", "etc"],
  "search_query": "night clubs",
  "source": "valueserp"
}
```

## PostGIS Features

The system uses PostGIS for advanced geographical capabilities:

### Querying by Location

```sql
-- Find venues within 30 miles of San Francisco, ordered by distance
SELECT
  id,
  title,
  address,
  ST_AsText(coordinates) AS coords,
  ST_Distance(coordinates, ST_MakePoint(-122.4194, 37.7749)::geography) AS distance_meters
FROM
  places
WHERE
  ST_DWithin(
    coordinates,
    ST_MakePoint(-122.4194, 37.7749)::geography,
    48280 -- 30 miles in meters (1 mile ≈ 1609.34 meters)
  )
ORDER BY distance_meters ASC;

-- Find venues within 5 miles of New York City
SELECT title, address, ST_AsText(coordinates) as location
FROM places
WHERE ST_DWithin(
  coordinates,
  ST_MakePoint(-74.0060, 40.7128)::geography,
  8047  -- 5 miles in meters
);

-- Find nearest 10 venues to a point (fast with spatial index)
SELECT title, address,
       ST_Distance(coordinates, ST_MakePoint(-74.0060, 40.7128)::geography) as distance_meters
FROM places
ORDER BY coordinates <-> ST_MakePoint(-74.0060, 40.7128)::geography
LIMIT 10;

-- Get coordinates as latitude/longitude
SELECT title,
       ST_Y(coordinates::geometry) as latitude,
       ST_X(coordinates::geometry) as longitude
FROM places;

-- Common distance conversions for reference:
-- 1 mile = 1609.34 meters
-- 5 miles = 8047 meters
-- 10 miles = 16093 meters
-- 30 miles = 48280 meters
-- 50 miles = 80467 meters
```

## Database Features

- **Duplicate Prevention**: Unique constraints prevent duplicate venues
- **Upsert Operations**: Updates existing records if found
- **Indexing**: Optimized indexes for common queries
- **RLS Security**: Row-level security policies for data access

## Monitoring

The script provides detailed logging:

- Progress tracking with city counts
- API credits usage monitoring
- Success/failure statistics
- Error reporting with details

## Error Handling

The system handles various error scenarios:

- API rate limiting
- Network timeouts
- Invalid API responses
- Database connection issues
- Duplicate data conflicts

## Cities Data

The system processes the top 200 US cities by population, including:

- New York, NY
- Los Angeles, CA
- Chicago, IL
- Houston, TX
- Phoenix, AZ
- And 195 more cities...

## ValueSERP API Integration

The script uses the ValueSERP Places API with:

- Search query: "night clubs"
- 20 results per city
- US-specific settings (google.com, gl=us, hl=en)
- Automatic location formatting

## Best Practices

1. **Start Small**: Use `--dry-run` and `--limit` for testing
2. **Monitor Credits**: Watch API credit usage in the logs
3. **Rate Limiting**: Use appropriate delays to avoid hitting rate limits
4. **Resume Processing**: Use `--start` to resume from where you left off
5. **Error Recovery**: Check logs for failed cities and retry if needed

## Troubleshooting

### Common Issues

1. **Missing API Key**: Ensure `VALUESERP_API_KEY` is set in `.env`
2. **Database Connection**: Verify Supabase credentials
3. **Rate Limiting**: Increase `--delay` if hitting API limits
4. **Duplicate Errors**: Normal behavior, handled by upsert logic

### Logs to Check

- API credit usage and remaining credits
- Database save success/failure messages
- Error details for failed cities
- Final statistics summary

## Next Steps

After generating venue data, you can:

1. Query the `places` table for venue information
2. Build APIs to serve venue data
3. Create user interfaces to display venues
4. Add additional data sources or venue types
5. Implement search and filtering functionality