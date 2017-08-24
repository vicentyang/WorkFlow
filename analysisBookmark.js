/*
    node 脚本 分析chrome 书签
 */
let fs = require('fs');
let url = require('url');
let path = require('path');

// @flow
let data = {};
let count = 0;
let bookMarkPath = '/Users/vicent/Library/Application\ Support/Google/Chrome/Profile\ 1/Bookmarks';
if (!fs.existsSync('/Users/vicent/Library/Application\ Support/Google/Chrome/Profile\ 1/')) {
    bookMarkPath = '/Users/vicent/Library/Application\ Support/Google/Chrome/Default/Bookmarks'
}
fs.readFile(bookMarkPath, 'utf8', (err, _data) => {
    let children = JSON.parse(_data)['roots']['bookmark_bar']['children'];

    ana(children);
    console.log(data, count);
})
// @flow
function ana(children) {
    // console.log(children);
    children.forEach((_children, value) => {
        if (_children.type && _children.type === 'folder') {
            ana(_children.children);

            if (_children.name === 'design') {
                exportForder(_children.children, 'design');
            }
        }

        if (_children.type && _children.type === 'url') {
            let _url = url.parse(_children.url);
            if (!data.hasOwnProperty(_url.host)) {
                data[_url.host] = 0;
            }
            data[_url.host] += 1;
            count += 1;
        }
    })
    // console.log(data, count);
}

function exportForder(listDatas, folderName) {
    let resultArr = {
        data: []
    };
    listDatas.forEach((listData, value) => {
        if (listData.type === 'url') {
            let _data = {
                name: listData['name'],
                url: listData['url']
            }
            resultArr['data'].push(_data);
        }
    });
    fs.writeFileSync(path.join(__dirname, `${folderName}.json`), JSON.stringify(resultArr));

}

const chalk = require('chalk');

console.log(chalk.blue('Hello world!'));
