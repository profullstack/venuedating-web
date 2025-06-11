# Enhanced Venue Generation Scripts

This document describes the enhanced venue generation capabilities for the BarCrush platform, including international support and multi-page API fetching.

## 🚀 Quick Start - Process ALL Countries & Cities

**To process all 4,000+ cities across all 20 countries with 3 pages each:**

```bash
node bin/generate-venues-international.js
```

That's it! No flags needed - it defaults to processing everything. This will:
- ✅ Process all 20 countries (US, China, India, Brazil, Japan, UK, Germany, Russia, Mexico, etc.)
- ✅ Process all ~200 cities per country (4,000+ total cities)
- ✅ Fetch 3 pages per city (up to 60 venues per city)
- ✅ Use Google geographical location queries for precision
- ✅ Save up to ~240,000 venues to your database

**Estimated time:** ~100 hours (with 1.5s delays between API calls)

### 🎯 Process Only Completed Countries (Recommended)

**To process only the 6 countries with enhanced location data:**

```bash
node bin/generate-venues-international.js --completed-only
```

This processes only: US, China, India, Brazil, Japan, UK (~1,200 cities, ~72,000 venues)

## Scripts Overview

### 1. `bin/generate-venues.js` (Updated)
- **Purpose**: Enhanced US-only venue generation with multi-page support
- **Features**: 
  - Uses Google geographical location queries from enhanced city data
  - Fetches up to 3 pages per city (60 venues total per city)
  - Backward compatible with existing US cities data
  - Improved error handling and logging

### 2. `bin/generate-venues-international.js` (New)
- **Purpose**: Full international venue generation across 6 countries
- **Features**:
  - Supports all 6 countries: US, China, India, Brazil, Japan, UK
  - Country-specific API configurations (language, domain, search terms)
  - Multi-page support (up to 3 pages per city)
  - Enhanced location queries for precise geographical targeting
  - Comprehensive statistics and error reporting

## Key Enhancements

### 🌍 International Support
- **6 Countries**: United States, China, India, Brazil, Japan, United Kingdom
- **1,296+ Cities**: Top 200+ cities per country with Google location queries
- **Localized Search**: Country-specific search terms and API settings

### 📄 Multi-Page API Fetching
- **3 Pages per City**: Fetches pages 1, 2, and 3 from ValueSERP API
- **Up to 60 Venues**: 20 venues per page × 3 pages per city
- **Smart Pagination**: Automatically stops when no more results available
- **Page Tracking**: Each venue includes page number for analytics

### 🎯 Enhanced Location Targeting
- **Google Queries**: Uses precise "City, State, Country" format
- **Geographical Accuracy**: Leverages Google's location understanding
- **API Optimization**: Better targeting reduces irrelevant results

### 🛡️ Improved Error Handling
- **Graceful Failures**: Continues processing even if individual cities fail
- **Detailed Logging**: Comprehensive error reporting and statistics
- **API Credit Tracking**: Monitors ValueSERP API usage and remaining credits

## Usage Examples

### US-Only Generation (Enhanced)
```bash
# Process all US cities with 3 pages each
node bin/generate-venues.js

# Process first 10 cities with 2 pages each
node bin/generate-venues.js --limit 10 --pages 2

# Dry run to see what would be processed
node bin/generate-venues.js --dry-run
```

### International Generation
```bash
# 🌍 Process ALL countries and cities (default behavior)
node bin/generate-venues-international.js

# 🌍 Process ALL countries with custom settings
node bin/generate-venues-international.js --pages 3 --delay 2000

# 🇨🇳 Process specific country only
node bin/generate-venues-international.js --country china

# 🇬🇧 Process specific country with custom settings
node bin/generate-venues-international.js --country uk --pages 2 --limit 50

# 🔍 Test run without API calls (see what would be processed)
node bin/generate-venues-international.js --dry-run
```

## Country Configurations

### ✅ Completed Countries (Enhanced Location Data)
| Country | Cities | Language | Domain | Search Term | Status |
|---------|--------|----------|---------|-------------|---------|
| 🇺🇸 US | 200 | English | google.com | "night clubs" | ✅ Completed |
| 🇨🇳 China | 200 | Chinese | google.cn | "night clubs" | ✅ Completed |
| 🇮🇳 India | 200 | English | google.co.in | "night clubs" | ✅ Completed |
| 🇧🇷 Brazil | 200 | Portuguese | google.com.br | "casas noturnas" | ✅ Completed |
| 🇯🇵 Japan | 200 | Japanese | google.co.jp | "ナイトクラブ" | ✅ Completed |
| 🇬🇧 UK | 200 | English | google.co.uk | "night clubs" | ✅ Completed |

