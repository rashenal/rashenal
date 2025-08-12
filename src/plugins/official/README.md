# Official Asista.AI Plugins

This directory contains official plugins developed by the Asista.AI team.

## Available Plugins

### Motivation Booster (`ai.asista.motivation`)
- **Version**: 1.0.0
- **Category**: Wellness
- **Description**: AI-powered motivational support that adapts to your energy and goals

**Features:**
- Personalized motivations based on your tasks, habits, and energy level
- Voice commands: "motivate me", "how am I doing"
- Smart notifications when you need encouragement
- Progress tracking and streak counting
- Save favorite motivations

**Permissions Required:**
- `tasks:read` - Access your task data for context
- `habits:read` - Read habit information for personalization
- `goals:read` - Understand your goals for relevant messaging
- `ai:chat` - Generate personalized motivations using Claude API
- `notifications:send` - Send gentle reminders when helpful

**Usage:**
The Motivation plugin automatically appears on your dashboard once installed. It will:
1. Show personalized daily motivations
2. Monitor your activity patterns
3. Send gentle encouragement during low-energy periods
4. Respond to voice commands if voice integration is enabled

## Plugin Development

All official plugins follow these standards:
- TypeScript implementation
- Comprehensive error handling
- Accessibility-first design
- Integration with existing Rashenal features
- Respect for user privacy and permissions

## Installation

Official plugins are pre-installed and available in the Plugin Marketplace. Users can enable/disable them as needed.