const readline = require("readline")
const Writable = require("stream").Writable
const csv = require("csv")
const moment = require("moment")

moment.locale("nl")

const mutableStdout = new Writable({
  write: function(chunk, encoding, callback) {
    if (!this.muted)
      process.stdout.write(chunk, encoding)
    callback()
  },
})

mutableStdout.muted = true

const rl = readline.createInterface({
  input: process.stdin,
  output: mutableStdout,
  terminal: true,
})

let buff = ""

const isNumeric = function(n) {
  return !isNaN(parseFloat(n)) && isFinite(n)
}

const convert = function() {
  let title
  let amount
  let date

  const output = function() {
    csv.stringify([[date, title, amount]], function(err, data) {
      process.stdout.write(data)
    })
  }

  buff.split("\n").forEach(line => {
    const firstCharacter = line.substr(0, 1)
    if (isNumeric(firstCharacter)) {
      const dateparts = line.split(".")
      date = moment(dateparts[0] + " " + process.argv[2], "D MMM YYYY").format("YYYY-MM-DD")

      if (line.includes("€")) {
        amount = dateparts.slice(1).join('')
        if (!amount) {
          const lineparts = line.split("€")
          amount = lineparts[1]
        }
        amount = amount.replace(".", "").replace(",", ".")
        if (amount.includes("Af")) {
          amount = amount.replace("Af", "")
          amount = "-" + amount
        } else {
          amount = amount.replace("Bij", "")
        }
        output()
      }
    } else if (firstCharacter === "€") {
      line = line.replace(".", "").replace(",", ".")
      if (line.includes("Af")) {
        line = line.replace("Af", "")
        amount = "-" + line
      } else {
        line = line.replace("Bij", "")
        amount = line
      }
      output()
    } else if (firstCharacter) {
      title = line.trim()
    }
  })
}

let ignore = 0
const debug = false

rl.on("line", function(line) {
  ignore = Math.max(--ignore, 0)
  debug && console.log("got line", line, "ignore is now", ignore)
  if (line.includes("Eindsaldo")) {
    ignore = 5
    debug && console.log("ignore following lines")
  } else if (!ignore && line !== "") {
    debug && console.log("add to buffer")
    buff = `${buff}\n${line}`
  } else if (!ignore) {
    debug && console.log("process!")
    console.log("================================================================================")
    console.log("INPUT")
    console.log("================================================================================")
    console.log(buff)
    console.log("================================================================================")
    console.log("OUTPUT")
    console.log("================================================================================")
    convert()
    buff = ""
  }
})
