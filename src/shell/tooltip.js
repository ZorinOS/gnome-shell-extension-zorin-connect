// SPDX-FileCopyrightText: Zorin Connect Developers https://github.com/ZorinOS/gnome-shell-extension-zorin-connect
//
// SPDX-License-Identifier: GPL-2.0-or-later

import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Pango from 'gi://Pango';
import St from 'gi://St';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {HAS_ST_ORIENTATION} from './utils.js';

/**
 * An StTooltip for ClutterActors
 *
 * Adapted from: https://github.com/RaphaelRochet/applications-overview-tooltip
 * See also: https://github.com/GNOME/gtk/blob/master/gtk/gtktooltip.c
 */
export let TOOLTIP_BROWSE_ID = 0;
export let TOOLTIP_BROWSE_MODE = false;

export default class Tooltip {

    constructor(params) {
        Object.assign(this, params);

        this._bin = null;
        this._hoverTimeoutId = 0;
        this._showing = false;

        this._destroyId = this.parent.connect(
            'destroy',
            this.destroy.bind(this)
        );

        this._hoverId = this.parent.connect(
            'notify::hover',
            this._onHover.bind(this)
        );

        this._buttonPressEventId = this.parent.connect(
            'button-press-event',
            this._hide.bind(this)
        );
    }

    get custom() {
        if (this._custom === undefined)
            this._custom = null;

        return this._custom;
    }

    set custom(actor) {
        this._custom = actor;
        this._markup = null;
        this._text = null;

        if (this._showing)
            this._show();
    }

    get gicon() {
        if (this._gicon === undefined)
            this._gicon = null;

        return this._gicon;
    }

    set gicon(gicon) {
        this._gicon = gicon;

        if (this._showing)
            this._show();
    }

    get icon() {
        return (this.gicon) ? this.gicon.name : null;
    }

    set icon(icon_name) {
        if (!icon_name)
            this.gicon = null;
        else
            this.gicon = new Gio.ThemedIcon({name: icon_name});
    }

    get markup() {
        if (this._markup === undefined)
            this._markup = null;

        return this._markup;
    }

    set markup(text) {
        this._markup = text;
        this._text = null;

        if (this._showing)
            this._show();
    }

    get text() {
        if (this._text === undefined)
            this._text = null;

        return this._text;
    }

    set text(text) {
        this._markup = null;
        this._text = text;

        if (this._showing)
            this._show();
    }

    get x_offset() {
        if (this._x_offset === undefined)
            this._x_offset = 0;

        return this._x_offset;
    }

    set x_offset(offset) {
        this._x_offset = (Number.isInteger(offset)) ? offset : 0;
    }

    get y_offset() {
        if (this._y_offset === undefined)
            this._y_offset = 0;

        return this._y_offset;
    }

    set y_offset(offset) {
        this._y_offset = (Number.isInteger(offset)) ? offset : 0;
    }

