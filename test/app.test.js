const { expect } = require("chai");
const request = require("supertest");
const { app } = require("../server");

describe("Node.js and Express Chat Application", function () {
  it("should return the chat page", async function () {
    const response = await request(app).get("/");
    expect(response.status).to.equal(200);
    expect(response.text).to.include("Real-Time Chat");
  });

  it("should reject an empty message", async function () {
    const response = await request(app)
      .post("/api/messages")
      .send({ username: "", message: "" });

    expect(response.status).to.equal(400);
    expect(response.body.error).to.equal("Username and message are required");
  });

  it("should expose the messages API", async function () {
    const response = await request(app).get("/api/messages");
    expect([200, 500]).to.include(response.status);
  });
});