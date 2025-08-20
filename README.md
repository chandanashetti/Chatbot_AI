# AI Chatbot Platform Frontend

A modern, responsive React-based frontend for an AI-powered multi-channel chatbot platform. Built with TypeScript, Tailwind CSS, and Redux Toolkit.

## 🚀 Features

### Core Functionality
- **Multi-Channel Support**: Web chat, WhatsApp, Instagram integrations
- **Real-Time Communication**: WebSocket-based live chat
- **AI-Powered Responses**: Configurable AI models (GPT-3.5, GPT-4, Claude-3, AWS Bedrock)
- **Knowledge Base Management**: Document upload and indexing
- **Advanced Analytics**: Comprehensive dashboard with charts and metrics
- **Admin Panel**: Complete management interface

### Technical Features
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Dark/Light Mode**: Theme switching with persistent preferences
- **TypeScript**: Full type safety and better development experience
- **Redux Toolkit**: Centralized state management
- **Real-Time Updates**: WebSocket integration for live chat
- **File Upload**: Drag-and-drop document management
- **Charts & Analytics**: Data visualization with Recharts

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Modern browser with ES6+ support

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chatbot-ai-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:8000/api
   VITE_WS_URL=http://localhost:8000
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components
│   └── providers/      # Context providers
├── pages/              # Page components
│   ├── admin/          # Admin panel pages
│   └── ...             # Public pages
├── services/           # API and WebSocket services
├── store/              # Redux store and slices
│   └── slices/         # Redux slices
└── types/              # TypeScript type definitions
```

## 🎯 Key Components

### Public Pages
- **Landing Page** (`/`): Marketing page with feature overview
- **Chat Interface** (`/chat`): Main chat interface for users
- **Login Page** (`/login`): Admin authentication

### Admin Panel (`/admin`)
- **Dashboard**: Overview with key metrics and recent activity
- **Integrations**: Configure WhatsApp, Instagram, and webhook connections
- **Knowledge Base**: Upload and manage documents
- **Logs**: View and filter chat message history
- **Analytics**: Charts and performance metrics
- **Settings**: Bot configuration and theme customization

## 🔧 Configuration

### Environment Variables
- `VITE_API_URL`: Backend API endpoint
- `VITE_WS_URL`: WebSocket server URL

### Features Configuration
- **AI Models**: Switch between different AI providers
- **Theme Customization**: Primary, secondary, and background colors
- **Message Templates**: Greeting and fallback messages
- **Temperature Control**: Adjust AI response creativity (0.0-1.0)

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Deploy to Netlify
1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Configure environment variables in Netlify dashboard

## 📊 API Integration

The frontend expects the following API endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Chat
- `POST /api/chat/send` - Send message
- `GET /api/chat/history/:sessionId` - Get chat history

### Integrations
- `GET /api/integrations` - List integrations
- `PUT /api/integrations/:id` - Update integration
- `POST /api/integrations/:id/test` - Test connection

### Knowledge Base
- `POST /api/knowledge-base/upload` - Upload document
- `GET /api/knowledge-base/documents` - List documents
- `DELETE /api/knowledge-base/documents/:id` - Delete document

### Analytics
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/charts` - Chart data

### Settings
- `GET /api/settings` - Get bot settings
- `PUT /api/settings` - Update settings

## 🎨 Customization

### Theme Colors
Modify colors in `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        500: '#your-primary-color',
        // ... other shades
      }
    }
  }
}
```

### Component Styling
All components use Tailwind CSS classes. Custom styles can be added in `src/index.css`.

## 🔒 Security

- JWT-based authentication
- Protected admin routes
- Input validation and sanitization
- HTTPS enforcement in production

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review the API documentation

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Voice chat integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Advanced bot training interface
- [ ] Integration marketplace
- [ ] White-label solution

---

**Built with ❤️ using React, TypeScript, and Tailwind CSS**
