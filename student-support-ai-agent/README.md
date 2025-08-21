# Concern2Care - AI-Powered Student Support System

Stronger Tools for Teachers. Smarter Support for Students.

## 🚀 Quick Deploy to Railway

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)

### One-Click Deployment

1. Click the "Deploy on Railway" button above
2. Connect your GitHub account
3. Set your `AdminDeepSeekAPIKey` environment variable
4. Deploy! 🎉

## 🛠️ Manual Railway Deployment

### Prerequisites

- Railway account ([railway.app](https://railway.app))
- DeepSeek API key ([platform.deepseek.com](https://platform.deepseek.com))

### Step-by-Step Deployment

1. **Fork this repository** to your GitHub account

2. **Create a new Railway project**:
   ```bash
   npm install -g @railway/cli
   railway login
   railway init
   ```

3. **Add PostgreSQL database**:
   ```bash
   railway add postgresql
   ```

4. **Set environment variables**:
   ```bash
   railway variables set AdminDeepSeekAPIKey=sk-baac06039caa4c7a887151e8952e34a3
   ```

5. **Deploy**:
   ```bash
   railway up
   ```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AdminDeepSeekAPIKey` | DeepSeek API key for AI features | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Auto-generated |
| `FRONTEND_URL` | Custom domain URL | Optional |

## 🏗️ Architecture

- **Backend**: Encore.ts (TypeScript REST API)
- **Frontend**: React + TypeScript + Tailwind CSS
- **Database**: PostgreSQL
- **AI**: DeepSeek API integration
- **Authentication**: Built-in session management

## 📋 Features

- ✅ AI-powered intervention recommendations
- ✅ Professional PDF report generation
- ✅ Teacher authentication system
- ✅ Admin dashboard and analytics
- ✅ Bulk teacher management
- ✅ Email sharing and collaboration
- ✅ Mobile-responsive design
- ✅ Offline support for cached data

## 🔧 Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/concern2care.git
   cd concern2care
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

4. **Start development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

## 📚 API Documentation

The API is automatically documented and available at `/api/docs` when running in development mode.

### Key Endpoints

- `POST /referrals` - Create support request
- `GET /referrals` - List support requests
- `POST /ai/recommendations` - Generate AI recommendations
- `POST /ai/follow-up-assistance` - Get implementation help
- `POST /admin/teachers/bulk-csv-upload` - Bulk upload teachers

## 🔐 Authentication

### Admin Access
- Demo password: `demo2024`
- Full system access and management

### Teacher Access
- Individual accounts created by admin
- Support request creation and management

## 🎯 Demo Features

- **Sample Data**: Create realistic demo teachers and support requests
- **AI Recommendations**: Powered by DeepSeek API
- **PDF Generation**: Professional meeting preparation documents
- **Email Sharing**: Collaborate with support teams
- **Analytics Dashboard**: Comprehensive insights and reporting

## 🚀 Production Considerations

### Security
- Environment variables for all secrets
- Session-based authentication
- Input validation and sanitization
- SQL injection protection

### Performance
- Database connection pooling
- Efficient SQL queries with indexes
- Frontend code splitting
- Image optimization

### Monitoring
- Health check endpoint at `/health`
- Error logging and tracking
- Performance metrics

## 📞 Support

For deployment issues or questions:
- Email: c2c_demo@remynd.online
- Documentation: [Encore.ts Docs](https://encore.dev/docs)
- Railway Docs: [railway.app/docs](https://railway.app/docs)

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Concern2Care** - Empowering educators with AI-powered student support tools.
