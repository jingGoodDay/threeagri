$('#indicatorContainer').radialIndicator({
    radius: 30,
    barColor: '#2682CB',
    barWidth: 10,
    initValue: 0,
    roundCorner : true,
    percentage: true

});

// 下载相关
var downloadTaskIdArray = [];
var downloadTaskLoopArray = [];
var uploadTaskIdArray = [];
var uploadTaskLoopArray = [];
var userName = ['default'];
var downloadFlag = false;
var currentDownloadPath = '';
var currentDownloadDom = null;
var currentDownloadEvent = null;
var searchKeyWord = '';
var mapShp = null; // 矢量地图

//定位相关
var nowX=null,nowY=null;
var mapsearch;
var Agri = {
    allTiff: [],
    currentType: 'tif', // 'tif', 'shp', 'doc', 'img'
    onePage: getFilePageNum(), // 每页容纳的文件条数
    selectKey:  '全部' // 成果检索目录关键字
}


$(function () {
    HomePage.init();
    HomePage.initMenu();
    HomePage.switchContent();
});

var HomePage = {
    init: function (){
        bindEvent();
        refreshCountFiles();
        refeshGetMemory();
        mapOl.initMap();
        mapOl.vecLayer("image");
        mapOl.switchSelect();
        mapOl.changeBg();
        $(".fakeloader").fakeLoader({
            timeToHide:2000000000000000000,
            bgColor:"#C1C1C1",
            spinner:"spinner7"
        });

        $('.head-logout').click(function(){
            window.location.href = '../index.html';
        });

        //读取sessionStorage中的用户名
        $('#user-name').html(sessionStorage.getItem('userinfo'));
    },
    initMenu: function(){
        //切换主菜单
        $('#chengguozhanshi').click(function(){
            $('.left-bottom-right').show();
            $('.left-wenjianmulu').hide();
            HomePage.switchMenu('chengguozhanshi');
        })
        $('#yuanshishuju').click(function(){
            HomePage.switchMenu('yuanshishuju');
            $('.left-bottom-right').hide();
            $('.left-wenjianmulu').show();
            getFilesDir(config.yuanshushuju);
        })
        $('#guochengshuju').click(function(){
            HomePage.switchMenu('guochengshuju');
            $('.left-bottom-right').hide();
            $('.left-wenjianmulu').show();
            getFilesDir(config.guochengshuju);
        })
        $('#chengguoshuju').click(function(){
            HomePage.switchMenu('chengguoshuju');
            $('.left-bottom-right').hide();
            $('.left-wenjianmulu').show();
            getFilesDir(config.chengguoshuju);
        })

        // 检索对应的文件夹
        $('.left-bottom-right #all-data').click(function(){
            Agri.selectKey = '全部';
        })
        $('.left-bottom-right #yuanshi-data').click(function(){
            Agri.selectKey = '原始数据';
        })
        $('.left-bottom-right #guocheng-data').click(function(){
            Agri.selectKey = '过程数据';
        })
        $('.left-bottom-right #chengguo-data').click(function(){
            Agri.selectKey = '成果数据';
        })

        // 搜索
        $('.search-btn').click(function(){
            searchKeyWord = $('.search-input').val();
            if(Agri.currentType == 'tif') { // 影像
                getFiles('tif,img', false, 1, searchKeyWord);
            }
            if(Agri.currentType == 'shp') { // 矢量
                getFiles('shp', false, 1, searchKeyWord);
            }
            if(Agri.currentType == 'doc') {
                getFiles('doc,ppt,xls,xlsx,pptx', false, 1, searchKeyWord);
            }
            if(Agri.currentType == 'img') {
                getFiles('mp4,avi,mp3,wma,jpg,png,gif', false, 1, searchKeyWord);
            }
        })

        //切换成果类型
        $('.file-type #yingxiang').click(function(){
            HomePage.switchSubMenu('.chengguozhanshi','yingxiang');
            Agri.currentType = 'tif';
            getFiles('tif,img', false, 1, searchKeyWord);
        })
        $('#shiliang').click(function(){
            HomePage.switchSubMenu('.chengguozhanshi','shiliang');
            Agri.currentType = 'shp';
            getFiles(Agri.currentType, false, 1, searchKeyWord);
        })
        $('#wendang').click(function(){
            HomePage.switchSubMenu('.chengguozhanshi','wendang');
            Agri.currentType = 'doc';
            getFiles('doc,ppt,xls,xlsx,pptx', false, 1, searchKeyWord);
        })
        $('#duomeiti').click(function(){
            HomePage.switchSubMenu('.chengguozhanshi','duomeiti');
            Agri.currentType = 'img';
            getFiles('mp4,avi,mp3,wma,jpg,png,gif', false, 1, searchKeyWord);
        });
        $('.file-type #yingxiang').click();

        $('.before-page').click(function(){ // 上一页
            var currentPage = parseInt($('#current-page-num').html());
            if(currentPage > 1){
                currentPage = currentPage - 1;
                $('#current-page-num').html(currentPage);
                if(Agri.currentType == 'tif') { // 打开影像
                    getFiles('tif,img', false, currentPage, searchKeyWord);
                }
                if(Agri.currentType == 'shp') { // 打开矢量
                    getFiles('shp', false, currentPage, searchKeyWord);
                }
                if(Agri.currentType == 'doc') {
                    getFiles('doc,ppt,xls,xlsx,pptx', false, currentPage, searchKeyWord);
                }
                if(Agri.currentType == 'img') {
                    getFiles('mp4,avi,mp3,wma,jpg,png,gif', false, currentPage, searchKeyWord);
                }
            }
        });
        $('.after-page').click(function(){ // 下一页
            var totalPage = parseInt($('#total-page-num').html());
            var currentPage = parseInt($('#current-page-num').html());
            if(currentPage < totalPage) {
                currentPage = currentPage + 1;
                $('#current-page-num').html(currentPage);
                if(Agri.currentType == 'tif') { // 打开影像
                    getFiles('tif,img', false, currentPage, searchKeyWord);
                }
                if(Agri.currentType == 'shp') { // 打开矢量
                    getFiles('shp', false, currentPage, searchKeyWord);
                }
                if(Agri.currentType == 'doc') {
                    getFiles('doc,ppt,xls,xlsx,pptx', false, currentPage, searchKeyWord);
                }
                if(Agri.currentType == 'img') {
                    getFiles('mp4,avi,mp3,wma,jpg,png,gif', false, currentPage, searchKeyWord);
                }
            }
        });

        $('body').on('click', '.map-search-table tr', function(e){
            var filePath = decodeURI($(e.target).closest('tr').find('.imgfilepath').attr('data-fileallpath'));
            var fileSubPath = filePath.split('\\').join('\\\\');
            getFiles('tif,img', false, 1, fileSubPath);
        })

        $('body').on('click', '.layer-select input',function(){
            var input = $('.layer-select input');
            for(var i=0;i<input.length;i++){
                if(input[i].checked){
                    mapOl.imageType[i] = true;
                }
                else{
                    mapOl.imageType[i] = false;
                }
            }
            // 清空选择集
            mapOl.selectClear();
            mapOl.vecLayerRefresh();
        })
        //时间选择
        $('#date-range').dateRangePicker(
            {
                language:'cn',
                separator: ' 至 ',
                showShortcuts: true,
                shortcuts :
                {
                    'prev-days': [3,5,7],
                    'prev': ['week','month','year'],
                    'next-days':null,
                    'next':null
                }
            }).bind('datepicker-apply',function(event,obj)
        {
            /* This event will be triggered when user clicks on the apply button */
            var date = obj.value.split(' 至 ');
            var startDate = new Date(date[0].split('-').join(',')).getTime();
            var endDate = new Date(date[1].split('-').join(',')).getTime();
            mapOl.timeSelect[0] = true;
            mapOl.timeSelect[1] = startDate;
            mapOl.timeSelect[2] = endDate;
            $(".map-search-table tbody").html("");
            // 清空选择集
            mapOl.selectClear();
            mapOl.vecLayerRefresh();
        });
        //取消时间选择
        $('.shortcuts').append('<a href="javascript:;" class="cancel">取消选择</a>');
        $('.shortcuts .cancel').on('click',function(){
            mapOl.timeSelect[0] = false;
            $('#date-range').data('dateRangePicker').clear();
            $('#date-range').data('dateRangePicker').close();
            // 清空选择集
            mapOl.selectClear();
            mapOl.vecLayerRefresh();
        });

        $("input[name='date-type']").click(function(){
            var content = document.getElementsByName("date-type");
            for(var i = 0;i < content.length; i++)
            {
                if(content[i].checked)
                {
                    mapOl.timeSelect[3] = i;
                    // 清空选择集
                    mapOl.selectClear();
                    mapOl.vecLayerRefresh();
                }
            }
        });

        $("#xingzhengquButton").click(function(){
            if($("#xingzhengqu").val() == '')
            {
                mapOl.xingzhengSelect[0] = false;
            }else{
                mapOl.xingzhengSelect[0] = true;
                mapOl.xingzhengSelect[1] = $("#xingzhengqu").val();
            }
            // 清空选择集
            mapOl.selectClear();
            mapOl.vecLayerRefresh();
            if(!textFill.val()) return;
        });

        $("#setclear").click(function(){
            //取消点选框选
            $('.select .pan').siblings().removeClass('clicked').end().addClass('clicked');
            mapOl.map.removeInteraction(mapOl.select);
            mapOl.map.removeInteraction(mapOl.draw);
            $("#map-search").css("cursor","pointer");
            //取消时间选择
            mapOl.timeSelect[0] = false;
            $('#date-range').data('dateRangePicker').clear();
            $('#date-range').data('dateRangePicker').close();
            //取消分辨率选择
            mapOl.imageType[0] = true;
            mapOl.imageType[1] = false;
            mapOl.imageType[2] = false;
            var input = $('.layer-select input');
            input.eq(0).attr("checked","checked");
            input.eq(1).removeAttr("checked");
            input.eq(2).removeAttr("checked");
            //取消行政区选择
            mapOl.xingzhengSelect[0] = false;
            $("#xingzhengqu").val("");
            // 清空选择集
            mapOl.selectClear();
            mapOl.vecLayerRefresh();
        });
    },
    //切换主菜单
    switchMenu: function(menu){
        $('#' + menu).siblings().removeClass('clicked').end().addClass('clicked');
    },
    //切换成果类型
    switchSubMenu: function(mainMenu,subMenu){
        $(mainMenu + '#' + subMenu).siblings().removeClass('clicked').end().addClass('clicked');
    },
    switchContent:function(){
        var click = -1;
        //标题样式切换
        //右边内容切换
        $('.right .top-menu span:last-child').click(function(){
            $('.right .top-menu span:last-child').siblings().removeClass('clicked').end().addClass('clicked');
            $('.right .map-search').hide();
            $('.right .map-result').show();
            $('#map-watch').show();
        })
        $('.right .top-menu span:first-child').click(function(){
            $('.right .top-menu span:first-child').siblings().removeClass('clicked').end().addClass('clicked');
            $('.right .map-search').show();
            $('.right .map-result').hide();
            $('#map-watch').hide();
            //判断第一次点击
            click ++;
            if(click == 0){
                //mapOl.initMap();
                //mapOl.vecLayer("image");
                //mapOl.switchSelect();
            }   

        })
    }
};

