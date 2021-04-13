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

  function filt_signoff(substr) {
    // on keyup in the search box we display only the signoffs that match
    $('.signoff_item_div')
      .filter(function() {
        // console.log(substr)
        $(this)
          .toggle($(this)
            .text()
            .toUpperCase()
            .indexOf(substr) > -1);
      });
  }

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

  //
  // event listeners for form elements
  //

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
    .on('keyup', '#signoff_edit_search_inp', function() { // doesn't work: () => {
      filt_signoff($(this)
        .val()
        .toUpperCase());
    });
  $(document)
    .on('click', '#signoff_edit_show_all_tog_but', () => {
      $('.signoff_item_div')
        .show('fast');
    });
  $(document)
    .on('click', '#signoff_edit_check_all_but', () => {
      $('.signoff_item_div:not(:hidden) > input')
        .attr('checked', true);
    });

  $(document)
    .on('click', '#signoff_edit_save_but', () => {
      signoffs_save();
    });

  $(document)
    .on('click', '#member_edit_save_but', () => {
      member_save();
    });

  $(document)
    .on('click', '#signoff_edit_uncheck_all_but', () => {
      $('.signoff_item_div:not(:hidden) > input')
        .attr('checked', false);
    });

  $(document)
    .on('click', '.signoff_edit_but', function() {
      // <button class="btn btn-primary btn-inline btn-sm m-1 signoff_edit_but" id="show_wc_">WC_</button>
      //                                                                 look for this:  ^^^
      filt_signoff($(this)
        .attr('id')
        .replace('show_', '')
        .toUpperCase());
    });

  $(document)
    .on('click', '#signoff_edit_show_checked_but', () => {
      // hide all unchecked
      $('.signoff_item_div')
        .find('input:checkbox:not(:checked)')
        .parent()
        .hide();
      // show checked
      $('.signoff_item_div')
        .find('input:checked')
        .parent()
        .show();
    });

  $(document)
    .on('click', '.contact_row_edit', function() {
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
          signoffs_edit_render(contact_to_edit); // go edit it
          show_maindiv();
        });
    });


  $(document)
    .on('click', '#render_contacts_but', () => {
      hide_maindiv()
        .then(() => {
          process_contacts(gl_contacts);
          show_maindiv();
        });
    });


  //
  // Private Functions
  //



  function signoff_edit_emit_row(lhs, rhs) {
    // generate one row of the signoff page
    o = '';
    o += '<tr>';
    o += '  <td style="width:20%;text-align:right;"><b>' + lhs + '</b></td>';
    o += '  <td style="width:80%;text-align:left;">' + rhs + '</td>';
    o += '</tr>';
    return o;
  }

  function get_contacts_signed_off_items(contact_to_edit) {
    // return contact's signed-off items:
    existing_signoffs = [];
    $.each(contact_to_edit.FieldValues, (kk, vv) => {
      if (vv.FieldName != 'NL Signoffs and Categories') {
        return true;
      }
      existing_signoffs = vv;
      return false;
    });

    so_items = [];
    $.each(existing_signoffs.Value, (kk, vv) => {
      so_items.push({
        'Label': vv.Label,
        'Id': vv.Id
      });
    });
    /* so_items:
      0: {Label: "[equipment] *GREEN", Id: 11968550}
      1: {Label: "[novapass] CC_ShopSabre_CNC Router", Id: 11968621}
      2: {Label: "[novapass] LC_Hurricane_Laser Cutter", Id: 11968622}
      3: {Label: "[novapass] LC_Rabbit_Laser Cutter", Id: 11968623}
      */
    return so_items;
  }

  function has_signoff(contact_id, signoff_name) {
    // does contact_id have signoff_name ?
    $.each(contact_to_edit.FieldValues, (kk, vv) => {
      if (vv.FieldName != 'NL Signoffs and Categories') {
        return true;
      }
      exisiting_signoffs = vv;
      return false;
    });

    /*
      {
      FieldName: "NL Signoffs and Categories"
      SystemCode: "custom-11058873"
      Value: Array(4)
      0: {Id: 11968550, Label: "[equipment] *GREEN"}
      1: {Id: 11968621, Label: "[novapass] CC_ShopSabre_CNC Router"}
      2: {Id: 11968622, Label: "[novapass] LC_Hurricane_Laser Cutter"}
      3: {Id: 11968623, Label: "[novapass] LC_Rabbit_Laser Cutter"}
      */
    var has_signoff = false;
    $.each(exisiting_signoffs.Value, (kk, vv) => {
      if (vv.Label != signoff_name) {
        return true;
      }
      has_signoff = true;
      return false;
    });

  }

  function signoff_edit_emit_signoffs(contact_to_edit) {
    // List all possible sign-offs.
    // Check items which user has been checked off on
    var o = '';
    o += '<form class="form">';
    contacts_signed_off_items = get_contacts_signed_off_items(contact_to_edit);
    $.each(window.wautil_signoff_fields, (k, v) => {
      // iterate  through the list of all possible signoffs
      checked = '';
      if (contacts_signed_off_items.find(x => x.Id == v.Id)) {
        // if current contact's has signoffs, mark then checked
        checked = 'checked';
      }

      // emit html
      o += signoff_emit_signoff_item(contact_to_edit.Id, v.Id, v.Label, checked);
    });

    o += '</form>';
    return o;
  }

  function signoff_emit_signoff_item(cid, fid, label, checked) {
    // output html for single checkoff
    // cid  : contact id
    // fid : field id
    // label : text to display
    // checked : if we should mark it checked

    var o = '';
    o += '  <div id="cid_' + cid + '" class="form-check signoff_item_div">';
    o += '    <input type="checkbox" class="form-check-input" id="fid_' + fid + '" ' + checked + ' >';
    o += '    <label class="form-check-label" for="fid_' + fid + '">' + decorate_signoffs(label) + '</label>';
    o += '  </div>';
    return o;
  }

  function signoffs_edit_render(contact_to_edit) {
    // display single contact's editable signoffs
    o = '';
    // show name email of member
    o += '<p class="bigger"><b>' +
      contact_to_edit.FirstName + ' ' +
      contact_to_edit.LastName +
      ' (' + contact_to_edit.Email + ')' +
      ' (' + contact_to_edit.MembershipLevel.Name + ')' +
      '</b></p>';
    // search box and buttons
    o += '<hr>';
    o += '<div class="form-group form-inline m-0">';
    o += '<p><b>SHOW:&nbsp;</b></p>';
    o += '   <input class="input" id="signoff_edit_search_inp" type="text" placeholder="Search..">';
    o += '   <button class="btn btn-warning btn-inline btn-sm m-1" id="signoff_edit_show_all_tog_but">ALL POSSIBLE</button>';
    o += '   <button class="btn btn-warning btn-inline btn-sm m-1" id="signoff_edit_show_checked_but">ALREADY CHECKED</button>';
    o += '</div>';
    o += '<div class="form-group form-inline m-0">';
    o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_go_"><b>GO</b></button>';
    o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_lc_">LASER</button>';
    o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_ac_">ARTS&CRAFTS</button>';
    o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_bl_">BLACKSMITH</button>';
    o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_cc_">CNC</button>';
    o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_el_">ELECTRONICS</button>';
    o += '</div>';
    o += '<div class="form-group form-inline m-0">';
    o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_mw">METALSHOP</button>';
    o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_mwy_">METALSHOP YELLOW</button>';
    o += '</div>';
    o += '<div class="form-group form-inline m-0">';
    o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_ww">WOODSHOP</button>';
    o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_wwl_">WOODSHOP LATHE</button>';
    o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_wwy_">WOODSHOP YELLOW</button>';
    o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_wwr_">WOODSHOP RED</button>';
    o += '</div>';
    o += '<hr>';
    o += '<div class="form-group form-inline m-0">';
    o += '<p><b>ACTIONS:</b></p>';
    o += '   <button class="btn btn-primary btn-inline btn-sm m-1" id="signoff_edit_check_all_but">CHECK ALL SHOWN</button>';
    o += '   <button class="btn btn-primary btn-inline btn-sm m-1" id="signoff_edit_uncheck_all_but">UNCHECK ALL SHOWN</button>';
    o += '   <button class="btn             btn-inline btn-sm m-1 btn-success" id="signoff_edit_save_but">SAVE</button>';
    o += '   <button class="btn btn-info    btn-inline btn-sm m-1" id="render_contacts_but">BACK TO PICK MEMBER</button>';
    o += '</div>';
    o += '<hr>';
    o += '<div>';
    o += signoff_edit_emit_signoffs(contact_to_edit);
    $('#maindiv').html(o);
  }


  function get_signoffs() {
    //  // https://app.swaggerhub.com/apis-docs/WildApricot/wild-apricot_public_api/2.1.0#/Contacts.CustomFields/GetContactFieldDefinitions
    return WAAPI.contact_fields(function(json) {
      extract_contentfield(json, 'NL Signoffs and Categories');
    });
  }

  function extract_contentfield(j, fieldname) {
    // called from the get
    // consume output of /accounts/{accountId}/contactfields
    console.log("extract_contentfield()");

    var signoff_fields = [];

    // save it away for later
    gl_contact_fields = j;
    $.each(j, (k, v) => {
      // find NL Signoffs and Categories then extract
      // all possible AllowedValues
      if (v.FieldName !== fieldname) {
        return true;
      }

      $.each(v.AllowedValues, (kk, vv) => {
        /* o += '<pre>' + vv['Label'] + '</pre>'; */
        signoff_fields.push({
          'Label': vv.Label,
          'Id': vv.Id
        });
      });

      /*
         signoff_fields:
          [
            {
              "Label": "[equipment] *GREEN",
              "Id": 11968550
            },
            ...
            {
              "Label": "[novapass] WWR_SawStop_Table Saw",
              "Id": 11968626
            }
          ]
          */
      window.wautil_signoff_fields = signoff_fields;
    });
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

  function decorate_signoffs(s) {
    s = s.replace('[equipment]', '<span class="badge badge-info">[equipment]</span>');
    s = s.replace('[nlgroup]', '<span class="badge badge-success">[nlgroup]</span>');
    s = s.replace('[novapass]', '<span class="badge badge-primary">[novapass]</span>');
    return s;
  }


  function process_contacts(j) {
    mode = document.getElementsByTagName("title")[0].innerHTML;

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

      if (mode == 'signoffs') {
        o += '<th>Signoffs</th>';
      }
      else if (mode == 'members') {
        o += '<th>Membership</th>';
      }
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
        if (mode == 'signoffs') {
          contact_index = 'ci_' + k;
          o += `
        <button
           class="btn btn-sm contact_row_edit btn-primary"
           id="${contact_index}"
           data-toggle="tooltip"
           data-placement="right"
           title="edit signoffs">
        <i class="far fa-edit"></i> </button>
      `;
        }
        else if (mode == 'members') {

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
        }
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

        if (mode == 'signoffs') {
          o += '<td>';
          // in the case of signoffs we show the signoffs
          o += '<table class="table table-striped"><thead><tr>';
          // create sorted list of signoff names
          sos = [];
          $.each(window.wautil_signoff_fields, (kk, vv) => {
            sos.push(vv.Label);
          });
          sos.sort();

          //
          // go fish for the right FieldValue
          //
          $.each(v.FieldValues, (kk, vv) => {
            // go fish for the right FieldValue
            if (vv.FieldName != 'NL Signoffs and Categories') {
              return true;
            } // we are just looking for the NL Signoffs and Categories field
            // 45: {FieldName: "NL Signoffs and Categories", Value: Array(4), SystemCode: "custom-11058873"}
            //                 save this for when we POST our updated info                 ^^^^^^^^^^^^^^^
            gl_equipment_signoff_systemcode = vv.SystemCode;

            o += '<td>';

            // print them out sorted
            for (let so of sos) { // each possible sign off sorted
              if (vv.Value == null) {
                continue;
              }
              for (let mso of vv.Value) { // if this person's signoff matches..
                if (mso.Label == so) {
                  o += decorate_signoffs(so); // time to print it out
                  o += '<br>';
                }
              }
            }

            o += '</td>';
            o += '</tr>';
          });
          o += '</table>';
          o += '</td>';
        }
        else if (mode == 'members') {
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

        }
        /*
          if (mode == 'members') {
            o += '<table class="table table-striped"><thead><tr>'
            o += '<td>'
            o += '<pre>'
            o += JSON.stringify(v,null,'\t')
            o += '</pre>'
            o += '</td>'
            o += '</tr>'
            o += '</table>'
          }
          */
        o += '</tr>';
      });
      o += '</table>';
      $('#maindiv')
        .html(o);
    }
  }

  function signoffs_save() {
    //
    // update member's signoffs in WA and locally
    //
    checked_divs = $('.signoff_item_div > input:checked').parent();

    if (gl_contact_index_list.length) {
      contact_index = gl_contact_index_list.pop();
    }

    this_contact = gl_contacts.Contacts[contact_index];
    this_contact_id = this_contact.Id;
    signoff_idx = gl_equipment_signoff_systemcode;
    this_signoffs = this_contact.FieldValues[signoff_idx];

    indiv_signoff_ids = [];
    $('.signoff_item_div')
      .find('input:checked')
      .each(function() {
        //
        // <div id="cid_50537517" class="form-check signoff_item_div">
        // <input type="checkbox" class="form-check-input" id="fid_11968623" checked="checked">
        //                   we store the field id in the DOM  ^^^^^^^^^^^^
        tid = this.id.replace('fid_', '');
        //                  important:  vvvvvvvv
        indiv_signoff_ids.push({
          'Id': parseInt(tid, 10)
        });
      });

    //// indiv_signoff_ids
    //// "[{"Id":"11968550"},{"Id":"11968623"}]" ....

    //// compose what will become the json
    //// we send up to WA...
    //wa_put_data = {
    //  'Id': this_contact_id,
    //  'FieldValues': [{
    //    'SystemCode': gl_equipment_signoff_systemcode,
    //    'Value': indiv_signoff_ids
    //  }]
    //};
    //// .. but we send it via flask web server
    //// all of wa_put_data will be sent to the flask server under 'put_data':
    //flask_put_data = {
    //  'endpoint': '/accounts/$accountid/contacts/' + this_contact_id,
    //  'put_data': wa_put_data
    //};

    body = {
      'Id': this_contact_id,
      'FieldValues': [{
        'SystemCode': gl_equipment_signoff_systemcode,
        'Value': indiv_signoff_ids
      }]
    };

    WAAPI.update_contact(this_contact_id, body, function(json) {
      if (json != null && json.error == 1) {
        hide_loader();
        m('ERROR: ' + json.error_message, 'warning');
        return false;
      }
      hide_loader()
        .then(() => {
          m('');
          m('signoffs successfully updated', 'success');
        });
      // update contact locally:
      $.each(gl_contacts.Contacts, function(k, v) {
        if (v.Id == this_contact_id) {
          // find the contact we are working on..
          $.each($(this)[0].FieldValues, function(kk, vv) {
            // then find 'EquipmentSignoffs' in their entry..
            if (vv.FieldName != 'NL Signoffs and Categories') {
              return true;
            }
            // and replace it with what we sent up to WA
            $(this)[0].Value = json.FieldValues.find(function(el) {
              return el.FieldName == "NL Signoffs and Categories";
            }).Value;
          });
        }
      });
    });

    //$.ajax({
    //  type: 'PUT',
    //  url: '/api/v1/wa_put_any_endpoint',
    //  data: JSON.stringify(flask_put_data),
    //  beforeSend: () => {
    //    show_loader('Saving');
    //  },
    //  success: (j) => {
    //    if (j != null && j.error == 1) {
    //      hide_loader();
    //      m('ERROR: ' + j.error_message, 'warning');
    //      return false;
    //    }
    //    hide_loader()
    //      .then(() => {
    //        m('');
    //        m('signoffs successfully updated', 'success');
    //      });
    //    // update contact locally:
    //    $.each(gl_contacts.Contacts, function(k, v) {
    //      if (v.Id == this_contact_id) {
    //        // find the contact we are working on..
    //        $.each($(this)[0].FieldValues, function(kk, vv) {
    //          // then find 'EquipmentSignoffs' in their entry..
    //          if (vv.FieldName != 'NL Signoffs and Categories') {
    //            return true;
    //          }
    //          // and replace it with what we sent up to WA
    //          $(this)[0].Value = wa_put_data.FieldValues[0].Value;
    //        });
    //      }
    //    });
    //  },
    //  failure: (errMsg) => {
    //    alert("FAIL:" + errMsg);
    //  },
    //  error: (xh, ts, et) => {
    //    alert("FAIL:" + u + ' ' + et);
    //  },
    //  contentType: 'application/json; charset=utf-8',
    //  dataType: 'json', // we want to see json as a response
    //  processData: false
    //});
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

  //
  // Globals
  //

  gl_contact_ids = [];
  gl_contact_fields = [];
  gl_contacts = [];
  gl_contact_index_list = [];
  gl_equipment_signoff_systemcode = [];


  // implement signoffs
  if (document.getElementsByTagName("title")[0].innerHTML == 'signoffs') {
    hide_maindiv()
      .then(show_loader)
      .then(get_signoffs)
      .then(get_contacts)
      .then(hide_loader)
      .then(show_maindiv);
    return 0;
  }

});
