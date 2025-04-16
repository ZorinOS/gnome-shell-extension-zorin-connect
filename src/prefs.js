// SPDX-FileCopyrightText: Zorin Connect Developers https://github.com/ZorinOS/gnome-shell-extension-zorin-connect
//
// SPDX-License-Identifier: GPL-2.0-or-later

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Adw from 'gi://Adw';

// Bootstrap
import * as Setup from './utils/setup.js';
import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class ZorinConnectExtensionPreferences extends ExtensionPreferences {
    constructor(metadata) {
        super(metadata);
        Setup.setup(this.path);
        Setup.ensurePermissions();
        Setup.installService();
    }

    fillPreferencesWindow(window) {
        const widget = new Adw.PreferencesPage();
        window.add(widget);

        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
            window.close();
        });

        Gio.Subprocess.new([`${this.path}/zorin-connect-preferences`], 0);
    }
}

