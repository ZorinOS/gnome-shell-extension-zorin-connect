// SPDX-FileCopyrightText: Zorin Connect Developers https://github.com/ZorinOS/gnome-shell-extension-zorin-connect
//
// SPDX-License-Identifier: GPL-2.0-or-later

import Gio from 'gi://Gio';

import Config from '../config.js';

export class LockscreenRemoteAccess {

    constructor() {
        this._inhibitor = null;
        this._settings = new Gio.Settings({
            settings_schema: Config.GSCHEMA.lookup(
                'org.gnome.Shell.Extensions.ZorinConnect',
                null
            ),
            path: '/org/gnome/shell/extensions/zorin-connect/',
        });
    }

    patchInhibitor() {
        if (this._inhibitor)
            return;

        if (this._settings.get_boolean('keep-alive-when-locked')) {
            this._inhibitor = global.backend.get_remote_access_controller().inhibit_remote_access;
            global.backend.get_remote_access_controller().inhibit_remote_access = () => {};
        }
    }

    unpatchInhibitor() {
        if (!this._inhibitor)
            return;
        global.backend.get_remote_access_controller().inhibit_remote_access = this._inhibitor;
        this._inhibitor = null;
    }
}
