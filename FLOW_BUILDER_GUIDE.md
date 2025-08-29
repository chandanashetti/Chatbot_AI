# 🎯 Complete Flow Builder Guide

## 🚀 **FIXED ISSUES**

Your flow builder is now **fully functional** with these major improvements:

### ✅ **Node Connections**
- **Visual Connections**: Drag from output (right) to input (left) connection points
- **SVG Rendering**: Beautiful curved connections between nodes
- **Connection Management**: Click on connections to delete them
- **Real-time Updates**: Connections save automatically

### ✅ **Working Test Panel**
- **Real Bot Testing**: Actual backend API integration
- **Live Conversations**: Send messages and get real responses
- **Session Management**: Each test gets a unique session ID
- **Message History**: Full conversation tracking
- **Typing Indicators**: Realistic chat experience

### ✅ **Flow Validation**
- **Status Indicators**: Green = ready, Yellow = needs work
- **Real-time Errors**: Shows what needs to be fixed
- **Deployment Readiness**: Know when your bot is ready to deploy
- **Node/Connection Counting**: Track your flow complexity

### ✅ **Enhanced Node Properties**
- **All Node Types**: Message, Question, Condition, Action, Webhook, Handoff
- **Rich Configuration**: Each node type has specific properties
- **Variable Management**: Set and use variables in your flow
- **Node Information**: ID, position, connections display

## 🎨 **How to Create a Complete Flow**

### **Step 1: Create Your First Bot**
```
1. Go to /admin/bots
2. Click "Create Bot" 
3. Choose bot type (Lead Generation, Customer Support, etc.)
4. Give it a name and description
5. Click "Create"
```

### **Step 2: Design Your Flow**
```
1. Click "Edit" on your bot to open Flow Builder
2. Drag nodes from the left panel onto the canvas
3. Start with a "Message" node for welcome
4. Add "Question" nodes to collect information
5. Use "Condition" nodes for branching logic
6. Add "Action" nodes for data processing
7. Include "Handoff" for human escalation
```

### **Step 3: Connect Your Nodes**
```
1. Click the blue circle on the RIGHT of a node (output)
2. Drag to the gray circle on the LEFT of target node (input)
3. Connection appears as a curved line
4. Click on any connection line to delete it
5. Create branching paths for different user responses
```

### **Step 4: Configure Node Properties**
```
For Message Nodes:
- Title: Node name
- Content: What the bot says

For Question Nodes:
- Title: Node name  
- Content: Question text
- Options: Predefined answer choices

For Condition Nodes:
- Rules: Field, operator, value conditions
- Multiple conditions supported

For Action Nodes:
- Action Type: collect_email, collect_phone, save_lead, etc.
- Variables: Data to store/process

For Webhook Nodes:
- URL: External API endpoint
- Method: GET or POST
- Headers: Custom headers if needed

For Handoff Nodes:
- Reason: Why transferring to human
- Content: Message to user
```

### **Step 5: Test Your Flow**
```
1. Click "Test" button in top right
2. Test panel opens on the right
3. Type messages to interact with your bot
4. See real responses based on your flow
5. Check conversation follows your designed path
6. Reset conversation anytime with ↻ button
```

### **Step 6: Fix Flow Issues**
```
Watch the status indicator:
🟢 Green = Ready to deploy
🟡 Yellow = Issues to fix

Common issues:
- "Add nodes" → Drag nodes from left panel
- "Connect nodes" → Create connections between nodes  
- "Configure nodes" → Fill in content for each node
- "Add start node" → Create a welcome message
```

### **Step 7: Save and Deploy**
```
1. Click "Save" to save your flow
2. Go back to Bot Management
3. Click "Publish" on your bot
4. Generate embed code
5. Add to your website
```

## 🔧 **Node Types Explained**

### **Message Node** 📝
- **Purpose**: Send information to user
- **Use Cases**: Welcome messages, explanations, confirmations
- **Configuration**: Title, Content
- **Example**: "Welcome! I'm here to help you find the perfect product."

