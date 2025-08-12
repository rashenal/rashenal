# Persistence Strategy Documentation

## 🎯 **RULE: Database First, localStorage Only for UI Preferences**

### **✅ APPROVED localStorage Usage:**
- **UI Settings**: `taskCardDisplaySettings`, `smart-tasks-settings`
- **Theme Preferences**: User's dark/light mode choice
- **View Preferences**: Column widths, collapsed states
- **Temporary UI State**: Draft forms, unsaved inputs

### **❌ FORBIDDEN localStorage Usage:**
- **Task Data**: All tasks MUST use database
- **User Data**: Profile, authentication data
- **Business Logic Data**: Dependencies, progress, attachments
- **Shared Data**: Anything multiple users might access

### **Current Component Status:**
- ✅ **SmartTasks**: Uses database via EnhancedTaskService
- ✅ **EnhancedTaskBoard**: Now uses database with virtual board wrapper  
- ❌ **Old TaskBoard Components**: Still use localStorage (to be deprecated)

### **Data Flow Validation:**
1. **All task operations** → EnhancedTaskService → Supabase
2. **All persistence** → Database first, UI preferences only in localStorage
3. **No exceptions** without explicit documentation and justification

## 🔍 **How to Verify:**
- Search codebase for `localStorage.setItem` - each must be justified
- All task CRUD operations must use EnhancedTaskService
- No business data in localStorage without explicit approval