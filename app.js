// Setup
const express = require('express')
const youtube = require("youtube-api")
const builder = require('botbuilder')
const bodyParser = require('body-parser')

const app = express()
const port = process.env.PORT

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Start server
app.listen(port, () => console.log(`Listening on port ${port}`))

// Authenticate Youtube
youtube.authenticate({
  type: "key",
  key: process.env.YOUTUBE_KEY
})


// Create chat bot
const connector = new builder.ChatConnector({
  appId: process.env.MICROSOFT_APP_ID,
  appPassword: process.env.MICROSOFT_APP_PASSWORD
})
const bot = new builder.UniversalBot(connector)
app.post('/api/messages', connector.listen())

//Root dialog
bot.dialog('/', [
  function(session) {
    session.send('Olá! Estou aqui para ajudá-lo a achar o tutorial que precisa. Vamos lá?')
    builder.Prompts.text(session, 'Do que você tem dúvida? Escreva algum tema')
  },
  function(session, result, next) {
    // Search Youtube
    const req = youtube.search.list({
      q: result.response,
      part: 'snippet'
    }, (err, data) => {
      if (err) session.endDialog('Desculpe, algo deu errado...')

      // Create card carousel
      var cards = data.items.map(function(item) { return createCard(session, item) })
      var msg = new builder.Message(session).attachments(cards).attachmentLayout('carousel')
      session.send('Encontrei isso aqui. Veja se ajuda')
      session.endDialog(msg)
    })
  }
])

// Helper function
const createCard = (session, item) => {
  const card = new builder.HeroCard(session)
  card.title(item.snippet.title)
  card.subtitle(item.snippet.channelTitle)
  card.images([builder.CardImage.create(session, item.snippet.thumbnails.high.url)])
  card.tap(builder.CardAction.openUrl(session, "https://www.youtube.com/watch?v=" + item.id.videoId))

  return card
}