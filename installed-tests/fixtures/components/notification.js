// SPDX-FileCopyrightText: Zorin Connect Developers https://github.com/ZorinOS/gnome-shell-extension-zorin-connect
//
// SPDX-License-Identifier: GPL-2.0-or-later

import GLib from 'gi://GLib';
import GObject from 'gi://GObject';


const Component = GObject.registerClass({
    GTypeName: 'ZorinConnectMockNotificationListener',
    Signals: {
        'notification-added': {
            flags: GObject.SignalFlags.RUN_LAST,
            param_types: [GLib.Variant.$gtype],
        },
    },
}, class MockListener extends GObject.Object {

    fakeNotification(notif) {
        const variant = GLib.Variant.full_pack(notif);
        this.emit('notification-added', variant);
    }
});

export default Component;

