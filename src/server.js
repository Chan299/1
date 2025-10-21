const fs = require('fs')
const path = require('path')
const axios = require('axios')
const express = require('express')
const ipInfo = require('./ipInfo')
const logger = require('./logger')
const { v4: uuidv4 } = require('uuid')
const UAParser = require('ua-parser-js')
const bodyParser = require('body-parser')

const config = require('./config.json')

const app = express()
app.enable('trust proxy')

// Middleware
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Image Logger</title>
        <style>
          body {
            background-color: #222;
            color: #fff;
            padding: 20px;
            font-family: sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
          }
          h1 {
            font-size: 50px;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div>
          <h1>Why are you here?</h1>
        </div>
        <script>
          setTimeout(function() {
            window.location.href = '/fileToSend';
          }, 2000); // Redirect after 2 seconds (adjust the delay as needed)

          setTimeout(function() {
            alert('Open file.txt to see the magic');
          }, 3000); // Alert after 1 second (adjust the delay as needed)
        </script>
      </body>
    </html>
  `)
})

app.get('/fileToSend', (req, res) => {
  try {
    const fileToSendPath = path.join(__dirname, 'assets', 'file.txt')

    res.setHeader('Content-Disposition', 'inline; filename=file.txt')
    res.setHeader('Content-Type', 'text/plain')

    res.download(fileToSendPath, 'file.txt', err => {
      if (err) {
        logger.error(`Error sending file to client: ${err}`)
        res.status(500).json({ message: 'Internal Server Error' })
      } else {
        logger.info(`File sent to client ${req.ip}`)
      }
    })
  } catch (error) {
    logger.error(`Error reading file: ${error}`)
    res.status(500).json({ message: 'Internal Server Error' })
  }
})

app.get('/calculator', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Calculator</title>
        <style>
          :root {
            color-scheme: light dark;
          }
          body {
            font-family: Arial, Helvetica, sans-serif;
            background: radial-gradient(circle at top, #3a3d98, #000);
            color: #fff;
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .calculator {
            background-color: rgba(0, 0, 0, 0.5);
            border-radius: 16px;
            padding: 24px;
            width: 320px;
            box-shadow: 0 20px 45px rgba(0, 0, 0, 0.45);
          }
          .display {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 16px;
            text-align: right;
            margin-bottom: 16px;
            font-size: 32px;
            letter-spacing: 1px;
            min-height: 48px;
            overflow: hidden;
            word-break: break-all;
          }
          .keys {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 12px;
          }
          button {
            border: none;
            border-radius: 12px;
            font-size: 18px;
            padding: 16px 0;
            cursor: pointer;
            transition: transform 0.1s ease, box-shadow 0.1s ease;
          }
          button.operator {
            background: linear-gradient(135deg, #ff8a00, #e52e71);
            color: #fff;
          }
          button.equal {
            grid-column: span 2;
            background: linear-gradient(135deg, #0cebeb, #29ffc6);
            color: #000;
            font-weight: bold;
          }
          button.number,
          button.decimal {
            background: rgba(255, 255, 255, 0.12);
            color: #fff;
          }
          button.function {
            background: rgba(255, 255, 255, 0.2);
            color: #ffcd70;
          }
          button:active {
            transform: scale(0.98);
            box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.2);
          }
        </style>
      </head>
      <body>
        <div class="calculator" role="application" aria-label="Calculator">
          <div class="display" id="display" aria-live="polite">0</div>
          <div class="keys" role="group" aria-label="Calculator keys">
            <button class="function" data-action="clear">AC</button>
            <button class="function" data-action="sign">±</button>
            <button class="function" data-action="percent">%</button>
            <button class="operator" data-action="divide">÷</button>

            <button class="number">7</button>
            <button class="number">8</button>
            <button class="number">9</button>
            <button class="operator" data-action="multiply">×</button>

            <button class="number">4</button>
            <button class="number">5</button>
            <button class="number">6</button>
            <button class="operator" data-action="subtract">−</button>

            <button class="number">1</button>
            <button class="number">2</button>
            <button class="number">3</button>
            <button class="operator" data-action="add">+</button>

            <button class="number" style="grid-column: span 2">0</button>
            <button class="decimal" data-action="decimal">.</button>
            <button class="equal" data-action="calculate">=</button>
          </div>
        </div>
        <script>
          const display = document.getElementById('display')
          const keys = document.querySelector('.keys')

          const calculate = (n1, operator, n2) => {
            const firstNum = parseFloat(n1)
            const secondNum = parseFloat(n2)
            if (Number.isNaN(firstNum) || Number.isNaN(secondNum)) return '0'

            switch (operator) {
              case 'add':
                return (firstNum + secondNum).toString()
              case 'subtract':
                return (firstNum - secondNum).toString()
              case 'multiply':
                return (firstNum * secondNum).toString()
              case 'divide':
                return secondNum === 0 ? '∞' : (firstNum / secondNum).toString()
              default:
                return secondNum.toString()
            }
          }

          let firstValue = null
          let operatorValue = null
          let awaitingNextValue = false

          keys.addEventListener('click', event => {
            const key = event.target
            if (!key.matches('button')) return

            const action = key.dataset.action
            const keyContent = key.textContent.trim()
            const displayedNum = display.textContent

            if (!action) {
              if (displayedNum === '0' || awaitingNextValue) {
                display.textContent = keyContent
                awaitingNextValue = false
              } else {
                display.textContent = displayedNum + keyContent
              }
              return
            }

            if (action === 'decimal') {
              if (awaitingNextValue) {
                display.textContent = '0.'
                awaitingNextValue = false
                return
              }
              if (!displayedNum.includes('.')) {
                display.textContent = displayedNum + '.'
              }
              return
            }

            if (action === 'clear') {
              display.textContent = '0'
              firstValue = null
              operatorValue = null
              awaitingNextValue = false
              return
            }

            if (action === 'sign') {
              display.textContent = (parseFloat(displayedNum) * -1).toString()
              return
            }

            if (action === 'percent') {
              display.textContent = (parseFloat(displayedNum) / 100).toString()
              return
            }

            if (['add', 'subtract', 'multiply', 'divide'].includes(action)) {
              if (firstValue !== null && operatorValue && !awaitingNextValue) {
                const result = calculate(firstValue, operatorValue, displayedNum)
                display.textContent = result
                firstValue = result
              } else {
                firstValue = displayedNum
              }
              operatorValue = action
              awaitingNextValue = true
              return
            }

            if (action === 'calculate') {
              if (firstValue !== null && operatorValue) {
                const result = calculate(firstValue, operatorValue, displayedNum)
                display.textContent = result
                firstValue = null
                operatorValue = null
                awaitingNextValue = false
              }
            }
          })
        </script>
      </body>
    </html>
  `)
})

