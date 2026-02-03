// Simple test to check if the API is working
const http = require("http");

const options = {
  hostname: "localhost",
  port: 5001,
  path: "/health",
  method: "GET",
  timeout: 5000,
};

console.log("Testing API connection...");

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);

  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("Response:", data);
  });
});

req.on("error", (err) => {
  console.error("Error:", err.message);
});

req.on("timeout", () => {
  console.error("Request timeout");
  req.destroy();
});

req.end();
