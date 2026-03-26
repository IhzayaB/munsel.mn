-- Clean up any product slugs that have trailing/leading whitespace or newlines
UPDATE products SET slug = trim(slug) WHERE slug != trim(slug);
UPDATE categories SET slug = trim(slug) WHERE slug != trim(slug);
