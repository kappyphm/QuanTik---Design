// Test-only upstream for server-rendered admin access checks. Never used by the app runtime.
import { createServer } from "node:http";
const port = Number(process.env.E2E_ADMIN_PORT || 3117);
createServer((request, response) => {
  response.setHeader("Content-Type", "application/json");
  if (request.url === "/health") { response.end('{"ready":true}'); return; }
  if (request.url === "/api/v1/admin/me" && request.headers.authorization === "Bearer fixture-access-only") {
    response.end(JSON.stringify({ id: "fixture-admin", role: "admin", username: "operator" })); return;
  }
  response.statusCode = 401; response.end('{"code":"UNAUTHENTICATED"}');
}).listen(port, "127.0.0.1");
