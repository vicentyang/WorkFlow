/*
 * @Author: vicent
 * @Date:   2016-10-09 14:51:12
 * @Last Modified by:   vicent
 * @Last Modified time: 2016-10-10 16:52:38
 */

'use strict';
let fs = require('fs');
let Path = require('path');
let cwd = process.cwd();
let xlsx = require('node-xlsx');
let esprima = require('esprima');
// fs.readFile
fs.readFile('./config.ts', 'utf8', (err, data) => {
    if (err) throw err;

    // 1 (.*)audioMap(?s)(.*?}) 这个表达式中的 (?s) 前瞻性在js 中不可用 （报Invalid group错）
    // 2 单行模式 用 （|\n）不加入ｇ，则只返回第一个匹配，无论执行多少次均是如此，如果加入ｇ，则第一次执行也返回第一个匹配，再执行第二个匹配，依次类推。
    let regex = /public\saudioMap((.|\n)*?};)/i;
    let result = regex.exec(data);
    let fin = result[0].replace(/public/i, 'var'); // 还要手写去掉冒号后面 大括号前面的类型指定

    toAST(fin);
})

function toAST(data) {

    let ast = esprima.parse(data, {
        comment: true,
        attachComment: true
    });
    analyseAST(ast);
}

function analyseAST(ast) {
    let body = ast.body; //ast主体
    let audioList = '';
    let audioDataList = [];
    let keyList = [];
    let valueList = [];

    // let comment = body[0].declarations[0].init.properties[17].leadingComments[0].value;
    // let value =   body[0].declarations[0].init.properties[18].value.value
    // let key =     body[0].declarations[0].init.properties[18].key.name

    body.forEach(function(context, index) {
        if (context['declarations'] && Array.isArray(context['declarations'])) {
            let declarations = context['declarations'];
            declarations.forEach(function(declaration, index) {
                if (declaration['init'] && declaration['init']['properties']) {
                    let properties = declaration['init']['properties']
                    properties.forEach(function(property, index) {
                        let audioData = [];
                        let comment = property['leadingComments'] ? property['leadingComments'][0]['value'] : 'null';
                        let value = property['value']['value'] ? property['value']['value'] : 'null';
                        let key = property['key']['name'];
                        audioData.push(key, value, comment);
                        audioDataList.push(audioData);
                        audioList = audioList + key + '-----' + value + '-----' + comment + '\n';
                    })
                }
            })
        }
    })
    fs.writeFileSync(Path.join(cwd, 'audioList.txt'), audioList);
    toXLSX(audioDataList);
}

/**
 * [toXLSX description]
 * @param  {array} data
 * @return {[type]}      [description]
 */
function toXLSX(data) {
    let buffer = xlsx.build([{name: "Sheet1", data: data}]);
    fs.writeFileSync("./test2.xlsx", buffer);
}