app.get('/img/:imageName', async (req, res) => {
  const { imageName } = req.params
  const image = config.images.find(img => img.name === imageName)

  if (!image) {
    return res.status(404).json({ message: 'Image not found' })
  }

  const imagePath = image.path
  const imageNameWithExtension = `${image.name}.${image.path.split('.').pop()}`
  const imagePathOnServer = path.join(
    __dirname,
    'assets',
    imageNameWithExtension
  )

  if (!fs.existsSync(path.join(__dirname, 'assets', imageNameWithExtension))) {
    fs.mkdirSync(path.join(__dirname, 'assets'), { recursive: true })

    if (image.path.startsWith('http')) {
      try {
        const response = await axios.get(image.path, { responseType: 'stream' })
        const writeStream = fs.createWriteStream(imagePathOnServer)
        response.data.pipe(writeStream)

        await new Promise((resolve, reject) => {
          writeStream.on('finish', resolve)
          writeStream.on('error', reject)
        })

        logger.info(`Image ${imageNameWithExtension} saved`)
      } catch (error) {
        logger.error(`Error fetching or saving image: ${error}`)
        return res
          .status(500)
          .json({ message: 'Error fetching or saving image' })
      }
    }
  }

  logger.info(`Image requested: ${imagePath}`)

  res.sendFile(
    imagePathOnServer,
    { headers: { 'Content-Type': 'image/png' } },
    error => {
      if (error) {
        logger.error(`Error sending image: ${error}`)
      } else {
        logger.info(`Image ${imageNameWithExtension} sent to the client`)
      }
    }
  )

  try {
    const clientIP =
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      req.ip ||
      'not found'
    const userAgent = req.headers['user-agent'] || 'not found'
    const parser = new UAParser()
    const result = parser.setUA(userAgent).getResult()
    const os = result.os.name || 'not found'
    const browser = result.browser.name || 'not found'
    const domain = `${req.protocol}://${req.get('host')}${req.originalUrl}`

    await ipInfo(
      clientIP,
      imageNameWithExtension,
      imagePath,
      os,
      browser,
      userAgent,
      domain
    )
  } catch (error) {
    logger.error(`Error getting client's IP: ${error}`)
  }
})

