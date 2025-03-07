// SPDX-FileCopyrightText: Zorin Connect Developers https://github.com/ZorinOS/gnome-shell-extension-zorin-connect
//
// SPDX-License-Identifier: GPL-2.0-or-later

import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';

import Plugin from '../plugin.js';


export const Metadata = {
    label: _('Ping'),
    description: _('Send and receive pings'),
    id: 'org.gnome.Shell.Extensions.ZorinConnect.Plugin.Ping',
    incomingCapabilities: ['kdeconnect.ping'],
    outgoingCapabilities: ['kdeconnect.ping'],
    actions: {
        ping: {
            label: _('Ping'),
            icon_name: 'dialog-information-symbolic',

            parameter_type: new GLib.VariantType('s'),
            incoming: [],
            outgoing: ['kdeconnect.ping'],
        },
    },
};


/**
 * Ping Plugin
 * https://github.com/KDE/kdeconnect-kde/tree/master/plugins/ping
 */
const PingPlugin = GObject.registerClass({
    GTypeName: 'ZorinConnectPingPlugin',
}, class PingPlugin extends Plugin {

    _init(device) {
        super._init(device, 'ping');
    }

    handlePacket(packet) {
        // Notification
        const notif = {
            title: this.device.name,
            body: _('Ping'),
            icon: new Gio.ThemedIcon({name: `${this.device.icon_name}`}),
        };

        if (packet.body.message) {
            // TRANSLATORS: An optional message accompanying a ping, rarely if ever used
            // eg. Ping: A message sent with ping
            notif.body = _('Ping: %s').format(packet.body.message);
        }

        this.device.showNotification(notif);
    }

    ping(message = '') {
        const packet = {
            type: 'kdeconnect.ping',
            body: {},
        };

        if (message.length)
            packet.body.message = message;

        this.device.sendPacket(packet);
    }
});

export default PingPlugin;
