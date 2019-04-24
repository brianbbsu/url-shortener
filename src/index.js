'use strict';

var config = require('./config.json');

const Datastore = require('@google-cloud/datastore');

const datastore = Datastore({
  projectId: config.gcp_project
});

const OAuth2Client = require('google-auth-library').OAuth2Client;
const client = new OAuth2Client(config.OAuth_client_id);
var request = require("request")

function verify(token, success, failed) {
  if (typeof token == "undefined") {
    failed();
  } else request({
    url: "https://www.googleapis.com/oauth2/v1/certs",
    json: true
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      const cert = body;
      let ticket;
      try {
        ticket = client.verifySignedJwtWithCerts(token, cert, config.OAuth_client_id)
      } catch (err) {
        return failed();
      }
      const payload = ticket.getPayload();
      if (config.allowed_user.includes(payload.email)) success(payload.email);
      else failed();
    }
    else failed();
  });
}

function gen_random_string(len) {
  const sigma = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < len; i++)s += sigma[Math.floor(Math.random() * sigma.length)];
  return s;
}

function create(req, res, user) {
  if (!("url" in req.query)) res.status(400).send("Expect 'url' param!!!");
  else if (req.query.url.length === 0) res.status(400).send("URL should NOT be empty!!!");
  else if ("key" in req.query && ! /^[-_a-zA-Z0-9]+$/.test(req.query.key)) res.status(400).send("Param 'key' should match '^[-_a-zA-Z0-9]+$'");
  else if ("key" in req.query) { // Create entry with given key
    let q = datastore.createQuery("url_entry").filter('__key__', '=', datastore.key(["url_entry", req.query.key])).select("__key__");
    datastore.runQuery(q).then(([a]) => {
      console.log(a);
      if (a.length !== 0) res.status(409).send("Url entry with key '" + req.query.key + "' already exist!");
      else datastore.insert({
        key: datastore.key(["url_entry", req.query.key]),
        data: {
          count: 0,
          url: req.query.url,
          creator: user,
          timestamp: new Date()
        }
      }).then(() => {
        res.json({
          status: "Ok",
          original_url: req.query.url,
          shortened_url: config.base_url + req.query.key,
          message: "The URL has been shortened using key '" + req.query.key + "'."
        })
      });
    });
  }
  else {  // Create entry with random generated key
    let q = datastore.createQuery("url_entry").select("__key__");
    datastore.runQuery(q).then(([l]) => {
      do {
        var s = gen_random_string(4);
      } while (l.some(k => { return s === k[datastore.KEY].name; }));
      datastore.insert({
        key: datastore.key(["url_entry", s]),
        data: {
          count: 0,
          url: req.query.url,
          creator: user,
          timestamp: new Date()
        }
      }).then(() => {
        res.json({
          status: "Ok",
          original_url: req.query.url,
          shortened_url: config.base_url + s,
          message: "The URL has been shortened."
        })
      });
    });
  }
}

function query(req, res, user) {
  let q = datastore.createQuery("url_entry").filter("creator", "=", user).select(['__key__', 'url', 'timestamp', 'count']);
  datastore.runQuery(q).then(([entries]) => {
    let data = entries.map((e) => ({
      key: e[datastore.KEY].name,
      shortened_url: config.base_url + e[datastore.KEY].name,
      original_url: e.url,
      timestamp: e.timestamp,
      creator: user,
      count: e.count
    }));
    data.sort((a, b) => {
      if (a.timestamp > b.timestamp) return -1;
      else return 1;
    })
    res.json({
      status: "OK",
      data: data
    })
  });
}

function del(req, res, user) {
  if (!("key" in req.query)) res.status(400).send("Expect 'key' param!!!");
  else {
    datastore.get(datastore.key(["url_entry", req.query.key])).then(([e]) => {
      if (!e) res.status(404).send("Requested entry not found.");
      else if (e.creator !== user) res.status(403).send("You can only delete your own URL.");
      else {
        datastore.delete(datastore.key(["url_entry", req.query.key]));
        res.status(200).json({
          status: "OK"
        });
      }
    });
  }
}

function redirect(req, res) {
  let key = req.query.key;
  key = key.replace(/\?.*$/g, "");
  if (key === "") res.redirect("https://brian.su/url-shortener/");
  else {
    if (key.endsWith('/')) key = key.slice(0, -1);
    datastore.get(datastore.key(["url_entry", key])).then(([e]) => {
      console.log(e);
      if (!e) res.redirect("https://brian.su/url-shortener/not-found?key=" + key);
      else {
        e.count += 1;
        datastore.update(e).then(() => {
          res.redirect(e.url);
        });
      }
    });
  }
}

function operation(req, res, user) {
  let op = req.query.op;
  if (op === "create") create(req, res, user);
  else if (op === "query") query(req, res, user);
  else if (op === "delete") del(req, res, user);
  else res.status(400).send("Unknown Operation");
}

exports.get = (req, res) => {
  res.set('Access-Control-Allow-Origin', "*");
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  if ('op' in req.query) {
    verify(req.query.token,
      (user) => { operation(req, res, user) },
      () => { res.status(403).send("Access Denied!"); });
  }
  else if ('key' in req.query) redirect(req, res);
  else {
    res.status(400).send("Expect 'key' param!!!");
  }
};
