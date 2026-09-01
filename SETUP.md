# BoxedLinks Setup Guide

## 1. Create the Short Links Table

Run this SQL in your Supabase SQL editor (go to SQL Editor in your project):

```sql
CREATE TABLE IF NOT EXISTS short_links (
  id BIGSERIAL PRIMARY KEY,
  short_code VARCHAR(8) NOT NULL UNIQUE,
  file_path TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_short_links_code ON short_links(short_code);
CREATE INDEX IF NOT EXISTS idx_short_links_path ON short_links(file_path);

ALTER TABLE short_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "short_links_select" ON short_links
  FOR SELECT
  USING (true);

CREATE POLICY "short_links_insert" ON short_links
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "short_links_delete" ON short_links
  FOR DELETE
  USING (created_by = auth.uid());
```

## 2. Configure Supabase Email Rate Limits

Email rate limits in Supabase are configured in your project settings:

### Remove/Increase Email Rate Limits:

1. Go to **Supabase Dashboard** → Your Project
2. Navigate to **Authentication** → **Providers**
3. Click on **Email** provider
4. Look for "Rate Limit" settings:
   - Default: 30 emails per hour per email address
   - You can disable it or increase the limit

### To Disable Email Rate Limiting (Production):

1. Go to **Authentication** → **Policies**
2. Look for the "Email Rate Limit Policy" setting
3. You can adjust or disable the rate limit there

### Alternative: Use Supabase CLI

If using Supabase CLI, you can configure this in your `supabase/config.toml`:

```toml
[auth]
# Disable email rate limiting
email_rate_limit_enabled = false

# Or set custom rate limit (emails per hour)
email_rate_limit = 0  # 0 = unlimited
```

### For Production Apps:

- Consider using a transactional email service like SendGrid, AWS SES, or Resend
- This gives you full control over rate limits and better deliverability
- Configure it in Supabase under **Authentication** → **Email Templates** → **SMTP Configuration**

## 3. Update Your .env File

Make sure your `.env` file has:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 4. Features Overview

### ✅ Short Links

- Generated links are short: `example.com/s/ABC12345` instead of long paths
- Sharing is easier - short URLs are easier to copy and paste
- Link automatically copied to clipboard after upload

### ✅ File Type Filtering

- Filter files by type: **ALL**, **IMG**, **PDF**, **TXT**, **DOC**
- Quick access to specific file categories

## 5. Usage

### Uploading a File

1. Log in to your BoxedLinks account
2. Drag & drop a file into the Upload Terminal or click to select
3. File is validated and a short link is automatically generated and copied
4. Share the short link with anyone - they get direct access without authentication

### Filtering Files

1. In the My Drops section, click the filter buttons: **ALL**, **IMG**, **PDF**, **TXT**, **DOC**
2. View only files of that type
3. Click **ALL** to see all files again

### Sharing a File

1. Click **GET LINK** on any file in My Drops
2. A short link is generated and copied to clipboard
3. Share the link with anyone - they get direct access without authentication

## 6. Storage Path Structure

Files are stored in Supabase with this structure:

- **Uploads**: `user_id/timestamp-filename`

This allows the app to quickly list files by folder without complex queries.

## 8. Troubleshooting

### "FOLDER NAME REQUIRED" error

- Make sure you enter a folder name before clicking ✓

### Files not showing up after upload

- Click the **REFRESH DROPS** button in Quick Actions
- Make sure you're in the correct folder (check breadcrumbs)

### Can't delete a folder

- Make sure all files in the folder are deleted first
- Check that you have proper Supabase RLS permissions

### Short links not working

- Verify the `short_links` table was created successfully
- Check that the file exists in storage
- Ensure short links table has proper RLS policies
