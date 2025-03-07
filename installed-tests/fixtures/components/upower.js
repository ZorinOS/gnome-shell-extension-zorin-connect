// SPDX-FileCopyrightText: Zorin Connect Developers https://github.com/ZorinOS/gnome-shell-extension-zorin-connect
//
// SPDX-License-Identifier: GPL-2.0-or-later

import GObject from 'gi://GObject';


const Component = GObject.registerClass({
    GTypeName: 'ZorinConnectMockBattery',
    Signals: {
        'changed': {flags: GObject.SignalFlags.RUN_FIRST},
    },
}, class MockBattery extends GObject.Object {

    get charging() {
        if (this._charging === undefined)
            this._charging = false;

        return this._charging;
    }

    get is_present() {
        if (this._is_present === undefined)
            this._is_present = true;

        return this._is_present;
    }

    get level() {
        if (this._level === undefined)
            this._level = -1;

        return this._level;
    }

    get threshold() {
        if (this._threshold === undefined)
            this._threshold = 0;

        return this._threshold;
    }

    update(obj) {
        for (const [propertyName, propertyValue] of Object.entries(obj))
            this[`_${propertyName}`] = propertyValue;

        this.emit('changed');
    }
});

export default Component;

