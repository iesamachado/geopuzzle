const fs = require('fs');
const http = require('https');

// Test fetch tile of Iberia (Z=5, X=15, Y=12) - approximate
http.get('https://s3.amazonaws.com/elevation-tiles-prod/terrarium/5/15/12.png', (resp) => {
  console.log("Status Code:", resp.statusCode);
  if(resp.statusCode === 200) console.log("OK - AWS responds!");
});
