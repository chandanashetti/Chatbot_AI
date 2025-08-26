import { 
  Ticket, 
  TicketAgent, 
  TicketPriority, 
  TicketTier, 
  Platform,
  KnowledgeBaseEntry,
  TicketEscalation 
} from '../pages/admin/TicketManagement';

// Chat session interface for ticket creation
export interface ChatSession {
  id: string;
  userId: string;
  userName: string;
  platform: Platform;
  startTime: Date;
  endTime: Date;
  messages: ChatMessage[];
  handoffOccurred: boolean;
  satisfaction: 'positive' | 'negative' | 'neutral';
  tags: string[];
}

export interface ChatMessage {
  id: string;
  timestamp: Date;
  content: string;
  sender: 'bot' | 'user' | 'agent';
  confidence?: number;
}

// AI Knowledge Base Service
class AIKnowledgeBaseService {
  private knowledgeBase: KnowledgeBaseEntry[] = [
    {
      id: 'kb1',
      title: 'Billing Double Charge Resolution',
      content: 'To resolve double billing: 1) Check payment history, 2) Verify subscription status, 3) Process refund if confirmed, 4) Update billing settings',
      tags: ['billing', 'refund', 'payment'],
      confidence: 0.92,
      usage_count: 156
    },
    {
      id: 'kb2',
      title: 'Discord Bot Setup Guide',
      content: 'Discord bot setup: 1) Create bot role with proper permissions, 2) Invite bot to server, 3) Configure slash commands, 4) Test functionality',
      tags: ['discord', 'bot-setup', 'permissions', 'integration'],
      confidence: 0.87,
      usage_count: 89
    },
    {
      id: 'kb3',
      title: 'Security Incident Response Protocol',
      content: 'Security incident response: 1) Immediately reset passwords, 2) Enable 2FA, 3) Review access logs, 4) Monitor for suspicious activity',
      tags: ['security', 'incident-response', 'urgent', 'breach'],
      confidence: 0.95,
      usage_count: 23
    },
    {
      id: 'kb4',
      title: 'API Integration Troubleshooting',
      content: 'API issues: 1) Check API keys and permissions, 2) Verify endpoint URLs, 3) Review rate limits, 4) Test with sandbox environment',
      tags: ['api', 'integration', 'troubleshooting', 'developer'],
      confidence: 0.89,
      usage_count: 134
    },
    {
      id: 'kb5',
      title: 'Account Recovery Process',
      content: 'Account recovery: 1) Verify identity, 2) Check security questions, 3) Send recovery email, 4) Guide through password reset',
      tags: ['account', 'recovery', 'password', 'security'],
      confidence: 0.91,
      usage_count: 78
    }
  ];

  async findSuggestions(description: string, tags: string[]): Promise<KnowledgeBaseEntry[]> {
    // Simple keyword matching algorithm (in real implementation, this would use ML/NLP)
    const keywords = [...description.toLowerCase().split(' '), ...tags];
    
    const suggestions = this.knowledgeBase
      .map(entry => {
        const matchScore = this.calculateMatchScore(keywords, entry);
        return { ...entry, confidence: matchScore };
      })
      .filter(entry => entry.confidence > 0.5)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    return suggestions;
  }

  private calculateMatchScore(keywords: string[], entry: KnowledgeBaseEntry): number {
    const entryText = `${entry.title} ${entry.content} ${entry.tags.join(' ')}`.toLowerCase();
    const matches = keywords.filter(keyword => 
      keyword.length > 2 && entryText.includes(keyword)
    );
    
    return Math.min(matches.length / keywords.length, 1);
  }
}

// Ticket Assignment Service
class TicketAssignmentService {
  private agents: TicketAgent[] = [
    {
      id: 'agent1',
      name: 'Sarah Johnson',
      email: 'sarah@company.com',
      tier: 'tier1',
      status: 'online',
      currentTickets: 8,
      maxTickets: 15,
      specialties: ['billing', 'account-setup', 'basic-support']
    },
    {
      id: 'agent2',
      name: 'Mike Chen',
      email: 'mike@company.com',
      tier: 'tier2',
      status: 'online',
      currentTickets: 5,
      maxTickets: 10,
      specialties: ['technical-integration', 'api-support', 'troubleshooting']
    },
    {
      id: 'agent3',
      name: 'Lisa Rodriguez',
      email: 'lisa@company.com',
      tier: 'tier3',
      status: 'busy',
      currentTickets: 3,
      maxTickets: 5,
      specialties: ['enterprise-support', 'security', 'escalations']
    }
  ];

