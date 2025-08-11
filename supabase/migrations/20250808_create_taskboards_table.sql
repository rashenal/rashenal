-- Migration: Create taskboards table for SmartTasks functionality
-- Created: 2025-08-08

-- Create taskboards table
CREATE TABLE IF NOT EXISTS public.taskboards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    position INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add RLS (Row Level Security)
ALTER TABLE public.taskboards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own taskboards" ON public.taskboards
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own taskboards" ON public.taskboards
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own taskboards" ON public.taskboards
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own taskboards" ON public.taskboards
    FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_taskboards_updated_at
    BEFORE UPDATE ON public.taskboards
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Add taskboard_id column to tasks table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'taskboard_id'
    ) THEN
        ALTER TABLE public.tasks 
        ADD COLUMN taskboard_id UUID REFERENCES public.taskboards(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Create index on taskboard_id for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_taskboard_id ON public.tasks(taskboard_id);

-- Create a default taskboard for existing users with tasks but no taskboards
DO $$
DECLARE
    user_record RECORD;
    default_taskboard_id UUID;
BEGIN
    FOR user_record IN 
        SELECT DISTINCT user_id 
        FROM public.tasks 
        WHERE user_id NOT IN (SELECT DISTINCT user_id FROM public.taskboards)
    LOOP
        -- Create default taskboard for this user
        INSERT INTO public.taskboards (user_id, name, description, color, position)
        VALUES (
            user_record.user_id,
            'My Tasks',
            'Default taskboard for your tasks',
            '#3B82F6',
            0
        )
        RETURNING id INTO default_taskboard_id;
        
        -- Update all tasks for this user to use the new taskboard
        UPDATE public.tasks 
        SET taskboard_id = default_taskboard_id
        WHERE user_id = user_record.user_id AND taskboard_id IS NULL;
    END LOOP;
END $$;