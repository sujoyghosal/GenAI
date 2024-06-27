//create a Node.js app and import faker.js
const express = require('express')
const app = express()
const cors = require('cors')
const port = 3000
app.use(express.static('public'))
app.use(express.json())
const request = require('request')
const axios = require('axios')
const openai_key =
  process.env.OPENAI_API_KEY ||
  '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'
//console.log(openai_key)
//connect to MongoDB
const { MongoClient, ServerApiVersion } = require('mongodb')
const uri = 'mongodb://localhost:27017/?directConnection=true'

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
    console.log('Generated embedding')
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

    const db = client.db('GenAIDB') // Replace with your database name.
    const collection = db.collection('BIANScenarios') // Replace with your collection name.
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
              k: 8
            }
          }
        },
        {
          $project: {
            _id: 0,
            text: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ])
      .toArray()
    console.log(JSON.stringify(documents))
    return documents
  } finally {
    await client.close()
  }
}

async function doSearch (query, res) {
  getEmbedding(query).then(embedding => {
    findSimilarDocuments(embedding).then(async documents => {
      console.log('Vector Search Results:')
      console.log(documents)
      /*var docs = []
      var i = 1
      var queryString = ''
      documents.forEach(doc => {
        queryString = "The " + doc.text['Business Domain'] + " Domain has the following business scenario: "  
        + i++ + " . Scenario Context: " + doc.text['Business Scenarios Context'];
        doc.text['Business Scenarios'].forEach(scenario => {
          j=1;
          queryString += ": Business Scenario  " + (j++) + ": " + scenario.Scenario + 
          " which has the following Service Domains: " + scenario['Service Domains'] + ". It also has the following Sequence: " + 
          JSON.stringify(scenario['Sequence'][0]) + ".\n\n"
        }
        )
        docs.push(queryString);
        
      })
      console.log(docs.length)*/
      getAnswer(query, JSON.stringify(documents), res).then(async answer => {
        console.log('Answer:')
      })
    })
  })
}
//const query = 'What are the endpoints in Card Case and what do they do?'
//console.log('Query: ' + query)
//doSearch(query)

//call OpenAI completion API with the query and vector search results
async function getAnswer0 (query, documents, res) {
  const axios = require('axios')
  var prompt =
    'Answer the question below:\n\n' +
    query +
    ' from the following JSON documents: ' +
    documents +
    '\n\n \
    . Be precise and provide constructive inputs. \n\n \
    . Provide a brief description of the business scenario. \n\n \
    . List as bullet points. Draw a dotted line between when answering from content from different business scenario objects. \n\n \
    Answer:'

  let data = JSON.stringify({
    model: 'gpt-3.5-turbo-instruct',
    prompt: prompt,
    max_tokens: 3200,
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
async function getAnswer (query, documents, res) {
  var prompt =
    'Answer the question below:\n\n' +
    query +
    ' from the following JSON documents: ' +
    documents +
    '\n\n \
    . Be precise and provide constructive inputs. \n\n \
    . Provide a brief description of the business scenario. \n\n \
    . List as bullet points. Draw a dotted line between when answering from content from different business scenario objects. \n\n \
    Answer:'
  var options = {
    method: 'POST',
    url: 'https://api.openai.com/v1/chat/completions',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + openai_key
    },
    body: JSON.stringify({
      model: 'gpt-4-1106-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an assistant.'
        },
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  }
  request(options, function (error, response) {
    if (error) throw new Error(error)
    console.log(response.body)
    /*console.log(`${response.body.choices[0].text}`)
    var json = {
      query: query,
      documents: documents,
      answer: `${response.data.choices[0].text}`
    }*/
    var json = JSON.parse(response.body)
    //res.jsonp(json.choices[0].message.content);
    var json = {
      query: query,
      documents: documents,
      answer: `${json.choices[0].message.content}`
    }
    res.jsonp(json)
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
  const query = req.query.query
  console.log('Query: ' + query)
  await doSearch(query, res).then(() => {
    //res.send('Query: ' + query)
  })
})
//create an express server
app.listen(port, () => {
  console.log(`The app is listening at http://localhost:${port}`)
})
