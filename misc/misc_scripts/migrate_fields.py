#!/usr/bin/env python3
"""

migrate_fields

Copies fields spaceman to wild apricot

adapted from spaceman2apricot.py by https://github.com/azagh

"""

usage= """

    options:

        --wa_levels        : print wild apricot member levels and exit
        --wa_member_levels : print wild apricot members and their levels and exit
        --sm_member_levels : print spaceman members and their levels and exit
        --run              : perform the action
"""

import os
import sys
from dotenv import load_dotenv
from WaApi import WaApiClient
import pprint
import getopt
import urllib
import pandas

sys.exit_code_fail = 1
sys.exit_code_ok   = 0

def pp(v):
    pprint.pprint(v)

load_dotenv(override=True)

# Connect to WA and get all the contacts from WA

api                = WaApiClient(os.getenv("CLIENT_ID"), os.getenv("CLIENT_SECRET"))
api.authenticate_with_apikey(os.getenv("API_KEY"))

accounts           = api.execute_request("/accounts")
account            = accounts[0]
contactsUrl        = account.Url + '/Contacts'
contactfieldsUrl   = account.Url + '/contactfields'
contactsignoffsUrl = contactfieldsUrl + '/12472413'



def update_signoffs(contact_id,signoffs,signoffs_ids_by_name):
    #pp.pprint(get_contacts_signoffs_by_email('bob@cogwheel.com'))
    """
      how we do it in js
      wa_put_data = 
        {
          'Id' : this_contact_id ,
          'FieldValues' : 
          [{ 
            'FieldName' : 'EquipmentSignoffs',
            'SystemCode' : window.wautils_equipment_signoff_systemcode,
            'Value' : 
            indiv_signoff_ids

          }]
        }

    What it a they look like in a get

    {   'FieldName': 'NL Signoffs and Categories',

    'SystemCode': 'custom-12472413',
    'Value': [   {"Id": 13925244, "Label": "[equipment] *GREEN"},
                 {"Id": 13925245, "Label": "[equipment] *Minor or Supervised Access Only"}]}

    """
    # build individual list of signoffs 
    soc = []
    for sos in signoffs:
        soc.append({'Id': int(signoffs_ids_by_name[sos]),
                    'Label': sos})
    """
    soc should look something like this now:

            [{'Id': 13948202, 'Label': '[equipment] WW_Rikon_Bandsaw Red'},
             {'Id': 13948213, 'Label': '[equipment] WWR_SawStop_Table Saw'},
             {'Id': 13948153, 'Label': '[signoff] GREEN ORIENTATION'},
             {'Id': 13948228, 'Label': '[novapass] WWR_SawStop_Table Saw'},
             {'Id': 13948200, 'Label': '[equipment] WW_General_Bandsaw Red'},
             {'Id': 13948238, 'Label': '[category] members'}]
    """


    # fill in the rest of the request
    data = {}
    data['Id'] = str(contact_id)
    data['FieldValues'] = [] 
    data['FieldValues'].append({'FieldName':'NL Signoffs and Categories',
                                'SystemCode':'custom-12472413',
                                'Value': soc 
                                })
        
    """
    The completed request:

    {   'FieldValues': [   {   'FieldName': 'NL Signoffs and Categories',
                           'SystemCode': 'custom-12472413',
                           'Value': [   {   'Id': 13948202,
                                            'Label': '[equipment] '
                                                     'WW_Rikon_Bandsaw Red'},
                                        {   'Id': 13948213,
                                            'Label': '[equipment] '
                                                     'WWR_SawStop_Table Saw'},
                                        {   'Id': 13948153,
                                            'Label': '[signoff] GREEN '
                                                     'ORIENTATION'},
                                        {   'Id': 13948228,
                                            'Label': '[novapass] '
                                                     'WWR_SawStop_Table Saw'},
                                        {   'Id': 13948200,
                                            'Label': '[equipment] '
                                                     'WW_General_Bandsaw Red'},
                                        {   'Id': 13948238,
                                            'Label': '[category] members'}]}],
    'Id': '56825441'}

    """

    #pp.pprint("---------")
    #pp.pprint(data)
    #pp.pprint("---------")
    result = api.execute_request_raw(contactsUrl + "/" + str(contact_id), api_request_object=data, method='PUT')
    #import pdb;pdb.set_trace() # stop and debug
    return result


def get_contacts_signoffs_by_email(email):
    #wa_contact  = get_contactfields_by_email('bob@cogwheel.com')
    wa_contact  = get_contact_by_email(email)
    wa_contact  = vars(wa_contact[0])

    for f in wa_contact['FieldValues']:
        #import pdb;pdb.set_trace() # stop and debug
        f = vars(f) # convert from object to dict
        if f['FieldName'] == "NL Signoffs and Categories":
            #pp.pprint(f)
            return(f)

def get_contactfields_by_email(emailAddress):
    params = {'$filter': 'Email eq ' + emailAddress,
              '$async': 'false'}
    request_url = contactsignoffsUrl + '?' + urllib.parse.urlencode(params)
    print(request_url)
    response = api.execute_request(request_url)
    return response


def get_all_contacts():
    params = {'$async': 'false'}
    request_url = contactsUrl + '?' + urllib.parse.urlencode(params)
    #print(request_url)
    return api.execute_request(request_url).Contacts

