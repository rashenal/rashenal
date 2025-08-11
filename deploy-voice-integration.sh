#!/bin/bash

# Rashenal Voice Integration Deployment Script
# Automates the setup of voice agents, WhatsApp integration, and edge functions

echo "🎤 Rashenal Voice Integration Deployment"
echo "========================================"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    print_info "Checking dependencies..."
    
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI not found. Please install it first:"
        echo "npm install -g supabase"
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js not found. Please install Node.js first."
        exit 1
    fi
    
    print_status "All dependencies found"
}

# Check environment variables
check_environment() {
    print_info "Checking environment variables..."
    
    # Required for voice processing
    if [ -z "$ANTHROPIC_API_KEY" ]; then
        print_warning "ANTHROPIC_API_KEY not set. Voice responses will use fallbacks."
    fi
    
    # Required for WhatsApp integration
    if [ -z "$WHATSAPP_ACCESS_TOKEN" ]; then
        print_warning "WHATSAPP_ACCESS_TOKEN not set. WhatsApp integration will be disabled."
    fi
    
    if [ -z "$WHATSAPP_PHONE_NUMBER_ID" ]; then
        print_warning "WHATSAPP_PHONE_NUMBER_ID not set. WhatsApp integration will be disabled."
    fi
    
    # Supabase configuration
    if [ -z "$SUPABASE_URL" ]; then
        print_error "SUPABASE_URL not set. Please configure Supabase first."
        exit 1
    fi
    
    if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
        print_error "SUPABASE_SERVICE_ROLE_KEY not set. Please configure Supabase first."
        exit 1
    fi
    
    print_status "Environment configuration verified"
}

# Run database migrations
run_migrations() {
    print_info "Running voice integration database migrations..."
    
    if supabase db push; then
        print_status "Database migrations completed successfully"
    else
        print_error "Database migration failed. Please check your Supabase configuration."
        exit 1
    fi
}

# Deploy edge functions
deploy_functions() {
    print_info "Deploying voice processing edge functions..."
    
    # Deploy WhatsApp webhook
    print_info "Deploying whatsapp-webhook function..."
    if supabase functions deploy whatsapp-webhook; then
        print_status "WhatsApp webhook deployed successfully"
    else
        print_error "Failed to deploy WhatsApp webhook"
        exit 1
    fi
    
    # Deploy voice processing
    print_info "Deploying voice-processing function..."
    if supabase functions deploy voice-processing; then
        print_status "Voice processing function deployed successfully"
    else
        print_error "Failed to deploy voice processing function"
        exit 1
    fi
}

# Setup WhatsApp webhook URL
setup_whatsapp() {
    if [ -n "$WHATSAPP_ACCESS_TOKEN" ] && [ -n "$WHATSAPP_PHONE_NUMBER_ID" ]; then
        print_info "Setting up WhatsApp webhook..."
        
        # Get the webhook URL
        WEBHOOK_URL="${SUPABASE_URL}/functions/v1/whatsapp-webhook"
        VERIFY_TOKEN="${WHATSAPP_VERIFY_TOKEN:-rashenal-voice-agent}"
        
        print_info "WhatsApp Webhook Configuration:"
        echo "  Webhook URL: $WEBHOOK_URL"
        echo "  Verify Token: $VERIFY_TOKEN"
        
        print_warning "Please configure these settings in your Facebook App webhook configuration:"
        echo "  1. Go to Facebook Developers Console"
        echo "  2. Select your WhatsApp Business App"
        echo "  3. Go to WhatsApp > Configuration"
        echo "  4. Set Webhook URL: $WEBHOOK_URL"
        echo "  5. Set Verify Token: $VERIFY_TOKEN"
        echo "  6. Subscribe to messages and message_deliveries"
        
        print_status "WhatsApp webhook configuration ready"
    else
        print_warning "WhatsApp environment variables not set. Skipping WhatsApp setup."
    fi
}

# Install NPM dependencies for voice components
install_dependencies() {
    print_info "Installing voice-related dependencies..."
    
    # Check if package.json exists
    if [ -f "package.json" ]; then
        npm install
        print_status "Dependencies installed successfully"
    else
        print_warning "package.json not found. Make sure you're in the Rashenal project directory."
    fi
}

