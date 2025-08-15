# 🎯 Wheel of Life Assessment Plugin
## Structured Implementation Prompt

---

## 📋 **Plugin Overview**

**Plugin Name:** Wheel of Life Assessment  
**Type:** Self-Assessment Tool  
**Integration Level:** Standalone → Potential Core Feature  
**Dependencies:** Claude AI, Supabase, React Components  
**Accessibility Priority:** High (Neurodiverse-friendly design)

---

## 🎯 **Core Functionality Requirements**

### **Primary Features**
1. **Interactive Wheel Assessment** - Visual 8-spoke wheel with sliding scale (1-10)
2. **AI-Guided Questioning** - Contextual follow-up questions per life area
3. **Results Dashboard** - Visual insights and improvement recommendations
4. **Progress Tracking** - Historical assessments and trend analysis
5. **Action Planning** - Convert insights into Rashenal goals/habits

### **Life Areas (Default 8)**
- 💰 **Financial Security**
- 💪 **Health & Fitness** 
- ❤️ **Relationships & Love**
- 🎯 **Career & Purpose**
- 🧠 **Personal Growth**
- 🎉 **Fun & Recreation**
- 🏠 **Home & Environment**
- 🤝 **Social & Community**

---

## 🏗️ **Technical Architecture**

### **Component Structure**
```
src/plugins/wheel-of-life/
├── WheelOfLifePlugin.tsx          # Main plugin wrapper
├── components/
│   ├── InteractiveWheel.tsx       # Visual wheel component
│   ├── AreaAssessment.tsx         # Individual area deep-dive
│   ├── AIQuestionFlow.tsx         # Conversational assessment
│   ├── ResultsDashboard.tsx       # Insights and visualization
│   └── ActionPlanner.tsx          # Goal/habit generation
├── hooks/
│   ├── useWheelAssessment.ts      # Assessment state management
│   └── useAIInsights.ts           # Claude API integration
├── types/
│   └── wheel-types.ts             # TypeScript definitions
└── utils/
    ├── scoring.ts                 # Assessment calculations
    └── insights-generator.ts      # AI prompt engineering
```

### **Database Schema**
```sql
-- New tables for plugin
CREATE TABLE wheel_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  overall_score DECIMAL(3,1),
  balance_score DECIMAL(3,1), -- How "round" the wheel is
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE wheel_area_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES wheel_assessments(id) ON DELETE CASCADE,
  area_name TEXT NOT NULL,
  score INTEGER CHECK (score >= 1 AND score <= 10),
  responses TEXT[], -- User's qualitative responses
  ai_insights TEXT[], -- Claude-generated insights
  suggested_actions JSONB DEFAULT '[]'
);

-- RLS Policies
ALTER TABLE wheel_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_area_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wheel_assessments_policy" ON wheel_assessments
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "wheel_area_scores_policy" ON wheel_area_scores
  FOR ALL USING (auth.uid() IN (
    SELECT user_id FROM wheel_assessments 
    WHERE id = assessment_id
  ));
```

---

## 🤖 **AI Integration Points**

### **Claude API Functions**

#### **1. Area Assessment Questions**
```typescript
// Generate contextual questions based on initial score
const generateAreaQuestions = async (
  area: string, 
  initialScore: number,
  userContext?: string
) => {
  const prompt = `
  Generate 2-3 thoughtful, non-judgmental questions about ${area} 
  for someone who rated it ${initialScore}/10. 
  
  Questions should:
  - Be specific and actionable
  - Help uncover underlying factors
  - Consider different life stages
  - Be accessible for neurodiverse users
  
  Example context: ${userContext || 'No additional context'}
  `;
};
```

#### **2. Pattern Recognition & Insights**
```typescript
const generateInsights = async (allAreaScores: AreaScore[]) => {
  const prompt = `
  Analyze this Wheel of Life assessment for patterns and insights:
  ${JSON.stringify(allAreaScores, null, 2)}
  
  Provide:
  1. Key strengths to celebrate
  2. Interconnections between areas
  3. Priority areas for improvement
  4. Specific, actionable next steps
  
  Tone: Warm, encouraging, realistic, accessibility-conscious
  `;
};
```

#### **3. Action Planning**
```typescript
const generateActionPlan = async (
  priorityAreas: string[],
  userGoals?: Goal[],
  userHabits?: Habit[]
) => {
  const prompt = `
  Create an action plan for improving: ${priorityAreas.join(', ')}
  
  Consider existing goals: ${JSON.stringify(userGoals)}
  Consider existing habits: ${JSON.stringify(userHabits)}
  
  Generate:
  - 3 micro-habits (tiny daily actions)
  - 2 larger goals (monthly/quarterly)
  - Specific resources or tools
  - Ways to track progress
  `;
};
```

---

## 🎨 **User Experience Flow**

