/*
*       Post testing and submission, api was modified to return stock price
*       as a type: number instead of a type: string for ease of use.
*/

'use strict';

var expect = require('chai').expect;
var { MongoClient } = require('mongodb');
const https = require('https');

async function connection(callback) {
  const CONNECTION_STRING = process.env.DB;
  var client = new MongoClient(CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    await callback(client)
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

module.exports = function (app) {

  app.route('/api/stock-prices')

    //GET stock prices
    .get(function (req, res) {
      const query = req.query,
            reqIP = req.ip;

      var stockRes = '',
          updLikes = query.like ? true : false;
      //flag for one or two stocks. if single, while will only do one pass.
      const multiFlag = typeof query.stock === 'object'?true:false;
      var  multiTrack = multiFlag? 0 : 1;
      if (multiFlag)
        var  multiArr = [];

      while (multiTrack < 2) {
        const symbol = multiFlag?query.stock[multiTrack].concat('/quote'):query.stock.concat('/quote'),
              options = {
                hostname: 'stock-price-checker-proxy.freecodecamp.rocks',
                port: 443,
                path: '/v1/stock/'.concat(symbol),
                method: 'GET'
              },

          //get the stock price from the fCC provided API
          request = https.request(options, response => {
            let body = '';
            response.on('data', dataChunk => {
              body += dataChunk;
            });
            response.on('end', async function () {
              stockRes = body;

              //if stock is not valid, don't enter db call, send error.
              if(JSON.parse(stockRes) === "Unknown symbol"){
                res.send('Error: Invalid stock entered.')
                return null;
              }
              else let { "symbol": stock, "latestPrice": price } = JSON.parse(stockRes);

              connection(async function (client) {
                //get DB entry if it exists, make it if it doesn't.
                //would find/modify/upsert, but can't add ip's via atomic op (easily)
                let dbResult = await client.db('stocks').collection('likes').findOne({ name: stock });
                if (dbResult === null)
                  dbResult = { "name": stock, "likes": 0, "ipList": [] }
                if (updLikes && !dbResult.ipList.includes(reqIP)) {
                  dbResult.ipList.push(reqIP)
                  dbResult.likes++;
                }
                //update the entry
                await client.db('stocks').collection('likes').updateOne({ name: stock }, { $set: dbResult }, { upsert: true })

                if (multiFlag){
                  multiArr.push({"stock": stock, "price": price, "rel_likes": dbResult.likes});
                  if (multiArr.length === 2){
                    multiArr[0]["rel_likes"] = multiArr[0]["rel_likes"] - multiArr[1]["rel_likes"];
                    multiArr[1]["rel_likes"] = 0 - multiArr[0]["rel_likes"];
                    res.json({ "stockData": multiArr });
                  }
                }
                else {
                  res.json({ "stockData": { "stock": stock, "price": price, "likes": dbResult.likes } })
                }
              });
            });
          });
        request.on('error', error => {
          console.error(error)
        });
        request.end();
        multiTrack++;
      }
    });
};