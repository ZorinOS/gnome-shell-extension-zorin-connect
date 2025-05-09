// SPDX-FileCopyrightText: Zorin Connect Developers https://github.com/ZorinOS/gnome-shell-extension-zorin-connect
//
// SPDX-License-Identifier: GPL-2.0-or-later

import * as Utils from '../fixtures/utils.js';


describe('The presenter plugin', function () {
    let testRig;
    let localPlugin, remotePlugin;

    beforeAll(async function () {
        testRig = new Utils.TestRig();
        await testRig.prepare({
            localDevice: {
                incomingCapabilities: [
                    'kdeconnect.presenter',
                ],
                outgoingCapabilities: [
                    'kdeconnect.presenter',
                ],
            },
            remoteDevice: {
                incomingCapabilities: [
                    'kdeconnect.presenter',
                ],
                outgoingCapabilities: [
                    'kdeconnect.presenter',
                ],
            },
        });
        testRig.setPaired(true);
        testRig.setConnected(true);
    });

    afterAll(function () {
        testRig.destroy();
    });

    beforeEach(function () {
        if (remotePlugin) {
            spyOn(remotePlugin, 'handlePacket').and.callThrough();
            spyOn(remotePlugin._input, 'movePointer');
        }
    });

    it('can be loaded', async function () {
        await testRig.loadPlugins();

        localPlugin = testRig.localDevice._plugins.get('presenter');
        remotePlugin = testRig.remoteDevice._plugins.get('presenter');

        expect(localPlugin).toBeDefined();
        expect(remotePlugin).toBeDefined();
    });

    it('can receive presentation commands', async function () {
        localPlugin.device.sendPacket({
            type: 'kdeconnect.presenter',
            body: {
                dx: 0.1,
                dy: 0.1,
            },
        });

        await remotePlugin.awaitPacket('kdeconnect.presenter', {
            dx: 0.1,
            dy: 0.1,
        });

        expect(remotePlugin._input.movePointer).toHaveBeenCalledWith(100, 100);
    });
});