function bindEvent() {
    // 下载
    $('#all-files').on('click','.file-download', function(e){
        getDriver(); // 初始化磁盘
        downloadFlag = true;
        $('#file-tree').show(200);
        currentDownloadDom = $(e.target).closest('.one-file');
        currentDownloadEvent = e;
    });

    // 删除文件
    $('#all-files').on('click','.file-remove', function(e){
        var fileDom = $(e.target).closest('.one-file');
        if(Agri.currentType == 'tif') { // 删除影像
            var filePath = JSON.parse(decodeURI(fileDom.attr('all-data'))).files[0].path;
            removeFile(filePath,'tif');
        }
        else if(Agri.currentType == 'shp') { // 删除矢量
            var files = JSON.parse(decodeURI(fileDom.attr('all-data'))).files;
            for(var i = 0; i < files.length; i++) {
                removeFile(files[i].path,'shp');
            }
        }
        else { // 删除文档和多媒体
            var filePath = JSON.parse(decodeURI(fileDom.attr('all-data'))).path;
            removeFile(filePath,'other');
        }
    });

    // 数据列表跳转到地图
    $('#all-files').on('click','.file-another', function(e){
        var fileDom = $(e.target).closest('.one-file');
        var filePath = JSON.parse(decodeURI(fileDom.attr('all-data'))).path;
        $('#all-search').click();
        mapOl.tableUpdate(filePath);
    });

    // 点击文件
    $('#all-files').on('click','.file-desc', function(e){
        $('#result-show').click();
        $('#map-result').html('');
        var fileDom = $(e.target).closest('.one-file');
        if(Agri.currentType == 'tif') { // 打开影像
            var filePath = JSON.parse(decodeURI(fileDom.attr('all-data'))).path;
            var input = {"req.type": "OpenImage", "filepath": filePath};
            $(".map-result").css("width","50%");
            $("#map-watch").remove();
            $(".right").append("<div class='atweizhi'; id='map-watch'; ></div>");
            updateMap(input,"map-result");
            MapForSearch(filePath);
        }
        if(Agri.currentType == 'shp') { // 打开矢量
            $("#map-watch").remove();
            $(".map-result").css("width","100%");
            $('.fakeloader').show();
            var files = JSON.parse(decodeURI(fileDom.attr('all-data'))).path;
            openShp(files)
        }
        else if(Agri.currentType == 'img') {
            $("#map-watch").remove();
            $(".map-result").css("width","100%");
            $('.fakeloader').hide();
            var filePath = JSON.parse(decodeURI(fileDom.attr('all-data'))).path;
            openImg(filePath);
        }
    });

    // 改变窗口大小
    $(window).bind("resize", function () {
        Agri.onePage = getFilePageNum();
        if(Agri.currentType == 'tif') { // 打开影像
            $('#yingxiang').click();
        }
        else if(Agri.currentType == 'img') {
            $('#duomeiti').click();
        }
        else  if(Agri.currentType == 'doc') {
            $('#wendang').click();
        }
        else  if(Agri.currentType == 'shp') {
            $('#shiliang').click();
        }
    });

    // 点击上传
    $('#uploadfile').click(function(e){
        getDriver(); // 初始化磁盘
        downloadFlag = false;
        $('#file-tree').show(200);
    });

    $('#file-list .currentdir').on('click','span',function(e){
        downloadFiles = [];
        switchDir(e ,'upload');
    });
    $('body').on('click','#file-list-dir .currentdir-dir span',function(e){
        downloadFiles = [];
        switchDir(e ,'yunpan');
    });

    $('#upload-file-list .currentdir').on('click','span',function(e){
        switchDir(e, 'upload');
    });

    $('.right-close').click(function(){
        $('#file-tree').hide(200);
    });
    $('.upload-file-table').on('click','tr',function(e){
        clickRecord(e, 'upload');
    });
    $('body').on('click','.file-table-dir tr',function(e){
        clickRecord(e, 'yunpan');
    });

    $('body').on('click','.upload-btn' ,function(e){
        if(!downloadFlag){
            uploadFile(e);
        }else{
            e.preventDefault();
            e.stopPropagation();
            var target = $(e.target);
            currentDownloadPath = target.closest('tr').find('.filename').text();
            $('#file-tree').hide(0);
            if(Agri.currentType == 'tif') { // 下载影像
                var filePath = JSON.parse(decodeURI(currentDownloadDom.attr('all-data'))).path;
                downloadFile(currentDownloadEvent, filePath);
            }
            else if(Agri.currentType == 'shp') { // 下载矢量
                var file = JSON.parse(decodeURI(currentDownloadDom.attr('all-data'))).path;
                var filePath = file.split(/\\[\w]*.shp/)[0] + '.rar';
                downloadFile(currentDownloadEvent, filePath);
            }
            else { // 下载文档和多媒体
                var filePath = JSON.parse(decodeURI(currentDownloadDom.attr('all-data'))).path;
                downloadFile(currentDownloadEvent, filePath);
            }
        }
    });

    // 网盘中点击文件下载
    $('body').on('click', '.yunpandownload', function(e) {
        e.stopPropagation();
        getDriver(); // 初始化磁盘
        downloadFlag = true;
        $('#file-tree').show(200);
        currentDownloadDom = $(e.target).closest('.one-file');
        currentDownloadEvent = e;
    })
}

