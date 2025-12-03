-- ============================================================================
-- Fix Column Sizes in Articles Table
-- ============================================================================
-- This fixes "value too long for type character varying(60)" error
-- by increasing column sizes to accommodate longer content
-- ============================================================================

-- Increase title column size (likely the culprit)
ALTER TABLE articles
ALTER COLUMN title TYPE VARCHAR(500);

-- Increase slug column size
ALTER TABLE articles
ALTER COLUMN slug TYPE VARCHAR(500);

-- Increase meta_title column size
ALTER TABLE articles
ALTER COLUMN meta_title TYPE VARCHAR(500);

-- Make sure content and description can hold long text
ALTER TABLE articles
ALTER COLUMN content TYPE TEXT;

-- If you have a description column, make it TEXT
-- ALTER TABLE articles
-- ALTER COLUMN description TYPE TEXT;

-- Verify the changes
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'articles'
AND column_name IN ('title', 'slug', 'content', 'meta_title', 'excerpt', 'featured_image')
ORDER BY column_name;
