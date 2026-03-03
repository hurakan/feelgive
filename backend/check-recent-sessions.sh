#!/bin/bash

echo "Checking for recent sessions in database..."
echo ""

# Get the most recent 5 sessions
docker exec mongodb mongosh analytics_db --quiet --eval "
  db.analyticssessions.find()
    .sort({ startTime: -1 })
    .limit(5)
    .forEach(function(doc) {
      print('Session ID: ' + doc.sessionId);
      print('  Start Time: ' + doc.startTime);
      print('  City: ' + doc.city);
      print('  Country: ' + doc.country);
      print('  Device: ' + doc.deviceType);
      print('  Browser: ' + doc.browser);
      print('  ---');
    });
" 2>/dev/null || echo "Could not query MongoDB"

echo ""
echo "Total sessions in database:"
docker exec mongodb mongosh analytics_db --quiet --eval "
  db.analyticssessions.countDocuments()
" 2>/dev/null || echo "Could not query MongoDB"
