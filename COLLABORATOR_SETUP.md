# 🚀 Collaborator Setup Guide

## Profile Picture Functionality Setup

After pulling the latest changes, follow these steps to enable profile picture functionality:

### 1. Backend Setup

```bash
cd backend

# Install dependencies (if needed)
npm install

# Run setup script to create uploads directory
npm run setup

# Start the backend server
npm run dev
```

### 2. Frontend Setup

```bash
# Install dependencies (if needed)
npm install

# Start the frontend
npm run dev
```

### 3. What's New

✅ **Profile Pictures**: Users can now upload and manage profile pictures
✅ **Real-time Updates**: Profile pictures update across all components instantly
✅ **Database Storage**: Images are stored in the database and persist after reload
✅ **File Validation**: Only image files under 5MB are accepted

### 4. Features Available

- **Profile Page**: Upload and manage profile pictures
- **Settings Page**: Profile picture management
- **Header/Navbar**: Shows user's profile picture
- **User Lists**: Display profile pictures for all users
- **User Management**: Admin can see user profile pictures

### 5. File Structure

```
backend/
├── uploads/          # Profile images stored here
├── models/User.js    # Updated with profileImage field
├── controllers/      # New uploadProfileImage function
└── routes/          # New profile image routes

frontend/
├── Profile.tsx      # Profile picture upload
├── Settings.tsx     # Profile picture management
├── Header.tsx       # Navbar profile display
├── UserList.tsx     # User table with profile pictures
└── UserManagement.tsx # Admin user management
```

### 6. API Endpoints

- `POST /api/users/:id/profile-image` - Upload profile picture
- `GET /api/users/:id` - Get user data including profile image
- `PUT /api/users/:id` - Update user profile (existing)

### 7. Troubleshooting

**Issue**: Profile pictures not showing

- **Solution**: Make sure the backend server is running and the uploads directory exists

**Issue**: Upload fails

- **Solution**: Check file size (max 5MB) and file type (images only)

**Issue**: Images not persisting after reload

- **Solution**: Ensure the database connection is working properly

### 8. Database Changes

The User model now includes a `profileImage` field:

```javascript
{
  name: String,
  email: String,
  password: String,
  phone: String,
  departmentOrSector: String,
  profileImage: String,  // NEW FIELD
  role: String,
  // ... other fields
}
```

---

🎉 **That's it!** Profile picture functionality should now work for all collaborators.
