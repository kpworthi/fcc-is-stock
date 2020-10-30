/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');
var { MongoClient } = require('mongodb');

chai.use(chaiHttp);

suite('Functional Tests', function() {
    
    suite('GET /api/stock-prices => stockData object', function() {
      
      test('1 stock', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog'})
        .end(function(err, res){
          let { stockData } = res.body;
          
          assert.isObject(stockData, 'GET response "stockData" should be an object');
          assert.equal(stockData["stock"], 'GOOG', 'Stock "name" should be GOOG');
          assert.isString(stockData["stock"], 'Stock "name" should be a string');
          assert.isNumber(stockData["price"], 'Stock "price" should be a number');
          assert.notEqual(stockData["price"].toString().indexOf('.'), -1, 'Stock "price" should be a decimal number')
          assert.isNumber(stockData["likes"], 'Stock "likes" should be a number');
          assert.equal(stockData["likes"].toString().indexOf('.'), -1, 'Stock "likes" should be an int');
          
          done();
        });
      });
      
      test('1 stock with like', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'int', like: true})
        .end(function(err, res){
          let { stockData } = res.body;
          
          assert.isObject(stockData, 'GET response "stockData" should be an object');
          assert.equal(stockData["stock"], 'INT', 'Stock "name" should be INT');
          assert.isString(stockData["stock"], 'Stock "name" should be a string');
          assert.isNumber(stockData["price"], 'Stock "price" should be a number');
          assert.notEqual(stockData["price"].toString().indexOf('.'), -1, 'Stock "price" should be a decimal number')
          assert.isNumber(stockData["likes"], 'Stock "likes" should be a number');
          assert.equal(stockData["likes"].toString().indexOf('.'), -1, 'Stock "likes" should be an int');
          assert.equal(stockData["likes"], 1, 'Stock "likes" should be 1');
          
          done();
        });
      });
      
      test('1 stock with like again (ensure likes arent double counted)', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'int', like: true})
        .end(function(err, res){
          let { stockData } = res.body;
          
          assert.isObject(stockData, 'GET response "stockData" should be an object');
          assert.equal(stockData["stock"], 'INT', 'Stock "name" should be INT');
          assert.isString(stockData["stock"], 'Stock "name" should be a string');
          assert.isNumber(stockData["price"], 'Stock "price" should be a number');
          assert.notEqual(stockData["price"].toString().indexOf('.'), -1, 'Stock "price" should be a decimal number')
          assert.isNumber(stockData["likes"], 'Stock "likes" should be a number');
          assert.equal(stockData["likes"].toString().indexOf('.'), -1, 'Stock "likes" should be an int');
          assert.equal(stockData["likes"], 1, 'Stock "likes" should still be 1');
          deleteStock();
          
          done();
        });
      });

      //remove the db entry for 'INT' and 'INTL' to allow for repeat testing.
      async function deleteStock(){
        const CONNECTION_STRING = process.env.DB;
        var client = new MongoClient(CONNECTION_STRING, { useNewUrlParser: true, useUnifiedTopology: true });

        try {
          await client.connect();
          await client.db('stocks').collection('likes').deleteOne({"name": "INT"});
          await client.db('stocks').collection('likes').deleteOne({"name": "INTL"});
        } catch (err) {
          console.error(err);
        } finally {
          await client.close();
        }
      }
      test('2 stocks', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: ['GOOG','TSLA']})
        .end(function(err, res){
          let { stockData } = res.body;
          
          assert.isArray(stockData, 'GET response "stockData" should be an array');
          assert.include([stockData[0]["stock"],stockData[1]["stock"]], 'GOOG', 'Stock array should include GOOG');
          assert.include([stockData[0]["stock"],stockData[1]["stock"]], 'TSLA', 'Stock array should include TSLA');
          assert.equal(stockData.length, 2, 'Array should have two items in it');
          assert.isString(stockData[0]["stock"], 'Stock "name" should be a string');
          assert.isNumber(stockData[0]["price"], 'Stock "price" should be a number');
          assert.notEqual(stockData[0]["price"].toString().indexOf('.'), -1, 'Stock "price" should be a decimal number')
          assert.isNumber(stockData[0]["rel_likes"], 'Stock "rel_likes" should be a number');
          assert.equal(stockData[0]["rel_likes"].toString().indexOf('.'), -1, 'Stock "likes" should be an int');
          assert.equal(stockData[0]["rel_likes"], 0-stockData[1]["rel_likes"], 'Relative likes should be the inverse of the other.')
          done();
        });
      });
      
      test('2 stocks with like', function(done) {
       chai.request(server)
        .get('/api/stock-prices')
        .query({stock: ['INT','INTL'], like: true})
        .end(function(err, res){
          let { stockData } = res.body;
          
          assert.isArray(stockData, 'GET response "stockData" should be an array');
          assert.include([stockData[0]["stock"],stockData[1]["stock"]], 'INT', 'Stock array should include INT');
          assert.include([stockData[0]["stock"],stockData[1]["stock"]], 'INTL', 'Stock array should include INTL');
          assert.equal(stockData.length, 2, 'Array should have two items in it');
          assert.isString(stockData[0]["stock"], 'Stock "name" should be a string');
          assert.isNumber(stockData[0]["price"], 'Stock "price" should be a number');
          assert.notEqual(stockData[0]["price"].toString().indexOf('.'), -1, 'Stock "price" should be a decimal number')
          assert.isNumber(stockData[0]["rel_likes"], 'Stock "rel_likes" should be a number');
          assert.equal(stockData[0]["rel_likes"].toString().indexOf('.'), -1, 'Stock "likes" should be an int');
          assert.equal(stockData[0]["rel_likes"], 0-stockData[1]["rel_likes"], 'Relative likes should be the inverse of the other.')
          assert.equal()
          done();
        });
      });
      
    });

});
