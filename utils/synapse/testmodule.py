#
# Python3 Module for matrix-synapse
#

from typing import Awaitable, Callable, Optional, Tuple
import logging

import synapse
from synapse import module_api

logger = logging.getLogger(__name__)


class MyAuthProvider:
    def __init__(self, config: dict, api: module_api):
        self.api = api
        if 'ppfunurl' not in config:
            raise Exception('Pixelplanet ppfunurl not configured')
        self.ppfunurl = config["ppfunurl"]
        if 'apisocketkey' not in config:
            raise Exception('Pixelplanet apisocketkey not configured')
        self.apisocketkey = config["apisocketkey"]

        self.credentials = {
            "bob": "building",
            "@scoop:matrix.org": "digging",
        }

        api.register_password_auth_provider_callbacks(
            check_3pid_auth = self.check_3pid_pass,
            auth_checkers = {
                ("m.login.password", ("password",)): self.check_pass,
            },
        )

    async def check_credentials(
        self,
        query,
    ) -> Optional[
        Tuple[
            int,
            str,
            Optional[str]
        ]
    ]:
        try:
            resp = await self.api.http_client.post_json_get_json(
                self.ppfunurl + '/adminapi/checklogin',
                query,
                [[ "authorization", ['Bearer ' + self.apisocketkey] ]],
            )
            if not resp["success"]:
                raise Exception(resp["errors"][0])
            userdata = resp['userdata']
            return (userdata['id'], userdata['name'], userdata['email'])
        except Exception as e:
            logger.warning('Could not login via ppfun: %s', e)
            return None

    async def login(
        self,
        ppfun_id,
        ppfun_name,
        ppfun_email,
    ) -> Optional[
        Tuple[
            str,
            Optional[Callable[["synapse.module_api.LoginResponse"], Awaitable[None]]],
        ]
    ]:
        localpart = f'pp_{ppfun_id}'
        user_id = self.api.get_qualified_user_id(localpart)
        logger.info('check if user %s exists', user_id)
        does_exist = await self.api.check_user_exists(user_id)
        if does_exist is None:
            logger.info('User %s does not exist yet, registering new user', user_id)
            emails = None
            if ppfun_email:
                emails = [ppfun_email]
            try:
                user_id = await self.api.register_user(localpart, ppfun_name, emails)
            except Exception as e:
                logger.warning('Could not create user %s, because %s', user_id, e)
                return None
        logger.info('User %s logged in via ppfun %s', user_id, ppfun_name)
        return user_id, None

    async def check_3pid_pass(
        self,
        medium: str,
        address: str,
        password: str,
    ) -> Optional[
        Tuple[
            str,
            Optional[Callable[["synapse.module_api.LoginResponse"], Awaitable[None]]],
        ]
    ]:
        if medium != "email" or not address:
            return None
        ppfun_userdata = await self.check_credentials({
            "email": address,
            "password": password
        })
        if ppfun_userdata is not None:
            logger.info('User %s logging in with ppfun credentials', ppfun_userdata)
            ret = await self.login(*ppfun_userdata)
            return ret
        return None

    async def check_pass(
        self,
        username: str,
        login_type: str,
        login_dict: "synapse.module_api.JsonDict",
    ) -> Optional[
        Tuple[
            str,
            Optional[Callable[["synapse.module_api.LoginResponse"], Awaitable[None]]],
        ]
    ]:
        if login_type != "m.login.password":
            return None

        query = {
            "password": login_dict.get('password')
        }
        if username.startswith('@pp_'):
            query['id'] = username[4: username.index(':')]
        elif username.startswith('pp_') and username.endswith(f':{self.api._server_name}'):
            query['id'] = username[3: username.index(':')]
        else:
            query['name'] = username

        ppfun_userdata = await self.check_credentials(query)

        if ppfun_userdata is not None:
            logger.info('User %s logging in with ppfun credentials', ppfun_userdata)
            ret = await self.login(*ppfun_userdata)
            return ret
        return None
