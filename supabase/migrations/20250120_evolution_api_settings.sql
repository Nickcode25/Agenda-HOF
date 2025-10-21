-- Migration: Evolution API Settings
-- Description: Adds table for Evolution API configuration for WhatsApp notifications

-- Create evolution_settings table
CREATE TABLE IF NOT EXISTS evolution_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  api_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  instance_name TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE evolution_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own Evolution API settings"
  ON evolution_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own Evolution API settings"
  ON evolution_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own Evolution API settings"
  ON evolution_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own Evolution API settings"
  ON evolution_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_evolution_settings_user_id ON evolution_settings(user_id);
CREATE INDEX idx_evolution_settings_enabled ON evolution_settings(enabled);

-- Comments
COMMENT ON TABLE evolution_settings IS 'Stores Evolution API configuration for WhatsApp notifications';
COMMENT ON COLUMN evolution_settings.api_url IS 'Evolution API URL (e.g., http://localhost:8080)';
COMMENT ON COLUMN evolution_settings.api_key IS 'Evolution API authentication key';
COMMENT ON COLUMN evolution_settings.instance_name IS 'WhatsApp instance name in Evolution API';
COMMENT ON COLUMN evolution_settings.enabled IS 'Whether automatic WhatsApp notifications are enabled';
