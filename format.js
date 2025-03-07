import fs from 'fs'

const file = fs.readFileSync('./settlements.json', 'utf-8')
export const data = JSON.parse(file)