// 获取某种类型文件
function getFiles(type, isDir, pageNum, searchKeyWord) {
    $('#current-page-num').html(pageNum);
    var onePage = Agri.onePage;
    var filePathType = "";
    if(Agri.selectKey != '全部') {
        filePathType = Agri.selectKey;
    }
    var keyWord = '&extra='+searchKeyWord + ',' + filePathType;
    if(keyWord == '&extra=,') {keyWord = '&extra='};
    var start = (pageNum-1)*onePage == 0 ? 1: (pageNum-1)*onePage;
    $.get('http://'+ config.pengxuIp +':8080/image/query?start_row='+start+'&end_row='+pageNum*onePage+'&type=' + type + keyWord, function(data){
        var allFile = JSON.parse(data);
        var totalNum = allFile.totalNum;
        $('#total-page-num').html(Math.ceil(totalNum/onePage));
        var result = allFile.result;
        setPages(result, isDir);
    })
}


function setPages(result, isDir) {
    var pageHTML = '';
    var getFileName = function(filePath){
        return filePath.split('\\')[filePath.split('\\').length - 1];
    }
    for(var i = 0; i < result.length; i++) {
        var fileDir = result[i].path.split('\\').slice(0, result[i].path.split('\\').length - 1).join('\\');
        if(isDir) {
            pageHTML += '' +
                '<li class="one-file" title="'+result[i].path+'" all-data="' + encodeURI(JSON.stringify(result[i])) + '">' +
                '    <div class="file-desc">' +
                '        <p class="file-name">' + getFileName(fileDir) + '</p>' +
                '        <p class="file-time">创建于<span>' + getTimeContent(result[i].create_time) + '</span></p>' +
                '    </div>' +
                '    <div class="downloading">' +
                '    </div>' +
                '    <ul>' +
                '        <li class="file-remove"></li>' +
                '        <li class="file-download"></li>' +
                    //'        <li class="file-something"></li>' +
                '        <li class="file-another" title="'+result[i].path+'"></li>' +
                '    </ul>' +
                '</li>';
        }
        else {
            pageHTML += '' +
                '<li class="one-file" title="'+result[i].path+'" all-data="' + encodeURI(JSON.stringify(result[i])) + '">' +
                '    <div class="file-desc">' +
                '        <p class="file-name">' + getFileName(result[i].path) + '</p>' +
                '        <p class="file-time">创建于<span>' + getTimeContent(result[i].create_time) + '</span></p>' +
                '    </div>' +
                '    <div class="downloading">' +
                '    </div>' +
                '    <ul>' +
                '        <li class="file-remove"></li>' +
                '        <li class="file-download"></li>' +
                    //'        <li class="file-something"></li>' +
                '        <li class="file-another"></li>' +
                '    </ul>' +
                '</li>';
        }
    }
    $('.file-list ul').html(pageHTML);
}

