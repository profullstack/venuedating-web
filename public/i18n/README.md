# BarCrush Internationalization (i18n)

This directory contains language files for the BarCrush platform's international expansion.

## Current Language Support

### ✅ **Implemented Languages** (9 total)
| Code | Language | Country Coverage | Status |
|------|----------|------------------|---------|
| `en` | English | US, UK, India, Nigeria, Philippines, Bangladesh, Ethiopia | ✅ Complete |
| `zh` | Chinese (Simplified) | China | ✅ Complete |
| `ja` | Japanese | Japan | ✅ Complete |
| `ru` | Russian | Russia | ✅ Complete |
| `de` | German | Germany | ✅ Complete |
| `fr` | French | (Global) | ✅ Complete |
| `ar` | Arabic | Egypt | ✅ Complete |
| `uk` | Ukrainian | (Global) | ✅ Complete |
| `pl` | Polish | (Global) | ✅ Complete |

### 🔄 **Priority Languages to Add** (6 total)
Based on the 20-country venue generation system:

| Code | Language | Countries | Population | Priority |
|------|----------|-----------|------------|----------|
| `pt` | Portuguese | Brazil | 212M | 🔥 High |
| `id` | Indonesian | Indonesia | 273M | 🔥 High |
| `es` | Spanish | Mexico | 129M | 🔥 High |
| `tr` | Turkish | Turkey | 84M | 🔥 High |
| `th` | Thai | Thailand | 70M | 🔥 High |
| `vi` | Vietnamese | Vietnam | 97M | 🔥 High |

### 📊 **Coverage Analysis**

**Current Coverage:** 9 languages covering 11 countries (55% of target countries)
- ✅ US, UK, India, Nigeria, Philippines, Bangladesh, Ethiopia (English)
- ✅ China (Chinese)
- ✅ Japan (Japanese)
- ✅ Russia (Russian)
- ✅ Germany (German)
- ✅ Egypt (Arabic)

**Missing Coverage:** 6 languages for 9 countries (45% of target countries)
- ❌ Brazil (Portuguese)
- ❌ Indonesia (Indonesian)
- ❌ Mexico (Spanish)
- ❌ Turkey (Turkish)
- ❌ Thailand (Thai)
- ❌ Vietnam (Vietnamese)
- ❌ Pakistan (Urdu) - Could use English fallback
- ❌ Iran (Persian/Farsi) - Could use English fallback

## Recommendations

### 🎯 **Phase 1: Essential Languages** (Immediate Priority)
Add these 4 languages to cover the largest missing markets:
1. **Portuguese (`pt`)** - Brazil (212M people)
2. **Indonesian (`id`)** - Indonesia (273M people)
3. **Spanish (`es`)** - Mexico (129M people)
4. **Turkish (`tr`)** - Turkey (84M people)

### 🎯 **Phase 2: Additional Languages** (Secondary Priority)
5. **Thai (`th`)** - Thailand (70M people)
6. **Vietnamese (`vi`)** - Vietnam (97M people)

### 🎯 **Phase 3: Optional Languages** (Lower Priority)
7. **Urdu (`ur`)** - Pakistan (220M people) - Many speak English
8. **Persian (`fa`)** - Iran (84M people) - Political considerations

## Implementation Strategy

### **Immediate Action Items**
1. Create `pt.json` for Brazilian Portuguese
2. Create `id.json` for Indonesian
3. Create `es.json` for Mexican Spanish
4. Create `tr.json` for Turkish

### **Fallback Strategy**
- Countries without specific language files fall back to English
- Pakistan, Iran, and other English-speaking countries use `en.json`
- Regional variants (e.g., Brazilian vs European Portuguese) use same base file

### **Quality Considerations**
- Use native speakers for translations when possible
- Consider cultural context for nightlife/bar terminology
- Test with local users in each market
- Implement right-to-left (RTL) support for Arabic

## File Structure

Each language file follows this structure:
```json
{
  "app_name": "BarCrush",
  "navigation": { ... },
  "errors": { ... },
  "auth": { ... },
  "subscription": { ... },
  "common": { ... },
  "footer": { ... }
}
```

## Usage

Languages are automatically detected based on:
1. User's browser language preference
2. Geographic location (for venue searches)
3. Manual language selection in settings

## Next Steps

1. **Create missing language files** for Phase 1 languages
2. **Implement language detection** based on venue location
3. **Add language switcher** to user interface
4. **Test with native speakers** in each target market
5. **Monitor usage analytics** to prioritize future languages

---

**Total Target:** 15 languages covering 20 countries and 4+ billion people