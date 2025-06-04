const request = require("supertest");
const app = require("../../app")

describe("Index Routes", () => {
  it("GET /health-check should return 'Server is ok'", async () => {
    const res = await request(app).get("/api/health-check");
    expect(res.statusCode).toBe(200);
    expect(res.text).toBe("Server is ok");
  });
});
