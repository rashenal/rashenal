# 🛡️ CODE VALIDATION RULES
## Prevent Predictable Failures Before Suggesting Solutions

**MANDATORY CHECKLIST** - Review before providing any code that touches databases, APIs, or external systems.

---

## 🗄️ **DATABASE & SQL VALIDATION**

### **Schema Changes**
- [ ] **Check existing data compatibility** - Will constraints work with current data?
- [ ] **Validate foreign key targets exist** - Does the referenced table/column exist?
- [ ] **Use correct PostgreSQL syntax** - Date arithmetic, function names, type casting
- [ ] **Consider RLS policies** - Will new columns/tables need Row Level Security?
- [ ] **Plan migration order** - Clean data → Add constraints → Create indexes
- [ ] **Check frontend column dependencies** - What columns does existing code expect from views/tables?
- [ ] **Include all required columns in views** - Don't omit columns that frontend code accesses

### **PostgreSQL-Specific Rules**
- [ ] **Date arithmetic returns INTERVAL** - Use `(date1 - date2)` or `EXTRACT()` correctly
- [ ] **Supabase uses `auth.users`** - Not `users` table for foreign keys
- [ ] **JSONB columns need defaults** - `DEFAULT '{}'` or `DEFAULT 'null'`
- [ ] **Function signatures matter** - `DATE_PART(text, interval)` vs `EXTRACT(field FROM source)`
- [ ] **Constraint violations check ALL rows** - Not just new ones
- [ ] **View replacement has limits** - `CREATE OR REPLACE VIEW` fails if column structure differs significantly
- [ ] **Drop view before recreating** - Use `DROP VIEW IF EXISTS` then `CREATE VIEW` for structural changes

### **Common SQL Failures**
```sql
❌ WRONG: DATE_PART('day', date1 - date2)  
✅ RIGHT: (date1 - date2) OR EXTRACT(days FROM (date1 - date2))

❌ WRONG: REFERENCES users(id)
✅ RIGHT: REFERENCES auth.users(id) OR no constraint + manual validation

❌ WRONG: ADD CONSTRAINT before cleaning data
✅ RIGHT: UPDATE invalid data → ADD CONSTRAINT

❌ WRONG: CREATE OR REPLACE VIEW (when structure differs)
✅ RIGHT: DROP VIEW IF EXISTS → CREATE VIEW
```

---

## 🔗 **API & SERVICE INTEGRATION**

### **TypeScript/React Validation**
- [ ] **Check existing interface compatibility** - Does new field match existing types?
- [ ] **Validate import paths exist** - Can the module be imported from this location?
- [ ] **Consider hook dependencies** - Will useEffect deps cause infinite loops?
- [ ] **Check authentication patterns** - Does this match existing auth flow?
- [ ] **Validate error handling** - Are error states properly handled?

### **Supabase-Specific Rules**
- [ ] **RLS policies cover new operations** - SELECT/INSERT/UPDATE/DELETE permissions
- [ ] **User context available** - `const { user } = useUser()` pattern established
- [ ] **Error handling follows pattern** - `{ data, error }` destructuring
- [ ] **Query patterns match existing** - `.select()`, `.eq()`, `.order()` syntax
- [ ] **Real-time subscriptions handled** - Will changes trigger re-renders correctly?

---

## 🎨 **FRONTEND & UI VALIDATION**

### **React Component Rules**
- [ ] **Props interface matches usage** - Are required props provided?
- [ ] **State updates are immutable** - Using spread operator or proper setState
- [ ] **Event handlers prevent default** - `e.preventDefault()` where needed
- [ ] **Conditional rendering handles null** - `data?.field` or proper null checks
- [ ] **Key props for lists** - Unique keys for mapped elements

### **Navigation & Routing**
- [ ] **Route paths are defined** - Does the path exist in router config?
- [ ] **Navigation components match patterns** - Following established navigation structure
- [ ] **Breadcrumb patterns consistent** - Using established breadcrumb context
- [ ] **Authentication guards in place** - Protected routes properly configured

---

## 🧠 **LOGIC & BUSINESS RULES**

