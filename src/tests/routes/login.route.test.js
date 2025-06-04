const request = require("supertest");
const app = require("../../app");

// Create a fresh mock of poolPromise for each test
jest.mock("../../database/database", () => {
  const mockQuery = jest.fn();
  const mockRequest = () => ({ query: mockQuery });

  return {
    poolPromise: Promise.resolve({
      request: mockRequest,
    }),
    __mockQuery: mockQuery, // expose the mock for control in tests
  };
});

const { __mockQuery } = require("../../database/database");

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    __mockQuery.mockReset();
  });

  it("should return 200 and set token cookie for valid credentials", async () => {
    __mockQuery
      .mockResolvedValueOnce({
        recordset: [{ account: "shoptest1", m_chLoginAuthority: "P" }],
      }) // mock ACCOUNT_TBL_DETAIL
      .mockResolvedValueOnce({
        recordset: [{ account: "shoptest1" }],
      }); // mock ACCOUNT_TBL

    const res = await request(app)
      .post("/api/auth/login")
      .send({ account: "shoptest1", password: "water123" });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers["set-cookie"]).toBeDefined();
  });

  it("should return 400 for invalid user", async () => {
    // Mock ACCOUNT_TBL_DETAIL to return no records
    __mockQuery.mockResolvedValueOnce({ recordset: [] });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ account: "invalidUser", password: "wrong" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/User not found/);
  });
});
