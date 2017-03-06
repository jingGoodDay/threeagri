dojo.require("esri.map");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");

var arcgisMap;
window.index = 0;
function updateMap(input,mapId) {
    $(".fakeloader").show();
    console.log(input)
    $.post('http://'+ config.ip +':10210/services/InstructServer/OpenImage', JSON.stringify(input), function (output) {
        console.log(output)
        output = JSON.parse(output);
        var param = {};
        param.lods = [];
        for (var i = 0; i < output.metainfo.level_num; i++) {
            var temp = {
                "level": i,
                "scale": output.metainfo.scales[i],
                "resolution": output.metainfo.resolutions[i]
            };
            param.lods.push(temp);
        }
        param.extent = output.metainfo.geo_rect;
        param.sid = output.sid;

        if(window.index > 0){
            arcgisMap.destroy();
        }

        function init() {
            initLayer();
            index++;
            arcgisMap = new esri.Map(mapId, {logo: false, autoResize: true});
            arcgisMap.addLayer(new ogc.WMTSLayer());
            arcgisMap.resize(true);
            arcgisMap.reposition();
        }

        function initLayer() {
            dojo.declare("ogc.WMTSLayer", esri.layers.TiledMapServiceLayer, { // create WMTSLayer by extending esri.layers.TiledMapServiceLayer
                constructor: function () {
                    this.spatialReference = new esri.SpatialReference({
                        wkid: 3857
                    });
                    this.initialExtent = new esri.geometry.Extent(param.extent.min_x, param.extent.min_y, param.extent.max_x, param.extent.max_y, this.spatialReference);
                    this.fullExtent = new esri.geometry.Extent(param.extent.min_x, param.extent.min_y, param.extent.max_x, param.extent.max_y, this.spatialReference);

                    this.tileInfo = new esri.layers.TileInfo({
                        "dpi": " 90.714",
                        "format": "image/jpeg",
                        "compressionQuality": 0,
                        "spatialReference": {
                            "wkid": "3857"
                        },
                        "rows": 256,
                        "cols": 256,
                        "origin": {
                            "x": param.extent.min_x,
                            "y": param.extent.max_y
                        },
                        "lods": param.lods
                    });
                    this.loaded = true;
                    this.onLoad(this);
                    $(".fakeloader").hide();
                },

                getTileUrl: function (level, row, col) {
                    return "http://"+ config.ip +":10210/services/MapServer/" + param.sid + "?SERVICE=WMTS&VERSION=1.0.0&REQUEST=GetTile" + "&LAYER=medford:zoning" + "&STYLE=_null" + "&FORMAT=image/jpeg" + "&TILEMATRIXSET=EPSG:900913" + "&TileMatrix=" + level + "&TILEROW=" + row + "&TILECOL=" + col;
                }
            });
        }

        dojo.ready(init);
    })
}