function getTimeContent(num){
    var date = new Date(parseInt(num));
    if(parseInt(num) != 0) {
        return date.getFullYear() + '年' + (date.getMonth() + 1) + '月' + date.getDate() + '日';
    }
    return '无';
}

function refreshCountFiles() {
    $.get('http://'+ config.pengxuIp +':8080/image/query?start_row=1&end_row=11&type=tif,tiff,img,shp,doc,ppt,xls,xlsx,pptx,mp4,avi,mp3,wma,jpg,png,gif', function(data){
        var result = JSON.parse(data);
        $('.user-result span').html(result.totalNum);
    })
}

function refeshGetMemory() {
    $.get('http://'+ config.ip +':8081/server/cloudDiskService/getMemory', function(data){
        var result = JSON.parse(data);
        var radialObj = $('#indicatorContainer').data('radialIndicator');
        radialObj.animate(Math.round(result.obj * 100));
    })
}

// 删除文件
function removeFile(filePath, type) {
    fileName = filePath.split(':\\')[1].split('\\' + userName[0])[1].replace(new RegExp(/(\\)/g), '/');
    if(type == 'shp') {
        $.get('http://'+config.ip+':8081/server/cloudDiskService/rm?path=' + fileName, function(data) {
            var data = JSON.parse(data);
            if (data.obj) {
                $('#shiliang').click();
            }
        })
    }
    else {
        $.get('http://'+config.ip+':8081/server/cloudDiskService/rm?path=' + fileName, function(data) {
            var data = JSON.parse(data);
            if (data.obj) {
                if(Agri.currentType == 'tif') { // 打开影像
                    $('#yingxiang').click();
                }
                else if(Agri.currentType == 'img') {
                    $('#duomeiti').click();
                }
                else  if(Agri.currentType == 'doc') {
                    $('#wendang').click();
                }
            }
        })
    }
}

