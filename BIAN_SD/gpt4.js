const express = require('express')
const bodyParser = require('body-parser')

require('dotenv').config()

const app = express()
app.use(bodyParser.json());
const OpenAIApi = require('openai');

const openai = new OpenAIApi({
    api_key: process.env.OPENAI_API_KEY
  });
messages = []

app.post('/message', async (req, res) => {
  const message = req.body.message

  messages.push({
    role: 'user',
    content: message
  })

  /*const response = openai.createChatCompletion({
    model: 'gpt-4',
    messages
  })*/
  const chatCompletion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{"role": "user", "content": "Plans and ideas for Durga Puja in Kolkata!"}],
  });
  console.log(chatCompletion.choices[0].message);

  res.send(chatCompletion.choices[0].message)
})
app.listen(3000, () => {
  console.log('Server is running on port 3000')
})
