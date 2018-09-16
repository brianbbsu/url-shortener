'use strict';

const Datastore = require('@google-cloud/datastore');

const datastore = Datastore({
  projectId: "url-redirect-bb",
  keyFilename: "url-redirect-bb-0094c14a4e88.json"
});

const OAuth2Client = require('google-auth-library').OAuth2Client;
const client = new OAuth2Client("932478565653-a54e4pb8auqb6p0jo0kqnjdbqpuchnuq.apps.googleusercontent.com");
var request = require("request")

function verify(token, success, failed){
  if(typeof token == "undefined"){
    failed();
  }else request({
    url: "https://www.googleapis.com/oauth2/v1/certs",
    json: true
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      const cert = body;
      let ticket;
      try{
        ticket = client.verifySignedJwtWithCerts(token,cert,"932478565653-a54e4pb8auqb6p0jo0kqnjdbqpuchnuq.apps.googleusercontent.com")
      }catch(err){
        return failed();
      }
      const payload = ticket.getPayload();
      if(payload.email === "brianbb.su@gmail.com")success();
      else failed();
    }
    else failed();
  });
}

function gen_random_string(len){
  const sigma = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for(let i = 0;i < len;i++)s += sigma[Math.floor(Math.random() * sigma.length)];
  return s;
}

function create(req,res){
  if(!("url" in req.query))res.status(400).send("Expect 'url' param!!!");
  else if(req.query.url.length === 0)res.status(400).send("Param 'url' should NOT be empty!!!");
  else if("key" in req.query && ! /^[-_a-zA-Z0-9]+$/.test(req.query.key))res.status(400).send("Param 'key' should match '^[-_a-zA-Z0-9]+$'");
  else if("key" in req.query){
    let q = datastore.createQuery("url_entry").filter('__key__','=',datastore.key(["url_entry",req.query.key])).select("__key__");
    datastore.runQuery(q).then(([a]) => {
      console.log(a);
      if(a.length !== 0)res.status(409).send("Url entry with key '" + req.query.key + "' already exist!");
      else datastore.insert({
        key: datastore.key(["url_entry", req.query.key]),
        data: {
          count: 0,
          url: req.query.url
        }
      }).then(() => {res.json({
        status: "Ok",
        original_url: req.query.url,
        shortened_url: "https://brian.su/r/" + req.query.key,
        message: "The URL has been shortened using key '" + req.query.key + "'."
      })});
    });
  }
  else{
    let q = datastore.createQuery("url_entry").select("__key__");
    datastore.runQuery(q).then(([l]) => {
      do {
        var s = gen_random_string(4);
      }while(l.some(k => {return s === k[datastore.KEY].name;}));
      datastore.insert({
        key: datastore.key(["url_entry", s]),
        data: {
          count: 0,
          url: req.query.url
        }
      }).then(() => {res.json({
        status: "Ok",
        original_url: req.query.url,
        shortened_url: "https://brian.su/r/" + s,
        message: "The URL has been shortened."
      })});
    });
  }
}

function operation(req, res){
  let op = req.query.op;
  if(op === "create")create(req,res);
}

exports.get = (req, res) => {
  res.set('Access-Control-Allow-Origin', "*");
  res.set('Access-Control-Allow-Methods', 'GET, POST');
  if('op' in req.query){
    verify(req.query.token,
      () => {operation(req,res)},
      () => {res.status(403).send("Access Denied!");});
  }else if('key' in req.query){
    let key = req.query.key;
    if(key === "")res.send("empty~");
    else {
      if(key.endsWith('/'))key = key.slice(0, -1);
      datastore.get(datastore.key(["url_entry",key])).then(([e]) => {
        console.log(e);
        if(!e)res.status(404).send("Not Found!!!");
        else{
          e.count += 1;
          datastore.update(e).then(() => {
            res.redirect(e.url);
          });
        }
      });
    }
  } else {
    res.status(400).send("Expect 'key' param!!!");
  }
};