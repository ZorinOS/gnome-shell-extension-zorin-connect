// SPDX-FileCopyrightText: Zorin Connect Developers https://github.com/ZorinOS/gnome-shell-extension-zorin-connect
//
// SPDX-License-Identifier: GPL-2.0-or-later

'use strict';

const {Gio, GLib, Adw} = imports.gi;

// Bootstrap
const Extension = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Extension.imports.shell.utils;

function init() {
    Utils.installService();
}

function fillPreferencesWindow(window) {
    const widget = new Adw.PreferencesPage();
    window.add(widget);

    GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
        window.close();
    });

    Gio.Subprocess.new([`${Extension.path}/zorin-connect-preferences`], 0);
}

