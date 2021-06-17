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



  function get_events() {
    WAAPI.events({"$sort": "ByStartDate asc", "$filter": get_event_filter()}, (json) => {
      gl_events = json;
      process_events(json);
    });
  }

  function get_event_filter() {
    var searchParams = new URLSearchParams(window.location.search);
    return searchParams.get('filter') || "IsUpcoming eq True";
  }

  function fetch_contact_info(id) {
    event_id = gl_event_id; // FIXME: Remove global
    return WAAPI.contact(id, (json) => {
      console.log('fetch_contact_info(' + id + ') pushing:', json);
      gl_contacts.push(json);
    });
  }

  function get_all_contact_info() {
    reg_proms = [];
    for (let ev of gl_event_registrations) {
      reg_proms.push(fetch_contact_info(ev.Contact.Id));
    }
    return Promise.all(reg_proms);
  }

  function get_all_reg_info() {
    event_proms = [];
    for (let ev of gl_event_registrations) {
      event_proms.push(fetch_registration_type(ev.RegistrationTypeId));
    }
    return Promise.all(event_proms);
  }


  function get_event_registrations() {
    event_id = gl_event_id; // FIXME: Remove global
    params = {'eventId': event_id, 'includeWaitList': 'true', '$async': 'false'};
    return WAAPI.event_registrations(params, (json) => {
      gl_event_registrations = json; // FIXME: Remove global
    });
  }

  function emit_event_item(v) {
    o += '<td>';
    o += '<p>' + v + '</p>';
    o += '</td>';

    return o;
  }

  function get_registration_field(reg_fields, field_name) {
    // get the value of 'field_name' out of reg_fields
    for (let rf of reg_fields) {
      if (rf.FieldName == field_name) {
        return rf.Value;
      }
    }
    return '';
  }

  function get_contact_membership(id) {
    for (let ct of gl_contacts) {
      if ((ct.Id == id) && (ct.MembershipLevel != undefined)) {
        return ct.MembershipLevel.Name;
      }
    }
    return 'not a member';
  }

  function process_event_registrations() {
    return new Promise((resolve, reject) => {
      event_info = gl_event_registrations;

      if (event_info.error == 1) {
        m(event_info.error_message, 'warning');
      }
      else {
        o = '';
        o += '<h3>Event Registrations</h3>';
        o += `<h2>${event_info[0].Event.Name}</h2>`;
        o += `<p>Event ID: <code>${gl_event_id}</code></p>`;

        o += '<p class="d-print-none">';
        o += '<button class="btn btn-info btn-inline btn-sm mr-1" id="show_events_btn">Back</button>';
        if (window.formbot_url) {
          o += `<a href="${window.formbot_url}${gl_event_id}" class="btn btn-warning btn-sm">Instructor Formbot</a>`;
        }
        o += '</p>';

        o += '<table id="events_table" class="table table-striped"></table>';
        $('#maindiv').html(o);

        d = [];
        for (let ev of event_info) {
          d.push({
            DisplayName: get_registration_field(ev.RegistrationFields, 'First name') + ' ' +
            get_registration_field(ev.RegistrationFields, 'Last name'),
            MemberLevel: get_contact_membership(ev.Contact.Id),
            Email: get_registration_field(ev.RegistrationFields, 'Email'),
            Phone: get_registration_field(ev.RegistrationFields, 'Phone'),
            IsPaid: ev.IsPaid,
            RegType: get_registration_type_field(ev.RegistrationTypeId, 'Name'),
            RegistrationFee: ev.RegistrationFee,
            OnWaitlist: ev.OnWaitlist
          });
        }


        $('#events_table')
          .bootstrapTable({
            search: true, // Whether to display table search
            showColumns: true,
            uniqueId: "id", // The unique identifier for each row, usually the primary key column
            showToggle: true, // Whether to display the toggle buttons for detail view and list view
            sortName: "OnWaitlist",
            sortOrder: "asc",

            columns: [{
              title: 'Name',
              field: 'DisplayName',
              sortable: true,
            },
              {
                title: 'Email',
                field: 'Email',
                sortable: true,
              },
              {
                title: 'MemberLevel',
                field: 'MemberLevel',
                sortable: true,
              },
              {
                title: 'Phone',
                field: 'Phone',
                sortable: true,
              },
              {
                title: 'RegType',
                field: 'RegType',
                sortable: true,
              },
              {
                title: 'Memo',
                field: 'Memo',
                sortable: true,
              },
              {
                title: 'IsPaid',
                field: 'IsPaid',
                sortable: true,
              },
              {
                title: 'RegFee',
                field: 'RegistrationFee',
                sortable: true,
              },
              {
                title: 'OnWaitlist',
                field: 'OnWaitlist',
                sortable: true,
              }
            ],
            data: d
          });

        $('#events_table').bootstrapTable('hideColumn', 'Memo');
        o += '<pre>';
        o += JSON.stringify(event_info, null, '\t');
        o += '</pre>';
      }
      resolve();
    });
  }

  function process_events_p() {
    return new Promise((resolve, reject) => {
      process_events(gl_events);
      resolve();
    });

  }

  function fetch_registration_type(id) {
    return WAAPI.event_registration_types(id, (json) => {
      console.log('fetch_registration_type(' + id + ') pushing', json);
      gl_reg_typeinfo.push(json);
    });
  }

  function get_registration_type_field(id, field) {
    rt = get_registration_type(id);
    try {
      rs = rt[field];
    } catch {
      // 'optional catch binding' is only available in ES10
      return '';
    }
    return rs;
  }

  function get_registration_type(id) {
    for (let rt of gl_reg_typeinfo) {
      if (rt.Id == id) {
        return rt;
      }
    }
    return undefined;
  }

  function process_events(json) {
    o = '';
    o += '<h3>';
    o += '<span>Events</span>';
    o += '<div class="float-right btn-group d-print-none" role="group">';
    o += '  <button type="button" class="btn btn-light" id="event_filter_past">Past Events</button>';
    o += '  <button type="button" class="btn btn-light" id="event_filter_upcoming">Upcoming Events</button>';
    o += '</div>';
    o += '</h3>';
    o += '<table id="events_table"></table>';
    $('#maindiv').html(o);

    d = [];
    $.each(json.Events, (k, v) => {
      disab = '';
      if (v.AccessLevel != 'Public') {
        return;
      }
      if (v.ConfirmedRegistrationsCount == 0) {
        disab = 'disabled';
      }

      d.push({
        Button: '<button class="btn btn-primary btn-sm m-1 event_row_edit_btn" id="' + v.Id + '"' + disab + '>?</button>',
        Id: v.Id,
        Name: '<b>' + v.Name + '</b>',
        AccessLevel: v.AccessLevel,
        ConfirmedRegistrationsCount: v.ConfirmedRegistrationsCount,
        RegistrationsLimit: v.RegistrationsLimit,
        StartDate: v.StartDate.replace('T', ' '),
        Location: v.Location,
        Tags: v.Tags
      });
    });

    // https://bootstrap-table.com/docs/getting-started/usage/#via-javascript
    $('#events_table')
      .bootstrapTable({
        search: true, // Whether to display table search
        showColumns: true,
        uniqueId: "id", // The unique identifier for each row, usually the primary key column
        showToggle: true, // Whether to display the toggle buttons for detail view and list view
        sortName: "StartDate",
        sortOrder: "asc",

        columns: [{
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
        data: d

      });

    $('#events_table')
      .bootstrapTable('hideColumn', 'Id');
    $('#events_table')
      .bootstrapTable('hideColumn', 'AccessLevel');
  }

  $(document).on('click', '#show_events_btn', function() {
    hide_maindiv()
      .then(() => {
        console.log('1');
        $('#maindiv').html('');
      })
      .then(process_events_p)
      .then(show_maindiv);
  });

  $(document).on('click', '.event_row_edit_btn', function() {
    gl_event_id = $(this)
      .attr('id');

    console.log('event_row_edit_btn click');
    empty_promise()
      .then(show_loader)
      .then(hide_maindiv)
      .then(get_event_registrations)
      .then(get_all_reg_info)
      .then(get_all_contact_info)
      .then(process_event_registrations)
      .then(hide_loader)
      .then(show_maindiv);
  });

  $(document)
    .on('click', '#event_filter_past', () => {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.set('filter', 'IsUpcoming eq False');
      window.location.search = urlParams;
    });

  $(document)
    .on('click', '#event_filter_upcoming', () => {
      const urlParams = new URLSearchParams(window.location.search);
      urlParams.delete('filter');
      window.location.search = urlParams;
    });

  // initialize global storage
  gl_events = [];
  gl_event_registrations = [];
  gl_event_id = '';
  gl_reg_typeinfo = [];
  gl_contacts = [];


  // implement events
  if ($("body#events_page")) {
    $('#loadermessage').html('Fetching Event Info..');

    hide_maindiv()
      .then(show_loader)
      .then(get_events)
      .then(hide_loader)
      .then(show_maindiv)
      .then($ => {});

    return 0;
  }
});
