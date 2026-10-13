# Ration Hub — mobile-first prototype

## Files
- `index.html` — page structure
- `style.css` — responsive styling
- `app.js` — demo logic and local storage

## Run on Android
1. Create a folder named `Ration Hub`.
2. Put all three files in the same folder.
3. Open `index.html` in Chrome or an HTML preview app. For camera input and best browser compatibility, use a local web server/preview app if your browser blocks file access.
4. Internet is needed to load Tesseract.js OCR and Google Fonts. Core shopping demo features use browser localStorage.

## Included
- Customer product browsing, search, category filters, cart, checkout and COD.
- Shopkeeper profile, product list OCR via camera/upload, manual paste fallback, editable draft products and publish.
- Optional individual product photos.
- Delivery partner registration form and dashboard.
- Order status, cancellation, in-demo notifications, responsive phone layout.

## Important limitations
This is a front-end demo, not a production marketplace. Data stays in one browser/device. It does NOT send real OTP/SMS, cross-device notifications, or server-side order alerts. Demo number verification is simulated. For a real launch, add a backend/database, secure authentication, shopkeeper/delivery/customer roles, server APIs, and push/SMS notifications. Do not store sensitive identity documents in this demo.

OCR tip: take a sharp, straight, well-lit photo with product names and prices on separate rows, e.g. `Rice, 55`. OCR can misread handwriting and prices. Review every row before publishing. A paper price list cannot create true product photos; upload each product photo separately if you want actual item photos.
