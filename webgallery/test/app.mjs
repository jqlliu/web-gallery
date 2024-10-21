import fs from "fs";
import * as cm from "chai";
import chaiHttp from "chai-http";

import { server, createTestDb, createTestUploads, deleteTestDb, deleteTestUploads } from "../app.mjs";
import exp from "constants";
import path from "path";

const chai = cm.use(chaiHttp);
const expect = chai.expect;

function testExpect(status, body, done){
  return (err, res) =>{
    //console.log(res);
    if(err){
      console.log(err);
    }
    expect(err).to.be.null;
    expect(res).to.have.status(status);
    for(const [i, v] of Object.entries(body)){
      expect(res.body).to.have.property(i).equals(v);
    }
    done();
  }
}



describe("Testing API", () => {
  before(function () {
    createTestDb();
    createTestUploads();
    
  });

  after(function () {
    deleteTestDb();
    deleteTestUploads();
    server.close();
  });

  it("should create new account", function (done) {
    chai.request.execute(server)
    .post("/api/signup/")
    .set("Content-Type", "application/json")
    .send({username: "a", password: "a"})
    .end(testExpect(200, {username: "a"}, done));;
  }); 
  
  it("should sign out", function (done) {
    chai.request.execute(server)
    .delete("/api/account/")
    .end(testExpect(200, {}, done));;
  }); 
  
  it("should get image with id 1 without signing in fail", function (done) {
    chai.request.execute(server)
    .get("/api/account/a/image/1/")
    .end(testExpect(401, {}, done));;
  });  

  it("should create conflict account fail", function (done) {
    chai.request.execute(server)
    .post("/api/signup/")
    .send({username: "a", password: "a"})
    .end(testExpect(409, {}, done));;
  });   
  it("should create new account b", function (done) {
    chai.request.execute(server)
    .post("/api/signup/")
    .send({username: "a", password: "a"})
    .end(testExpect(409, {}, done));;
  }); 
  
  it("should sign in to a", function (done) {
    chai.request.execute(server)
    .post("/api/signin/")
    .send({username: "a", password: "a"})
    .end(testExpect(200,{}, done));;
  }); 

  it("should post new image to server with id 1", function (done) {
    chai.request.execute(server)
    .post("/api/account/a/image/")
    .field("title", "B")
    .attach("picture", "./test/bliss.jpg", "bliss.jpg")
    .end(testExpect(200, {}, done));;
  });  

  it("should post new image to server as b fail", function (done) {
    chai.request.execute(server)
    .post("/api/account/b/image/")
    .field("author", "A")
    .field("title", "B")
    .attach("picture", "./test/bliss.jpg", "bliss.jpg")
    .end(testExpect(401,{}, done));;
  });  

  it("should post an invalid text file to server fail", function (done) {
    chai.request.execute(server)
    .post("/api/account/a/image/")
    .field("author", "C")
    .field("title", "D")
    .attach("picture", "./test/test.txt", "test.txt")
    .end(testExpect(400, {}, done));;
  });

  it("should get image with id 1", function (done) {
    chai.request.execute(server)
    .get("/api/account/a/image/1/")
    .end(testExpect(200, {}, done));;
  });  
  
  it("should get image with id 2 fail", function (done) {
    chai.request.execute(server)
    .get("/api/account/a/image/2/")
    .end(testExpect(404, {}, done));;
  });  
  
  it("should get image content of select 0", function (done) {
    chai.request.execute(server)
    .get("/api/account/a/image/0/content")
    .end(testExpect(200, {author: "A", title: "B", id: 1}, done));;
  });  
  
  it("should get image content of select 1 fail", function (done) {
    chai.request.execute(server)
    .get("/api/account/a/image/1/content")
    .end(testExpect(404, {}, done));;
  });  
  it("should post new image to server with id 2", function (done) {
    chai.request.execute(server)
    .post("/api/image/")
    .set("Content-Type", "application/json")
    .field("author", "C")
    .field("title", "D")
    .attach("picture", "./test/bliss.jpg", "bliss.jpg")
    .end(testExpect(200, {author: "C", title: "D", id: 2}, done));;
  });  
  
  it("should get empty array of comments for image id 1 page 1", function (done) {
    chai.request.execute(server)
    .get("/api/account/a/image/1/comments/1")
    .end(testExpect(404, {}, done));;
  });  
  it("should add comment to image 1", function (done) {
    chai.request.execute(server)
    .post("/api/account/a/image/1/comments/")
    .send({author: "A", content: "Hello world!"})
    .end(testExpect(200, {author: "A", content: "Hello world!", id: 1}, done));;
  });
  it("should get comments of id 1 page 1", function (done) {
    chai.request.execute(server)
    .get("/api/account/a/image/1/comments/1")
    .end((err, res) =>{
      expect(res).to.have.status(200);
      expect(err).to.be.null;
      expect(res.body).to.have.lengthOf(1)
      done();
    });;
  });  
  it("should get comments of id 1 page 2 fail", function (done) {
    chai.request.execute(server)
    .get("/api/account/a/image/1/comments/2")
    .end(testExpect(404, {}, done));
  });
  it("should delete comment of iid 2 cid 1 fail", function (done) {
    chai.request.execute(server)
    .delete("/api/account/a/image/2/comments/1")
    .end(testExpect(404, {}, done));
  });  
  it("should delete comment of iid 1 cid 1", function (done) {
    chai.request.execute(server)
    .delete("/api/account/a/image/1/comments/1")
    .end(testExpect(200, {}, done));
  });  
  it("should delete image of iid 1", function (done) {
    chai.request.execute(server)
    .delete("/api/account/a/image/1/")
    .end(testExpect(200, {}, done));
  });

});