### **Data Consistency**
- [ ] **Referential integrity maintained** - Parent records exist before children
- [ ] **Business logic constraints** - Do the rules make business sense?
- [ ] **Edge cases considered** - Empty arrays, null values, zero quantities
- [ ] **User permission boundaries** - Can user actually perform this action?
- [ ] **Race condition protection** - Multiple simultaneous operations handled

### **Performance Considerations**
- [ ] **N+1 query prevention** - Using joins or batch operations
- [ ] **Index support for queries** - Will queries use existing indexes?
- [ ] **Pagination for large datasets** - Limiting results appropriately
- [ ] **Caching strategies** - Avoiding unnecessary API calls
- [ ] **Memory leak prevention** - Cleanup subscriptions and timers

---

## 🔧 **SYSTEM INTEGRATION**

### **File & Storage Operations**
- [ ] **File size limits enforced** - Client and server-side validation
- [ ] **File type validation** - MIME type checking and extension validation
- [ ] **Storage permissions configured** - Supabase storage bucket policies
- [ ] **Cleanup procedures defined** - What happens to orphaned files?
- [ ] **Error handling for upload failures** - User feedback and retry logic

### **External API Integration**
- [ ] **Rate limiting considerations** - Respecting API limits
- [ ] **Authentication token management** - Refresh tokens, expiration handling
- [ ] **Error code interpretation** - Proper handling of 4xx/5xx responses
- [ ] **Timeout handling** - Network failure scenarios
- [ ] **Data transformation validation** - External data matches internal schema

---

## 📋 **PRE-COMMIT VALIDATION QUESTIONS**

### **Before Suggesting Database Changes:**
1. "What existing data might violate this constraint?"
2. "Does this foreign key reference an existing table?"
3. "Will this PostgreSQL function work with these data types?"
4. "Are we using the correct Supabase authentication pattern?"
5. "What columns does the frontend code expect from this view/table?"
6. "Are we including all required columns in views and queries?"

### **Before Suggesting Code Changes:**
1. "Does this match the existing TypeScript interfaces?"
2. "Will this import path resolve correctly?"
3. "Are we following the established patterns in this codebase?"
4. "Have we handled the error cases appropriately?"

### **Before Suggesting UI Changes:**
1. "Does this component receive all required props?"
2. "Are we maintaining accessibility standards?"
3. "Will this work on mobile devices?"
4. "Does this follow the established design patterns?"

---

## 🎯 **COMMON FAILURE PATTERNS TO AVOID**

### **Database Failures**
- Adding constraints without checking existing data
- Using wrong PostgreSQL function signatures  
- Referencing non-existent tables in foreign keys
- Forgetting to handle null values in calculations
- Using `CREATE OR REPLACE VIEW` when column structure differs significantly
- Omitting columns from views that frontend code expects to access

### **Code Failures**
- Importing from non-existent paths
- Using undefined variables or functions
- Missing error handling for async operations
- Infinite loops in useEffect dependencies

### **Integration Failures**
- Authentication context not available
- Missing permissions for operations
- Incorrect API endpoint patterns
- File upload without proper validation

---

## 📝 **VALIDATION WORKFLOW**

### **1. Analysis Phase**
- [ ] Read and understand the existing codebase patterns
- [ ] Identify all systems that will be affected by the change
- [ ] Check for potential conflicts with existing data/code

### **2. Design Phase**  
- [ ] Design solution that follows established patterns
- [ ] Plan migration/rollback procedures for database changes
- [ ] Consider error scenarios and edge cases

### **3. Implementation Phase**
- [ ] Write code that matches existing interfaces and patterns
- [ ] Include proper error handling and validation
- [ ] Test against known failure scenarios

### **4. Review Phase**
- [ ] Verify all validation rules have been followed
- [ ] Double-check syntax and function signatures
- [ ] Ensure backwards compatibility where needed

---

## 🚀 **SUCCESS CRITERIA**

**A solution passes validation when:**
- ✅ All syntax is verified against target system documentation
- ✅ Existing data/code compatibility is confirmed
- ✅ Error scenarios are properly handled
- ✅ No predictable failures based on known system constraints
- ✅ Follows established patterns and conventions
- ✅ Includes appropriate rollback/cleanup procedures

**Remember: If I have enough information to predict a failure, I should prevent it.**
