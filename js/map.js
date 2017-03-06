
var mapOl = {
    map:"",
    select_array:[],
    imageType:[true,false,false], //米级，亚米级，中分
    timeSelect:[false,0,0,0], //是否选择，开始时间，结束时间，时间类型
    xingzhengSelect:[false,''],
    setCunName: function(name) {
        var nameArr = name.split(',');
        if(nameArr.length > 2) {
            return nameArr[0] + ',' + nameArr[1];
        }
        else {
            return nameArr.join(',');
        }
    },
    initMap:function(){
        var projection = ol.proj.get('EPSG:3857');
        var projectionExtent = projection.getExtent();
        //console.log(ol.extent.getTopLeft(projectionExtent));
        var size = ol.extent.getWidth(projectionExtent) / 256;
        var resolutions = new Array(19);
        var matrixIds = new Array(19);
        for (var z = 0; z < 19; ++z) {
            // generate resolutions and matrixIds arrays for this WMTS
            resolutions[z] = size / Math.pow(2, z);
            matrixIds[z] = z;
        }

//        var attribution = new ol.Attribution({
////            html: 'Tiles &copy; <a href="http://services.arcgisonline.com/arcgis/rest/' +
////                'services/Demographics/USA_Population_Density/MapServer/">ArcGIS</a>'
//        });
        mapOl.map = new ol.Map({
            layers: [
                new ol.layer.Tile({
                    opacity: 1,
                    name:"base",
                    source: new ol.source.WMTS({
//                        attributions: [attribution],
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
                    name:"xingzheng",
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
                    name:"dataQuy",
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
            target: 'map-search',
            controls: ol.control.defaults({
                attributionOptions: /** @type {olx.control.AttributionOptions} */ ({
                    collapsible: false
                })
            }),
            view: new ol.View({
                //center: [14058582, 3013697],
                //zoom: 5
                projection: 'EPSG:4326',
                center: [113.4244,30.5154],
                zoom: 8

            })
        });
    },
    changeBg:function(){
        document.body.onmousewheel = function(event) {
            var zoom = mapOl.map.getView().getZoom();
            mapOl.map.getLayers().forEach(function(layer,i) {
                //行政图层消失
                if (layer.get("name") == "xingzheng") {
                    if( zoom > 14){
                        //console.log(zoom);
                        layer.setOpacity(0);
                    }else {
                        layer.setOpacity(0.9);
                    }
                }
            });
        };
    },
    vecLayer:function(layerName){
        var last_features = "";
        var wfsSource = new ol.source.Vector({
            loader : function(extent,resolution) {
                //console.log("请求开始：");
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
                    XHR.open("GET", "http://"+config.pengxuIp+":6001/mapservice/wfs/shp2/getfeature?SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&TYPENAME=imagemetainfo&maxFeatures=5000000");

                    XHR.onreadystatechange = function () {
                        // readyState值说明
                        // 0,初始化,XHR对象已经创建,还未执行open
                        // 1,载入,已经调用open方法,但是还没发送请求
                        // 2,载入完成,请求已经发送完成
                        // 3,交互,可以接收到部分数据

                        // status值说明
                        // 200:成功
                        // 404:没有发现文件、查询或URl
                        // 500:服务器产生内部错误
                        if (XHR.readyState == 4 && XHR.status == 200) {
                            //清除上次加载的数据
                            var last_features = wfsSource.getFeatures();
                            for(var i=0;i<last_features.length;i++){
                                wfsSource.removeFeature(last_features[i]);
                            }
                            // 清空选择集
                            mapOl.selectClear();

                            // 这里可以对返回的内容做处理
                            // 一般会返回JSON或XML数据格式
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

                            var features = [];
                            var count = 0;
                            for(var i=0;i<_features.length;i++)
                            {
                                var isChose = [false,true,true];
                                //只要原始数据
                                // console.log(_features[i].get("file_name"));
                                if(_features[i].get("file_name").indexOf("成果数据")!= -1){
                                    //分辨率筛选
                                    var res = parseFloat(_features[i].get("res"));
                                    if(mapOl.imageType[0] == true && res < 0.998 ){  //亚米
                                        isChose[0] = true;
                                    }
                                    if(mapOl.imageType[1] == true && res > 0.999 && res < 9.9999 ){ //米
                                        isChose[0] = true;
                                    }
                                    if(mapOl.imageType[2] == true && res > 9.9999){  //中分
                                        isChose[0] = true;
                                    }
                                    //时间筛选
                                    if(mapOl.timeSelect[0] == true ){
                                        isChose[1] = false;
                                        //时间筛选类型
                                        var time = 0;
                                        if(mapOl.timeSelect[3] == 0){
                                            time = _features[i].get("time");
                                        }else if(mapOl.timeSelect[3] == 1){
                                            time = _features[i].get("image_date");
                                        }
                                        if(time >= mapOl.timeSelect[1] && time <= mapOl.timeSelect[2]){
                                            isChose[1] = true;
                                        }
                                    }
                                    //行政区筛选
                                    if(mapOl.xingzhengSelect[0] == true ){
                                        isChose[2] = false;
                                        var string = mapOl.xingzhengSelect[1];
                                        if([0,1,2,3,4,5,6,7,8,9].indexOf(parseInt(string[0])) == -1){
                                            // 汉字
                                            if(_features[i].get("quxianjie").indexOf(string)!= -1 || _features[i].get("cunjie").indexOf(string)!= -1){
                                                isChose[2] = true;
                                            }
                                        }else{
                                            var cuncode = _features[i].get("cunjie_daima").split(",");
                                            for(var index=0;index < cuncode.length;index++){
                                                if(string == cuncode[index]){
                                                    isChose[2] = true;
                                                }
                                            }
                                        }
                                    }
                               }
                                // console.log(isChose);
                                if(isChose[0] == true && isChose[1] == true && isChose[2] == true){
                                    _features[i].setStyle(style);
                                    features.push(_features[i]);
                                    count ++;
                                    if(count < 50){
                                        mapOl.updateDate(_features[i]);
                                    }
                                }
                            }
                            //console.log(features);
                            if(features.length > 0){
                                //mapOl.setView(_features[0],12);
                                wfsSource.addFeatures(features);
                            }
                            // 主动释放,JS本身也会回收的
                            XHR = null;
                        }
                    };
                    XHR.send();
                }
            },
            projection: 'EPSG:4326',
            strategy: ol.loadingstrategy.bbox
        });

        var wfsLayer = new ol.layer.Vector({
            source:wfsSource
        });
        wfsLayer.set("name","imageCon");
        mapOl.map.getLayers().push(wfsLayer);
    },
    //右边切换
    switchSelect: function(){
        mapOl.select = new ol.interaction.Select({
            layers: function(lays){
                if(lays.get("name")=="imageCon")
                {
                    return true;
                }
            },
            condition: function(mapBrowserEvent) {
                return ol.events.condition.click(mapBrowserEvent)
            }
        });

        //红色
        mapOl.selectStyle  = new ol.style.Style({
            fill: new ol.style.Fill({
                color: [255, 255, 255, 0.5]
            }),
            stroke: new ol.style.Stroke({
                color: [255, 91, 34, 0.5],
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: [255, 91, 34, 0.5]
                })
            })
        });

        //蓝色
        mapOl.defaultStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: [0, 153, 255, 0.1]
            }),
            stroke: new ol.style.Stroke({
//                color: [0, 153, 255, 0.5],
                color: [0, 153, 255, 0.3],
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: [0, 153, 255, 0.5]
                })
            })
        });

        //透明
        mapOl.hiddenStyle = new ol.style.Style({
            fill: new ol.style.Fill({
                color: [0, 153, 255, 0]
            }),
            stroke: new ol.style.Stroke({
//                color: [0, 153, 255, 0.5],
                color: [0, 153, 255, 0],
                width: 2
            }),
            image: new ol.style.Circle({
                radius: 7,
                fill: new ol.style.Fill({
                    color: [0, 153, 255, 0]
                })
            })
        });
        var drawInteraction = function(source, type) {
            if (type !== 'None') {
                var geometryFunction, maxPoints;
                if (type === 'Square') {
                    type = 'Circle';
                    geometryFunction = ol.interaction.Draw.createRegularPolygon(4);
                } else if (type === 'Box') {
                    type = 'LineString';
                    maxPoints = 2;
                    geometryFunction = function(coordinates, geometry) {
                        if (!geometry) {
                            geometry = new ol.geom.Polygon(null);
                        }
                        var start = coordinates[0];
                        var end = coordinates[1];
                        geometry.setCoordinates([
                            [start, [start[0], end[1]], end, [end[0], start[1]], start]
                        ]);
                        return geometry;
                    };
                }

                mapOl.draw = new ol.interaction.Draw({
                    source: source,
                    type: /** @type {ol.geom.GeometryType} */ (type), //如果是Polygon，则此处默认
                    geometryFunction: geometryFunction,
                    maxPoints: maxPoints
                });

                //画图结束后
                mapOl.draw.on('drawend',
                    function(evt) {
                        // 清空选择集
                        mapOl.selectClear();
                        mapOl.map.getLayers().forEach(function(layer,i) {
                            //查找数据图层
                            if (layer.get("name") == "imageCon") {
                                var data = layer.getSource().getFeatures();
                                for(var i=0;i<data.length;i++){
                                    //如果数据在选择范围内
                                    if (scopeContain(evt.feature, data[i])) {
                                        data[i].setStyle(mapOl.selectStyle);
                                        mapOl.updateDate(data[i]);
                                        mapOl.select_array.push(data[i]);
                                    } else {
                                        data[i].setStyle(mapOl.defaultStyle)
                                    }
                                }
                            }
                        });
                        //消除绘制范围
                        var style = new ol.style.Style({
                            fill: new ol.style.Fill({
                                color: 'rgba(255, 255, 255, 0)'
                            }),
                            stroke: new ol.style.Stroke({
                                color: 'rgba(255, 255, 255, 0)',
                                width: 2
                            }),
                            image: new ol.style.Circle({
                                radius: 7,
                                fill: new ol.style.Fill({
                                    color: 'rgba(255, 255, 255, 0)'
                                })
                            })
                        });

                        evt.feature.setStyle(style);
                        source.clear();
                    }, this);
                mapOl.map.addInteraction(mapOl.draw);
            }
        };
        var scopeContain = function(taskScope, feature) {
            //转化为WKT格式
            var format = new ol.format.WKT();
            var feature = format.writeFeature(feature);
            var taskScope = format.writeFeature(taskScope);
            //转化为jsts格式
            var reader = new jsts.io.WKTReader();
            feature = reader.read(feature);
            taskScope = reader.read(taskScope);
            //判断是否在taskScope内
            return taskScope.contains(feature);
        };
        var selectPoint = function(){
            $('.select .point').siblings().removeClass('clicked').end().addClass('clicked');
            mapOl.map.removeInteraction(mapOl.draw);
            mapOl.map.addInteraction(mapOl.select);
            $("#map-search").css("cursor","default");
            // 清空选择集
            mapOl.selectClear();
            mapOl.select.on("select", function() {
                var selected_collection = mapOl.select.getFeatures().getArray(); //返回集不同，因此需要加getArray()
                if (selected_collection != null && selected_collection.length > 0) {
                    if (selected_collection.length == 1) {
                        //清空表格
                        $(".map-search-table tbody").html("");
                        //将上一个选择结果换为普通样式
                        for(var i=0;i<mapOl.select_array.length;i++){
                            mapOl.select_array[i].setStyle(mapOl.defaultStyle);
                        }
                        mapOl.select_array.length = 0;
                        //将当前要素设置为选择集的第一个
                        mapOl.select_array.push(selected_collection[0]);
                        mapOl.select_array[0].setStyle(mapOl.selectStyle);
                        mapOl.updateDate(mapOl.select_array[0]);
                    } else {
                        alert("不可选择多个！");
                        //清空表格
                        $(".map-search-table tbody").html("");
                        //将上一个选择结果换为普通样式
                        for(var i=0;i<mapOl.select_array.length;i++){
                            mapOl.select_array[i].setStyle(mapOl.defaultStyle);
                        }
                        mapOl.select_array.length = 0;
                    }
                }
            })
        };
        var selectPolygon = function(){
            $('.select .polygon').siblings().removeClass('clicked').end().addClass('clicked');
            mapOl.map.removeInteraction(mapOl.select);
            $("#map-search").css("cursor","default");
            // 清空选择集
            mapOl.selectClear();
            mapOl.map.getLayers().forEach(function(layer,i) {
                //查询图层
                if (layer.get("name") == "dataQuy") {
                    drawInteraction(layer.getSource(),'Box');
                }
            });

        };

        $('.select .pan').click(function(){
            $('.select .pan').siblings().removeClass('clicked').end().addClass('clicked');
            mapOl.map.removeInteraction(mapOl.select);
            mapOl.map.removeInteraction(mapOl.draw);
            $("#map-search").css("cursor","pointer");
            // 清空选择集
            mapOl.selectClear();
        });
        //点选框选切换
        $('.select .point').click(selectPoint);
        $('.select .polygon').click(selectPolygon);
    },
    updateDate:function(feature){
        var filePath = feature.get("file_name");
        if(filePath.length >30) {
            var start = filePath.substr(0,15);
            var end = filePath.substr(filePath.length - 15,filePath.length);
            filePath = start + '...' + end;
        }
        $(".map-search-table tbody").append(' <tr  title="'+ feature.get("file_name") +'"  data-time="'+feature.get("time")+'"> '+
            '<td>'+feature.get("spatial_ref")+'</td>'+
            '<td>'+feature.get("level_num")+'</td>'+
            '<td>'+feature.get("band_n")+'</td>'+
            '<td>'+feature.get("img_w")+'</td>'+
            '<td>'+feature.get("img_h")+'</td>'+
            '<td>'+feature.get("res")+'</td>'+
            '<td>'+getTimeContent(feature.get("time"))+'</td>'+
            '<td>'+getTimeContent(feature.get("image_date"))+'</td>'+
            '<td title="'+feature.get("quxianjie")+'">'+mapOl.setCunName(feature.get("quxianjie"))+'</td>'+
            '<td title="'+feature.get("cunjie")+'">'+mapOl.setCunName(feature.get("cunjie"))+'</td>'+
            '<td class="imgfilepath" data-fileallpath="'+encodeURI(feature.get("file_name"))+'" style="width:120px">'+ filePath +'</td>'+
            '</tr>'
        )
    },
    tableUpdate:function(file_name){
        mapOl.map.getLayers().forEach(function(layer,i){
            if (layer.get("name") == "imageCon") {
                var wfsSource = layer.getSource();
                var features = wfsSource.getFeatures();
                for(var i=0;i<features.length;i++){
                    features[i].setStyle(mapOl.hiddenStyle);
                    if(features[i].get("file_name")==file_name){
                        //清空表格
                        $(".map-search-table tbody").html("");
                        // for(var j=0;j<mapOl.select_array.length;j++){
                        //     mapOl.select_array[j].setStyle(mapOl.defaultStyle);
                        // }
                        mapOl.select_array.length = 0;
                        //更新
                        features[i].setStyle(mapOl.selectStyle);
                        mapOl.updateDate(features[i]);
                        mapOl.setView(features[i],10); 
                        mapOl.select_array.push(features[i]);
                    }
                }
            }
        });

    },
    //矢量图层刷新
    vecLayerRefresh:function(){
        mapOl.map.getLayers().forEach(function(layer,i){
            if (layer.get("name") == "imageCon") {
                layer.getSource().clear();
            }
        });
    },
    //
    setView:function(feature,zoom){
        var coordinates = feature.getGeometry().getFirstCoordinate();
        var view = mapOl.map.getView();
        view.setCenter(coordinates);
        view.setZoom(zoom);
    },
    // 清空选择集
    selectClear:function(){
        //清空表格
        $(".map-search-table tbody").html("");
        //将上一个选择结果换为普通样式
        for(var i=0;i<mapOl.select_array.length;i++){
            mapOl.select_array[i].setStyle(mapOl.defaultStyle);
        }
        mapOl.select_array.length = 0;
        mapOl.select.getFeatures().clear();
    },

    //点击地址后动画飞移到该地点并在目标点加上标记
    flyTo:function (location, done) {
        //清空地图上的小图标
        mapOl.map.getLayers().forEach(function(layer,i) {
            if (layer.get("name") == "dataQuy") {
                layer.getSource().clear();
            }
        });
        var duration = 2000;
        var view = mapOl.map.getView();
        var zoom = view.getZoom();
        var parts = 2;
        var called = false;
        function callback(complete) {
            --parts;
            if (called) {
                return;
            }
            if (parts === 0 || !complete) {
                called = true;
                done(complete);
            }
        }
        view.animate({
            center: location,
            duration: duration
        }, callback);
        view.animate({
            zoom: zoom - 1,
            duration: duration / 2
        }, {
            zoom: zoom + 1,
            duration: duration / 2
        }, callback);
        //加标记

        mapOl.map.getLayers().forEach(function(layer,i) {
            //查找数据图层
            if (layer.get("name") == "dataQuy") {
                layer.getSource().clear();
                var marker=new ol.Feature({
                    name:"marker",
                    geometry: new ol.geom.Point(location)
                });
                marker.setStyle(new ol.style.Style({
                    image: new ol.style.Icon(/** @type {olx.style.IconOptions} */ ({
                        src: '../img/marker.png',
                        scale: 0.45
                    }))
                }));
                layer.getSource().addFeature(marker);
            }
        });
    }
};
