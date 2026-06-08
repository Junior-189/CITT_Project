-- Migration 027: CMS tables for content management

CREATE TABLE IF NOT EXISTS cms_pages (
  id          SERIAL PRIMARY KEY,
  slug        VARCHAR(255) UNIQUE NOT NULL,
  title       VARCHAR(255) NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  status      VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_status ON cms_pages(status);

CREATE TABLE IF NOT EXISTS cms_categories (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(255) UNIQUE NOT NULL,
  slug        VARCHAR(255) UNIQUE NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cms_posts (
  id             SERIAL PRIMARY KEY,
  slug           VARCHAR(255) UNIQUE NOT NULL,
  title          VARCHAR(255) NOT NULL,
  excerpt        TEXT DEFAULT '',
  content        TEXT NOT NULL DEFAULT '',
  featured_image VARCHAR(500) DEFAULT NULL,
  category_id    INTEGER REFERENCES cms_categories(id) ON DELETE SET NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  author_id      INTEGER REFERENCES users(id) ON DELETE SET NULL,
  published_at   TIMESTAMP DEFAULT NULL,
  created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cms_posts_slug ON cms_posts(slug);
CREATE INDEX IF NOT EXISTS idx_cms_posts_status ON cms_posts(status);
CREATE INDEX IF NOT EXISTS idx_cms_posts_category ON cms_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_cms_posts_published_at ON cms_posts(published_at);