### **Assessment Journey**
1. **Plugin Launch** - "Let's see how balanced your life wheel is today"
2. **Quick Overview** - Show all 8 areas, explain the concept
3. **Initial Scoring** - Quick slider-based rating for all areas
4. **Visual Feedback** - Show wheel shape, identify imbalances
5. **Deep Dive Selection** - "Which 3 areas would you like to explore further?"
6. **AI Conversation** - Thoughtful questions for selected areas
7. **Insights Generation** - AI analyzes patterns and connections
8. **Action Planning** - Convert insights to goals/habits
9. **Integration** - Save to Rashenal core system

### **Accessibility Considerations**
- **Keyboard Navigation** - Full wheel interaction via arrow keys
- **Screen Reader Support** - Detailed ARIA labels and descriptions
- **Alternative Input Methods** - Voice, number input, emoji selection
- **Cognitive Load Management** - Progress saving, optional sections
- **Sensory Preferences** - Reduced motion, high contrast options

---

## 📊 **Data Integration Points**

### **With Core Rashenal Features**
- **Goals**: Convert low-scoring areas into improvement goals
- **Habits**: Suggest specific habits based on assessment insights
- **AI Coach**: Reference assessment context in future conversations
- **Dashboard**: Show assessment summary card with re-assessment prompts

### **Export Capabilities**
- **PDF Report**: Comprehensive assessment results
- **Goal Integration**: One-click conversion to Rashenal goals
- **Progress Tracking**: Quarterly re-assessment notifications

---

## 🧪 **Testing & Validation**

### **Accessibility Testing**
- [ ] Screen reader compatibility (NVDA, JAWS, VoiceOver)
- [ ] Keyboard-only navigation
- [ ] High contrast mode functionality
- [ ] Voice input testing
- [ ] Mobile touch accessibility

### **User Experience Testing**
- [ ] Complete assessment flow (start to finish)
- [ ] Data persistence across sessions
- [ ] AI response quality and relevance
- [ ] Goal/habit integration workflow
- [ ] Re-assessment comparison functionality

### **Technical Testing**
- [ ] Database operations and RLS policies
- [ ] Claude API error handling
- [ ] Real-time wheel visualization
- [ ] Cross-browser compatibility
- [ ] Performance with large datasets

---

## 🚀 **Deployment Strategy**

### **Phase 1: Standalone Plugin** (Week 1-2)
- Basic wheel visualization and scoring
- Simple AI questioning
- Local data storage

### **Phase 2: Enhanced Intelligence** (Week 3)
- Advanced AI insights and pattern recognition
- Historical tracking
- Action plan generation

### **Phase 3: Core Integration** (Week 4)
- Full Supabase integration
- Goal/habit system connection
- Dashboard integration

### **Phase 4: Evaluation** (Week 5)
**Decision Point: Plugin vs Core Feature**

**Evaluation Criteria:**
- User engagement metrics
- Feature request frequency
- Technical maintenance overhead
- Strategic alignment with Rashenal vision

---

## 🎯 **Success Metrics**

### **User Engagement**
- Assessment completion rate
- Re-assessment frequency
- Goal conversion rate from insights
- User retention after using plugin

### **Quality Indicators**
- AI insight relevance scores
- Action plan implementation rate
- User satisfaction with recommendations
- Accessibility compliance scores

---

## 🔄 **Future Enhancement Ideas**

### **Advanced Features** (Post-MVP)
- **Comparative Analysis**: Compare with anonymous, similar users
- **Life Stage Customization**: Different wheels for students/parents/retirees
- **Team Assessments**: Group wheel analysis for families/teams
- **Integration Expansion**: Connect with calendar, email, social media insights
- **Predictive Analytics**: Forecast life satisfaction trends

### **Gamification Elements**
- **Progress Badges**: Improvement milestones
- **Streak Tracking**: Consistent life balance maintenance
- **Challenge Modes**: 30-day improvement challenges

---

## 📋 **Implementation Checklist**

### **Pre-Development**
- [ ] Review existing Rashenal component patterns
- [ ] Set up plugin development environment
- [ ] Create accessibility testing plan
- [ ] Define AI prompt templates

### **Development Sprint**
- [ ] Build InteractiveWheel component
- [ ] Implement AI questioning system
- [ ] Create results dashboard
- [ ] Add database integration
- [ ] Implement accessibility features

### **Testing & Polish**
- [ ] Comprehensive accessibility audit
- [ ] User experience testing
- [ ] AI response quality validation
- [ ] Performance optimization
- [ ] Documentation completion

### **Deployment Decision**
- [ ] Analyze usage metrics
- [ ] Evaluate core integration benefits
- [ ] Make plugin vs. core feature decision
- [ ] Plan next development cycle

---

## 💡 **Implementation Notes**

**Start Simple:** Begin with basic wheel visualization and expand intelligence gradually.

**Accessibility First:** Every interaction method should work for different cognitive and physical abilities.

**AI Quality:** Focus on generating truly helpful, non-generic insights that users couldn't get elsewhere.

**Integration Ready:** Design with core feature migration in mind - clean data models and component patterns.

**User-Centric:** This is about helping real people understand their lives better, not just creating another assessment tool.

---

*Plugin prompt ready for implementation queue. Estimated development time: 2-3 weeks for full-featured plugin.*