LINK BUILDERS WEBSITE — UPDATED PACKAGE

Files
- index.html: website with responsive photo section and floating Link Builders AI chat interface.
- functions/api/chat.js: Cloudflare Pages Function for AI responses and a 100-message daily allowance.
- README.txt: setup notes.

IMPORTANT: The chat widget needs Cloudflare Pages Functions, a Workers AI binding and a KV namespace. Uploading only index.html to a basic static host will show the chat button but will not power its replies.

CLOUDFLARE PAGES SETUP
1. Push/upload the contents of this ZIP into the root of your GitHub repository. Keep the "functions" folder at the repository root, next to index.html.
2. In Cloudflare, go to Workers & Pages > Create application > Pages > Connect to Git, and select your repository.
3. Build settings for this plain HTML site:
   - Framework preset: None
   - Build command: leave blank
   - Build output directory: /
   If the dashboard requires a directory value, use ".".
4. Deploy the Pages project.
5. In the Pages project, open Settings > Bindings (or Functions settings, depending on the dashboard layout).
6. Add a Workers AI binding with variable name: AI
7. Create a KV namespace, for example LINK_BUILDERS_RATE_LIMIT.
8. Add a KV namespace binding with variable name: RATE_LIMIT_KV and select that namespace.
9. Redeploy the Pages project after adding bindings.

AI AND DAILY LIMIT
- Model: Cloudflare Workers AI, @cf/meta/llama-3.1-8b-instruct.
- Scope: link building and related SEO only. Unrelated questions receive a polite scope reminder.
- Limit: 100 successful AI responses per visitor per UTC day, enforced on the server.
- Visitor identification uses a secure first-party cookie combined with the visitor IP. People sharing the same browser cookie and network can share a quota; clearing cookies or changing devices/networks may create a new visitor identity. This is a practical basic limit, not strong identity verification.
- Cloudflare's AI and Pages/KV free allowances and model availability can change. Usage beyond free allowances may require a paid plan. Check your Cloudflare dashboard before launch.
- The count increments only after a successful AI response. The first answer of a day reports remaining 99.
- The backend does not expose an API key in browser code.

IMAGES
The added photo cards use externally hosted Unsplash image URLs and need an internet connection. For a fully self-contained site, download licensed image files and host them in your repository.

BEFORE PUBLIC LAUNCH
- Replace hello@linkbuilders.com with your real business email.
- Verify the domain and canonical URL.
- Add a privacy policy explaining chat processing, cookies, and visitor message-limit tracking.
- Test mobile layout, the contact form, all navigation links, and the chat.
- Do not advertise guaranteed rankings or guaranteed link placements unless your business can substantiate those claims.
