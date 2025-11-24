#!/bin/bash

echo "🎨 Updating branding to Al-Falaah Academy"
echo "=========================================="
echo ""

# Update all frontend files
echo "📱 Updating frontend files..."

# Update App.jsx title
sed -i.bak 's/Al-Falaah Islamic Institute/Al-Falaah Academy/g' src/App.jsx

# Update Landing Page
sed -i.bak 's/Al-Falaah Islamic Institute/Al-Falaah Academy/g' src/pages/LandingPage.jsx
sed -i.bak 's/Islamic Institute/Academy/g' src/pages/LandingPage.jsx

# Update Application Page
sed -i.bak 's/Al-Falaah Islamic Institute/Al-Falaah Academy/g' src/pages/ApplicationPage.jsx

# Update Admin Dashboard
sed -i.bak 's/Al-Falaah Islamic Institute/Al-Falaah Academy/g' src/pages/AdminDashboard.jsx

# Update index.html
sed -i.bak 's/Al-Falaah Islamic Institute/Al-Falaah Academy/g' index.html

echo "📧 Updating email functions..."

# Update email functions
sed -i.bak 's/Al-Falaah Islamic Institute/Al-Falaah Academy/g' supabase/functions/send-application-confirmation/index.ts
sed -i.bak 's/Al-Falaah Islamic Institute/Al-Falaah Academy/g' supabase/functions/send-welcome-email/index.ts
sed -i.bak 's/Al-Falaah Islamic Institute/Al-Falaah Academy/g' supabase/functions/send-daily-digest/index.ts
sed -i.bak 's/Islamic Institute/Academy/g' supabase/functions/send-daily-digest/index.ts

# Update package.json
sed -i.bak 's/"name": "alfalaah"/"name": "alfalaah-academy"/g' package.json
sed -i.bak 's/"description": "Al-Falaah Islamic Institute management system"/"description": "Al-Falaah Academy management system"/g' package.json

# Update README
sed -i.bak 's/Al-Falaah Islamic Institute/Al-Falaah Academy/g' README.md
sed -i.bak 's/Islamic Institute/Academy/g' README.md

# Clean up backup files
find . -name "*.bak" -type f -delete

echo ""
echo "✅ Branding updated to Al-Falaah Academy!"
echo ""
echo "📝 Next: Review changes with: git diff"
