var current_dir = ''; // 上传文件用到的当前目录



function getFilesDir( dirname){
    $.get('http://'+ config.ip +':8081/server/cloudDiskService/fileMetaInfo?path='+dirname+'&recursion=false&pattern=(.)*.', function (data) {
        document.querySelector('#file-list-dir .currentdir-dir').innerHTML = '<span>' + dirname.split('/').join('</span>&gt;<span>') + '</span>';
        current_dir = dirname;
        var alldata = JSON.parse(JSON.parse(data)['obj']);
        var files = alldata.files;
        var dirs = alldata.dirs;
        var onefile = ''; // 文件字符串
        var dirfile = ''; // 目录字符串

        for(var i = 0; i < dirs.length; i++) {
            dirfile += '<tr><td><img src="../img/wenjianjia.png"/></td>' +
                '<td><p class="filename-dir">' + dirs[i].name + '</p><p class="info-dir"></p></td>' +
                '<td><p>文件夹</p></td><td><p></p></td><td></td></tr>'
        }
        for(var i = 0; i < files.length; i++) {
            onefile += '<tr class="one-file" title="'+files[i].path+'" data-file=' + encodeURI(JSON.stringify(files[i])) + '><td><img src="../img/wenjian0.png"/></td>' +
                '<td><p class="filename-dir">' + files[i].name + '</p><p class="info-dir">' + '' + files[i].modifyTime.split(' ')[0] + '</p></td>' +
                '<td><p>' + parseInt(files[i].size) + 'KB</p></td><td><p class="yunpandownload .file-download"></p></td></tr>'
        }
        $('.file-table-dir tbody').html(dirfile + onefile);
    })
}