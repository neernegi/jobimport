const axios = require('axios');
const xml2js = require('xml2js');

async function fetchAndParseXML(url) {
  const resp = await axios.get(url, { timeout: 20000 });
  const xml = resp.data;
  const parser = new xml2js.Parser({ explicitArray: false, mergeAttrs: true });
  const json = await parser.parseStringPromise(xml);
  return json;
}

module.exports = { fetchAndParseXML };
