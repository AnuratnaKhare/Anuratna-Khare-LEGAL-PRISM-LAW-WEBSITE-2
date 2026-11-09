# Legal Prism Law by Anuratna Khare

A responsive static website starter for Legal Prism Law by Anuratna Khare.

## Included
- Responsive homepage and navigation
- Study material categories and searchable sample resource library
- Category and language filters
- Student contribution/upload form (demo only)
- Student login form (demo only)
- Privacy, terms and educational disclaimer starter pages
- No build step or package installation required

## Run locally
Open `index.html` in a browser, or run a local static server:

```bash
python -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy on GitHub Pages
1. Create a new GitHub repository.
2. Upload all files and folders from this project (keep `index.html` at the repository root).
3. Open **Settings → Pages**.
4. Under **Build and deployment**, select **Deploy from a branch**.
5. Select branch `main` and folder `/ (root)`, then Save.
6. Wait for the published URL shown in the Pages settings.

## Deploy on Netlify
1. Sign in to Netlify.
2. Choose **Add new site → Deploy manually**.
3. Drag the extracted project folder into the deployment area.
4. Netlify will provide a live URL.

## Deploy on Vercel
1. Push this project to GitHub.
2. Import the repository in Vercel.
3. Use the default static deployment settings; no build command is required.
4. Deploy.

## Important: demo vs production
This package is a ready-to-host **frontend starter**, not a complete multi-user production backend.

- The upload form currently saves submission metadata in the current browser's `localStorage`. It does not upload files to cloud storage or make them visible to other users.
- Login is a UI demonstration only. It does not create secure user accounts.
- Sample library entries are illustrative placeholders. Verify and replace them before publishing.
- Admin approval, real student accounts, shared uploads, online tests, news feeds, and persistent content management require a backend, database, authentication and file storage.

For production, connect a backend such as Supabase or Firebase (authentication, database, storage and access rules) or build a custom API. Never put service-role keys or private credentials in browser JavaScript. Configure file-size/type validation, malware scanning, access control, backups, privacy policy and copyright/takedown processes.

## Customise
- Change site name and text in `index.html`.
- Edit colours, layout and responsive styles in `styles.css`.
- Edit sample resources and demo interactions in `app.js`.
- Replace `hello@example.com` with your official contact email.
- Replace all policy templates with policies matching your actual service.


## Branding and media contribution updates
- Brand: **Legal Prism Law by Anuratna Khare**
- Tagline: **Your Legal Expert**
- YouTube: https://www.youtube.com/@ANURATNAkharelaw
- Instagram: https://www.instagram.com/legalprismlaw/
- Instagram: https://www.instagram.com/anuratnakharelaw/

The contribution form now includes document/image/audio/video file selection, a media type field, a YouTube URL field, and an external media URL field. The frontend accepts common formats including MP3, WAV, OGG, M4A, AAC, FLAC, MP4, MOV, WEBM, AVI, MKV, WMV, 3GP, MPEG, plus common documents and images. Actual upload limits and codec/container support must be validated by the backend and hosting provider. Do not assume every browser can preview every media format.
