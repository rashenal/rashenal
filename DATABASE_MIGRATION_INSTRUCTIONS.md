# Database Migration Instructions

## Task Attachments & Comments Feature

The enhanced task management system now supports document attachments and comments. The necessary database migration has been created but needs to be applied manually.

## Required Database Changes

### 1. Apply Migration File

Run the SQL file located at:
```
supabase/migrations/20250810_create_task_attachments_comments.sql
```

This migration creates:
- `task_attachments` table for file storage metadata
- `task_comments` table for task comments
- `task-attachments` storage bucket for file uploads
- Proper RLS (Row Level Security) policies
- Performance indexes
- Updated_at triggers

### 2. Manual Database Application

Since `supabase db push` is failing with authentication issues, you can apply this migration through:

1. **Supabase Dashboard (Recommended)**:
   - Go to your Supabase project dashboard
   - Navigate to Database > SQL Editor
   - Copy and paste the contents of `20250810_create_task_attachments_comments.sql`
   - Run the SQL commands

2. **Direct PostgreSQL Connection**:
   ```bash
   psql postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres -f supabase/migrations/20250810_create_task_attachments_comments.sql
   ```

### 3. Features Enabled

Once the migration is applied, users will be able to:
- **Upload documents** to tasks (10MB limit per file)
- **Download and delete** attachments
- **Add comments** to tasks
- **Drag-and-drop** file uploads
- **View attachment counts** on task cards

### 4. Supported File Types

The storage bucket supports:
- Images: JPEG, PNG, GIF, WebP
- Documents: PDF, Word, Excel, PowerPoint
- Text files: TXT, CSV, JSON
- Archives: ZIP

### 5. Security Features

- Files are only accessible to task owners
- RLS policies ensure data isolation
- All operations require authentication
- File uploads are scanned and validated

## Implementation Status

✅ **Completed**:
- Enhanced task service with attachment support
- TaskAttachments component with drag-and-drop
- TaskboardAssistant with interactive chat
- Tools component with productivity agents
- Integration into SmartTasks interface
- Database migration file created

⏳ **Pending**:
- Manual application of database migration
- Testing with real file uploads
- Verification of storage bucket creation

## Next Steps

1. Apply the database migration through Supabase Dashboard
2. Test file upload functionality
3. Verify attachment display in task cards
4. Test comment functionality
5. Confirm all RLS policies are working

## Troubleshooting

If you encounter issues:
1. Ensure the `tasks` table exists (created in `20250810160422_create_tasks_table.sql`)
2. Verify your Supabase project has sufficient storage quota
3. Check that your user has the necessary permissions
4. Confirm the `task-attachments` bucket was created successfully

The application is fully functional for task management without attachments. Once the database migration is applied, the attachment and comment features will become active.