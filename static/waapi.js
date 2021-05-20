var WAAPI = (function (self) {
  headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  function proxy_path(subpath, params) {
    path = '/api/v1/wa_proxy/' + subpath;
    if (params) {
      path = path + "?" + (new URLSearchParams(params)).toString();
    }
    return path;
  }

  function get(path, search_params, success) {
    opts = {
      method: 'GET',
      headers: headers
    };

    return fetch(proxy_path(path, search_params), opts)
      .then(response => response.json())
      .then(json => {
        console.log("WAAPI:", json);
        if (success) {
          success(json);
        }
      })
    .catch((error) => {
      console.error("WAAPI Error:", error);
    });
  }

  function put(path, search_params, body, success) {
    opts = {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(body)
    };

    return fetch(proxy_path(path, search_params), opts)
      .then(response => response.json())
      .then(json => {
        console.log("WAAPI:", json);
        if (success) {
          return success(json);
        }
      })
    .catch((error) => {
      return console.error("WAAPI Error:", error);
    });
  }

  //
  // Public Functions
  //

  // https://app.swaggerhub.com/apis-docs/WildApricot/wild-apricot_public_api/7.15.0#/Accounts/GetAccount
  self.account = function(callback) {
    return get('accounts/{accountId}', null, callback);
  };

  // https://app.swaggerhub.com/apis-docs/WildApricot/wild-apricot_public_api/7.15.0#/Events/GetEventsList
  self.events = function(params, callback) {
    return get('accounts/{accountId}/events', params, callback);
  };

  // https://app.swaggerhub.com/apis-docs/WildApricot/wild-apricot_public_api/7.15.0#/Contacts/GetContactsList
  self.contact = function(id, callback) {
    params = { '$async': 'false'};
    return get('accounts/{accountId}/contacts/' + id, params, callback);
  };

  // https://app.swaggerhub.com/apis-docs/WildApricot/wild-apricot_public_api/7.15.0#/Events.EventRegistrations/GetEventRegistrationsList
  self.event_registrations = function(params, callback) {
    return get('accounts/{accountId}/eventregistrations', params, callback);
  };

  // https://app.swaggerhub.com/apis-docs/WildApricot/wild-apricot_public_api/7.15.0#/Events.EventRegistrationTypes/getEventRegistrationTypesList
  self.event_registration_types = function(id, callback) {
    params = { '$async': 'false'};
    return get('accounts/{accountId}/EventRegistrationTypes/' + id, params, callback);
  };

  self.contacts = function(callback) {
    params = { '$async': 'false'};
    return get('accounts/{accountId}/contacts', params, callback);
  };

  self.membership_levels = function(callback) {
    return get('accounts/{accountId}/membershiplevels', null, callback);
  };

  self.contact_fields = function(callback) {
    return get('accounts/{accountId}/contactfields', null, callback);
  };

  self.update_contact = function(id, body, callback) {
    return put('accounts/{accountId}/contacts/' + id, null, body, callback);
  };

  self.update_member = function(id, body, callback) {
    return put('accounts/{accountId}/contacts/' + id, null, body, callback);
  };

  return self;
}(WAAPI || {}));

