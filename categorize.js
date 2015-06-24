var path = require('path');

var Torrent = require(__dirname+'/models/Torrent.js');

var extToIgnore = [
      '.url', '.txt', '.ico', '.srt', '.gif', '.log', 
      '.nfo', '.cbr', '.ass', '.lnk', '.rtf', '.bc!', 
      '.bmp', '.m3u', '.mht', '.cue', '.sfv', '.diz',
      '.azw3', '.odt', '.chm', '.md5', '.idx', '.sub',
      '.ini', '.html', '.ssa', '.lit', '.xml', '.clpi',
      '.bup', '.ifo', '.htm', '.info', '.css', '.php', 
      '.js', '.jar', '.json', '.sha', '.docx', '.csv'
    ];
var extToCateg = {
  'Images' : ['.png', '.jpeg', '.jpg'],    
  'Program' : ['.exe'],
  'ISO'   : ['.rar', '.iso', '.zip', '.dmg', '.tgz', '.gz', '.chd', '.7z', '.cab', '.apk', '.cdr', '.wbfs', '.dat', '.rar', '.lzma', '.mds', '.gho', '.ima', '.nrg'],  
  'Book' : ['.epub', '.pdf', '.cbz', '.cbr', '.cb7', '.cba', '.cbt', '.djvu', '.fb2', '.mobi'],  
  'Music' : ['.flac', '.mp3', '.m4p', '.m4r', '.m4a', '.m4b', '.ape', '.wma', '.ogg'],  
  'Video' : ['.mp4', '.mkv', '.3gp', '.flv', '.f4v', '.avi', '.rm', '.rmvb', '.wmv', '.mov', '.mpg', '.mpeg', '.ts', '.m2ts', '.m4v', '.asf', '.vob', '.divx'],
};

console.logCopy = console.log.bind(console);

console.log = function(data) {
   if(arguments.length) {
      var timestamp = '[' + new Date().toUTCString() + ']';
      this.logCopy(timestamp, arguments);
   }
};

var filter = { 'category' : /Unknown/ };

var stream = Torrent.find(filter).sort({'imported': -1}).limit(100).stream();
stream.on('data', function(torrent){
  var self = this;
  self.pause();
  console.log("Treating "+torrent._id+" categorization");
  if(typeof torrent.files !== "undefined") {
    var files = torrent.files;
    var exts = [];
    files.forEach(function(file){
      var ext = path.extname(file).toLowerCase();
      if( extToIgnore.indexOf(ext) < 0 ) {
        if(ext.length < 6) {
          exts.push( ext ); 
        }
      }
    });
    exts.sort();
    exts = exts.filter( function(value, index, self){
      return self.indexOf(value) === index;
    });
    exts = exts.filter( function(value){
      return value.length !== 0
    });

    var category = 'Other';
    for(var k in extToCateg) {
      var v = extToCateg[k];
      //if too much extensions we can't know
      if(exts.length<5) {
        //for each uniq extension
        exts.forEach(function(e){
          //check if in category (asc)
          if(v.indexOf(e)>=0){
            category = k;
          }
        });
      }
    }
    torrent.category=category;
    torrent.save(function(err){
      if(err) {console.log(err); process.exit(1);}
      console.log("Categorized as "+category+" !");
      self.resume();
    })
  }
})

stream.on('error', function(err) {
  console.log("Error : "+err); process.exit(1);
});

stream.on('close', function(){
  process.exit();
});