### **Question Node** ❓
- **Purpose**: Collect user input
- **Use Cases**: Forms, surveys, data collection
- **Configuration**: Title, Content, Options (optional)
- **Example**: "What's your email address?" or "What are you interested in?"

### **Condition Node** 🌿
- **Purpose**: Branch conversation based on logic
- **Use Cases**: Route based on user answers, qualify leads
- **Configuration**: Field, Operator, Value rules
- **Example**: If email contains "@company.com" → VIP path

### **Action Node** ⚡
- **Purpose**: Process data or trigger actions
- **Use Cases**: Validate input, save leads, set variables
- **Configuration**: Action type, variables
- **Example**: Validate email format, save to CRM

### **Webhook Node** 🔗
- **Purpose**: Call external APIs
- **Use Cases**: CRM integration, payment processing, notifications
- **Configuration**: URL, method, headers
- **Example**: Create lead in Salesforce, send Slack notification

### **Handoff Node** 👥
- **Purpose**: Transfer to human agent
- **Use Cases**: Complex issues, sales qualification, support escalation
- **Configuration**: Reason, handoff message
- **Example**: "Let me connect you with a sales specialist."

## 🎯 **Best Practices**

### **Flow Design**
- **Start Simple**: Begin with welcome → question → response
- **Test Early**: Test each node as you add it
- **Clear Paths**: Every node should have a logical next step
- **Error Handling**: Plan for unexpected inputs
- **Exit Routes**: Always provide handoff options

### **Node Configuration**
- **Clear Titles**: Use descriptive node names
- **Concise Content**: Keep messages short and clear
- **Variable Names**: Use consistent naming (email, name, company)
- **Validation**: Validate important inputs (email, phone)

### **Connection Strategy**
- **Linear Flow**: Simple straight-through conversations
- **Branching**: Different paths based on user type
- **Loops**: Allow users to correct mistakes
- **Exits**: Multiple ways to end or escalate

### **Testing Strategy**
- **Happy Path**: Test the ideal user journey
- **Edge Cases**: Try unexpected inputs
- **Multiple Paths**: Test all branches
- **Reset Often**: Start fresh conversations

## 🚀 **Deployment Checklist**

### **Before Publishing**
- [ ] Flow has welcome message
- [ ] All nodes are connected
- [ ] All nodes have content
- [ ] Test panel works correctly
- [ ] Status shows green (ready)
- [ ] Important data is collected
- [ ] Handoff points are configured

### **After Publishing**
- [ ] Generate embed code
- [ ] Test on actual website
- [ ] Monitor conversations
- [ ] Analyze analytics
- [ ] Iterate and improve

## 🎨 **Example Flow Patterns**

### **Simple Lead Generation**
```
Welcome Message → Ask Name → Ask Email → Ask Company → Save Lead → Thank You
```

### **Customer Support**
```
Welcome → Ask Issue Type → 
├─ Technical → Collect Details → Handoff to Tech
├─ Billing → Ask Account → Route to Billing
└─ General → FAQ Answers → Handoff if needed
```

### **Product Recommendation**
```
Welcome → Ask Needs → Ask Budget → 
├─ High Budget → Premium Products → Schedule Demo
├─ Medium Budget → Standard Products → Send Info
└─ Low Budget → Basic Products → Self-Service
```

## 📊 **Success Metrics**

Track these in your bot analytics:
- **Completion Rate**: Users who finish the flow
- **Drop-off Points**: Where users abandon
- **Handoff Rate**: Escalation to humans
- **Lead Quality**: Qualified vs unqualified leads
- **User Satisfaction**: Ratings and feedback

## 🔧 **Troubleshooting**

### **Test Panel Not Working**
- Check if bot is saved
- Verify nodes have content
- Check browser console for errors
- Try refreshing the page

### **Connections Not Appearing**
- Make sure you're dragging from right to left
- Check that both nodes exist
- Verify the connection completed
- Save and refresh if needed

### **Flow Not Deploying**
- Check status indicator for issues
- Ensure at least one node exists
- Verify all nodes have required content
- Test the flow first

Your flow builder is now **production-ready** and provides everything needed to create sophisticated chatbot conversations! 🎉
