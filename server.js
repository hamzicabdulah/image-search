var express = require('express'), 
app = express(),
request = require('request');

var json,
apiHost = "http://i.imgur.com/",
options = {  
    url: '',
    method: 'GET',
    headers: {
        'Authorization': 'Client-ID 08557a8a10c6f24'
    }
};

app.get('api/:query', function(req, res) {
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

app.listen(process.env.PORT || 8080, function() {
    console.log('Listening on port 8080');
});