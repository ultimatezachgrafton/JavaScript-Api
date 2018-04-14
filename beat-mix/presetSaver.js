const presets = require('./presets')

const getPreset = index => {
  if (index === undefined) return false;
  if (index < 0 || index > 16) return false;
  return presets[index];
}

const setPreset = (index, array) => {
  if (index === undefined) return false;
  if (array === undefined || !Array.isArray(array)) return false;
  if (index < 0 || index > 16) return false;
  presets[index] = array;
  return presets[index];
}

// the preset index will be available as req.index
// the array of drum arrays to save in a preset will be available as req.presetArray
// req.method will be either 'GET' or 'PUT'
// attach the preset to send back 
const presetSaver = (req, res, next) => {
  // vv Write your code below here vv
  if (req.method === 'GET') {
    let preset = getPreset(req.index);
    if (preset) {
      res.preset = preset;
      res.statusCode = 200;
    } else {
      res.statusCode = 404;
    }
  } else if (req.method === 'PUT') {
    const newPreset = setPreset(req.index, req.presetArray);
    if (newPreset) {
      res.preset = newPreset;
      res.statusCode = 200;
    } else {
      res.statusCode = 404;
    }
  }
  // ^^ Write your code above here ^^
  next();
}

module.exports = {
  presetSaver,
  getPreset,
  setPreset
};