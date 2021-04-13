
$(document).ready(() => {

  function empty_promise() {
    return new Promise((resolve, reject) => {
      console.log('empty_promise()');
      resolve();
    });
  }
  function show_loader(m) {
    return new Promise(function(resolve, reject) {
      $('.loaderdivs')
        .show('fast', resolve);
      $('#loadermessage')
        .html(m);
    });
  }

  function hide_loader() {
    return new Promise(function(resolve, reject) {
      $('.loaderdivs')
        .hide('fast', resolve);
    });
  }

  function show_maindiv() {
    return new Promise(function(resolve, reject) {
      $('#maindiv')
        .show('fast', resolve);
    });
  }

  function hide_maindiv() {
    return new Promise(function(resolve, reject) {
      $('#maindiv')
        .hide('fast', resolve);
    });
  }


  //
  // Event Bindings
  //

  function filt_member(substr) {
    // on keyup from the member search we show only members that match
    $('.contacts_tr')
      .filter(function() {
        $(this)
          .toggle($(this)
            .text()
            .toUpperCase()
            .indexOf(substr) > -1);
      });
  }
  $(document)
    .on('click', '#member_show_all_tog_but', () => {
      console.log('member_show_all_tog_but');
      $('.contacts_tr')
        .show('fast');
    });
  $(document)
    .on('keyup', '#member_search_inp', function() { // doesn't work:() => {
      filt_member($(this)
        .val()
        .toUpperCase());
    });

  $(document)
    .on('click', '#render_contacts_but', () => {
      hide_maindiv()
        .then(() => {
          process_contacts(gl_contacts);
          show_maindiv();
        });
    });

  $(document)
    .on('click', '.member_row_edit', function() {
      // they've clicked the edit icon on one contact
      // go edit it
      hide_maindiv()
        .then(() => {
          contact_index = $(this)
            .attr('id')
            .replace('ci_', ''); // retrieve contact index from div id=
          contact_id = gl_contacts.Contacts[contact_index].Id; // save just the wa contact Id
          gl_contact_index_list.push(contact_index);
          contact_to_edit = gl_contacts.Contacts[contact_index]; // retreive just this contact object
          member_edit_render(contact_to_edit); // go edit it
          show_maindiv();
        });
    });

  $(document)
    .on('click', '#member_edit_save_but', () => {
      member_save();
    });


  $('#maindiv')
    .on('change', '.pkm', function() {
      // on member select
      // display the contact ID
      // get id out of dom
      id = $(this)[0].value;

      // set the display
      $('#id')
        .html(id);

      pkm = get_prime_key_members();
      pkent = [];
      pkent = get_prime_key_member_by_id(id);
      $('#email')
        .html(pkent.email);
      $('#name')
        .html(pkent.name);
      $('#member_edit_save_but')
        .attr('disabled', false);
    });

  //
  // Private Functions
  //

  function get_prime_key_members() {

    pkm = [];
    pkm.push({
      'name': 'Pick a Prime Key Member',
      'email': '',
      'id': ''
    });
    $.each(gl_contacts.Contacts, (k, v) => {
      if (('MembershipLevel' in v)) {
        if ( // but not the substr amily
          v.MembershipLevel.Name.includes('Key') && // prime key members are ones with the substring Key
          !v.MembershipLevel.Name.includes('amily')) {
          pkm.push({
            'name': v.DisplayName,
            'email': v.Email,
            'id': v.Id
          });
        }
      }
    });
    return pkm;
  }

  function get_prime_key_member_by_id(id) {
    pkent = '';
    $.each(get_prime_key_members(), (k, v) => {
      // lookup prime key member by id
      if (v.id == id) {
        pkent = v;
      }
    });
    return pkent;
  }

  function get_contacts() {
    // get contacts list
    // https://app.swaggerhub.com/apis-docs/WildApricot/wild-apricot_public_api/2.1.0#/Contacts/GetContactsList
    /*
      wa_tool.py --lvls

      1206421 "Associate (legacy-billing)"
      1206426 "Key"
      1207614 "Attendee"
      1208566 "Key (family)"
      1214364 "Key (legacy-billing)"
      1214383 "Associate"
      1214385 "Associate (onboarding)"
      1214629 "Key (family-minor-16-17)"

    // get eveyone members and contacts
    // get all members (no contacts)
    // load time isn't much faster than getting everyone and its probably a bad idea to hard-code Ids
      fep  = $.param({
        '$async':'false',
        '$filter':"'Membership level ID' in [1206421,1206426,1207614,1208566,1214364,1214383,1214385,1214629]"
      } )
      */
    return WAAPI.contacts(function(json) {
      gl_contacts = json; // save for later
      process_contacts(gl_contacts);
    });
  }

  function get_membershiplevels() {
    return WAAPI.membership_levels(function(json) {
      gl_membershiplevels = json; // save for later
    });
  }

  function process_contacts(j) {
    if (j.error == 1) {
      m(j.error_message, 'warning');
    }
    else {
      $('#topdiv').empty();
      //
      // render pick member page
      //
      o = '';
      o += '<p class="bigger">Pick Member</p>';
      o += '<div class="form-group form-inline">';
      o += '<input class="input" id="member_search_inp" type="text" placeholder="Filter..">';
      o += '<button class="btn btn-primary btn-inline btn-sm" id="member_show_all_tog_but">ALL</button>';
      o += '</div>';
      o += '<table class="table table-striped"><thead><tr>';
      o += '<th></th>';
      o += '<th>Name</th>';
      o += '<th>Email</th>';
      o += '<th>Membership</th>';

      o += '<th>Membership</th>';
      o += '</tr></thead>';

      $.each(j.Contacts, (k, v) => {

        if (v.MembershipEnabled == undefined) {
          return true;
        }
        if (v.MembershipEnabled == false) {
          // only find members
          return true;
        }

        if (v.Email == '' ||
          v.FirstName == '' ||
          v.LastName == '') {
          return true;
        } // skip empties

        is_a_member = true; // https://www.youtube.com/watch?v=F7T7fOXxMEk


        o += '<tr class="contacts_tr">';

        o += '<td>';

        contact_index = 'ci_' + k;
        o += `
        <button
           class="btn btn-sm member_row_edit btn-primary"
           id="${contact_index}"
           data-toggle="tooltip"
           data-placement="right"
           title="edit member">
        <i class="far fa-edit"></i> </button>
      `;
        o += '</td>';

        o += '<td>';
        o += v.DisplayName;
        o += '</td>';

        o += '<td>';
        o += v.Email;
        o += '</td>';

        o += '<td>';
        o += v.MembershipLevel.Name;
        o += '</td>';

        // if displaying for member editing we show member level
        $.each(v.FieldValues, (kk, vv) => {
          if (vv.FieldName != 'Membership level ID') {
            return;
          }

          o += '<td>';
          // the contacts record gives us just the level ID
          level_id = vv.Value;
          $.each(gl_membershiplevels, (kkk, vvv) => {
            // so then we look it up in the wautils_membershiplevels
            if (level_id == vvv.Id) {
              o += vvv.Name;
            }
          });
          o += '</td>';
        });
        o += '</tr>';
      });
      o += '</table>';
      $('#maindiv')
        .html(o);
    }
  }

  function member_edit_render(ct) {
    // display single contact's editable signoffs
    o = '';
    // search box and buttons
    o += emit_member_row('FirstName', ct.FirstName, '');
    o += emit_member_row('LastName', ct.LastName, '');
    o += emit_member_row('Email', ct.Email, '');
    o += emit_member_row('MembershipLevel', ct.MembershipLevel.Name, '');

    pkmid = 'wonthappen';
    $.each(ct.FieldValues, (k, v) => {
      if (v.FieldName == "Primary Member ID") {
        pkmid = v.Value;
      }
    });

    if (pkmid != 'wonthappen') {
      // show pull-down only if Primary Member Key ID is present
      oo = '';
      oo = '<select class="pkm" id="pkm">';
      pkall = get_prime_key_members();
      pkm = get_prime_key_member_by_id(pkmid);

      $.each(pkall, (k, v) => {
        s = '';
        if (v.id == pkm.id) {
          s = 'selected';
        }
        oo += '<option value="' + v.id + '" ' + s + '>' + v.name + '</option>';
      });

      oo += '</select>';

      o += emit_member_row('Pick Primary Member Name', oo, '');
      o += emit_member_row('Primary Member ID', pkm.id, 'id');
      o += emit_member_row('Primary Member Email', pkm.email, 'email');

    }

    o += emit_block_button('render_contacts_but', 'BACK TO PICK MEMBER', '');
    o += emit_block_button('member_edit_save_but', 'SAVE', 'disabled');

    // https://bootstrap-table.com/docs/getting-started/usage/#via-javascript
    o += '<table class="table table-striped"><thead><tr>';
    o += '<td>';
    o += '<pre>';
    o += JSON.stringify(contact_to_edit, null, '\t');
    o += '</pre>';
    o += '</td>';
    o += '</tr>';
    o += '</table>';
    /*
    */

    $('#maindiv').html(o);
  }

  function emit_member_row(lhs, rhs, rhsid) {
    o = '<!-- -->';
    o += '<div class="row">';
    o += '<div class="col-4"><p style="text-align:right;margin:4px;font-weight:600">' + lhs + '</p></div>';
    o += '<div class="col-8"><p id="' + rhsid + '" style="text-align:left;margin:4px;">' + rhs + '</p></div>';
    o += '</div>';
    o += '<!-- -->';
    return o;
  }
  function emit_block_button(i, t, a) {
    var o = `
    <div class="row">
    <div class="col-sm-4"></div>
    <div class="col-sm-3 pt-1">
    <button class="btn btn-block btn-success" style="display:block" id="${i}" ${a}>${t}</button>
    </div>
    </div>
    `;
    return o;
  }
  function m(mesg, color) {
    // Put up a message on the UI.
    // append message unless mesg is ''
    o = '<div class="alert alert-' + color + '" role="alert">';
    o += mesg;
    o += '</div>';
    if (mesg == '') {
      $('#topdiv')
        .html(o);
    }
    else {
      $('#topdiv')
        .append(o);
    }
  }

  function get_system_code(contact, field_name) {

    /* Wa fields look like this:
          {
          "FieldName": "Primary Member ID",
          "Value": null,
          "SystemCode": "custom-12487369"  <------------- we need to supply this when saving to WA
          },
          */

    system_code = '';
    $.each(contact.FieldValues, (kk, vv) => {
      // go fish for the right FieldValue
      if (vv.FieldName == field_name) {
        system_code = vv.SystemCode;
      }
    });
    return system_code;
  }

  function member_save() {
    if (gl_contact_index_list.length) {
      contact_index = gl_contact_index_list.pop();
    }

    this_contact = gl_contacts.Contacts[contact_index];
    this_contact_id = this_contact.Id;

    wa_put_data = {
      'Id': this_contact_id,
      'FieldValues': [{
        'FieldName': 'Primary Member ID',
        'SystemCode': get_system_code(this_contact, 'Primary Member ID'),
        'Value': $('#id')
        .html()
      },
        {
          'FieldName': 'Primary Member Name',
          'SystemCode': get_system_code(this_contact, 'Primary Member ID'),
          'Value': $('#pkm option:selected')
          .html()
        },
        {
          'FieldName': 'Primary Member Email',
          'SystemCode': get_system_code(this_contact, 'Primary Member ID'),
          'Value': $('#email')
          .html()
        }
      ]
    };

    WAAPI.update_member(this_contact_id, wa_put_data, function(json){
      m('successfully updated', 'success');
    });

  }


  //
  // Globals
  //

  gl_membershiplevels = [];
  gl_contact_index_list = [];

  // implement members
  if (document.getElementsByTagName("title")[0].innerHTML == 'members') {
    $('#loadermessage')
      .html('Fetching Membership Info..');
    hide_maindiv()
      .then(show_loader)
      .then(get_membershiplevels)
      .then(get_contacts)
      .then(hide_loader)
      .then(show_maindiv);

    return 0;
  }

});