  findBestAgent(tier: TicketTier, tags: string[]): TicketAgent | null {
    const availableAgents = this.agents.filter(agent => 
      agent.tier === tier && 
      agent.status !== 'offline' && 
      agent.currentTickets < agent.maxTickets
    );

    if (availableAgents.length === 0) return null;

    // Find agent with matching specialties
    const specialistAgent = availableAgents.find(agent =>
      agent.specialties.some(specialty => 
        tags.some(tag => tag.includes(specialty) || specialty.includes(tag))
      )
    );

    if (specialistAgent) return specialistAgent;

    // Return agent with lowest current ticket count
    return availableAgents.reduce((best, current) => 
      current.currentTickets < best.currentTickets ? current : best
    );
  }
}

// Main Ticket Service
export class TicketService {
  private aiService = new AIKnowledgeBaseService();
  private assignmentService = new TicketAssignmentService();

  async createTicketFromChat(chatSession: ChatSession): Promise<Ticket> {
    // Determine ticket priority based on chat characteristics
    const priority = this.determinePriority(chatSession);
    
    // Determine initial tier based on complexity and tags
    const tier = this.determineInitialTier(chatSession);
    
    // Generate ticket description from chat messages
    const description = this.generateDescription(chatSession);
    
    // Get AI suggestions
    const aiSuggestions = await this.aiService.findSuggestions(description, chatSession.tags);
    
    // Calculate AI confidence (average of suggestions)
    const aiConfidence = aiSuggestions.length > 0 
      ? aiSuggestions.reduce((sum, s) => sum + s.confidence, 0) / aiSuggestions.length 
      : 0;

    // Try to assign to appropriate agent
    const assignedAgent = this.assignmentService.findBestAgent(tier, chatSession.tags) || undefined;

    // Calculate SLA deadline based on priority
    const slaDeadline = this.calculateSLADeadline(priority);

    const ticket: Ticket = {
      id: this.generateTicketId(),
      title: this.generateTitle(chatSession),
      description,
      status: 'open',
      priority,
      tier,
      source: 'chat',
      platform: chatSession.platform,
      customerId: chatSession.userId,
      customerName: chatSession.userName,
      assignedTo: assignedAgent?.id,
      assignedAgent,
      createdAt: new Date(),
      updatedAt: new Date(),
      aiSuggestions,
      aiConfidence,
      aiAttempted: aiSuggestions.length > 0,
      escalations: [],
      chatSessionId: chatSession.id,
      tags: chatSession.tags,
      attachments: [],
      slaDeadline,
      responseTime: undefined
    };

    return ticket;
  }

  async escalateTicket(
    ticket: Ticket, 
    reason: string, 
    escalatedBy: string, 
    notes?: string
  ): Promise<Ticket> {
    const currentTier = ticket.tier;
    let newTier: TicketTier;

    // Determine escalation path
    switch (currentTier) {
      case 'tier1':
        newTier = 'tier2';
        break;
      case 'tier2':
        newTier = 'tier3';
        break;
      case 'tier3':
        newTier = 'escalated';
        break;
      default:
        newTier = 'escalated';
    }

    // Create escalation record
    const escalation: TicketEscalation = {
      id: this.generateEscalationId(),
      timestamp: new Date(),
      fromTier: currentTier,
      toTier: newTier,
      reason,
      escalatedBy,
      notes
    };

    // Try to find new agent for escalated tier
    const newAgent = this.assignmentService.findBestAgent(newTier, ticket.tags) || undefined;

    // Update ticket
    const escalatedTicket: Ticket = {
      ...ticket,
      tier: newTier,
      assignedTo: newAgent?.id,
      assignedAgent: newAgent,
      updatedAt: new Date(),
      escalations: [...ticket.escalations, escalation],
      // Adjust SLA for escalated priority
      slaDeadline: this.calculateSLADeadline(
        this.increasePriority(ticket.priority)
      )
    };

    return escalatedTicket;
  }