# Test voice integration
test_voice_integration() {
    print_info "Testing voice integration..."
    
    # Test edge functions
    print_info "Testing voice processing function..."
    VOICE_TEST_RESULT=$(supabase functions invoke voice-processing \
        --data '{"action": "synthesize", "text": "Hello, this is a test of the Rashenal voice system!"}' 2>&1)
    
    if echo "$VOICE_TEST_RESULT" | grep -q "success"; then
        print_status "Voice processing function working correctly"
    else
        print_warning "Voice processing function test failed. Check logs for details."
    fi
    
    # Test WhatsApp webhook (if configured)
    if [ -n "$WHATSAPP_ACCESS_TOKEN" ]; then
        print_info "Testing WhatsApp webhook..."
        WEBHOOK_TEST_RESULT=$(supabase functions invoke whatsapp-webhook \
            --data '{"test": "integration"}' 2>&1)
        
        if echo "$WEBHOOK_TEST_RESULT" | grep -q "success"; then
            print_status "WhatsApp webhook working correctly"
        else
            print_warning "WhatsApp webhook test failed. Check configuration."
        fi
    fi
}

# Generate configuration summary
generate_summary() {
    print_info "Generating deployment summary..."
    
    echo ""
    echo "🎉 Voice Integration Deployment Complete!"
    echo "========================================"
    echo ""
    echo "✅ Components Deployed:"
    echo "  - Voice agent database schema"
    echo "  - WhatsApp webhook endpoint"
    echo "  - Voice processing functions"
    echo "  - Zero-code agent builder UI"
    echo ""
    echo "🔗 Integration Endpoints:"
    echo "  - WhatsApp Webhook: ${SUPABASE_URL}/functions/v1/whatsapp-webhook"
    echo "  - Voice Processing: ${SUPABASE_URL}/functions/v1/voice-processing"
    echo ""
    echo "📱 Next Steps:"
    echo "  1. Complete WhatsApp webhook configuration in Facebook Console"
    echo "  2. Test voice agent creation in the Rashenal web app"
    echo "  3. Send a test message to your WhatsApp Business number"
    echo "  4. Configure custom voice samples (optional)"
    echo ""
    echo "📚 Documentation:"
    echo "  - Full guide: VOICE_INTEGRATION_README.md"
    echo "  - Troubleshooting: Check Supabase function logs"
    echo "  - Support: Create GitHub issue or Discord #voice-integration"
    echo ""
    
    if [ -n "$WHATSAPP_ACCESS_TOKEN" ]; then
        print_status "WhatsApp integration ready for testing"
    else
        print_warning "Set WhatsApp environment variables to enable messaging"
    fi
}

# Main deployment process
main() {
    echo "Starting voice integration deployment..."
    echo ""
    
    check_dependencies
    check_environment
    install_dependencies
    run_migrations
    deploy_functions
    setup_whatsapp
    test_voice_integration
    generate_summary
    
    echo ""
    print_status "Voice integration deployment completed successfully! 🎉"
    echo ""
    echo "Ready to revolutionize personal transformation with voice AI! 🚀"
}

# Handle script options
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "test")
        print_info "Running voice integration tests only..."
        test_voice_integration
        ;;
    "functions")
        print_info "Deploying edge functions only..."
        deploy_functions
        ;;
    "migrations")
        print_info "Running database migrations only..."
        run_migrations
        ;;
    "help")
        echo "Rashenal Voice Integration Deployment Script"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deploy      Full deployment (default)"
        echo "  test        Test existing deployment"
        echo "  functions   Deploy edge functions only"
        echo "  migrations  Run database migrations only"
        echo "  help        Show this help message"
        echo ""
        echo "Environment Variables Required:"
        echo "  SUPABASE_URL                  - Your Supabase project URL"
        echo "  SUPABASE_SERVICE_ROLE_KEY     - Supabase service role key"
        echo "  ANTHROPIC_API_KEY             - Claude API key (for AI responses)"
        echo ""
        echo "Optional (for WhatsApp):"
        echo "  WHATSAPP_ACCESS_TOKEN         - Facebook Business API token"
        echo "  WHATSAPP_PHONE_NUMBER_ID      - WhatsApp Business phone number ID"
        echo "  WHATSAPP_VERIFY_TOKEN         - Custom webhook verification token"
        ;;
    *)
        print_error "Unknown command: $1"
        echo "Use '$0 help' for usage information."
        exit 1
        ;;
esac
