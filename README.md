# web-apps

A personal web portal built and maintained by **Muhammed Sajeed** — Multi Cloud Solution Architect & PeopleSoft DBA based in Kochi, Kerala, India.

The project consists of a public-facing profile/landing page and a private portal of personal productivity tools, all served as static HTML files on AWS infrastructure.

**Live site:** https://sajeed.online

---

## Project Overview

The portal is split into two parts:

- **Public landing page** (`index.html`) — A professional profile page showcasing experience, skills, certifications, and a contact form. Accessible to anyone at `https://sajeed.online`.
- **Private portal** — A set of personal tools and trackers accessible only to logged-in users. Authentication is handled via AWS API Gateway + Lambda.

---

## Pages

### Public
| File | Description |
|------|-------------|
| `index.html` | Landing page — profile, skills, experience, certifications, contact form |

### Portal (requires login)
| File | Description |
|------|-------------|
| `login.html` | User login with portal feature overview |
| `register.html` | New user registration |
| `dashboard.html` | Main dashboard — links to all portal tools |
| `admin.html` | Admin panel |
| `todo-list.html` | Personal to-do list manager |
| `prayer-times.html` | Daily prayer times tracker |
| `electricity-tracker.html` | KSEB electricity usage tracker |
| `utilities.html` | Live exchange rates (USD/AED → INR) and gold/silver prices |

### Assets
| File | Description |
|------|-------------|
| `assets/profile.jpeg` | Profile photo used on landing page |
| `config.js` | Auto-generated — sets `window.API_BASE` to the API Gateway endpoint |
| `session-guard.js` | Enforces login session across all portal pages |

---

## AWS Architecture

```
User
 │
 ▼
Route 53 (sajeed.online)
 │  Alias records → CloudFront
 ▼
CloudFront (E3K41WVH8F6W8U)
 │  HTTPS · HTTP → HTTPS redirect · ACM SSL (us-east-1)
 │  Edge location: ap-south-1 (Mumbai)
 ▼
S3 Bucket (sajeed.online · ap-south-1)
 │  Static website hosting · index: index.html
 │
 ├── index.html, login.html, dashboard.html ...
 └── assets/profile.jpeg

Contact Form
 │
 ▼
API Gateway (1dcu9kqzz9 · ap-south-1)
 │  POST /contact
 ▼
Lambda (sajeed-contact-form · ap-south-1)
 │  Python 3.12
 ▼
SES (ap-south-1)
 │  From: noreply@sajeed.online (DKIM verified)
 └─→ Delivers to: sajeedmoh@gmail.com

Auth API
 │
 ▼
API Gateway (1dcu9kqzz9 · ap-south-1)
 │  /api/auth/login · /api/auth/register
 ▼
Lambda (my-test-repo-auth · ap-south-1)
```

### Key Resources

| Resource | Details |
|----------|---------|
| **Domain** | `sajeed.online` |
| **S3 Bucket** | `sajeed.online` — ap-south-1 |
| **CloudFront** | Distribution ID: `E3K41WVH8F6W8U` |
| **ACM Certificate** | `us-east-1` (required for CloudFront) |
| **Route 53 Hosted Zone** | `Z0203875PFJKDJ52QM2T` |
| **API Gateway** | `https://1dcu9kqzz9.execute-api.ap-south-1.amazonaws.com` |
| **Contact Lambda** | `sajeed-contact-form` — ap-south-1 |
| **SES Sender** | `noreply@sajeed.online` |
| **AWS Account** | `639408967992` |
| **IAM User** | `sajeedrepo` |

---

## Deployment

Every change must be deployed to **both** GitHub and S3:

```bash
# 1. Push to GitHub
git add <files>
git commit -m "your message"
git push origin main

# 2. Sync to S3
aws s3 cp <file> s3://sajeed.online/<file>
# or for multiple files:
aws s3 sync . s3://sajeed.online/ --exclude ".git/*"

# 3. Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E3K41WVH8F6W8U \
  --paths "/*"
```

---

## AWS Budget

Monthly budget set to **$5.00 USD** with email alerts at every 5% from 55% to 100%, sent to `sajeedmoh@gmail.com`.

Expected monthly cost: ~$0.50–$1.50 for current traffic levels.
