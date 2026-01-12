#!/bin/bash

echo "🚀 Expense Tracker - Quick Deploy Script"
echo "========================================="
echo ""

# Check if dist folder exists
if [ ! -d "dist" ]; then
    echo "📦 Building web app..."
    npx expo export -p web
fi

echo ""
echo "✅ Web build ready in ./dist folder"
echo ""
echo "Choose deployment option:"
echo "1) Deploy to Vercel (recommended)"
echo "2) Deploy to Netlify"
echo "3) Build Android APK"
echo "4) Exit"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🔐 Logging into Vercel..."
        npx vercel login
        echo ""
        echo "🚀 Deploying to Vercel..."
        cd dist && npx vercel --prod
        ;;
    2)
        echo ""
        echo "📤 To deploy to Netlify:"
        echo "1. Go to https://app.netlify.com/drop"
        echo "2. Drag the 'dist' folder to the page"
        echo "3. Done! You'll get a free URL"
        open https://app.netlify.com/drop
        ;;
    3)
        echo ""
        echo "🔐 Logging into Expo..."
        npx eas-cli login
        echo ""
        echo "⚙️  Configuring EAS..."
        npx eas-cli build:configure
        echo ""
        echo "📱 Building APK..."
        npx eas-cli build -p android --profile preview
        ;;
    4)
        echo "Bye! 👋"
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