### ⏳ Pending Countries (Basic Location Data)
| Country | Cities | Language | Domain | Search Term | Status |
|---------|--------|----------|---------|-------------|---------|
| 🇮🇩 Indonesia | 200 | Indonesian | google.co.id | "klub malam" | ⏳ Pending |
| 🇵🇰 Pakistan | 200 | Urdu | google.com.pk | "night clubs" | ⏳ Pending |
| 🇳🇬 Nigeria | 200 | English | google.com.ng | "night clubs" | ⏳ Pending |
| 🇧🇩 Bangladesh | 200 | Bengali | google.com.bd | "night clubs" | ⏳ Pending |
| 🇷🇺 Russia | 200 | Russian | google.ru | "ночные клубы" | ⏳ Pending |
| 🇲🇽 Mexico | 200 | Spanish | google.com.mx | "clubes nocturnos" | ⏳ Pending |
| 🇪🇹 Ethiopia | 200 | Amharic | google.com.et | "night clubs" | ⏳ Pending |
| 🇵🇭 Philippines | 200 | English | google.com.ph | "night clubs" | ⏳ Pending |
| 🇪🇬 Egypt | 200 | Arabic | google.com.eg | "نوادي ليلية" | ⏳ Pending |
| 🇻🇳 Vietnam | 200 | Vietnamese | google.com.vn | "hộp đêm" | ⏳ Pending |
| 🇹🇷 Turkey | 200 | Turkish | google.com.tr | "gece kulüpleri" | ⏳ Pending |
| 🇮🇷 Iran | 200 | Persian | google.com | "کلوپ شبانه" | ⏳ Pending |
| 🇩🇪 Germany | 200 | German | google.de | "nachtclubs" | ⏳ Pending |
| 🇹🇭 Thailand | 200 | Thai | google.co.th | "ไนท์คลับ" | ⏳ Pending |

**Total: 20 countries, ~4,000 cities, up to ~240,000 potential venues**

## Data Structure

### Enhanced City Data Format
```json
{
  "city": "New York",
  "state": "NY", 
  "location": "New York, NY, USA"
}
```

### Database Schema
- **PostGIS Integration**: Automatic `location` column population from lat/lng
- **Spatial Queries**: Support for radius-based venue searches
- **International Fields**: Country, localized search terms, page numbers

## Performance Considerations

### API Rate Limiting
- **Default Delay**: 1.5 seconds between requests (increased from 1.0s)
- **Configurable**: Use `--delay` parameter to adjust timing
- **Credit Monitoring**: Tracks ValueSERP API usage in real-time

### Processing Scale
- **Total Potential**: 1,296 cities × 3 pages × 20 venues = ~77,760 venues
- **Estimated Time**: ~32 hours for full international processing (with 1.5s delays)
- **Recommended**: Process by country or use smaller batches

### Database Performance
- **Batch Processing**: Individual inserts with error handling per venue
- **PostGIS Optimization**: Automatic spatial indexing via database triggers
- **Duplicate Handling**: Uses `data_cid` for venue uniqueness

## Monitoring and Analytics

### Real-Time Statistics
- Cities processed vs. failed
- Total venues saved to database
- API credits consumed
- Processing time estimates

### Error Reporting
- Failed cities with specific error messages
- API response issues
- Database insertion problems
- Network connectivity issues

## Next Steps

1. **Test Run**: Start with `--dry-run` to validate configurations
2. **Single Country**: Begin with one country to test API integration
3. **Batch Processing**: Use `--limit` and `--start` for manageable chunks
4. **Monitor Credits**: Watch ValueSERP API usage during processing
5. **Database Verification**: Check venue data quality and spatial queries

## Files Modified/Created

- ✅ `bin/generate-venues.js` - Enhanced with multi-page support
- ✅ `bin/generate-venues-international.js` - New international script
- ✅ `data/*-cities-top-200.json` - Enhanced with location queries
- ✅ `data/countries-index.json` - Country processing status
- ✅ Database schema supports PostGIS spatial queries

The venue generation system is now ready for international expansion with comprehensive multi-page data collection capabilities.