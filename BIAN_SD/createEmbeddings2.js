//create a Node.js app and import faker.js
const express = require('express')
const app = express()
const port = 3000
app.use(express.static('public'))
app.use(express.json())

const axios = require('axios')
// Define the OpenAI API url and key.
const url = 'https://api.openai.com/v1/embeddings'
const openai_key = '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' // Replace with your OpenAI key.
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
  const collection = client.db('BIANDemo').collection('TestCollection')
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
      Authorization:
        'Bearer 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'
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
              k: 2
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

async function doSearch (query) {
  getEmbedding(query).then(embedding => {
    findSimilarDocuments(embedding).then(async documents => {
      console.log('Vector Search Results:')
      console.log(documents)
      var docs = []
      documents.forEach(doc => {
        var object = {}
        object.title = doc.title
        object.description = doc.description
        object.endpoints = []
        var i = 1
        doc.paths.forEach(path => {
          var e = {}
          e['Endpoint ' + i] = path.path
          e['verb'] = path.verb
          e['description'] = path.value.description
          e['tags'] = path.value.tags

          object.endpoints.push(e)
          i++
        })
        docs.push(object)
       
      })
      //console.log(docs.length)
      getAnswer(query, JSON.stringify(docs)).then(async answer => {
        console.log('Answer:')
      })
    })
  })
}
const query = 'What are the endpoints in Card Case and what do they do?'
console.log('Query: ' + query)
doSearch(query)

//call OpenAI completion API with the query and vector search results
async function getAnswer (query, documents) {
  const axios = require('axios')
  var prompt =
    'Answer the question below:\n\n' +
    query +
    ' from the following JSON documents: ' +
    documents +
    '\n\nAnswer:'
  let data = JSON.stringify({
    model: 'gpt-3.5-turbo-instruct',
    prompt: prompt,
    max_tokens: 1700,
    temperature: 0.5
  })

  let config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://api.openai.com/v1/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization:
        'Bearer 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'
    },
    data: data
  }

  axios
    .request(config)
    .then(response => {
      console.log(`${response.data.choices[0].text}`)
    })
    .catch(error => {
      console.log(error)
    })
}
