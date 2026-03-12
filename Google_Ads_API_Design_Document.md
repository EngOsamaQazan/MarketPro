# Google Ads API - Tool Design Documentation

## Company Name
Aqssat Digital Marketing Agency

## Business Model
Our company is a digital marketing agency that manages advertising campaigns on behalf of multiple business clients across various industries. We operate an AI-powered marketing management platform called **Satwa (سطوة)** (https://app.aqssat.co) that centralizes campaign management across multiple advertising platforms including Google Ads, Meta (Facebook/Instagram), YouTube, TikTok, Snapchat, and LinkedIn.

We manage Google Ads accounts for our clients through a Google Ads Manager Account (MCC). Each client has their own dedicated Google Ads account linked under our MCC. Our clients authorize us to manage their campaigns, budgets, and ad creatives. We generate monthly performance reports and provide AI-driven optimization recommendations to maximize ROI for each client.

## Tool Access/Use
Our tool (Satwa (سطوة)) is a web-based platform accessible at https://app.aqssat.co. It will be used exclusively by our internal marketing team (employees and ad managers) to:

- **View and manage Google Ads campaigns** for multiple client accounts from a single dashboard
- **Monitor campaign performance** with real-time metrics (impressions, clicks, conversions, spend, CPA, ROAS)
- **Create and edit campaigns, ad groups, and ads** on behalf of clients
- **Manage budgets** and adjust bidding strategies based on AI recommendations
- **Generate automated monthly PDF reports** with campaign performance summaries for each client
- **Optimize ad spend** using AI-powered analysis (powered by Claude AI) that suggests budget reallocation, keyword adjustments, and audience targeting improvements

Our clients do **not** have direct access to the Google Ads API. They receive monthly PDF reports through our client portal and can approve/reject campaign changes proposed by our team. Only authorized internal employees can access the Google Ads API functionality within our tool.

Additionally, we have automated cron jobs that run daily to:
- Sync campaign performance data from the Google Ads API into our database
- Check campaign budgets and alert managers when spending exceeds thresholds
- Pause underperforming ads automatically based on predefined rules

## Tool Design

### Architecture Overview
Satwa (سطوة) is built with a modern web architecture:
- **Frontend**: Next.js 16 (React) with a responsive Arabic RTL dashboard
- **Backend**: Next.js API Routes + Supabase (PostgreSQL database)
- **AI Engine**: Claude AI (Anthropic) for campaign optimization and content generation
- **Hosting**: Vercel (https://app.aqssat.co)

### Google Ads API Integration Flow

1. **Authentication**: We use OAuth 2.0 to authenticate with Google Ads API. Each client's Google Ads account is linked to our MCC. API calls are made using our MCC credentials with the client's account ID.

2. **Data Sync (Daily Cron Job)**:
   - Our server-side cron job runs every 24 hours at 6:00 AM UTC
   - It calls the Google Ads API using `GoogleAdsService.SearchStream` to fetch campaign, ad group, and ad performance metrics
   - Data is stored in our Supabase PostgreSQL database for fast dashboard rendering
   - Metrics include: impressions, clicks, conversions, cost, CTR, CPC, CPA, ROAS

3. **Dashboard Display**:
   - The frontend pulls data from our database (not directly from the API) to display campaign performance
   - Users can filter by date range, campaign type, and client account
   - Charts and graphs are rendered using Recharts library

4. **Campaign Management**:
   - When a manager creates/edits a campaign through our UI, the changes are sent to our API route
   - Our API route validates the changes and calls the Google Ads API to apply them
   - Supported operations: create campaigns, update budgets, pause/enable campaigns, create ad groups, create/edit ads

5. **AI Optimization**:
   - Campaign performance data is sent to Claude AI for analysis
   - AI generates optimization recommendations (budget adjustments, keyword suggestions, audience targeting)
   - Managers review and approve recommendations before they are applied via the API

6. **Reporting**:
   - Monthly reports are generated as PDF documents using React-PDF
   - Reports include performance summaries, charts, and AI-generated insights
   - Reports are stored in Supabase Storage and delivered to clients via the client portal

### Data Storage & Security
- All API credentials are stored encrypted in our Supabase database
- Google Ads API tokens are stored server-side only and never exposed to the client browser
- Row Level Security (RLS) is enabled on all database tables
- Authentication is handled via Supabase Auth with email/password

## API Services Called

We will use the following Google Ads API services:

* **CustomerService** - List and manage client accounts under our MCC hierarchy
* **CampaignService** - Create, read, update, and pause campaigns for client accounts
* **CampaignBudgetService** - Set and adjust campaign budgets
* **AdGroupService** - Create and manage ad groups within campaigns
* **AdGroupAdService** - Create, edit, and manage ads within ad groups
* **GoogleAdsService (SearchStream)** - Query campaign performance metrics and reporting data using GAQL (Google Ads Query Language)
* **KeywordPlanService** - Research and plan keywords for search campaigns
* **GeoTargetConstantService** - Set geographic targeting for campaigns

### Sample GAQL Queries

**Fetching campaign performance:**
```
SELECT campaign.id, campaign.name, campaign.status,
       metrics.impressions, metrics.clicks, metrics.conversions,
       metrics.cost_micros, metrics.ctr, metrics.average_cpc
FROM campaign
WHERE segments.date DURING LAST_30_DAYS
ORDER BY metrics.cost_micros DESC
```

**Fetching ad group performance:**
```
SELECT ad_group.id, ad_group.name, ad_group.status,
       campaign.name, metrics.impressions, metrics.clicks,
       metrics.conversions, metrics.cost_micros
FROM ad_group
WHERE segments.date DURING LAST_7_DAYS
AND campaign.status = 'ENABLED'
```

## Tool Mockups

Our tool is live and accessible at: **https://app.aqssat.co**

### Dashboard Overview
The main dashboard displays:
- Total spend, impressions, clicks, and conversions across all client accounts
- Platform performance comparison (Google Ads vs Meta vs YouTube)
- Campaign status indicators (active, paused, ended)
- AI-generated optimization alerts

### Campaign Management View
- List of all campaigns with status, budget, spend, and performance metrics
- Ability to create new campaigns with guided workflow
- Edit campaign settings (budget, targeting, schedule)
- Pause/enable campaigns with one click

### Analytics & Reporting View
- Date range selector for custom reporting periods
- Performance charts (line, bar, pie) for key metrics
- Top performing campaigns and ad groups
- Export to PDF functionality for client reports

### Client Management View
- List of all managed clients with their linked Google Ads account IDs
- Per-client campaign overview and spending summary
- Client-specific AI recommendations