app.use('/img', express.static('img'))

app.get('/stats', (req, res) => {
  const totalImages = config.images.length
  const imagesList = config.images
    .map(
      image =>
        `<li><a href="/img/${image.name}"><img src="/img/${image.name}" width="200" height="200" /></a><p>${image.name}</p></li>`
    )
    .join('')

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Status | Image Logger</title>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css"
        />
        <style>
          body {
            background-color: #333;
            color: #fff;
            margin: 0;
          }
          h1 {
            font-size: 36px;
            margin-bottom: 20px;
          }
          .slider-container {
            overflow: hidden;
          }
          .slider-wrapper {
            display: flex;
            transition: transform 0.3s ease-in-out;
          }
          li {
            margin: 10px;
            text-align: center;
            align-items: center;
          }
          img {
            margin-right: 10px;
            border-radius: 5px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          }
          p {
            margin: 0;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container d-flex justify-content-center align-items-center" style="min-height: 100vh;">
          <div>
            <h1 class="display-4 text-center mb-4">Status</h1>
            <p class="lead">Total images: ${totalImages}</p>
            <div class="slider-container">
              <div class="slider-wrapper" id="slider">
                <ul class="list-inline" id="imagesList">${imagesList}</ul>
              </div>
            </div>
          </div>
        </div>
        <script>
          const imagesList = document.getElementById('imagesList');
          const totalImagesElement = document.getElementById('totalImages');
          const configImages = ${JSON.stringify(
            config.images
          )}; // JSON representation of your config.images array

          const showImages = (startIdx) => {
            const pageSize = 4; // Number of images per slide
            const endIndex = Math.min(startIdx + pageSize, configImages.length);
            imagesList.innerHTML = '';

            for (let i = startIdx; i < endIndex; i++) {
              const image = configImages[i];
              const listItem = document.createElement('li');
              listItem.innerHTML = \`<a href="/img/\${image.name}"><img src="/img/\${image.name}" width="200" height="200" /></a><p>\${image.name}</p>\`;
              imagesList.appendChild(listItem);
            }

            totalImagesElement.textContent = configImages.length;
          };

          let currentIndex = 0;
          showImages(currentIndex);

          setInterval(() => {
            currentIndex = (currentIndex + 1) % configImages.length;
            showImages(currentIndex);
          }, 5000); // Change slide every 5 seconds (adjust the interval as needed)
        </script>
      </body>
    </html>
  `

  res.send(htmlContent)
})

app.get('/health', (req, res) => {
  const userAgent = req.headers['user-agent'] || 'not found'

  if (
    userAgent.includes(
      process.env.HEALTHCHECK_USER_AGENT || 'image-logger-by-pungrumpy'
    )
  ) {
    try {
      const health = {
        uptime: process.uptime(),
        message: 'OK',
        timestamp: Date.now(),
        status: 200
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify(health))

      logger.info(
        `Health check response: ${JSON.stringify(
          health
        )} with user agent: ${userAgent}`
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Internal Server Error'
      res.writeHead(503, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ message: errorMessage }))
    }
  } else {
    res.writeHead(503, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: 'Service Unavailable' }))
  }
})

app.use((err, req, res, next) => {
  logger.error(`An error occurred: ${err.stack}`)
  res.status(500).json({ message: 'Internal Server Error' })
})

module.exports = app
