var Airtable = require('airtable')
var base = new Airtable({ apiKey: 'YOUR_AIRTABLE_API_KEY' }).base(
  'YOUR_AIRTABLE_BASE_ID'
)

export default base
