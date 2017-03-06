
// 点击上传文件
function uploadFile(e){
    var target = $(e.target);
    var path = decodeURI(target.closest('tr').data('file'));
    var ftpConfig = {
        ftp_user: 'admin',
        ftp_pwd: 'admin',
        remotefile: 'ftp://' + config.ip + ':222/' + current_dir + '/' + path.split('/')[path.split('/').length - 1],
        localfile: path,
        user: userName[0]
    };
    console.log(path)
    console.log(ftpConfig.remotefile)
    var loopProcess = function (taskID) {
        $.get('http://'+config.ftpServerIp+':18901/api/v1/task_info?task_id=' + taskID, function (data) {
            data = JSON.parse(data);
            if (data.status) {
                switch (data.task.status) {
                    case 0:
                    {
                        target.closest('td').prev().find('p').html('未知错误');
                        uploadTaskIdArray = [];
                        uploadTaskLoopArray = [];
                    }
                        break;
                    case 1:
                        target.closest('td').prev().find('p').html('上传等待中...');
                        break;
                    case 2:
                        target.closest('td').prev().find('p').html('文件上传中，当前进度为'+ parseInt(parseFloat(data.task.process) * 100) + '%');
                        break;
                    case 3:
                    {
                        var index = uploadTaskIdArray.indexOf(data.task.task_id);
                        clearInterval(uploadTaskLoopArray[index]);
                        console.log('ok');
                        target.closest('td').prev().find('p').html('上传完成');
                        $('.total-file-num').html(parseInt($('.total-file-num').html()) + 1);
                        uploadTaskIdArray = [];
                        uploadTaskLoopArray = [];
                    }
                        break;
                    case 4:
                    {
                        target.closest('td').prev().find('p').html('上传取消');
                        uploadTaskIdArray = [];
                        uploadTaskLoopArray = [];
                    }
                        break;
                    case 5:
                    {
                        target.closest('td').prev().find('p').html('上传失败');
                        uploadTaskIdArray = [];
                        uploadTaskLoopArray = [];
                    }
                        break;
                }
            } else {
                target.closest('td').prev().find('p').html('上传失败');
            }
        })
    }
    with (ftpConfig) {
        $.get('http://'+config.ftpServerIp+':18901/api/v1/fpt_task?ftp_user=' + ftp_user + '&ftp_pwd=' + ftp_pwd + '&remotefile=' + remotefile + '&localfile=' + localfile + '&isupload=true&user=' + user, function (data) {
            data = JSON.parse(data);
            if (data.status) {
                uploadTaskIdArray.push(data.task_id);
                target.closest('td').prev().find('p').html('正在上传...');
                var loopFunc = setInterval(function () {
                    loopProcess(data.task_id);
                }, 1000);
                uploadTaskLoopArray.push(loopFunc);
            } else {
                target.closest('td').prev().find('p').html('上传失败');
            }
        })
    }
}

// 下载文件，目前只能下载一个
function downloadFile(e, filePath){
    console.log('yangll' + filePath)
    var target = $(e.target).parent().prev();
    var fileName = filePath.split(':\\')[1].split('\\')[filePath.split(':\\')[1].split('\\').length - 1];
    var ftpConfig = {
        ftp_user: 'admin',
        ftp_pwd: 'admin',
        remotefile: 'ftp://' + config.ip + ':222/' + filePath.split(':\\')[1].replace(new RegExp(/(\\)/g), '/'),
        localfile: currentDownloadPath + '/' + fileName,
        user: userName[0]
    };
    console.log(ftpConfig.remotefile)
    console.log(ftpConfig.localfile)

    var loopProcess = function (taskID) {
        $.get('http://'+config.ftpServerIp+':18901/api/v1/task_info?task_id=' + taskID, function (data) {
            data = JSON.parse(data);
            console.log(data.task.status);
            if (data.status) {
                switch (data.task.status) {
                    case 0:
                    {
                        target.html('未知错误');
                        downloadTaskIdArray = [];
                        downloadTaskLoopArray = [];
                    }
                        break;
                    case 1:
                        target.html('下载等待中');
                        break;
                    case 2:
                        target.html('下载中，进度：'+ parseInt(parseFloat(data.task.process) * 100) + '%');
                        break;
                    case 3:
                    {
                        var index = downloadTaskIdArray.indexOf(data.task.task_id);
                        clearInterval(downloadTaskLoopArray[index]);
                        target.html('下载完成');
                        downloadTaskIdArray = [];
                        downloadTaskLoopArray = [];
                    }
                        break;
                    case 4:
                    {
                        target.html('下载取消');
                        downloadTaskIdArray = [];
                        downloadTaskLoopArray = [];
                    }
                        break;
                    case 5:
                    {
                        target.html('下载失败');
                        downloadTaskIdArray = [];
                        downloadTaskLoopArray = [];
                    }
                        break;
                }
            } else {
                target.html('下载失败');
            }
        })
    }

    with (ftpConfig) {
        $.get('http://'+config.ftpServerIp+':18901/api/v1/fpt_task?ftp_user=' + ftp_user + '&ftp_pwd=' + ftp_pwd + '&remotefile=' + remotefile + '&localfile=' + localfile + '&isupload=false&user=' + user, function (data) {
            data = JSON.parse(data);
            if (data.status) {
                downloadTaskIdArray.push(data.task_id);
                target.html('正在下载...');
                var loopFunc = setInterval(function () {
                    loopProcess(data.task_id);
                }, 1000);
                downloadTaskLoopArray.push(loopFunc);
            } else {
                target.html('下载失败');
            }
        })
    }
}