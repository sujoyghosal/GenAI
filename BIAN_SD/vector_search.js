//create a Node.js app and import faker.js
const express = require('express')
const app = express()
const cors = require('cors')
const port = 3000
app.use(express.static('public'))
app.use(express.json())

const axios = require('axios')
const openai_key = process.env.OPENAI_API_KEY
//console.log(openai_key)
//connect to MongoDB
const { MongoClient, ServerApiVersion } = require('mongodb')
const uri =
  'mongodb+srv://sujoyghosal:Joyita_1@cluster0.dbxxvmy.mongodb.net/?retryWrites=true&w=majority'

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

//import faker.js
const faker = require('faker')

//create 100 fake documents and insert them into MongoDB
async function createFakeDocuments () {
  const documents = []
  for (let i = 0; i < 100; i++) {
    const document = {
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      embedding: await getEmbedding(faker.commerce.productDescription())
    }
    documents.push(document)
  }
  console.log('Inserting documents to Mongo DB...')
  client.connect()
  const collection = client.db('BIANDemo').collection('BIANServiceDomains')
  await collection.insertMany(documents)
}

//create a function to get embedding
async function getEmbedding (query) {
  let data = JSON.stringify({
    input: query,
    model: 'text-embedding-ada-002'
  })

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.openai.com/v1/embeddings',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + openai_key
    },
    data: data
  }

  let response = await axios(config)
  if (response.status === 200) {
    return response.data.data[0].embedding
  } else {
    throw new Error(`Failed to get embedding. Status code: ${response.status}`)
  }
}
//createFakeDocuments();
//function to do vector search on MongoDB collection
async function findSimilarDocuments (embedding) {
  const url = uri
  const client = new MongoClient(url)

  try {
    await client.connect()

    const db = client.db('BIANDemo') // Replace with your database name.
    const collection = db.collection('BIANServiceDomains') // Replace with your collection name.
    //console.log(embedding)
    // Query for similar documents.
    /*const documents = await collection.aggregate([{
            $vectorSearch: {
            queryVector: embedding,
            path: 'embedding',
            numCandidates: 100,
            limit: 5,
            index: 'default'
            }
        }]).toArray()*/
    const documents = await collection
      .aggregate([
        {
          $search: {
            index: 'default',
            knnBeta: {
              vector: embedding,
              path: 'embedding',
              k: 1
            }
          }
        },
        {
          $project: {
            _id: 0,
            title: 1,
            description: 1,
            paths: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ])
      .toArray()

    return documents
  } finally {
    await client.close()
  }
}

async function doSearch (query, res) {
  getEmbedding(query).then(embedding => {
    findSimilarDocuments(embedding).then(async documents => {
      console.log('Vector Search Results:')
      //console.log(JSON.stringify(documents))
      var docs = []
      var i = 1
      documents.forEach(doc => {
        var queryJSON = {}
        queryJSON['Service Domain'] = doc.title
        queryJSON['description'] = doc.description
        console.log('queryJSON: ' + JSON.stringify(queryJSON))
        //read the paths in a loop
        var paths = []
        doc.paths.forEach(path => {
          var endpoint = {
            endpoint: path.path,
            verb: path.verb,
            BQ: path.value.tags[0],
            summary: path.value.summary,
            description: path.value.description
          }
          paths.push(endpoint)
        })
        queryJSON['endpoints'] = paths
        docs.push(queryJSON)
      })
      console.log(docs.length)
      getAnswer(query, JSON.stringify(docs), res).then(async answer => {
        console.log('Answer:')
      })
    })
  })
}
//const query = 'What are the endpoints in Card Case and what do they do?'
//console.log('Query: ' + query)
//doSearch(query)

//call OpenAI completion API with the query and vector search results
async function getAnswer (query, documents, res) {
  const axios = require('axios')
  var prompt =
    'Answer the question below:\n\n' +
    query +
    ' from the following JSON documents: ' +
    documents +
    '\n\n \
    . List as bullet points and always start with Service Domain name in response. \
    Try to restrict response related to Service Domains in question. \n\n \
     \n\n \
    Answer:'

  let data = JSON.stringify({
    //model: 'gpt-4',
    model: 'gpt-3.5-turbo-instruct',
    prompt: prompt,
    max_tokens: 1700,
    temperature: 0.4
  })

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.openai.com/v1/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + openai_key
    },
    data: data
  }

  axios
    .request(config)
    .then(response => {
      console.log(`${response.data.choices[0].text}`)
      var json = {
        query: query,
        documents: documents,
        answer: `${response.data.choices[0].text}`
      }
      res.jsonp(json)
    })
    .catch(error => {
      console.log(error)
    })
}
var whitelist = ['http://localhost:8000', 'http://localhost:4200']
app.use(
  cors({
    origin: whitelist
  })
)
//create express route named vectorsearch
app.get('/vectorsearch', async (req, res) => {
  //console.log(req.body)
  try {
    const query = req.query.query
    console.log('Query: ' + query)
    await doSearch(query, res).then(() => {
      //res.send('Query: ' + query)
    })
  } catch (err) {
    console.log(err)
  }
})
//create an express server
app.listen(port, () => {
  console.log(`The app is listening at http://localhost:${port}`)
})
