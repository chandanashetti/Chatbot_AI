import { Link } from 'react-router-dom'
import { MessageSquare, Bot, Zap, Shield, BarChart3, Star, ArrowRight, Sparkles, Users, Clock, CheckCircle, TrendingUp, HeadphonesIcon } from 'lucide-react'
import { useTheme } from '../components/providers/ThemeProvider'
import ParticleBackground from '../components/ParticleBackground'

const LandingPage = () => {
  const { isDark, toggleTheme } = useTheme()

  const features = [
    {
      icon: <Bot className="w-6 h-6" />,
      title: 'AI-Powered Conversations',
      description: 'Advanced AI that understands context and delivers human-like responses to boost customer satisfaction.',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Omnichannel Support',
      description: 'Seamlessly connect across WhatsApp, Instagram, Facebook, and your website with unified conversations.',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Instant Setup',
      description: 'Get your chatbot live in minutes, not hours. No coding required with our intuitive drag-and-drop builder.',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Smart Analytics',
      description: 'Track performance, understand customer behavior, and optimize conversations with detailed insights.',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Enterprise Security',
      description: 'Bank-grade encryption and compliance with GDPR, CCPA, and SOC 2 standards for complete peace of mind.',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: <HeadphonesIcon className="w-6 h-6" />,
      title: '24/7 Support',
      description: 'Never miss a customer inquiry with round-the-clock automated responses and seamless human handoffs.',
      gradient: 'from-teal-500 to-blue-500'
    }
  ]

  const stats = [
    { icon: <Users className="w-5 h-5" />, value: '10,000+', label: 'Active Users', color: 'text-blue-600' },
    { icon: <MessageSquare className="w-5 h-5" />, value: '5M+', label: 'Conversations', color: 'text-green-600' },
    { icon: <TrendingUp className="w-5 h-5" />, value: '95%', label: 'Satisfaction Rate', color: 'text-purple-600' },
    { icon: <Clock className="w-5 h-5" />, value: '<2min', label: 'Response Time', color: 'text-orange-600' }
  ]

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Head of Customer Success',
      company: 'TechFlow Inc.',
      content: 'Our response time improved by 90% and customer satisfaction scores reached an all-time high. The AI handles complex queries beautifully.',
      rating: 5,
      avatar: 'SC'
    },
    {
      name: 'Marcus Rodriguez',
      role: 'VP Operations',
      company: 'RetailMax',
      content: 'The omnichannel integration is seamless. Our customers get consistent support whether they reach us via WhatsApp, web, or social media.',
      rating: 5,
      avatar: 'MR'
    },
    {
      name: 'Emily Thompson',
      role: 'Customer Experience Director',
      company: 'FinanceFirst',
      content: 'Setup was incredibly easy, and the analytics help us continuously improve. Our team productivity increased by 60%.',
      rating: 5,
      avatar: 'ET'
    }
  ]

  const benefits = [
    'Reduce response time by up to 90%',
    'Handle 10x more customer inquiries',
    'Increase customer satisfaction scores',
    'Available 24/7 across all channels',
    'Seamless human handoff when needed',
    'Advanced AI that learns and improves'
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 relative">
      {/* Particle Background */}
      <ParticleBackground />
      
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 2 }}>
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400/10 to-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative backdrop-blur-sm bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/20 dark:border-slate-700/20" style={{ zIndex: 50 }}>
        <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SmatBot AI
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              <button
                onClick={toggleTheme}
                className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? '🌞' : '🌙'}
              </button>
              
              <Link 
                to="/chat" 
                className="text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
              >
                Demo
              </Link>
              
              <Link 
                to="/login" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2.5 rounded-lg font-medium hover:shadow-lg hover:scale-105 transition-all duration-200"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden" style={{ zIndex: 10 }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full border border-blue-200 dark:border-blue-800 mb-8 animate-fade-in-up">
                <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Let AI Boost Your Customer Engagement
                </span>
              </div>
              
              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight animate-fade-in-up animation-delay-100">
                <span className="text-slate-900 dark:text-slate-100">Build Smarter</span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  AI Chatbots
                </span>
              </h1>
              
              {/* Subheadline */}
              <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-300 mb-12 leading-relaxed animate-fade-in-up animation-delay-200">
                Create intelligent chatbots that understand your customers and deliver personalized experiences across all channels. No coding required.
              </p>
              
              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12 animate-fade-in-up animation-delay-300">
                <Link 
                  to="/chat" 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group transform hover:-translate-y-1"
                >
                  Start Building Free
                  <ArrowRight className="w-5 h-5 ml-2 inline group-hover:translate-x-1 transition-transform" />
                </Link>
                
                <Link 
                  to="/login" 
                  className="bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-8 py-4 rounded-lg font-semibold text-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 hover:scale-105 transition-all duration-300 transform hover:-translate-y-1"
                >
                  Watch Demo
                </Link>
              </div>

              {/* Benefits List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up animation-delay-400">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index} 
                    className="flex items-center space-x-3 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors duration-200"
                    style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 animate-bounce-subtle" />
                    <span className="text-sm font-medium">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Content - Hero Image */}
            <div className="relative lg:pl-8 animate-fade-in-left animation-delay-200">
              {/* Main Chat Interface Mockup */}
              <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transform hover:scale-105 transition-all duration-500">
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-white/30 rounded-full animate-pulse"></div>
                    <div className="w-3 h-3 bg-white/30 rounded-full animate-pulse animation-delay-100"></div>
                    <div className="w-3 h-3 bg-white/30 rounded-full animate-pulse animation-delay-200"></div>
                    <div className="ml-auto">
                      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="p-6 space-y-4 h-80 overflow-hidden">
                  {/* User Message */}
                  <div className="flex justify-end animate-slide-in-right">
                    <div className="bg-blue-500 text-white px-4 py-2 rounded-lg max-w-xs">
                      <p className="text-sm">Hi! I need help with my order</p>
                    </div>
                  </div>

                  {/* Bot Message */}
                  <div className="flex justify-start animate-slide-in-left animation-delay-300">
                    <div className="bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg max-w-xs">
                      <div className="flex items-center space-x-2 mb-1">
                        <Bot className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600">AI Assistant</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        I'd be happy to help you with your order! Can you please provide your order number?
                      </p>
                    </div>
                  </div>

                  {/* User Message */}
                  <div className="flex justify-end animate-slide-in-right animation-delay-600">
                    <div className="bg-blue-500 text-white px-4 py-2 rounded-lg max-w-xs">
                      <p className="text-sm">Order #12345</p>
                    </div>
                  </div>

                  {/* Bot Message with typing animation */}
                  <div className="flex justify-start animate-slide-in-left animation-delay-900">
                    <div className="bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg max-w-xs">
                      <div className="flex items-center space-x-2 mb-1">
                        <Bot className="w-4 h-4 text-blue-600" />
                        <span className="text-xs font-medium text-blue-600">AI Assistant</span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Perfect! I found your order. It's currently being processed and will ship within 24 hours. You'll receive a tracking number via email.
                      </p>
                    </div>
                  </div>

                  {/* Typing Indicator */}
                  <div className="flex justify-start animate-fade-in animation-delay-1200">
                    <div className="bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce animation-delay-100"></div>
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce animation-delay-200"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chat Input */}
                <div className="border-t border-slate-200 dark:border-slate-700 p-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-lg px-4 py-2">
                      <span className="text-slate-400 text-sm">Type your message...</span>
                    </div>
                    <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg hover:scale-110 transition-transform">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-float">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              
              <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center animate-float animation-delay-1000">
                <MessageSquare className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto mt-20">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className="text-center p-6 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 hover:bg-white/80 dark:hover:bg-slate-800/80 hover:scale-105 hover:-translate-y-2 transition-all duration-300 animate-fade-in-up"
                style={{ animationDelay: `${1.5 + index * 0.1}s` }}
              >
                <div className={`${stat.color} mb-2 flex justify-center transform hover:scale-110 transition-transform duration-200`}>
                  {stat.icon}
                </div>
                <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1 counter-animation">
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
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900/50 overflow-hidden" style={{ zIndex: 10 }}>
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-xl animate-float"></div>
          <div className="absolute top-1/2 right-10 w-32 h-32 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-xl animate-float animation-delay-1000"></div>
          <div className="absolute bottom-10 left-1/3 w-24 h-24 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-xl animate-float animation-delay-500"></div>
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <div className="inline-flex items-center space-x-2 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-full border border-purple-200 dark:border-purple-800 mb-6 animate-fade-in-up">
              <Star className="w-4 h-4 text-purple-600 animate-spin-slow" />
              <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Powerful Features
              </span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-6 text-slate-900 dark:text-slate-100 animate-fade-in-up animation-delay-100">
              Everything you need to succeed
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
              Build, deploy, and optimize AI chatbots with our comprehensive suite of tools designed for modern businesses
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:-translate-y-2 hover:scale-105 transition-all duration-300 animate-fade-in-up relative overflow-hidden"
                style={{ animationDelay: `${0.3 + index * 0.1}s` }}
              >
                {/* Gradient Overlay on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative">
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${feature.gradient} text-white mb-4 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Animated Border */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </div>
            ))}
          </div>

          {/* Additional Visual Elements */}
          <div className="mt-16 text-center animate-fade-in-up animation-delay-800">
            <div className="inline-flex items-center space-x-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm px-6 py-3 rounded-full border border-slate-200 dark:border-slate-700 shadow-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">All features included</span>
              </div>
              <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse animation-delay-300"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">No setup fees</span>
              </div>
              <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse animation-delay-600"></div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">24/7 support</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-slate-900/50 dark:to-slate-800/50" style={{ zIndex: 10 }}>
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-blue-300/10 to-purple-300/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-r from-purple-300/10 to-pink-300/10 rounded-full blur-3xl animate-float animation-delay-1000"></div>
        </div>

        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl font-bold mb-6 text-slate-900 dark:text-slate-100 animate-fade-in-up">
              Trusted by industry leaders
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto animate-fade-in-up animation-delay-100">
              Join thousands of businesses that have transformed their customer experience with our AI platform
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="group bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-6 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 hover:shadow-2xl hover:-translate-y-3 hover:scale-105 transition-all duration-300 animate-fade-in-up relative overflow-hidden"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                {/* Gradient Background on Hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative">
                  {/* Star Rating */}
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star 
                        key={i} 
                        className="w-4 h-4 text-yellow-400 fill-current transform hover:scale-125 transition-transform duration-200" 
                        style={{ animationDelay: `${0.5 + i * 0.1}s` }}
                      />
                    ))}
                  </div>
                  
                  {/* Quote */}
                  <div className="relative mb-6">
                    <div className="absolute -top-2 -left-2 text-4xl text-blue-200 dark:text-blue-800 font-serif">"</div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm pl-4 group-hover:text-slate-900 dark:group-hover:text-slate-100 transition-colors duration-200">
                      {testimonial.content}
                    </p>
                    <div className="absolute -bottom-4 -right-2 text-4xl text-blue-200 dark:text-blue-800 font-serif">"</div>
                  </div>
                  
                  {/* Author */}
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-4 transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
                        {testimonial.name}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400">
                        {testimonial.role}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-500 font-medium">
                        {testimonial.company}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Animated Border */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10"></div>
              </div>
            ))}
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 text-center animate-fade-in-up animation-delay-600">
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Trusted by companies worldwide</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {/* Mock Company Logos */}
              <div className="bg-slate-200 dark:bg-slate-700 px-6 py-3 rounded-lg">
                <span className="text-slate-600 dark:text-slate-300 font-semibold text-sm">TechFlow</span>
              </div>
              <div className="bg-slate-200 dark:bg-slate-700 px-6 py-3 rounded-lg">
                <span className="text-slate-600 dark:text-slate-300 font-semibold text-sm">RetailMax</span>
              </div>
              <div className="bg-slate-200 dark:bg-slate-700 px-6 py-3 rounded-lg">
                <span className="text-slate-600 dark:text-slate-300 font-semibold text-sm">FinanceFirst</span>
              </div>
              <div className="bg-slate-200 dark:bg-slate-700 px-6 py-3 rounded-lg">
                <span className="text-slate-600 dark:text-slate-300 font-semibold text-sm">GlobalCorp</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden" style={{ zIndex: 10 }}>
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-float"></div>
          <div className="absolute bottom-10 right-10 w-24 h-24 bg-white/10 rounded-full blur-xl animate-float animation-delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-white/5 rounded-full blur-2xl animate-pulse-slow"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative">
          <h2 className="text-3xl sm:text-5xl font-bold mb-6 text-white animate-fade-in-up">
            Ready to transform your customer experience?
          </h2>
          <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto animate-fade-in-up animation-delay-100">
            Join thousands of businesses using our AI platform to deliver exceptional customer support
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 animate-fade-in-up animation-delay-200">
            <Link 
              to="/chat" 
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 hover:scale-105 hover:-translate-y-1 transition-all duration-300 group shadow-xl"
            >
              Start Building Free
              <ArrowRight className="w-5 h-5 ml-2 inline group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link 
              to="/login" 
              className="bg-transparent text-white px-8 py-4 rounded-lg font-semibold text-lg border-2 border-white hover:bg-white hover:text-blue-600 hover:scale-105 hover:-translate-y-1 transition-all duration-300 shadow-lg"
            >
              Schedule Demo
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-blue-100 text-sm animate-fade-in-up animation-delay-300">
            <div className="flex items-center hover:text-white transition-colors duration-200">
              <CheckCircle className="w-4 h-4 mr-2 animate-pulse" />
              No credit card required
            </div>
            <div className="flex items-center hover:text-white transition-colors duration-200">
              <CheckCircle className="w-4 h-4 mr-2 animate-pulse animation-delay-200" />
              14-day free trial
            </div>
            <div className="flex items-center hover:text-white transition-colors duration-200">
              <CheckCircle className="w-4 h-4 mr-2 animate-pulse animation-delay-400" />
              Setup in minutes
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800" style={{ zIndex: 10 }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-8 md:mb-0">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-xl">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                SmatBot AI
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              <Link 
                to="/chat" 
                className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
              >
                Demo
              </Link>
              <Link 
                to="/login" 
                className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
              >
                Login
              </Link>
              <button
                onClick={toggleTheme}
                className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {isDark ? '🌞' : '🌙'}
              </button>
            </div>
          </div>
          
          <div className="border-t border-slate-200 dark:border-slate-700 mt-8 pt-8 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              © 2024 SmatBot AI. All rights reserved. Transforming customer experiences with intelligent AI.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage