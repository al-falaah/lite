# Student Login Instructions

## Current Student Credentials

**Student ID:** 881095
**Password:** U7BCDFKY

## Login URL

https://www.tftmadrasah.nz/student

## Important Notes

1. **Wait for Deployment**: The latest code changes are being deployed to Vercel right now
   - The login page needs the updated code to handle hashed passwords
   - This usually takes 2-3 minutes

2. **If Login Still Fails**:
   - Clear your browser cache and cookies
   - Try in an incognito/private window
   - Check that you're using the exact credentials above (case-sensitive)

3. **Student Details**:
   - Name: Abdulquadri Alaka
   - Email: abdulquadrialaka@gmail.com
   - Status: Enrolled
   - Program: Essential Arabic & Islamic Studies
   - First Login: Yes (will be prompted to change password)

## What Happens on First Login

1. Enter Student ID: `881095`
2. Enter Password: `U7BCDFKY`
3. You'll be prompted to change your password
4. Set a new secure password (minimum 8 characters)
5. Access your student portal

## Troubleshooting

If you still can't login after deployment completes:

```bash
# Check if deployment is complete
# Go to: https://vercel.com/your-project/deployments

# Or contact admin with error message from browser console
```

## Technical Details

The password is stored as a bcrypt hash in the database:
```
$2b$10$U8yiiyiqiEp8uMqId4in7uQoo/DjYyK4FqtXbCcZg9bMtJM4uf/PG
```

The login system now supports both:
- Plain text passwords (new from webhook)
- Hashed passwords (existing or after password change)