function openShp(files) {
    mapShp = new ol.Map({
        target: 'map-result',
        controls: ol.control.defaults({
            attributionOptions:({
                collapsible: false
            })
        }),
        view: new ol.View({ 
            center: [114.4244,30.5154],
            zoom: 10
        })
    });
    //for(var i = 0; i < files.length; i++){
        mapShp.getLayers().push(new ol.layer.Vector({
            source:openOneShp(files)
        }));
    //}
}
//mapforsearch函数：输入一个tif文件路径，就画出全地图显示其所在位置的框框
function MapForSearch(fileName){
    console.log("MapFoeSearchBegin");
    var projection = ol.proj.get('EPSG:3857');
    var projectionExtent = projection.getExtent();
    var size = ol.extent.getWidth(projectionExtent) / 256;
    var resolutions = new Array(19);
    var matrixIds = new Array(19);
    for (var z = 0; z < 19; ++z) {
        // generate resolutions and matrixIds arrays for this WMTS
        resolutions[z] = size / Math.pow(2, z);
        matrixIds[z] = z;
    }
    mapsearch = new ol.Map({
        layers: [
            new ol.layer.Tile({
                opacity: 1,
                name:"base1",
                source: new ol.source.WMTS({
                    url: 'http://'+config.olmapIp+':9001/mapservice/wmts/service',
                    layer: 'Wuhan',
                    matrixSet: 'EPSG:4326',
                    format: 'image/png',
                    id:'12',
                    projection: projection,
                    tileGrid: new ol.tilegrid.WMTS({
                        origin: ol.extent.getTopLeft(projectionExtent),
                        resolutions: resolutions,
                        matrixIds: matrixIds
                    }),
                    style: 'default',
                    wrapX: true
                })
            }),
            new ol.layer.Tile({
                opacity: 0.9,
                name:"xingzheng1",
                source: new ol.source.WMTS({
//                        attributions: [attribution],
                    url: 'http://'+config.olmapIp+':9002/mapservice/wmts/service',
                    layer: 'Wuhan',
                    matrixSet: 'EPSG:4326',
                    format: 'image/png',
                    id:'12',
                    projection: projection,
                    tileGrid: new ol.tilegrid.WMTS({
                        origin: ol.extent.getTopLeft(projectionExtent),
                        resolutions: resolutions,
                        matrixIds: matrixIds
                    }),
                    style: 'default',
                    wrapX: true
                })
            }),
            new ol.layer.Vector({
                name:"dataQuy1",
                source: new ol.source.Vector({
                    Features:new ol.Collection(),
                    wrapX: false}),
                projection: "ESRI:4326",
                style: new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: 'rgba(255, 255, 255, 0.2)'
                    }),
                    stroke: new ol.style.Stroke({
                        color: '#ffcc33',
                        width: 2
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: '#ffcc33'
                        })
                    })
                })
            })

        ],
        target: 'map-watch',
        controls: ol.control.defaults({
            attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
                collapsible: false
            })
        }),
        view: new ol.View({
            projection: 'EPSG:4326',
            center: [113.4244,30.5154],
            zoom: 8

        })
    });
    var XHR=null;
    if (window.XMLHttpRequest) {
        // 非IE内核
        XHR = new XMLHttpRequest();
    } else if (window.ActiveXObject) {
        // IE内核,这里早期IE的版本写法不同,具体可以查询下
        XHR = new ActiveXObject("Microsoft.XMLHTTP");
    } else {
        XHR = null;
    }

    if(XHR){
        XHR.open("GET", "http://"+config.pengxuIp+":6001/mapservice/wfs/shp2/getfeature?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=imagemetainfo&maxFeatures=5000000",false);

        XHR.onreadystatechange = function () {

            if (XHR.readyState == 4 && XHR.status == 200) {
                var wfsSource1 = new ol.source.Vector({
                    loader : function(extent,resolution) {

                    },
                    projection: 'EPSG:4326',
                    strategy: ol.loadingstrategy.bbox
                });
                var last_features = wfsSource1.getFeatures();
                for(var i=0;i<last_features.length;i++){
                    wfsSource1.removeFeature(last_features[i]);
                }
                var response=JSON.parse(XHR.responseText);
                var format = new ol.format.GeoJSON({
                    defaultDataProjection:'EPSG:4326'
                });
                var _features = format.readFeatures(response,
                    {featureProjection: 'EPSG:4326'}
                );
                var style = new ol.style.Style({
                    fill: new ol.style.Fill({
                        color: [0, 153, 255, 0.1]
                    }),
                    stroke: new ol.style.Stroke({
                        color: [0, 153, 255, 0.3],
                        width: 2
                    }),
                    image: new ol.style.Circle({
                        radius: 7,
                        fill: new ol.style.Fill({
                            color: [0, 153, 255, 1]
                        })
                    })
                });

                _features[0].setStyle(style);
                wfsSource1.addFeatures(_features);
                nowX=_features[0].getGeometry().getFirstCoordinate()[0];
                nowY=_features[0].getGeometry().getFirstCoordinate()[1];


                var wfsLayer1 = new ol.layer.Vector({
                    source:wfsSource1
                });
                wfsLayer1.set("name","imageCon");
                mapsearch.getLayers().push(wfsLayer1);
                var newView =new ol.View({
                    projection: 'EPSG:4326',
                    center: [nowX,nowY],
                    zoom: 10 });
                mapsearch.setView(newView);
                // 主动释放,JS本身也会回收的
                XHR = null;
            }
        };
        XHR.send();
    }
}
function openOneShp(file) {
    var fileName = file.split('\\')[file.split('\\').length - 1].split('.shp')[0];
    var tmpData = new Date().getTime();
    var src = 'EPSG:3857'; 
    var times = 0;
    var shpwfs = new ol.source.Vector({
        loader : function(extent,resolution) {
            $.post("http://"+config.pengxuIp+":7001/registservice/regist?Request=regist&isReregist=false&mapid=" + tmpData,file.split('\\').join('\\\\'),function(data) {
                })
                .done(function(){
                    $.ajax({
                            url : "http://"+config.pengxuIp+":7002/mapservice/wfs/"+tmpData+"/getfeature?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME="+fileName+"&maxFeatures=10000"
                        })
                        .done(function(response) {
                            $('.fakeloader').hide();
                            src = response.crs.properties.name; 
                            var format = new ol.format.GeoJSON({
                                defaultDataProjection:src
                            });

                            var features = format.readFeatures(response,
                                {featureProjection: src} 
                            );
                            var style =new ol.style.Style({
                                fill: new ol.style.Fill({
                                    color: 'rgba(0, 0, 255, 1.0)'
                                }),
                                stroke: new ol.style.Stroke({
                                    color: 'rgba(0, 0, 255, 1.0)',
                                    width: 2
                                }),
                                image: new ol.style.Circle({
                                    radius: 7,
                                    fill: new ol.style.Fill({
                                        color: 'rgba(0, 0, 255, 1.0)'
                                    })
                                })
                            })

                            if(features.length>0){ 
                                for(var i=0;i<features.length;i++)
                                {
                                    features[i].setStyle(style);
                                }
                                shpwfs.addFeatures(features);
                                if(times == 0){
                                    var coordinates = features[0].getGeometry().getFirstCoordinate(); 
                                    var view = mapShp.getView(); 
                                    view.setCenter(coordinates);
                                    view.setZoom(25);            
                                    // view.setProjection(src);  
                                    $.post("http://"+config.pengxuIp+":7002/mapservice/wfs/"+tmpData+"/getfeature?SERVICE=WFS&VERSION=1.0.0&REQUEST=getcapabilities",function(data) {
                                        var result = data;
                                        var range = result.boundingbox[0].maxx - result.boundingbox[0].minx;
                                        var center = [(result.boundingbox[0].maxx + result.boundingbox[0].minx)/2,(result.boundingbox[0].maxy + result.boundingbox[0].miny)/2]
                                        view.setCenter(center);  
                                        if(src == 'EPSG:4326'){
                                            if(range < 0.6){
                                                view.setZoom(35);   
                                            }
                                            else if(range > 2){
                                                view.setZoom(15);      
                                            }
                                        }
                                        else if(src == 'EPSG:3857'){ 
                                            if(range <= 10000){
                                                view.setZoom(15);          
                                            } 
                                            else if(range> 10000 && range<= 50000){  
                                                view.setZoom(11);          
                                            } 
                                            else if(range> 50000 && range<= 100000){
                                                view.setZoom(9);           
                                            } 
                                            else if(range > 500000){ 
                                                view.setZoom(6);     
                                            } 
                                            // setInterval(function(){
                                            //     console.log(view.getZoom());
                                            // },1000);
                                        }
                                    });
                                  }  
                            }
                            times ++;
                           
                        });
                });

        },
        projection: src,
        strategy: ol.loadingstrategy.bbox
    });
    return shpwfs;
}

