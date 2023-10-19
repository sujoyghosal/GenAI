import { Component, OnInit } from '@angular/core'
import { ChatClientService } from '../chat-client.service'
import { query } from 'express'

@Component({
  selector: 'app-chat-component',
  templateUrl: './chat-component.component.html',
  styleUrls: ['./chat-component.component.css']
})
export class ChatComponentComponent implements OnInit {
  title: string = ''
  //add messages as a JSON array
  messages: any[] = [
    {
      message: 'Hello, how can I help you?',
      timestamp: new Date(),
      sender: 'AI',
      color: 'darkgreen'
    }
  ]
  //add a humanMessage object
  humanMessage: any = {
    message: '',
    timestamp: new Date(),
    sender: 'Human',
    color: 'red'
  }
  //add a botMessage object
  botMessage: any = {
    message: '',
    timestamp: new Date(),
    sender: 'AI',
    color: 'darkgreen'
  }
  aiMessage: any[] = []
  constructor (private restService: ChatClientService) {}
  ngOnInit () {
    // Initialization code goes here
    this.title = 'AIChat'
  }

  sendMessage () {
    // Send message to the backend
    // this.messages.push(this.humanMessage)
    // this.messages.push(this.botMessage)
    //create a new  object with input message, current timestamp, sender, and color
    var m = this.humanMessage.message
    const newMessage = {
      message: m,
      timestamp: new Date(),
      sender: 'Human',
      color: 'red'
    }

    this.messages.push(newMessage)
    //reset the humanMessage object
    this.humanMessage = {
      message: '',
      timestamp: new Date(),
      sender: 'Human',
      color: 'red'
    }
    console.log(this.humanMessage)
    //call the getBotMessage function and pass the input message
    /*this.getBotMessage(m).then(response => {
      //set the botMessage object to the response
      this.botMessage = response
      var m = response
      const newBotMessage = {
        message: m,
        timestamp: new Date(),
        sender: 'bot',
        color: 'red'
      }
      //push the botMessage to the messages array
      this.messages.push(newBotMessage)
      //reset the botMessage object
      this.botMessage = {
        message: '',
        timestamp: new Date(),
        sender: 'bot',
        color: 'blue'
      }
    })*/
    this.getAIMessage(m)
  }
  //create a function that makes a POST request to the backend
  //and returns the response
  async getBotMessage (message: string) {
    /* const api = 'http://localhost:3000/vectorsearch'
    const response = await fetch(api, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: message })
    })
    //const json = await response.json()
    console.log(JSON.stringify(response));
    return response */
    const api = 'http://localhost:3000/vectorsearch'
    await fetch(api, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: message })
    }).then(response => {
      //return response.json();
      console.log(response)
    })
  }
  async getAIMessage (message: string) {
    this.restService.getVectorSearchResponse(message).subscribe((response: any) => {
      //console.log('success - response=' + JSON.stringify(response.answer))
      //if response.answer begins with a newline character, remove it

      var m = `${response.answer}`
      m = m.replace(/^\s+|\s+$/g, '');
      /*if (m && m.startsWith('\n')) {
        m = m.substring(1)
      }
      if (m && m.startsWith('\n\n')) {
        m = m.substring(2)
      }*/
      console.log(JSON.stringify(m))
      const newMessage = {
        message: m,
        timestamp: new Date(),
        sender: 'AI',
        color: 'darkgreen'
      }

      this.messages.push(newMessage)
      //reset the humanMessage object
      this.botMessage = {
        message: '',
        timestamp: new Date(),
        sender: 'Human',
        color: 'darkgreen'
      }
    })
  }
}
