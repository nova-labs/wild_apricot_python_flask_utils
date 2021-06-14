$(document).ready(() => {

  function hide_loader() {
    return new Promise(function(resolve, reject) {
      $('.loaderdivs')
        .hide('fast', resolve);
    });
  }

  function get_signoffs() {
    return WAAPI.contact_fields(function(json) {
      console.log(json.map(function(v) {
        return v.FieldName;
      }));

      var field = json.filter(function(v) {
        return v.FieldName == "NL Signoffs and Categories";
      })[0];

      var list = field.AllowedValues.map(function(v) {
        //var [original, category, name] = v.Label.match(/\[(.*)\](.*)/);
        return {id: v.Id, label: v.Label};
      });

      window.wa_signoff_field = field;
      set_signoff_field_system_code(field.SystemCode);
      render_list(list);

      return list;
    });
  }

  function set_signoff_field_system_code(code){
    $('#signoff_field_system_code').val(code);
  }

  function get_contacts() {
    return WAAPI.contacts(function(json) {
      window.wa_contacts = json.Contacts.filter(function(e) {
        return e.MembershipEnabled;
      });
    });
  }

  function render_list(list) {
    var tpl = $("#signoff_list_options_mustache").html();
    var vars ={
      me: window.wa_me,
      signoffs: list,
      is_admin: window.wa_admin,
      is_signoffer: window.wa_signoffer
    };
    $('#signoff_list').append(Mustache.render(tpl, vars));
  }

  function render_success_alert(members) {
    var tpl = $("#success_alert_mustache").html();
    var vars ={
      members: members,
    };
    $('#alerts').append(Mustache.render(tpl, vars));
  }

  function get_contact(id) {
    return window.wa_contacts.find(function(el) {
      return (el.Id == id );
    });
  }

  function contact_search(search_key) {
    if(search_key.length > 2) {
      var res = window.wa_contacts.filter(function(obj) {
        return ["FirstName", "LastName", "Email"].some(function(key) {
          return obj[key].toLowerCase().includes(search_key);
        });
      });

      var tpl = $("#contact_search_list_mustache").html();
      var vars ={ contacts: res };
      $('#contact_search_list').html(Mustache.render(tpl, vars));
    } else {
      $('#contact_search_list').empty();
    }
  }

  function read_form_contact_ids() {
    return $('input[name^="contact[]"]').map(function() {
      return parseInt(this.value);
    }).get();
  }

  function munge_form_with_contact(contact_id) {
    const contact = get_contact(contact_id);
    const system_code = $('input[name^="SystemCode"]').val();
    const signoff_id = parseInt($('select[name^="signoff_id"]').val());
    const existing_signoffs = contact.FieldValues.find(function(e) {return e.SystemCode == system_code; }).Value.map(function(e) {return e.Id;});
    const new_signoff = parseInt($('select[name^="signoff_id"]').val());
    const signoffs = new Set([...existing_signoffs, new_signoff]);
    const values = [...signoffs].map(function(e) { return { Id: e }; });

    /*
     *
     *{
     *  "FieldValues": [
     *    {
     *      "SystemCode": "custom-12971567",
     *      "Value": [
     *        { "Id": 14759088 },
     *        { "Id": 14759089 },
     *        { "Id": 14759157 }
     *        ]
     *      }
     *    ],
     *  "Id": 59105504
     *}
     *
    */
    return {
      FieldValues: [{
        SystemCode: system_code,
        Value: values,
      }],
      Id: contact_id,
    };
  }

  function reset_contact_search() {
    $('#contact_search_list').empty();
    $('#contact_search').val('');
  }

  function reset_form() {
    $('select')[0].selectedIndex = 0;
    $('#contact_field_list').empty();
    $('#contact_search').prop('required',true);
  }

  //
  // Events and bindings
  //

  $('#contact_search').keyup(function(e){
    e.preventDefault();
    contact_search(this.value.toLowerCase());
  });

  $(document).keyup(function(e){
    if(e.keyCode === 27) {
      reset_contact_search();
    }
  });

  $(document).mouseup(function(e) {
    var container = $(".contact-to-add");
    if (!container.is(e.target) && container.has(e.target).length === 0)
    {
      reset_contact_search();
    }
  });

  $(document).on('click', ".contact-to-add", function() {
    var tpl = $("#contact_fields_mustache").html();
    var vars = get_contact(this.getAttribute("value"));
    $('#contact_field_list').append(Mustache.render(tpl, vars));
    $('#contact_search').prop('required', false);
    reset_contact_search();
  });

  $(document).on('click', ".remove-contact", function(e) {
    e.preventDefault();
    $(this).parents(".contact-fields").remove();
  });


  $(document).on('submit', 'form', function (e) {
    e.preventDefault();

    const count = $('input[name^="contact[]"]').length;
    if (confirm(`Are you really, really sure you want to grant ${count} member(s) this signoff?`)) {
      ids = read_form_contact_ids();
      promises = ids.map(function(id) {
        const data = munge_form_with_contact(id);
        return WAAPI.update_contact(data.Id, data, function(json) {
          return json;
        });
      });

      Promise.all(promises).then(function(results) {
        render_success_alert(results);
        get_contacts().then(function(resolve, reject) {
          reset_form();
        });
      }).catch(function(error) {
        alert("Error Updating Contacts");
      });
    }
  });

  //
  // Load the page
  //

  if ($("body#tool_signoffs_page")) {
    Promise.all([
      get_contacts(),
      get_signoffs(),
    ]).then(function(results) {
      $("#loader").hide();
      $("#maindiv").show();
    });
  }
});

