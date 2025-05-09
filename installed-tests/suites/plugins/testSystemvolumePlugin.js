// SPDX-FileCopyrightText: Zorin Connect Developers https://github.com/ZorinOS/gnome-shell-extension-zorin-connect
//
// SPDX-License-Identifier: GPL-2.0-or-later

import * as Utils from '../fixtures/utils.js';


/**
 * Mocked packet handling for the test device
 *
 * @param {*} packet - a KDE Connect protocol packet
 */
function handlePacket(packet) {
    switch (packet.type) {
        case 'kdeconnect.systemvolume':
            break;

        case 'kdeconnect.systemvolume.request':
            break;
    }
}


describe('The systemvolume plugin', function () {
    let testRig;
    let localPlugin;
    let remoteDevice;

    beforeAll(async function () {
        await Utils.mockComponents();

        testRig = new Utils.TestRig();
        await testRig.prepare({
            localDevice: {
                incomingCapabilities: [
                    'kdeconnect.systemvolume',
                    'kdeconnect.systemvolume.request',
                ],
                outgoingCapabilities: [
                    'kdeconnect.systemvolume',
                    'kdeconnect.systemvolume.request',
                ],
            },
            remoteDevice: {
                incomingCapabilities: [
                    'kdeconnect.systemvolume',
                    'kdeconnect.systemvolume.request',
                ],
                outgoingCapabilities: [
                    'kdeconnect.systemvolume',
                    'kdeconnect.systemvolume.request',
                ],
            },
        });
        testRig.setPaired(true);
        testRig.setConnected(true);

        remoteDevice = testRig.remoteDevice;
        remoteDevice.handlePacket = handlePacket.bind(remoteDevice);
    });

    afterAll(function () {
        testRig.destroy();
    });

    beforeEach(function () {
        if (localPlugin)
            spyOn(localPlugin, 'handlePacket').and.callThrough();
    });

    it('can be loaded', async function () {
        await testRig.loadPlugins();

        localPlugin = testRig.localDevice._plugins.get('systemvolume');

        expect(localPlugin).toBeDefined();
    });

    it('sends a list of streams when requested', async function () {
        spyOn(remoteDevice, 'handlePacket').and.callThrough();

        remoteDevice.sendPacket({
            type: 'kdeconnect.systemvolume.request',
            body: {
                requestSinks: true,
            },
        });

        await localPlugin.awaitPacket('kdeconnect.systemvolume.request', {
            requestSinks: true,
        });

        await remoteDevice.awaitPacket('kdeconnect.systemvolume');
    });

    it('handles volume level requests', async function () {
        remoteDevice.sendPacket({
            type: 'kdeconnect.systemvolume.request',
            body: {
                name: '0',
                volume: 2,
            },
        });

        await localPlugin.awaitPacket('kdeconnect.systemvolume.request', {
            name: '0',
            volume: 2,
        });

        expect(localPlugin._mixer.lookup_sink(0).volume).toBe(2);
    });

    it('handles mute requests', async function () {
        remoteDevice.sendPacket({
            type: 'kdeconnect.systemvolume.request',
            body: {
                name: '0',
                muted: true,
            },
        });

        await localPlugin.awaitPacket('kdeconnect.systemvolume.request', {
            name: '0',
            muted: true,
        });

        expect(localPlugin._mixer.lookup_sink(0).muted).toBeTrue();
    });
});
