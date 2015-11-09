# @pasta/console

pasta console page

Users can write code and get visual output on this page.

## Future plan

### Split module into client and server modules

Currently, Console page is in charge of authentication, code of which should be hidden from users.

This module contains both client and server code, so there is a possibility to transfer server side code to users unintentionally.