  shouldEscalate(ticket: Ticket, chatSession?: ChatSession): boolean {
    // Escalation triggers
    const escalationReasons = [];

    // Time-based escalation
    const timeSinceCreated = Date.now() - ticket.createdAt.getTime();
    const maxTimeByTier = {
      tier1: 2 * 60 * 60 * 1000, // 2 hours
      tier2: 4 * 60 * 60 * 1000, // 4 hours
      tier3: 8 * 60 * 60 * 1000, // 8 hours
      escalated: Infinity
    };

    if (timeSinceCreated > maxTimeByTier[ticket.tier]) {
      escalationReasons.push('Time limit exceeded');
    }

    // AI confidence-based escalation
    if (ticket.aiConfidence < 0.6 && ticket.tier === 'tier1') {
      escalationReasons.push('Low AI confidence');
    }

    // Tag-based escalation
    const criticalTags = ['security', 'breach', 'enterprise', 'critical'];
    if (ticket.tags.some(tag => criticalTags.includes(tag)) && ticket.tier === 'tier1') {
      escalationReasons.push('Critical issue detected');
    }

    // Customer satisfaction-based escalation
    if (chatSession?.satisfaction === 'negative' && ticket.tier === 'tier1') {
      escalationReasons.push('Customer dissatisfaction');
    }

    return escalationReasons.length > 0;
  }

  private determinePriority(chatSession: ChatSession): TicketPriority {
    // Priority based on tags and characteristics
    const criticalTags = ['security', 'breach', 'critical', 'urgent'];
    const highTags = ['billing', 'payment', 'api', 'integration'];
    
    if (chatSession.tags.some(tag => criticalTags.includes(tag))) {
      return 'critical';
    }
    
    if (chatSession.handoffOccurred || chatSession.satisfaction === 'negative') {
      return 'high';
    }
    
    if (chatSession.tags.some(tag => highTags.includes(tag))) {
      return 'medium';
    }
    
    return 'low';
  }

  private determineInitialTier(chatSession: ChatSession): TicketTier {
    // Advanced issues go directly to higher tiers
    const tier2Tags = ['api', 'integration', 'technical', 'developer'];
    const tier3Tags = ['security', 'enterprise', 'breach', 'critical'];
    
    if (chatSession.tags.some(tag => tier3Tags.includes(tag))) {
      return 'tier3';
    }
    
    if (chatSession.tags.some(tag => tier2Tags.includes(tag))) {
      return 'tier2';
    }
    
    return 'tier1';
  }

  private generateDescription(chatSession: ChatSession): string {
    const userMessages = chatSession.messages
      .filter(m => m.sender === 'user')
      .map(m => m.content)
      .join(' ');
    
    return userMessages.length > 200 
      ? userMessages.substring(0, 200) + '...'
      : userMessages;
  }

  private generateTitle(chatSession: ChatSession): string {
    const firstUserMessage = chatSession.messages.find(m => m.sender === 'user');
    const title = firstUserMessage?.content || 'Support Request';
    
    return title.length > 80 
      ? title.substring(0, 80) + '...'
      : title;
  }

  private calculateSLADeadline(priority: TicketPriority): Date {
    const now = new Date();
    const hoursToAdd = {
      critical: 2,
      high: 4,
      medium: 24,
      low: 48
    };
    
    return new Date(now.getTime() + hoursToAdd[priority] * 60 * 60 * 1000);
  }

  private increasePriority(priority: TicketPriority): TicketPriority {
    const priorities: TicketPriority[] = ['low', 'medium', 'high', 'critical'];
    const currentIndex = priorities.indexOf(priority);
    return priorities[Math.min(currentIndex + 1, priorities.length - 1)];
  }

  private generateTicketId(): string {
    return `TKT-${Date.now().toString().slice(-6)}`;
  }

  private generateEscalationId(): string {
    return `ESC-${Date.now().toString().slice(-6)}`;
  }
}
