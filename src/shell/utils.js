// SPDX-FileCopyrightText: Zorin Connect Developers https://github.com/ZorinOS/gnome-shell-extension-zorin-connect
//
// SPDX-License-Identifier: GPL-2.0-or-later

import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import St from 'gi://St';

import {PACKAGE_VERSION} from 'resource:///org/gnome/shell/misc/config.js';


export const SHELL_MAJOR_VERSION = Number(PACKAGE_VERSION.split('.')[0]);

export const HAS_ST_ORIENTATION = SHELL_MAJOR_VERSION >= 48;
export const HAS_MESSAGELIST_NOTIFICATIONMESSAGE = SHELL_MAJOR_VERSION >= 48;

/**
 * Get a themed icon, using fallbacks from Zorin Connect's GResource when necessary.
 *
 * @param {string} name - A themed icon name
 * @returns {Gio.Icon} A themed icon
 */
export function getIcon(name) {
    if (getIcon._resource === undefined) {
        // Setup the desktop icons
        const settings = St.Settings.get();
        getIcon._desktop = new Gtk.IconTheme();
        getIcon._desktop.set_theme_name(settings.gtk_icon_theme);
        settings.connect('notify::gtk-icon-theme', (settings_, key_) => {
            getIcon._desktop.set_theme_name(settings_.gtk_icon_theme);
        });

        // Preload our fallbacks
        const iconPath = 'resource://org.gnome.Shell.Extensions.ZorinConnect/icons';
        const iconNames = [
            'org.gnome.Shell.Extensions.ZorinConnect',
            'org.gnome.Shell.Extensions.ZorinConnect-symbolic',
            'computer-symbolic',
            'laptop-symbolic',
            'smartphone-symbolic',
            'tablet-symbolic',
            'tv-symbolic',
            'phonelink-ring-symbolic',
            'sms-symbolic',
        ];

        getIcon._resource = {};

        for (const iconName of iconNames) {
            getIcon._resource[iconName] = new Gio.FileIcon({
                file: Gio.File.new_for_uri(`${iconPath}/${iconName}.svg`),
            });
        }
    }

    // Check the desktop icon theme
    if (getIcon._desktop.has_icon(name))
        return new Gio.ThemedIcon({name: name});

    // Check our GResource
    if (getIcon._resource[name] !== undefined)
        return getIcon._resource[name];

    // Fallback to hoping it's in the theme somewhere
    return new Gio.ThemedIcon({name: name});
}
