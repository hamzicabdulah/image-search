var express = require('express'), 
app = express(),
request = require('request');

var MongoClient = require('mongodb').MongoClient;
//URL and CLIENT_ID are saved as environment variables in the Heroku config to protect username and password
var URL = process.env.MONGOLAB_URI,
CLIENT_ID = process.env.CLIENT_ID;


//Setting variables for using Imgur Gallery API
var apiHost = "http://i.imgur.com/",
options = {  
    url: '',
    method: 'GET',
    headers: {
        'Authorization': 'Client-ID ' + CLIENT_ID
    }
};

MongoClient.connect(URL, function(err, db) {
    if (err) return console.log(err);
    var collection = db.collection('latest-searches');
    
    app.get('/api/latest', function(req, res) {
        collection.find({}, {_id: 0, term: 1, when: 1}).toArray(function(err, docs) {
            if (err) throw err;
            res.send(docs);
        });
    });
  
    app.get('/search/:query', function(req, res) {
      //Inserting a valid search query inserts the query to the database and then uses the Imgur API to parse and send the results to the user    
      collection.insert({term: req.params.query, when: new Date().toISOString()}, function (err) {
          if (err) return console.log(err);
          console.log("Inserted search with query " + req.params.query + " to database");
      });
      options.url = 'https://api.imgur.com/3/gallery/search/?q=' + req.params.query;
    
      request(options, function(err, response, body) { 
        if (err) return console.log(err);
        var json = body;
        var arr = [];
        
        JSON.parse(json).data.forEach(function(item) {
            arr.push(
                {
                    url: checkLink(item) ? item.link : apiHost + item.cover + ".jpg",
                    snippet: item.title,
                    thumbnail: checkLink(item) ? item.link.slice(0, -4) + 's.jpg' : apiHost + item.cover + "s.jpg",
                    context: checkLink(item) ? item.link.slice(0, -4) : item.link
                }    
            );
        });
        
        function checkLink (item) {
            //Checks whether a link is an image by checking the extension
            var exts = ['jpg', 'png', 'gif'];
            for (var i = 0; i < exts.length; i++) {
                if (item.link.slice(-4) == "." + exts[i]) return true;
            }
        }
        
        var offset = req.query.offset;
        res.send(isNaN(Number(offset)) ? arr : arr.slice(0, offset));
        
      });
      
    });
    
    app.get('/:anything', function(req, res) {
        res.redirect('/');
    });
    
    app.use(express.static(__dirname + '/client'));
    
    app.listen(process.env.PORT || 8080, function() {
        console.log('Listening on port 8080');
    });
});