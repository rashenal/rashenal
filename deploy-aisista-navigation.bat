@echo off
echo 🎯 Deploying aisista.ai Navigation System...
echo ================================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: Please run this script from the project root directory
    pause
    exit /b 1
)

REM Add all changes
echo 📁 Adding all changes to git...
git add .

REM Create comprehensive commit message
git commit -m "✨ Implement aisista.ai navigation with plugin architecture

🎯 Major Changes:
- Replace Rashenal with aisista.ai branding for target audience
- Add immediate AI conversation interface (no more Welcome Rashee)
- Implement Innovation Labs for admin plugin testing
- Create plugin registry system for extensibility
- Add Start With This plugin demonstration
- Rename Smart Tasks → Projects, Job Finder → Jobs

🛠️ Technical Features:
- Full accessibility (WCAG 2.1 AA) and keyboard navigation
- Voice command integration framework
- Mobile-optimized AI chat bar
- Plugin-extensible navigation system
- Elegant gradient design system

🔧 Files Created/Modified:
- src/components/AisistaNavigation.tsx (new elegant nav)
- src/components/InnovationLabs.tsx (admin plugin area)
- src/plugins/core/NavigationPluginRegistry.ts (plugin system)
- src/plugins/official/StartWithThisPlugin.tsx (demo plugin)
- src/App.tsx (routing updates)
- AISISTA_NAVIGATION_GUIDE.md (comprehensive docs)

🎨 Design System:
- Purple-pink gradients for aisista.ai branding
- Accessible contrast and focus indicators
- Neurodiversity-friendly interaction patterns
- Mobile-first responsive design

🗣️ Voice Ready:
- Framework for voice commands
- Plugin voice integration
- 'Start with this', 'Review my day' commands ready

🚀 Ready for next phase:
- ESG Score plugin development
- DependencyMap visualization
- Voice agent personalities
- Cross-platform sync"

REM Push to remote
echo 🚀 Pushing to remote repository...
git push

echo.
echo ✅ Deployment complete!
echo 🎯 aisista.ai navigation system is now live
echo 📚 Check AISISTA_NAVIGATION_GUIDE.md for detailed documentation
echo 🧪 Access Innovation Labs at /admin/labs for plugin testing
echo.
echo 🌟 Next: Test the new system and start developing amazing plugins!
pause