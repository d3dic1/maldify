# Ortto Analytics Dashboard

A local web-based analytics dashboard for visualizing Ortto marketing data.

## Features

- Real-time analytics visualization
- Monthly Open Rate tracking
- Click-Through Rate (CTR) analysis
- Conversion tracking
- App Install metrics
- Top 5 Performers section
- Custom date range selection
- CSV export functionality
- Automated weekly updates
- PDF export capability
- Email summaries

## Tech Stack

- Frontend: React + Recharts
- Backend: Node.js + Express
- Styling: Tailwind CSS
- Data Processing: Node.js

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Git

## Setup Instructions

1. Clone the repository:
```bash
git clone [repository-url]
cd ortto-analytics-dashboard
```

2. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Configure environment variables:
   - Create `.env` file in the backend directory
   - Add your Ortto API key:
   ```
   ORTTO_API_KEY=your-api-key
   ```

4. Start the development servers:
```bash
# Start backend server (from backend directory)
npm run dev

# Start frontend server (from frontend directory)
npm start
```

5. Access the dashboard:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Project Structure

```
ortto-analytics-dashboard/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   └── app.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   └── App.js
│   └── package.json
└── README.md
```

## API Endpoints

- `GET /api/metrics` - Get all metrics
- `GET /api/metrics/range` - Get metrics for custom date range
- `GET /api/top-performers` - Get top 5 performers
- `GET /api/export/csv` - Export data as CSV
- `GET /api/export/pdf` - Export data as PDF

## Scheduled Tasks

- Weekly data refresh: Every Friday at 00:00 UTC
- Email summary: Every Friday at 09:00 UTC

## License

MIT # marketingdashboard
# marketingdashboard
