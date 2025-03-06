import fs from 'fs'
import path from 'path'
import {settlementRecord} from "./main.js";

const file = fs.readFileSync('./settlements.json', 'utf-8')

const data = JSON.parse(file)
data.forEach(el => el.type==='гр.' && (el.type = 'град'))

data.push([

])



console.table(data)
fs.writeFileSync('settlements.json', JSON.stringify(data), 'utf8')
