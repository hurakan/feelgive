# Nonprofit Data Enrichment System

Complete system for enriching Every.org organization data with NTEE codes, location data, financial information, and ratings from authoritative sources.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
- [Admin Scripts](#admin-scripts)
- [Data Sources](#data-sources)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Overview

This system enriches nonprofit organization data using EIN (Tax ID) as the primary key to fetch data from multiple authoritative sources:

- **IRS Business Master File** (1.8M records, local MongoDB)
- **ProPublica Nonprofit Explorer** (Form 990 data, API)
- **Charity Navigator** (Ratings, API, optional)

### Key Benefits

- ✅ **Zero-Latency:** Stale-while-revalidate pattern ensures instant responses
- ✅ **Fault-Tolerant:** Circuit breakers prevent cascade failures
- ✅ **Cost-Effective:** Uses free APIs, minimal storage (~270 MB)
- ✅ **High Coverage:** 98% of organizations with EINs can be enriched
- ✅ **Production-Ready:** Comprehensive error handling and logging

---

## Features

### Core Capabilities

1. **Multi-Source Data Merging**
   - Intelligently combines data from IRS, ProPublica, and Charity Navigator
   - Tracks which source provided each field
   - Fills gaps automatically

2. **Stale-While-Revalidate**
   - Returns cached data immediately (<10ms)
   - Triggers background refresh if data is stale (>30 days)
   - Users never wait for enrichment

3. **Circuit Breaker Protection**
   - Prevents cascade failures when APIs are down
   - Automatic recovery after timeout
   - Per-service monitoring

4. **Comprehensive Error Tracking**
   - Logs errors per source
   - Continues enrichment even if one source fails
   - Detailed error messages for debugging

---

## Architecture

### Data Flow

```
User Request
    ↓
API Endpoint
    ↓
EnrichmentService
    ↓
Check Cache → Fresh? → Return immediately ⚡
    ↓
Stale? → Return cached + background refresh 🔄
    ↓
Missing? → Full enrichment:
    ├─ IRS BMF (local MongoDB) <10ms
    ├─ ProPublica API ~1-2s
    └─ Charity Navigator API ~1-2s
    ↓
Merge data with source tracking
    ↓
Save to EnrichedOrganization
    ↓
Return enriched data
```

### Database Collections

1. **`irsbmfrecords`** - IRS Business Master File data
   - 1.8M records
   - ~200 MB storage
   - Indexed by EIN, NTEE code, state, city

2. **`enrichedorganizations`** - Enriched organization data
   - Grows with usage
   - ~2 MB per 1,000 organizations
   - Indexed by EIN, slug, NTEE + location

3. **`nteecodes`** - NTEE code reference data
   - ~200 records
   - ~50 KB storage
   - Used for semantic matching

---

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (M0 free tier sufficient)
- Environment variables configured

### Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure environment variables:
```bash
# Required
MONGODB_URI=your_mongodb_connection_string

# Optional (for Charity Navigator)
CHARITY_NAVIGATOR_APP_ID=your_app_id
CHARITY_NAVIGATOR_APP_KEY=your_app_key
```

3. Import IRS BMF data (one-time, ~30-60 minutes):
```bash
npm run import-irs-bmf
```

4. Start the server:
```bash
npm run dev
```

---

## API Endpoints

### Base URL
```
http://localhost:3001/api/v1/enrichment
```

### Endpoints

#### 1. Enrich Single Organization
```http
POST /enrich
Authorization: x-admin-key: your-admin-key
Content-Type: application/json

{
  "slug": "red-cross",
  "id": "123",
  "ein": "53-0196605",
  "name": "American Red Cross",
  "description": "Humanitarian organization",
  "forceRefresh": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "ein": "530196605",
    "name": "American Red Cross",
    "classification": {
      "nteeCode": "M20",
      "majorGroup": "M",
      "description": "Public Safety, Disaster Preparedness & Relief",
      "source": "IRS_BMF"
    },
    "location": {
      "city": "Washington",
      "state": "DC",
      "source": "IRS_BMF"
    },
    "financials": {
      "revenue": 3000000000,
      "assets": 4000000000,
      "fiscalYear": 2023,
      "source": "PROPUBLICA"
    }
  },
  "sources": ["IRS_BMF", "PROPUBLICA"],
  "errors": [],
  "fromCache": false
}
```

#### 2. Batch Enrichment
```http
POST /batch
Authorization: x-admin-key: your-admin-key
Content-Type: application/json

{
  "organizations": [
    { "slug": "org1", "id": "1", "ein": "12-3456789", "name": "Org 1" },
    { "slug": "org2", "id": "2", "ein": "98-7654321", "name": "Org 2" }
  ],
  "forceRefresh": false
}
```

#### 3. Get Enriched Data
```http
GET /:slug
GET /ein/:ein
```

#### 4. Search Organizations
```http
GET /search?nteeCode=M20&state=CA&limit=20
```

#### 5. Get Statistics
```http
GET /stats
Authorization: x-admin-key: your-admin-key
```

**Response:**
```json
{
  "success": true,
  "enrichment": {
    "total": 10000,
    "complete": 8500,
    "partial": 1200,
    "failed": 300,
    "stale": 500
  },
  "irsBmf": {
    "totalRecords": 1800000,
    "lastImport": "2024-01-15T10:30:00Z"
  },
  "services": {
    "propublica": { "state": "CLOSED", "failureCount": 0 },
    "charityNavigator": { "configured": true, "state": "CLOSED" }
  }
}
```

#### 6. Reset Circuit Breakers
```http
POST /circuit-breaker/reset
Authorization: x-admin-key: your-admin-key
Content-Type: application/json

{
  "service": "ProPublica"  // or "all"
}
```

#### 7. Trigger IRS BMF Import
```http
POST /irs-bmf/import
Authorization: x-admin-key: your-admin-key
```

---

## Admin Scripts

### Import IRS BMF Data

Downloads and imports IRS Business Master File data (~1.8M records).

```bash
npm run import-irs-bmf
```

**Duration:** 30-60 minutes  
**Frequency:** Monthly (IRS updates monthly)  
**Storage:** ~200 MB

**Output:**
```
============================================================
IRS Business Master File Import
============================================================

📡 Connecting to MongoDB...
✅ Connected to MongoDB

📊 Current IRS BMF records: 0

🚀 Starting IRS BMF import...
   This will download ~1.8 million records from IRS
   Progress will be shown for each region

[IRS BMF] Processing region 1...
[IRS BMF] Region 1 complete: 450,000 records
...

============================================================
Import Complete!
============================================================
✅ Success: true
📊 Total records: 1,800,000
⏱️  Duration: 45m 30s
```

### Bulk Enrichment

Enriches multiple organizations from the database.

```bash
# Enrich up to 100 organizations
npm run bulk-enrich

# Custom limit
npm run bulk-enrich -- --limit=500

# Force refresh (ignore cache)
npm run bulk-enrich -- --force

# Only enrich stale records
npm run bulk-enrich -- --only-stale
```

**Options:**
- `--limit=N` - Number of organizations to enrich (default: 100)
- `--force` - Force refresh even if cached
- `--only-stale` - Only enrich stale/failed records

**Output:**
```
============================================================
Bulk Organization Enrichment
============================================================

Options:
  Limit: 100
  Force refresh: false
  Only stale: false

📡 Connecting to MongoDB...
✅ Connected to MongoDB

🔍 Finding organizations to enrich...
📊 Found 100 organizations to enrich

Current Statistics:
  Total: 5000
  Complete: 4200
  Partial: 600
  Failed: 200
  Stale: 150

🚀 Starting bulk enrichment...

[1/100] Enriching: American Red Cross (53-0196605)
  ✅ Success (enriched) - Sources: IRS_BMF, PROPUBLICA

[2/100] Enriching: United Way (13-1635294)
  ✅ Success (cached) - Sources: IRS_BMF
...

============================================================
Bulk Enrichment Complete!
============================================================
✅ Successful: 95
❌ Failed: 5
💾 Cache hits: 30
⏱️  Duration: 3m 45s
```

---

## Data Sources

### 1. IRS Business Master File (BMF)

**Source:** Internal Revenue Service  
**Cost:** FREE  
**Update Frequency:** Monthly  
**Coverage:** 1.8M tax-exempt organizations

**Provides:**
- NTEE codes
- Organization classification
- Headquarters address
- Basic financial data (revenue, assets)
- Tax-exempt status

**Access:** Local MongoDB collection (imported via script)

### 2. ProPublica Nonprofit Explorer

**Source:** ProPublica  
**Cost:** FREE  
**API:** https://projects.propublica.org/nonprofits/api  
**Rate Limit:** ~1 request/second (recommended)

**Provides:**
- Detailed Form 990 financial data
- Multi-year financial history
- Mission statements
- Program descriptions
- Key personnel

**Access:** REST API with circuit breaker protection

### 3. Charity Navigator

**Source:** Charity Navigator  
**Cost:** FREE (requires registration)  
**API:** https://api.charitynavigator.org/v2  
**Rate Limit:** Varies by plan

**Provides:**
- Charity ratings (0-4 stars)
- Financial health scores
- Accountability & transparency scores
- Mission statements
- Website URLs

**Access:** REST API (optional, requires APP_ID and APP_KEY)

---

## Configuration

### Environment Variables

```bash
# Required
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
ADMIN_KEY=your-admin-key-here

# Optional - Charity Navigator
CHARITY_NAVIGATOR_APP_ID=your_app_id
CHARITY_NAVIGATOR_APP_KEY=your_app_key

# Optional - Server
PORT=3001
NODE_ENV=development
```

### MongoDB Indexes

The system automatically creates indexes on:
- `irsbmfrecords`: ein, nteeCode, state, city, name (text)
- `enrichedorganizations`: ein, everyOrgSlug, nteeCode+state, enrichmentStatus
- `nteecodes`: code, majorCategory, text search

### Rate Limiting

- **Enrichment endpoints:** 30 requests/minute
- **Admin endpoints:** 100 requests/minute
- **ProPublica API:** 1 request/second (internal)
- **Charity Navigator:** 1 request/second (internal)

---

## Troubleshooting

### Circuit Breaker is OPEN

**Symptom:** API requests fail with "Circuit breaker is OPEN"

**Cause:** Too many failures from external API

**Solution:**
```bash
curl -X POST http://localhost:3001/api/v1/enrichment/circuit-breaker/reset \
  -H "x-admin-key: your-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"service": "ProPublica"}'
```

### Enrichment Returns Partial Status

**Symptom:** `enrichmentStatus: "partial"`

**Cause:** Some data sources failed or returned no data

**Check:**
1. View error logs in `metadata.errorLog`
2. Check circuit breaker status: `GET /stats`
3. Verify API credentials (Charity Navigator)

### Slow Enrichment Performance

**Symptom:** Enrichment takes >5 seconds

**Causes & Solutions:**
1. **IRS BMF not imported:** Run `npm run import-irs-bmf`
2. **API rate limiting:** Reduce batch size
3. **Network issues:** Check API connectivity
4. **MongoDB slow:** Check indexes with `db.collection.getIndexes()`

### Storage Limit Exceeded

**Symptom:** MongoDB Atlas M0 tier full (512 MB)

**Solutions:**
1. Delete old/stale enrichments
2. Upgrade to M2 tier ($9/month, 2 GB)
3. Archive historical data

---

## Performance Metrics

### Response Times

| Scenario | Time | Notes |
|----------|------|-------|
| Cached (fresh) | <10ms | Instant response |
| Cached (stale) | <10ms | Background refresh triggered |
| First enrichment | 2-4s | IRS + ProPublica + Charity Navigator |
| IRS BMF only | <100ms | Local MongoDB lookup |

### Storage

| Component | Size | Notes |
|-----------|------|-------|
| IRS BMF records | ~200 MB | 1.8M organizations |
| Enriched orgs (10K) | ~20 MB | With full data |
| Enriched orgs (100K) | ~200 MB | Projected |
| NTEE codes | ~50 KB | Reference data |

### Throughput

- **Single enrichment:** ~1 per 2-4 seconds
- **Batch enrichment:** ~20-30 per minute (with rate limiting)
- **Cached lookups:** 1000+ per second

---

## Support

For issues or questions:
1. Check this README
2. Review API documentation: http://localhost:3001/api-docs
3. Check logs for error messages
4. Review circuit breaker status

---

**Version:** 1.0.0  
**Last Updated:** February 15, 2026  
**Status:** Production Ready ✅