import fs from 'fs'

const file = fs.readFileSync('./settlements.json', 'utf-8')

const data = JSON.parse(file)
data.forEach(el => el.type==='гр.' && (el.type = 'град'))

console.table(data)
fs.writeFileSync('settlements.json', JSON.stringify(data), 'utf8')
