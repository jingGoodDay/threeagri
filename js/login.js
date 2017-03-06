$('#login-button').click(function(event) {
  event.preventDefault();
  if($('#username').val() == 'admin' && $('#userpwd').val() == '123' ){
    $('form').fadeOut(500);
    $('.wrapper').addClass('form-success');
    window.location.href = './page/home.html';
    var userinfo = $('#username').val();
    sessionStorage.setItem('userinfo',userinfo);
  }else{
    alert('用户名或者密码错误');
    $('#username').val('') 
    $('#userpwd').val('')
  }
});