    _show() {
        if (this.text === null && this.markup === null)
            return this._hide();

        if (this._bin === null) {
            this._bin = new St.Bin({
                style_class: 'osd-window zorin-connect-tooltip',
                opacity: 232,
            });

            if (this.custom) {
                this._bin.child = this.custom;
            } else {
                if (HAS_ST_ORIENTATION) {
                    // GNOME 48
                    this._bin.child = new St.BoxLayout(
                        {orientation: Clutter.Orientation.HORIZONTAL}
                    );
                } else {
                    // GNOME 46/47
                    this._bin.child = new St.BoxLayout({vertical: false});
                }

                if (this.gicon) {
                    this._bin.child.icon = new St.Icon({
                        gicon: this.gicon,
                        y_align: St.Align.START,
                    });
                    this._bin.child.icon.set_y_align(Clutter.ActorAlign.START);
                    this._bin.child.add_child(this._bin.child.icon);
                }

                this.label = new St.Label({text: this.markup || this.text});
                this.label.clutter_text.line_wrap = true;
                this.label.clutter_text.line_wrap_mode = Pango.WrapMode.WORD;
                this.label.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
                this.label.clutter_text.use_markup = (this.markup);
                this._bin.child.add_child(this.label);
            }

            Main.layoutManager.addTopChrome(this._bin);
        } else if (this.custom) {
            this._bin.child = this.custom;
        } else {
            if (this._bin.child.icon)
                this._bin.child.icon.destroy();

            if (this.gicon) {
                this._bin.child.icon = new St.Icon({gicon: this.gicon});
                this._bin.child.insert_child_at_index(this._bin.child.icon, 0);
            }

            this.label.clutter_text.text = this.markup || this.text;
            this.label.clutter_text.use_markup = (this.markup);
        }

        // Position tooltip
        let [x, y] = this.parent.get_transformed_position();
        x = (x + (this.parent.width / 2)) - Math.round(this._bin.width / 2);

        x += this.x_offset;
        y += this.y_offset;

        // Show tooltip
        if (this._showing) {
            this._bin.ease({
                x: x,
                y: y,
                time: 0.15,
                transition: Clutter.AnimationMode.EASE_OUT_QUAD,
            });
        } else {
            this._bin.set_position(x, y);
            this._bin.ease({
                opacity: 232,
                time: 0.15,
                transition: Clutter.AnimationMode.EASE_OUT_QUAD,
            });

            this._showing = true;
        }

        // Enable browse mode
        TOOLTIP_BROWSE_MODE = true;

        if (TOOLTIP_BROWSE_ID) {
            GLib.source_remove(TOOLTIP_BROWSE_ID);
            TOOLTIP_BROWSE_ID = 0;
        }

        if (this._hoverTimeoutId) {
            GLib.source_remove(this._hoverTimeoutId);
            this._hoverTimeoutId = 0;
        }
    }

    _hide() {
        if (this._bin) {
            this._bin.ease({
                opacity: 0,
                time: 0.10,
                transition: Clutter.AnimationMode.EASE_OUT_QUAD,
                onComplete: () => {
                    Main.layoutManager.removeChrome(this._bin);

                    if (this.custom)
                        this._bin.remove_child(this.custom);

                    this._bin.destroy();
                    this._bin = null;
                },
            });
        }

        TOOLTIP_BROWSE_ID = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 500, () => {
            TOOLTIP_BROWSE_MODE = false;
            TOOLTIP_BROWSE_ID = 0;
            return false;
        });

        if (this._hoverTimeoutId) {
            GLib.source_remove(this._hoverTimeoutId);
            this._hoverTimeoutId = 0;
        }

        this._showing = false;
        this._hoverTimeoutId = 0;
    }

    _onHover() {
        if (this.parent.hover) {
            if (!this._hoverTimeoutId) {
                if (this._showing) {
                    this._show();
                } else {
                    this._hoverTimeoutId = GLib.timeout_add(
                        GLib.PRIORITY_DEFAULT,
                        (TOOLTIP_BROWSE_MODE) ? 60 : 500,
                        () => {
                            this._show();
                            this._hoverTimeoutId = 0;
                            return false;
                        }
                    );
                }
            }
        } else {
            this._hide();
        }
    }

    destroy() {
        this.parent.disconnect(this._destroyId);
        this.parent.disconnect(this._hoverId);
        this.parent.disconnect(this._buttonPressEventId);

        if (this.custom)
            this.custom.destroy();

        if (this._bin) {
            Main.layoutManager.removeChrome(this._bin);
            this._bin.destroy();
        }

        if (TOOLTIP_BROWSE_ID) {
            GLib.source_remove(TOOLTIP_BROWSE_ID);
            TOOLTIP_BROWSE_ID = 0;
        }

        if (this._hoverTimeoutId) {
            GLib.source_remove(this._hoverTimeoutId);
            this._hoverTimeoutId = 0;
        }
    }
}
