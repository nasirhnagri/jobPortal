# Blog System Setup Guide

## Overview
The blog system allows sub-admins to create, manage, and publish blog posts that automatically display on the main website.

## Features Implemented

### ✅ Backend (FastAPI)
- **Blog Models**: Posts, Categories, Tags, Comments
- **Admin API**: Full CRUD for posts, categories, tags
- **File Upload**: Image upload with validation (5MB max, JPEG/PNG/GIF/WebP)
- **Status Management**: Draft → Pending Review → Published workflow
- **Scheduled Publishing**: Set future publish dates
- **SEO Fields**: Meta title, description, keywords
- **Public API**: List posts, get post by slug, filter by category/tag, search
- **RSS Feed**: `/api/blog/rss`
- **Related Posts**: Automatic suggestions based on category/tags
- **Comments**: Optional comment system with moderation

### ✅ Frontend (React)
- **Admin Panel**: `/admin/blog`
  - Posts management with tabs (Posts/Categories/Tags)
  - Rich text editor (React Quill) with image upload
  - Draft/Pending/Published status management
  - Category and tag management
  - SEO fields editor
- **Public Blog**: `/blog`
  - Responsive blog listing with pagination
  - Category and tag filtering
  - Search functionality
  - Individual post pages with related posts
  - Social sharing buttons
  - Author bio sections

## Setup Instructions

### 1. Install Dependencies

**Frontend:**
```bash
cd frontend
npm install
```

This will install `react-quill` for the WYSIWYG editor.

**Backend:**
Dependencies are already in `requirements.txt`. Ensure you have:
- FastAPI
- Motor (MongoDB async driver)
- python-multipart (for file uploads)

### 2. Configure Permissions

To allow a sub-admin to manage blogs:
1. Go to Admin Dashboard → Sub Admins
2. Edit the sub-admin
3. Add `MANAGE_BLOG` permission

### 3. Create Uploads Directory

The backend automatically creates `backend/uploads/` on startup. Ensure the directory has write permissions.

### 4. Access Blog Management

1. Login as super-admin or sub-admin with `MANAGE_BLOG` permission
2. Navigate to Admin Dashboard
3. Click "Blog" in the sidebar
4. Create categories and tags first
5. Create your first blog post

## Usage

### Creating a Blog Post

1. Go to `/admin/blog` → Click "New Post"
2. Fill in:
   - **Title**: Post title (slug auto-generated)
   - **Excerpt**: Short summary
   - **Content**: Use the rich text editor
   - **Featured Image**: Upload or paste URL
   - **Category**: Select from existing categories
   - **Tags**: Click to select multiple tags
   - **Status**: Draft, Pending Review, or Published
   - **Schedule**: Optional future publish date
   - **SEO**: Meta title, description, keywords
3. Click "Save"

### Image Upload

- Click the image icon in the editor toolbar
- Select an image file (max 5MB)
- Image uploads to `/uploads/` and is inserted into content
- Featured images can be URLs or uploaded paths

### Approval Workflow

- **Draft**: Only visible to admin
- **Pending Review**: Requires super-admin approval
- **Published**: Live on public blog

Super-admins can approve pending posts from the blog management page.

### Public Blog

- **URL**: `/blog`
- **Post URL**: `/blog/{slug}`
- **Category Filter**: `/blog?category={category-slug}`
- **Tag Filter**: `/blog?tag={tag-slug}`
- **Search**: `/blog?search={query}`

## API Endpoints

### Admin Endpoints (require authentication + MANAGE_BLOG)
- `POST /api/blog/admin/posts` - Create post
- `GET /api/blog/admin/posts` - List all posts
- `GET /api/blog/admin/posts/{id}` - Get post
- `PUT /api/blog/admin/posts/{id}` - Update post
- `DELETE /api/blog/admin/posts/{id}` - Delete post
- `PUT /api/blog/admin/posts/{id}/approve` - Approve post (super-admin only)
- `POST /api/blog/upload` - Upload image
- Categories/Tags CRUD: `/api/blog/admin/categories`, `/api/blog/admin/tags`

### Public Endpoints
- `GET /api/blog/posts` - List published posts (with filters)
- `GET /api/blog/posts/{slug}` - Get post by slug
- `GET /api/blog/posts/featured` - Get featured posts
- `GET /api/blog/categories` - List categories
- `GET /api/blog/tags` - List tags
- `GET /api/blog/rss` - RSS feed
- `POST /api/blog/posts/{post_id}/comments` - Submit comment
- `GET /api/blog/posts/{post_id}/comments` - Get approved comments

## Database Collections

- `blog_posts` - Blog posts
- `blog_categories` - Categories
- `blog_tags` - Tags
- `blog_comments` - Comments (optional)

## File Structure

```
backend/
  ├── server.py          # Blog API routes
  └── uploads/           # Uploaded images

frontend/src/
  ├── pages/
  │   ├── admin/
  │   │   ├── BlogManagement.js    # Admin blog dashboard
  │   │   └── BlogPostEdit.js      # Create/edit post
  │   └── blog/
  │       ├── BlogList.js          # Public blog listing
  │       └── BlogPost.js         # Single post page
  └── components/ui/
      └── (existing UI components)
```

## Notes

- Blog posts use slugs for SEO-friendly URLs
- Images are served from `/uploads/` directory
- Comments require moderation before appearing publicly
- RSS feed includes last 50 published posts
- Related posts are based on category and shared tags

## Troubleshooting

**Images not displaying:**
- Check that `backend/uploads/` exists and has correct permissions
- Verify image URLs are correct (should start with `/uploads/` or full URL)

**Permission denied:**
- Ensure sub-admin has `MANAGE_BLOG` permission
- Check user role is `superadmin` or `subadmin`

**Editor not loading:**
- Run `npm install` in frontend directory
- Check browser console for errors

**Posts not appearing:**
- Check post status is "published"
- Verify `published_at` date is in the past (or null)
