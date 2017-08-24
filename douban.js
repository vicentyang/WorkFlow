/*
	node 抓取看过的电影的海报
 */

var userId = 68631623; // 我的豆瓣用户ID
var userName = 'vicentyc'; // 我的豆瓣用户名

var getMyBooksUrl = 'https://api.douban.com/v2/book/user/68631623/collections'; // 获取我的所有收藏图书
// https://api.douban.com/v2/book/user/:name/collections

var clollecBookYrl = 'https://api.douban.com/v2/book/:id/collection'; // 收藏某本书

var movieUrl = 'https://api.douban.com/v2/movie/search?q=SearchText&count=8' // 根据名称查找某部电影

// https://movie.douban.com/people/68631623/collect?start=90&sort=time&rating=all&filter=all&mode=list
// https://movie.douban.com/people/68631623/collect?sort=time&amp;start=0&amp;filter=all&amp;mode=grid&amp;tags_sort=count

var imagSource = 'https://img1.doubanio.com/view/photo/raw/public/'

var https = require('https');
var path = require('path');
var fs = require('fs');
var cheerio = require('cheerio');
var movieIds = [];
var startNum = 0;
var count = 15;
var maxNum = 350; // 之后只更新最新的一页 设成 15 或 30
var savePath = '/Users/vicent/Downloads/poster/'

var movDatas = {
	movList: []
}

var postList = [];
postList = fs.readdirSync(savePath);

function getMovieIDs() {
	console.log(`正在获取第${startNum / count + 1}页!`);
	https.get(`https://movie.douban.com/people/68631623/collect?sort=time&amp;start=${startNum}&amp;filter=all&amp;mode=grid&amp;tags_sort=count`, (res) => {
		var html = '';
		res.on('data', function (d) {
			html += d;
		});
		res.on('end', function () {

			getPostId(html);

			startNum += count;
			if (startNum < maxNum) {
				getMovieIDs();
			} else {
				var i = 0;
				exportMovData();
				function downLoadItem() {
					var listData = movieIds[i];
					listData.index = i;

					// 读取文件夹内容， 已经有就不再下载
					if (postList.indexOf(`${listData.name}.jpg`) !== -1) {
						console.log(`${listData.name}, 已经下载过了!`);
						downLoadNext();
					} else {
						var promise = downLoadImg(listData);

						promise.then(() => {
							downLoadNext();
						})
					}

				}

				function downLoadNext() {
					i += 1;

					if (i <= movieIds.length - 1) {
						downLoadItem();
					} else {
						console.log('全部完成！');
					}
				}

				downLoadItem();
			}
		});
	});
}

/**
 * https://api.douban.com/v2/movie/subject/26580232
 * 通过电影的id 找到电影的详细内容，但是请求api有限制每小时不超过150
 * @param {*} movId
 */
function getMovDetail(movId) {
	var i = 0;

	function getItemDetial() {
		https.get(`https://api.douban.com/v2/movie/subject/${movieIds[i]}`, (res) => {
			var str = '';

			res.on('data', function (d) {
				str += d;
			});
			res.on('end', function () {
				var data = JSON.parse(str);
				var listData = {
					name: data.title,
					index: i,
					postPath: path.basename(data.images.large)
				}
				var promise = downLoadImg(listData);

				promise.then(() => {
					i += 1;

					if (i < movieIds.length - 1) {
						getItemDetial();
					} else {
						console.log('全部完成！');
					}
				})
			});
		});
	}
	getItemDetial();
}

function paraHtml(html) {
	//使用load方法，参数是刚才获取的html源代码数据
	var $ = cheerio.load(html);
	var arrUrl = [];
	var lists = Array.prototype.slice.call($('.list-view').find('li'));

	lists.forEach(function (element, index) {
		var id = $(element).attr('id');
		var number = id.replace(/list/, '');
		movieIds.push(Number(number));
	});
}

/**
 * https://img1.doubanio.com/view/photo/raw/public/p2404978988.jpg
 * @param {*} data
 */
function downLoadImg(data) {

	var promise = new Promise((resolve, reject) => {
		var options = {
			hostname: 'img3.doubanio.com',
			port: 443,
			path: `/view/photo/raw/public/${data.postPath}`,
			// 豆瓣设置了图片的来源头 ，没有指明会有403的错误
			headers: {
				referer: 'https://movie.douban.com'
			}
		}
		https.get(options, (res) => {
			console.log(`·正在下载第${data.index + 1}/${movieIds.length}张, ${data.name}`);
			var imgData = '';
			res.setEncoding("binary");

			res.on("data", function (chunk) {
				imgData += chunk;
			});

			res.on("end", function () {
				fs.writeFile(`${savePath}${data.name}.jpg`, imgData, "binary", function (err) {
					if (err) {
						console.log("down fail");
					}
					console.log("down success");
					resolve();
				});
			});
		});
	});
	return promise;
}

// 直接查到海报的id 不请求电影的详细内容
function getPostId(html) {
	var $ = cheerio.load(html);
	var lists = Array.prototype.slice.call($('.grid-view').find('.item'));
	lists.forEach(function (element, index) {
		var src = path.basename($($(element).find('.pic a img')[0]).attr('src'));
		var _name = $(element).find('.info .title a em')[0]['children'][0]['data'];
		var name = _name.replace(/([\s|/].*)/, '')
		// var number = id.replace(/list/, '');
		// movieIds.push(Number(number));
		var listData = {
			name: name,
			postPath: src
		}
		movieIds.push(listData);
	});
}

// 保存已看过的电影的json文件
function exportMovData() {
	movDatas.movList = movieIds;
	fs.writeFileSync(path.join(__dirname, 'moivelist.json'), JSON.stringify(movDatas));
	console.log('文件导出成功!');
}

getMovieIDs();
