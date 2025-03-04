import axios from "axios";
import * as cheerio from "cheerio";
import fs from 'fs'


class settlementRecord{
    name; type; oblast; obshtina;

    constructor(name, type, oblast, obshtina) {
        this.name = name;
        this.type = type;
        this.oblast = oblast;
        this.obshtina = obshtina;
    }
}

const storage = []
const promises = []

const genURL = 'https://www.ekatte.com/а-я/'
const response =  await axios.get(genURL)
const page = cheerio.load(response.data)

const letters =  page('.views-summary > a').toArray().map(e => e.children[0].data.toLowerCase())
let currentLetter = 0

 do{
     promises.push(invoke(currentLetter).catch(e => console.error(e)))
 } while (currentLetter++ < letters.length-1)

const follow = await Promise.all(promises)

follow.forEach(data => {
    data.forEach(el => {

        storage.push(el)
        }
    )
})

fs.writeFileSync('settlements.json', JSON.stringify(storage), 'utf8')

async function invoke(cl) {
    const url = genURL + letters[cl]
    const res = await axios.get(url)
    let pag = cheerio.load(res.data)

    const max = pag('.pager-last > a').attr('href')?.split('=')[1]
    let index = 0


    const settlements = []

    do {
        pag('.views-row > a').each((i, a) => {
            settlements.push(new settlementRecord(
                a.firstChild.data,
                a.attribs.title?.split(' ')[0],
                a.attribs.title?.split('област ')[1].split(',')[0],
                a.attribs.title?.split('община ')[1].split(',')[0],

            ))
        })
        pag = cheerio.load((await axios.get(url + '?page=' + ++index)).data)
    } while (index <= max)

    return settlements
}

