import {
  createServer
} from "http";
import express from "express";
import Datastore from "nedb";
import multer from "multer";
import path from "path";
import fs from "fs"
import session from "express-session";
import {
  parse,
  serialize
} from "cookie"
import {
  genSalt,
  compare,
  hash
} from "bcrypt";
function ff(req, file, callback) {
  if (file.mimetype.startsWith("image/")) {
    callback(null, true);
  } else {
    callback(null, false);
  }
}

let upload = multer({
  dest: "uploads/",
  fileFilter: ff
});

const PORT = 3000;
const app = express();


const messages = {};
let usersDb = new Datastore({
  filename: "./db/users.db",
  autoload: true,
  timestampData: true
});
let uploadsDb = new Datastore({
  filename: "./db/uploads.db",
  autoload: true,
  timestampData: true
});
let commentsDb = new Datastore({
  filename: "./db/comments.db",
  autoload: true,
  timestampData: true
});
let idDb = new Datastore({
  filename: "./db/ids.db",
  autoload: true,
});
const Account = (function () {
  let id = 1;
  return function item(account, salt, password) {
    //this._id = id++;
    this.username = account.username;

    this.password = password;
    this.salt = salt;
    idDb.update({
      _id: "ID"
    }, {
      $set: {
        accountId: id
      }
    });

  };
})();

const Image = (function () {
  let id = 1;
  return function item(image, file, username) {
    this.picture = file;
    this.author = username;
    this.title = image.title;
    this._id = id++;
    this.upvote = 0;
    idDb.update({
      _id: "ID"
    }, {
      $set: {
        imageId: id
      }
    });
  };
})();

const Comment = (function () {
  let id = 1;
  return function item(message, username, imageId) {

    this._id = id++;
    this.author = username;
    this.content = message.content;
    this.imageId = imageId;
    idDb.update({
      _id: "ID"
    }, {
      $set: {
        commentId: id
      }
    });
  };
})();

idDb.findOne({
  _id: "ID"
}, function (err, docs) {
  if (!err) {
    if (docs) {
      Image.id = docs.imageId;
      Comment.id = docs.commentId;
    } else {
      idDb.insert({
        _id: "ID",
        imageId: 1,
        commentId: 1,
        accountId: 1
      });
    }
  }
});

let isAuthenticated = function (req, res, next) {
  if (!req.username) return res.status(401).end("access denied");
  next();
}

let isAuthorized = function (req, res, next) {
  if (req.username != req.params.username) return res.status(401).end("access denied");
  next();
}