function openImg(filePath) {
    var fileUrl = 'http://'+config.ip+':8083/rscloud/' + filePath.split('Z:\\')[1].replace(/\\/g,'\/');
    var fileType = fileUrl.split('.')[fileUrl.split('.').length - 1].toLowerCase();
    if(['jpg', 'png', 'gif'].indexOf(fileType) != -1) { // 图片
        $('#map-result').html('<img style="height: 100%; width: auto;" src="'+fileUrl+'";/>')
    }
    else if(['mp4', 'avi', 'gif'].indexOf(fileType) != -1) { // 视频
        $('#map-result').html('<video style="height: 100%; width: auto;" controls autoplay><source src="'+fileUrl+'" type="video/mp4" /> </video>')
    }
    else if(['mp3', 'wma'].indexOf(fileType) != -1) { // 音乐
        $('#map-result').html('<audio style="padding-top: 40%; margin-top: -20px;" controls autoplay><source src="'+fileUrl+'" type="audio/mp3" /> </audio>')
    }
    $('.fakeloader').hide();
}

function getFilePageNum() {
    return Math.floor(($('.left-bottom-right')[0].clientHeight - 80) * 0.8 / 51);

}

// 获取磁盘信息
function getDriver(flag){
    $.get('http://'+config.ftpServerIp+':18901/api/v1/disk_drivers', function (data) {
        var driverData = JSON.parse(data);
        document.querySelector('#upload-file-list .currentdir').innerHTML =  "<span>我的电脑</span>";
        var dirfile = '';
        if(driverData.status){
            for(var i = 0; i < driverData.drivers.length; i++) {
                dirfile += '<tr><td><img src="../img/wenjianjia.png"/></td>' +
                    '<td><p class="filename">' + driverData.drivers[i] + '</p><p class="info"></p></td>' +
                    '<td><p>磁盘</p></td><td><p></p></td><td><input type="button" class="upload-btn" value="确定" disabled/></td></tr>'
            }
            $('.upload-file-table tbody').html(dirfile);
        }
        else{
            alert('获取磁盘信息失败');
        }
    })
}

