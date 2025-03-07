import axios from "axios";
import * as cheerio from "cheerio";
import fs from 'fs'
import {data} from './format.js'


export class settlementRecord{
    name; type; oblast; obshtina;

    constructor(name, type, oblast, obshtina) {
        this.name = name;
        this.type = type;
        this.oblast = oblast;
        this.obshtina = obshtina;
    }
}

if (process.argv[2] === '1'){
    await process1()
} else if (process.argv[2] === '2'){
    await process2()
}

async function process1(){
    const storage = []
    const promises = []

    const genURL = 'https://www.ekatte.com/а-я/'
    const response = await axios.get(genURL)
    const page = cheerio.load(response.data)

    const letters = page('.views-summary > a').toArray().map(e => e.children[0].data.toLowerCase())
    let currentLetter = 0

    do {
        promises.push(invoke(currentLetter).catch(e => console.error(e)))
    } while (currentLetter++ < letters.length - 1)

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
}

async function process2() {
    const url = 'https://www.ekatte.com/селищни-образувания'
    const res = await axios.get(url)
    const page = cheerio.load(res.data)

    const listSO = page('tbody > tr').text().trim().split('\n')

    const names = []
    for (let i = 0; i < 6; i++) { names.push(listSO.shift()) }

    const listFSO = [] // GOTOVATA REDAKTIRANA TABLICA
    let nextRecord

    for (let i = 0; i < listSO.length; i++) {
        let n = i%6
        n===0 && (nextRecord = {})

        if(n===5) {
            listFSO.push(nextRecord)
        }
        else if(n===4) {
            if(/\w+/.test(listSO[i])){
                nextRecord[(names[n] + ' 2')] = listSO[i]
            }
        }
        else {
            nextRecord[names[n]] = listSO[i]
        }
    }

    const finalList = {
        'sonz':[],
        'somz': []
    }

    for (const el of listFSO) {
        const zemlishte = el['Землище']
        const thisObshtina = /общ\. .+,/g.exec(zemlishte)[0].slice(5, -1)
        const thisOblast = /обл\. .+/g.exec(zemlishte)[0].slice(5)
        const r = new settlementRecord(
            el['Наименование'],
            'с.о.',
            thisOblast,
            thisObshtina,
        )
        if (/(курорт)|(комплекс)|(зона)/i.test(r.name)) {
            if (el['Вид'] === '1') {
                finalList.sonz.push(r)
            } else {
                finalList.somz.push(r)
            }
        }
    }

    //console.table(listFSO)
    //console.table(finalList.sonz)
    //console.table(finalList.somz)

    for (const el of finalList.sonz) {
        el.name=el.name.slice(19, -1)
        addEl((el.type='к.к.', el))
    }
    addEl(new settlementRecord('Сливенски минерални бани', 'к.', 'Сливен', 'Сливен'))
    addEl(new settlementRecord('Огняновски минерални бани', 'к.', 'Благоевград', 'Гърмен'))

    function addEl(el) {
        data.push(el)
    }

    console.table(data.sort((a, b) => a.name.localeCompare(b.name)))
    fs.writeFileSync('settlements.json', JSON.stringify(data))
    checkForDuplicates(data)
}

function checkForDuplicates(arr) {
    console.warn('CHECKING FOR DUPLICATES!\n')
    let seen = new Set();
    let duplicates = [];

    arr.forEach(obj => {
        const objStr = JSON.stringify(obj);
        if (seen.has(objStr)) {
            duplicates.push(obj);
        } else {
            seen.add(objStr);
        }
    });

    console.log(duplicates);
}