app.use(
  session({
    secret: "2ef75e07c2161dfb17c78c073892b9d3e2a6dca5b87f89e5cb69c5b0f2831225",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.json());

app.use(function (req, res, next) {
  const cookies = parse(req.headers.cookie || "");
  req.username = req.session.username ? req.session.username : null;
  console.log("HTTP request", req.username, req.method, req.url, req.body);
  next();
});

app.use(express.static("static"));

//account


app.get("/api/account/:page", isAuthenticated, function (req, res, next) {
  usersDb.find({}).sort({
    createdAt: -1
  }).skip(parseInt(req.params.page) * 6 - 6).limit(6).exec(function (err, docs) {
    if (docs && docs.length > 0) {
      return res.json(docs);
    } else {
      res.status(404).end("PAGE DOES NOT EXIST")
    }
  });
});

app.delete("/api/account", function (req, res, next) {
  if(req.session.username){
    req.session.username = "";
  }
  res.setHeader(
    "Set-Cookie",
    serialize("username", "", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    }),
  );
  res.status(200).json({
    username: req.username
  })
});

app.post("/api/signin/", function (req, res, next) {
  const username = req.body.username;
  usersDb.findOne({
    username: username
  }, function (err, docs) {
    if (err) return res.status(500).end(err);
    if (!docs) return res.status(401).end("Access denied");
    compare(req.body.password, docs.password, function (err, same) {
      if (err) return res.status(500).end(err);
      if (!same) return res.status(401).end("Access denied");
      req.session.username = username;
      res.setHeader(
        "Set-Cookie",
        serialize("username", username, {
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
        }),
      );
      res.status(200).json({
        username: username
      });
    });

  });
});

app.post("/api/signup", function (req, res, next) {
  const username = req.body.username
  usersDb.findOne({
    username: req.body.username
  }, function (err, docs) {
    if (docs) return res.status(409).end("Username already exists")
    if (err) return res.status(500).end(err);

    genSalt(10, function (err, salt) {
      if (err) res.status(500).end(err);
      hash(req.body.password, salt, function (err, hash) {
        if (err) res.status(500).end(err);
        usersDb.insert(new Account(req.body,salt, hash), function (err, doc) {
          if(err) res.status.json(500).end(err);
          req.session.username = username;
          res.setHeader(
            "Set-Cookie",
            serialize("username", username, {
              path: "/",
              maxAge: 60 * 60 * 24 * 7,
            }),
          );

          res.status(200).json({
            username: req.body.username
          });
        });
      });
    });

  });
});
//uploads
app.get("/api/account/:username/image/:id", isAuthenticated, function (req, res, next) {
  uploadsDb.findOne({
    _id: parseInt(req.params.id),
    author: req.params.username
  }, function (err, docs) {
    if(err) return res.status(500).end(err);
    if (docs) {
      const profile = docs.picture;
      res.setHeader('Content-Type', profile.mimetype);
      return res.sendFile(path.resolve(profile.path));
    } else {
      return res.status(404).end("ID NOT FOUND: " + req.params.id);
    }
  });
});

app.get("/api/account/:username/image/:select/content", isAuthenticated, function (req, res, next) {
  uploadsDb.find({
    author: req.params.username
  }).sort({
    createdAt: 1
  }).skip(parseInt(req.params.select)).limit(1).exec(function (err, docs) {
    if(err) return res.status(500).end(err);
    if (docs.length == 1) {
      return res.json({
        id: docs[0]._id,
        author: docs[0].author,
        title: docs[0].title
      });
    } else {
      res.status(404).end("SELECTION NOT FOUND");
    }
  });
});

app.post("/api/account/:username/image", isAuthenticated, isAuthorized, upload.single("picture"), function (req, res, next) {
  if (req.file) {
    let ins = new Image(req.body, req.file, req.params.username);
    uploadsDb.insert(ins);
    res.status(200).json({
      id: ins._id,
      author: ins.author,
      title: ins.title
    });
  } else {
    res.status(400).end("Invalid image type");
  }
});

app.delete("/api/account/:username/image/:id", isAuthenticated, isAuthorized, function (req, res, next) {
  uploadsDb.findOne({
      _id: parseInt(req.params.id),
      author: req.params.username
    },
    function (err, docs) {
      if (err) return res.status(500).end(err);
      if (docs) {
        fs.unlink(docs.picture.path, function (err) {})
        uploadsDb.remove({
          _id: parseInt(req.params.id)
        }, function (err, num) {
          if (err) return res.status(500).end(err);
          if (num > 0) {
            commentsDb.remove({
              imageId: parseInt(req.params.id)
            }, {
              multi: true
            });

            return res.status(200).json({});
          } else {
            return res.status(404).end("IMAGE NOT FOUND");
          }
        });
      } else {
        return res.status(404).end("IMAGE NOT FOUND");
      }
    }
  )

});

//comments

app.get("/api/account/:username/image/:id/comments/:page", isAuthenticated, function (req, res, next) {
  uploadsDb.findOne({
    _id: parseInt(req.params.id),
    author: req.params.username
  }, function (err, docs) {
    if (docs) {
      commentsDb.find({
        imageId: parseInt(req.params.id)
      }).sort({
        createdAt: -1
      }).skip(parseInt(req.params.page) * 10 - 10).limit(10).exec(function (err, docs) {
        if (docs && docs.length > 0) {
          return res.json(docs);
        } else {
          res.status(404).end("PAGE DOES NOT EXIST")
        }
      });
    } else {
      res.status(404).end("ID NOT FOUND: " + req.params.id);
    }
  });

});
app.delete("/api/account/:username/image/:imageId/comments/:commentId", isAuthenticated, function (req, res, next) {
  commentsDb.findOne({
    _id: parseInt(req.params.commentId),
    author: req.username
  }, function (err, docs) {
    if(err) res.status(500).end(err);
    if (docs && docs.imageId == parseInt(req.params.imageId)) {
      commentsDb.remove({
        _id: parseInt(req.params.commentId)
      });
      res.status(200).json({});
    } else {
      res.status(404).end("ID NOT FOUND: " + req.params.commentId);
    }
  });
});
app.post("/api/account/:username/image/:id/comments", isAuthenticated, function (req, res, next) {
  uploadsDb.findOne({
    _id: parseInt(req.params.id),
    author: req.params.username
  }, function (err, docs) {
    if (err) return res.status(500).end(err);
    if (docs) {
      const c = new Comment(req.body, req.username, parseInt(req.params.id));
      commentsDb.insert(c);
      res.status(200).json({
        id: c._id,
        author: c.author,
        content: c.content
      });
    } else {
      res.status(404).end("ID NOT FOUND: " + req.params.id);
    }
  });
});
let testing = false;

export const server = createServer(app).listen(PORT, function (err) {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});

// TESTING
export function createTestDb() {
  testing = true;
  if (!fs.existsSync("test-db")) {
    fs.mkdirSync("test-db");
  }
  let usersDb = new Datastore({
    filename: "./test-db/users.db",
    autoload: true,
    timestampData: true
  });
  uploadsDb = new Datastore({
    filename: "./test-db/uploads.db",
    autoload: true,
    timestampData: true
  });
  commentsDb = new Datastore({
    filename: "./test-db/comments.db",
    autoload: true,
    timestampData: true
  });
  idDb = new Datastore({
    filename: "./test-db/ids.db",
    autoload: true,
  });
}

export function deleteTestDb() {
  fs.rmSync("test-db", {
    recursive: true,
    force: true
  });
}

export function createTestUploads() {
  testing = true;
  if (!fs.existsSync("test-uploads")) {
    fs.mkdirSync("test-uploads");
  }
  upload = multer({
    dest: "test-uploads/",
    fileFilter: ff
  });

}

export function deleteTestUploads() {
  fs.rmSync("test-uploads", {
    recursive: true,
    force: true
  });
}