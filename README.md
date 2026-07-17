# Family Tree App

A web application to create a **family tree** visually and store biodata for each family member. It supports genealogical input across generations, including the **first ancestors (grandfather & grandmother)**, children, and spouses.

> Note: The implementation includes a local backend (Express) for **photo upload/delete** (Google Drive) and **Firebase/Firestore** integration for family tree data.

---

## Key Features

- **Family Tree Management**
  - Add the **first ancestors** (Grandfather & Grandmother) in couple mode.
  - Add **children** (single or couple).
  - Add a **spouse** for a family member.
  - Edit existing family members.
- **Biodata Input Form**
  - Full name
  - Date of birth
  - Address
  - Phone number
  - Deceased status + optional death date
  - Upload profile photo
- **Photo Integration**
  - Automatic image compression before upload to avoid payload limits.
  - Backend endpoints for:
    - photo upload
    - photo delete
- **Visualization**
  - Uses a graph/diagram to display family relationships.

---

## Tech Stack

- **Frontend**
  - React + Vite
  - TailwindCSS
  - React Flow (visual graph)
  - Lucide React (icons)
- **Backend (local API)**
  - Node.js + Express
  - Upload/delete/proxy endpoints for photo storage needs
- **Data**
  - Firebase (e.g. Firestore) for member data storage
  - Google Drive (for photos) via server handlers

---

## Prerequisites

- Node.js (compatible with Vite 5)
- A Firebase account/project (Firestore)
- Google Drive credentials/account (for upload/delete photos)
- A `.env` configuration file (see **Environment Variables**)

---

## Project Structure

- `family-tree-app/`
  - `src/`: React components & app logic
  - `server.js`: local Express backend for photo endpoints
  - `api/`: API handlers (upload/delete/proxy)
  - `package.json`: dependencies & scripts

---

## Environment Variables

Create a `.env` file inside `family-tree-app/`.

Example (adjust to your project configuration):

```bash
# Backend / API
API_PORT=3000

# Firebase
# (Example: adjust to the format used in src/config/firebase.js)
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_PROJECT_ID=...
FIREBASE_STORAGE_BUCKET=...
FIREBASE_MESSAGING_SENDER_ID=...
FIREBASE_APP_ID=...

# Google Drive / Photo upload
# (Adjust to what api/upload.js & api/delete.js expect)
GOOGLE_CLIENT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_DRIVE_FOLDER_ID=...
```

> If your environment variable names differ, align them with your implementation in:
> - `family-tree-app/src/config/`
> - `family-tree-app/api/`

---

## How to Run

### 1) Install dependencies
```bash
cd family-tree-app
npm install
```

### 2) Start the frontend (dev server)
```bash
npm run dev
```

Frontend typically runs at:
- `http://localhost:5173`

### 3) Start the local backend (API server)
There is an `api` script in `package.json`.

```bash
npm run api
```

Backend runs at:
- `http://localhost:${API_PORT}` (default 3000)

Backend endpoints:
- `POST /api/upload`
- `POST /api/delete`
- `GET /api/proxy`

---

## Production Build

```bash
npm run build
npm run preview
```

---

## UI Usage (Quick Guide)

1. Open the application.
2. Choose an action to add members:
   - **Add First Ancestors**
   - **Add Child**
   - **Add Spouse**
3. Fill the biodata form:
   - Name, date of birth, address, phone number
   - Photo (optional)
   - Deceased/death date (optional)
4. Save.
5. The family tree will display a new node with relationships based on your input.

---

## Gender Input Behavior (Ancestors)

In the **ancestor input modal** (root couple):
- the **“Gender”** selector is **hidden** because:
  - **Grandfather** and **Grandmother** are already separated into different tabs (**Grandfather/Husband** vs **Grandmother/Wife**),
  - so gender is determined by the selected tab.

For other modes (e.g. adding a child or a single spouse), the gender selector remains visible.

---

## Troubleshooting

### A) Photo upload fails
- Ensure the Express backend is running (`npm run api`)
- Check `.env` for Google Drive credentials
- Confirm the target Drive folder exists (folder ID) and the credentials have access

### B) Family tree data not appearing / Firestore errors
- Confirm Firebase configuration in `.env`
- Ensure Firestore rules allow the required access

### C) Build fails
- Ensure your Node.js version is compatible with Vite/React
- Re-run `npm install`

---

## Contributing

If you want to contribute:
1. Create a new branch
2. Make changes
3. Open a pull request

---

## License

Add your project license here (e.g. MIT / Apache-2.0).
