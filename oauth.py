"""
oauth

    implements wildapricot-flavored oauth2 protocol

"""
import json
from rauth import OAuth1Service, OAuth2Service
from flask import current_app, url_for, request, redirect, session
import sys
from pprint import pprint
import base64
import pdb
import os

class OAuthSignIn(object):
    providers = None

    def __init__(self, provider_name):
        self.provider_name = provider_name
        credentials = current_app.config['OAUTH_CREDENTIALS'][provider_name]
        self.consumer_id = credentials['id']
        self.consumer_secret = credentials['secret']

    def authorize(self):
        pass

    def callback(self):
        pass

    def get_callback_url(self):
        # since we are running behind a proxy this doesn't work
        #return url_for('oauth_callback', provider=self.provider_name, _external=True)
        return os.environ['OAUTH_REDIRECT_URL']

    @classmethod
    def get_provider(self, provider_name):
        if self.providers is None:
            self.providers = {}
            for provider_class in self.__subclasses__():
                provider = provider_class()
                self.providers[provider.provider_name] = provider
        return self.providers[provider_name]


class WildApricotSignIn(OAuthSignIn):
    def __init__(self):
        super(WildApricotSignIn, self).__init__('wildapricot')
        self.service = OAuth2Service(
            name             = 'wildapricot',
            client_id        = self.consumer_id,
            client_secret    = self.consumer_secret,
            authorize_url    = os.environ['OAUTH_AUTHORIZE_URL'],
            access_token_url = 'https://oauth.wildapricot.org/auth/token',
            base_url         = 'https://api.wildapricot.org/v2/'
        )


    def authorize(self):
        return redirect(self.service.get_authorize_url(
            scope         = 'auto',
            response_type = 'code',
            redirect_uri  = self.get_callback_url())
        )

    def callback(self):
        def decode_json(payload):
            return json.loads(payload.decode('utf-8'))


        if 'code' not in request.args:
            return None, None, None

        sys.stderr.write("oauth callback() --------------------------------------\n")
        secret_str = base64.standard_b64encode((self.consumer_id + ':' + self.consumer_secret).encode()).decode()

        oauth_session = self.service.get_auth_session(
            data={
                  'grant_type'   : 'authorization_code',
                  'code'         : request.args['code'],
                  'client_id'    : self.consumer_id,
                  'scope'        : 'auto',
                  'redirect_uri' : self.get_callback_url()
                  },

            headers={'Authorization':'Basic ' + secret_str,
                     'ContentType': 'application/x-www-form-urlencoded'},
            decoder=decode_json

        )

        account = current_app.config['OAUTH_CREDENTIALS'][self.provider_name]['account']
        me = oauth_session.get('Accounts/' + account + '/contacts/me').json()

        sys.stderr.write("oauth callback()  access_token: [%s]\n" % oauth_session.access_token)
        sys.stderr.write("--------------------------------------\n")

        return (me,oauth_session)