// 切换目录
function switchDir(e, flag){
        if(flag == 'upload') {
            var currentDir1 = $(document.querySelector('#upload-file-list .currentdir')).text().split('>');
            var index1 = $(e.target).index();
            var uploadDirString = '';
            if(index1 > 1) {
                var currentClickDir1 = currentDir1.slice(1, index1);
                uploadDirString = currentClickDir1[0] + ':/' + currentClickDir1.slice(1).join('/');
            }else if(index1 == 1){
                uploadDirString = currentDir1[1] + ':';
            }else{
                getDriver(); // 初始化磁盘
            }
            getuploadFiles(uploadDirString);
        }
        else if(flag == 'yunpan') {
            var currentDir = $(document.querySelector('#file-list-dir .currentdir-dir')).text().split('>');
            var index1 = $(e.target).index();
            var uploadDirString = currentDir.slice(0, index1 + 1);
            getFilesDir(uploadDirString.join('/'));
        }
}

// 获取磁盘内文件的信息
function getuploadFiles(dirname ){
    $.ajax({
        url : 'http://'+config.ftpServerIp+':18901/api/v1/disk_path?path=' + dirname,
        contentType : "application/x-www-form-urlencoded; charset=utf-8",
        timeout : 300000,
        success : function(data) {
            var userData = JSON.parse(data);
            if(userData.status) {
                var currentdir = "<span>我的电脑</span>&gt;" + "<span>"+ dirname.split(':')[0] +"</span>";
                document.querySelector('#upload-file-list .currentdir').innerHTML = currentdir +  '<span>' + dirname.split(':')[1].split('/').join('</span>&gt;<span>') + '</span>';
                var onefile = ''; // 文件字符串
                var dirfile = ''; // 目录字符串
                if(!downloadFlag) {
                    for (var j = 0; j < userData.paths.length; j++) {
                        if (userData.paths[j].is_dir) { // 文件夹
                            dirfile += '<tr><td><img src="../img/wenjianjia.png"/></td>' +
                                '<td><p class="filename">' + userData.paths[j].Path + '</p><p class="info"></p></td>' +
                                '<td><p>文件夹</p></td><td><p></p></td><td><input type="button" class="upload-btn" value="上传" disabled/></td></tr>'
                        } else { // 文件
                            onefile += '<tr data-file=' + encodeURI(userData.paths[j].Path) + '><td><img src="../img/wenjian0.png"/></td>' +
                                '<td><p class="filename">' + userData.paths[j].Path + '</p><p class="info"></p></td>' +
                                '<td><p>文件</p></td><td><p></p></td><td><input type="button" class="upload-btn" value="上传"/></td></tr>'
                        }
                    }
                }else{
                    for (var j = 0; j < userData.paths.length; j++) {
                        if (userData.paths[j].is_dir) { // 文件夹
                            dirfile += '<tr><td><img src="../img/wenjianjia.png"/></td>' +
                                '<td><p class="filename">' + userData.paths[j].Path + '</p><p class="info"></p></td>' +
                                '<td><p>文件夹</p></td><td><p></p></td><td><input type="button" class="upload-btn" value="确定"/></td></tr>'
                        }
                    }
                }
                $('.upload-file-table tbody').html(dirfile + onefile);
            }else{
                alert('获取磁盘内文件信息失败');
            }
        }
    })
}


