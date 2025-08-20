import { Link } from 'react-router-dom'
import { MessageSquare, Bot, Zap, Shield, BarChart3, Settings, Star, ArrowRight, Sparkles, Globe, Users, Clock } from 'lucide-react'
import { useTheme } from '../components/providers/ThemeProvider'

const LandingPage = () => {
  const { isDark, toggleTheme } = useTheme()

  const features = [
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: 'Multi-Channel Support',
      description: 'Connect with customers across WhatsApp, Instagram, and web chat seamlessly.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <Bot className="w-8 h-8" />,
      title: 'AI-Powered Intelligence',
      description: 'Advanced AI models provide intelligent, contextual responses to customer queries.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: 'Lightning Fast',
      description: 'Instant message processing with WebSocket technology for live conversations.',
      gradient: 'from-yellow-500 to-orange-500'
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'Enterprise Security',
      description: 'Bank-grade security with encrypted communications and data protection.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: <BarChart3 className="w-8 h-8" />,
      title: 'Smart Analytics',
      description: 'Comprehensive insights into conversation patterns and customer satisfaction.',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: <Settings className="w-8 h-8" />,
      title: 'Easy Setup',
      description: 'Simple configuration and customization options for your business needs.',
      gradient: 'from-teal-500 to-blue-500'
    }
  ]

  const stats = [
    { icon: <Users className="w-6 h-6" />, value: '50K+', label: 'Happy Customers' },
    { icon: <MessageSquare className="w-6 h-6" />, value: '1M+', label: 'Messages Processed' },
    { icon: <Clock className="w-6 h-6" />, value: '24/7', label: 'Uptime Guarantee' },
    { icon: <Globe className="w-6 h-6" />, value: '150+', label: 'Countries Served' }
  ]

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'CEO, TechCorp',
      content: 'This AI chatbot transformed our customer service. Response times dropped by 80% and satisfaction increased dramatically.',
      rating: 5,
      avatar: '👩‍💼'
    },
    {
      name: 'Mike Chen',
      role: 'CTO, StartupXYZ',
      content: 'The multi-channel support is incredible. Our customers love the seamless experience across all platforms.',
      rating: 5,
      avatar: '👨‍💻'
    },
    {
      name: 'Emily Davis',
      role: 'Support Manager, BigCorp',
      content: 'Implementation was smooth and the analytics help us continuously improve our customer interactions.',
      rating: 5,
      avatar: '👩‍🎯'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-primary-400/20 to-accent-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-accent-400/20 to-primary-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-primary-300/10 to-accent-300/10 rounded-full blur-3xl animate-pulse-slow"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 nav-glass">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3 animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl blur-lg opacity-50 animate-glow"></div>
                <div className="relative bg-gradient-to-r from-primary-600 to-accent-600 p-2 rounded-2xl">
                  <Bot className="w-8 h-8 text-white" />
                </div>
              </div>
              <span className="text-2xl font-bold text-gradient">
                ChatBot AI
              </span>
            </div>
            
            <div className="flex items-center space-x-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <button
                onClick={toggleTheme}
                className="btn-ghost p-3 rounded-2xl"
                aria-label="Toggle theme"
              >
                {isDark ? '🌞' : '🌙'}
              </button>
              
              <Link to="/chat" className="btn-secondary">
                Try Demo
              </Link>
              
              <Link to="/login" className="btn-primary">
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="animate-fade-in-up">
            <div className="inline-flex items-center space-x-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-primary-200/50 dark:border-primary-800/50 mb-8">
              <Sparkles className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                Powered by Advanced AI
              </span>
            </div>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-bold mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <span className="text-gradient-secondary">Transform Your</span>
            <br />
            <span className="text-gradient">Customer Experience</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Deliver exceptional customer support with intelligent AI chatbots that work across multiple channels. 
            Provide instant, accurate responses 24/7 while maintaining the human touch your customers expect.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link to="/chat" className="btn-primary text-lg px-8 py-4 group">
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link to="/login" className="btn-secondary text-lg px-8 py-4">
              Watch Demo
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {stats.map((stat, index) => (
              <div key={index} className="card p-6 hover-lift">
                <div className="text-primary-600 dark:text-primary-400 mb-3 flex justify-center">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 animate-fade-in-up">
            <div className="inline-flex items-center space-x-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-accent-200/50 dark:border-accent-800/50 mb-6">
              <Star className="w-4 h-4 text-accent-600" />
              <span className="text-sm font-medium text-accent-600 dark:text-accent-400">
                Powerful Features
              </span>
            </div>
            <h2 className="text-4xl sm:text-6xl font-bold mb-6">
              <span className="text-gradient">Everything You Need</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Our comprehensive platform provides all the tools you need to deliver exceptional customer support
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="card-gradient p-8 hover-lift animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={`inline-flex p-4 rounded-3xl bg-gradient-to-r ${feature.gradient} text-white mb-6 shadow-lg`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                  {feature.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20 animate-fade-in-up">
            <h2 className="text-4xl sm:text-6xl font-bold mb-6">
              <span className="text-gradient">Loved by Thousands</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              See what our customers are saying about their experience with our AI chatbot platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="card p-8 hover-lift animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center">
                  <div className="text-3xl mr-4">{testimonial.avatar}</div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {testimonial.role}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="card-glow p-16 animate-fade-in-up">
            <h2 className="text-4xl sm:text-6xl font-bold mb-6">
              <span className="text-gradient">Ready to Get Started?</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-12 max-w-3xl mx-auto">
              Join thousands of businesses already transforming their customer experience with our AI chatbot platform
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link to="/chat" className="btn-primary text-lg px-8 py-4 group">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link to="/login" className="btn-secondary text-lg px-8 py-4">
                Schedule Demo
              </Link>
            </div>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-8">
              No credit card required • 14-day free trial • Setup in minutes
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-8 md:mb-0">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-600 rounded-2xl blur-lg opacity-50"></div>
                <div className="relative bg-gradient-to-r from-primary-600 to-accent-600 p-2 rounded-2xl">
                  <Bot className="w-6 h-6 text-white" />
                </div>
              </div>
              <span className="text-xl font-bold text-gradient">ChatBot AI</span>
            </div>
            
            <div className="flex items-center space-x-8">
              <Link to="/chat" className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Demo
              </Link>
              <Link to="/login" className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                Login
              </Link>
              <button
                onClick={toggleTheme}
                className="text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                {isDark ? '🌞' : '🌙'}
              </button>
            </div>
          </div>
          
          <div className="border-t border-slate-200/50 dark:border-slate-800/50 mt-12 pt-8 text-center">
            <p className="text-slate-500 dark:text-slate-400">
              © 2024 ChatBot AI Platform. All rights reserved. Built with ❤️ for amazing customer experiences.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage