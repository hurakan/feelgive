#!/bin/bash

echo "=== Frontend Diagnostics ==="
echo ""

echo "1. Checking if frontend server is responding..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173)
echo "   HTTP Status Code: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Server is responding"
else
    echo "   ❌ Server not responding correctly"
fi

echo ""
echo "2. Checking if we can fetch the HTML..."
HTML_LENGTH=$(curl -s http://localhost:5173 | wc -c)
echo "   HTML Response Length: $HTML_LENGTH bytes"

if [ "$HTML_LENGTH" -gt 100 ]; then
    echo "   ✅ HTML is being served"
else
    echo "   ❌ HTML response is too small or empty"
fi

echo ""
echo "3. Checking for common frontend files..."
curl -s -o /dev/null -w "   /src/main.tsx: %{http_code}\n" http://localhost:5173/src/main.tsx
curl -s -o /dev/null -w "   /index.html: %{http_code}\n" http://localhost:5173/index.html

echo ""
echo "4. Sample of HTML response:"
curl -s http://localhost:5173 | head -20

echo ""
echo "=== Next Steps ==="
echo "If you see a blank page in browser:"
echo "1. Open browser DevTools (F12)"
echo "2. Check Console tab for JavaScript errors"
echo "3. Check Network tab to see if files are loading"
echo "4. Look for any red errors"
echo ""
echo "Common issues:"
echo "- JavaScript error preventing app from mounting"
echo "- Missing environment variables"
echo "- Build/compilation errors"
echo "- CORS issues with backend"