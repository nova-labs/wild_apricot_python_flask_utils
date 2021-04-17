$(document).ready(() => {
    if ($('#is_authenticated')
      .data('value') != "True") {
      $('#nav_login_out')
        .html('LOGIN');
      Cookies.remove('session');
    }
    else {
      $('#nav_login_out')
        .html('LOGOUT');
    }

    $(document)
      .on('click', '#auth_link', function() {
        // login
        window.location.href = '/authorize/wildapricot';
      });

    $(document)
      .on('click', '#nav_login_out', function() {

        if ($('#nav_login_out')
          .html() == 'LOGOUT') {
          // logout
          //window.location.href = '/logout/wildapricot'
          window.location.href = '/logout/wildapricot';
        }
        else {
          $('#nav_login_out')
            .html("LOGOUT");
          window.location.href = '/authorize/wildapricot';
        }
      });
});
