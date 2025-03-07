// SPDX-FileCopyrightText: Zorin Connect Developers https://github.com/ZorinOS/gnome-shell-extension-zorin-connect
//
// SPDX-License-Identifier: GPL-2.0-or-later

import GLib from 'gi://GLib';

import setup, {setupGettext} from '../utils/setup.js';


// Bootstrap
setup(GLib.path_get_dirname(GLib.path_get_dirname(GLib.filename_from_uri(import.meta.url)[0])));
setupGettext();
