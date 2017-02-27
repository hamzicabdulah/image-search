var express = require('express'), 
app = express(),
request = require('request');

var MongoClient = require('mongodb').MongoClient;
//URL is saved as an environment variable in the Heroku config to protect username and password
var URL = process.env.MONGOLAB_URI;

var json,
apiHost = "http://i.imgur.com/",
options = {  
    url: '',
    method: 'GET',
    headers: {
        'Authorization': 'Client-ID 08557a8a10c6f24'
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
      collection.insert({term: req.params.query, when: Date()}, function (err) {
          if (err) return console.log(err);
          console.log("Inserted search with query " + req.params.query + " to database");
      });
      options.url = 'https://api.imgur.com/3/gallery/search/?q=' + req.params.query;
    
      request(options, function(err, response, body) { 
        if (err) return console.log(err);
        json = body;
        var arr = [];
        
        function checkLink (item) {
            var exts = ['jpg', 'png', 'gif'];
            for (var i = 0; i < exts.length; i++) {
                if (item.link.slice(-4) == "." + exts[i]) return true;
            }
        }
        
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
        
        var offset = req.query.offset;
        res.send(isNaN(Number(offset)) ? arr : arr.slice(0, offset));
        
      });
      
    });
    
    app.use(express.static(__dirname + '/public'));
    
    app.listen(process.env.PORT || 8080, function() {
        console.log('Listening on port 8080');
    });
});