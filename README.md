# Options Strategy Backtester

A web application for backtesting single-leg options trading strategies using historical market data.

## Stack Choice and Architecture

### Technology Stack
- **Frontend**: React + Vite
  - Chosen for strong community support and rich ecosystem
  - SPA architecture provides fast, responsive user experience
  - Vite enables rapid development with hot module replacement
  - Chart.js for interactive data visualizations

- **Backend**: FastAPI + Python
  - Chosen for rapid development and excellent developer experience
  - Built-in async support for handling concurrent requests
  - Automatic API documentation with OpenAPI/Swagger
  - Type hints and validation with Pydantic

### Architecture Pattern
Backend follows SOLID principles with clear separation of concerns:
- **Controllers**: Handle HTTP requests/responses and API routing
- **Services**: Contain core business logic and strategy execution
- **Repositories**: Manage data access and file I/O operations
- **Components**: Modular units for specific functionality (e.g., P&L calculation, Greeks computation)

## Current Assumptions/Limitations

- Only single-leg options strategies are currently supported
- File upload functionality is not yet implemented
- Dataset must be pre-loaded in the `/backend/data` directory
- Limited to specific options data format (CSV with predefined schema)
- No user authentication or multi-user support

## Scaling and Security Considerations

### Security Measures
- **CORS configuration**: Restricted to specific frontend origins
- **Input validation**: Pydantic models validate all API inputs
- **Rate limiting**: Should be implemented to prevent API abuse (future enhancement)
- **File size restrictions**: Will be enforced when file upload is added


### Scalability Considerations
- **Caching**: Implement Redis for frequently accessed backtest results
- **Database**: Migrate from file-based storage to PostgreSQL for better performance
- **Async processing**: Use task queues (Celery/RQ) for long-running backtests
- **Horizontal scaling**: Stateless API design allows easy deployment behind load balancer

## Future Improvements (Given More Time)

### Features
- **Multi-strategy support**: Allow users to choose and compare multiple strategies
- **Advanced visualizations**: More interactive and dynamic graphs with drill-down capabilities
- **File upload**: Secure upload capability with format validation and preview
- **Risk metrics**: Add Value at Risk (VaR), max drawdown, and Sharpe ratio
- **Export functionality**: Download backtest results as PDF/Excel reports

### Technical Enhancements
- **Real-time data**: Integration with live market data feeds
- **WebSockets**: Real-time updates during backtest execution
- **Unit testing**: Comprehensive test coverage for services and controllers
- **CI/CD pipeline**: Automated testing and deployment
- **Docker deployment**: Containerization for easy deployment and scaling
- **User management**: Authentication, authorization, and portfolio tracking

## Getting Started

### Backend
```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The API will be available at `http://localhost:8000` and the frontend at `http://localhost:5173`.

## Deployment

This application can be deployed **100% free** using:
- **Frontend**: Vercel (unlimited deployments, automatic HTTPS)
- **Backend**: Render (750 hrs/month free tier)

📖 **[View Complete Deployment Guide](DEPLOYMENT.md)** - Step-by-step instructions for deploying to production.

---

