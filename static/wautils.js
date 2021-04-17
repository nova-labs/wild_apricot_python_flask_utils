/* 
 * wautils.js
 *
 * implements browser-side functionality for the novalabs wild apricot utilities
 *
 * works with the wautils.nova-labs.org python flask web appliction
 *
 */

$(document).ready(() => {

function filt_signoff(substr) {
  // on keyup in the search box we display only the signoffs that match
  $('.signoff_item_div').filter(function() {
    // console.log(substr)
    $(this).toggle($(this).text().toUpperCase().indexOf(substr) > -1)
  })
}

function filt_member(substr) {
  // on keyup from the member search we show only members that match
  $('.contacts_tr').filter(function() {
    $(this).toggle($(this).text().toUpperCase().indexOf(substr) > -1)
  })
}

//
// event listeners for form elements
//
$(document).on('click', '#member_show_all_tog_but', () => {
  console.log('member_show_all_tog_but')
  $('.contacts_tr').show('fast')
})
$(document).on('keyup', '#member_search_inp', function() { // doesn't work:() => {
  filt_member( $(this).val().toUpperCase() )
})
$(document).on('keyup', '#signoff_edit_search_inp', function() { // doesn't work: () => {
  filt_signoff( $(this).val().toUpperCase() )
})
$(document).on('click', '#signoff_edit_show_all_tog_but', () => {
    $('.signoff_item_div').show('fast')
})
$(document).on('click','#signoff_edit_check_all_but', () => {
  $('.signoff_item_div:not(:hidden) > input').attr('checked',true)
})

$(document).on('click','#signoff_edit_save_but', () => {
  signoffs_save(); 
})

$(document).on('click','#member_edit_save_but', () => {
  member_save(); 
})

$(document).on('click','#signoff_edit_uncheck_all_but', () => {
  $('.signoff_item_div:not(:hidden) > input').attr('checked',false)
})

$(document).on('click', '#render_contacts_but', () => {
  hide_maindiv().then( ()=>{ process_contacts(gl_contacts); show_maindiv(); })
})
$(document).on('click', '.signoff_edit_but', function()  {
  // <button class="btn btn-primary btn-inline btn-sm m-1 signoff_edit_but" id="show_wc_">WC_</button>
  //                                                                 look for this:  ^^^
  filt_signoff( $(this).attr('id').replace('show_','').toUpperCase())
})

$(document).on('click', '#signoff_edit_show_checked_but', () => {
  // hide all unchecked
  $('.signoff_item_div').find('input:checkbox:not(:checked)').parent().hide()
  // show checked
  $('.signoff_item_div').find('input:checked').parent().show()
})

$(document).on('click', '.contact_row_edit',function()  {
  // they've clicked the edit icon on one contact
  // go edit it
  hide_maindiv().then( ()=>{
    contact_index = $(this).attr('id').replace('ci_',''); // retrieve contact index from div id= 
    contact_id  = gl_contacts[0].Contacts[contact_index]['Id']; // save just the wa contact Id
    gl_contact_index_list.push(contact_index)
    contact_to_edit = gl_contacts[0].Contacts[contact_index]; // retreive just this contact object
    signoffs_edit_render(contact_to_edit);  // go edit it
    show_maindiv()
  })
})

$(document).on('click', '.member_row_edit',function()  {
  // they've clicked the edit icon on one contact
  // go edit it
  hide_maindiv().then( ()=>{
    contact_index = $(this).attr('id').replace('ci_',''); // retrieve contact index from div id= 
    contact_id  = gl_contacts[0].Contacts[contact_index]['Id']; // save just the wa contact Id
    gl_contact_index_list.push(contact_index)
    contact_to_edit = gl_contacts[0].Contacts[contact_index]; // retreive just this contact object
    member_edit_render(contact_to_edit);  // go edit it
    show_maindiv()
  })
})

$(document).on('click', '.event_row_edit_btn',function()  {

  gl_event_id = $(this).attr('id')

  console.log('event_row_edit_btn click')

  empty_promise()
    .then(show_loader)
    .then(hide_maindiv)
    .then(get_event_registrations)
    .then(get_all_reg_info)
    .then(get_all_contact_info)
    .then(process_event_registrations)
    .then(hide_loader)
    .then(show_maindiv)

  

    //.then(get_all_reg_info(event_info) )

  /*
  hide_maindiv()
    .then(get_event_registrations)
    .then(show_maindiv)
  */

})

$(document).on('click', '#show_events_btn',function()  {
  hide_maindiv()
    .then( ()=>{ console.log('1'); $('#maindiv').html('') } )
    .then(process_events_p)
    .then(show_maindiv)
    
})

$('#maindiv').on('change','.pkm',function() {
  // on member select
  // display the contact ID 
  id = $(this)[0].value // get id out of dom
  $('#id').html(id) // set the display 

  pkm =  get_prime_key_members() 
  pkent = []
  pkent = get_prime_key_member_by_id(id)
  $('#email').html(pkent.email)
  $('#name').html(pkent.name)
  $('#member_edit_save_but').attr('disabled',false)
})

$(document).on('click', '#auth_link',function()  {
  // login 
    window.location.href = '/authorize/wildapricot'
}); 

$(document).on('click', '#nav_login_out',function()  {

  if ($('#nav_login_out').html() == 'LOGOUT') {
    // logout
    //window.location.href = '/logout/wildapricot'
    window.location.href = '/logout/wildapricot'
  } else {
    $('#nav_login_out').html("LOGOUT")
    window.location.href = '/authorize/wildapricot' 
  }
})

/* attempt to log us out of wa doesn't work yet
$(document).on('click', '#nav_logout',function()  {
  $.ajax({
    type: 'GET',
    url  : 'https://portal.nova-labs.org/Sys/Login/Signout',
    headers: {  'Access-Control-Allow-Origin': '*' },
    failure: (errMsg) => { alert("FAIL:" + errMsg); },
    error: (xh,ts,et) =>  { alert("FAIL:" + u + ' ' + et); },
    contentType: false,
    processData: false
  })

})
*/

function extract_contentfield(j,fieldname) {
  // called from the get 
  // consume output of /accounts/{accountId}/contactfields

  console.log("extract_contentfield()")


  var signoff_fields = []

  // save it away for later
  gl_contact_fields = j; 
  $.each(j,(k,v) => {
    // find NL Signoffs and Categories then extract
    // all possible AllowedValues
    if (v['FieldName'] !== fieldname) 
      return true

    $.each(v['AllowedValues'],(kk,vv) => {
      /* o += '<pre>' + vv['Label'] + '</pre>'; */
      signoff_fields.push(
        {
          'Label': vv['Label'],
          'Id': vv['Id']
        }
      )
    })


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
      window.wautil_signoff_fields = signoff_fields


  })
}

function decorate_signoffs(s) {

  s = s.replace('[equipment]','<span class="badge badge-info">[equipment]</span>')
  s = s.replace('[nlgroup]','<span class="badge badge-success">[nlgroup]</span>')
  s = s.replace('[novapass]','<span class="badge badge-primary">[novapass]</span>')
  return s

}



function process_contacts(j) {

  mode = document.getElementsByTagName("title")[0].innerHTML

  
  if (j['error'] == 1) {
    m(j['error_message'],'warning')
  } else  {
    $('#topdiv').empty() 
    //
    // render pick member page
    //
    o = ''
    o += '<p class="bigger">Pick Member</p>'
    o += '<div class="form-group form-inline">'
    o += '<input class="input" id="member_search_inp" type="text" placeholder="Filter..">'
    o += '<button class="btn btn-primary btn-inline btn-sm" id="member_show_all_tog_but">ALL</button>'
    o += '</div>'
    o += '<table class="table table-striped"><thead><tr>'
    o += '<th></th>'
    o += '<th>Name</th>'
    o += '<th>Email</th>'
    o += '<th>Membership</th>'

    if (mode == 'signoffs') {
      o += '<th>Signoffs</th>'
    } else if (mode == 'members') {
      o += '<th>Membership</th>'
    }
    o += '</tr></thead>'

    $.each(j[0].Contacts,(k,v) => {

      if (v['MembershipEnabled'] == undefined)
        return true
      if (v['MembershipEnabled'] == false)
        // only find members
        return true

      if (v['Email'] == '' ||
        v['FirstName'] == '' ||
        v['LastName'] == '' ) 
        return true; // skip empties

      is_a_member = true; // https://www.youtube.com/watch?v=F7T7fOXxMEk


      o += '<tr class="contacts_tr">'

      o += '<td>'
      if (mode == 'signoffs') {
      contact_index = 'ci_' + k
      o += ` 
        <button 
           class="btn btn-sm contact_row_edit btn-primary" 
           id="${contact_index}"
           data-toggle="tooltip" 
           data-placement="right" 
           title="edit signoffs"> 
        <i class="far fa-edit"></i> </button>
`
      } else if (mode == 'members') {

      contact_index = 'ci_' + k
      o += ` 
        <button 
           class="btn btn-sm member_row_edit btn-primary" 
           id="${contact_index}"
           data-toggle="tooltip" 
           data-placement="right" 
           title="edit member"> 
        <i class="far fa-edit"></i> </button>
`
      }
      o += '</td>'

      o += '<td>'
      o += v['DisplayName']
      o += '</td>'


      o += '<td>'
      o += v['Email']
      o += '</td>'

      o += '<td>'
      o += v['MembershipLevel'].Name
      o += '</td>'

      //console.log(JSON.stringify(v,null,'\t'))
    
      if (mode == 'signoffs') {
      o += '<td>'

        // in the case of signoffs we show the signoffs

        o += '<table class="table table-striped"><thead><tr>'

        // create sorted list of signoff names
        sos = []
        $.each(window.wautil_signoff_fields,(kk,vv) => {
          sos.push(vv.Label)
        })
        sos.sort()


        // 
        // go fish for the right FieldValue 
        // 
        $.each(v['FieldValues'],(kk,vv) => {
          // go fish for the right FieldValue 
          if (vv['FieldName'] != 'NL Signoffs and Categories') 
            return true; // we are just looking for the NL Signoffs and Categories field
          // 45: {FieldName: "NL Signoffs and Categories", Value: Array(4), SystemCode: "custom-11058873"}
          //                 save this for when we POST our updated info                 ^^^^^^^^^^^^^^^
          gl_equipment_signoff_systemcode = vv['SystemCode']


          o += '<td>'
          /*
          $.each(vv.Value,(kkk,vvv) => {
          }); */

          // print them out sorted
          for (let so of sos ) { // each possible sign off sorted
            if (vv.Value == null)
              continue
            for (let mso of vv.Value) { // if this person's signoff matches..
              if (mso.Label == so) {
                o += decorate_signoffs(so); // time to print it out
                o += '<br>'
              }
            }
          }

          o += '</td>'
          o += '</tr>'
        })
        o += '</table>'
        o += '</td>'
      } else if (mode == 'members') {

        // if displaying for member editing we show member level
        $.each(v['FieldValues'],(kk,vv) => {
          if (vv['FieldName'] != 'Membership level ID') 
            return

          o += '<td>'
          // the contacts record gives us just the level ID
          level_id = vv.Value
          $.each( gl_membershiplevels, (kkk,vvv) => {
            // so then we look it up in the wautils_membershiplevels
            if (level_id == vvv.Id) {
              o += vvv.Name; 
            }
          })
          o += '</td>'
        })

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



      o += '</tr>'
    })
    o += '</table>'
    $('#maindiv').html(o)
  }
}


function m(mesg,color) {
  // Put up a message on the UI.
  // append message unless mesg is ''
  o = '<div class="alert alert-' + color + '" role="alert">'
  o += mesg
  o += '</div>'
  if (mesg == '')
    $('#topdiv').html(o)
  else 
    $('#topdiv').append(o)
}

function get_registration_type_field(id,field) {
  rt = get_registration_type(id)
  try { rs = rt[field] }
  catch { return ''}
  return rs

}


function get_registration_type(id) {

  //console.log('get_registration_type(enter)')

  for (let rt of gl_reg_typeinfo) {
    //console.log('get_registration_type() checking ' + rt.Id + ' == ' + id + '?')
    if (rt.Id == id) {
      console.log(`get_registration_type(${id}) (cached)`)
      return rt
    }
  }
  return undefined
  

}

function empty_promise() {
  return new Promise((resolve,reject)=>{
    console.log('empty_promise()')
    resolve()
  })
}

function fetch_registration_type(id) {

  return new Promise(function(resolve,reject) {
    console.log('fetch_registration_type(' + id + ') starting')
    got_one = false
    for (let rt of gl_reg_typeinfo) {
      if (rt.Id == id) {
        got_one = true
      }
    }
    if (!got_one) {

      $.ajax({
        type: 'GET',
        url  : '/api/v1/wa_get_any_endpoint',
        // string '$accountid' will get replaced with real account id on server
        data : $.param({'endpoint':'accounts/$accountid/EventRegistrationTypes/' + id }),
        success: (j) => { 
          console.log('fetch_registration_type(' + id + ') pushing')
          gl_reg_typeinfo.push(j[0])
          console.log(`fetch_registration_type(${id}) pushing.. gl_reg_typeinfo(${gl_reg_typeinfo.length})`)
          resolve()
        }, 
        failure: (errMsg) => { alert("FAIL:" + errMsg); },
        error: (xh,ts,et) =>  { alert("FAIL:" + u + ' ' + et); },
        contentType: false,
        processData: false,
        async: false

      })
    }
    console.log('fetch_registration_type(' + id + ') cached')
    resolve()
  })
}

function get_membershiplevels() {

  return new Promise (function(resolve,reject) {
    // get list of possible signoffs
    // https://app.swaggerhub.com/apis-docs/WildApricot/wild-apricot_public_api/2.1.0#/Contacts.CustomFields/GetContactFieldDefinitions
    $.ajax({
      type: 'GET',
      url  : '/api/v1/wa_get_any_endpoint',
      // string '$accountid' will get replaced with real account id on server
      data : $.param({'endpoint':'accounts/$accountid/membershiplevels'}),
      success: (j) => { 
        gl_membershiplevels = j; // save for later
        resolve()
      }, 
      failure: (errMsg) => { alert("FAIL:" + errMsg); },
      error: (xh,ts,et) =>  { alert("FAIL:" + u + ' ' + et); },
      contentType: false,
      processData: false
    })


  })
}
function get_signoffs() {
  return new Promise (function(resolve,reject) {
    // get list of possible signoffs
    // https://app.swaggerhub.com/apis-docs/WildApricot/wild-apricot_public_api/2.1.0#/Contacts.CustomFields/GetContactFieldDefinitions
    console.log("get_signoffs()")
    $.ajax({
      type: 'GET',
      url  : '/api/v1/wa_get_any_endpoint',
      // string '$accountid' will get replaced with real account id on server
      data : $.param({'endpoint':'/accounts/$accountid/contactfields'}),
      success: (j) => { 
        extract_contentfield(j,'NL Signoffs and Categories');resolve(); 
      }, 
      failure: (errMsg) => { alert("FAIL:" + errMsg); },
      error: (xh,ts,et) =>  { alert("FAIL:" + u + ' ' + et); },
      contentType: false,
      processData: false
    })


  })
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
  // typical load time 5sec
  fep  = $.param({
    '$async':'false'
  } )

  ep = $.param( {'endpoint':'accounts/$accountid/contacts/?' + fep})
  return new Promise(function(resolve,reject) {
    u  = '/api/v1/wa_get_any_endpoint',
      $.ajax({
        type: 'GET',
        url  : u,
        // string '$accountid' will get replaced with real account id on server
        data : ep,
        success: (j) => { 
          gl_contacts = j; // save for later
          process_contacts(gl_contacts)
          resolve();  
        }, 
        failure: (errMsg) => { alert("FAIL:" + errMsg); },
        error: (xh,ts,et) =>  { alert("FAIL:" + u + ' ' + et); },
        contentType: false,
        processData: false
      })

  })
}


function show_loader(m) {
  return new Promise( function(resolve,reject) {
    $('.loaderdivs').show('fast',resolve)
    $('#loadermessage').html(m)
  })
}
function hide_loader() {
  return new Promise( function(resolve,reject) {
    $('.loaderdivs').hide('fast',resolve)
  })
}
function show_maindiv() {
  return new Promise( function(resolve,reject) {
    $('#maindiv').show('fast',resolve)
  })
}
function hide_maindiv() {
  return new Promise( function(resolve,reject) {
    $('#maindiv').hide('fast',resolve)
  })
}

function signoff_edit_emit_row(lhs,rhs) {
  // generate one row of the signoff page
  o = ''

  o += '<tr>'
  o += '  <td style="width:20%;text-align:right;"><b>' + lhs + '</b></td>'
  o += '  <td style="width:80%;text-align:left;">' + rhs + '</td>'
  o += '</tr>'
  return o

}
function get_contacts_signed_off_items(contact_to_edit) {
  // return contact's signed-off items:
  existing_signoffs = []
  $.each(contact_to_edit['FieldValues'],(kk,vv) => {
    if (vv['FieldName'] != 'NL Signoffs and Categories') 
      return true
    existing_signoffs = vv
    return false
  })

  so_items = []
  $.each(existing_signoffs['Value'],(kk,vv) => {
    so_items.push(
      {
        'Label': vv['Label'],
        'Id': vv['Id']
      }
    )
  })
  /* so_items:
  0: {Label: "[equipment] *GREEN", Id: 11968550}
  1: {Label: "[novapass] CC_ShopSabre_CNC Router", Id: 11968621}
  2: {Label: "[novapass] LC_Hurricane_Laser Cutter", Id: 11968622}
  3: {Label: "[novapass] LC_Rabbit_Laser Cutter", Id: 11968623}
  */
  return so_items
}

function has_signoff(contact_id,signoff_name) {
  // does contact_id have signoff_name ? 
  $.each(contact_to_edit['FieldValues'],(kk,vv) => {
    if (vv['FieldName'] != 'NL Signoffs and Categories') 
      return true
    exisiting_signoffs = vv
    return false
  })

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
  var has_signoff = false
  $.each(exisiting_signoffs['Value'],(kk,vv) => {
    if (vv['Label'] != signoff_name)
      return true
    has_signoff = true
    return false
  })

}

function signoff_edit_emit_signoffs(contact_to_edit) {
  // List all possible sign-offs. 
  // Check items which user has been checked off on 
  var o = ''
  o += '<form class="form">'
  contacts_signed_off_items = get_contacts_signed_off_items(contact_to_edit)
  $.each(window.wautil_signoff_fields,(k,v) => {
    // iterate  through the list of all possible signoffs
    checked = ''
    if (contacts_signed_off_items.find(x => x.Id == v['Id']))
      // if current contact's has signoffs, mark then checked 
      checked = 'checked'

    // emit html
    o += signoff_emit_signoff_item(contact_to_edit['Id'],v['Id'],v['Label'],checked)
  })

  o += '</form>'
  return o

}

function signoff_emit_signoff_item(cid,fid,label,checked) {
  // output html for single checkoff
  // cid  : contact id
  // fid : field id
  // label : text to display
  // checked : if we should mark it checked

  var o = ''

  o += '  <div id="cid_'+cid+'" class="form-check signoff_item_div">'
  o += '    <input type="checkbox" class="form-check-input" id="fid_' + fid + '" ' + checked + ' >'
  o += '    <label class="form-check-label" for="fid_' + fid + '">' + decorate_signoffs(label) + '</label>'
  o += '  </div>'

  return o

}

function signoffs_edit_render(contact_to_edit) {

  // display single contact's editable signoffs

  o = ''

  // show name email of member
  o += '<p class="bigger"><b>' + 
    contact_to_edit['FirstName'] + ' ' 
    + contact_to_edit['LastName'] +
    ' (' + contact_to_edit['Email'] + ')' +

    ' (' + contact_to_edit.MembershipLevel.Name + ')' +
    '</b></p>'

  // search box and buttons
  o += '<hr>'
  o += '<div class="form-group form-inline m-0">'
  o += '<p><b>SHOW:&nbsp;</b></p>'
  o += '   <input class="input" id="signoff_edit_search_inp" type="text" placeholder="Search..">'
  o += '   <button class="btn btn-warning btn-inline btn-sm m-1" id="signoff_edit_show_all_tog_but">ALL POSSIBLE</button>'
  o += '   <button class="btn btn-warning btn-inline btn-sm m-1" id="signoff_edit_show_checked_but">ALREADY CHECKED</button>'
  o += '</div>'
  o += '<div class="form-group form-inline m-0">'
  o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_go_"><b>GO</b></button>'
  o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_lc_">LASER</button>'
  o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_ac_">ARTS&CRAFTS</button>'
  o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_bl_">BLACKSMITH</button>'
  o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_cc_">CNC</button>'
  o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_el_">ELECTRONICS</button>'
  o += '</div>'
  o += '<div class="form-group form-inline m-0">'
  o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_mw">METALSHOP</button>'
  o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_mwy_">METALSHOP YELLOW</button>'
  o += '</div>'
  o += '<div class="form-group form-inline m-0">'
  o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_ww">WOODSHOP</button>'
  o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_wwl_">WOODSHOP LATHE</button>'
  o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_wwy_">WOODSHOP YELLOW</button>'
  o += '   <button class="btn btn-warning btn-inline btn-sm m-1 signoff_edit_but" id="show_wwr_">WOODSHOP RED</button>'
  o += '</div>'
  o += '<hr>'
  o += '<div class="form-group form-inline m-0">'
  o += '<p><b>ACTIONS:</b></p>'
  o += '   <button class="btn btn-primary btn-inline btn-sm m-1" id="signoff_edit_check_all_but">CHECK ALL SHOWN</button>'
  o += '   <button class="btn btn-primary btn-inline btn-sm m-1" id="signoff_edit_uncheck_all_but">UNCHECK ALL SHOWN</button>'
  o += '   <button class="btn             btn-inline btn-sm m-1 btn-success" id="signoff_edit_save_but">SAVE</button>'
  o += '   <button class="btn btn-info    btn-inline btn-sm m-1" id="render_contacts_but">BACK TO PICK MEMBER</button>'
  o += '</div>'

  o += '<hr>'

  o += '<div>'
  o += signoff_edit_emit_signoffs(contact_to_edit); 

  $('#maindiv').html(o)

}

function emit_member_row(lhs,rhs,rhsid) {

  o = '<!-- -->'
  o += '<div class="row">'
  o += '<div class="col-4"><p style="text-align:right;margin:4px;font-weight:600">' + lhs + '</p></div>'
  o += '<div class="col-8"><p id="' + rhsid + '" style="text-align:left;margin:4px;">' + rhs + '</p></div>'
  o += '</div>'
  o += '<!-- -->'
  return o

}

function emit_block_button(i,t,a) {

  var o = `
    <div class="row">
    <div class="col-sm-4"></div>
    <div class="col-sm-3 pt-1">
    <button class="btn btn-block btn-success" style="display:block" id="${i}" ${a}>${t}</button>
    </div>
    </div>
    `
  return o
}



function member_edit_render(ct) {

  // display single contact's editable signoffs

  o = ''

  // search box and buttons

  o += emit_member_row('FirstName',ct['FirstName'],'')
  o += emit_member_row('LastName',ct['LastName'],'')
  o += emit_member_row('Email',ct['Email'],'')
  o += emit_member_row('MembershipLevel',ct['MembershipLevel'].Name,'')


  pkmid = 'wonthappen'
  $.each(ct['FieldValues'],(k,v) => {
    if (v.FieldName  == "Primary Member ID") {
      pkmid = v.Value
    } 
  })


  if (pkmid != 'wonthappen') {
    // show pull-down only if Primary Member Key ID is present
    oo = ''
    oo = '<select class="pkm" id="pkm">'
    pkall = get_prime_key_members()
    pkm =  get_prime_key_member_by_id(pkmid) 

    $.each(pkall,(k,v) => {

      s = ''
      if (v.id == pkm.id)
        s = 'selected'
      oo += '<option value="' + v.id + '" ' + s + '>' + v.name + '</option>'
    })

    oo += '</select>'

    o += emit_member_row('Pick Primary Member Name',oo,'')

    o += emit_member_row('Primary Member ID',pkm.id,'id')
    o += emit_member_row('Primary Member Email',pkm.email,'email')

  }

  o += emit_block_button('render_contacts_but','BACK TO PICK MEMBER','')
  o += emit_block_button('member_edit_save_but','SAVE','disabled')

  // https://bootstrap-table.com/docs/getting-started/usage/#via-javascript


  o += '<table class="table table-striped"><thead><tr>'
  o += '<td>'
  o += '<pre>'
  o += JSON.stringify(contact_to_edit,null,'\t')
  o += '</pre>'
  o += '</td>'
  o += '</tr>'
  o += '</table>'
  /*
  */

  $('#maindiv').html(o)

}
function get_prime_key_members() {

  pkm = []
  pkm.push({'name':'Pick a Prime Key Member',
    'email':'',
    'id':''})
  $.each(gl_contacts[0].Contacts,(k,v) => {
    if (('MembershipLevel' in v)) {
      if ( v['MembershipLevel'].Name.includes('Key') && // prime key members are ones with the substring Key 
        !v['MembershipLevel'].Name.includes('amily')) // but not the substr amily
        pkm.push({'name':v.DisplayName ,
          'email':v.Email,
          'id':v.Id
        })
    }
  })
  return pkm
}

function  get_prime_key_member_by_id(id) {
  pkent = ''
  $.each(get_prime_key_members(),(k,v) => {
    // lookup prime key member by id
    if (v.id == id)
      pkent = v 
  })
  return pkent
}

function get_system_code(contact, field_name) {

  /* Wa fields look like this:
      {
      "FieldName": "Primary Member ID",
      "Value": null,
      "SystemCode": "custom-12487369"  <------------- we need to supply this when saving to WA
      },
      */

  system_code = ''
  $.each(contact['FieldValues'],(kk,vv) => {
    // go fish for the right FieldValue 
    if (vv['FieldName'] == field_name)  {
      system_code = vv['SystemCode']
    }
  })
  return system_code
}

function member_save() {
  if (gl_contact_index_list.length)
    contact_index = gl_contact_index_list.pop(); 

  this_contact = gl_contacts[0].Contacts[contact_index]
  this_contact_id = this_contact['Id']

  wa_put_data = 
    {
      'Id' : this_contact_id ,
      'FieldValues' : 
      [
        { 
          'FieldName' : 'Primary Member ID',
          'SystemCode' : get_system_code(this_contact,'Primary Member ID'),
          'Value' : $('#id').html()
        },
        { 
          'FieldName' : 'Primary Member Name',
          'SystemCode' : get_system_code(this_contact,'Primary Member ID'),
          'Value' : $('#pkm option:selected').html()
        },
        { 
          'FieldName' : 'Primary Member Email',
          'SystemCode' : get_system_code(this_contact,'Primary Member ID'),
          'Value' : $('#email').html()
        }
      ]
    }

  flask_put_data = {
    'endpoint':'/accounts/$accountid/contacts/'  + this_contact_id,
    'put_data':wa_put_data 
  }

  $.ajax({
    type: 'PUT',
    url  : '/api/v1/wa_put_any_endpoint',
    data :  JSON.stringify(flask_put_data),
    beforeSend: () => { 
      show_loader('Saving'); 

    }, 
    success: (j) => { 
      if (j['error'] == 1) {
        hide_loader()
        m(j['error_message'],'warning')
        return false
      }
      hide_loader().then(()=>{m(''); m('successfully updated','success')})
      // update contact locally:
    },
    failure: (errMsg) => { alert("FAIL:" + errMsg); },
    error: (xh,ts,et) =>  { alert("FAIL:" + u + ' ' + et); },
    contentType: 'application/json; charset=utf-8',
    dataType : 'json', // we want to see json as a response
    processData: false
  })
}

function Xsignoffs_save() {
  //
  // update member's signoffs in WA and locally
  //
  checked_divs = $('.signoff_item_div > input:checked').parent()

  if (gl_contact_index_list.length)
    contact_index = gl_contact_index_list.pop(); 

  this_contact = gl_contacts[0].Contacts[contact_index]
  this_contact_id = this_contact['Id']
  signoff_idx = gl_equipment_signoff_systemcode
  this_signoffs = this_contact['FieldValues'][signoff_idx]; 

  indiv_signoff_ids  = []
  $('.signoff_item_div').find('input:checked').each(function() { 
    //
    // <div id="cid_50537517" class="form-check signoff_item_div">  
    // <input type="checkbox" class="form-check-input" id="fid_11968623" checked="checked">   
    //                   we store the field id in the DOM  ^^^^^^^^^^^^
    tid = this.id.replace('fid_','')
    //                  important:  vvvvvvvv
    indiv_signoff_ids.push( { 'Id': parseInt(tid), 'Label': $(this).next('label').text() })
  })

  // indiv_signoff_ids  
  // "[{"Id":"11968550"},{"Id":"11968623"}]" ....

  // compose what will become the json 
  // we send up to WA...
  wa_put_data = 
    {
      'Id' : this_contact_id ,
      'FieldValues' : 
      [{ 
        'FieldName' : 'EquipmentSignoffs',
        'SystemCode' : gl_equipment_signoff_systemcode,
        'Value' : 
        indiv_signoff_ids

      }]
    }
  // .. but we send it via flask web server
  // all of wa_put_data will be sent to the flask server under 'put_data':
  flask_put_data = {
    'endpoint':'/accounts/$accountid/contacts/'  + this_contact_id,
    'put_data':wa_put_data 
  }

  $.ajax({
    type: 'PUT',
    url  : '/api/v1/wa_put_any_endpoint',
    data :  JSON.stringify(flask_put_data),
    beforeSend: () => { 
      show_loader('Saving'); 
    }, 
    success: (j) => { 
      if (j != null && j['error'] == 1) {
        hide_loader()
        m(j['error_message'],'warning')
        return false
      }
      hide_loader().then(()=>{m(''); m('signoffs successfully updated','success')})
      // update contact locally:
      $.each(gl_contacts[0].Contacts,function(k,v) {
        if (v['Id'] == this_contact_id) {
          // find the contact we are working on.. 
          $.each($(this)[0]['FieldValues'],function(kk,vv) {
            // then find 'EquipmentSignoffs' in their entry..
            if (vv['FieldName'] != 'NL Signoffs and Categories') 
              return true
            // and replace it with what we sent up to WA
            $(this)[0]['Value'] = wa_put_data['FieldValues'][0]['Value'] 
          })
        }
      })
    },
    failure: (errMsg) => { alert("FAIL:" + errMsg); },
    error: (xh,ts,et) =>  { alert("FAIL:" + u + ' ' + et); },
    contentType: 'application/json; charset=utf-8',
    dataType : 'json', // we want to see json as a response
    processData: false
  })
}
function signoffs_save() {
  //
  // update member's signoffs in WA and locally
  //
  checked_divs = $('.signoff_item_div > input:checked').parent()

  if (gl_contact_index_list.length)
    contact_index = gl_contact_index_list.pop(); 

  this_contact    = gl_contacts[0].Contacts[contact_index]
  this_contact_id = this_contact['Id']
  signoff_idx     = gl_equipment_signoff_systemcode
  this_signoffs   = this_contact['FieldValues'][signoff_idx];

  indiv_signoff_ids  = []
  $('.signoff_item_div').find('input:checked').each(function() { 
    //
    // <div id="cid_50537517" class="form-check signoff_item_div">  
    // <input type="checkbox" class="form-check-input" id="fid_11968623" checked="checked">   
    //                   we store the field id in the DOM  ^^^^^^^^^^^^
    tid = this.id.replace('fid_','')
    //                  important:  vvvvvvvv
    indiv_signoff_ids.push( { 'Id': parseInt(tid) })
  })

  // indiv_signoff_ids  
  // "[{"Id":"11968550"},{"Id":"11968623"}]" ....

  // compose what will become the json 
  // we send up to WA...
  wa_put_data = 
    {
      'Id' : this_contact_id ,
      'FieldValues' : 
      [{ 
        'SystemCode' : gl_equipment_signoff_systemcode,
        'Value' : 
        indiv_signoff_ids
      }]
    }
  // .. but we send it via flask web server
  // all of wa_put_data will be sent to the flask server under 'put_data':
  flask_put_data = {
    'endpoint':'/accounts/$accountid/contacts/'  + this_contact_id,
    'put_data':wa_put_data 
  }

  $.ajax({
    type: 'PUT',
    url  : '/api/v1/wa_put_any_endpoint',
    data :  JSON.stringify(flask_put_data),
    beforeSend: () => { 
      show_loader('Saving'); 
    }, 
    success: (j) => { 

      if (j != null && j['error'] == 1) {
        hide_loader()
        m('ERROR: ' + j['error_message'],'warning')
        return false
      }
      hide_loader().then(()=>{m(''); m('signoffs successfully updated','success')})
      // update contact locally:
      $.each(gl_contacts[0].Contacts,function(k,v) {
        if (v['Id'] == this_contact_id) {
          // find the contact we are working on.. 
          $.each($(this)[0]['FieldValues'],function(kk,vv) {
            // then find 'EquipmentSignoffs' in their entry..
            if (vv['FieldName'] != 'NL Signoffs and Categories') 
              return true
            // and replace it with what we sent up to WA
            $(this)[0]['Value'] = wa_put_data['FieldValues'][0]['Value'] 
          })
        }
      })
    },
    failure: (errMsg) => { alert("FAIL:" + errMsg); },
    error: (xh,ts,et) =>  { alert("FAIL:" + u + ' ' + et); },
    contentType: 'application/json; charset=utf-8',
    dataType : 'json', // we want to see json as a response
    processData: false
  })
}

function get_events() {
  // get contacts list
  // https://app.swaggerhub.com/apis-docs/WildApricot/wild-apricot_public_api/2.1.0#/Contacts/GetContactsList
  fep  = $.param({
    '$filter':'IsUpcoming eq True',
    '$sort':'ByStartDate asc'
  } )
  ep = $.param( {'endpoint':'accounts/$accountid/events/?' + fep})
  return new Promise(function(resolve,reject) {
    u  = '/api/v1/wa_get_any_endpoint',
      $.ajax({
        type: 'GET',
        url  : u,
        // string '$accountid' will get replaced with real account id on server
        // 'ByStartDate asc' doesn't seem to work
        //data : $.param({'endpoint':'accounts/$accountid/events/?&$filter=IsUpcoming%20eq%20true&$sort=ByStartDate%20asc'}),
        //data : $.param( {'endpoint':'accounts/$accountid/events/?%24async=false&%24filter=IsUpcoming%20eq%20True&%24sort=ByStartDate%20asc'}),
        data : ep,
        success: (j) => { 
          gl_events  = j; // save for later
          process_events(gl_events)
          resolve();  
        }, 
        failure: (errMsg) => { alert("FAIL:" + errMsg); },
        error: (xh,ts,et) =>  { alert("FAIL:" + u + ' ' + et); },
        contentType: false,
        processData: false
      })

  })

}

function fetch_contact_info(id) {

  return new Promise(function(resolve,reject) {

    console.log('fetch_contact_info(' + id + ') starting')

    $.ajax({
      type: 'GET',
      url  : '/api/v1/wa_get_any_endpoint',
      // string '$accountid' will get replaced with real account id on server
      data : $.param({'endpoint':'accounts/$accountid/contacts/' + id }),
      success: (j) => { 
        console.log('fetch_contact_info(' + id + ') pushing')
        gl_contacts.push(j[0])
        console.log(`fetch_registration_type(${id}) pushing.. gl_contacts(${gl_contacts.length})`)
        resolve()
      }, 
      failure: (errMsg) => { alert("FAIL:" + errMsg); },
      error: (xh,ts,et) =>  { alert("FAIL:" + u + ' ' + et); },
      contentType: false,
      processData: false,
      async: false

    })
  })

}

function get_all_contact_info() {

  return new Promise(function(resolve,reject) {
    reg_proms = []
    for (let ev of gl_event_registrations) { 
      reg_proms.push(fetch_contact_info(ev.Contact.Id))
    }
    // and don't resolve until they are all done
    $.when(event_proms).done(()=>{ resolve() })
  })

}

function get_all_reg_info() {

  // need to make multiple eventregistrations api calls
  
  return new Promise(function(resolve,reject) {
    // fire them off 
    event_proms = []
    for (let ev of gl_event_registrations) { 
      event_proms.push(fetch_registration_type(ev.RegistrationTypeId))
    }

  // and don't resolve until they are all done
  $.when(event_proms).done(()=>{ resolve() })
  })

}


function get_event_registrations() {

  return new Promise(function(resolve,reject) {
    // get information about evennt
    event_id = gl_event_id
    // get contacts list
    // https://app.swaggerhub.com/apis-docs/WildApricot/wild-apricot_public_api/2.1.0#/Contacts/GetContactsList
    fep  = $.param({
      'eventId':event_id,
      'includeWaitList':'true',
      '$async':'false'
    } )
    ep = $.param( {'endpoint':'accounts/$accountid/eventregistrations?' + fep})
    u  = '/api/v1/wa_get_any_endpoint',
      $.ajax({
        type: 'GET',
        url  : u,
        data : ep,
        success: (j) => { 
          gl_event_registrations  = j; // save for later
          console.log('get_event_registrations() resolved')
          resolve();  
        }, 
        failure: (errMsg) => { alert("FAIL:" + errMsg); },
        error: (xh,ts,et) =>  { alert("FAIL:" + u + ' ' + et); },
        contentType: false,
        processData: false
      })

  })

}

function emit_event_item(v) {

  o += '<td>'
  o += '<p>' + v  + '</p>'
  o += '</td>'

  return o
}

function get_registration_field(reg_fields,field_name) {
  // get the value of 'field_name' out of reg_fields 
  for (let rf of reg_fields) {
    if (rf.FieldName == field_name)
      return rf.Value
  }
  return ''
}

function get_contact_membership(id) {

  for (let ct of gl_contacts) {
    if ((ct.Id == id) && (ct['MembershipLevel'] != undefined))
      return ct['MembershipLevel'].Name
  }
  return 'not a member'

}


function process_event_registrations() {

  return new Promise((resolve,reject) => {
    console.log('process_event_registrations() start')
    event_info = gl_event_registrations


    if (event_info['error'] == 1) {
      m(event_info['error_message'],'warning')
    } else  {

      o = ''
      o += '<h3>Event Registrations</h3>'
      o += `<h2>${event_info[0].Event.Name}</h2>`
      o += '<button class="btn btn-info    btn-inline btn-sm m-1" id="show_events_btn">BACK</button>'
      o += '<table id="events_table" class="table table-striped"></table>'
      $('#maindiv').html(o)

      //o += '<pre>'
      //o += JSON.stringify(event_info,null,'\t')
      //o += '</pre>'
      d=[]
      for (let ev of event_info) { 


        d.push({ 
          DisplayName : get_registration_field(ev.RegistrationFields,'First name')  + ' ' + 
                        get_registration_field(ev.RegistrationFields,'Last name'),
          MemberLevel : get_contact_membership(ev.Contact.Id),
          Email           : get_registration_field(ev.RegistrationFields,'Email'),
          Phone           : get_registration_field(ev.RegistrationFields,'Phone'),
          IsPaid          : ev.IsPaid,
          RegType         : get_registration_type_field(ev.RegistrationTypeId,'Name'),
          RegistrationFee : ev.RegistrationFee,
          OnWaitlist      : ev.OnWaitlist 
        })
      }


      $('#events_table').bootstrapTable(
        {
          search      : true,      // Whether to display table search
          showColumns : true,
          uniqueId    : "id",    // The unique identifier for each row, usually the primary key column
          showToggle  : true , // Whether to display the toggle buttons for detail view and list view
          sortName    : "OnWaitlist",
          sortOrder   : "asc",

          columns: [
            {
              title    : 'Name',
              field    : 'DisplayName',
              sortable : true,
              },
              {
              title    : 'Email',
              field    : 'Email',
              sortable : true,
              },
              {
              title    : 'MemberLevel',
              field    : 'MemberLevel',
              sortable : true,
              },
              {
              title    : 'Phone',
              field    : 'Phone',
              sortable : true,
              },
              {
              title    : 'RegType',
              field    : 'RegType',
              sortable : true,
              },
              {
              title    : 'Memo',
              field    : 'Memo',
              sortable : true,
              },
              {
              title    : 'IsPaid',
              field    : 'IsPaid',
              sortable : true,
              },
              {
              title    : 'RegFee',
              field    : 'RegistrationFee',
              sortable : true,
            }, 
            {
              title: 'OnWaitlist',
              field: 'OnWaitlist',
            sortable: true,
            }
            ],
          data : d 
        })

        $('#events_table').bootstrapTable('hideColumn','Memo')

      o += '<pre>'
      o += JSON.stringify(event_info,null,'\t')
      o += '</pre>'


    }

    console.log('process_event_registrations() done')
    resolve()

  })
}
function process_events_p() {
  return new Promise( (resolve,reject)=> {
    process_events(gl_events)
    resolve()
  }) 

}

function process_events(j) {

  if (j['error'] == 1) {
    m(j['error_message'],'warning')
  } else  {

    o = ''
    o += '<h3>Upcoming Events</h3>'

    o += '<table id="events_table"></table>'

    $('#maindiv').html(o)

    d  = []; 
    $.each(j[0]['Events'],(k,v) => {
      disab = ''
      if (v.AccessLevel != 'Public')
        return
      if (v.ConfirmedRegistrationsCount == 0)
        disab = 'disabled'

      d.push({
        Button                      : '<button class="btn btn-primary btn-sm m-1 event_row_edit_btn" id="'+v.Id+'"' + disab + '>?</button>',
        Id                          : v.Id,
        Name                        : '<b>' + v.Name + '</b>',
        AccessLevel                 : v.AccessLevel,
        ConfirmedRegistrationsCount : v.ConfirmedRegistrationsCount,
        RegistrationsLimit          : v.RegistrationsLimit,
        StartDate                   : v.StartDate.replace('T',' '),
        Location                    : v.Location,
        Tags                        : v.Tags
      })
    })


    // https://bootstrap-table.com/docs/getting-started/usage/#via-javascript

    $('#events_table').bootstrapTable(
      {
        search      : true,      // Whether to display table search
        showColumns : true,
        uniqueId    : "id",    // The unique identifier for each row, usually the primary key column
        showToggle  : true , // Whether to display the toggle buttons for detail view and list view
        sortName    : "StartDate",
        sortOrder   : "asc",

        columns: [
          {
            field: 'Button',
          }, 
          {
            title: 'Id',
            field: 'Id',
            sortable: true,
          }, 
          {
            title: 'Name',
            field: 'Name',
            sortable: true,
          }, 
          {
            title: 'Visibility',
            field: 'AccessLevel',
          }, 
          { 
            title: 'Regi-<br> strations',
            field: 'ConfirmedRegistrationsCount',
            width: '100px',
            sortable: true,

          }, 
          { 
            title: 'Reg-<br> Limit',
            field: 'RegistrationsLimit',
            width: '100px',
            sortable: true,

          }, 
          {
            title: 'Start Date',
            field: 'StartDate',
            sortable: true,
          }, 
          { 
            title: 'Location',
            field: 'Location',
            sortable: true,

          }, 
          {

            title: 'Tags',
            field: 'Tags',
            sortable: true,
          }, 
        ],
        data : d 

      })

    $('#events_table').bootstrapTable('hideColumn','Id')
    //$('#events_table').bootstrapTable('hideColumn','Visibility')
    $('#events_table').bootstrapTable('hideColumn','AccessLevel')


  }
}

// initialize global storage
gl_contact_ids                  = []
gl_contact_fields               = []
gl_contacts                     = []
gl_contact_index_list           = []
gl_equipment_signoff_systemcode = []
gl_events                       = []
gl_event_registrations          = []
gl_event_id                     = ''
gl_reg_typeinfo                 = []


if ( $('#is_authenticated').data('value') != "True") {
  $('#nav_login_out').html('LOGIN')
  Cookies.remove('session')
} else
  $('#nav_login_out').html('LOGOUT')



// implement signoffs
if (document.getElementsByTagName("title")[0].innerHTML == 'signoffs') {
  hide_maindiv()
    .then(show_loader)
    .then(get_signoffs)
    .then(get_contacts)
    .then(hide_loader)
    .then(show_maindiv)
  return 0
} 

// implement events
if (document.getElementsByTagName("title")[0].innerHTML == 'events') {

  $('#loadermessage').html('Fetching Event Info..')
  hide_maindiv()
    .then(show_loader)
    .then(get_events)
    .then(hide_loader)
    .then(show_maindiv)
    .then($ => { })
  return 0
} 
// implement members 
if (document.getElementsByTagName("title")[0].innerHTML == 'members') {
  $('#loadermessage').html('Fetching Membership Info..')
  hide_maindiv()
    .then(show_loader)
    .then(get_membershiplevels)
    .then(get_contacts)
    .then(hide_loader)
    .then(show_maindiv)

  return 0
} 

})


