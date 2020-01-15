var express = require('express');
var luxon = require('luxon');
var router = express.Router();

var notes = [
  {
    "date": luxon.DateTime.local(),
    "text": "First Note"
  },
  {
    "date": luxon.DateTime.local(),
    "text": "Second Note"
  },
];

router.get('/', function(req, res, next) {
  res.send(notes);
});

router.post('/', function(req, res, next) {
  var note = req.body;
  note.date = luxon.DateTime.local();
  notes.push(note);
  res.send(note);
});

router.delete('/', function(req, res) {
  var idx = req.body.idx;
  res.send(notes.splice(idx, 1));
});

module.exports = router;