// 点击网盘中一条记录
function clickRecord(e, flag) {
    var target = $(e.target);
    if (target.closest('tr').attr('data-file') && flag == 'yunpan') { // 云盘中的单个文件
        $('#result-show').click();
        $('#map-result').html('');
        var fileDom = JSON.parse(decodeURI($(e.target).closest('tr').attr('data-file'))).path;
        console.log(fileDom)
        var fileType = fileDom.split('.')[fileDom.split('.').length - 1].toLowerCase();
        if(fileType == 'tif' || fileType == 'img') { // 打开影像
            var input = {"req.type": "OpenImage", "filepath": fileDom};
            $(".map-result").css("width","50%");
            $("#map-watch").remove();
            $(".right").append("<div class='atweizhi'; id='map-watch'; ></div>");
            updateMap(input,"map-result");
            MapForSearch("D:\\成果数据\\3566.0-521.0\\3566.0-521.0.tif")
            //MapForSearch(fileDom);
        }
        if(fileType == 'shp') { // 打开矢量
            $('#result-show').click();
            $('#map-result').html('');
            $("#map-watch").remove();
            $(".map-result").css("width","100%");
            $('.fakeloader').hide();
            openShp(fileDom)
        }
        else if(fileType == 'jpg' || fileType == 'mp4'|| fileType == 'mp3'|| fileType == 'avi'|| fileType == 'wma'|| fileType == 'png'|| fileType == 'gif') {
            $("#map-watch").remove();
            $(".map-result").css("width","100%");
            openImg(fileDom);
        }
        else if(fileType == 'pdf') {
            $("#map-watch").remove();
            $(".map-result").css("width","100%");
            var fileUrl = 'http://'+config.ip+':8083/rscloud/' + fileDom.split('Z:\\')[1].replace(/\\/g,'\/');
            window.open(fileUrl)
        }
        //var input = target.closest('tr').find('input[type="checkbox"]')
        //input.click();
        //var path = target.closest('tr').data('file');
        //var index = downloadFiles.indexOf(path);
        //
        //if(index != -1 && !input.is(':checked')){
        //    downloadFiles.splice(index,1);
        //    target.closest('tr').removeClass('choosed');
        //}else if(index == -1 && input.is(':checked')){
        //    target.closest('tr').addClass('choosed');
        //    downloadFiles.push(path);
        //}

    } else { // 目录
        if (flag == 'yunpan') {
            var currentDir = $(document.querySelector('#file-list-dir .currentdir-dir')).text().split('>');
            currentDir.push(target.closest('tr').find('.filename-dir').text());
            getFilesDir(currentDir.join('/'));
        } else if (flag == 'upload'&& !target.closest('tr').attr('data-file')) {
            var currentDir = target.closest('tr').find('.filename').text();
            getuploadFiles(currentDir);
        }
    }
}

var xingzhengquBox = $("#autoxingzhengqu"),
    xingzhengquUl = $("#autoxingzhengqu ul"),
    dizhiBox = $(".autodizhi"),
    dizhiUl = $(".autodizhi ul"),
    textFill = $("#xingzhengqu");
$("#xingzhengqu").on("keyup",function(e){

    if(e.keyCode!=38&&e.keyCode!=40&&e.keyCode!=13){
        textSearch = $(this).val();
        if(textSearch===""){
            xingzhengquBox.hide();
        }else {
            setTimeout(function(){
                autoMapPg.getData(textSearch,xingzhengquBox,xingzhengquUl);
            },100)
        }
    }
});
$("#txtAddress").on("keyup",function(e){

    if(e.keyCode!=38&&e.keyCode!=40&&e.keyCode!=13){
        textSearch = $(this).val();
        if(textSearch===""){
            dizhiBox.hide();
        }else {
            setTimeout(function () {
                autoMapPg.getData(textSearch, dizhiBox, dizhiUl);
            }, 100)
        }
    }
});

$("#autoxingzhengqu ul").on("click",".suggestItem",function(e){
    var ft = $(this).attr("data-item");
    $("#xingzhengqu").val(ft);

    autoMapPg.getData(ft,xingzhengquBox,xingzhengquUl).then(function (data) {

        //autoMapPg.abovePoint(data,ft)
    })
});
$(".autodizhi ul").on("click",".suggestItem",function(e){
    var ft = $(this).attr("data-item");
    $("#txtAddress").val(ft);

    var coordX=parseFloat($(this).attr("data-addressX"));
    var coordY=parseFloat($(this).attr("data-addressY"));
    var location= ol.proj.fromLonLat([coordX, coordY],"EPSG:4326");

    mapOl.flyTo(location,function () {});
    autoMapPg.getData(ft, dizhiBox, dizhiUl).then(function (data) {
        //autoMapPg.abovePoint(data,ft)
    })
});


var autoMapPg={
    //获取实时提示数据
    getData : function(textSearch,box,Ul){
        var dfd = $.Deferred(),
            searchHtml = "",
            addressDistrict = "";
        if(textSearch){
            var ft = textSearch.toString().toLowerCase();
            $.ajax({
                type:"post",
                data:"address_name="+ft,
                url:"http://192.168.106.104:8002/server/address/search",
                success:function(result){
                    var result = JSON.parse(result).obj;
                    console.log(result)
                    if(result.length){
                        for(var i=0,len=result.length;i<len;i++){
                            addressDistrict = result[i].addressDistrict == "无" ? "" : result[i].addressDistrict;
                            searchHtml += '<li class="suggestItem" data-item="'+result[i].addressName+'" data-addressX="'+result[i].addressX+'" data-addressY="'+result[i].addressY+'"><i class="default">'+result[i].addressName+'</i><em>'+addressDistrict+'</em></li>';

                        }
                    }
                    box.show().siblings().hide();
                    Ul.html(searchHtml);
                    listLength = Ul.children().length;
                    dfd.resolve(result);
                }
            });
            return dfd.promise();
        }else{
            autoUl.html("");
            $(".dataUpload").show();
        }

    }
};
$(":not(.xingzhengqu)").on("click",function (e) {
    $("#autoxingzhengqu").hide();
});
$(":not(.dingwei)").on("click",function (e) {
    $(".autodizhi").hide();
});