def get_contact_by_email(emailAddress):
    params = {'$filter': 'Email eq ' + emailAddress,
              '$async': 'false'}
    request_url = contactsUrl + '?' + urllib.parse.urlencode(params)
    print(request_url)
    response =  api.execute_request(request_url)
    return response.Contacts


def create_member(email, fname, lname, phone, spaceman_id, badge_number):
    data = {
        'Email': email,
        'FirstName': fname,
       'LastName': lname,
        'FieldValues': [
            {
                'FieldName': 'Phone',
                'Value': phone},
            {
                'FieldName': 'Spaceman ID',
                'Value': '' + str(spaceman_id) + ''},
            {
                'FieldName': 'Badge Number',
                'Value': '' + str(badge_number) + ''},
        ],
        'MembershipEnabled': 'true',
        'Status': 'Active',
        "MembershipLevel": {
            "Id": 1207614
        }
    }
    return api.execute_request(contactsUrl, api_request_object=data, method='POST')

def update_member(contact_id, spaceman_id, badge_number,signoffs):
    data = {
        'Id': str(contact_id),
        'FieldValues': [
            {
                'FieldName': 'Spaceman ID',
                'Value': '' + str(spaceman_id) + ''
            },
            {
                'FieldName': 'Badge Number',
                'Value': '' + str(badge_number) + ''
            },
        ],
        'MembershipEnabled': 'true',
        'Status': 'Active',
        "MembershipLevel": {
            "Id": 1207614
        }

    }
    return api.execute_request(contactsUrl + "/" + str(contact_id), api_request_object=data, method='PUT')


def parse_fullname(name_string):
    names = name_string.split(" ", 1)
    firstName = names[0]
    if len(names) > 1:
        lastName = names[1]
    else:
        lastName = ''
    return firstName, lastName


def get_membershiplevels():
    return api.execute_request(account.Url + "/membershiplevels") 


def set_membershiplevel(member_id,new_level_id):
    data = {
        'Id': str(member_id),
        "MembershipLevel": {
            "Id": new_level_id 
        }
    }
    try:
        result = api.execute_request(contactsUrl + "/" + str(member_id), api_request_object=data, method='PUT')
    except:
        sys.stderr.write("set_membershiplevel(): member_id:%s,new_level_id:%s: FAIL\n" % (member_id, new_level_id))


if __name__ == '__main__':

    try:
        opts,args = getopt.getopt(sys.argv[1:],'',['wa_levels','wa_member_levels','sm_member_levels','run'])

    except getopt.GetoptError as err:
        sys.stderr.write(str(err) +'\n')
        sys.stderr.write(usage_mesg)
        sys.exit(sys.exit_code_fail)

    options = []
    if len(opts):
        options = opts.pop()



    wa_levels = get_membershiplevels()
    wa_contacts = get_all_contacts()
    sm_users = pandas.read_csv(os.environ['SPACEMAN_URL'])
    wa_lvls_by_name = {}
    wa_member_id_by_email = {}



    if '--wa_levels' in options:
        # print levels and exit
        for lvl in wa_levels:
            wa_lvls_by_name[lvl.Name] = lvl.Id
            print('%d "%s"' %( int(lvl.Id),lvl.Name))
        sys.exit(sys.exit_code_ok)
    

    if '--wa_member_levels' in options:
        # print members and exit
        for cobj in wa_contacts:
            cvars = vars(cobj)
            if 'MembershipLevel' in cvars:
                print('%d "%s" "%s %s" %s' % (cobj.Id, cobj.MembershipLevel.Name, cobj.FirstName, cobj.LastName, cobj.Email))
        sys.exit(sys.exit_code_ok)
                
    if '--sm_member_levels' in options:
        # print spaceman members and exit
        for smu in sm_users.itertuples(index = True, name ='Pandas'):
            print('%-32.32s %s' % (smu.email_address,smu.member_type))
        sys.exit(sys.exit_code_ok)


    # showtime. move some people to levels
    for lvl in wa_levels:
        # collect actual wa levels
        wa_lvls_by_name[lvl.Name] = lvl.Id

    for cobj in wa_contacts:
        # collect dictionary to lookup wa ids by email
        cvars = vars(cobj)
        if 'MembershipLevel' in cvars:
            wa_member_id_by_email[cvars['Email']] = cvars['Id']

    for smu in sm_users.itertuples(index = True, name ='Pandas'):
        email_address = smu.email_address.lower().rstrip('.').strip()

        print(smu.family_primary_member_id)

        if smu.member_type == 'Family':

            lvl_id = wa_lvls_by_name['Key (family)']

            if email_address in wa_member_id_by_email:
                #rq = set_membershiplevel( wa_member_id_by_email[email_address],lvl_id)
                sys.stderr.write("Moving %s to %d..." % (email_address, lvl_id))
                if '--run' in options:
                    rq = set_membershiplevel(wa_member_id_by_email[email_address] ,lvl_id)
                else:
                    sys.stderr.write("Not really (say --run)\n")
            else:
                sys.stderr.write("%s not in wa. No action\n" % email_address)

            sys.stderr.write('\n')
            sys.stderr.flush()

    sys.exit(sys.exit_code_ok)

sys.stderr.write(usage)             
sys.exit(sys.exit_code_fail)
                

